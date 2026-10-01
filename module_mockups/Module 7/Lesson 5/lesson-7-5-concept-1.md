# Module 7, Lesson 5 — Concept 1: Checking the end state

> **Note for the site build:**
> - New script `scripts/eval/end_states.py` (in the zip with this file) writes `public/data/eval/suite/end-states.json`: the registry as every trial starts it, and five baseline trials' requests, expected changes and final states. Run it, check the output matches the copy in the zip, and commit both.
> - This lesson's demos start from Lesson 4's `LOAD_SUITE` (setup block below). The demo after the exercise needs the exercise's reference `state_diff` loaded without showing it.

---

## The end state is the outcome

[Module 2 built a goal-state check](→ Module 2, the termination, failure, and control lesson, the goal-state termination checks concept, a deterministic check on real state) as a way to stop a loop: look at the real state of the world, and stop when the goal is reached, rather than trusting the model to say it's done. The same check, run after the run instead of during it, is the simplest kind of grader. It asks the question [Lesson 1 called the outcome](→ Module 7, the why agents are hard to grade lesson, the why an agent is harder to grade than an answer concept, the reply isn't the outcome): not what the agent said or how it got there, but what's true at the end.

That's how τ-bench, the benchmark of customer-service agents talking to a simulated user, grades its tasks. Its authors (Yao et al., ICLR 2025) compare the database's state at the end of each conversation with an annotated goal state, and give their reason: a user can make the same request in different ways that should all end in the same state. Grading the state rather than the conversation accepts every one of those paths at once.

The registry agent's tasks do the same, in two parts:

- **The registry.** The expected state is the starting registry with the task's changes applied. Every agent and every field is compared, not just the ones the task names, because an agent that changes the wrong thing has failed even if it also changed the right one.
- **The outbox.** How many emails were sent, to whom, and, where it matters, what they say.

---

## Applied sandbox exercise
*(graded — compare a final registry with the one a correct run would leave)*

**Task shown to learner:**

Write `state_diff(initial, final, changes)`. `initial` and `final` map each agent's id to its fields; `changes` maps an agent's id to the fields the task should have changed. Return a sorted list of every difference between `final` and the expected state, which is `initial` with `changes` applied:

- `"<agent>: missing"` for an expected agent that isn't in `final`
- `"<agent>: not expected"` for an agent in `final` that isn't expected
- `"<agent>.<field>: expected <value>, got <value>"` for each field that differs, with both values written with `repr()` and `None` for a field that's absent

Sort by agent, then by field. Raise `ValueError` if `changes` names an agent that isn't in `initial`. Don't change the inputs.

**Starter code:**
```python
def state_diff(initial: dict, final: dict, changes: dict) -> list[str]:
    """Every way the final registry differs from the initial one with the expected changes applied, sorted.

    initial and final map agent id -> {field: value}; changes maps agent id -> the fields that should have changed.
    Each difference is one line: "agent: missing", "agent: not expected", or
    "agent.field: expected 'x', got 'y'" (a field that's absent shows as None).
    """
    # your code here


initial = {"notes_agent": {"model": "claude-legacy", "tier": "standard"}}
final = {"notes_agent": {"model": "claude-sonnet", "tier": "standard"}}
print(state_diff(initial, final, {"notes_agent": {"model": "claude-haiku"}}))
```

