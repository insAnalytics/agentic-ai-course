# Module 2, Lesson 7 — Concept 3: Checkpoint and resume

---

## Why this matters: interrupted work shouldn't mean starting over

A long-running task, interrupted partway through — a crash, a planned
pause, a process restart — shouldn't mean redoing every step already
completed, [re-paying real cost for work already done](→ Module 1, quantization cost and operational concerns lesson). Saving the scratchpad periodically, and being able to load it back to resume exactly where things left off, is the fix — [a direct application of Module 0's file I/O](→ Module 0, the I/O and error handling lesson, file i o and context managers concept), combined with [Concept 2's serialization](→ this lesson, serializing state from python objects to json concept).

---

## Saving and loading

```python
import json

def save_checkpoint(messages: list, filepath: str) -> None:
    serialized = serialize_messages(messages)
    with open(filepath, "w") as f:
        json.dump(serialized, f, indent=2)

def load_checkpoint(filepath: str) -> list:
    with open(filepath, "r") as f:
        return json.load(f)
```

Worth noticing what `load_checkpoint` *doesn't* need to do: it doesn't
reconstruct `ThinkingBlock`/`ToolUseBlock` objects from the saved dicts
— resuming the loop only ever needs `messages` to be valid,
re-sendable data going forward, not the exact original Python objects.
Serialization is genuinely a one-way trip; nothing about resuming
requires reversing it.

---

## A full checkpoint-and-resume cycle

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

TOOL_REGISTRY = {"get_weather": get_weather}

# --- first "session": complete one step, then save and stop ---
client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="get_weather", input={"location": "Paris"})],
])

messages = [{"role": "user", "content": "What's the weather in Paris?"}]
response = client.create(messages=messages)
block = response.content[0]
result = get_weather(**block.input)
messages.append({"role": "assistant", "content": response.content})
messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})

save_checkpoint(messages, "checkpoint.json")
print("checkpoint saved -- session ends here")

# --- second "session": resume from the checkpoint ---
resumed_messages = load_checkpoint("checkpoint.json")
print(f"resumed with {len(resumed_messages)} messages already recorded")

resumed_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="It's sunny in Paris today!")],
])
response = resumed_client.create(messages=resumed_messages)
final_block = response.content[0]
print(f"final answer: {final_block.text}")
```
```
checkpoint saved -- session ends here
resumed with 3 messages already recorded
final answer: It's sunny in Paris today!
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second "session" — a completely fresh client, only holding the
*remaining* scripted response — never redoes the `get_weather` call at
all. It resumes with all three already-recorded messages loaded
directly from the file, and produces the correct final answer using
exactly that resumed state, precisely as though the first session had
simply continued uninterrupted.

---

## Quiz cards

> **Q1.** Why does interrupting a long-running agent task without any
> checkpoint mechanism risk real, unnecessary cost?
> - A) It doesn't — restarting a task is always free
> - B) Without saved state, resuming means redoing every step already completed, including real, already-paid-for API calls ✅
> - C) Checkpointing has no relationship to cost at all
> - D) This risk only applies to tasks involving exactly one tool call

> **Q2.** Why doesn't `load_checkpoint` need to reconstruct
> `ThinkingBlock`/`ToolUseBlock` objects from the saved data?
> - A) It actually does need to, and this is a bug in the demo
> - B) Resuming the loop only needs `messages` to be valid, re-sendable data going forward — nothing about continuing the loop requires the exact original Python objects back ✅
> - C) `ThinkingBlock` and `ToolUseBlock` don't actually need to be saved at all
> - D) `load_checkpoint` is only used for reading, never for actually resuming a loop

> **Q3.** In the demo, why doesn't the second "session" need to call
> `get_weather` again?
> - A) `get_weather` is called automatically behind the scenes regardless
> - B) That step's result was already captured in the checkpoint and loaded back as part of `resumed_messages`, so it's already part of the state the resumed loop starts from ✅
> - C) The second session's client happens to already know the answer
> - D) `get_weather` only needs to be called once per program run globally

---

## Applied sandbox exercise 2

*(implementing checkpoint save/load — genuinely graded against a full
save-then-resume cycle)*

*Task shown to learner:* Implement `save_checkpoint(messages, filepath)`
and `load_checkpoint(filepath)` as shown in this concept — using
`serialize_messages` (from Concept 2, provided) before writing, and
plain `json.load` when reading back.

*Hidden test cases:*
```python
original_messages = [
    {"role": "user", "content": "Test question"},
    {"role": "assistant", "content": [ThinkingBlock(thinking="Thinking..."), ToolUseBlock(name="get_weather", input={"location": "Berlin"})]},
]

save_checkpoint(original_messages, "test_checkpoint.json")
resumed = load_checkpoint("test_checkpoint.json")

assert resumed[0] == {"role": "user", "content": "Test question"}
assert resumed[1]["content"][0] == {"type": "thinking", "thinking": "Thinking..."}
assert resumed[1]["content"][1] == {"type": "tool_use", "name": "get_weather", "input": {"location": "Berlin"}}
```

*Hint (shown on request):* Both functions are short — `save_checkpoint`
calls `serialize_messages` then writes the result with `json.dump`
inside a `with open(filepath, "w") as f:` block; `load_checkpoint`
just opens the file for reading and returns `json.load(f)` directly.

*Correct answer + explanation (shown on failure, if requested):*
```python
def save_checkpoint(messages: list, filepath: str) -> None:
    serialized = serialize_messages(messages)
    with open(filepath, "w") as f:
        json.dump(serialized, f, indent=2)

def load_checkpoint(filepath: str) -> list:
    with open(filepath, "r") as f:
        return json.load(f)
```
The test confirms a genuine round trip: a scratchpad containing real
`ThinkingBlock`/`ToolUseBlock` objects gets saved, and loading it back
produces exactly the plain-dict equivalents — proving the data survives
the save-and-reload cycle intact and ready to resume with.

---

*(End of Concept 3 — final concept section of Lesson 7. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
