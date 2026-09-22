# Module 3, Lesson 2 — Concept 1: The schema, generated — the payoff completed

---

## The standard, from here forward

Every tool in this module gets its shape defined the same way: [a Pydantic `BaseModel`, converted via `.model_json_schema()`](→ Module 1, structured output and tool calling lesson, from a pydantic model to an enforceable schema concept).

```python
from pydantic import BaseModel

class GetAgentConfigArgs(BaseModel):
    agent_name: str

schema = GetAgentConfigArgs.model_json_schema()
print(schema)
```
```
{'properties': {'agent_name': {'title': 'Agent Name', 'type': 'string'}}, 'required': ['agent_name'], 'title': 'GetAgentConfigArgs', 'type': 'object'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Nothing new mechanically — this concept exists to make explicit that
[Lesson 1's parameter-design discipline](→ this module, designing tools a model can use well lesson, parameter design concept) and this schema mechanism are two halves of the same job: good field names and types feed directly into a schema the model's calls are actually constrained against.

---

## Quiz cards

> **Q1.** What generates a tool's schema, as established since Module 1?
> - A) A hand-written JSON file
> - B) `.model_json_schema()` on a Pydantic `BaseModel` ✅
> - C) The fake LLM client, automatically
> - D) A separate schema-writing tool unrelated to Pydantic

> **Q2.** How does this concept connect to Lesson 1's parameter design?
> - A) They're unrelated
> - B) Good field names and types from Lesson 1 are exactly what the generated schema actually constrains the model's calls against ✅
> - C) Schema generation replaces the need for parameter design
> - D) Parameter design only matters for narrow tools

---

*(End of Concept 1. This lesson continues with Concept 2 — the gap
constrained decoding doesn't close — drafted separately.)*
