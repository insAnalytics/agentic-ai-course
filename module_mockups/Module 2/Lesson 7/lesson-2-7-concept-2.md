# Module 2, Lesson 7 — Concept 2: Serializing state — from Python objects to JSON

---

## The pain: the scratchpad isn't plain JSON-serializable data

Saving the scratchpad to a file — [needed for checkpoint and resume, covered next](→ this lesson, checkpoint and resume concept) — means converting it to text first, and [JSON is the natural choice](→ Module 0, the I/O and error handling lesson, working with json concept). But the scratchpad's assistant-turn entries contain real Python objects — `ThinkingBlock`, `ToolUseBlock` instances — not plain dicts:

```python
import json

messages = [
    {"role": "user", "content": "What's the weather in Paris?"},
    {"role": "assistant", "content": [ThinkingBlock(thinking="I should check."), ToolUseBlock(name="get_weather", input={"location": "Paris"})]},
]

json.dumps(messages)
```
```
Traceback (most recent call last):
  File "script.py", line 6, in <module>
    json.dumps(messages)
  File "json/encoder.py", line 199, in encode
TypeError: Object of type ThinkingBlock is not JSON serializable
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is a related but genuinely different failure from [Module 0's JSON coverage](→ Module 0, the I/O and error handling lesson, working with json concept, the when the json itself is malformed json decode error explanation) — that was about *parsing* malformed JSON text; this is the reverse direction, *serializing* something that was never JSON-shaped data to begin with.

---

## The fix: a `to_dict()` method, and a helper that applies it

Give each block class a `to_dict()` method converting it into a plain,
JSON-serializable dict, then write a helper that walks the scratchpad,
applying that conversion wherever it's actually needed:

```python
class ThinkingBlock:
    def __init__(self, thinking: str):
        self.type = "thinking"
        self.thinking = thinking

    def to_dict(self) -> dict:
        return {"type": self.type, "thinking": self.thinking}

class ToolUseBlock:
    def __init__(self, name: str, input: dict):
        self.type = "tool_use"
        self.name = name
        self.input = input

    def to_dict(self) -> dict:
        return {"type": self.type, "name": self.name, "input": self.input}

def serialize_messages(messages: list) -> list:
    serializable = []
    for message in messages:
        content = message["content"]
        if isinstance(content, list):
            content = [block.to_dict() if hasattr(block, "to_dict") else block for block in content]
        serializable.append({"role": message["role"], "content": content})
    return serializable

serialized = serialize_messages(messages)
print(json.dumps(serialized, indent=2))
```
```
[
  {
    "role": "user",
    "content": "What's the weather in Paris?"
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "thinking",
        "thinking": "I should check."
      },
      {
        "type": "tool_use",
        "name": "get_weather",
        "input": {
          "location": "Paris"
        }
      }
    ]
  }
]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`hasattr(block, "to_dict")` — [the same attribute-checking pattern from earlier in this course](→ Module 0, the OOP lesson) — correctly handles a *mixed* content list: a real `ThinkingBlock`/`ToolUseBlock` gets converted via `.to_dict()`, while an already-plain dict (like a `tool_result` entry, built directly as a dict from the start) passes through unchanged, since it has no `to_dict` method to call at all.

---

## Quiz cards

> **Q1.** Why does `json.dumps(messages)` fail directly on the raw
> scratchpad?
> - A) The scratchpad contains too much data for `json.dumps` to handle
> - B) It contains real Python objects — `ThinkingBlock`, `ToolUseBlock` instances — which `json.dumps` has no built-in way to convert into JSON ✅
> - C) `json.dumps` only works on strings, never lists
> - D) This is identical to a `JSONDecodeError`, just under a different name

> **Q2.** What does a `to_dict()` method on `ThinkingBlock` actually do?
> - A) It converts the block into a JSON-formatted string directly
> - B) It converts the block into a plain, JSON-serializable dict, which `json.dumps` can then handle normally ✅
> - C) It deletes the block's data entirely
> - D) It's required syntax with no actual functional effect

> **Q3.** Why does `serialize_messages` check `hasattr(block, "to_dict")`
> before calling it, rather than calling `.to_dict()` on every content
> item unconditionally?
> - A) This check is unnecessary and has no real purpose
> - B) Some content items — like `tool_result` entries — are already plain dicts with no `to_dict` method, so calling it unconditionally would raise an error on those ✅
> - C) `hasattr` is required syntax for any dict-related operation
> - D) `to_dict` only exists on the very first item in any content list

---

## Applied sandbox exercise 1

*(implementing the serialization helper — genuinely graded against a
scratchpad containing a real mix of custom objects and plain dicts)*

*Task shown to learner:* Given `ThinkingBlock` and `ToolUseBlock` (both
with `to_dict()` already implemented, as shown above), implement
`serialize_messages(messages)` so the result is genuinely passable to
`json.dumps()` without error, correctly handling both custom-object
content lists and already-plain-dict content (like a `tool_result`
message's content, or a plain string user message).

*Hidden test cases:*
```python
messages = [
    {"role": "user", "content": "What's the weather in Paris?"},
    {"role": "assistant", "content": [ThinkingBlock(thinking="Checking now."), ToolUseBlock(name="get_weather", input={"location": "Paris"})]},
    {"role": "user", "content": [{"type": "tool_result", "content": "It's sunny in Paris."}]},
]

serialized = serialize_messages(messages)
json_text = json.dumps(serialized)   # must not raise
round_tripped = json.loads(json_text)

assert round_tripped[1]["content"][0] == {"type": "thinking", "thinking": "Checking now."}
assert round_tripped[2]["content"][0] == {"type": "tool_result", "content": "It's sunny in Paris."}
```

*Hint (shown on request):* This concept's exact `serialize_messages`
implementation is the answer — loop through `messages`, and for any
entry whose `content` is a list, build a new list converting each item
via `.to_dict()` only if that item actually has one.

*Correct answer + explanation (shown on failure, if requested):*
```python
def serialize_messages(messages: list) -> list:
    serializable = []
    for message in messages:
        content = message["content"]
        if isinstance(content, list):
            content = [block.to_dict() if hasattr(block, "to_dict") else block for block in content]
        serializable.append({"role": message["role"], "content": content})
    return serializable
```
The test confirms both real cases: a `ThinkingBlock` genuinely converts
to its dict form, and an already-plain `tool_result` dict passes
through completely unchanged — the exact mixed-content handling this
concept's demo already proved correct.

---

*(End of Concept 2. This lesson continues with Concept 3 — checkpoint
and resume — drafted separately.)*
