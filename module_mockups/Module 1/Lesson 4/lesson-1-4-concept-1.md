# Module 1, Lesson 4 — Concept 1: Logits and the probability distribution

---

## What comes out of the final transformer layer

After a sequence has passed through [every transformer block, stacked as covered in Lesson 3](→ this module, the attention and transformer architecture lesson, stacking layers into a real transformer concept), the model produces one final set of numbers: a raw score, called a **logit**, for *every single token in the entire vocabulary* — tens of thousands of numbers, one per possible next token, each representing how strongly the model favors that specific token as what comes next.

These raw logits aren't probabilities yet. They can be any real number
— positive, negative, large, small — and they don't sum to anything
meaningful on their own. Turning them into something usable is
**softmax**'s job.

---

## Softmax: turning raw scores into a real probability distribution

Softmax takes the raw logits and converts them into values that are all
between 0 and 1, summing to exactly 1 — a genuine probability
distribution over the entire vocabulary:

```python
import math

# toy logits for a few candidate next tokens, given "The cat sat on the ___"
logits = {"mat": 4.2, "floor": 3.1, "chair": 2.8, "moon": -1.5, "xylophone": -3.0}

def softmax(logits: dict) -> dict:
    exp_values = {token: math.exp(score) for token, score in logits.items()}
    total = sum(exp_values.values())
    return {token: value / total for token, value in exp_values.items()}

probabilities = softmax(logits)
for token, prob in probabilities.items():
    print(f"{token}: {prob:.3f}")
```
```
mat: 0.618
floor: 0.207
chair: 0.153
moon: 0.008
xylophone: 0.002
```
*(runs live, shows output — read-only demo snippet, not graded)*

`math.exp(score)` — [the same `math` module used for `sqrt()` back in the cosine similarity concept](→ this module, the embeddings lesson, cosine similarity concept) — exponentiates every logit, which guarantees every result is positive (even a negative logit like `moon`'s `-1.5` becomes a small positive number) and amplifies the *gap* between high and low scores. Dividing each exponentiated value by their total is what makes everything sum to exactly `1`. The result reads directly as "how likely is this token to come next": `"mat"` at `61.8%`, all the way down to `"xylophone"` at a vanishingly small `0.2%` — reflecting the original logits' ordering, just rescaled into genuine probabilities.

**Interactive: a live next-token distribution.** A text box where a
learner types a sentence and sees the actual top candidate next-tokens
displayed as a bar chart of their probabilities — directly showing what
this section describes, on a real sentence rather than a fixed toy
example.

---

## Every single token, this whole computation, again

This entire logit-then-softmax computation happens once per generated
token — not once per sentence, not once per response. Producing a whole
paragraph means running this full process, end to end through every
transformer layer, once for every single token in that paragraph. [The full consequences of that — including why it makes generation itself take real, ongoing computation](→ this module, autoregressive generation one token at a time concept) — is exactly what the next concept covers.

---

## Quiz cards

> **Q1.** What does the final transformer layer actually produce, before
> softmax is applied?
> - A) The single most likely next word, directly
> - B) A raw score (a logit) for every single token in the entire vocabulary ✅
> - C) A list of only the five most likely next tokens
> - D) A complete sentence

> **Q2.** Why can't raw logits be used directly as probabilities?
> - A) They can — logits and probabilities are the same thing
> - B) Logits can be any real number, including negative ones, and don't sum to anything meaningful — softmax is what converts them into values between 0 and 1 summing to exactly 1 ✅
> - C) Logits are always already between 0 and 1
> - D) Logits only exist for the first token generated, not subsequent ones

> **Q3.** What does exponentiating each logit (`math.exp(score)`)
> accomplish in the softmax computation?
> - A) It has no real effect on the final result
> - B) It guarantees every value is positive, even for a negative logit, and amplifies the gap between high-scoring and low-scoring tokens ✅
> - C) It converts each logit directly into a token
> - D) It removes low-scoring tokens from consideration entirely

> **Q4.** How often does the full logit-and-softmax computation actually
> happen during generation?
> - A) Once per entire response, regardless of length
> - B) Once for every single token generated — producing a full paragraph means running this whole process once per token in it ✅
> - C) Only for the very first token; subsequent tokens are generated differently
> - D) Once per sentence, not per token

---

*(End of Concept 1. This lesson continues with Concept 2 — autoregressive
generation, one token at a time — drafted separately.)*
