# Module 6, Lesson 3 — Bookends: Checks in the loop

---

## Intro

> **You'll be able to**
> - Place a check at the right point in the agent loop, before a model call, on a tool call, on a tool result or on the final answer, knowing what each can and can't see
> - Turn a tool result that reports success but can't be used into a marked error the model can act on, without blocking good results
> - Choose what a failed check does, and when a check may run in parallel with the work it guards

**Why it matters**
Lesson 2 said where reliability is worth spending. This lesson is where the
spending happens: small pieces of code at fixed points in the loop, each
catching one kind of failure. Placed well, they catch the wrong value,
the empty result and the leaked key before they do damage. Placed badly, or
written carelessly, they block good work, and a check that nobody measures
does both without anyone noticing.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** A check on a `delete_record` tool's result finds the wrong record
> was deleted. What does this show about where that check belonged?
> - A) Nothing, since a result check is the right place for any tool
> - B) It needed to be on the call, before the tool ran ✅
> - C) It should have been on the final answer instead
> - D) Deletions can't be checked in code at all
>
> *Explanation: a result check sees what already happened. For a tool that
> changes something, the check that can prevent the harm is the one on the
> call.*

> **Q2.** In Sethi et al.'s preprint, what mostly decided whether a model
> reported a tool failure honestly?
> - A) The size of the model
> - B) Whether the tool's response said it had failed ✅
> - C) How long the tool took to respond
> - D) Whether the system prompt mentioned tools
>
> *Explanation: when the tool returned an error status, dishonest answers
> were absent in their main condition; when it returned success around an
> unusable value, they rose as high as 45.3%. A result check converts the
> second into the first.*

> **Q3.** Which result check is a false-block risk?
> - A) Rejecting text that doesn't parse as JSON
> - B) Rejecting an error rate above 1
> - C) Rejecting any field whose value is falsy ✅
> - D) Rejecting a record with a required field missing
>
> *Explanation: a falsy test treats 0, 0.0 and empty strings as missing, so
> it blocks perfectly good readings such as an error rate of zero. Test for
> `None` explicitly.*

> **Q4.** A tool call names "Notes_Agent" and the registry has notes_agent.
> Another names "notes". Which, if either, should code repair?
> - A) Both, to the closest known name
> - B) Neither: every repair hides a mistake
> - C) Only "Notes_Agent", since only case and spacing differ ✅
> - D) Only "notes", since it's a prefix of the real name
>
> *Explanation: a repair must be certain and keep the meaning. Case and
> spacing are; a guess from a partial name isn't, so the model is told and
> decides.*

> **Q5.** An input check that calls a classifier takes 0.4 seconds. The model
> call it guards has no side effects. How should they run?
> - A) The check first, then the model call, always
> - B) Side by side, cancelling the model call if the check trips ✅
> - C) The model call first, then the check on its output
> - D) The check only on every tenth request
>
> *Explanation: with no side effects, running speculatively saves the
> check's time whenever it passes, and a trip only wastes tokens. A step
> that could send, pay or write would have to wait.*

> **Q6.** A check aborts the whole run whenever it fires. Compared with a
> check that returns an error to the model, what must be true of it?
> - A) It must be faster
> - B) It must run in parallel with the model
> - C) Its false-block rate must be much lower ✅
> - D) It must use a model rather than code
>
> *Explanation: a wrongly fired abort loses the whole task, where a wrongly
> fired error costs a step. AgentDojo's aborting detector cut completed
> tasks from 69.0% to 41.5%.*

> **Q7.** A step without side effects finishes before its check, and the
> check then fails. What happens to the step's result?
> - A) It's returned, since it arrived first
> - B) It's discarded, and the tripwire is raised ✅
> - C) It's returned with a warning attached
> - D) The step runs again after the check
>
> *Explanation: running in parallel means starting early, not skipping the
> check. A result is used only once every check has passed.*

---

## Comprehensive sandbox
*(graded — measuring a set of checks on labelled runs, multi-file)*

**Task shown to learner:** `lib.py` holds this lesson's `Checks` and
`run_checked_agent`, the registry agent's tools and four checks, and seven
scripted runs. It's read-only. Each run in `CASES` is labelled with the check
points a careful reviewer says should fire on it.

In `measure.py` (the entry file), write `measure(cases, checks)`. For each
case, run the agent on its request and scripted replies, and note which
check points fired, meaning returned a reason, at least once. Then, for each
of the four points, count:

- **caught:** runs where it fired and should have
- **missed:** runs where it should have fired and didn't
- **false_blocks:** runs where it fired and shouldn't have

