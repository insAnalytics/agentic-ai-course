# Module 1, Lesson 5 — Concept 5: Logprobs — inspecting how confident the model actually was

---

## The signal Lesson 4 pointed at, now a real tool

[Lesson 4's closing synthesis noted](→ this module, how llms generate text lesson) that a distribution's *shape* — one dominant candidate versus several closely competing ones — often reveals more about how settled an answer actually is than the fluency of the final generated text ever does. **Logprobs** are the actual, practical way to access that signal directly: most APIs can return, alongside the generated text itself, the exact probability the model assigned to each token it chose.

---

## Why *log* probability, specifically

A logprob is the natural logarithm of a token's probability, not the
raw probability itself. The reason comes down to how probabilities
combine across a sequence: the probability of an entire generated
sequence is the *product* of every individual token's probability —
multiplying many numbers, each already less than `1`, together
repeatedly produces extremely tiny numbers very quickly, awkward to
work with and prone to numerical precision problems. Taking the
logarithm converts that multiplication into simple addition
(`log(a × b) = log(a) + log(b)`), which is both numerically far more
stable and much easier to actually compute with across a long sequence.

---

## Reading a logprob directly

Since probability is always between `0` and `1`, its logarithm is
always zero or negative — `log(1) = 0`, and anything below `1` produces
a negative number, getting more negative the closer the original
probability was to `0`. This gives a simple reading rule: a logprob
close to `0` means high confidence; a strongly negative logprob means
low confidence, even for the token that ultimately "won."

```python
import math

def to_logprobs(probabilities: dict) -> dict:
    return {token: math.log(prob) for token, prob in probabilities.items()}

confident_distribution = {"Paris": 0.936, "Lyon": 0.032, "Marseille": 0.032}
uncertain_distribution = {"Aldric Thorne": 0.394, "Marcus Reed": 0.323, "Elena Vasquez": 0.283}

print(to_logprobs(confident_distribution))
print(to_logprobs(uncertain_distribution))
```
```
{'Paris': -0.066, 'Lyon': -3.442, 'Marseille': -3.442}
{'Aldric Thorne': -0.931, 'Marcus Reed': -1.13, 'Elena Vasquez': -1.263}
```
*(runs live, shows output — read-only demo snippet, not graded)*

These are [the exact confident-fact and fabricated-scenario distributions from Lesson 4](→ this module, how llms generate text lesson, the model predicts it doesnt know grounded in mechanics concept). `"Paris"`'s logprob, `-0.066`, sits right next to `0` — genuine, strong confidence. `"Aldric Thorne"`'s logprob, `-0.931`, is meaningfully more negative — the model "won" that token over its competitors, but with far less certainty than `"Paris"` had, a distinction the generated text alone (a fluently stated name, either way) would never reveal.

---

## Why this is practically useful

A generated response reads equally fluent whether the model was highly
confident or barely edged out a close competitor — that's [precisely what made hallucination hard to spot from the text alone, back in Lesson 4](→ this module, how llms generate text lesson, hallucination as a direct consequence concept). Logprobs give a way to check, after generation, whether a specific claim came from a strongly confident distribution or a much closer call — a genuinely useful signal for flagging outputs worth double-checking, even though this lesson stops short of covering how that signal gets used in a real evaluation or confidence-scoring pipeline, which belongs to later parts of this course.

---

## Quiz cards

> **Q1.** What is a logprob, mathematically?
> - A) The raw probability itself, unmodified
> - B) The natural logarithm of a token's probability ✅
> - C) The number of times a token appeared in training data
> - D) A count of how many tokens were considered before this one

> **Q2.** Why is log probability preferred over raw probability when
> working with an entire generated sequence?
> - A) Log values are always positive, which is easier to display
> - B) A sequence's overall probability is the product of many individual probabilities, and taking logs converts that multiplication into addition, which is numerically more stable ✅
> - C) Raw probabilities can't be computed for sequences longer than one token
> - D) Logprobs are only used for very short sequences

> **Q3.** What does a logprob close to `0` indicate, compared to a
> strongly negative logprob?
> - A) A logprob close to 0 indicates low confidence; strongly negative indicates high confidence
> - B) A logprob close to 0 indicates high confidence (probability near 1); a strongly negative logprob indicates lower confidence ✅
> - C) Logprob values have no relationship to confidence at all
> - D) Only positive logprob values are ever possible

> **Q4.** Why does `"Aldric Thorne"`'s logprob reveal something the
> generated text itself wouldn't?
> - A) It doesn't — fluent text and logprobs always convey identical information
> - B) The generated name reads equally fluent regardless of confidence; the meaningfully negative logprob reveals that this token only narrowly beat its competitors, unlike a case with much stronger confidence ✅
> - C) `"Aldric Thorne"` is grammatically incorrect, which the logprob detects
> - D) Logprobs can only be computed for real, factual answers

---

*(End of Concept 5. This lesson continues with Concept 6 — stop
sequences, and nondeterminism even at temperature 0 — drafted
separately.)*
