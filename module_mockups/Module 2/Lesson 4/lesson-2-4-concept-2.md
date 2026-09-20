# Module 2, Lesson 4 — Concept 2: From round trip to loop — the minimal viable transformation

---

## The actual loop, written and running for real

[Lesson 1 introduced the loop conceptually](→ this module, agents workflows and the loop lesson, what an agent is structurally the perceive reason act observe cycle concept), using an illustrative, pre-scripted sequence of decisions. Using [the fake client from Concept 1](→ this lesson, the fake llm client what it is and how to use it concept), this concept writes the real thing — a genuine `while` loop, actually calling a client, actually executing a tool, actually deciding when to stop:

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="get_weather", input={"location": "Paris"}),
    TextBlock(text="It's sunny in Paris today!"),
])

messages = [{"role": "user", "content": "What's the weather in Paris?"}]

while True:
    response = client.create(messages=messages)
    block = response.content[0]

    if block.type == "tool_use":
        result = get_weather(**block.input)
        messages.append({"role": "assistant", "content": [block]})
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    elif block.type == "text":
        print(f"final answer: {block.text}")
        break

print(f"total messages: {len(messages)}")
```
```
final answer: It's sunny in Paris today!
total messages: 3
```
*(runs live, shows output — read-only demo snippet, not graded)*

`get_weather(**block.input)` — [the exact `**` argument-unpacking mechanism from Module 0](→ Module 0, the functions lesson, args and kwargs concept) — unpacks `block.input`'s dict directly into keyword arguments, since `block.input` is exactly `{"location": "Paris"}` and `get_weather` takes `location` as a parameter. The loop checks `block.type` at each iteration: `"tool_use"` means execute the tool, append both the request and result, and keep looping; `"text"` means the model has produced its actual final answer, and the loop breaks.

---

## Deliberately minimal — one hardcoded tool

This loop deliberately only knows about one tool, `get_weather`, hardcoded directly into the `if` branch. That's a real limitation, worth naming honestly rather than pretending it isn't there: the moment a second tool exists, this exact structure doesn't generalize at all — [exactly what the next concept fixes](→ this lesson, handling multiple tools a dispatch mechanism concept). This concept's job was getting the smallest possible *correct* loop actually running, end to end, before addressing that real gap.

---

## Quiz cards

> **Q1.** What does the loop actually check at each iteration to decide
> what to do next?
> - A) The length of the messages list
> - B) `block.type` — whether the response is a `"tool_use"` block requiring execution, or a `"text"` block signaling the final answer ✅
> - C) How many tokens the response contains
> - D) Whether the user has sent a new message

> **Q2.** What does `get_weather(**block.input)` actually do?
> - A) It passes `block.input` as a single dict argument, unchanged
> - B) It unpacks `block.input`'s key-value pairs directly into keyword arguments matching `get_weather`'s parameters ✅
> - C) It converts `block.input` into a string before calling `get_weather`
> - D) It ignores `block.input` entirely

> **Q3.** Why does the loop break specifically when it encounters a
> `"text"` block?
> - A) `"text"` blocks always indicate an error occurred
> - B) A `"text"` block signals the model has produced its actual final answer, rather than requesting another tool call — nothing more needs to happen ✅
> - C) The loop breaks after exactly two iterations regardless of block type
> - D) `"text"` blocks are simply ignored, and the loop continues anyway

> **Q4.** Why is hardcoding a single tool directly into the loop's `if`
> branch a real, acknowledged limitation?
> - A) It isn't a limitation — this is the permanent, correct design
> - B) The moment a second tool exists, this exact structure doesn't generalize at all, since there's nowhere for the loop to look up which tool to actually call ✅
> - C) Hardcoded tools always run faster than any alternative
> - D) This limitation only matters for tools that return numbers, not strings

---

## Applied sandbox exercise 1

*(writing the minimal viable loop — genuinely graded against the fake
client's scripted responses)*

*Task shown to learner:* Given a `FakeLLMClient` scripted with a
`ToolUseBlock` requesting a `check_price` tool call with
`{"item": "notebook"}`, followed by a `TextBlock` with a final answer,
and a real Python function `check_price(item: str) -> str` (provided),
write the minimal loop: call the client, check the response's block
type, execute `check_price` and continue if it's a tool call, or
capture and return the final answer text if it's a `text` block.

*Hidden test cases:*
```python
def check_price(item: str) -> str:
    return "$4.50" if item == "notebook" else "unknown"

client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="check_price", input={"item": "notebook"}),
    TextBlock(text="The notebook costs $4.50."),
])

final_answer = run_agent_loop(client, [{"role": "user", "content": "How much is a notebook?"}])
assert final_answer == "The notebook costs $4.50."
assert client.call_count == 2
```

*Hint (shown on request):* This is nearly identical to this concept's
demo — the same `while True:` structure, checking `block.type`, calling
`check_price(**block.input)` in the tool-use branch, and returning
`block.text` (rather than printing it) once a `"text"` block arrives.

*Correct answer + explanation (shown on failure, if requested):*
```python
def run_agent_loop(client, messages):
    while True:
        response = client.create(messages=messages)
        block = response.content[0]

        if block.type == "tool_use":
            result = check_price(**block.input)
            messages.append({"role": "assistant", "content": [block]})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
```
This is the exact minimal loop from this concept, wrapped as a
reusable function — the same structural pattern, now checked against
the fake client's scripted sequence to confirm the tool actually gets
called with the right arguments, and the correct final text is
returned once the model's second scripted response arrives.

---

*(End of Concept 2. This lesson continues with Concept 3 — handling
multiple tools, a dispatch mechanism — drafted separately.)*
