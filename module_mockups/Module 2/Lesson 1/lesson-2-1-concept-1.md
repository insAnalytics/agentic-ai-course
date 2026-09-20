# Module 2, Lesson 1 — Concept 1: What an agent is, structurally — the perceive–reason–act–observe cycle

---

## The round trip, wrapped in a loop

[Module 1 ended on a single, complete round trip](→ Module 1, structured output and tool calling lesson, the full round trip concept): the model requests a tool call, your code executes it, the result goes back as a new message, and the model produces its final answer using a new API call. That was exactly *one* cycle. An **agent** is structurally nothing more exotic than that same round trip, wrapped in a loop — one where the model itself decides, after seeing each result, whether another cycle is actually needed, rather than always stopping after exactly one.

---

## The cycle, named

This repeating structure is commonly called **perceive → reason → act → observe**:

- **Perceive** — the model receives the current state: the conversation so far, including every prior tool result.
- **Reason** — the model decides what to do next, using [the exact same generation mechanism from Module 1](→ Module 1, how llms generate text lesson) — produce a final answer, or request another tool call.
- **Act** — if a tool call was requested, your code actually executes it.
- **Observe** — the result becomes a new message, added back into the conversation, and the cycle repeats from *perceive* with this updated state.

Nothing here is a new mechanism — it's the round trip, run repeatedly, with the model itself deciding at each pass whether to continue or stop.

---

## The loop's length isn't fixed in advance

```python
messages = [
    {"role": "user", "content": "What's the weather in Paris, and is it warmer than London?"},
]

# illustrative: what the model decides at each cycle -- in a real system,
# each of these comes from its own separate API call
simulated_model_decisions = [
    {"type": "tool_use", "name": "get_weather", "input": {"location": "Paris"}},
    {"type": "tool_use", "name": "get_weather", "input": {"location": "London"}},
    {"type": "text", "text": "Paris is warmer than London today."},
]

def get_weather(location: str) -> str:
    temps = {"Paris": "22C", "London": "15C"}
    return f"{temps[location]} in {location}"

step = 0
while True:
    decision = simulated_model_decisions[step]
    if decision["type"] == "text":
        print(f"final answer: {decision['text']}")
        break
    result = get_weather(decision["input"]["location"])
    print(f"cycle {step + 1}: called {decision['name']}({decision['input']}) -> {result}")
    messages.append({"role": "assistant", "content": [decision]})
    messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    step += 1

print(f"total messages in final conversation: {len(messages)}")
```
```
cycle 1: called get_weather({'location': 'Paris'}) -> 22C in Paris
cycle 2: called get_weather({'location': 'London'}) -> 15C in London
final answer: Paris is warmer than London today.
total messages in final conversation: 5
```
*(runs live, shows output — read-only demo snippet, not graded; the
sequence of model decisions is illustrative, not fetched live)*

This question genuinely needed *two* tool calls before the model had
enough to actually compare and answer — the loop simply continued for
as many cycles as turned out to be necessary, rather than a fixed
number decided in advance. This is the actual structural definition of
an agent worth carrying forward: not a specific framework or product,
but exactly this — a round trip, looped, where the model's own output
at each step determines whether the loop continues.

---

## Quiz cards

> **Q1.** What is an agent, structurally, in terms of what Module 1
> already covered?
> - A) A completely new mechanism, unrelated to the tool-call round trip
> - B) The exact same tool-call round trip from Module 1, wrapped in a loop where the model itself decides whether another cycle is needed ✅
> - C) A single API call that never involves any tools at all
> - D) A specific commercial product or framework

> **Q2.** In the perceive–reason–act–observe cycle, what does "observe"
> actually correspond to?
> - A) The model deciding what to do next
> - B) A tool's result becoming a new message, added back into the conversation before the next cycle begins ✅
> - C) The very first message a user ever sends
> - D) The model refusing to continue the loop

> **Q3.** In the live demo, why did the loop run for two full cycles
> instead of stopping after the first tool call?
> - A) The loop is hardcoded to always run exactly twice
> - B) The model's own decision after the first tool result determined that a second tool call was needed before it had enough information to answer ✅
> - C) `get_weather` always needs to be called twice for any location
> - D) This represents an error in the loop's logic

> **Q4.** What determines how many cycles an agent's loop actually runs,
> for a given task?
> - A) A fixed number, set in advance regardless of the task
> - B) The model's own decisions at each step — the loop continues exactly as long as the model keeps requesting further tool calls ✅
> - C) The number of tools available, regardless of whether they're used
> - D) The length of the original user message

---

*(End of Concept 1. This lesson continues with Concept 2 — agent vs.
workflow vs. chatbot — drafted separately.)*