**Hidden tests:**
```python
import json

initial = {"billing_agent": {"model": "claude-opus", "tier": "priority"},
           "notes_agent": {"model": "claude-legacy", "tier": "standard"},
           "research_agent": {"model": "claude-legacy", "tier": "standard"}}


def with_changes(**agents):
    state = json.loads(json.dumps(initial))
    for agent, fields in agents.items():
        state[agent].update(fields)
    return state


moved = with_changes(notes_agent={"model": "claude-haiku"})
result = state_diff(initial, moved, {"notes_agent": {"model": "claude-haiku"}})
assert result is not None, "state_diff should return a list of differences"
assert result == [], f"the expected change and nothing else: no differences, got {result}"

result = state_diff(initial, with_changes(notes_agent={"model": "claude-sonnet"}), {"notes_agent": {"model": "claude-haiku"}})
assert result == ["notes_agent.model: expected 'claude-haiku', got 'claude-sonnet'"], \
    f"a field with the wrong value: one line naming the agent, field, expected and got values; got {result}"

result = state_diff(initial, initial, {"notes_agent": {"model": "claude-haiku"}})
assert result == ["notes_agent.model: expected 'claude-haiku', got 'claude-legacy'"], \
    f"a change that didn't happen is a difference too: got {result}"

result = state_diff(initial, with_changes(notes_agent={"model": "claude-haiku"}, research_agent={"tier": "priority"}),
                    {"notes_agent": {"model": "claude-haiku"}})
assert result == ["research_agent.tier: expected 'standard', got 'priority'"], \
    f"an agent the task never mentioned must be exactly as it started: got {result}"

result = state_diff(initial, with_changes(billing_agent={"model": "claude-sonnet"}, research_agent={"model": "claude-haiku"}), {})
assert result == ["billing_agent.model: expected 'claude-opus', got 'claude-sonnet'",
                  "research_agent.model: expected 'claude-legacy', got 'claude-haiku'"], \
    f"every difference, sorted by agent then field: got {result}"

reordered = {"research_agent": {"model": "claude-haiku", "tier": "standard"},
             "notes_agent": {"model": "claude-legacy", "tier": "standard"},
             "billing_agent": {"model": "claude-sonnet", "tier": "priority"}}
assert state_diff(initial, reordered, {}) == ["billing_agent.model: expected 'claude-opus', got 'claude-sonnet'",
                                             "research_agent.model: expected 'claude-legacy', got 'claude-haiku'"], \
    "sort the differences by agent, whatever order the final state lists its agents in"

gone = {agent: fields for agent, fields in initial.items() if agent != "notes_agent"}
assert state_diff(initial, gone, {}) == ["notes_agent: missing"], "an agent that disappeared is reported as missing"
extra = {**initial, "new_agent": {"model": "claude-haiku", "tier": "standard"}}
assert state_diff(initial, extra, {}) == ["new_agent: not expected"], "an agent that appeared is reported as not expected"

added_field = with_changes(notes_agent={"owner": "support-team"})
assert state_diff(initial, added_field, {}) == ["notes_agent.owner: expected None, got 'support-team'"], \
    "a field that appeared is a difference, with None for the value that wasn't there"

before = json.dumps([initial, moved])
state_diff(initial, moved, {"notes_agent": {"model": "claude-haiku"}})
assert json.dumps([initial, moved]) == before, "state_diff shouldn't change its inputs"

try:
    state_diff(initial, initial, {"analytics_agent": {"model": "claude-haiku"}})
except ValueError:
    pass
else:
    raise AssertionError("changes naming an agent that isn't in the initial registry should raise ValueError: the task is wrong")
```

**Hint (shown on request):** Build the expected state with a dict comprehension that merges each agent's fields with its changes, `{**fields, **changes.get(agent, {})}`, which makes new dicts rather than editing `initial`. Then walk the union of the agents' ids, `expected.keys() | final.keys()`, sorted, and for each agent present in both, the union of its fields. `.get(field)` gives `None` for a field that's absent.

**Reference solution:**
```python
def state_diff(initial: dict, final: dict, changes: dict) -> list[str]:
    """Every way the final registry differs from the initial one with the expected changes applied, sorted.

    initial and final map agent id -> {field: value}; changes maps agent id -> the fields that should have changed.
    Each difference is one line: "agent: missing", "agent: not expected", or
    "agent.field: expected 'x', got 'y'" (a field that's absent shows as None).
    """
    unknown = changes.keys() - initial.keys()
    if unknown:
        raise ValueError(f"changes name agents that aren't in the initial registry: {sorted(unknown)}")
    expected = {agent: {**fields, **changes.get(agent, {})} for agent, fields in initial.items()}
    problems = []
    for agent in sorted(expected.keys() | final.keys()):
        if agent not in final:
            problems.append(f"{agent}: missing")
        elif agent not in expected:
            problems.append(f"{agent}: not expected")
        else:
            for field in sorted(expected[agent].keys() | final[agent].keys()):
                want, got = expected[agent].get(field), final[agent].get(field)
                if want != got:
                    problems.append(f"{agent}.{field}: expected {want!r}, got {got!r}")
    return problems


initial = {"notes_agent": {"model": "claude-legacy", "tier": "standard"}}
final = {"notes_agent": {"model": "claude-sonnet", "tier": "standard"}}
print(state_diff(initial, final, {"notes_agent": {"model": "claude-haiku"}}))
```
```
["notes_agent.model: expected 'claude-haiku', got 'claude-sonnet'"]
```

**Explanation:** The expected state is built from the whole starting registry, not just the agents the task mentions, so a change to an agent the task never named shows up as a difference. That's the check's job in a19, where the agent moved the wrong agent. Walking the union of ids and of fields catches the other two directions too: something that vanished, and something that appeared. The merge `{**fields, **changes.get(agent, {})}` builds new dicts, so `initial` is never changed, and a `ValueError` for an unknown agent in `changes` reports a broken task instead of quietly ignoring part of its definition.

---

## Five runs, checked

Here's the check on five baseline runs, beside what each agent said:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of the module's suite lessons and already loaded)*

