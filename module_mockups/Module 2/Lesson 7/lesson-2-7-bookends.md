# Agent State and the Scratchpad

> **You'll be able to**
> - Explain why the accumulating `messages` list is the agent's entire
>   state, grounded in the model's own statelessness
> - Serialize a scratchpad containing custom block objects into genuine
>   JSON, correctly handling a mix of objects and already-plain dicts
> - Implement a full checkpoint-and-resume cycle, and explain why
>   resuming doesn't require reconstructing the original objects

**Why it matters**
Every loop built since Lesson 4 has quietly depended on the scratchpad
without ever naming it — this lesson makes that dependency explicit and
gives it real infrastructure: the ability to save real, in-progress
agent work and pick it back up without redoing anything already
completed. For any task that runs long enough to actually risk
interruption, this isn't optional infrastructure — it's the difference
between a system that can run unattended and one that can't.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all three concepts, mixed order)*

> **Q1.** What is the agent's "scratchpad"?
> - A) A separate database the model queries independently
> - B) The accumulating `messages` list — the working record of everything that's happened in this specific loop run ✅
> - C) A cache maintained automatically by the LLM provider
> - D) Something entirely separate from the messages sent to the API

> **Q2.** Why does the scratchpad have to be the agent's entire state?
> - A) This isn't actually true
> - B) The model remembers nothing between API calls, so anything not included in `messages` doesn't exist as far as the model is concerned ✅
> - C) The scratchpad is optional
> - D) State is stored server-side automatically

> **Q3.** Why does `json.dumps(messages)` fail directly on the raw
> scratchpad?
> - A) The scratchpad contains too much data
> - B) It contains real Python objects — `ThinkingBlock`, `ToolUseBlock` — which `json.dumps` has no built-in way to convert ✅
> - C) `json.dumps` only works on strings
> - D) This is identical to a `JSONDecodeError`

> **Q4.** What does a `to_dict()` method actually do?
> - A) It converts the block into a JSON-formatted string directly
> - B) It converts the block into a plain, JSON-serializable dict ✅
> - C) It deletes the block's data
> - D) It has no functional effect

> **Q5.** Why does `serialize_messages` check `hasattr(block, "to_dict")`
> before calling it?
> - A) This check is unnecessary
> - B) Some content items, like `tool_result` entries, are already plain dicts with no `to_dict` method ✅
> - C) `hasattr` is required for any dict operation
> - D) `to_dict` only exists on the first content item

> **Q6.** Why does interrupting a long-running task without a checkpoint
> mechanism risk real, unnecessary cost?
> - A) It doesn't — restarting is always free
> - B) Without saved state, resuming means redoing every step already completed, including real, already-paid-for calls ✅
> - C) Checkpointing has no relationship to cost
> - D) This only applies to single-tool tasks

> **Q7.** Why doesn't `load_checkpoint` need to reconstruct
> `ThinkingBlock`/`ToolUseBlock` objects?
> - A) It actually does need to
> - B) Resuming only needs `messages` to be valid, re-sendable data going forward — not the exact original objects ✅
> - C) These objects don't need to be saved at all
> - D) `load_checkpoint` is only for reading, never resuming

---

## Comprehensive sandbox

*(end of lesson, applied, multi-file — a genuine checkpoint-and-resume
cycle for the registry app, proving a partially-completed task can be
saved, reloaded, and finished without redoing already-completed work)*

*Context provided:* `tools.py` unchanged, and `serialize_messages`,
`save_checkpoint`, `load_checkpoint` from this lesson.

*Starter code shown to learner — one file tab:*

**Tab: `checkpoint_demo.py`**
```python
import tools

def run_partial_session(client, initial_messages: list) -> list:
    """
    TODO: run the loop for exactly one tool-call step (call the client,
    execute the resulting tool call via TOOL_REGISTRY, append the
    assistant and tool_result messages), then return the updated
    messages list WITHOUT continuing further — simulating a session
    that gets interrupted right after this one step.
    """
    pass

def resume_and_finish(client, resumed_messages: list) -> str:
    """
    TODO: continue the loop from resumed_messages — call the client,
    and return the text once a final text block arrives. Assume this
    session's client is scripted to finish in one more call.
    """
    pass
```

*Task shown to learner:* Implement both functions, then use them
together with `save_checkpoint`/`load_checkpoint` to prove a full
interrupted-and-resumed cycle: run one step, save, "restart" by loading
the checkpoint, and finish — confirming the tool call from before the
checkpoint is never repeated.

*Hidden test cases:*
```python
tools._registry.clear()

session_1_client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
])
messages_after_step_1 = run_partial_session(session_1_client, [{"role": "user", "content": "..."}])
save_checkpoint(messages_after_step_1, "session_checkpoint.json")

# proves the entry was genuinely created during session 1, before any "resume"
assert tools._registry["research_agent"] == {"model": "claude-sonnet"}

resumed_messages = load_checkpoint("session_checkpoint.json")
session_2_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="research_agent has been created with claude-sonnet.")],
])
final_answer = resume_and_finish(session_2_client, resumed_messages)

assert final_answer == "research_agent has been created with claude-sonnet."
assert session_2_client.call_count == 1   # never repeats the already-completed tool call
```

*Hint (shown on request):* `run_partial_session` is a single iteration
of [the familiar dispatch pattern](→ this module, writing the loop by hand lesson, handling multiple tools a dispatch mechanism concept), returning the updated `messages` instead of looping further. `resume_and_finish` is even simpler — one `client.create(messages=resumed_messages)` call, returning `response.content[0].text` directly, since its scripted client is set up to finish immediately.

*Correct answer + explanation (shown on failure, if requested):*
```python
from tools import TOOL_REGISTRY
import tools

def run_partial_session(client, initial_messages: list) -> list:
    response = client.create(messages=initial_messages)
    block = response.content[0]
    tool_function = TOOL_REGISTRY[block.name]
    result = tool_function(**block.input)
    messages = initial_messages + [
        {"role": "assistant", "content": response.content},
        {"role": "user", "content": [{"type": "tool_result", "content": result}]},
    ]
    return messages

def resume_and_finish(client, resumed_messages: list) -> str:
    response = client.create(messages=resumed_messages)
    return response.content[0].text
```
This is the real payoff of everything this lesson built: `tools.py`
already has `research_agent` recorded after session 1 alone —
`save_checkpoint` captures that same fact in `messages`, and
`resume_and_finish`'s client never needs to touch `create_agent_entry`
again, since the checkpoint already carries the completed work forward.
A genuinely interrupted, genuinely resumed task, finishing correctly
without redoing anything real.
