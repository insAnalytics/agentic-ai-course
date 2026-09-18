# Module 1, Lesson 5 — Concept 3: Top-p and top-k — restricting the sampling pool itself

---

## A genuinely different lever than temperature

[Temperature reshapes probabilities](→ this lesson, temperature reshaping the distribution before sampling concept) — but even at very high temperature, every token still has *some* nonzero chance of being sampled, however tiny. Top-p and top-k work differently: they cut candidates *out of the pool entirely* before sampling ever happens, regardless of temperature — a genuinely separate control, not another way of tuning the same thing.

---

## Top-k: keep a fixed number of candidates

Top-k keeps only the `k` highest-probability tokens, discards
everything else, and renormalizes what remains so the probabilities
still sum to `1`:

```python
distribution = {"mat": 0.618, "floor": 0.207, "chair": 0.153, "moon": 0.008, "xylophone": 0.002}

def top_k_filter(probabilities: dict, k: int) -> dict:
    top_tokens = sorted(probabilities, key=probabilities.get, reverse=True)[:k]
    filtered = {token: probabilities[token] for token in top_tokens}
    total = sum(filtered.values())
    return {token: value / total for token, value in filtered.items()}

print(top_k_filter(distribution, k=2))
```
```
{'mat': 0.749, 'floor': 0.251}
```
*(runs live, shows output — read-only demo snippet, not graded)*

`sorted(probabilities, key=probabilities.get, reverse=True)[:k]` —
[list slicing, exactly as covered in Module 0](→ Module 0, the data structures lesson, lists concept) — keeps only the top 2 candidates; `"chair"`, `"moon"`, and `"xylophone"` are discarded entirely, not just down-weighted, and the surviving two get renormalized so they still sum to `1`.

---

## Top-p (nucleus sampling): keep just enough to cover a probability mass

Top-p works differently: instead of a fixed *count*, it keeps the
smallest set of tokens whose cumulative probability reaches at least
`p`:

```python
def top_p_filter(probabilities: dict, p: float) -> dict:
    sorted_tokens = sorted(probabilities, key=probabilities.get, reverse=True)
    filtered = {}
    cumulative = 0.0
    for token in sorted_tokens:
        filtered[token] = probabilities[token]
        cumulative += probabilities[token]
        if cumulative >= p:
            break
    total = sum(filtered.values())
    return {token: value / total for token, value in filtered.items()}

print(top_p_filter(distribution, p=0.9))
```
```
{'mat': 0.632, 'floor': 0.212, 'chair': 0.156}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice this kept **three** tokens, not two — `"mat"` and `"floor"`
together only reach `82.5%` cumulative probability, short of the `0.9`
threshold, so `"chair"` gets included too, pushing the total to
`97.8%`, at which point the loop stops.

---

## Why top-p adapts and top-k doesn't

This is the real practical difference, worth seeing directly: top-k
always keeps exactly `k` tokens, no matter how confident or uncertain
the underlying distribution actually is. Top-p adapts to that
confidence automatically:

```python
flat_distribution = {"a": 0.25, "b": 0.24, "c": 0.23, "d": 0.15, "e": 0.13}
print(top_p_filter(flat_distribution, p=0.9))
```
```
{'a': 0.25, 'b': 0.24, 'c': 0.23, 'd': 0.15, 'e': 0.13}
```
*(runs live, shows output — read-only demo snippet, not graded)*

With the same `p=0.9` threshold, this genuinely uncertain, nearly-flat
distribution needs *all five* tokens to even reach `90%` cumulative
probability — nothing gets discarded at all. Compare that to the
`"mat"`-dominated distribution above, where top-p needed only three
tokens to hit the same threshold. Top-k, applied to both distributions
with the same fixed `k=2`, would have discarded three real, genuinely
competitive candidates from the flat distribution — exactly the case
where top-p's adaptiveness matters: it naturally allows more variety
when the model is genuinely uncertain, and less variety when it's
genuinely confident, rather than forcing the same fixed pool size onto
both situations.

**Interactive: top-p and top-k controls, live.** Two more sliders added
to [the decoding playground](→ this lesson, greedy decoding vs sampling the baseline choice concept) — watch candidates actually drop out of the pool as each threshold tightens, on a real distribution for a sentence you type.

---

## Quiz cards

> **Q1.** What's the core difference between what temperature does and
> what top-p/top-k do?
> - A) They're two names for exactly the same mechanism
> - B) Temperature reshapes probabilities without removing any candidate; top-p/top-k remove candidates from the pool entirely before sampling ✅
> - C) Top-p/top-k only apply to the first token generated
> - D) Temperature can only increase probabilities, never decrease them

> **Q2.** What does `top_k_filter(distribution, k=2)` do to tokens
> outside the top 2?
> - A) It reduces their probability slightly but keeps them in the pool
> - B) It discards them entirely — only the top `k` candidates remain, renormalized to sum to 1 ✅
> - C) It doubles their probability to compensate
> - D) It has no effect on tokens outside the top `k`

> **Q3.** Why did `top_p_filter(distribution, p=0.9)` keep three tokens,
> not two, on the `"mat"`-dominated distribution?
> - A) This is a bug — top-p should always keep exactly two tokens
> - B) `"mat"` and `"floor"` together only reached 82.5% cumulative probability, short of the 0.9 threshold, so a third token was needed to cross it ✅
> - C) Top-p always keeps at least three tokens regardless of the distribution
> - D) `p=0.9` and `p=2` produce identical results

> **Q4.** Why does top-p keep all five tokens for the flat distribution
> but only three for the `"mat"`-dominated one, using the same `p=0.9`?
> - A) This is inconsistent behavior and indicates an error
> - B) Top-p adapts to the distribution's actual shape — a flat, uncertain distribution needs more tokens to reach the same cumulative threshold than a sharply peaked one does ✅
> - C) The flat distribution's probabilities don't actually sum to 1
> - D) Top-p ignores probability values entirely and just counts tokens

---

*(End of Concept 3. This lesson continues with Concept 4 — frequency
penalty vs. presence penalty — drafted separately.)*
