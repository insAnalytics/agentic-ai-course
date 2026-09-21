# Module 2, Lesson 6 — Concept 2: Max steps — the first, simplest fix

---

## The simplest possible guard: a hard cap, unconditionally

The most basic fix for [Concept 1's pain](→ this lesson, the pain a loop that never stops concept): a hard limit on the number of loop iterations, enforced by the code itself, regardless of what the model wants to keep doing. Once the cap is reached, the loop stops — cleanly, not via a crash — whether or not the task was actually completed.

```python
def run_agent_loop(client, messages, max_steps: int = 10):
    for step_count in range(1, max_steps + 1):
        response = client.create(messages=messages)
        block = response.content[0]
        if block.type == "tool_use":
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
stopped after reaching the maximum of 10 steps without a final answer
```
*(runs live, shows output — read-only demo snippet, not graded)*

`for step_count in range(1, max_steps + 1)` — [the same `range()` pattern already covered back in Module 0](→ Module 0, the Python setup lesson, control flow concept) — caps the loop at exactly `max_steps` iterations. Against the exact same 20-item repeated-call scenario [from Concept 1](→ this lesson, the pain a loop that never stops concept), this version stops cleanly after 10 steps with a clear, informative message — no crash, no `IndexError`, and critically, this now works identically against a real model that could otherwise continue indefinitely, not just against a finite demo script.

---

## The honest limitation: max steps can't tell useful work from waste

Worth being direct about what this fix doesn't do: `max_steps` treats
every situation identically once the count is reached, regardless of
*why* it took that many steps. A task that genuinely needed 15 steps of
real, productive work and a task that looped uselessly on the exact
same pointless call for 15 steps both get cut off at the same fixed
number, with the exact same generic message — max steps has no way to
distinguish "this agent is making real progress and just needs more
room" from "this agent is stuck and will never actually finish." A
sharper fix — one that can actually notice *why* a loop might be
stuck, not just *how long* it's been running — is [covered next](→ this lesson, repeated action detection concept).

---

## Quiz cards

> **Q1.** What does `max_steps` actually guarantee about a loop's
> behavior?
> - A) That the task will always be completed successfully within the limit
> - B) That the loop will stop after a fixed number of iterations, regardless of whether the task was actually completed ✅
> - C) That repeated, pointless tool calls will be automatically detected and skipped
> - D) That the model will always receive a warning before the limit is reached

> **Q2.** Why does the `max_steps` version stop cleanly, with a message,
> rather than crashing like Concept 1's version did?
> - A) It doesn't actually stop cleanly — this is identical to Concept 1's behavior
> - B) The `for` loop only ever calls `client.create()` up to `max_steps` times, so it never attempts a call beyond what's actually available or needed ✅
> - C) `FakeLLMClient` automatically prevents crashes regardless of how it's called
> - D) `max_steps` disables the client entirely once reached

> **Q3.** What's the real, honest limitation of `max_steps` as a
> stopping mechanism?
> - A) It has no limitations — it fully solves the problem from Concept 1
> - B) It can't distinguish a task that genuinely needed many steps of real progress from one that looped uselessly the entire time — both get cut off identically ✅
> - C) It only works for tasks involving exactly one tool
> - D) It can only be set to a maximum value of 10

---

*(End of Concept 2. This lesson continues with Concept 3 —
repeated-action detection — drafted separately.)*