Return `{point: {"caught": n, "missed": n, "false_blocks": n}}` for all four
points. Every run starts fresh: a new client from its replies, new tools
from `make_tools()`, and nothing marked as fired. Don't change the `Checks`
you're given.

**Tab: `lib.py`** (read-only)
```python
"""The lesson's loop, the registry agent's tools and checks, and scripted runs to measure them on. Read-only."""
import json
import re
class ToolUseBlock:
    _next_id = 1

    def __init__(self, name: str, input: dict):
        self.type = "tool_use"
        self.id = f"toolu_fake_{ToolUseBlock._next_id:02d}"
        ToolUseBlock._next_id += 1
        self.name = name
        self.input = input

class TextBlock:
    def __init__(self, text: str):
        self.type = "text"
        self.text = text

class FakeResponse:
    def __init__(self, content: list):
        self.content = content

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        response_block = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=[response_block])

class ThinkingBlock:
    def __init__(self, thinking: str):
        self.type = "thinking"
        self.thinking = thinking

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses   # now: a list of block-lists
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        content_blocks = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=content_blocks)

from dataclasses import dataclass
from typing import Callable


def no_problem(*_) -> None:
    return None


@dataclass
class Checks:
    """Four places a check can sit. Each returns None if all is well, or a short reason if not."""
    before_model: Callable = no_problem
    before_tool: Callable = no_problem
    after_tool: Callable = no_problem
    before_answer: Callable = no_problem


def run_checked_agent(client, messages: list, tools: dict, checks: Checks, max_steps: int = 8) -> str:
    """Module 2's loop, with a check at each of the four points. A failed tool check becomes an
    error observation the model can react to; a failed check on the input or the answer stops the run."""
    for _ in range(max_steps):
        if reason := checks.before_model(messages):
            return f"stopped before calling the model: {reason}"
        response = client.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        calls = [block for block in response.content if block.type == "tool_use"]
        if not calls:
            answer = "".join(block.text for block in response.content if block.type == "text")
            if reason := checks.before_answer(answer):
                return f"answer withheld: {reason}"
            return answer
        results = []
        for call in calls:
            if reason := checks.before_tool(call, messages):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": reason, "is_error": True})
                continue
            output = tools[call.name](**call.input)
            if reason := checks.after_tool(call, output):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": reason, "is_error": True})
                continue
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without an answer"


KEY = re.compile(r"\brk-[A-Za-z0-9]{8,}")


def make_tools() -> dict:
    """Fresh tools over a fresh registry, so one run can't affect the next."""
    registry = {
        "research_agent": {"model": "claude-legacy", "owner": "research-team"},
        "notes_agent": {"model": "claude-legacy", "owner": "support-team"},
        "billing_agent": {"model": "claude-sonnet", "owner": "finance", "deploy_key": "rk-9b2c7d41e0"},
    }

    def get_agent(agent_name: str) -> str:
        return json.dumps(registry.get(agent_name, {}))

    def set_model(agent_name: str, model: str) -> str:
        registry[agent_name]["model"] = model
        return json.dumps({"agent_name": agent_name, "model": model})

    return {"get_agent": get_agent, "set_model": set_model}


def request_text(messages: list) -> str:
    return messages[0]["content"]


def no_keys_in_input(messages):
    return "the request contains a registry key" if KEY.search(request_text(messages)) else None


def stays_in_scope(call, messages):
    if call.name == "set_model" and call.input["agent_name"] not in request_text(messages):
        return f"{call.input['agent_name']} isn't named in the request, so it can't be changed"
    return None


def record_is_usable(call, output):
    return f"{call.name} returned nothing for {call.input['agent_name']}" if output in ("{}", "") else None


def no_keys_in_answer(answer):
    return "the answer contains a registry key" if KEY.search(answer) else None


CHECKS = Checks(before_model=no_keys_in_input, before_tool=stays_in_scope,
                after_tool=record_is_usable, before_answer=no_keys_in_answer)


def get(name):
    return ToolUseBlock(name="get_agent", input={"agent_name": name})


def set_to(name, model):
    return ToolUseBlock(name="set_model", input={"agent_name": name, "model": model})


# scripted runs, each labelled with the check points a careful reviewer says should fire
CASES = [
    {"name": "a normal migration",
     "request": "Move research_agent onto claude-sonnet.",
     "replies": [[get("research_agent")], [set_to("research_agent", "claude-sonnet")], [TextBlock("Done.")]],
     "should_fire": set()},
    {"name": "a misspelled name",
     "request": "What model does research_agent use?",
     "replies": [[get("research-agent")], [get("research_agent")], [TextBlock("claude-legacy.")]],
     "should_fire": {"after_tool"}},
    {"name": "a change nobody asked for",
     "request": "Move research_agent onto claude-sonnet.",
     "replies": [[set_to("research_agent", "claude-sonnet"), set_to("notes_agent", "claude-sonnet")],
                 [TextBlock("Moved research_agent.")]],
     "should_fire": {"before_tool"}},
    {"name": "a key in the request",
     "request": "Use rk-7f3a9c21b4 to check notes_agent.",
     "replies": [],
     "should_fire": {"before_model"}},
    {"name": "a request for every agent on a model",
     "request": "Move every agent on claude-legacy onto claude-sonnet.",
     "replies": [[set_to("research_agent", "claude-sonnet"), set_to("notes_agent", "claude-sonnet")],
                 [TextBlock("Both moved.")]],
     "should_fire": set()},
    {"name": "a key copied from a record",
     "request": "Show me billing_agent's record.",
     "replies": [[get("billing_agent")], [TextBlock("billing_agent: claude-sonnet, owner finance, deploy_key rk-9b2c7d41e0.")]],
     "should_fire": {"before_answer"}},
    {"name": "a misspelled model",
     "request": "Move research_agent onto claude-sonnet.",
     "replies": [[set_to("research_agent", "claude-sonet")], [TextBlock("Done.")]],
     "should_fire": {"before_tool"}},
]
```

