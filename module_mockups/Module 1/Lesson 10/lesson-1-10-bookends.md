# Structured Output and Tool Calling

> **You'll be able to**
> - Explain why asking a model to "respond in JSON" is only ever a
>   request, and identify the concrete ways it can fail
> - Explain constrained decoding as a real enforcement mechanism —
>   masking invalid tokens before softmax — and why that's categorically
>   different from a soft penalty
> - Convert a Pydantic model into a JSON Schema and use it to define an
>   LLM's guaranteed output shape
> - Explain tool calling as structured output applied to a specific use
>   case, with a clean separation between the model's request and your
>   code's decision to execute it
> - Trace the full round trip of a tool call — request, execution,
>   result, final answer — as ordinary multi-turn conversation mechanics

**Why it matters**
This lesson is where `AgentConfig`, `ToolCall`, and every other Pydantic
model used as a teaching device throughout Module 0 finally does the
job it was always heading toward: defining what an LLM is actually
allowed to produce, with a real, mechanical guarantee behind it — not
hoping the model follows instructions well. Everything an agent
actually *does* — deciding to search, calculate, or call an external
service — runs through exactly this mechanism, so understanding it
precisely here is what makes the rest of this course's agentic content
land as engineering rather than as something closer to magic.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Why does `naive_response`'s extra conversational text break
> `json.loads()` entirely?
> - A) `json.loads()` automatically extracts JSON from surrounding text
> - B) `json.loads()` expects the entire string to be valid JSON — extra text causes parsing to fail completely ✅
> - C) This is a bug specific to one example
> - D) Extra text is silently ignored

> **Q2.** What does constrained decoding actually do to an invalid
> token's logit, before softmax runs?
> - A) It slightly reduces the logit
> - B) It sets the logit to effectively negative infinity, making the token's probability after softmax exactly zero ✅
> - C) It removes the token from the vocabulary permanently
> - D) It has no effect on logits

> **Q3.** What's the key difference between constrained decoding's
> masking and a frequency or presence penalty?
> - A) They're functionally identical
> - B) A penalty reduces probability without eliminating it; masking sets probability to exactly zero, making selection genuinely impossible ✅
> - C) Penalties are always stronger than masking
> - D) Masking only applies to the first token generated

> **Q4.** What does `.model_json_schema()` on a Pydantic `BaseModel`
> produce?
> - A) A new instance of the model with default values
> - B) A JSON Schema describing the model's fields, types, and requiredness ✅
> - C) A random sample of valid data
> - D) The model's Python source code as a string

> **Q5.** Why is it significant that the same Pydantic class can both
> validate a FastAPI request body and define an LLM's guaranteed output
> shape?
> - A) It isn't significant — unrelated uses of similar code
> - B) It's the same mechanism doing double duty, connecting something already learned to a new context ✅
> - C) FastAPI and LLM APIs require incompatible schema formats
> - D) The class needs to be rewritten for each use

> **Q6.** Does a model literally execute code when it "calls a tool"?
> - A) Yes, directly
> - B) No — it produces structured output describing which tool and what arguments; your code decides whether to execute anything ✅
> - C) Tool calling never involves code execution
> - D) Only reasoning models can execute tools directly

> **Q7.** What mechanism guarantees a model's tool-call output matches
> the expected arguments schema?
> - A) Nothing — it's a hope based on prompt wording
> - B) The same constrained-decoding mechanism, applied to the tool's specific arguments schema ✅
> - C) A completely separate mechanism specific to tool calling
> - D) The model is retrained for every individual tool

> **Q8.** Why does the model need a second API call after requesting a
> tool call?
> - A) It doesn't — the model already knows the result
> - B) The tool's result has to be sent back as a new message, and a new API call is needed to process the updated conversation ✅
> - C) Tool calls never require follow-up interaction
> - D) The original call automatically waits for the tool to finish

> **Q9.** How does a tool call's result actually get "remembered" for
> the model's final answer?
> - A) The server stores it automatically
> - B) It becomes part of the conversation history, resent in full on the next request — the same statelessness pattern from Lesson 9 ✅
> - C) A separate database the model queries automatically
> - D) It can't be used at all

---

## Closing synthesis — design a new tool, end to end

*(end of lesson, reflective rather than graded — applying every
concept in this lesson to a scenario not already covered)*

Design a `search_flights` tool taking `origin`, `destination`, and
`date` as arguments. Before checking below, work through: what would
its Pydantic schema look like? Why is the model's `arguments` output
for this tool *guaranteed* to match that schema, mechanically? What
does your own code's responsibility look like once the model requests
this tool? What does the second API call in the round trip actually
contain?

*Reasoning to check against:* the schema is [an ordinary Pydantic `BaseModel`](→ this lesson, from a pydantic model to an enforceable schema concept) — `origin: str`, `destination: str`, `date: str` — converted via `.model_json_schema()`. The guarantee comes from [constrained decoding masking any token that would produce an invalid shape](→ this lesson, constrained decoding the actual enforcement mechanism concept), not from the model choosing to comply. Your code's responsibility, [per Concept 4's separation of concerns](→ this lesson, tool calling structured output applied to a specific use case concept), is deciding whether to actually run a real flight search with those parsed arguments — nothing forces execution just because the model requested it; validating the date format or rejecting an implausible request before calling a real, possibly costly search API is entirely your call. The second API call's `messages` array contains [the original question, the assistant's tool-call request, and a new message holding the search results](→ this lesson, the full round trip concept) — the exact same three-message growth pattern already demonstrated, just with different content.

The pattern worth taking away from this entire lesson: every piece of
"agentic" behavior this course will build toward — deciding to act,
executing something real, incorporating the result — is built from
mechanisms already fully understood by this point, composed together,
not something categorically new.
