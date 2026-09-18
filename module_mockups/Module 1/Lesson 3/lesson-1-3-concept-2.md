# Module 1, Lesson 3 — Concept 2: The attention mechanism

---

## The core idea: a weighted combination of every other token

Attention answers [the problem from the previous concept](→ this lesson, why a token needs context not just its own embedding concept) directly: for each token, it computes a *new*, context-aware representation by combining information from *every* token in the sequence — including itself — weighted by how relevant each one is to understanding this particular token, in this particular sentence.

For `"bank"` in `"I sat by the river bank"`, attention would assign a
high weight to `"river"` — genuinely relevant to figuring out which
`"bank"` this is — and low weights to less relevant words like `"I"` or
`"sat"`. The resulting representation for `"bank"` ends up shifted
toward "riverside," pulled there by `"river"`'s heavy influence in the
weighted combination.

---

## Query, Key, Value — the mechanism that produces those weights

Attention computes those relevance weights using three derived
representations for every token, each capturing a different role:

- **Query** — "what is this token looking for?" A representation of
  what kind of context this specific token needs to be understood
  correctly.
- **Key** — "what do I offer?" Every token, including the one doing the
  "looking," has a Key describing what information it can provide to
  others.
- **Value** — "what do I actually contribute?" The real content that
  gets passed along, once a token's relevance has been determined.

The process: `"bank"`'s Query gets compared against *every* token's Key
(including its own) — a comparison that produces a relevance score per
token. Those scores get normalized into weights that sum to `1`
(a small technical step called softmax, [the same normalized-probability idea covered directly in the next lesson](→ this module, how llms generate text lesson, decoding strategies and generation controls concept)), and those weights are what actually gets used to combine every token's *Value* into `"bank"`'s new, context-shifted representation.

---

## The weighted combination, made concrete

```python
# toy attention weights for "bank" in "I sat by the river bank" —
# in a real model these come from comparing Query against every Key
attention_weights = {
    "I": 0.02, "sat": 0.03, "by": 0.02,
    "the": 0.03, "river": 0.80, "bank": 0.10,
}

# each token's own Value vector — what it actually contributes
values = {
    "I": [0.1, 0.0], "sat": [0.0, 0.1], "by": [0.0, 0.0],
    "the": [0.0, 0.0], "river": [0.9, 0.1], "bank": [0.5, 0.2],
}

def contextualized_representation(weights: dict, values: dict) -> list:
    result = [0.0, 0.0]
    for token, weight in weights.items():
        for i in range(len(result)):
            result[i] += weight * values[token][i]
    return result

print(contextualized_representation(attention_weights, values))
```
```
[0.775, 0.115]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`"bank"`'s new representation, `[0.775, 0.115]`, lands close to
`"river"`'s own Value vector (`[0.9, 0.1]`) — exactly what an `0.80`
attention weight on `"river"` should produce. This is the actual
mechanism behind [Concept 1's motivating problem](→ this lesson, why a token needs context not just its own embedding concept): the same starting token embedding for `"bank"` ends up in a meaningfully different place after attention, depending entirely on which other tokens are actually present and how relevant they are.

**Interactive: attention weights, for a sentence you choose.** Type a
sentence, click any token, and see every other token highlighted by
attention weight — brighter for tokens the selected one is attending to
most heavily. Trying this on a genuinely ambiguous word (like `"bank"`,
or `"it"` in a sentence with two possible referents) shows the weights
concretely favoring whichever context actually disambiguates it.

---

## Quiz cards

> **Q1.** What does attention actually compute, for each token in a
> sequence?
> - A) A completely new, randomly generated vector
> - B) A new, context-aware representation, built as a weighted combination of every token's information — including its own — weighted by relevance ✅
> - C) A single number representing the token's importance
> - D) The token's original dictionary definition

> **Q2.** What's the difference between a token's Query and its Key, at
> a conceptual level?
> - A) They're the same thing, just different names
> - B) Query represents what a token is looking for in its context; Key represents what a token has to offer other tokens looking for context ✅
> - C) Query is used only for the first token in a sequence; Key is used for all others
> - D) Key determines a token's final output; Query has no real function

> **Q3.** Once relevance scores between a token's Query and every other
> token's Key are computed, what actually gets combined to produce the
> new representation?
> - A) The relevance scores themselves, added together directly
> - B) Every token's Value, weighted by the normalized relevance scores ✅
> - C) Only the single highest-scoring token's embedding, discarding the rest
> - D) The original token embeddings, entirely unchanged

> **Q4.** In the live demo, why does `"bank"`'s resulting representation
> end up close to `"river"`'s Value vector specifically?
> - A) It's coincidental and unrelated to the attention weights used
> - B) `"river"` was assigned the highest attention weight (`0.80`), so it dominates the weighted combination that produces `"bank"`'s new representation ✅
> - C) `"river"` and `"bank"` always end up with identical representations regardless of weights
> - D) The weighted combination ignores `"river"` entirely and uses only `"bank"`'s own Value

---

*(End of Concept 2. This lesson continues with Concept 3 — positional
encoding — drafted separately.)*
