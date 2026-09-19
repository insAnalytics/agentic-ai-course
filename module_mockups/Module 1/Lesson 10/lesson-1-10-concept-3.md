# Module 1, Lesson 10 — Concept 3: From a Pydantic model to an enforceable schema

---

## Where the schema constraining generation actually comes from

[Concept 2 showed how constrained decoding masks invalid tokens](→ this lesson, constrained decoding the actual enforcement mechanism concept) — but that mechanism needs to be told, concretely, what "valid" actually means for a given request. This is where [`AgentConfig` and every other `BaseModel` used as a teaching device throughout Module 0](→ Module 0, the Pydantic lesson) finally gets its real, practical payoff: a Pydantic model converts directly into a **JSON Schema** — a standard, structured, language-agnostic description of a data shape — and that JSON Schema is exactly what gets sent to the API to define what "valid" means for that specific request.

---

## Generating the schema directly from a model you already know

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

schema = AgentConfig.model_json_schema()
print(schema)
```
```
{'properties': {'name': {'title': 'Name', 'type': 'string'}, 'model': {'title': 'Model', 'type': 'string'}, 'temperature': {'default': 0.7, 'title': 'Temperature', 'type': 'number'}}, 'required': ['name', 'model'], 'title': 'AgentConfig', 'type': 'object'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.model_json_schema()` is a built-in Pydantic method — no manual schema
writing needed at all. Every field's type and requiredness comes
directly from the exact same class definition [used for request validation back in the FastAPI lesson](→ Module 0, the FastAPI lesson, request bodies with pydantic concept) — the identical model doing double duty: validating a FastAPI request body on one side, and defining what an LLM's output is *guaranteed* to look like on the other.

---

## The full round trip

```python
# 1. define the shape you want, exactly as you would for a FastAPI request body
class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

# 2. generate the schema, and include it in the API request
schema = AgentConfig.model_json_schema()
request_body = {
    "model": "claude-sonnet-5",
    "messages": [{"role": "user", "content": "Create a research agent config using claude-sonnet"}],
    "response_format": {"type": "json_schema", "json_schema": schema},
}

# 3. the response is guaranteed to match that schema — parse it directly
guaranteed_response_text = '{"name": "research_agent", "model": "claude-sonnet", "temperature": 0.7}'
config = AgentConfig.model_validate_json(guaranteed_response_text)
print(config)
```
```
name='research_agent' model='claude-sonnet' temperature=0.7
```
*(the schema generation and final parsing genuinely run live; the
request/response themselves are illustrative, not fetched from a live
call)*

`AgentConfig.model_validate_json(...)` here is [the exact same parsing method covered in Concept 1's failure demo](→ this lesson, the naive approach and where it fails concept) — the crucial difference is that this time, because constrained decoding already guaranteed the response matches the schema at generation time, this parsing step essentially can't fail on a shape mismatch the way it did against a naively-prompted response. Pydantic validation here is a final confirmation and type-conversion step, not a defense against an unreliable model.

---

## Quiz cards

> **Q1.** What does `.model_json_schema()` on a Pydantic `BaseModel`
> actually produce?
> - A) A new instance of the model, populated with default values
> - B) A JSON Schema — a structured, language-agnostic description of the model's fields, types, and which are required ✅
> - C) A random sample of valid data matching the model
> - D) The model's Python source code, as a string

> **Q2.** Why is it significant that the same `AgentConfig` class can be
> used both to validate a FastAPI request body and to define an LLM's
> guaranteed output shape?
> - A) It isn't significant — these are two unrelated uses of similar-looking code
> - B) It's the same class doing double duty, directly connecting a mechanism already learned (Pydantic validation) to a new context (constraining LLM output) without learning anything fundamentally new ✅
> - C) FastAPI and LLM APIs require completely incompatible schema formats
> - D) `AgentConfig` needs to be rewritten entirely for each different use

> **Q3.** Why does parsing a constrained-decoding-guaranteed response
> with `model_validate_json()` behave differently in practice than
> parsing a naively-prompted response from Concept 1?
> - A) It's the exact same risk of failure in both cases
> - B) Because constrained decoding already guaranteed the response matches the schema at generation time, this parsing step essentially can't fail on a shape mismatch, unlike the naive case ✅
> - C) `model_validate_json()` only works with constrained-decoding responses
> - D) Constrained decoding removes the need to parse the response at all

---

*(End of Concept 3. This lesson continues with Concept 4 — tool
calling, structured output applied to a specific use case — drafted
separately.)*
