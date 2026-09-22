# Module 3, Lesson 2 — Concept 3: Validate, and return failures as observations

---

## Closing the gap: a validator, plus the failure-as-observation pattern

```python
from pydantic import BaseModel, field_validator
from datetime import date

class ScheduleMaintenanceArgs(BaseModel):
    agent_name: str
    date: date

    @field_validator("date")
    @classmethod
    def date_must_be_future(cls, value: date) -> date:
        if value < date.today():
            raise ValueError(f"date {value} is in the past")
        return value

def schedule_maintenance(agent_name: str, date: str, registry: dict) -> str:
    try:
        args = ScheduleMaintenanceArgs(agent_name=agent_name, date=date)
    except Exception as e:
        return f"Error: {str(e)}"
    if args.agent_name not in registry:
        return f"Error: no agent named '{args.agent_name}' exists in the registry"
    return f"maintenance scheduled for {args.agent_name} on {args.date}"

result = schedule_maintenance("research_agent", "2020-01-01", registry={"research_agent": {}})
print(result)
```
```
Error: 1 validation error for ScheduleMaintenanceArgs
date
  Value error, date 2020-01-01 is in the past
```
*(runs live, shows output — read-only demo snippet, not graded)*

`field_validator` — [Pydantic's semantic-check mechanism from Module 0](→ Module 0, the Pydantic lesson) — catches what the schema's type alone couldn't; the existence check catches the other gap. Both return a
plain string, [the exact same failure-as-observation pattern from Module 2](→ Module 2, termination failure and control lesson, tool errors as observations not exceptions concept) — never a crash, always something the model can actually see and react to.

---

## Quiz cards

> **Q1.** What does `field_validator` add that a plain type annotation
> alone couldn't?
> - A) Nothing — types alone already catch this
> - B) A semantic check — here, that a date is actually in the future — beyond what the type system alone can express ✅
> - C) It changes the field's actual type
> - D) It only works on string fields

> **Q2.** Why does `schedule_maintenance` return a string on failure,
> rather than letting the exception propagate?
> - A) Returning a string is required by Pydantic
> - B) It follows Module 2's tool-errors-as-observations pattern — the model needs to actually see the failure, not have the whole interaction crash ✅
> - C) This has no real purpose
> - D) Exceptions can never be caught in Python

---

## Applied sandbox exercise 1

*(schema-valid-but-invalid detection plus observation-return, graded)*

*Task shown to learner:* Given `registry = {"support_agent": {}}`,
implement `schedule_maintenance` exactly as shown, validating both the
future-date constraint and registry existence, returning `"Error: ..."`
strings rather than raising.

*Hidden test cases:*
```python
assert "in the past" in schedule_maintenance("support_agent", "2020-01-01", registry)
assert "no agent named" in schedule_maintenance("ghost_agent", "2030-01-01", registry)
assert schedule_maintenance("support_agent", "2030-01-01", registry) == "maintenance scheduled for support_agent on 2030-01-01"
```

*Correct answer:* the function shown in this concept's demo, unchanged.

---

*(End of Concept 3 — final concept of Lesson 2. Continues with
bookends — drafted separately.)*
