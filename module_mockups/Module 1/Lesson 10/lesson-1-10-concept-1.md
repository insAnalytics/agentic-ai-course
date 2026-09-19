# Module 1, Lesson 10 — Concept 1: The naive approach, and where it fails

---

## Just asking for JSON

The most obvious way to get structured output from a model: include an
instruction in the prompt asking for it.

```
Prompt: "Respond with a JSON object containing 'name' and 'age' fields,
describing a person named Alice who is 25 years old."
```

This is just a request, phrased in natural language — and the model
still generates its response through [the exact same next-token prediction process from Lesson 4](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept), with nothing structurally forcing the output to actually be valid JSON, let alone JSON matching a specific shape.

---

## Failure mode 1: extra text breaks parsing entirely

```python
import json

naive_response = 'Sure, here is the JSON you requested: {"name": "Alice", "age": "twenty-five"}'

try:
    data = json.loads(naive_response)
except json.JSONDecodeError as e:
    print(f"failed to parse: {e}")
```
```
failed to parse: Expecting value: line 1 column 1 (char 0)
```
*(runs live, shows output — read-only demo snippet, not graded)*

`json.loads()` expects the *entire* string to be valid JSON — [as covered back in Module 0's I/O lesson](→ Module 0, the I/O and error handling lesson, working with json concept) — not JSON sitting somewhere inside other text. A perfectly natural, conversational response like "Sure, here is the JSON you requested:" preceding the actual JSON object is enough to break parsing completely.

---

## Failure mode 2: valid JSON, wrong data

```python
from pydantic import BaseModel, ValidationError

class Person(BaseModel):
    name: str
    age: int

type_mismatch_response = '{"name": "Alice", "age": "twenty-five"}'

try:
    person = Person.model_validate_json(type_mismatch_response)
except ValidationError as e:
    print(f"validation failed: {e}")
```
```
validation failed: 1 validation error for Person
age
  Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='twenty-five', input_type=str]
```
*(runs live, shows output — read-only demo snippet, not graded)*

This time the JSON itself parses just fine — but `"age"` came back as
the string `"twenty-five"` rather than a number, exactly [the validation failure shape from Module 0's Pydantic lesson](→ Module 0, the Pydantic lesson, pydantic fundamentals concept) — nothing about a natural-language instruction like "respond in JSON with an age field" structurally guarantees the model actually produces a number there, rather than a word.

---

## Why this is only ever a request, never a guarantee

Both failures share the same underlying cause: asking nicely, in the
prompt, doesn't change how generation actually works. The model is
still producing tokens one at a time, guided by learned patterns from
training, with nothing in the generation *mechanism itself* preventing
malformed output. A genuine guarantee requires intervening in that
mechanism directly — [covered next](→ this lesson, constrained decoding the actual enforcement mechanism concept).

---

## Quiz cards

> **Q1.** Why does `naive_response`'s extra conversational text break
> `json.loads()` entirely, even though valid JSON is present somewhere
> inside it?
> - A) `json.loads()` automatically extracts JSON from surrounding text
> - B) `json.loads()` expects the entire string to be valid JSON — text before or after the JSON object causes parsing to fail completely ✅
> - C) This is a bug specific to this one example
> - D) Extra text is silently ignored by `json.loads()`

> **Q2.** Why does `Person.model_validate_json(type_mismatch_response)`
> fail, even though the string is syntactically valid JSON?
> - A) It shouldn't fail — this represents a bug
> - B) The JSON parses fine, but `"age"` is a string rather than a number, which fails Pydantic's schema validation ✅
> - C) `model_validate_json` only works with dicts, never JSON strings
> - D) `Person`'s fields were defined incorrectly

> **Q3.** Why is asking a model to "respond in JSON" in the prompt only
> ever a request, not a guarantee?
> - A) It actually is a guarantee — models always comply exactly
> - B) The model still generates output through ordinary next-token prediction, with nothing in that generation mechanism itself preventing malformed or incorrectly-typed output ✅
> - C) JSON output is technically impossible for any LLM to produce
> - D) This only fails for very long responses

---

*(End of Concept 1. This lesson continues with Concept 2 — constrained
decoding, the actual enforcement mechanism — drafted separately.)*
