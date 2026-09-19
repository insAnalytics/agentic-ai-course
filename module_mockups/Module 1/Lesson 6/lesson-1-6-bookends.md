# Context Windows and KV Cache

> **You'll be able to**
> - Explain why a context window has a hard limit, grounded in
>   attention's quadratic computational cost
> - Explain why input and output tokens share one total budget, not two
>   separate ones
> - Explain what a KV cache stores and why it eliminates redundant
>   computation, both within one generation and across separate requests
> - Structure a prompt — stable content first, variable content last —
>   to maximize cache-hit rate, and explain why this is a real cost and
>   latency lever, not a style preference
> - Explain the lost-in-the-middle effect and why a large context window
>   doesn't guarantee every token inside it gets used equally well

**Why it matters**
Every one of this lesson's five ideas turns directly into a practical
decision the moment you're actually designing a prompt for a real
system: how much room is really left for a response, whether a prompt's
structure is quietly costing more than it needs to, and whether a
critical instruction buried in a long document is actually going to get
used. None of this is optional detail — it's the difference between an
agent that behaves reliably at scale and one that quietly wastes budget
or drops information nobody realizes it dropped.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** What does a context window actually measure?
> - A) Only the length of the model's response
> - B) The maximum total number of tokens a model can process in a single request — prompt, history, and response combined ✅
> - C) The number of separate conversations a model can hold at once
> - D) The physical memory size of the server running the model

> **Q2.** Why does attention's computational cost grow with the square
> of sequence length?
> - A) It doesn't — the cost scales linearly
> - B) Attention computes a relevance score between every pair of tokens, so the number of pairwise comparisons grows quadratically ✅
> - C) Quadratic growth only applies to very short sequences
> - D) This is a software inefficiency unrelated to the architecture

> **Q3.** Given a context window with only 500 tokens of room left, and
> a `max_tokens` parameter set to 4000, how much output actually gets
> generated?
> - A) The full 4000 tokens requested, regardless of anything else
> - B) At most 500 tokens — whatever's actually left in the shared window ✅
> - C) The request fails immediately with no output
> - D) Exactly 4000 tokens, ignoring the context window entirely

> **Q4.** Why don't a token's Key and Value vectors need to be
> recomputed at every generation step?
> - A) They do need to be recomputed every time
> - B) A token's Key and Value depend only on that token's own representation, not on which generation step is happening, so they never change once computed ✅
> - C) Only the first token's Key and Value ever get computed
> - D) Key and Value vectors are recalculated randomly each step

> **Q5.** What benefit does KV cache provide across two separate
> requests, not just within one generation?
> - A) None — KV cache only applies within a single request
> - B) A shared prefix between a new request and a previous one can reuse that portion's cached computation entirely ✅
> - C) It automatically merges two separate requests into one
> - D) It only applies to requests from the same user account

> **Q6.** Why does changing a single token early in a prompt invalidate
> the cache for everything after it, even identical text further along?
> - A) It doesn't — only the changed token loses its cache
> - B) By later layers, a token's representation reflects the attention-mixed influence of every prior token, so a change early on cascades forward ✅
> - C) Caching only works for the very first token
> - D) This only happens if the change is at the very end

> **Q7.** Why is placing stable instructions first and variable content
> last a genuine cost lever, not just a style preference?
> - A) It isn't — prompt structure has no measurable effect on cost
> - B) Providers commonly offer discounted pricing on cache-hit tokens, and this ordering maximizes how much of a prompt can hit that cache ✅
> - C) Cost is determined entirely by output length
> - D) This only affects latency, never billing

> **Q8.** What is the lost-in-the-middle effect?
> - A) A technical limitation preventing long context windows from existing
> - B) A well-documented pattern where models recall and use information near the beginning or end of a long context more reliably than information in the middle ✅
> - C) A bug specific to one particular provider
> - D) The tendency to ignore the first half of any context entirely

> **Q9.** Is there one single, fully agreed-upon explanation for why the
> lost-in-the-middle effect occurs?
> - A) Yes, it's completely settled and understood
> - B) No — the pattern is well-documented, but the precise causal explanation remains a more open question ✅
> - C) It has never been studied
> - D) It only occurs in very small models

---

## Closing synthesis — structuring a real prompt

*(end of lesson, reflective rather than graded — applying all five
concepts to one realistic scenario)*

An agent needs to process a long internal policy document and answer
repeated employee questions about it, across many separate API calls.
Before checking the reasoning below, sketch how you'd structure this
prompt: what goes first, what goes last, and where the document's most
critical clauses should sit if you have any control over that.

*Reasoning to check your structure against:*
- **The policy document and system instructions are stable across every
  call; the employee's specific question is what varies** — [Concept 4's cache-hit logic](→ this lesson, why prompt structure affects cache hit rate and real cost concept) says the document and instructions belong *first*, the question *last*. Reversing this would mean every single call, even ones asking nearly identical questions, misses the cache almost entirely.
- **If the document has a few genuinely critical clauses** (say, a
  safety policy that must never be missed), [Concept 5's lost-in-the-middle effect](→ this lesson, uneven use of long contexts concept) is the reason to place them near the very start or end of the document itself, not buried in its middle section, if the document's own structure allows any flexibility at all.
- **Before setting a generous `max_tokens` for detailed answers**,
  [Concept 2](→ this lesson, max output length vs context window concept) is the reminder to actually check how much of the shared context window the document itself is already consuming — a long enough document could leave surprisingly little room for the answer, no matter how large `max_tokens` is set.
- **None of this changes the total computation happening within one
  generation** — [Concept 3's KV cache](→ this lesson, kv cache why it exists concept) is already working underneath all of it, regardless of how the prompt is structured; that's the layer of efficiency you get "for free," while the other four concepts are the layer you actually have to design for deliberately.

The pattern worth taking away: this lesson's five ideas aren't separate
trivia — they compose into one coherent set of decisions any real prompt
for a repeated, document-heavy use case actually has to make.
