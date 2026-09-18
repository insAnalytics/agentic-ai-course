# Module 1, Lesson 3 — Concept 4: Stacking layers into a real transformer

---

## Multi-head attention: several relevance computations at once

[A single attention computation, from Concept 2](→ this lesson, the attention mechanism concept), captures one particular pattern of relevance between tokens. A real transformer runs several of these in parallel — called **heads** — each with its own separately-learned Query/Key/Value computation, potentially picking up on different kinds of relationships in the same sentence: one head might end up sensitive to grammatical structure (which word is the subject of which verb), another to longer-range topical relationships, without anyone explicitly telling either head what to specialize in. The results from every head get combined into one final, richer representation per token. This is **multi-head attention** — the same core mechanism from Concept 2, just run several times side by side instead of once.

---

## One transformer block, and stacking many of them

Multi-head attention, followed by a smaller feedforward network applied
to each token's representation individually, together make up one
**transformer block** (or layer). A real LLM stacks many of these
blocks — dozens, in a large model — one after another, where each
block's output becomes the *next* block's input:

**Interactive: a layer-stacking diagram.** A vertical stack of blocks,
each labeled "multi-head attention + feedforward," with an input token
sequence flowing in at the bottom and a progressively transformed
representation flowing up through each block in turn — a learner can
step through the stack one layer at a time, watching the same starting
tokens get progressively re-represented at each stage.

Each layer takes the previous layer's output and refines it further —
attention re-weighting relevance based on the *already-contextualized*
representations from the layer before, not the raw token embeddings
anymore, by the time you're several layers deep. This repeated
refinement, one layer building on the last, is what "a transformer"
actually names — attention is one mechanism inside it, not the whole
architecture by itself.

---

## What different layers tend to capture — with real caution

It's genuinely tempting to say something clean like "early layers
capture grammar, later layers capture meaning" — there's a real, broad
trend in that direction, observed across various interpretability
studies, but it's worth being honest that exactly what any given layer
represents is an active, unsettled area of research, not a fully solved
or agreed-upon picture. The safer, defensible claim: representations do
tend to become progressively more abstract and context-integrated as
they pass through more layers, but pinning down precisely *what* each
individual layer is "doing" in a crisp, human-interpretable way remains
genuinely difficult and contested — a caveat worth carrying forward
rather than treating this as more settled than it actually is.

---

## Quiz cards

> **Q1.** What does multi-head attention add, compared to running
> attention once?
> - A) It makes the model faster by skipping some tokens
> - B) It runs several separate attention computations in parallel, each potentially sensitive to a different kind of relationship, then combines their results ✅
> - C) It removes the need for positional encoding
> - D) It only applies to the very first token in a sequence

> **Q2.** What makes up one transformer block?
> - A) A single attention computation, with nothing else
> - B) Multi-head attention, followed by a feedforward network applied to each token's representation individually ✅
> - C) Only the feedforward network, with attention applied separately elsewhere
> - D) Positional encoding alone

> **Q3.** As a real LLM stacks many transformer blocks, what does each
> block actually operate on?
> - A) The original, raw token embeddings, every single time
> - B) The previous block's output — each layer refines an already-contextualized representation, not the raw starting embeddings ✅
> - C) A completely independent copy of the input sequence
> - D) Only the final token in the sequence

> **Q4.** Why does this concept avoid stating a specific, crisp claim
> like "layer 3 always captures grammar, layer 10 always captures
> meaning"?
> - A) Because layers don't actually process information differently at all
> - B) Because exactly what any given layer represents is an active, genuinely unsettled area of research — the broad trend toward increasing abstraction is real, but precise per-layer claims overstate how settled the picture actually is ✅
> - C) Because transformers don't actually have multiple layers
> - D) Because this claim has been definitively proven false

---

*(End of Concept 4. This lesson continues with Concept 5 —
mixture-of-experts — drafted separately.)*
