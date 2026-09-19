# Module 1, Lesson 9 — Concept 1: The request shape

> **Note:** this concept describes a real, illustrative API request —
> not something executed live in this course's sandbox, since it
> requires a real network call and a real API key. Code and JSON shown
> below reflect an actual request shape, marked illustrative rather than
> "runs live."

---

## Everything this module has covered, arriving as one real payload

An LLM API request has three pieces: an endpoint URL, authentication —
[an API key, sent as a header, exactly the pattern from Module 0's FastAPI lesson](→ Module 0, the FastAPI lesson, authentication concept, the api key auth with depends explanation) — and a request body. That body is [nothing more exotic than ordinary JSON](→ Module 0, the I/O and error handling lesson, working with json concept), but its specific fields are where almost everything this module has covered so far finally shows up as something real, not just explained conceptually.

```json
{
  "model": "claude-sonnet-5",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"}
  ],
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 500,
  "stop": ["\n\n"]
}
```
*(illustrative request body — not executed live)*

```python
import httpx

response = httpx.post(
    "https://api.example.com/v1/messages",
    headers={"x-api-key": "sk-your-api-key-here"},
    json={
        "model": "claude-sonnet-5",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the capital of France?"},
        ],
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 500,
        "stop": ["\n\n"],
    },
)
```
*(illustrative — not executed live in this sandbox)*

---

## Where every piece of this actually came from

- **`messages`** — an array of `{role, content}` objects, using the
  exact `system`/`user`/`assistant` roles [Lesson 7 explained the origin of](→ this module, the training pipeline lesson, preference training and why message roles exist concept): a learned convention from preference training, not a hardcoded parsing rule, now appearing as the literal field a real request actually sends.
- **`temperature`, `top_p`, `max_tokens`, `stop`** — [every one of these decoding controls from Lesson 5](→ this module, decoding strategies and generation controls lesson), now real JSON fields on a real request, not abstract parameters in a toy Python function.
- **`x-api-key`** — [the same header-based API key auth pattern already covered](→ Module 0, the FastAPI lesson, authentication concept), sent by the *client* this time, rather than being verified server-side.

Nothing about this request's actual shape is new — it's a JSON object
with fields this course has already built real understanding of,
individually, across the last eight lessons.

---

## Quiz cards

> **Q1.** What is an LLM API request body, structurally?
> - A) A specialized format unique to LLM APIs, unrelated to anything covered earlier
> - B) An ordinary JSON object, with specific fields defined by the API's schema ✅
> - C) A binary, non-text format
> - D) A single string containing the entire prompt

> **Q2.** What does the `messages` field's `role` value (`system`,
> `user`, `assistant`) actually represent, given what Lesson 7 covered?
> - A) A hardcoded, architecturally-enforced security level
> - B) A learned formatting convention from preference training, now appearing as a literal field in a real request ✅
> - C) A field with no real meaning to the model itself
> - D) Something invented specifically for this one API, unrelated to how the model was trained

> **Q3.** Where do `temperature`, `top_p`, and `max_tokens` in a real
> request body actually come from, conceptually?
> - A) They're unrelated to anything covered earlier in this module
> - B) They're the exact decoding controls from Lesson 5, now appearing as real fields sent in an actual API request ✅
> - C) They only exist in this specific illustrative example, not real APIs
> - D) They control authentication, not generation behavior

---

*(End of Concept 1. This lesson continues with Concept 2 — the response
shape — drafted separately.)*
