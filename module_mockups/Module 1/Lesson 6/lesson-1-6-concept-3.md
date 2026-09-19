# Module 1, Lesson 6 — Concept 3: KV cache — why it exists

---

## The redundancy hiding inside the autoregressive loop

[Lesson 4 established that generating each new token requires a full pass through the model, over the entire sequence so far](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept). Taken completely literally, that sounds wasteful: generating token 101 would mean recomputing attention over all 100 prior tokens *plus* the new one, entirely from scratch — even though most of that work didn't actually need to change between one step and the next.

---

## What actually doesn't need to be recomputed

[Attention, from Lesson 3](→ this module, the attention and transformer architecture lesson, the attention mechanism concept), computes a Key and a Value for every token — and a given token's Key and Value only depend on that token's *own* representation, never on which generation step you happen to be at. Token 47's Key doesn't change just because you're now generating token 101 instead of token 48. That means Key and Value only ever need to be computed **once** per token, then reused for every subsequent step — this reuse is exactly what a **KV cache** (Key-Value cache) is: stored Key/Value vectors from every prior token, kept around so they never need recomputing, with only the *newest* token's Query (and its own Key/Value, added to the cache) actually requiring fresh computation at each step.

```python
def compute_keys_with_cache(sequence: list, cache: dict) -> dict:
    for token in sequence:
        if token not in cache:
            cache[token] = f"key_for_{token}"   # only ever computed once, per token
    return cache

sequence_so_far = ["The", "cat", "sat"]
cache = {}

for new_token in ["on", "the", "mat"]:
    sequence_so_far.append(new_token)
    cache = compute_keys_with_cache(sequence_so_far, cache)
    print(f"cache size: {len(cache)}, just added: {new_token}")
```
```
cache size: 4, just added: on
cache size: 5, just added: the
cache size: 6, just added: mat
```
*(runs live, shows output — read-only demo snippet, not graded)*

`if token not in cache` — [the exact same lookup pattern as `.get()` from Module 0](→ Module 0, the data structures lesson, dicts concept, the get method explanation) — is what makes this work: each step only ever computes the one genuinely new entry, since everything else is already sitting in `cache` from a previous step. This is a simplified stand-in for the real mechanism, but the shape is identical: the cache grows by exactly one entry per generated token, never recomputing what's already there.

**Interactive: a KV cache diagram.** A visualization of the generation
loop across several steps, showing which tokens' Key/Value computations
are freshly done (highlighted) versus pulled directly from cache
(dimmed, marked "reused") at each step — making visible just how little
*new* computation actually happens per token, once the cache is warm.

---

## Quiz cards

> **Q1.** Why don't a token's Key and Value vectors need to be
> recomputed at every generation step?
> - A) They do need to be recomputed every time — there's no way around it
> - B) A token's Key and Value depend only on that token's own representation, not on which generation step is currently happening, so they never change once computed ✅
> - C) Only the very first token's Key and Value ever get computed at all
> - D) Key and Value vectors are recalculated randomly each step

> **Q2.** What does a KV cache actually store?
> - A) The final generated text of previous responses
> - B) The already-computed Key and Value vectors for every prior token, so they can be reused instead of recomputed ✅
> - C) A list of every possible next token, precomputed in advance
> - D) The user's entire conversation history as raw text

> **Q3.** At each new generation step, what actually needs to be
> computed fresh, given a KV cache already holding every prior token's
> Key and Value?
> - A) Every token's Key and Value, all over again
> - B) Only the newest token's Query (and its own Key/Value, which then gets added to the cache) ✅
> - C) Nothing at all — the entire step is skipped
> - D) Only the very last layer of the model needs to run

> **Q4.** In the live demo, why does the cache grow by exactly one entry
> per loop iteration, rather than being rebuilt from scratch each time?
> - A) It's actually rebuilt from scratch every iteration — the demo just doesn't show it
> - B) `if token not in cache` skips recomputing anything already stored, so only the genuinely new token from that iteration gets added ✅
> - C) The cache has a fixed maximum size of one entry
> - D) Older entries get automatically deleted after each iteration

---

*(End of Concept 3. This lesson continues with Concept 4 — why prompt
structure affects cache-hit rate and real cost — drafted separately.)*
