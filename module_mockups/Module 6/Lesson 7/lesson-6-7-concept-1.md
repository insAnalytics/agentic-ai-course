# Module 6, Lesson 7 — Concept 1: A dry run before the action

---

## The call says what to do, not what will happen

[Module 3's gate](→ Module 3, designing for least privilege lesson, separate reads from writes and gate the writes concept)
puts a person between the agent and a write, and
[its idempotency keys](→ Module 3, tools that call the outside world lesson, which failures to retry and how concept, the "retrying a write can do it twice" subsection)
make a repeated write harmless. Neither answers a simpler question: what
will this action actually change? A tool call names an intent, "move the
agents matching `research` to `claude-sonnet`", and what it changes depends
on the state it meets. The same call can touch one record or twenty.

A **dry run** answers that question before anything changes. The tool works
out exactly what it would do and returns that as a plan, without doing it.
This is how infrastructure tools already work. Terraform's
[`plan` command](https://developer.hashicorp.com/terraform/cli/commands/plan)
reads the current state, works out the changes needed, and shows them
without carrying them out, so they can be checked against what was
expected, or reviewed by a team, before `apply` makes them.

---

## A preview that shows the problem

Here's a bulk tool with a dry-run mode. The user asked to move
`research_agent`; the model called the tool with a looser match:

```python
registry = {
    "research_agent": {"model": "claude-legacy", "tier": "standard"},
    "research_summary_agent": {"model": "claude-legacy", "tier": "priority"},
    "notes_agent": {"model": "claude-legacy", "tier": "standard"},
}


def set_models(match: str, model: str, dry_run: bool = True) -> list[dict]:
    """Move every agent whose name contains `match` onto `model`. With dry_run, change nothing and
    return the changes it would make."""
    plan = [{"agent": name, "field": "model", "before": record["model"], "after": model}
            for name, record in registry.items() if match in name and record["model"] != model]
    if not dry_run:
        apply_plan(plan)
    return plan


def apply_plan(plan: list[dict]) -> None:
    """Apply exactly these changes, refusing if any record no longer holds the value the plan saw."""
    stale = [c["agent"] for c in plan if registry[c["agent"]][c["field"]] != c["before"]]
    if stale:
        raise RuntimeError(f"state changed since the preview, for {stale}: preview again")
    for change in plan:
        registry[change["agent"]][change["field"]] = change["after"]


# the user asked to move research_agent; the model called the bulk tool with a loose match
preview = set_models("research", "claude-sonnet", dry_run=True)
for change in preview:
    print(f"would change {change['agent']}: {change['field']} {change['before']} -> {change['after']}")
print("registry untouched:", {name: r["model"] for name, r in registry.items()})
```
```
would change research_agent: model claude-legacy -> claude-sonnet
would change research_summary_agent: model claude-legacy -> claude-sonnet
registry untouched: {'research_agent': 'claude-legacy', 'research_summary_agent': 'claude-legacy', 'notes_agent': 'claude-legacy'}
```
*(runs live, shows output — read-only demo snippet, not graded. The
registry is an in-memory stand-in, and the model's call is scripted.)*

The call is well-formed, uses a real model, and would pass
[Module 3's argument validation](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept).
The preview shows what the call doesn't: `research_summary_agent` also
matches, and it's not what the user asked for. Nothing has changed yet, so
catching it costs nothing.

The preview is also what a person approving the action should see. An
approval that shows the call, `set_models("research", "claude-sonnet")`,
asks them to work out its effect in their head. An approval that shows the
two changes asks them to confirm something they can read.

---

## Apply what was checked

A preview is a snapshot, and state can change between the preview and the
action. Terraform's documentation makes the same point about automated
pipelines: applying a saved plan ensures only the previewed changes are
made. The equivalent for a tool is to apply the plan itself, and to refuse if
any record no longer holds the value the plan saw:

```python
plan = set_models("research_agent", "claude-sonnet", dry_run=True)
print("checked plan:", plan)

# meanwhile, someone else moves research_agent to claude-haiku
registry["research_agent"]["model"] = "claude-haiku"
try:
    apply_plan(plan)
except RuntimeError as error:
    print("refused:", error)
print("registry now:", {name: r["model"] for name, r in registry.items()})
```
```
checked plan: [{'agent': 'research_agent', 'field': 'model', 'before': 'claude-legacy', 'after': 'claude-sonnet'}]
refused: state changed since the preview, for ['research_agent']: preview again
registry now: {'research_agent': 'claude-haiku', 'research_summary_agent': 'claude-legacy', 'notes_agent': 'claude-legacy'}
```
*(runs live, shows output — read-only demo snippet, not graded.)*

Someone else moved `research_agent` between the preview and the apply, so
the plan's "before" value no longer matched and nothing was changed. The
agent previews again and rechecks, instead of overwriting a change it never
saw. Databases call this compare-and-set: write only if the current value is
still the one you read.

---

## Checking the preview in code

A person can read a preview, but code can check most of it first. The plan
is structured data, so the agent can compare it with what the user asked for:
which records, which field, which new value. The exercise builds that check.

---

## Applied sandbox exercise
*(graded — checking a dry run's plan against the request)*

**Task shown to learner:** Write `check_preview(plan, intended)`. Each change
in `plan` is a dict with `"agent"`, `"field"`, `"before"` and `"after"`.
`intended` holds `"agents"` (a list), `"field"` and `"value"`. Return a dict
with three sorted lists:

- `"unexpected"`: agents the plan changes that weren't asked for
- `"missing"`: agents that were asked for but the plan doesn't change
- `"wrong_change"`: agents that were asked for, whose change sets a
  different field, or ends at a different value, from the one intended

`is_safe(report)`, already written, treats any non-empty list as unsafe.

**Starter code:**
```python
def check_preview(plan: list[dict], intended: dict) -> dict:
    """Compare a dry run's planned changes with what the user asked for. intended holds "agents" (the
    agents to change), "field" and "value". Each list in the result is sorted."""
    ...



def is_safe(report: dict) -> bool:
    return not any(report.values())


preview = [{"agent": "research_agent", "field": "model", "before": "claude-legacy", "after": "claude-sonnet"},
           {"agent": "research_summary_agent", "field": "model", "before": "claude-legacy", "after": "claude-sonnet"}]
report = check_preview(preview, {"agents": ["research_agent"], "field": "model", "value": "claude-sonnet"})
print(report, "safe" if report is not None and is_safe(report) else "not safe")
```

**Hidden tests:**
```python
def change(agent, field="model", before="claude-legacy", after="claude-sonnet"):
    return {"agent": agent, "field": field, "before": before, "after": after}


intended = {"agents": ["research_agent"], "field": "model", "value": "claude-sonnet"}
r = check_preview([change("research_agent")], intended)
assert r == {"unexpected": [], "missing": [], "wrong_change": []}, f"exactly what was asked: nothing to report; got {r}"
assert is_safe(r), "an empty report is safe"

r = check_preview([change("research_summary_agent"), change("research_agent")], intended)
assert r["unexpected"] == ["research_summary_agent"], (
    f"unexpected {r['unexpected']}: the plan changes an agent nobody asked about")
assert not is_safe(r), "an unexpected change makes the plan unsafe"

r = check_preview([], intended)
assert r["missing"] == ["research_agent"], f"missing {r['missing']}: the plan doesn't touch the agent that was asked for"
assert not is_safe(r), "a plan that misses an intended agent isn't safe to apply as the answer to the request"

r = check_preview([change("research_agent", after="claude-opus")], intended)
assert r["wrong_change"] == ["research_agent"], (
    f"wrong_change {r['wrong_change']}: the right agent, but moved to claude-opus, not claude-sonnet")
r = check_preview([change("research_agent", field="tier", before="standard", after="claude-sonnet")], intended)
assert r["wrong_change"] == ["research_agent"], f"wrong_change {r['wrong_change']}: the right agent, but the wrong field"
r = check_preview([change("research_agent", before="claude-sonnet", after="claude-sonnet")], intended)
assert r == {"unexpected": [], "missing": [], "wrong_change": []}, (
    f"got {r}: the 'after' value is what matters; a change that ends at the intended value is right")

two = {"agents": ["notes_agent", "billing_agent"], "field": "model", "value": "claude-haiku"}
r = check_preview([change("zeta_agent", after="claude-haiku"), change("notes_agent", after="claude-sonnet"),
                   change("alpha_agent", after="claude-opus")], two)
assert r == {"unexpected": ["alpha_agent", "zeta_agent"], "missing": ["billing_agent"], "wrong_change": ["notes_agent"]}, (
    f"got {r}: every list is sorted; unexpected agents are reported as unexpected, not checked for their values")

names = [f"{letter}_agent" for letter in "hgfedcba"]
r = check_preview([change(name) for name in names], intended)
assert r["unexpected"] == sorted(names), f"unexpected {r['unexpected']}: sort each list, so the report is the same every run"
```

**Hint (shown on request):** Sets make the first two lists one line each:
the planned agents minus the wanted ones, and the other way round. For the
third, check each planned change for a wanted agent, comparing its `"field"`
and its `"after"` value with the intent.

**Reference solution:**
```python
def check_preview(plan: list[dict], intended: dict) -> dict:
    """Compare a dry run's planned changes with what the user asked for. intended holds "agents" (the
    agents to change), "field" and "value". Each list in the result is sorted."""
    wanted = set(intended["agents"])
    planned = {change["agent"] for change in plan}
    wrong = {change["agent"] for change in plan
             if change["agent"] in wanted and (change["field"] != intended["field"] or change["after"] != intended["value"])}
    return {"unexpected": sorted(planned - wanted), "missing": sorted(wanted - planned), "wrong_change": sorted(wrong)}


def is_safe(report: dict) -> bool:
    return not any(report.values())
```
```
{'unexpected': ['research_summary_agent'], 'missing': [], 'wrong_change': []} not safe
```
*(the starter's printout, with the reference in place)*

**Explanation:** Each list catches a different mistake. An unexpected agent
is the loose match from the demo. A missing agent is a plan that won't do
what was asked, perhaps because the match missed, or because the agent
already has the value; either way, it's worth knowing before reporting
success. A wrong change is the right record changed the wrong way. Only the
`"after"` value is compared with the intent, since that's what the record
will hold; the `"before"` value belongs to the stale-plan check. Sorting
makes the report the same on every run, which matters once it's shown to a
person or logged.

---

## Quiz cards

> **Q1.** Why isn't argument validation enough before a bulk change?
> - A) Because validation can't read the tool's name
> - B) A valid call can still change more than intended ✅
> - C) Because bulk tools always skip validation
> - D) Because validation only runs after the change
>
> *Explanation: a loose match is a valid argument. What it does depends on
> the state it meets, and the dry run is what shows that.*

> **Q2.** What should a person approving a write be shown?
> - A) The tool call's arguments, exactly as written
> - B) The changes the dry run says it will make ✅
> - C) The model's reasoning for making the call
> - D) Nothing at all, if the agent is confident
>
> *Explanation: arguments ask the approver to work out the effect; the plan
> shows it. An approval is only as good as what the approver can check.*

> **Q3.** Between the preview and the apply, someone changes a record the
> plan touches. What should happen?
> - A) Apply the plan anyway, since it was approved
> - B) Refuse, preview again, and recheck ✅
> - C) Apply only the unchanged records, silently
> - D) Retry the apply until it eventually succeeds
>
> *Explanation: the plan was checked against a state that no longer exists.
> Applying it would overwrite a change nobody saw; compare-and-set refuses,
> and a fresh preview gets rechecked.*

> **Q4.** A dry run's plan doesn't include an agent the user asked to change.
> Why report it rather than ignore it?
> - A) Because the tool must be broken if it happens
> - B) The action won't do all that was asked ✅
> - C) Because missing agents must always be retried
> - D) Because every plan must list every agent
>
> *Explanation: the agent may already have the value, or the match may have
> missed it. Either way, the report should reflect it before anyone says the
> request is done.*

---

*(End of this concept. The next concept checks, after the action, that it
actually took effect.)*
