# Module 1, Lesson 6 — Concept 1: What a context window actually is, and what happens past it

---

## The total token budget for one request

A **context window** is the maximum number of tokens a model can
process in a single request — everything counted together: the prompt,
any conversation history, documents provided, and (as [the next concept covers directly](→ this lesson, max output length vs context window concept)) the response itself. It isn't an arbitrary business limit — it comes directly from the architecture [covered in Lesson 3](→ this module, the attention and transformer architecture lesson).

---

## Why there's a limit at all: attention's real computational cost

[Attention, from Lesson 3](→ this module, the attention and transformer architecture lesson, the attention mechanism concept), computes a relevance score between *every pair* of tokens in the sequence — every token compares its Query against every other token's Key. That means the amount of computation required grows with the *square* of the sequence length, not linearly with it:

```python
def attention_pair_count(sequence_length: int) -> int:
    return sequence_length ** 2

for length in [10, 100, 1000, 10000]:
    print(f"{length} tokens -> {attention_pair_count(length):,} pairs to compute")
```
```
10 tokens -> 100 pairs to compute
100 tokens -> 10,000 pairs to compute
1000 tokens -> 1,000,000 pairs to compute
10000 tokens -> 100,000,000 pairs to compute
```
*(runs live, shows output — read-only demo snippet, not graded)*

A 10× increase in sequence length produces a 100× increase in the
number of pairwise comparisons attention actually has to compute — this
quadratic growth is the real, mechanical reason a context window has a
hard limit at all, not just a policy choice: processing an arbitrarily
long sequence would require an arbitrarily, impractically large amount
of computation.

---

## What happens when you exceed it

Exactly what happens past the limit depends on the specific system, but
falls into a few common patterns: an outright error, rejecting the
request entirely until it's shortened; silent truncation, where older
content (often from the very beginning) simply gets dropped to make
room; or a sliding window, keeping only the most recent portion of a
long conversation and discarding what came before it. None of these are
universal — the important, portable fact is simply that a context
window is a hard ceiling, not a soft suggestion, and something concrete
happens once content exceeds it, whether or not that behavior is
visible or obvious from the outside.

---

## Quiz cards

> **Q1.** What does a context window actually measure?
> - A) Only the length of the model's response
> - B) The maximum total number of tokens a model can process in a single request — prompt, history, and response combined ✅
> - C) The number of separate conversations a model can hold at once
> - D) The physical memory size of the server running the model

> **Q2.** Why does attention's computational cost grow with the square
> of sequence length, rather than growing linearly?
> - A) It doesn't — attention's cost scales linearly with sequence length
> - B) Attention computes a relevance score between every pair of tokens, so the number of pairwise comparisons grows quadratically as the sequence gets longer ✅
> - C) Quadratic growth only applies to very short sequences
> - D) This is a software inefficiency that could be fixed with faster hardware alone

> **Q3.** What's the real, mechanical reason a context window has a hard
> limit at all?
> - A) It's purely an arbitrary business decision unrelated to how the model works
> - B) Attention's quadratic computational cost means processing an arbitrarily long sequence would require an arbitrarily, impractically large amount of computation ✅
> - C) Context windows exist only to control how much a user is billed
> - D) There's no real technical reason — it could be removed entirely with no consequence

---

*(End of Concept 1. This lesson continues with Concept 2 — max output
length vs. context window — drafted separately.)*
