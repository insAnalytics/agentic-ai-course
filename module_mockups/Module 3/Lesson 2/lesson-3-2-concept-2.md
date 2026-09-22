# Module 3, Lesson 2 — Concept 2: The gap constrained decoding doesn't close

---

## Valid shape, nonsensical content

[Constrained decoding](→ Module 1, structured output and tool calling lesson, constrained decoding the actual enforcement mechanism concept) guarantees a call matches its schema — the right field names, the right types. It guarantees nothing about whether those values actually make sense:

```python
class ScheduleMaintenanceArgs(BaseModel):
    agent_name: str
    date: str   # ISO 8601

call = ScheduleMaintenanceArgs(agent_name="research_agent", date="2020-01-01")
print(call)   # perfectly schema-valid -- and a date years in the past
```
```
agent_name='research_agent' date='2020-01-01'
```
*(runs live, shows output — read-only demo snippet, not graded)*

Nothing about this fails — `date` is a correctly-typed string,
`agent_name` is a correctly-typed string. The schema has no concept of
"in the past," or of `"research_agent"` actually existing in the real
registry. Both are real, meaningful problems the schema structurally
cannot catch, because they're facts about the world, not facts about
shape.

---

## Quiz cards

> **Q1.** Why does `call = ScheduleMaintenanceArgs(agent_name=...,
> date="2020-01-01")` succeed without error?
> - A) Pydantic automatically rejects past dates
> - B) `date` is a correctly-typed string — the schema has no concept of "in the past," only of matching the declared type ✅
> - C) This is actually a bug that should raise an error
> - D) `2020-01-01` isn't valid ISO 8601 format

> **Q2.** What do a past-dated schedule and a nonexistent `agent_name`
> have in common, as failures?
> - A) Neither is actually a real problem
> - B) Both are facts about the real world the schema structurally can't check — only shape, never whether a value is sensible or real ✅
> - C) Both would be caught automatically by constrained decoding
> - D) Only the date problem is real; nonexistent names are always caught

---

*(End of Concept 2. This lesson continues with Concept 3 — validate,
and return failures as observations — drafted separately.)*
