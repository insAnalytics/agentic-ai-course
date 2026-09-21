# Module 2, Lesson 6 — Concept 3: Repeated-action detection

---

## A sharper signal than "too many steps"

[Max steps, from Concept 2](→ this lesson, max steps the first simplest fix concept), only notices a problem after a fixed count is reached — regardless of what actually happened along the way. **Repeated-action detection** notices something more specific and genuinely diagnostic: the *exact same* tool call — same name, same arguments — happening more than once. That's a strong, concrete signal the loop is stuck, catchable far earlier than any fixed step count would ever trigger.

```python
def run_agent_loop(client, messages, max_steps: int = 10):
    seen_calls = []
    for step_count in range(1, max_steps + 1):
        response = client.create(messages=messages)
        block = response.content[0]
        if block.type == "tool_use":
            current_call = (block.name, block.input)
            if current_call in seen_calls:
                return f"stopped after detecting a repeated call to {block.name} with the same arguments"
            seen_calls.append(current_call)
            result = get_weather(**block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
    return f"stopped after reaching the maximum of {max_steps} steps without a final answer"

repeated_responses = [[ToolUseBlock(name="get_weather", input={"location": "Paris"})] for _ in range(20)]
client = FakeLLMClient(scripted_responses=repeated_responses)

result = run_agent_loop(client, [{"role": "user", "content": "What's the weather in Paris?"}], max_steps=10)
print(result)
```
```
stopped after detecting a repeated call to get_weather with the same arguments
```
*(runs live, shows output — read-only demo snippet, not graded)*

`current_call = (block.name, block.input)` builds a tuple; `current_call
in seen_calls` checks it against every previously-seen call — this
works correctly on a plain list, without needing anything more exotic,
since Python's `in` operator on a list checks equality (`==`) between
items, and [dicts already support direct equality comparison](→ Module 0, the data structures lesson, dicts concept) — no special hashable representation is needed. Against the exact same scenario from Concept 1 and 2, this version stops after just **2** steps — the first call gets recorded, the second identical call triggers the detection immediately — instead of running all the way to the `max_steps=10` limit.

---

## Complementary, not a replacement for max steps

Repeated-action detection catches one specific, diagnosable pattern —
exact repetition — but it doesn't catch every way a loop could fail to
make real progress; an agent bouncing between several *different*,
still-unproductive calls would slip right past it. `max_steps` remains
a necessary backstop regardless — a hard ceiling that catches whatever
repeated-action detection doesn't, even if it's slower and less
specific about *why* it's stopping.

---

## Quiz cards

> **Q1.** What does repeated-action detection actually check for?
> - A) Whether the total number of steps has exceeded a fixed limit
> - B) Whether the exact same tool call — same name, same arguments — has already been made earlier in the loop ✅
> - C) Whether the model has taken longer than a fixed amount of time
> - D) Whether any tool call has ever failed

> **Q2.** Why does `current_call in seen_calls` work correctly on a
> plain Python list, without needing a special hashable representation?
> - A) It doesn't actually work correctly — this code has a bug
> - B) List membership checks use equality (`==`) between items, and dicts already support direct equality comparison, so no hashing is needed ✅
> - C) `seen_calls` is secretly a set, not a list
> - D) Tuples can never contain dicts, so this code would raise an error

> **Q3.** In the demo, why does repeated-action detection stop the loop
> after just 2 steps, while `max_steps` alone needed all 10?
> - A) This is a coincidence specific to this one example
> - B) The exact same call gets flagged the moment it repeats a second time, rather than needing to wait for a fixed step count to be reached regardless of what actually happened ✅
> - C) Repeated-action detection is always exactly 5 times faster than max steps
> - D) `max_steps` and repeated-action detection are mutually exclusive and can't be used together

> **Q4.** Why does `max_steps` remain necessary even with repeated-action
> detection in place?
> - A) It doesn't — repeated-action detection makes max_steps entirely redundant
> - B) Repeated-action detection only catches exact repetition; a loop bouncing between different, still-unproductive calls would slip past it entirely, so max_steps remains a necessary backstop ✅
> - C) `max_steps` is required syntactically for repeated-action detection to function at all
> - D) Repeated-action detection can only be used on the very first step

---

## Applied sandbox exercise 1

*(implementing both guards together — genuinely graded against two
distinct scripted scenarios)*

*Task shown to learner:* Implement `run_agent_loop(client, messages,
max_steps)` combining both guards from this lesson: a hard `max_steps`
cap, and detection that stops immediately (with a message naming the
repeated tool) the moment the exact same `(name, input)` call repeats.
A scenario with no repeats and a normal final answer within the limit
should still return that real answer, unaffected by either guard.

*Hidden test cases:*
```python
# scenario 1: genuine repetition, should be caught early
stuck_client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="get_weather", input={"location": "Paris"})] for _ in range(20)
])
result_1 = run_agent_loop(stuck_client, [{"role": "user", "content": "..."}], max_steps=10)
assert "repeated call" in result_1
assert stuck_client.call_count == 2   # caught on the second identical call, not run to max_steps

# scenario 2: genuine progress, no repeats, should complete normally
normal_client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="get_weather", input={"location": "Paris"})],
    [TextBlock(text="It's sunny in Paris.")],
])
result_2 = run_agent_loop(normal_client, [{"role": "user", "content": "..."}], max_steps=10)
assert result_2 == "It's sunny in Paris."
```

*Hint (shown on request):* This is this concept's exact demo code —
the only change needed beyond Concept 2's version is adding
`seen_calls = []` before the loop, and the `current_call`/`in
seen_calls` check right after receiving a `tool_use` block, before
actually executing it.

*Correct answer + explanation (shown on failure, if requested):*
```python
def run_agent_loop(client, messages, max_steps: int = 10):
    seen_calls = []
    for step_count in range(1, max_steps + 1):
        response = client.create(messages=messages)
        block = response.content[0]
        if block.type == "tool_use":
            current_call = (block.name, block.input)
            if current_call in seen_calls:
                return f"stopped after detecting a repeated call to {block.name} with the same arguments"
            seen_calls.append(current_call)
            result = get_weather(**block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
    return f"stopped after reaching the maximum of {max_steps} steps without a final answer"
```
Scenario 1 confirms the repeated-call detection triggers on exactly the
second identical call, well before `max_steps` would ever matter.
Scenario 2 confirms neither guard interferes with a loop that's
genuinely making progress — both are safety nets, not obstacles to
normal, successful operation.

---

*(End of Concept 3. This lesson continues with Concept 4 — goal-state
termination checks — drafted separately.)*
