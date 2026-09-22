# Module 3, Lesson 1 — Concept 2: Parameter design

---

## The schema constrains shape — not whether the shape makes sense

[Constrained decoding, from Module 1](→ Module 1, structured output and tool calling lesson, constrained decoding the actual enforcement mechanism concept), guarantees a tool call's arguments match the declared types — but *choosing* clear, well-typed, unambiguous parameters in the first place is still an authored design decision the schema itself can't make for you.

```python
from pydantic import BaseModel

class BadArgs(BaseModel):
    d: str
    flag: str

class GoodArgs(BaseModel):
    date: str   # ISO 8601, e.g. "2026-09-23"
    include_archived: bool
```

`BadArgs` technically has a schema, generated the same way [Module 1's `AgentConfig` example did](→ Module 1, structured output and tool calling lesson, from a pydantic model to an enforceable schema concept) — but `d` gives the model no signal about expected format, and `flag: str` invites something like `"yes"` or `"true"` instead of an actual boolean, a genuinely ambiguous choice the schema itself never rules out. `GoodArgs` uses a real `bool` (letting constrained decoding do its actual job) and a name plus comment clarifying the expected date format — the same information a well-written docstring carries, now living directly on the parameter.

---

## Quiz cards

> **Q1.** Why doesn't a valid Pydantic schema guarantee a tool's
> parameters are well-designed?
> - A) It does guarantee this — a valid schema is sufficient on its own
> - B) The schema only constrains argument *shape* (types, required fields); choosing clear, unambiguous names and the right types in the first place is a separate design decision ✅
> - C) Pydantic schemas can't actually be generated for tool parameters
> - D) This concept contradicts Module 1's constrained decoding coverage

> **Q2.** Why is `flag: str` a worse design choice than `include_archived: bool`?
> - A) There's no real difference — both work identically
> - B) `str` leaves room for ambiguous values like `"yes"`; a real `bool` lets constrained decoding enforce an actual boolean directly ✅
> - C) Pydantic doesn't support boolean fields
> - D) `flag` is a reserved keyword in Python

---

*(End of Concept 2. This lesson continues with Concept 3 — granularity,
narrow vs. broad tools — drafted separately.)*