**Tab: `measure.py`** (starter, entry file)
```python
from dataclasses import replace

from lib import CASES, CHECKS, FakeLLMClient, make_tools, run_checked_agent

POINTS = ("before_model", "before_tool", "after_tool", "before_answer")


def measure(cases: list, checks) -> dict:
    """Per check point: runs where it rightly fired, runs where it should have and didn't, and runs
    where it fired and shouldn't have."""
    ...


if __name__ == "__main__":
    for point, counts in measure(CASES, CHECKS).items():
        print(f"{point:<14} caught {counts['caught']}, missed {counts['missed']}, false blocks {counts['false_blocks']}")
```

**Hidden tests:**
```python
from lib import CASES, CHECKS, Checks, TextBlock, ToolUseBlock, stays_in_scope
from measure import measure

POINTS = ("before_model", "before_tool", "after_tool", "before_answer")
ZERO = {"caught": 0, "missed": 0, "false_blocks": 0}


def set_to(name, model):
    return ToolUseBlock(name="set_model", input={"agent_name": name, "model": model})


def get(name):
    return ToolUseBlock(name="get_agent", input={"agent_name": name})


report = measure(CASES, CHECKS)
assert isinstance(report, dict) and set(report) == set(POINTS), (
    f"return a dict with one entry per check point {POINTS}; got keys {sorted(report) if isinstance(report, dict) else report}")
expected = {
    "before_model": {"caught": 1, "missed": 0, "false_blocks": 0},
    "before_tool": {"caught": 1, "missed": 1, "false_blocks": 1},
    "after_tool": {"caught": 1, "missed": 0, "false_blocks": 0},
    "before_answer": {"caught": 1, "missed": 0, "false_blocks": 0},
}
for point in POINTS:
    assert report[point] == expected[point], f"{point}: got {report[point]}, expected {expected[point]}"

assert CHECKS.before_tool is stays_in_scope, (
    "measure changed the Checks it was given; watch a copy (dataclasses.replace), not the original")

assert measure([], CHECKS) == {point: dict(ZERO) for point in POINTS}, (
    "with no cases, every point should still appear, with zero counts")

twice = [{"name": "two unrequested changes", "request": "Move research_agent onto claude-sonnet.",
          "replies": [[set_to("notes_agent", "x"), set_to("billing_agent", "x")], [TextBlock("ok")]],
          "should_fire": {"before_tool"}}]
assert measure(twice, CHECKS)["before_tool"] == {"caught": 1, "missed": 0, "false_blocks": 0}, (
    "a point that fires twice in one run still counts as one run: count runs, not firings")

fires_then_quiet = twice + [{"name": "quiet", "request": "What model does research_agent use?",
                              "replies": [[TextBlock("claude-legacy")]], "should_fire": set()}]
assert measure(fires_then_quiet, CHECKS)["before_tool"] == {"caught": 1, "missed": 0, "false_blocks": 0}, (
    "the second run fired nothing, but was counted as a false block: start each run with nothing fired")

sees_x = Checks(after_tool=lambda call, output: "changed" if '"x"' in output else None)
changes_then_reads = [
    {"name": "change", "request": "set research_agent to x",
     "replies": [[set_to("research_agent", "x")], [TextBlock("done")]], "should_fire": {"after_tool"}},
    {"name": "read", "request": "read research_agent",
     "replies": [[get("research_agent")], [TextBlock("claude-legacy")]], "should_fire": set()},
]
assert measure(changes_then_reads, sees_x)["after_tool"] == {"caught": 1, "missed": 0, "false_blocks": 0}, (
    "the second run saw the first run's change to the registry: build fresh tools with make_tools() for every run")

blocked_wrongly = [{"name": "every agent", "request": "Move every agent on claude-legacy onto claude-sonnet.",
                    "replies": [[set_to("notes_agent", "claude-sonnet")], [TextBlock("done")]],
                    "should_fire": set()},
                   {"name": "missed typo", "request": "Move research_agent onto claude-sonnet.",
                    "replies": [[set_to("research_agent", "claude-sonet")], [TextBlock("done")]],
                    "should_fire": {"before_tool"}}]
assert measure(blocked_wrongly[:1], CHECKS)["before_tool"] == {"caught": 0, "missed": 0, "false_blocks": 1}, (
    "the check fired on a run where it shouldn't have: that's a false block, not a miss")
assert measure(blocked_wrongly[1:], CHECKS)["before_tool"] == {"caught": 0, "missed": 1, "false_blocks": 0}, (
    "the check should have fired and didn't: that's a miss, not a false block")
```

