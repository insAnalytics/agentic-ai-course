# Module 1, Lesson 3 — Concept 3: Positional encoding

---

## Attention has no inherent sense of order

[Attention, from the previous concept](→ this lesson, the attention mechanism concept), computes relevance between tokens by comparing each token's Query against every other token's Key. Nothing about that comparison depends on *where* either token sits in the sequence — only on the tokens' own content. That's a real gap: word order carries enormous meaning in language.

```
"The dog bit the man."
"The man bit the dog."
```

Both sentences contain the exact same set of tokens — `the`, `dog`,
`bit`, `the`, `man` — just in a different order, and mean something
completely different as a result. Attention, exactly as described in
the previous concept, has no built-in way to tell these two orderings
apart — comparing Query against Key gives the same relevance scores
either way, since neither depends on sequence position at all.

---

## The fix: adding position directly into the representation

**Positional encoding** solves this by giving each *position* in the
sequence — 1st, 2nd, 3rd, and so on — its own distinct vector, added
directly onto a token's embedding before attention ever runs. The same
token appearing at two different positions ends up with two different
starting representations, purely because of where it sits:

```python
token_embedding = {"the": [0.10, 0.10]}   # the same vector every time "the" appears

# a simplified stand-in for real positional encoding — one distinct
# vector per position (real positional encodings are computed with a
# formula, not hand-set like this, but the shape of the idea is the same)
positional_encoding = {
    1: [0.00, 0.00],
    5: [-0.03, 0.08],
}

def position_aware_representation(token: str, position: int) -> list:
    base = token_embedding[token]
    pos = positional_encoding[position]
    return [base[i] + pos[i] for i in range(len(base))]

print(position_aware_representation("the", 1))
print(position_aware_representation("the", 5))
```
```
[0.1, 0.1]
[0.07, 0.18]
```
*(runs live, shows output — read-only demo snippet, not graded)*

The exact same word, `"the"`, produces two genuinely different starting
vectors — `[0.1, 0.1]` at position `1`, `[0.07, 0.18]` at position `5`.
Once position is baked directly into each token's representation this
way, attention's Query/Key comparisons — computed *on top of* these
position-aware vectors — can actually reflect order, because order is
now part of what each token's representation encodes, not something
attention has to separately track.

---

## Where this sits in the architecture

Positional encoding happens once, right after the token embedding
lookup and before attention runs at all — it's a preparation step, not
part of attention itself. This is worth being precise about, since it's
easy to assume order is somehow built into the attention mechanism —
it isn't; attention is fundamentally order-agnostic, and positional
encoding is the entire reason a transformer ends up sensitive to order
regardless.

---

## Quiz cards

> **Q1.** Why does attention, as described in the previous concept, fail
> to distinguish `"The dog bit the man"` from `"The man bit the dog"`?
> - A) It doesn't fail — attention already accounts for word order on its own
> - B) Attention's relevance scores come from comparing Query against Key, which depend only on token content, not on where a token sits in the sequence ✅
> - C) These two sentences actually use different tokens
> - D) Attention only works correctly for sentences under five words

> **Q2.** What does positional encoding actually do?
> - A) It removes duplicate tokens from a sequence
> - B) It gives each position in the sequence its own distinct vector, added onto a token's embedding, so the same token at different positions gets different starting representations ✅
> - C) It reorders tokens alphabetically before processing
> - D) It replaces the token embedding entirely with a position number

> **Q3.** Where does positional encoding happen relative to attention?
> - A) It's part of the attention mechanism itself, not a separate step
> - B) It happens as a preparation step, right after the token embedding lookup and before attention runs at all ✅
> - C) It only happens after attention has already processed the sequence
> - D) It happens once per entire document, not per token

> **Q4.** Why is it inaccurate to assume attention is inherently
> sensitive to word order?
> - A) It's actually accurate — attention does track order on its own
> - B) Attention is fundamentally order-agnostic by design; any sensitivity to order a transformer shows comes specifically from positional encoding being added beforehand ✅
> - C) Word order doesn't actually matter to how transformers work
> - D) Attention only ignores order for very short sequences

---

*(End of Concept 3. This lesson continues with Concept 4 — stacking
layers into a real transformer — drafted separately.)*
