# Module 2, Lesson 6 — Concept 1: The pain — a loop that never stops

---

## Nothing in the loop itself ever asks "have I done enough?"

Look closely at [every version of the loop built so far](→ this module, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept): it keeps calling the client and dispatching tool calls for exactly as long as the model keeps requesting them, and not one line longer or shorter. There's no step counter, no check for repetition, nothing at all asking "has this actually made progress." If a model gets stuck — repeatedly re-checking the same thing, looping between two tools — the loop has no way to notice on its own.

---

## Watching it actually happen

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

TOOL_REGISTRY = {"get_weather": get_weather}

# a model stuck re-requesting the exact same call, over and over.
# this script is finite (20 responses) only because a demo has to be --
# a real model exhibiting this failure has no such limit at all
repeated_responses = [[ToolUseBlock(name="get_weather", input={"location": "Paris"})] for _ in range(20)]
client = FakeLLMClient(scripted_responses=repeated_responses)

messages = [{"role": "user", "content": "What's the weather in Paris?"}]

while True:
    response = client.create(messages=messages)
    block = response.content[0]
    if block.type == "tool_use":
        result = get_weather(**block.input)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    elif block.type == "text":
        print(f"final answer: {block.text}")
        break
```
```
Traceback (most recent call last):
  File "script.py", line 12, in <module>
    response = client.create(messages=messages)
  File "fake_llm_client.py", line 9, in create
    response_block = self.scripted_responses[self.call_count]
IndexError: list index out of range
```
*(runs live, shows output — read-only demo snippet, not graded)*

The loop ran through all 20 identical, pointless calls to
`get_weather("Paris")` — 20 identical results, no progress made, no
sign anywhere in the loop's own logic that anything was wrong — and it
only actually *stopped* because the demo's finite script ran out and
crashed. A real model genuinely stuck in this pattern isn't limited by
a 20-item list — nothing structurally prevents it from continuing
indefinitely, and this exact loop, run against it, would too.

---

## Why this is a real, expensive risk, not just a theoretical one

Every one of those pointless calls is [a real, billed API request](→ Module 1, quantization cost and operational concerns lesson) — a loop stuck like this doesn't fail loudly and cheaply, it fails by quietly running up real cost, indefinitely, until something *external* to the loop's own logic intervenes. Building that intervention — several different, complementary ways of actually recognizing and stopping this — is exactly what the rest of this lesson covers.

---

## Quiz cards

> **Q1.** What does the loop, as written across every earlier lesson,
> ever check to decide whether it's made enough progress?
> - A) A dedicated step counter built into the loop
> - B) Nothing at all — it only ever checks whether the current response is a tool call or a final text block, with no notion of "progress" or "enough" ✅
> - C) The total number of tokens used so far
> - D) Whether the same tool has been called more than once

> **Q2.** In the demo, why does the loop only actually stop when it
> does?
> - A) It recognizes the repeated calls and intentionally stops
> - B) The finite demo script runs out of scripted responses and crashes with an `IndexError` — nothing about the loop's own logic caused it to stop ✅
> - C) `get_weather` is only allowed to be called 20 times, by design
> - D) The loop has a built-in 20-step limit

> **Q3.** Why is this failure mode described as a real, expensive risk
> rather than just a theoretical concern?
> - A) It has no actual real-world cost, since tool calls are always free
> - B) Every repeated call is a real, billed API request — a stuck loop fails by quietly accumulating real cost indefinitely, not by crashing loudly and cheaply ✅
> - C) This failure mode can only occur in a testing environment, never in production
> - D) Repeated tool calls are always automatically deduplicated by the API

---

*(End of Concept 1. This lesson continues with Concept 2 — max steps,
the first, simplest fix — drafted separately.)*
