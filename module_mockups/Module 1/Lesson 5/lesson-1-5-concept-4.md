# Module 1, Lesson 5 — Concept 4: Frequency penalty vs. presence penalty

---

## Why another repetition control is needed at all

[Sampling already reduces greedy decoding's repetition problem](→ this lesson, greedy decoding vs sampling the baseline choice concept), but it doesn't eliminate it — a token that's already appeared can still remain genuinely high-probability, and get sampled again, and again, producing text that loops or over-uses the same word. Frequency and presence penalties are two more controls, applied directly to logits *before* softmax runs, specifically to discourage a token the generation has already used.

---

## Frequency penalty: the penalty grows with repeated use

Frequency penalty subtracts an amount from a token's logit that scales
directly with how many times that token has already appeared in the
generation so far — the more it's been used, the larger the penalty
gets:

```python
def frequency_penalty_adjustment(logit: float, times_used: int, penalty: float) -> float:
    return logit - (penalty * times_used)
```

## Presence penalty: a flat penalty, triggered once

Presence penalty subtracts a fixed amount the moment a token has
appeared *at all* — regardless of whether it's appeared once or ten
times, the penalty never grows beyond that one flat amount:

```python
def presence_penalty_adjustment(logit: float, times_used: int, penalty: float) -> float:
    return logit - (penalty if times_used > 0 else 0)
```

## The distinction, made concrete

```python
base_logit = 5.0
penalty = 1.0

for times_used in [0, 1, 2, 3]:
    freq_adjusted = frequency_penalty_adjustment(base_logit, times_used, penalty)
    presence_adjusted = presence_penalty_adjustment(base_logit, times_used, penalty)
    print(f"used {times_used}x -> frequency: {freq_adjusted}, presence: {presence_adjusted}")
```
```
used 0x -> frequency: 5.0, presence: 5.0
used 1x -> frequency: 4.0, presence: 4.0
used 2x -> frequency: 3.0, presence: 4.0
used 3x -> frequency: 2.0, presence: 4.0
```
*(runs live, shows output — read-only demo snippet, not graded)*

At `0` and `1` prior uses, both penalties behave identically. The real
difference shows up from `2` uses onward: frequency penalty keeps
subtracting more with every additional repetition (`3.0`, then `2.0`),
while presence penalty stays fixed at `4.0` forever, once triggered —
it only ever cares *whether* a token has appeared, never *how many*
times.

---

## When each one actually fits

Frequency penalty is the better tool for discouraging genuine
word-level loops or over-repetition — a word used five times gets
noticeably more discouraged than a word used once, exactly matching the
severity of the actual problem. Presence penalty is better suited to a
different goal: nudging generation toward introducing new topics or
vocabulary at least once, without continuing to punish a word every
single additional time it's legitimately needed — a technical term that
genuinely needs repeating (like `"Pydantic"` across a technical
explanation) gets penalized once under presence penalty and never
further, whereas frequency penalty would keep making it more and more
expensive to use again, even when repeating it is actually the right
call.

---

## Quiz cards

> **Q1.** How does frequency penalty's effect on a token's logit change
> as that token gets used more times?
> - A) It stays exactly the same no matter how many times the token is used
> - B) It grows larger with each additional use — the penalty scales directly with repetition count ✅
> - C) It only applies the first time a token is used, then disappears
> - D) It decreases the more a token is used

> **Q2.** How does presence penalty behave differently from frequency
> penalty, once a token has appeared more than once?
> - A) They behave identically in every case
> - B) Presence penalty stays fixed at the same flat amount regardless of additional uses, while frequency penalty keeps growing ✅
> - C) Presence penalty grows even faster than frequency penalty
> - D) Presence penalty resets to zero after the second use

> **Q3.** Why might presence penalty be the better choice for a
> response that legitimately needs to repeat a specific technical term
> many times?
> - A) Presence penalty prevents the term from being used at all after the first time
> - B) It only applies one flat penalty the first time the term appears, without continuing to make every additional legitimate repetition increasingly expensive the way frequency penalty would ✅
> - C) Presence penalty and frequency penalty behave identically in this case
> - D) Technical terms are automatically exempt from both penalty types

---

*(End of Concept 4. This lesson continues with Concept 5 — logprobs,
inspecting how confident the model actually was — drafted separately.)*
