# Module 1, Lesson 5 — Concept 1: Greedy decoding vs. sampling — the baseline choice

---

## The question Lesson 4 deferred

[Lesson 4 established the full generation loop](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept) — logits, softmax, a probability distribution over the entire vocabulary, one step deliberately left open: exactly *how* does a single token actually get picked from that distribution? That's this lesson's job, starting with the two most basic answers.

---

## Greedy decoding: always take the top candidate

The simplest possible choice: always pick whichever token has the
highest probability.

```python
distribution = {"mat": 0.618, "floor": 0.207, "chair": 0.153, "moon": 0.008, "xylophone": 0.002}

def greedy_choice(probabilities: dict) -> str:
    return max(probabilities, key=probabilities.get)

print(greedy_choice(distribution))
print(greedy_choice(distribution))
print(greedy_choice(distribution))
```
```
mat
mat
mat
```
*(runs live, shows output — read-only demo snippet, not graded)*

`max(probabilities, key=probabilities.get)` — [the exact same pattern used for finding the most frequent pair back in Lesson 1's BPE demo](→ this module, the tokenization lesson, subword tokenization bpe concept) — always returns `"mat"`, every single time, since it's always the single highest-scoring candidate. Greedy decoding is fully deterministic: the same distribution always produces the same choice. The real drawback shows up over a long generation, not a single token: always taking the "safest" option at every step tends to produce text that's noticeably repetitive, bland, and predictable, sometimes even getting stuck looping on the same phrase — never taking a genuinely less-likely-but-still-reasonable path, because greedy decoding structurally can't.

---

## Sampling: actually drawing from the distribution

The alternative: instead of always taking the top candidate, genuinely
sample a token according to the probabilities themselves — a token with
a `20%` probability should actually get chosen roughly `20%` of the
time, not simply lose to whichever token happens to be highest:

```python
import random

def sample_choice(probabilities: dict) -> str:
    tokens = list(probabilities.keys())
    weights = list(probabilities.values())
    return random.choices(tokens, weights=weights, k=1)[0]

random.seed(42)   # fixes randomness for this demo's output — real sampling wouldn't do this
for _ in range(5):
    print(sample_choice(distribution))
```
```
mat
floor
mat
mat
chair
```
*(runs live, shows output — read-only demo snippet, not graded)*

`random.choices(tokens, weights=weights, k=1)` is a new tool worth
naming directly: it draws one item from `tokens`, where each item's
chance of being picked is proportional to its corresponding entry in
`weights` — precisely "draw according to these probabilities," rather
than "always pick the biggest one." `"mat"` still comes up most often
here, since it genuinely has the highest probability — but `"floor"` and
`"chair"` also get picked sometimes, reflecting their real, nonzero
share of the distribution. `random.seed(42)` is only present to make
this specific demo's output reproducible for teaching purposes; real
generation never fixes a seed this way, which is exactly why sampling
produces genuinely different output across separate runs, even from an
identical prompt.

**Interactive: a decoding playground.** A live tool showing a real
next-token distribution for a sentence you enter, with a toggle between
greedy and sampling — switching it live and watching how the actual
chosen next token changes (or doesn't) between the two modes. [The rest of this lesson's controls](→ this lesson, temperature reshaping the distribution before sampling concept) build directly onto this same tool.

---

## Quiz cards

> **Q1.** What does greedy decoding always do?
> - A) Randomly select any token from the vocabulary
> - B) Always pick whichever token has the single highest probability in the distribution ✅
> - C) Pick a token based on how recently it was last used
> - D) Combine the top three candidates into one output

> **Q2.** Why does greedy decoding tend to produce repetitive or
> predictable text over a long generation?
> - A) It doesn't — greedy decoding always produces the most varied output
> - B) Always taking the highest-probability option at every single step structurally never takes a genuinely less-likely-but-still-reasonable path, which compounds into noticeably repetitive or looping output ✅
> - C) Greedy decoding only works for short responses
> - D) Repetition is caused by a separate, unrelated mechanism

> **Q3.** What does `random.choices(tokens, weights=weights, k=1)`
> actually do?
> - A) It always returns the token with the highest weight
> - B) It draws one token from `tokens`, where each token's chance of being selected is proportional to its corresponding weight — genuinely sampling according to the probabilities, not just taking the top one ✅
> - C) It sorts the tokens by weight and returns the full sorted list
> - D) It ignores the weights entirely and picks uniformly at random

> **Q4.** Why might sampling produce `"floor"` sometimes, even though
> `"mat"` has a much higher probability in the same distribution?
> - A) This shouldn't happen — sampling should always match greedy decoding's result
> - B) Sampling genuinely respects each token's actual probability — `"floor"` has a real, nonzero chance of being selected, just less often than `"mat"` ✅
> - C) `random.choices()` ignores probability entirely and picks randomly
> - D) `"floor"` and `"mat"` actually have identical probabilities in this example

---

*(End of Concept 1. This lesson continues with Concept 2 —
temperature, reshaping the distribution before sampling — drafted
separately.)*
