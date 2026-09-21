# Module 2, Lesson 7 — Concept 1: What the loop accumulates — the scratchpad, and why it has to exist

---

## Something that's been true since Lesson 4, never named until now

Every loop built since [Lesson 4](→ this module, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept) has had a `messages` list, growing with every step — but it's never been discussed as a concept in its own right. It's worth naming directly now: this accumulating list is commonly called the agent's **scratchpad** — the working record of everything that's happened in this specific loop run.

---

## Why it has to exist: the model remembers nothing on its own

Ground this directly in [Module 1's statelessness](→ Module 1, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept): the model itself remembers *nothing* between API calls. Every single piece of context it has about what's happened so far comes entirely from what's actually included in `messages`, resent in full, every single time. This means the scratchpad isn't just "conversation history" in some loose sense — it's the agent's **entire** state, full stop. If something isn't in `messages`, it doesn't exist as far as the model is concerned, no matter how recently it actually happened.

---

## Watching it grow, concretely

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

TOOL_REGISTRY = {"get_weather": get_weather}

client = FakeLLMClient(scripted_responses=[
    [ThinkingBlock(thinking="I should check the weather in Paris."), ToolUseBlock(name="get_weather", input={"location": "Paris"})],
    [TextBlock(text="It's sunny in Paris today!")],
])

messages = [{"role": "user", "content": "What's the weather in Paris?"}]
print(f"step 0 -- messages: {len(messages)} entries")

while True:
    response = client.create(messages=messages)
    action_block = None
    for b in response.content:
        if b.type == "thinking":
            print(f"[reasoning]: {b.thinking}")
        else:
            action_block = b

    if action_block.type == "tool_use":
        tool_function = TOOL_REGISTRY[action_block.name]
        result = tool_function(**action_block.input)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        print(f"after tool call -- messages: {len(messages)} entries")
    elif action_block.type == "text":
        print(f"final answer: {action_block.text}")
        break

print(f"final scratchpad size: {len(messages)} entries")
```
```
step 0 -- messages: 1 entries
[reasoning]: I should check the weather in Paris.
after tool call -- messages: 3 entries
final answer: It's sunny in Paris today!
final scratchpad size: 3 entries
```
*(runs live, shows output — read-only demo snippet, not graded)*

`messages` starts with exactly one entry — the original question — and
grows to three by the time the loop finishes: the question, the
model's tool-call turn (with its reasoning preserved inline), and the
tool's result. This list *is* everything the agent knows about this
interaction; there's genuinely nowhere else any of it is being kept.

---

## What this concept is deliberately not covering

Worth being precise about scope: this is the *within-one-loop-run*
accumulating record — not a more sophisticated memory system that
persists across separate, unrelated sessions, involves retrieval, or
handles compaction once a scratchpad grows very large. That fuller
treatment of memory belongs to [a later module entirely](→ this course, the context and memory module) — this lesson's scratchpad is specifically the record of one task, from start to finish, nothing more.

---

## Quiz cards

> **Q1.** What is the agent's "scratchpad," in the terms this concept
> defines it?
> - A) A separate database the model queries independently
> - B) The accumulating `messages` list — the working record of everything that's happened in this specific loop run ✅
> - C) A cache maintained automatically by the LLM provider
> - D) Something entirely separate from the messages sent to the API

> **Q2.** Why does the scratchpad have to be the agent's *entire* state,
> with nothing kept anywhere else?
> - A) This isn't actually true — the model remembers plenty on its own
> - B) The model itself remembers nothing between API calls, so anything not included in `messages` simply doesn't exist as far as the model is concerned ✅
> - C) The scratchpad is optional and can be discarded without consequence
> - D) State is actually stored server-side by the API provider automatically

> **Q3.** In the live demo, what does `messages` growing from 1 entry to
> 3 entries actually represent?
> - A) An unrelated counter with no real connection to the agent's actual state
> - B) The complete accumulated record of the interaction — the original question, the model's tool-call turn, and the tool's result — genuinely everything the agent knows at that point ✅
> - C) A bug that should be fixed by keeping the list at a fixed size
> - D) The number of separate API keys used during the loop

> **Q4.** How does this concept's "scratchpad" differ from a more
> sophisticated memory system covered in a later module?
> - A) They're exactly the same thing, just named differently
> - B) This concept covers only the within-one-loop-run record; persistence across separate sessions, retrieval, and compaction belong to a dedicated later module ✅
> - C) A scratchpad is a real mechanism; the later "memory" module covers something that doesn't actually exist
> - D) The scratchpad is permanent and never needs any further handling

---

*(End of Concept 1. This lesson continues with Concept 2 — serializing
state, from Python objects to JSON — drafted separately.)*
