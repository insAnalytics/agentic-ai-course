# Termination, Failure, and Control

> **You'll be able to**
> - Explain why an agent loop has no natural stopping point on its own,
>   and demonstrate the real cost risk that creates
> - Implement `max_steps` as a hard backstop, and explain its honest
>   limitation
> - Implement repeated-action detection as a sharper, earlier-triggering
>   guard, complementary to max steps
> - Implement a deterministic goal-state check as a third, success-based
>   stopping mechanism, distinct from the model's own reasoning judgment
> - Turn a tool's exception into an observation the model can react to,
>   rather than letting it crash the loop
> - Implement retry with exponential backoff for a transiently-failing
>   tool, and a defined, graceful give-up path once retries are exhausted

**Why it matters**
[Lesson 4's loop](→ this module, writing the loop by hand lesson) works — but only under the assumption that everything goes right. This lesson is what makes it something you'd actually trust running unattended: every control mechanism here exists because something specific, real, and costly can go wrong, and each one is a deliberate, code-level answer to a distinct failure mode, not a vague safety net.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** What does the loop, as written in earlier lessons, ever check
> to decide whether it's made enough progress?
> - A) A dedicated step counter built into the loop
> - B) Nothing at all — it only checks whether the response is a tool call or final text ✅
> - C) The total number of tokens used
> - D) Whether the same tool has been called more than once

> **Q2.** What does `max_steps` actually guarantee about a loop?
> - A) That the task will always be completed within the limit
> - B) That the loop stops after a fixed number of iterations, regardless of whether the task was actually completed ✅
> - C) That repeated calls are automatically detected
> - D) That the model always receives a warning before the limit

> **Q3.** What's the real, honest limitation of `max_steps`?
> - A) It has no limitations
> - B) It can't distinguish genuine multi-step progress from useless looping — both get cut off identically ✅
> - C) It only works for tasks involving one tool
> - D) It can only be set to 10

> **Q4.** What does repeated-action detection actually check for?
> - A) Whether a fixed step limit has been exceeded
> - B) Whether the exact same tool call — same name, same arguments — has already been made ✅
> - C) Whether the model has taken too long
> - D) Whether any tool call has ever failed

> **Q5.** What kind of signal does a goal-state check rely on, compared
> to max steps or repeated-action detection?
> - A) The same failure signal as the other two guards
> - B) A success signal — deterministically verifying the real goal has actually been achieved ✅
> - C) The model's own stated confidence
> - D) Total accumulated token cost

> **Q6.** What does this lesson explicitly distinguish goal-state checks
> from, covered later in this module?
> - A) Max steps and repeated-action detection
> - B) The model itself judging whether its own work satisfies a checklist — a genuinely different, more sophisticated mechanism ✅
> - C) Tool dispatch via a registry
> - D) The fake LLM client

> **Q7.** What happens to the loop if a tool call raises an exception
> with no error handling?
> - A) The loop automatically catches it and continues
> - B) The exception propagates up and crashes the entire loop ✅
> - C) The exception is silently ignored
> - D) Only that tool call fails; everything else keeps running

> **Q8.** What's the actual difference between Concept 5's failure and
> Concept 6's?
> - A) No real difference
> - B) Concept 5 covers a definitive failure unlikely to change on retry; Concept 6 covers a failure that might genuinely succeed if tried again ✅
> - C) Concept 5's failures are always more severe
> - D) Concept 6 only applies to tools that never succeed

> **Q9.** What does `call_with_retry` return once `max_retries` is
> exhausted?
> - A) It raises the original exception
> - B) A clear, defined error string — never a crash, never an unbounded retry ✅
> - C) It retries forever
> - D) It silently returns `None`

---

## Comprehensive sandbox

