# Module 2, Lesson 6 — Concept 4: Goal-state termination checks

---

## Stopping because something went right, not just because something went wrong

[Max steps and repeated-action detection](→ this lesson, max steps the first simplest fix concept; → this lesson, repeated action detection concept) both stop the loop by recognizing a *failure* signal — too long, or stuck. This concept covers a genuinely different kind of check: does the surrounding *code* have a way to directly verify the actual goal has been achieved, independent of whether the model itself has gotten around to announcing it's done?

---

## A deterministic check on real state

If the task's success condition is something the code can check
directly — did a specific entry actually get created, does a specific
file now exist — that check can run after any state-changing tool call,
terminating the loop the *moment* the real goal is satisfied, rather
than waiting for the model to eventually produce a `text` block saying
so:

```python
def run_agent_loop_with_goal_check(client, messages, target_agent_name: str, max_steps: int = 10):
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
            result = tool_function(**block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})

            if target_agent_name in tools._registry:
                return f"goal reached: '{target_agent_name}' now exists in the registry"
        elif block.type == "text":
            return block.text
    return f"stopped after reaching the maximum of {max_steps} steps without a final answer"
```

```python
client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
    [ToolUseBlock(name="check_agent_exists", input={"name": "research_agent"})],
    [TextBlock(text="research_agent has been created.")],
])

result = run_agent_loop_with_goal_check(client, [{"role": "user", "content": "..."}], target_agent_name="research_agent", max_steps=10)
print(result)
print(f"stopped after {client.call_count} calls")
```
```
goal reached: 'research_agent' now exists in the registry
stopped after 1 calls
```
*(runs live, shows output — read-only demo snippet, not graded)*

The scripted sequence has *three* responses queued up — including an
unnecessary re-check the model would otherwise have made before
eventually reaching the `text` block — but the loop never gets there,
since `target_agent_name in tools._registry` already becomes true
immediately after the very first tool call. Two entirely avoidable
calls never happen at all: a real efficiency gain, not just a
correctness one.

---

## What this concept stays scoped to

Worth being precise about the boundary here: this is a *deterministic*,
code-evaluated check — the surrounding code directly verifying real
state, nothing more sophisticated. A different, more advanced version —
the *model itself* judging whether its own work satisfies some
checklist or rubric — is a genuinely different mechanism, covered
properly [later in this module](→ this module, reflection and self critique lesson), not here. This concept's version only works when success is something code can check directly and simply; it isn't a substitute for that more sophisticated case.

---

## Quiz cards

> **Q1.** What kind of signal does a goal-state check rely on, compared
> to max steps or repeated-action detection?
> - A) The exact same failure signal as the other two guards
> - B) A success signal — deterministically verifying that the real goal has actually been achieved, rather than detecting that something has gone wrong ✅
> - C) The model's own stated confidence in its answer
> - D) The total token cost accumulated so far

> **Q2.** In the demo, why does the loop stop after only 1 call, even
> though the scripted sequence had 3 responses available?
> - A) The fake client only allows 1 call per loop run
> - B) The goal-state check — `target_agent_name in tools._registry` — becomes true immediately after the first tool call, so the loop returns before ever reaching the remaining scripted responses ✅
> - C) This is a bug; the loop should have used all 3 responses
> - D) `max_steps` was set to 1 for this specific demo

> **Q3.** What does this concept explicitly distinguish itself from,
> covered later in this module instead?
> - A) Max steps and repeated-action detection
> - B) The model itself judging whether its own work satisfies a checklist or rubric — a genuinely different, more sophisticated mechanism ✅
> - C) Tool dispatch via a registry
> - D) The fake LLM client's basic usage

---

*(End of Concept 4. This lesson continues with Concept 5 — tool errors
as observations, not exceptions — drafted separately.)*