**Hint (shown on request):** To see which checks fire, give
`run_checked_agent` a copy of `checks` in which each function is wrapped: the
wrapper calls the original, adds its point to a set if it returned a
reason, and passes the reason on. `dataclasses.replace(checks, before_model=...)`
builds a copy with some fields changed, leaving the original alone. Make the
set, the client and the tools inside the loop over cases.

**Reference solution:**

**Tab: `measure.py`**
```python
from dataclasses import replace

from lib import CASES, CHECKS, FakeLLMClient, make_tools, run_checked_agent

POINTS = ("before_model", "before_tool", "after_tool", "before_answer")


def watched(checks, fired: set):
    """A copy of checks in which every check also records its point in `fired` when it fails."""
    def watch(point, check):
        def wrapper(*args):
            reason = check(*args)
            if reason is not None:
                fired.add(point)
            return reason
        return wrapper
    return replace(checks, **{point: watch(point, getattr(checks, point)) for point in POINTS})


def measure(cases: list, checks) -> dict:
    """Per check point: runs where it rightly fired, runs where it should have and didn't, and runs
    where it fired and shouldn't have."""
    report = {point: {"caught": 0, "missed": 0, "false_blocks": 0} for point in POINTS}
    for case in cases:
        fired = set()
        client = FakeLLMClient(scripted_responses=case["replies"])
        messages = [{"role": "user", "content": case["request"]}]
        run_checked_agent(client, messages, make_tools(), watched(checks, fired))
        for point in POINTS:
            should = point in case["should_fire"]
            if point in fired and should:
                report[point]["caught"] += 1
            elif should:
                report[point]["missed"] += 1
            elif point in fired:
                report[point]["false_blocks"] += 1
    return report


if __name__ == "__main__":
    for point, counts in measure(CASES, CHECKS).items():
        print(f"{point:<14} caught {counts['caught']}, missed {counts['missed']}, false blocks {counts['false_blocks']}")
```
```
before_model   caught 1, missed 0, false blocks 0
before_tool    caught 1, missed 1, false blocks 1
after_tool     caught 1, missed 0, false blocks 0
before_answer  caught 1, missed 0, false blocks 0
```
*(the Run output)*

**Explanation:** Wrapping each check is how you find out what fired without
changing the loop or the checks themselves: the wrapper records and passes
the verdict through unchanged. A set, rebuilt for each run, makes a point
count once per run however often it fires, since the question is which runs
a check got right, not how many calls it saw. Fresh tools matter because the
runs change the registry; without them, one run's migration shows up in the
next.

The report is the point of the exercise. Every check caught something, and
the scope check also shows both kinds of error:

- **A false block** on "move every agent on claude-legacy". The request names
  no agent, so the rule that a change must name its agent refuses a request
  that was entirely reasonable.
- **A miss** on the misspelled model "claude-sonet". The scope check only
  asks whether the agent was named. Nothing checks the model name, and
  [Module 3's argument validation](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept)
  against the list of real models is what would have caught it.

Neither shows up by reading the checks. Both show up the moment they're
measured against labelled runs, which is the habit from Lesson 2: a check is
known by what it catches and what it wrongly blocks.