*(end of lesson, applied, multi-file — hardening the registry loop with
every mechanism from this lesson combined: `max_steps`, repeated-action
detection, a goal-state check, and safe tool execution combining
Concepts 5 and 6's error handling)*

*Context provided:* `tools.py` from [Lesson 4](→ this module, writing the loop by hand lesson), unchanged.

*Starter code shown to learner — one file tab:*

**Tab: `agent_loop.py`**
```python
from tools import TOOL_REGISTRY
import tools

def execute_tool_safely(tool_function, max_retries: int = 3, **kwargs):
    """
    TODO: retry on ConnectionError with exponential backoff (2 ** attempt);
    on any OTHER exception, return f"Error: {str(e)}" immediately, no
    retry; if all retries are exhausted, return
    f"Error: tool failed after {max_retries} attempts, giving up".
    """
    pass

def run_agent_loop(client, messages, target_agent_name: str, max_steps: int = 10):
    """
    TODO: the fully hardened loop — max_steps cap, repeated-action
    detection, dispatch via execute_tool_safely, and a goal-state check
    (target_agent_name in tools._registry) after each tool call.
    """
    pass
```

*Task shown to learner:* Implement both functions, combining every
guard from this lesson into one hardened loop.

*Hidden test cases:*
```python
import tools
from agent_loop import run_agent_loop

# scenario 1: success, caught early by the goal-state check
tools._registry.clear()
client_1 = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
    [ToolUseBlock(name="check_agent_exists", input={"name": "research_agent"})],  # never reached
])
result_1 = run_agent_loop(client_1, [{"role": "user", "content": "..."}], target_agent_name="research_agent")
assert "goal reached" in result_1
assert client_1.call_count == 1

# scenario 2: stuck loop, caught by repeated-action detection
tools._registry.clear()
client_2 = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="check_agent_exists", input={"name": "ghost_agent"})] for _ in range(20)
])
result_2 = run_agent_loop(client_2, [{"role": "user", "content": "..."}], target_agent_name="ghost_agent")
assert "repeated call" in result_2
assert client_2.call_count == 2

# scenario 3: a real, definitive tool error handled gracefully
tools._registry["research_agent"] = {"model": "claude-sonnet"}
client_3 = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
    [TextBlock(text="research_agent already exists, so I couldn't create it again.")],
])
result_3 = run_agent_loop(client_3, [{"role": "user", "content": "..."}], target_agent_name="new_agent_that_wont_exist")
assert result_3 == "research_agent already exists, so I couldn't create it again."
```

*Hint (shown on request):* `execute_tool_safely` combines [Concept 5's immediate catch for a definitive error](→ this lesson, tool errors as observations not exceptions concept) with [Concept 6's retry loop for a transient one](→ this lesson, timeouts retry with backoff and graceful give up concept) — two separate `except` clauses inside the same `for attempt in range(max_retries):` loop. `run_agent_loop` combines [Concept 3's `seen_calls` check](→ this lesson, repeated action detection concept), [Concept 4's goal-state check](→ this lesson, goal state termination checks concept), and dispatch through `execute_tool_safely` instead of a bare function call — every earlier concept's exact code, assembled into one function.

*Correct answer + explanation (shown on failure, if requested):*
```python
from tools import TOOL_REGISTRY
import tools

def execute_tool_safely(tool_function, max_retries: int = 3, **kwargs):
    for attempt in range(max_retries):
        wait_time = 2 ** attempt
        try:
            return tool_function(**kwargs)
        except ConnectionError as e:
            print(f"attempt {attempt + 1} failed ({e}), waiting {wait_time}s before retrying")
        except Exception as e:
            return f"Error: {str(e)}"
    return f"Error: tool failed after {max_retries} attempts, giving up"

def run_agent_loop(client, messages, target_agent_name: str, max_steps: int = 10):
    seen_calls = []
    for step_count in range(1, max_steps + 1):
        response = client.create(messages=messages)
        block = response.content[0]
        if block.type == "tool_use":
            current_call = (block.name, block.input)
            if current_call in seen_calls:
                return f"stopped after detecting a repeated call to {block.name} with the same arguments"
            seen_calls.append(current_call)

            tool_function = TOOL_REGISTRY[block.name]
            result = execute_tool_safely(tool_function, **block.input)

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})

            if target_agent_name in tools._registry:
                return f"goal reached: '{target_agent_name}' now exists in the registry"
        elif block.type == "text":
            return block.text
    return f"stopped after reaching the maximum of {max_steps} steps without a final answer"
```
Every guard from this lesson does real, distinct work in these three
scenarios: goal-state detection ends scenario 1 after a single call,
before two entirely avoidable ones; repeated-action detection catches
scenario 2's stuck pattern on the second identical call, not the
twentieth; and `execute_tool_safely`'s immediate, no-retry `except
Exception` branch handles scenario 3's genuine, definitive conflict
cleanly, letting the model produce a real, sensible explanation instead
of crashing the whole interaction. This is the fully hardened version
of the loop this entire lesson has been building toward.
