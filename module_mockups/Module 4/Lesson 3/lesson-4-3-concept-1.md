# Module 4, Lesson 3 — Concept 1: What a prefix cache is worth to an agent

---

## The same work, done again on every turn

[Lesson 1](→ this module, context as a budget lesson, watching it grow across the loop concept) showed that an agent resends its whole history on every turn, so the total tokens processed grow much faster than the conversation. Most of that is repetition: turn eight's request is turn seven's request with a little added at the end.

[Module 1's KV cache lesson](→ Module 1, context windows and kv cache lesson, kv cache concept) explained what the model computes for every token it reads, and [its prompt-structure concept](→ Module 1, context windows and kv cache lesson, prompt structure and cache hits concept) showed that this work can be reused when a new request begins with exactly the same tokens as an earlier one. That's a **prefix cache**: the computed state for a shared beginning is kept, and only what comes after it has to be processed fresh.

An agent is close to the ideal case for it, because its loop only appends. As long as nothing earlier in the request changes, each turn's request starts with the entire previous request.

## It works the same everywhere

Prefix caching isn't one provider's feature. It follows directly from how transformers process a sequence, so it appears across the ecosystem in different forms:

- **Hosted model APIs** mostly offer it, each with its own terms. Some cache automatically, some need you to mark where the reusable part ends, and discounts, extra charges for writing to the cache, and how long an entry stays alive all differ between providers.
- **Local inference servers** do it too. Open-source servers such as vLLM can reuse the computed state for a shared prefix across requests. There's no bill, but the saving is just as real: less compute per request and a faster first token.

The design rule this lesson builds toward is the same whichever you use: **keep the beginning of every request identical, and add new material only at the end.** What changes between setups is only how much it's worth.

## Putting a number on it

To reason about the saving without tying it to one price list, express cost in a neutral unit: one input token processed at full price. A cached read costs some fraction of that, and writing new content into the cache may cost a little more than full price, or exactly full price, depending on the provider. For a local model you can read the same numbers as relative compute.

Under an append-only history, each turn reuses the whole previous request and adds only what's new:

```python
def estimate_cost(turn_inputs: list, read_multiplier: float, write_multiplier: float) -> dict:
    """
    Cost of a run, in units of 'one input token at full price', with and without a prefix cache.
    Assumes an append-only history: each turn's input starts with the whole previous turn's input.
    """
    without_cache = sum(turn_inputs)
    with_cache = 0.0
    previous = 0
    for tokens in turn_inputs:
        reused = previous                  # the unchanged prefix, read from the cache
        new = tokens - previous            # what this turn added, written to the cache
        with_cache += reused * read_multiplier + new * write_multiplier
        previous = tokens
    return {
        "without_cache": without_cache,
        "with_cache": round(with_cache),
        "saving": round(1 - with_cache / without_cache, 3) if without_cache else 0.0,
    }
```

Applied to Lesson 1's log-reading run, using one provider's published multipliers as the example, reads at a tenth of the full price and writes at a quarter more:

```python
# per-turn input sizes from Lesson 1's log-reading run
turn_inputs = [101, 1_828, 3_538, 5_247, 6_939, 8_631, 10_323]

# one provider's published multipliers, as an example: reads at 0.1x, writes at 1.25x
example = estimate_cost(turn_inputs, read_multiplier=0.1, write_multiplier=1.25)
print(f"without a cache: {example['without_cache']:,} token-units")
print(f"with a cache:    {example['with_cache']:,} token-units  ({example['saving']:.0%} less)")

# the same run twice as long: 14 turns, still adding about 1,700 tokens each
longer = [101 + 1_700 * turn for turn in range(14)]
for label, run in [("7 turns ", turn_inputs), ("14 turns", longer)]:
    r = estimate_cost(run, read_multiplier=0.1, write_multiplier=1.25)
    print(f"{label}: {r['without_cache']:>7,} without, {r['with_cache']:>6,} with  ({r['saving']:.0%} less)")
```
```
without a cache: 36,607 token-units
with a cache:    15,532 token-units  (58% less)
7 turns :  36,607 without, 15,532 with  (58% less)
14 turns: 156,114 without, 41,143 with  (74% less)
```
*(runs live, shows output — read-only demo snippet, not graded; the multipliers are one example, and other providers' differ)*

Two things to notice:

- **The saving grows with the length of the run.** Seven turns saved 58%; fourteen saved 74%. The longer the loop, the more of each request is repeated history, so the more a cache is worth. For agents, which run long, that's precisely where it matters most.
- **A single request can't benefit.** The first turn has nothing to reuse, and with a write surcharge it costs slightly *more*. Caching only pays off on repetition, which is why it suits agents so well and one-off calls so little.

This is a simplified model, and it says so. Real caches have minimum sizes below which nothing is cached, entries that expire if unused for a few minutes, and limits on how far back a match is searched. What it captures correctly is the structure of the saving, and the thing that destroys it: everything above assumed **nothing earlier in the request ever changes**. [The next concept](→ this lesson, what makes an agent cache friendly and what breaks it concept) is about what happens when something does.

---

## Quiz cards

> **Q1.** Why is an agent loop close to the ideal case for a prefix cache?
> - A) Agents use shorter prompts than chatbots
> - B) The loop only appends, so each turn's request begins with the entire previous request ✅
> - C) Agents never repeat content
> - D) Tool results are cached automatically by every provider
>
> *Explanation:* A prefix cache reuses an identical beginning. An append-only history gives it the longest possible identical beginning on every turn.

