# Module 2, Lesson 3 — Concept 3: Tool guidance — strategic, not mechanical

---

## What a schema does and doesn't cover

[A tool's schema — a Pydantic model converted to JSON Schema, from Module 1](→ Module 1, structured output and tool calling lesson, from a pydantic model to an enforceable schema concept) — mechanically guarantees the *shape* of a tool call, via constrained decoding: the right argument names, the right types. It says nothing at all about *when* the model should actually decide to call that tool, or how it should interpret and act on whatever comes back. That's a separate, genuinely distinct kind of guidance — and it belongs in the system prompt, not the schema.

```python
from pydantic import BaseModel

class CheckInventoryArguments(BaseModel):
    book_title: str

schema = CheckInventoryArguments.model_json_schema()
print(schema)
```
```
{'properties': {'book_title': {'title': 'Book Title', 'type': 'string'}}, 'required': ['book_title'], 'title': 'CheckInventoryArguments', 'type': 'object'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

This schema constrains the *format* of a `check_inventory` call
completely — but it's silent on every strategic question: should the
model call this for every book-related question, or only some? What
should it do with a result of zero? None of that lives here.

---

## Strategic guidance, in the system prompt

```
System prompt (tool guidance section): "Use check_inventory whenever a
customer asks about a specific book's availability. Do not use it for
general questions about store hours or return policy. If
check_inventory returns zero, tell the customer the book is currently
out of stock — do not suggest it might still be available without
checking again."
```

This is [the same "request, not guarantee" category as prompt-specified output format from Lesson 2](→ this module, prompting fundamentals lesson, output format and delimiters concept) — a strong behavioral nudge, not a mechanical constraint. It's genuinely necessary alongside the schema, not optional: a tool with a perfectly well-defined schema but no strategic guidance can still get called at the wrong moment, skipped when it should have been used, or have its results misinterpreted — the schema was never responsible for any of that in the first place.

---

## Why both pieces are needed together

The schema and the tool guidance answer two genuinely different
questions: the schema answers *"if the model decides to call this,
what should the call look like"*; the system prompt guidance answers
*"when should the model actually decide to call this, and what should
it do with what comes back."* An agent missing either piece is
incomplete in a different way — missing the schema means calls that
don't reliably parse; missing the guidance means calls that happen at
the wrong time, or results the agent doesn't know how to actually use.

---

## Quiz cards

> **Q1.** What does a tool's JSON Schema actually guarantee, and what
> does it leave completely unspecified?
> - A) It guarantees both the format and the timing of every tool call
> - B) It guarantees the format of a call (via constrained decoding), but says nothing about when the model should decide to call it, or how to interpret the result ✅
> - C) It only specifies timing, never format
> - D) It guarantees nothing at all — schemas are purely documentation

> **Q2.** Why does a tool need strategic guidance in the system prompt,
> even with a perfectly well-defined schema?
> - A) It doesn't — a good schema alone is always sufficient
> - B) The schema constrains only the shape of a call; nothing about it governs when the model should actually decide to call the tool, or how to act on its result ✅
> - C) Schemas are optional if strategic guidance is provided instead
> - D) Strategic guidance and schemas control exactly the same thing, redundantly

> **Q3.** Is tool guidance in a system prompt a mechanical guarantee or a
> behavioral request?
> - A) A mechanical guarantee, exactly like constrained decoding
> - B) A behavioral request — a strong, trained-in nudge, not something structurally enforced the way schema validation is ✅
> - C) Neither — tool guidance has no actual effect on behavior
> - D) It's enforced by a separate, dedicated mechanism unrelated to the prompt

---

## Applied sandbox exercise 1

*(writing role, constraints, and tool guidance together — grades the
learner's submitted system prompt text directly, since no live LLM is
available)*

*Task shown to learner:* A bookstore agent has access to a
`check_price(book_title: str)` tool. Write a system prompt section that
includes: a defined role for the agent; at least one explicit
always/never behavioral constraint; and tool guidance specifying both
*when* to call `check_price` and *how* to handle its result.

*Grading (checks the learner's submitted prompt text directly):*
confirms a role-defining sentence (e.g., "You are a..."), at least one
explicit always/never constraint, and a tool guidance section naming
`check_price` that specifies both a calling condition and instructions
for handling the result.

*Hint (shown on request):* Follow the same three-part shape as this
concept's demo — a role sentence, one or more always/never constraints,
then a section specifically about `check_price`: when to call it (e.g.,
"whenever asked about a specific book's price"), and what to do with
what it returns (e.g., "always state the exact price returned; never
estimate or round").

*Correct answer + explanation (shown on failure, if requested):*
```
You are a customer support agent for Riverside Books. Always be polite
and concise. Never guess at information you haven't actually verified.

Use check_price whenever a customer asks about a specific book's
price. Always state the exact price the tool returns — never estimate
or provide a rounded figure instead.
```
This is the full composition this concept builds toward: a role framing
who the agent is, an explicit behavioral constraint against guessing,
and tool guidance covering both *when* `check_price` should actually be
called and *how* its result should be used — none of which the tool's
own schema could have specified on its own.

---

*(End of Concept 3. This lesson continues with Concept 4 —
phase-aware prompting — drafted separately.)*
