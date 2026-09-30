# Module 6, Lesson 7 — Bookends: Actions that mustn't go wrong

---

## Intro

> **You'll be able to**
> - Preview an action with a dry run, check the preview against the request in code, and apply only what was checked
> - Read the result back to confirm an action took effect, and undo earlier steps with compensations when a later one fails
> - Check the agent's report of what it did against its log, so it never claims an action that didn't happen

**Why it matters**
Everything before this lesson was about getting answers right. This one is
about actions, where a mistake isn't a wrong sentence but a changed record, a
sent message or a spent budget. Module 3 made writes safe to retry and put a
person in front of the risky ones. This lesson adds the checks around the
action itself: before it, what will it change; after it, did it happen;
when a later step fails, how to put things back; and at the end, whether the
agent's account matches what it did.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** A bulk tool's dry run shows it would change two agents, but the
> user asked about one. What should happen?
> - A) Apply it, since the call itself was valid
> - B) Refuse before changing anything ✅
> - C) Apply it, then undo the extra change afterwards
> - D) Ask the model to explain why it planned that
>
> *Explanation: the preview exists to catch this before it costs anything.
> Nothing has changed yet, so refusing is free.*

> **Q2.** Between the dry run and the apply, another process changes a
> record in the plan. What should the apply do?
> - A) Overwrite it, since the plan was approved
> - B) Refuse, so the agent previews again ✅
> - C) Skip that one record, silently
> - D) Retry the apply until it succeeds
>
> *Explanation: the plan was checked against a state that no longer exists.
> Compare-and-set refuses rather than overwrite a change nobody saw.*

> **Q3.** A write replies "ok", but reading back straight away shows the old
> value. What's the sound next step?
> - A) Report success, since the write replied ok
> - B) Re-read a few times, a short wait apart ✅
> - C) Retry the write immediately, just in case
> - D) Report failure to the user immediately
>
> *Explanation: an eventually consistent store may take a moment. A bounded
> re-read allows for that; if it still isn't there, the step failed.*

> **Q4.** Step 1 moved an agent to the priority tier; step 2 failed. What
> does a saga do?
> - A) Retries step 2 until it eventually works
> - B) Runs step 1's compensation, moving it back ✅
> - C) Leaves the agent on priority and reports success
> - D) Runs step 2's compensation, since it failed
>
> *Explanation: compensations run for the steps that completed, newest
> first. The failed step has nothing to undo.*

> **Q5.** Why should a step that sends an email come last in a saga?
> - A) Because sending an email is slow
> - B) A sent email can only be corrected ✅
> - C) Because sending an email never fails
> - D) Because its compensation is to unsend it
>
> *Explanation: put the steps that can't be undone after every step that
> can still fail, so they run only when everything else has succeeded.*

> **Q6.** What did Advani find about model judges and false success?
> - A) Judges caught nearly every false success
> - B) Confident wording fooled them: AUROC ≤ 0.65 ✅
> - C) Judges flagged every single report as false
> - D) Judges did better than the code-based checks
>
> *Explanation: false success sounds exactly like success. Checking the
> report against the log, or the state, sidesteps the wording.*

> **Q7.** The log shows a successful `set_model` call for `research_agent`.
> The report says "I migrated notes_agent". Is the claim supported?
> - A) Yes, since a set_model call succeeded
> - B) No, the call's arguments don't match ✅
> - C) Yes, as long as the report is confident
> - D) Only if notes_agent exists in the registry
>
> *Explanation: a supporting call must be the right tool, have succeeded,
> and match the arguments the claim names.*

---

