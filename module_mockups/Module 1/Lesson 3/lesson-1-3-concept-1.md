# Module 1, Lesson 3 — Concept 1: Why a token needs context, not just its own embedding

---

## The same token, the same embedding, every time

[A token embedding, from the previous lesson](→ this module, the embeddings lesson, token embeddings the models internal input layer concept), is a lookup — the same token ID always maps to the exact same vector, no matter where that token appears:

```python
embedding_table = {
    "bank": [0.50, 0.20],   # one fixed vector, looked up by token, nothing else
}

sentence_a = "I sat by the river bank"
sentence_b = "I deposited money at the bank"

# both instances of "bank" are the same token, so the raw lookup
# returns the exact same vector for both, regardless of context
print(embedding_table["bank"])
print(embedding_table["bank"])
```
```
[0.5, 0.2]
[0.5, 0.2]
```
*(runs live, shows output — read-only demo snippet, not graded)*

But `"bank"` in `"river bank"` and `"bank"` in `"deposited money at the
bank"` mean two almost completely unrelated things — a riverside, and a
financial institution. The raw token embedding, looked up purely from
the token ID with no knowledge of anything around it, has absolutely no
way to tell those two meanings apart. Both instances get the identical
vector, identical position in meaning-space, despite meaning genuinely
different things.

---

## What's actually needed: letting context shape a token's meaning

This is a real limitation, not a minor imprecision — a huge amount of
what makes language meaningful depends entirely on context: which other
words surround a given word, in what order, in what relationship to it.
A token embedding on its own is necessarily "context-blind" — it's a
fixed lookup, computed once during training and never adjusted per
sentence. What's needed is some mechanism that takes those fixed token
embeddings as a *starting point*, and then lets each token's
representation shift based on the actual other tokens sitting around it
in that specific sentence — so `"bank"` near `"river"` ends up
represented differently than `"bank"` near `"deposited money."`

That mechanism is **attention** — [covered directly next](→ this lesson, the attention mechanism concept) — and it's the actual reason a transformer needs more than just an embedding lookup table to work at all.

---

## Quiz cards

> **Q1.** Given a fixed token embedding lookup table, what vector does
> `"bank"` in `"river bank"` get, compared to `"bank"` in `"deposited
> money at the bank"`?
> - A) Two different vectors, reflecting each sentence's meaning
> - B) The exact same vector both times — the raw lookup only depends on the token itself, not on anything around it ✅
> - C) A vector that's an average of every possible meaning of "bank"
> - D) An error, since "bank" is ambiguous

> **Q2.** Why is a token embedding, on its own, considered
> "context-blind"?
> - A) It's never actually true — token embeddings already account for context
> - B) It's a fixed lookup computed once during training, with no mechanism to adjust based on the specific other words surrounding it in a given sentence ✅
> - C) Context-blindness only affects rare words, never common ones
> - D) Token embeddings are recomputed for every new sentence

> **Q3.** What's actually needed to let a token's representation reflect
> its specific context, rather than staying fixed regardless of
> surrounding words?
> - A) A larger embedding table with more entries
> - B) A mechanism that takes the fixed token embeddings as a starting point and lets each token's representation shift based on the other tokens actually present in that sentence ✅
> - C) Simply increasing the number of dimensions in each token's embedding
> - D) Nothing — context doesn't actually affect meaning in practice

---

*(End of Concept 1. This lesson continues with Concept 2 — the
attention mechanism — drafted separately.)*
