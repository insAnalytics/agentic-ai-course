# Module 2, Lesson 6 — Concept 5: Tool errors as observations, not exceptions

---

## The pain: an unhandled tool error crashes the entire loop

Every tool call in this loop so far has assumed the tool succeeds.
Real tools fail — invalid input, a genuine conflict, something outside
the caller's control. With no handling in place, that failure
*propagates straight up* and crashes the whole loop:

```python
def create_agent_entry(name: str, model: str) -> str:
    if name in tools._registry:
        raise ValueError(f"an agent named '{name}' already exists")
    tools._registry[name] = {"model": model}
    return f"created agent '{name}' with model '{model}'"

tools._registry["research_agent"] = {"model": "claude-sonnet"}   # already exists

block_input = {"name": "research_agent", "model": "claude-sonnet"}
result = create_agent_entry(**block_input)   # raises, crashing right here
```
```
Traceback (most recent call last):
  File "script.py", line 8, in <module>
    result = create_agent_entry(**block_input)
  File "script.py", line 3, in create_agent_entry
    raise ValueError(f"an agent named '{name}' already exists")
ValueError: an agent named 'research_agent' already exists
```
*(runs live, shows output — read-only demo snippet, not graded)*

The entire interaction ends abruptly, with a raw traceback — no chance
for the agent to recognize the problem, try something different, or
even tell the user what went wrong.

---

## The fix: catch it, and let the model see it

Wrap the tool call [in `try`/`except`, exactly the mechanism from Module 0's error-handling lesson](→ Module 0, the Python setup lesson, error handling concept) — but instead of the error's audience being a human reading a traceback, its audience is now the *model itself*, delivered as an ordinary `tool_result` message, exactly like a successful result would be:

```python
def run_agent_loop_with_error_handling(client, messages, max_steps=10):
    for step_count in range(1, max_steps + 1):
        response = client.create(messages=messages)
        block = response.content[0]
        if block.type == "tool_use":
            tool_function = TOOL_REGISTRY[block.name]
            try:
                result = tool_function(**block.input)
            except Exception as e:
                result = f"Error: {str(e)}"
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
    return f"stopped after reaching the maximum of {max_steps} steps without a final answer"

client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
    [TextBlock(text="It looks like research_agent already exists, so I wasn't able to create it again.")],
])

result = run_agent_loop_with_error_handling(client, [{"role": "user", "content": "..."}])
print(result)
```
```
It looks like research_agent already exists, so I wasn't able to create it again.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The `ValueError` still happens — the tool genuinely still fails — but
`except Exception as e: result = f"Error: {str(e)}"` catches it and
turns it into ordinary `tool_result` content instead of letting it
crash anything. The loop continues normally; the model receives the
error as information and produces a sensible response about it, rather
than the entire interaction simply ending.

---

## Quiz cards

> **Q1.** What happens to the loop if a tool call raises an exception
> with no error handling in place?
> - A) The loop automatically catches it and continues normally
> - B) The exception propagates straight up and crashes the entire loop, ending the interaction abruptly ✅
> - C) The exception is silently ignored, and the loop continues as if nothing happened
> - D) Only the specific tool call fails; every other part of the system keeps running unaffected

> **Q2.** What does wrapping the tool call in `try`/`except` actually
> change about who "sees" a tool's error?
> - A) Nothing changes — the error's audience is always a human reading a traceback
> - B) The error becomes an ordinary `tool_result` message the model itself receives and can react to, rather than a raw traceback only a human developer would see ✅
> - C) The error is deleted entirely and never seen by anyone
> - D) The error is only visible in a separate logging system, never part of the conversation

> **Q3.** Why does turning a tool error into a `tool_result` message
> matter practically, compared to letting it crash the loop?
> - A) It has no practical benefit — both approaches produce identical outcomes
> - B) It gives the agent an actual chance to recognize the problem and respond sensibly — trying something different, or explaining the failure to the user — rather than the whole interaction simply ending ✅
> - C) It prevents the error from ever actually being a real problem
> - D) It only matters for errors that occur on the very first tool call

---

*(End of Concept 5. This lesson continues with Concept 6 — timeouts,
retry with backoff, and graceful give-up — drafted separately.)*