## Comprehensive sandbox
*(graded — a migration that can't silently go wrong, multi-file)*

**Task shown to learner:** `lib.py` holds this lesson's checks, `check_preview`,
`is_safe`, `confirm`, `run_saga` and `unsupported_claims`, and a stand-in
`Registry` that logs every action and can be told to fail. It's read-only. In
`workflow.py` (the entry file), write `migrate(registry, match, agent, model,
team)`, which moves one agent onto a new model and tells its team:

1. **Dry run:** get the plan with `registry.plan_set_model(match, model)` and
   check it with `check_preview` against the one agent requested. If it isn't
   safe, change nothing and return status `"refused"`.
2. **Saga:** run three steps with `run_saga`: apply the plan (compensated by
   `registry.restore(plan)`), read back and confirm the change (raising if
   `confirm` finds anything not applied or overwritten), then notify the
   team. The read-back comes before the notification, so the team is never
   told about a change that didn't happen.
3. **Report:** if a step failed, status `"rolled_back"`, with a report that
   says what failed and that the agent is unchanged; otherwise status
   `"done"`. Either way, return `"unsupported"`: what `unsupported_claims`
   finds in your report against `registry.log`. It must be empty: the
   report may only claim what the log shows.

When you click Run, the code at the bottom tries four scenarios.

**Tab: `lib.py`** (read-only)
```python
"""This lesson's checks, and a stand-in registry that records every action in a log. Read-only."""
import re


class Registry:
    """An in-memory registry. Actions are logged as {"tool", "input", "ok"}; the flags make things go wrong."""

    def __init__(self, records: dict, fail_notify: bool = False, lose_writes: bool = False):
        self.records = {name: dict(record) for name, record in records.items()}
        self.fail_notify, self.lose_writes = fail_notify, lose_writes
        self.log = []

    def plan_set_model(self, match: str, model: str) -> list[dict]:
        """Dry run: the changes moving every agent whose name contains `match` would make. Changes nothing."""
        return [{"agent": name, "field": "model", "before": record["model"], "after": model}
                for name, record in self.records.items() if match in name and record["model"] != model]

    def apply_plan(self, plan: list[dict]) -> None:
        stale = [c["agent"] for c in plan if self.records[c["agent"]][c["field"]] != c["before"]]
        if stale:
            raise RuntimeError(f"state changed since the preview: {stale}")
        for change in plan:
            if not self.lose_writes:
                self.records[change["agent"]][change["field"]] = change["after"]
            self.log.append({"tool": "set_model", "input": {"agent_name": change["agent"], "model": change["after"]}, "ok": True})

    def restore(self, plan: list[dict]) -> None:
        for change in plan:
            self.records[change["agent"]][change["field"]] = change["before"]
            self.log.append({"tool": "set_model", "input": {"agent_name": change["agent"], "model": change["before"]}, "ok": True})

    def notify(self, team: str, message: str) -> None:
        ok = not self.fail_notify
        self.log.append({"tool": "notify", "input": {"team": team, "message": message}, "ok": ok})
        if not ok:
            raise ConnectionError("notification service unavailable")

    def read(self, agent: str) -> dict:
        return dict(self.records.get(agent, {}))


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


def confirm(plan: list[dict], current: dict) -> dict:
    """Compare each planned change with the state read back afterwards. current maps each agent to its
    record as read now; an agent missing from it is treated as changed by someone else."""
    result = {"applied": [], "not_applied": [], "overwritten": []}
    for change in plan:
        now = current.get(change["agent"], {}).get(change["field"])
        if now == change["after"]:
            result["applied"].append(change["agent"])
        elif now == change["before"]:
            result["not_applied"].append(change["agent"])
        else:
            result["overwritten"].append(change["agent"])
    return {key: sorted(agents) for key, agents in result.items()}


def run_saga(steps: list[tuple]) -> dict:
    """Run (name, action, compensate) steps in order. If an action raises, run the compensations of
    the steps that completed, newest first; a compensation that raises is recorded, and the rest still run."""
    completed = []
    for name, action, compensate in steps:
        try:
            action()
        except Exception:
            compensated, compensation_failed = [], []
            for done_name, done_compensate in reversed(completed):
                try:
                    done_compensate()
                    compensated.append(done_name)
                except Exception:
                    compensation_failed.append(done_name)
            return {"completed": [n for n, _ in completed], "failed": name,
                    "compensated": compensated, "compensation_failed": compensation_failed}
        completed.append((name, compensate))
    return {"completed": [n for n, _ in completed], "failed": None, "compensated": [], "compensation_failed": []}


# a claim the agent might make, the tool that would have to have done it, and which argument each
# named part of the claim must match
CLAIMS = [
    (re.compile(r"\b(?:moved|migrated|switched) (?P<agent_name>[a-z]+_agent)", re.IGNORECASE), "set_model"),
    (re.compile(r"\bpaused (?P<agent_name>[a-z]+_agent)", re.IGNORECASE), "set_status"),
    (re.compile(r"\b(?:notified|told|let) (?:the )?(?P<team>[a-z]+-team)", re.IGNORECASE), "notify"),
]


def unsupported_claims(report: str, log: list[dict], claims=CLAIMS) -> list[str]:
    """The claims in an agent's report that no successful tool call in its log supports, in the order
    they appear. A call supports a claim if it's the claim's tool, it succeeded, and its input matches
    every named part of the claim."""
    found = []
    for pattern, tool in claims:
        for match in pattern.finditer(report):
            wanted = {key: value.lower() for key, value in match.groupdict().items()}
            supported = any(
                entry["tool"] == tool and entry["ok"]
                and all(str(entry["input"].get(key, "")).lower() == value for key, value in wanted.items())
                for entry in log)
            if not supported:
                found.append((match.start(), match.group()))
    return [text for _, text in sorted(found)]
```

**Tab: `workflow.py`** (starter, entry file)
```python
from lib import Registry, check_preview, confirm, is_safe, run_saga, unsupported_claims


def migrate(registry: Registry, match: str, agent: str, model: str, team: str) -> dict:
    """Move one agent onto a new model and tell its team, safely: dry run, saga, read-back, honest report."""
    ...



if __name__ == "__main__":
    start = {"research_agent": {"model": "claude-legacy"}, "research_summary_agent": {"model": "claude-legacy"},
             "notes_agent": {"model": "claude-legacy"}}
    scenarios = [
        ("everything works", Registry(start), "research_agent"),
        ("a loose match", Registry(start), "research"),
        ("the notification fails", Registry(start, fail_notify=True), "research_agent"),
        ("the write is lost", Registry(start, lose_writes=True), "research_agent"),
    ]
    for label, registry, match in scenarios:
        outcome = migrate(registry, match, "research_agent", "claude-sonnet", "research-team")
        print(f"{label}: {outcome['status']}; research_agent on {registry.read('research_agent')['model']}; "
              f"unsupported claims {outcome['unsupported']}")
        print(f"  report: {outcome['report']}")
```

**Hidden tests:**
```python
from lib import Registry, unsupported_claims
from workflow import migrate

START = {"research_agent": {"model": "claude-legacy"}, "research_summary_agent": {"model": "claude-legacy"}}


def run(**flags):
    registry = Registry(START, **{k: v for k, v in flags.items() if k != "match"})
    outcome = migrate(registry, flags.get("match", "research_agent"), "research_agent", "claude-sonnet", "research-team")
    assert isinstance(outcome, dict) and set(outcome) >= {"status", "report", "unsupported"}, (
        "return status, report and unsupported")
    assert outcome["unsupported"] == unsupported_claims(outcome["report"], registry.log), (
        "unsupported must be what unsupported_claims finds in your report against the registry's log")
    assert outcome["unsupported"] == [], (
        f"your report claims something the log doesn't support: {outcome['unsupported']}. Report: {outcome['report']!r}")
    return registry, outcome


registry, outcome = run()
assert outcome["status"] == "done", f"status {outcome['status']!r}: everything worked"
assert registry.read("research_agent")["model"] == "claude-sonnet", "research_agent should now be on claude-sonnet"
assert any(e["tool"] == "notify" and e["ok"] for e in registry.log), "the team should have been notified"

registry, outcome = run(match="research")
assert outcome["status"] == "refused", (
    f"status {outcome['status']!r}: the dry run shows research_summary_agent would change too; check the preview "
    "and refuse before doing anything")
assert registry.log == [] and registry.read("research_summary_agent")["model"] == "claude-legacy", (
    "a refused plan must change nothing and call no tools")

registry, outcome = run(fail_notify=True)
assert outcome["status"] == "rolled_back", f"status {outcome['status']!r}: the notification failed"
assert registry.read("research_agent")["model"] == "claude-legacy", (
    "when a later step fails, compensate the earlier ones: research_agent should be back on claude-legacy")

registry, outcome = run(lose_writes=True)
assert outcome["status"] == "rolled_back", (
    f"status {outcome['status']!r}: the write was acknowledged but never applied; reading back must catch it")
assert not any(e["tool"] == "notify" for e in registry.log), (
    "read back before notifying: the team must not be told about a change the registry doesn't show")
```

**Hint (shown on request):** Write the read-back as a small function inside
`migrate` that calls `confirm` and raises if the change isn't there, and give
it to `run_saga` as a step with a compensation that does nothing. Build the
report from `run_saga`'s result, and only mention notifying the team in the
success branch.

**Reference solution:**

**Tab: `workflow.py`**
```python
from lib import Registry, check_preview, confirm, is_safe, run_saga, unsupported_claims


def migrate(registry: Registry, match: str, agent: str, model: str, team: str) -> dict:
    """Move one agent onto a new model and tell its team, safely: dry run, saga, read-back, honest report."""
    plan = registry.plan_set_model(match, model)
    preview = check_preview(plan, {"agents": [agent], "field": "model", "value": model})
    if not is_safe(preview):
        report = f"I haven't changed anything: the planned change didn't match the request ({preview})."
        return {"status": "refused", "report": report, "unsupported": unsupported_claims(report, registry.log)}

    def read_back() -> None:
        state = confirm(plan, {change["agent"]: registry.read(change["agent"]) for change in plan})
        if state["not_applied"] or state["overwritten"]:
            raise RuntimeError(f"the registry doesn't show the change: {state}")

    result = run_saga([
        ("set_model", lambda: registry.apply_plan(plan), lambda: registry.restore(plan)),
        ("read_back", read_back, lambda: None),
        ("notify", lambda: registry.notify(team, f"{agent} now runs on {model}"), lambda: None),
    ])
    if result["failed"]:
        report = (f"I couldn't finish: the {result['failed']} step failed, so I rolled back "
                  f"({', '.join(result['compensated']) or 'nothing to undo'}); {agent} is unchanged.")
        if result["compensation_failed"]:
            report += f" Undoing {', '.join(result['compensation_failed'])} also failed and needs a person."
        status = "rolled_back"
    else:
        report = f"I moved {agent} onto {model} and notified {team}."
        status = "done"
    return {"status": status, "report": report, "unsupported": unsupported_claims(report, registry.log)}


if __name__ == "__main__":
    start = {"research_agent": {"model": "claude-legacy"}, "research_summary_agent": {"model": "claude-legacy"},
             "notes_agent": {"model": "claude-legacy"}}
    scenarios = [
        ("everything works", Registry(start), "research_agent"),
        ("a loose match", Registry(start), "research"),
        ("the notification fails", Registry(start, fail_notify=True), "research_agent"),
        ("the write is lost", Registry(start, lose_writes=True), "research_agent"),
    ]
    for label, registry, match in scenarios:
        outcome = migrate(registry, match, "research_agent", "claude-sonnet", "research-team")
        print(f"{label}: {outcome['status']}; research_agent on {registry.read('research_agent')['model']}; "
              f"unsupported claims {outcome['unsupported']}")
        print(f"  report: {outcome['report']}")
```
```
everything works: done; research_agent on claude-sonnet; unsupported claims []
  report: I moved research_agent onto claude-sonnet and notified research-team.
a loose match: refused; research_agent on claude-legacy; unsupported claims []
  report: I haven't changed anything: the planned change didn't match the request ({'unexpected': ['research_summary_agent'], 'missing': [], 'wrong_change': []}).
the notification fails: rolled_back; research_agent on claude-legacy; unsupported claims []
  report: I couldn't finish: the notify step failed, so I rolled back (read_back, set_model); research_agent is unchanged.
the write is lost: rolled_back; research_agent on claude-legacy; unsupported claims []
  report: I couldn't finish: the read_back step failed, so I rolled back (set_model); research_agent is unchanged.
```
*(the Run output)*

**Explanation:** Each scenario is caught by a different part of the lesson.
The loose match never reaches the registry, because the dry run shows it.
The lost write is caught by the read-back, before the team is told anything.
The failed notification triggers the saga, which puts the agent back. And in
every case, the report says only what the log supports, so the user is never
told about a change that didn't happen.

Rolling back the model change because the notification failed is a design
choice, not the only right answer: here the change and the announcement are
treated as one unit. A team could reasonably decide instead to keep the
change and retry the notification, or report the change and say the
notification failed. What matters is that the choice is made deliberately,
and the report matches whatever the agent actually did.
