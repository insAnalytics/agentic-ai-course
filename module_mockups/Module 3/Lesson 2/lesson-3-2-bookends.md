# Tool Schemas and Argument Validation

> **You'll be able to**
> - Generate a tool's schema from a Pydantic model, as the standard
>   mechanism for every tool going forward
> - Identify the gap between schema-valid and semantically valid — a
>   real, structural limit constrained decoding can't close
> - Write Pydantic validators for semantic checks, and return failures
>   as observations rather than exceptions

**Why it matters**
A schema-valid call isn't the same as a *correct* call — this lesson is the gap between "the model formatted this right" and "this actually makes sense," and closing it the same way Module 2 taught every other tool failure to be handled: as information the agent can act on, not a crash.

---

## Comprehensive quiz

> **Q1.** What generates a tool's schema, as established since Module 1?
> - A) A hand-written JSON file
> - B) `.model_json_schema()` on a Pydantic `BaseModel` ✅
> - C) The fake client, automatically
> - D) An unrelated schema tool

> **Q2.** Why does a past-dated `ScheduleMaintenanceArgs` call succeed
> without a schema error?
> - A) Pydantic rejects past dates automatically
> - B) The date is correctly-typed — the schema has no concept of "in the past" ✅
> - C) This is a bug
> - D) The date format is invalid

> **Q3.** What do a past-dated schedule and a nonexistent agent name
> have in common as failures?
> - A) Neither is a real problem
> - B) Both are facts about the world the schema structurally can't check ✅
> - C) Both are caught by constrained decoding automatically
> - D) Only one is real

> **Q4.** What does `field_validator` add beyond a plain type
> annotation?
> - A) Nothing
> - B) A semantic check beyond what the type system alone can express ✅
> - C) It changes the field's type
> - D) Only works on strings

> **Q5.** Why return a string on failure rather than let the exception
> propagate?
> - A) Required by Pydantic
> - B) Follows Module 2's tool-errors-as-observations pattern — the model needs to see the failure, not crash the interaction ✅
> - C) No real purpose
> - D) Exceptions can't be caught in Python

---

## Comprehensive sandbox

*(applied — a second tool with its own semantic gap, graded)*

*Task shown to learner:* Implement `update_agent_model(agent_name: str,
model: str, registry: dict) -> str`, validating that `agent_name`
exists and `model` is one of `{"claude-sonnet", "claude-haiku",
"claude-opus"}` (a Pydantic validator), returning `"Error: ..."`
strings on either failure, or a success message otherwise.

*Hidden test cases:*
```python
registry = {"research_agent": {"model": "claude-haiku"}}
assert "no agent named" in update_agent_model("ghost", "claude-sonnet", registry)
assert "not a valid model" in update_agent_model("research_agent", "gpt-5", registry)
assert update_agent_model("research_agent", "claude-sonnet", registry) == "research_agent updated to claude-sonnet"
```

*Correct answer:*
```python
from pydantic import BaseModel, field_validator

VALID_MODELS = {"claude-sonnet", "claude-haiku", "claude-opus"}

class UpdateModelArgs(BaseModel):
    agent_name: str
    model: str

    @field_validator("model")
    @classmethod
    def model_must_be_valid(cls, value: str) -> str:
        if value not in VALID_MODELS:
            raise ValueError(f"'{value}' is not a valid model")
        return value

def update_agent_model(agent_name: str, model: str, registry: dict) -> str:
    try:
        args = UpdateModelArgs(agent_name=agent_name, model=model)
    except Exception as e:
        return f"Error: {str(e)}"
    if args.agent_name not in registry:
        return f"Error: no agent named '{args.agent_name}' exists in the registry"
    registry[args.agent_name]["model"] = args.model
    return f"{args.agent_name} updated to {args.model}"
```
