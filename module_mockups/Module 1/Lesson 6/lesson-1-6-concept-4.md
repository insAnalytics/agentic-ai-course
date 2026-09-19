# Module 1, Lesson 6 — Concept 4: Why prompt structure affects cache-hit rate, and real cost

---

## The cache benefit extends across separate requests, not just within one

[KV cache, from the previous concept](→ this lesson, kv cache why it exists concept), avoided recomputing prior tokens *within* one generation. There's a second, closely related benefit worth naming directly: if a brand-new request's prompt starts with the *exact same sequence of tokens* as a previous request, a provider can reuse that shared portion's cached computation entirely — even though it's technically a separate request. Only the part where the two prompts actually diverge needs fresh computation.

---

## Why the shared portion has to match exactly, from the very start

This benefit depends on the shared prefix matching token-for-token,
from position one — not just having overlapping words somewhere. The
underlying reason: by later transformer layers, a token's representation
already reflects the attention-mixed influence of every token before
it — so changing or inserting even a single token anywhere invalidates
the cache for *everything from that position onward*, regardless of
whether the tokens further along would otherwise have been identical.

```python
def shared_prefix_length(sequence_a: list, sequence_b: list) -> int:
    count = 0
    shorter_length = min(len(sequence_a), len(sequence_b))
    for i in range(shorter_length):
        if sequence_a[i] != sequence_b[i]:
            break
        count += 1
    return count

# stable instructions first, variable question last
stable_first = ["You", "are", "a", "helpful", "assistant", ".", "Question", ":", "What", "is", "2+2", "?"]
stable_first_v2 = ["You", "are", "a", "helpful", "assistant", ".", "Question", ":", "What", "is", "the", "capital", "?"]

# the exact same content, reordered: variable question first, stable instructions last
variable_first = ["What", "is", "2+2", "?", "You", "are", "a", "helpful", "assistant", "."]
variable_first_v2 = ["What", "is", "the", "capital", "?", "You", "are", "a", "helpful", "assistant", "."]

print(shared_prefix_length(stable_first, stable_first_v2))
print(shared_prefix_length(variable_first, variable_first_v2))
```
```
9
2
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same two questions, same stable instructions, just reordered — with
stable content first, `9` tokens are shared and cacheable across both
calls; with variable content first, only `2` tokens are shared, even
though the identical stable instructions still appear later in *both*
sequences. Once a change happens early in the sequence, everything after
it — even genuinely identical text — can no longer be part of a cached,
reusable prefix.

---

## Why this is a real cost and latency lever, not just a style choice

This is precisely the mechanical reason a system prompt or fixed
instructions belong at the *start* of a prompt, with the actual varying
content (a specific user question, changing details) at the *end* —
[reversing this order was Concept 3's cost demonstrated concretely](→ this lesson, kv cache why it exists concept) turned into a wasted opportunity. Providers commonly offer meaningfully discounted pricing on cache-hit tokens compared to freshly-computed ones, and reduced latency alongside it — so prompt structure isn't a cosmetic preference, it's a genuine, measurable lever on both real cost and real response speed, directly falling out of exactly how KV cache actually works.

---

## Quiz cards

> **Q1.** What benefit does KV cache provide across two separate
> requests, not just within one generation?
> - A) None — KV cache only ever applies within a single request
> - B) If a new request's prompt shares an identical prefix with a previous request, that shared portion's cached computation can be reused entirely ✅
> - C) It automatically merges two separate requests into one
> - D) It only applies to requests made by the exact same user account

> **Q2.** Why does changing a single token early in a prompt invalidate
> the cache for everything after it, even identical text further along?
> - A) It doesn't — only the changed token itself loses its cache
> - B) By later layers, a token's representation already reflects the attention-mixed influence of every prior token, so a change early on cascades forward through everything computed after it ✅
> - C) Caching only works for the very first token in any prompt
> - D) This only happens if the change is at the very end of the prompt

> **Q3.** In the demo, why does putting stable instructions first
> produce a much longer shared prefix than putting the variable question
> first, even though both versions contain identical content?
> - A) It's coincidental and specific to this exact example only
> - B) The shared prefix can only extend up to the first point of divergence — placing stable content first means that divergence happens much later, keeping far more tokens cacheable ✅
> - C) Word order has no actual effect on which tokens are cacheable
> - D) Only the very last token in a sequence is ever checked for caching

> **Q4.** Why is prompt structure (stable content first, variable content
> last) a genuine cost lever, not just a stylistic preference?
> - A) It isn't — prompt structure has no measurable effect on cost
> - B) Providers commonly offer discounted pricing on cache-hit tokens, and better structuring directly increases how much of a prompt can actually hit that cache ✅
> - C) Cost is determined entirely by output length, regardless of prompt structure
> - D) This only affects latency, never actual billing

---

*(End of Concept 4. This lesson continues with Concept 5 — uneven use
of long contexts — drafted separately.)*
