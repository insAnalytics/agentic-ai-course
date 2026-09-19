# Module 1, Lesson 10 — Concept 2: Constrained decoding — the actual enforcement mechanism

---

## Masking invalid tokens before softmax ever runs

**Constrained decoding** is the real fix for [Concept 1's problem](→ this lesson, the naive approach and where it fails concept) — and it works by intervening directly in [the exact logit/softmax mechanism from Lesson 4](→ this module, how llms generate text lesson, logits and the probability distribution concept), not by asking nicely in the prompt. At every single generation step, before softmax runs, any token that would violate the required schema — producing invalid JSON syntax, or a value of the wrong type for the current field — gets its logit set to effectively negative infinity.

```python
import math

def softmax(logits: dict) -> dict:
    exp_values = {token: math.exp(score) for token, score in logits.items()}
    total = sum(exp_values.values())
    return {token: value / total for token, value in exp_values.items()}

# candidate next tokens while filling in a schema-required number field
logits = {"25": 4.1, "twenty": 3.8, "five": 2.9, ",": 1.2}

# only digit-shaped tokens are valid here; "twenty" and "five" would
# violate the required type, so their logits get masked out entirely
valid_tokens = {"25", ","}
masked_logits = {
    token: (score if token in valid_tokens else float("-inf"))
    for token, score in logits.items()
}

print(softmax(masked_logits))
```
```
{'25': 0.948, 'twenty': 0.0, 'five': 0.0, ',': 0.052}
```
*(runs live, shows output — read-only demo snippet, not graded)*

`float("-inf")` fed into `math.exp()` produces exactly `0` — not a small
number, exactly zero. `"twenty"` and `"five"` end up with genuinely `0.0`
probability after softmax, meaning there is *no possible way* any
decoding strategy from Lesson 5 — greedy, sampling, temperature, top-p —
could ever select them. They're not merely unlikely; they're
structurally unreachable.

---

## A hard guarantee, not a soft nudge

This is worth contrasting directly against [frequency and presence penalties, from Lesson 5](→ this module, decoding strategies and generation controls lesson, frequency penalty vs presence penalty concept): those *reduce* a token's logit, making it less likely — but never impossible; a heavily-penalized token can still, in principle, get sampled. Constrained decoding's masking is categorically different: setting a logit to negative infinity doesn't discourage a token, it makes selecting it mathematically impossible, since its probability after softmax is exactly zero, not merely small. This categorical difference is exactly what turns "the model was asked to produce valid JSON" into "the model's output is *guaranteed* to be valid JSON" — the schema is enforced at the level of which tokens can even be considered, not left to the model's own judgment about following an instruction.

---

## Quiz cards

> **Q1.** What does constrained decoding actually do to an invalid
> token's logit, before softmax runs?
> - A) It slightly reduces the logit, making the token less likely
> - B) It sets the logit to effectively negative infinity, making the token's probability after softmax exactly zero ✅
> - C) It removes the token from the vocabulary permanently
> - D) It has no effect on logits at all, only on the final output text

> **Q2.** Why does `math.exp(float("-inf"))` producing exactly `0`
> matter for constrained decoding?
> - A) It doesn't matter — any very negative number would work identically
> - B) It guarantees the masked token's final probability is exactly zero, not just small — making it mathematically impossible for any decoding strategy to select it ✅
> - C) It causes the entire softmax computation to fail
> - D) It only affects tokens with positive logits

> **Q3.** What's the key difference between constrained decoding's
> masking and a frequency or presence penalty from Lesson 5?
> - A) They're functionally identical mechanisms
> - B) A penalty reduces a token's probability without eliminating it entirely; masking sets probability to exactly zero, making selection genuinely impossible ✅
> - C) Penalties are stronger than masking in every case
> - D) Masking only applies to the first token generated, penalties apply to all tokens

> **Q4.** Why does constrained decoding turn structured output into a
> genuine guarantee, rather than just a stronger request?
> - A) It doesn't — it's still just a more persuasively-worded instruction
> - B) It intervenes directly in which tokens can even be considered during generation, rather than relying on the model choosing to follow an instruction ✅
> - C) It only works for very short outputs
> - D) It requires the model to be retrained specifically for this purpose

---

*(End of Concept 2. This lesson continues with Concept 3 — from a
Pydantic model to an enforceable schema — drafted separately.)*
