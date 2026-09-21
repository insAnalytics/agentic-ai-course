# Writing the Loop by Hand

> **You'll be able to**
> - Configure and use the fake LLM client to exercise agent loop code
>   deterministically, without a real network call
> - Write the minimal viable agent loop — call, check response type,
>   execute or terminate — from scratch
> - Replace hardcoded, single-tool branching with a registry-based
>   dispatch mechanism that generalizes to any number of tools

**Why it matters**
This is the lesson the rest of this module rests on. Every later
lesson — termination and control, planning, reflection, workflow
patterns, and eventually a real framework — is a refinement or
extension of the exact loop written here by hand. Understanding this
loop at the level of "I wrote every line of it myself" is what makes
every later abstraction actually legible, rather than a black box you
learned to configure without ever understanding what it's configuring.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all three concepts, mixed order)*

> **Q1.** What does `FakeLLMClient` actually do differently from a real
> LLM client?
> - A) It makes a real network call, just to a different server
> - B) It returns a pre-configured, scripted sequence of responses, advancing one item per call ✅
> - C) It only works with text responses, never tool calls
> - D) It requires a real API key to function

> **Q2.** Why does using a scripted, fully-known response sequence make
> grading a learner's loop code possible?
> - A) It doesn't actually help with grading
> - B) Since the exact sequence is known in advance, the loop's correct behavior at each step is fully determined and checkable ✅
> - C) Scripted responses make grading impossible
> - D) Grading only becomes possible with a real API key

> **Q3.** What does the loop check at each iteration to decide what to
> do next?
> - A) The length of the messages list
> - B) `block.type` — whether the response is a tool-use block or a text block ✅
> - C) How many tokens the response contains
> - D) Whether the user has sent a new message

> **Q4.** What does `get_weather(**block.input)` actually do?
> - A) It passes `block.input` as a single dict argument, unchanged
> - B) It unpacks `block.input`'s key-value pairs directly into keyword arguments matching the function's parameters ✅
> - C) It converts `block.input` into a string first
> - D) It ignores `block.input` entirely

> **Q5.** What breaks about a hardcoded, single-tool loop the moment a
> second tool is added?
> - A) Nothing breaks — the original loop already handles any number of tools
> - B) The loop only knows how to call one specific function — a second tool has nowhere to be dispatched to without further hardcoded branches ✅
> - C) The fake client stops working entirely
> - D) `block.type` no longer works correctly

> **Q6.** Why does `TOOL_REGISTRY[block.name]` work as a dispatch
> mechanism?
> - A) It doesn't actually work — it's just illustrative pseudocode
> - B) Python functions are ordinary objects that can be stored as dict values, so looking up a name retrieves the actual callable to invoke ✅
> - C) `block.name` is automatically converted into a function by Python
> - D) The registry only works with exactly two tools

> **Q7.** What has to change in the loop's own code when a third tool
> gets added, using the registry approach?
> - A) The entire loop needs to be rewritten
> - B) Nothing in the loop's logic changes — only one new entry needs to be added to the registry ✅
> - C) A new branch must be added, exactly like the hardcoded version
> - D) The fake client needs to be reconfigured

---

## Comprehensive sandbox

*(end of lesson, applied, multi-file — a complete, dispatch-based agent
loop working against the continuity-thread registry app's operations,
combining every concept from this lesson and Lesson 3's check-before-create
phase ordering)*

*Starter code shown to learner — two file tabs:*

**Tab: `tools.py`**
```python
# in-memory stand-ins for the registry app's operations —
# real HTTP calls to a live API are outside this lesson's scope
_registry = {}

def check_agent_exists(name: str) -> bool:
    """TODO: return True if name is already a key in _registry, else False."""
    pass

def create_agent_entry(name: str, model: str) -> str:
    """
    TODO: store {"model": model} under _registry[name], and return
    the string f"created agent '{name}' with model '{model}'".
    """
    pass

TOOL_REGISTRY = {
    # TODO: map "check_agent_exists" and "create_agent_entry" to the
    # functions above
}
```

**Tab: `agent_loop.py`**
```python
from tools import TOOL_REGISTRY

def run_agent_loop(client, messages):
    """
    TODO: implement the full loop — call client.create(messages=messages),
    check the response's block type, dispatch via TOOL_REGISTRY and
    append both the tool-use and tool-result messages if it's a tool
    call, or return the text if it's a final answer.
    """
    pass
```

*Task shown to learner:* Implement both files so a scripted sequence of
`check_agent_exists` and `create_agent_entry` calls, followed by a
final text response, runs correctly end to end — including actually
updating `_registry`, not just returning plausible-looking results.

*Hidden test cases:*
```python
import tools
from agent_loop import run_agent_loop

client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="check_agent_exists", input={"name": "research_agent"}),
    ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"}),
    TextBlock(text="research_agent has been created with claude-sonnet."),
])

final_answer = run_agent_loop(client, [{"role": "user", "content": "..."}])

assert final_answer == "research_agent has been created with claude-sonnet."
assert client.call_count == 3
assert tools._registry["research_agent"] == {"model": "claude-sonnet"}
```

*Hint (shown on request):* `tools.py`'s three functions are each one or
two lines — `check_agent_exists` is a single `return name in _registry`;
`create_agent_entry` sets `_registry[name] = {"model": model}` then
returns the formatted string; `TOOL_REGISTRY` is exactly [the dict-of-callables pattern from Concept 3](→ this lesson, handling multiple tools a dispatch mechanism concept). `agent_loop.py`'s `run_agent_loop` is [the exact dispatch-based loop from Concept 3's exercise](→ this lesson, handling multiple tools a dispatch mechanism concept), unchanged — only the specific tools being dispatched to have changed.

*Correct answer + explanation (shown on failure, if requested):*

**`tools.py`**
```python
_registry = {}

def check_agent_exists(name: str) -> bool:
    return name in _registry

def create_agent_entry(name: str, model: str) -> str:
    _registry[name] = {"model": model}
    return f"created agent '{name}' with model '{model}'"

TOOL_REGISTRY = {
    "check_agent_exists": check_agent_exists,
    "create_agent_entry": create_agent_entry,
}
```

**`agent_loop.py`**
```python
from tools import TOOL_REGISTRY

def run_agent_loop(client, messages):
    while True:
        response = client.create(messages=messages)
        block = response.content[0]

        if block.type == "tool_use":
            tool_function = TOOL_REGISTRY[block.name]
            result = tool_function(**block.input)
            messages.append({"role": "assistant", "content": [block]})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
```
This is the complete composition this lesson has been building toward:
the fake client drives a fully deterministic, three-step exchange; the
dispatch mechanism correctly routes to `check_agent_exists` first and
`create_agent_entry` second, purely from `block.name`, exactly [the check-before-create phase ordering from Lesson 3's own comprehensive sandbox](→ this module, the system prompt as agent design lesson) — except now that ordering is actually *proven* by the scripted sequence and the loop's real behavior, not just described in a system prompt. This is genuinely the smallest complete agent this course has built so far, and everything from here forward in this module extends it.
