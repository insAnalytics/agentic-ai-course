# Module 1, Lesson 10 — Concept 5: The full round trip

---

## A tool call is only half the conversation

[Concept 4 covered the model requesting a tool call, and your code executing it](→ this lesson, tool calling structured output applied to a specific use case concept) — but the model still needs to actually *know* the result to answer the user's original question. The complete flow is a genuine round trip: the model requests a tool call, your code runs it, the result gets sent *back* to the model as a new message, and the model then produces its real final answer — using a brand new API call.

---

## Building the growing conversation, step by step

```python
messages = [
    {"role": "user", "content": "What's the weather in Paris?"},
]

# API call 1 (illustrative): the model responds with a tool call instead of text
assistant_tool_call_message = {
    "role": "assistant",
    "content": [{"type": "tool_use", "name": "get_weather", "input": {"location": "Paris"}}],
}
messages.append(assistant_tool_call_message)

def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

tool_result = get_weather("Paris")   # your own code actually runs this

# the tool's result becomes a new message, added back into the conversation
tool_result_message = {
    "role": "user",
    "content": [{"type": "tool_result", "content": tool_result}],
}
messages.append(tool_result_message)

print(f"messages sent on the second API call: {len(messages)}")
for m in messages:
    print(m)
```
```
messages sent on the second API call: 3
{'role': 'user', 'content': "What's the weather in Paris?"}
{'role': 'assistant', 'content': [{'type': 'tool_use', 'name': 'get_weather', 'input': {'location': 'Paris'}}]}
{'role': 'user', 'content': [{'type': 'tool_result', 'content': "It's sunny in Paris."}]}
```
*(runs live, shows output — read-only demo snippet, not graded; the
assistant's tool-call message itself is illustrative, not fetched live)*

This is [exactly Lesson 9's "resend everything" pattern](→ this module, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept), just with a tool call and its result now sitting inside the conversation history like any other turn. This full 3-message array — the original question, the assistant's tool-call request, and the tool's result — is what actually gets sent on the *second* API call. Only then, seeing the tool's actual result in context, can the model produce a genuine natural-language final answer: something like `"It's sunny in Paris today!"`, as message four.

---

## Why this is nothing new, mechanically

Nothing about this round trip introduces a new mechanism — it's
[statelessness](→ Module 0, the FastAPI lesson, rest api fundamentals concept), [multi-turn history resending](→ this module, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept), and [structured output via constrained decoding](→ this lesson, constrained decoding the actual enforcement mechanism concept), composed together into one realistic flow. A tool call isn't a special kind of API interaction requiring different infrastructure — it's a normal turn in a normal conversation, where the "assistant's message" for that turn happens to be structured data instead of prose, and the next "user message" happens to be a result your code generated instead of something an actual human typed.

---

## Quiz cards

> **Q1.** Why does the model need a second API call after a tool call,
> rather than just receiving the tool's result directly?
> - A) It doesn't — the model already knows the tool's result without being told
> - B) The tool's result has to be sent back as a new message in the conversation, and the model needs a new API call to actually process that updated conversation and produce its final answer ✅
> - C) Tool calls never actually require any follow-up interaction at all
> - D) The original API call automatically waits for the tool to finish before responding

> **Q2.** How does the tool call and its result actually get "remembered"
> for the model to use in its final answer?
> - A) The API server stores it automatically between calls
> - B) It becomes part of the conversation's message history, resent in full on the next request — the exact same statelessness pattern from Lesson 9 ✅
> - C) It's stored in a separate database the model queries automatically
> - D) The model has no way to actually use the tool's result at all

> **Q3.** Is a tool call's "user message" containing the tool's result
> literally typed by a human user?
> - A) Yes, always
> - B) No — it's a message your own code generates, containing the tool's actual output, formatted as a new turn in the conversation ✅
> - C) Tool results can never be represented as messages at all
> - D) Only the original question can ever come from a real human

> **Q4.** What does this concept's full round trip actually demonstrate,
> mechanically?
> - A) A completely new API mechanism, unrelated to anything covered earlier
> - B) Several already-covered mechanisms — statelessness, multi-turn history resending, and constrained-decoding-guaranteed structured output — composed together into one realistic flow ✅
> - C) That tool calls require a fundamentally different kind of server infrastructure
> - D) That tool calling only works within a single API call, never across two

---

*(End of Concept 5 — final concept section of Lesson 10. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
