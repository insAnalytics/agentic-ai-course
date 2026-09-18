# Attention and Transformer Architecture

> **You'll be able to**
> - Explain why a fixed token embedding alone can't capture a word's
>   context-dependent meaning, and what attention actually does about it
> - Describe attention in terms of Query, Key, and Value, and compute a
>   simple weighted combination directly
> - Explain why attention has no inherent sense of order, and what
>   positional encoding adds to fix that
> - Describe how multi-head attention and a feedforward layer combine
>   into one transformer block, and how stacking many blocks builds
>   progressively richer representations
> - Explain mixture-of-experts at a conceptual level, and why it
>   decouples a model's total size from its actual per-token cost

**Why it matters**
Everything an LLM does — generating the next token, following
instructions, calling a tool correctly — happens through exactly this
architecture, running the same mechanism (attention, layer after layer)
over and over. Understanding it isn't just background knowledge: it's
what makes the rest of this module's claims about model behavior —
why context gets used unevenly, why reasoning models cost more, why a
model's total size doesn't tell you its actual running cost — land as
mechanical facts rather than things to just take on faith.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Given a fixed token embedding lookup table, what vector does
> `"bank"` get in `"river bank"` versus `"deposited money at the bank"`?
> - A) Two different vectors, reflecting each sentence's meaning
> - B) The exact same vector both times — the raw lookup only depends on the token itself ✅
> - C) A vector averaging every possible meaning of "bank"
> - D) An error, since "bank" is ambiguous

> **Q2.** What's the difference between a token's Query and its Key?
> - A) They're the same thing
> - B) Query represents what a token is looking for in context; Key represents what a token has to offer others looking for context ✅
> - C) Query is only used for the first token; Key is used for all others
> - D) Key determines the final output; Query has no real function

> **Q3.** Once relevance scores are computed, what actually gets
> combined to produce a token's new representation?
> - A) The relevance scores themselves, added together directly
> - B) Every token's Value, weighted by the normalized relevance scores ✅
> - C) Only the single highest-scoring token's embedding
> - D) The original token embeddings, entirely unchanged

> **Q4.** Why does attention alone fail to distinguish `"The dog bit the
> man"` from `"The man bit the dog"`?
> - A) It doesn't fail — attention already accounts for word order
> - B) Attention's relevance scores depend only on token content, not on where a token sits in the sequence ✅
> - C) These sentences actually use different tokens
> - D) Attention only works for sentences under five words

> **Q5.** What does positional encoding actually do?
> - A) It removes duplicate tokens from a sequence
> - B) It gives each position its own distinct vector, added onto a token's embedding, so the same token at different positions gets different starting representations ✅
> - C) It reorders tokens alphabetically
> - D) It replaces the token embedding entirely with a position number

> **Q6.** What does multi-head attention add, compared to running
> attention once?
> - A) It makes the model faster by skipping tokens
> - B) It runs several separate attention computations in parallel, each potentially sensitive to a different relationship, then combines the results ✅
> - C) It removes the need for positional encoding
> - D) It only applies to the first token in a sequence

> **Q7.** As a real LLM stacks many transformer blocks, what does each
> block actually operate on?
> - A) The original, raw token embeddings, every time
> - B) The previous block's output — each layer refines an already-contextualized representation ✅
> - C) A completely independent copy of the input
> - D) Only the final token in the sequence

> **Q8.** What does a mixture-of-experts model's router actually decide?
> - A) Which token comes next in the output
> - B) Which subset of the model's expert networks actually processes a given token ✅
> - C) How many layers the model should have
> - D) The router only operates once for the entire input, not per token

> **Q9.** Why can two models with very different total parameter counts
> end up costing roughly the same to run per token?
> - A) Parameter count never affects computational cost
> - B) If the larger model routes each token through only a small slice of its total experts, its actual per-token computation can resemble a much smaller model's ✅
> - C) This is impossible
> - D) Only non-MoE models have this property

---

## Closing synthesis — tracing one token through the full architecture

*(end of lesson, reflective rather than graded — following `"bank"`
through every mechanism covered in this lesson, tying the interactive
tools from Concepts 2 and 4 together into one narrative)*

Follow `"bank"` in `"I sat by the river bank"` through the full
pipeline, one step at a time:

1. **Token embedding lookup** — `"bank"` starts as a fixed vector,
   [looked up purely from its token ID](→ this lesson, why a token needs context not just its own embedding concept), identical to what `"bank"` would get in any other sentence at this stage.
2. **Positional encoding added** — that fixed vector gets combined with
   a vector [specific to `"bank"`'s position in this exact sentence](→ this lesson, positional encoding concept), making its starting representation already slightly different than an identical word at a different position would get.
3. **Layer 1: multi-head attention** — [several attention computations run in parallel](→ this lesson, stacking layers into a real transformer concept), each comparing `"bank"`'s Query against every other token's Key — `"river"` scores highly relevant, pulling `"bank"`'s representation toward a riverside meaning, [exactly as computed directly in Concept 2's demo](→ this lesson, the attention mechanism concept).
4. **Layer 1: feedforward** — that attention output gets further
   transformed by a feedforward network, completing one full transformer
   block.
5. **Layers 2 through N** — the same two-step process repeats, each
   layer refining an already-contextualized representation rather than
   starting over from the raw embedding — by the final layer, `"bank"`'s
   representation reflects not just `"river"`'s direct influence, but
   several rounds of progressively refined context.
6. **(If this were an MoE model)** — at each layer, [a router would have selected only a subset of that layer's experts](→ this lesson, mixture-of-experts concept) to actually process `"bank"`'s representation, rather than using every parameter in the layer.

Revisit [Concept 2's attention-weight visualization](→ this lesson, the attention mechanism concept, the interactive attention weights explanation) and [Concept 4's layer-stacking diagram](→ this lesson, stacking layers into a real transformer concept, the interactive layer stacking diagram explanation) side by side with this walkthrough — the goal is for every step above to correspond to something you can actually point at in one of those two tools, not just a description to take on faith.