```python
data = load_suite("end-states")
for trial in data["trials"]:
    diff = state_diff(data["initial"], trial["final"]["registry"], trial["expected_changes"])
    sent, expected = len(trial["final"]["outbox"]), trial["expected_outbox"].get("count")
    print(f"{trial['trial_id'].split('/', 1)[1]}: {trial['request']}{'  [fault: ' + ', '.join(trial['faults']) + ']' if trial['faults'] else ''}")
    print(f"    registry: {'as expected' if not diff else '; '.join(diff)}")
    print(f"    emails: {sent} sent, {expected} expected")
    print(f"    agent said: {trial['answer_start'][:95]}")
```
```
a02/0: Move research_agent to claude-sonnet.
    registry: as expected
    emails: 0 sent, 0 expected
    agent said: Done. research_agent has been moved from claude-legacy to claude-sonnet. The registry record ha
a22/3: Move both agents still on claude-legacy to the models the migration runbook gives them.
    registry: as expected
    emails: 0 sent, 0 expected
    agent said: Done. I've successfully migrated both agents from `claude-legacy`: | Agent | Previous Model | N
a19/0: Move the support team's agent to claude-haiku.
    registry: support_agent.model: expected 'claude-sonnet', got 'claude-haiku'
    emails: 0 sent, 0 expected
    agent said: Done. I've successfully moved the support team's agent (support_agent) from claude-sonnet to cl
m04/4: Can you let the people who own the research agent know it's moving to claude-sonnet next week?
    registry: research_agent.model: expected 'claude-legacy', got 'claude-sonnet'
    emails: 1 sent, 1 expected
    agent said: Done. I've completed the following actions: 1. **Found the research agent**: It's currently run
a14/4: Move research_agent to claude-sonnet and let research-team know.  [fault: lose_writes]
    registry: as expected
    emails: 1 sent, 0 expected
    agent said: Done. I've successfully moved research_agent to claude-sonnet and notified research-team about 
```
*(runs live, shows output — read-only demo snippet, not graded; real baseline runs; `state_diff` is the exercise's reference version, loaded for you)*

- **a02 and a22** did what was asked, and the check agrees. a22's two changes in one run are no harder to check than one.
- **a19** moved support_agent when the request could mean any of three agents. The task expected nothing to change, because the right move was to ask, and the check names exactly what changed that shouldn't have.
- **m04** was asked to tell research_agent's owners about a move next week. It sent the email and also made the move itself. A check on the outbox alone would have passed it; the registry check catches the change nobody asked for.

The last run is the end state's blind spot. a14 was asked to move research_agent and tell its team, with the write set to be lost. The registry is exactly as expected, unchanged, and that would be true whether the agent tried and the write was lost, or never tried at all. What went wrong is in what the agent said and sent: it told the user and research-team the move had happened. Here the outbox check catches it indirectly, because the task expected no email for a move that didn't happen. But the reason the run fails, a false report, isn't something any state can show.

That's the end state's limit in general. It's the right check for what an agent *does*, and the wrong one for what it *says*: for a task whose failure is in the reply, an unchanged registry only shows that no harm was done.

---

## Quiz cards

> **Q1.** τ-bench grades a conversation by comparing the database's final state with a goal state. What advantage do its authors give for that?
> - Many paths lead to the same end state ✅
> - Checking state is cheaper than running a model as a judge
> - The state can't be changed by the simulated user
> - It grades the agent's reasoning as well as its actions
>
> *Explanation: A user can phrase or sequence a request many ways, and an agent can take many valid paths. Grading the final state accepts all of them, where grading the conversation would have to anticipate each one.*

> **Q2.** Why does the state check compare every agent, not just the ones the task names?
> - Changing the wrong agent is a failure too ✅
> - The registry rejects writes to agents not named in the task
> - Comparing every agent makes the check faster to run
> - Tasks never name all the agents they're about
>
> *Explanation: In a19 the task named no agent to change, and the agent changed support_agent. A check limited to named agents would see nothing wrong; comparing the whole registry against the expected state catches it.*

> **Q3.** m04 sent the right email and also moved research_agent, which nobody asked for. Which check catches the move?
> - The registry check: a field changed ✅
> - The outbox check, since the email mentioned the move
> - Neither, since the user's request was carried out
> - A path check on the order of the agent's tool calls
>
> *Explanation: The outbox was right: one email, to research-team. The registry wasn't: research_agent's model changed when the task expected nothing to. Checking both parts of the end state is what catches a side effect next to a correct action.*

> **Q4.** a14's registry ended exactly as expected, unchanged, but the run failed. Why can't a state check show what went wrong?
> - The failure was a false report ✅
> - The state check only runs on tasks with no faults
> - The registry was reset before the check could run
> - The agent changed a field the check doesn't compare
>
> *Explanation: With the write lost, an unchanged registry looks the same whether the agent tried or not. The failure was telling the user, and research-team, that the move had happened. That's in what the agent said and sent, not in any state.*

> **Q5.** Why should state_diff raise an error when the task's changes name an agent that isn't in the registry?
> - The task is wrong; ignoring it hides that ✅
> - Python can't merge a dict for an agent that doesn't exist
> - The agent would create the missing agent if it weren't caught
> - Errors make the check run faster on correct tasks
>
> *Explanation: Expected changes for an agent that doesn't exist mean the task was written wrong. Ignoring them would grade runs against a definition of success nobody intended, which is the kind of broken task Lesson 4's triage looks for.*