> **Q2.** Is prefix caching specific to one model provider?
> - A) Yes, it's a feature of one company's API
> - B) Yes, and it only works with paid APIs
> - C) No, but it only works with hosted APIs
> - D) No: it follows from how transformers process a sequence, so hosted APIs and local inference servers alike use it, with different terms ✅
>
> *Explanation:* The mechanism is the KV cache from Module 1. How it's priced, or whether it's billed at all, depends on where the model runs.

> **Q3.** In the cost model, what happens to the share saved as the run gets longer?
> - A) It shrinks
> - B) It stays the same
> - C) It grows, because more of each request is repeated history ✅
> - D) It drops to zero after ten turns
>
> *Explanation:* Seven turns saved 58% and fourteen saved 74%. Each extra turn adds a little new content on top of a growing reused prefix.

> **Q4.** Why can a single, one-off request cost slightly more with caching on?
> - A) There's nothing earlier to reuse, and some providers charge extra to write content into the cache ✅
> - B) Caching slows the model down
> - C) Cached requests use more tokens
> - D) It can't; caching always saves money
>
> *Explanation:* The saving comes from reuse. A request with no predecessor pays only the write, which is why caching suits repetitive agent loops.

> **Q5.** What assumption does the whole saving depend on?
> - A) That the model is hosted rather than local
> - B) That nothing earlier in the request changes between turns ✅
> - C) That tool results are short
> - D) That every turn adds the same number of tokens
>
> *Explanation:* A prefix cache only helps while the beginning stays identical. Change something early and everything after it has to be processed again.

---

## Applied sandbox exercise

*(graded — a provider-neutral cache cost model)*

**Task shown to learner:** Implement `estimate_cost(turn_inputs, read_multiplier, write_multiplier)`. `turn_inputs` lists each turn's total input tokens, in order. Costs are in units of one input token at full price. Assume an append-only history:

- On each turn, the tokens the previous turn already sent are **read** from the cache (cost × `read_multiplier`), and the tokens added since are **written** to it (cost × `write_multiplier`). The first turn has nothing to read.
- Return a dict with `without_cache` (the sum of all turn inputs), `with_cache` (rounded to a whole number) and `saving` (`1 - with_cache / without_cache`, rounded to three decimal places, or `0.0` for an empty run).

**Starter code:**
```python
def estimate_cost(turn_inputs: list, read_multiplier: float, write_multiplier: float) -> dict:
    # TODO: for each turn, read the previous total from cache and write what's new
    ...
```

**Hidden tests:**
```python
# 1. hand-checkable run: 100, then 300, then 600 tokens
r = estimate_cost([100, 300, 600], read_multiplier=0.1, write_multiplier=1.25)
# turn 1: write 100            -> 125
# turn 2: read 100, write 200  -> 10 + 250 = 260
# turn 3: read 300, write 300  -> 30 + 375 = 405
assert r["without_cache"] == 1_000
assert r["with_cache"] == 790
assert r["saving"] == 0.21

# 2. with no discount and no surcharge, caching changes nothing
r = estimate_cost([100, 300, 600], read_multiplier=1.0, write_multiplier=1.0)
assert r["with_cache"] == r["without_cache"] == 1_000 and r["saving"] == 0.0

# 3. a single request can't reuse anything: it only pays the write
r = estimate_cost([1_000], read_multiplier=0.1, write_multiplier=1.25)
assert r["with_cache"] == 1_250 and r["saving"] < 0

# 4. the longer the run, the larger the share saved
short = estimate_cost([1_000 * t for t in range(1, 6)], 0.1, 1.25)["saving"]
long = estimate_cost([1_000 * t for t in range(1, 21)], 0.1, 1.25)["saving"]
assert long > short > 0

# 5. an empty run costs nothing
assert estimate_cost([], 0.1, 1.25) == {"without_cache": 0, "with_cache": 0, "saving": 0.0}
```

**Hint (shown on request):** Keep a running `previous = 0`. For each turn, the reused part is `previous` and the new part is `tokens - previous`; add their costs, then set `previous = tokens`. Compute `saving` from the *unrounded* `with_cache`, and guard against dividing by zero for an empty list.

**Reference solution:**
```python
def estimate_cost(turn_inputs: list, read_multiplier: float, write_multiplier: float) -> dict:
    """
    Cost of a run, in units of 'one input token at full price', with and without a prefix cache.
    Assumes an append-only history: each turn's input starts with the whole previous turn's input.
    """
    without_cache = sum(turn_inputs)
    with_cache = 0.0
    previous = 0
    for tokens in turn_inputs:
        reused = previous                  # the unchanged prefix, read from the cache
        new = tokens - previous            # what this turn added, written to the cache
        with_cache += reused * read_multiplier + new * write_multiplier
        previous = tokens
    return {
        "without_cache": without_cache,
        "with_cache": round(with_cache),
        "saving": round(1 - with_cache / without_cache, 3) if without_cache else 0.0,
    }
```

**Explanation:** Test 1 is small enough to check by hand, and the comments in it walk through each turn. Test 2 is the sanity check: with no discount and no surcharge, caching changes nothing, so the model is consistent. Tests 3 and 4 capture the two facts this concept is about: a single request can't benefit, and the benefit grows with the length of the run. Because the multipliers are parameters, the same function works for any provider's price list, or as relative compute for a model you run yourself.

---

*(End of Concept 1. This lesson continues with Concept 2 — what makes an agent cache-friendly, and what breaks it.)*
