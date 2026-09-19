# Module 1, Lesson 9 — Concept 2: The response shape

> **Note:** same caveat as Concept 1 — the response JSON shown here is
> illustrative of a real API's actual shape, not fetched from a live
> call. The Python demos parsing it, however, are ordinary dict access
> and genuinely run live.

---

## More than just the generated text comes back

A response includes the generated content, but also real metadata about
*how* that generation happened — two fields in particular are the
direct payoff for concepts this module built up over several lessons
without ever showing them as something you'd actually read from a real
response.

```json
{
  "id": "msg_01XyZ",
  "model": "claude-sonnet-5",
  "role": "assistant",
  "content": [
    {"type": "text", "text": "The capital of France is Paris."}
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 24,
    "output_tokens": 9
  }
}
```
*(illustrative response shape — not fetched from a live call)*

```python
response_data = {
    "content": [{"type": "text", "text": "The capital of France is Paris."}],
    "stop_reason": "end_turn",
    "usage": {"input_tokens": 24, "output_tokens": 9},
}

print(response_data["content"][0]["text"])
print(f"used {response_data['usage']['input_tokens']} input tokens, {response_data['usage']['output_tokens']} output tokens")
print(f"stopped because: {response_data['stop_reason']}")
```
```
The capital of France is Paris.
used 24 input tokens, 9 output tokens
stopped because: end_turn
```
*(runs live, shows output — read-only demo snippet, not graded; the
underlying `response_data` dict is illustrative, but this parsing code
is ordinary Python)*

---

## `usage` — tokens, finally readable after the fact

`usage.input_tokens` and `usage.output_tokens` are the direct, concrete
payoff for [everything Lessons 1 and 6 established about tokens being the actual unit an LLM operates in](→ this module, the tokenization lesson) — not just a conceptual fact anymore, but a real number returned after every single call, telling you exactly how much of [your shared input/output budget, from Lesson 6](→ this module, context windows and kv cache lesson, max output length vs context window concept), that specific call actually consumed.

---

## `stop_reason` (or `finish_reason`, depending on the provider) — why generation actually stopped

This field directly reflects [Lesson 5's decoding controls](→ this module, decoding strategies and generation controls lesson) and [Lesson 6's shared token budget](→ this module, context windows and kv cache lesson): did generation end naturally, hit an explicit stop sequence, or get cut off by hitting `max_tokens`?

```python
truncated_response = {
    "content": [{"type": "text", "text": "The three main causes of the French Revolution were economic"}],
    "stop_reason": "max_tokens",
    "usage": {"input_tokens": 18, "output_tokens": 500},
}

if truncated_response["stop_reason"] == "max_tokens":
    print("warning: response was cut off before finishing — consider raising max_tokens")
```
```
warning: response was cut off before finishing — consider raising max_tokens
```
*(runs live, shows output — read-only demo snippet, not graded)*

`stop_reason: "max_tokens"` here is exactly [the scenario Lesson 6 demonstrated numerically](→ this module, context windows and kv cache lesson, max output length vs context window concept) — the response genuinely ran out of room mid-sentence, and this field is how you'd actually detect that happened programmatically, rather than just guessing from an incomplete-looking response.

---

## Quiz cards

> **Q1.** What does `usage.output_tokens` in a response actually tell
> you?
> - A) The total number of words in the response
> - B) The actual number of output tokens that specific call consumed — a real, concrete number reflecting the same token-based accounting covered throughout this module ✅
> - C) The maximum number of tokens the model is capable of generating, ever
> - D) The number of tokens remaining in the model's total training data

> **Q2.** What does a `stop_reason` of `"max_tokens"` indicate about a
> response?
> - A) The response finished naturally, exactly as intended
> - B) Generation was cut off because it hit the requested output token limit before naturally finishing — the same shared-budget exhaustion covered in Lesson 6 ✅
> - C) The request failed due to an invalid API key
> - D) The model refused to answer the question

> **Q3.** Why is checking `stop_reason` programmatically more reliable
> than just visually inspecting whether a response "looks complete"?
> - A) It isn't — visual inspection is always sufficient
> - B) `stop_reason` gives an explicit, structured signal for why generation stopped, rather than requiring a guess based on how the text happens to read ✅
> - C) `stop_reason` is only available for very short responses
> - D) Visual inspection and `stop_reason` always agree, so checking programmatically adds nothing

---

*(End of Concept 2. This lesson continues with Concept 3 — multi-turn
conversations, and why the client resends everything — drafted
separately.)*
