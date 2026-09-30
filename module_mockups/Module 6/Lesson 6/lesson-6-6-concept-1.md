# Module 6, Lesson 6 — Concept 1: Asking before acting

---

## Two kinds of not knowing

An agent can be unsure at two different points:

- **At the start,** when the request doesn't say enough to act on. "Sort
  out the migration" doesn't say which agent, and nothing the agent can look
  up will tell it which one the user meant.
- **Partway through,** when the agent has done some work and isn't sure
  enough of the result to go on. The rest of this lesson is about that: the
  signals that show it, and what to do when they fire.

This concept is about the first. The right response to a request that's
missing a choice only the user can make is a question, asked before any
action.

---

## What agents do instead

Asking is not what models do by default. Wang et al.,
[*Learning to Ask: When LLM Agents Meet Unclear Instruction*](https://arxiv.org/abs/2409.00557)
(EMNLP 2025), collected real users' instructions to tool-using agents,
studied the errors they led to, and built a benchmark of unclear
instructions. Their finding: agents tend to make up the missing argument,
which, as they put it, can lead to hallucinations and risks, where a person
would simply have asked. Their fix, Ask-when-Needed, prompts the agent to
ask the user whenever an unclear instruction leaves it stuck.

Asking has a cost too. A 2026 preprint on coding agents,
[*Asking What Matters*](https://arxiv.org/abs/2604.14624), found that
results often stopped improving, or got worse, as agents asked more
questions, while the burden on users grew. So the aim is one question, and
only when it's needed.

---

## Where each argument's value should come from

The previous lessons already give most of what's needed to catch a made-up
argument in code. The missing piece is saying, for each tool parameter,
where its value is allowed to come from:

- **From the user:** a choice only they can make, such as which agent to
  change. Its value has to appear in what the user said.
- **From a lookup:** a fact the agent can find, such as the model the
  migration runbook assigns. Its value has to appear in a tool result, which
  is [Lesson 4's grounding check](→ this module, verifying an answer against its sources lesson, figures traced to tool results in code concept)
  applied to a tool call.
- **From the model:** wording the model writes itself, such as a reason for
  the change. Nothing to check.

Here's that check on three calls a model might make:

```python
# where each argument's value has to come from: a choice only the user can make, a fact the agent
# can look up, or the model's own wording
SET_MODEL = {"agent_name": "user", "model": "lookup", "reason": "model"}


def unsupported(arguments: dict, request: str, tool_results: list[str]) -> dict:
    """The arguments whose value doesn't appear where it should have come from."""
    evidence = {"user": request.lower(), "lookup": " ".join(tool_results).lower()}
    return {name: source for name, source in SET_MODEL.items()
            if source in evidence and name in arguments and str(arguments[name]).lower() not in evidence[source]}


runbook = ['{"agent_name": "research_agent", "owner": "research-team", "target_model": "claude-sonnet"}']
cases = [
    ("Move research_agent to the new model.", [], {"agent_name": "research_agent", "model": "claude-sonnet"}),
    ("Move research_agent to the new model.", runbook, {"agent_name": "research_agent", "model": "claude-sonnet"}),
    ("Can you sort out the migration?", runbook, {"agent_name": "research_agent", "model": "claude-sonnet"}),
]
for request, results, arguments in cases:
    print(f"{request!r}, {'after' if results else 'before'} reading the runbook")
    print(f"  call: {arguments}")
    print(f"  not supported: {unsupported(arguments, request, results) or 'nothing'}")
```
```
'Move research_agent to the new model.', before reading the runbook
  call: {'agent_name': 'research_agent', 'model': 'claude-sonnet'}
  not supported: {'model': 'lookup'}
'Move research_agent to the new model.', after reading the runbook
  call: {'agent_name': 'research_agent', 'model': 'claude-sonnet'}
  not supported: nothing
'Can you sort out the migration?', after reading the runbook
  call: {'agent_name': 'research_agent', 'model': 'claude-sonnet'}
  not supported: {'agent_name': 'user'}
```
*(runs live, shows output — read-only demo snippet, not graded. The calls
are scripted, standing for what a model might produce.)*

The three cases need three different responses:

- **A fact nobody looked up:** `claude-sonnet` happens to be the right
  model, but at the time of the call nothing the agent read said so. The fix
  is a lookup, not a question: the user shouldn't have to know what the
  runbook says.
- **The same call, after the lookup:** everything is supported, and the
  call can run.
- **A choice the user never made:** the runbook lists `research_agent`, but
  it lists other agents too. Which one to migrate is the user's decision, so
  the value has to come from the user. The response is one question: which
  agent?

This is a check on a tool call before it runs, the second point in
[Lesson 3's loop](→ this module, checks in the loop lesson, where a check can sit in the loop concept),
and it differs from
[Module 3's argument validation](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept)
in what it asks. Validation asks whether a value is well-formed and exists;
this asks where the value came from. Both `research_agent` calls would pass
validation.

One consequence follows from Lesson 4's
[false premises](→ this module, verifying an answer against its sources lesson, questions built on a false premise concept):
a fact the user states is a claim, not evidence. "Move it to `claude-opus`"
names a model, but if the model is meant to come from the runbook, the
runbook still has to be checked.

How the question reaches the user, as a message, a form or a button, is
Module 9's subject.

---

## Applied sandbox exercise
*(graded — what's still needed before a tool call can run)*

**Task shown to learner:** Write `before_acting(arguments, schema, request,
tool_results)`. `schema` maps each parameter name to `{"source": ...,
"required": ...}`, where the source is `"user"`, `"lookup"` or `"model"`.
Return `{"ask": [...], "look_up": [...]}`: the parameters that need a
question for the user, and those that need a lookup, each in the schema's
order.

- A **required** parameter that's missing is needed, from wherever its
  source says.
- A parameter that's **present**, required or not, is needed if its value
  doesn't appear, ignoring case, in the request (for source `"user"`) or in
  any tool result (for source `"lookup"`).
- Source `"model"` is never checked.

**Starter code:**
```python
def before_acting(arguments: dict, schema: dict, request: str, tool_results: list[str]) -> dict:
    """What the agent still needs before this call can run: questions for the user, and facts to look up.
    Each parameter's value must be present if required, and must appear in the request (source "user")
    or in a tool result (source "lookup"). Values from source "model" aren't checked."""
    ...


SCHEMA = {"agent_name": {"source": "user", "required": True},
          "model": {"source": "lookup", "required": True},
          "reason": {"source": "model", "required": False}}
runbook = ['{"agent_name": "research_agent", "target_model": "claude-sonnet"}']
print(before_acting({"agent_name": "research_agent", "model": "claude-sonnet"}, SCHEMA,
                    "Move research_agent to its new model.", []))
print(before_acting({"agent_name": "research_agent", "model": "claude-sonnet"}, SCHEMA,
                    "Can you sort out the migration?", runbook))
```

**Hidden tests:**
```python
SCHEMA = {
    "agent_name": {"source": "user", "required": True},
    "model": {"source": "lookup", "required": True},
    "tier": {"source": "lookup", "required": False},
    "notify": {"source": "user", "required": False},
    "reason": {"source": "model", "required": True},
}
runbook = ['{"agent_name": "research_agent", "target_model": "claude-sonnet", "tier": "standard"}']

r = before_acting({"agent_name": "research_agent", "model": "claude-sonnet", "reason": "switch-off"},
                  SCHEMA, "Move research_agent to its new model.", runbook)
assert isinstance(r, dict) and set(r) == {"ask", "look_up"}, "return {'ask': [...], 'look_up': [...]}"
assert r == {"ask": [], "look_up": []}, f"everything is supported: the agent from the request, the model from the runbook; got {r}"

r = before_acting({"agent_name": "research_agent", "model": "claude-sonnet", "reason": "x"}, SCHEMA,
                  "Move research_agent to its new model.", [])
assert r == {"ask": [], "look_up": ["model"]}, (
    f"got {r}: with no tool results yet, claude-sonnet isn't supported by anything the agent looked up")

r = before_acting({"agent_name": "research_agent", "model": "claude-sonnet", "reason": "x"}, SCHEMA,
                  "Can you sort out the migration?", runbook)
assert r == {"ask": ["agent_name"], "look_up": []}, (
    f"got {r}: which agent to change is the user's choice. It appears in the runbook, but a user value has to come "
    "from the request, not from a tool result")

r = before_acting({"reason": "x"}, SCHEMA, "Migrate something.", runbook)
assert r == {"ask": ["agent_name"], "look_up": ["model"]}, (
    f"got {r}: required arguments that are missing are needed too, from wherever their source says")

r = before_acting({"agent_name": "research_agent", "model": "claude-sonnet"}, SCHEMA, "Move research_agent.", runbook)
assert r == {"ask": [], "look_up": []}, (
    f"got {r}: 'reason' comes from the model, so it's never asked for or looked up, even when required and missing")

r = before_acting({"agent_name": "Research_Agent", "model": "CLAUDE-SONNET", "tier": "priority", "reason": "x"},
                  SCHEMA, "move research_agent please", runbook)
assert r == {"ask": [], "look_up": ["tier"]}, (
    f"got {r}: compare without case; tier is optional, but a value given must still be supported, and the "
    "runbook says standard, not priority")

r = before_acting({"agent_name": "notes_agent", "model": "claude-haiku", "notify": "yes", "reason": "x"},
                  SCHEMA, "Move research_agent.", runbook)
assert r == {"ask": ["agent_name", "notify"], "look_up": ["model"]}, (
    f"got {r}: list what's needed in the schema's order")

r = before_acting({"agent_name": "research_agent", "model": "claude-opus", "reason": "x"}, SCHEMA,
                  "Move research_agent to claude-opus.", [])
assert r == {"ask": [], "look_up": ["model"]}, (
    f"got {r}: the request names claude-opus, but a fact the user states is a claim to check, not evidence; "
    "a lookup value has to appear in a tool result")
```

**Hint (shown on request):** Build one lowercase string of evidence for each
source, the request for `"user"` and the joined tool results for `"lookup"`,
then walk the schema in order. Skip `"model"` parameters before anything
else, since they're neither asked for nor looked up.

**Reference solution:**
```python
def before_acting(arguments: dict, schema: dict, request: str, tool_results: list[str]) -> dict:
    """What the agent still needs before this call can run: questions for the user, and facts to look up.
    Each parameter's value must be present if required, and must appear in the request (source "user")
    or in a tool result (source "lookup"). Values from source "model" aren't checked."""
    evidence = {"user": request.lower(), "lookup": " ".join(tool_results).lower()}
    needs = {"ask": [], "look_up": []}
    for name, spec in schema.items():
        if spec["source"] not in evidence:
            continue
        where = "ask" if spec["source"] == "user" else "look_up"
        if name not in arguments:
            if spec["required"]:
                needs[where].append(name)
        elif str(arguments[name]).lower() not in evidence[spec["source"]]:
            needs[where].append(name)
    return needs
```
```
{'ask': [], 'look_up': ['model']}
{'ask': ['agent_name'], 'look_up': []}
```
*(the starter's printout, with the reference in place)*

**Explanation:** Keeping the two kinds of evidence apart is the point. A
user value that happens to appear in a tool result isn't the user's choice,
and a fact that appears in the request isn't confirmed. The output splits the
same way, because the two lead to different actions: a lookup the agent can
do itself, and a question only the user can answer. Checking optional
parameters when present catches a model that adds a detail nobody asked for,
such as a tier. Matching by substring is simple and has a known gap: a value
like `research` would match inside `research_agent`. A real check would match
whole identifiers, as Lesson 4's grounding check did.

---

## Quiz cards

> **Q1.** What did Wang et al. find agents tend to do with an instruction
> that leaves out a needed argument?
> - A) Refuse the whole task outright
> - B) Make up the missing argument ✅
> - C) Ask the user every single time
> - D) Call every tool with its default values
>
> *Explanation: models fill the gap with a plausible value, which can lead to
> wrong or risky actions. Their Ask-when-Needed approach prompts the agent to
> ask instead when it's stuck.*

> **Q2.** A request says "move research_agent to the new model", and the
> agent calls `set_model` with `claude-sonnet` before reading anything. What's
> the right response?
> - A) Ask the user which model they meant
> - B) Look it up, since the runbook records it ✅
> - C) Run the call, since claude-sonnet is correct
> - D) Refuse, since the request is unclear
>
> *Explanation: the model is a fact the agent can find, so asking the user
> would push work onto them unnecessarily. Being right by luck isn't the
> same as being supported.*

> **Q3.** The runbook lists research_agent, and the request says only "sort
> out the migration". Why can't the agent take the agent name from the
> runbook?
> - A) Because the runbook might be out of date
> - B) Which agent to migrate is the user's choice ✅
> - C) Because agent names must always be typed by the user
> - D) Because tool results can't be used in tool calls
>
> *Explanation: some values are facts to look up; others are decisions only
> the user can make. Picking one from a list the user never chose from is
> making the decision for them.*

> **Q4.** Why aim for one clarifying question rather than several?
> - A) Because users never answer more than one question
> - B) More questions may not help, and they burden users ✅
> - C) Because agents can only send one message per turn
> - D) Because every question costs a lot of tokens
>
> *Explanation: a 2026 study of coding agents found more questions often
> didn't help, and sometimes hurt, while costing users effort. Ask only for
> what's needed, which the check makes explicit.*

---

*(End of this concept. The next concept looks at the signals that an agent
partway through a task isn't sure enough to continue.)*
