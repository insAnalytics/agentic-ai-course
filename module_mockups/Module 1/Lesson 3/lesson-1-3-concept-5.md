# Module 1, Lesson 3 — Concept 5: Mixture-of-experts (MoE)

---

## Every token, the same parameters — until it isn't

[A standard transformer block's feedforward layer, from the previous concept](→ this lesson, stacking layers into a real transformer concept), uses the exact same parameters for every token that passes through it. **Mixture-of-experts (MoE)** changes this: instead of one feedforward network per layer, there are several smaller "expert" networks, and a small learned **router** that decides, per token, which subset of experts actually gets used — commonly just 2 out of 8, or a similarly small fraction, not all of them.

```python
experts = ["expert_1", "expert_2", "expert_3", "expert_4"]
router_scores = {"expert_1": 0.1, "expert_2": 0.7, "expert_3": 0.5, "expert_4": 0.2}

def top_k_experts(scores: dict, k: int) -> list:
    return sorted(scores, key=scores.get, reverse=True)[:k]

print(top_k_experts(router_scores, k=2))
```
```
['expert_2', 'expert_3']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`sorted(..., key=scores.get, reverse=True)` picks out whichever experts
the router scored highest for this specific token — only `expert_2` and
`expert_3` actually process it; `expert_1` and `expert_4`'s parameters
sit entirely unused for this particular token, even though they're
still part of the model.

---

## Why this makes "how big is the model" the wrong question alone

The practical consequence: a model's **total** parameter count — summed
across every expert, whether or not any given token actually uses it —
can be far larger than the number of parameters actually doing work to
produce any single token's output. Two models with wildly different
total parameter counts can end up costing roughly the same to run
per-token, if the larger one routes each token through only a small
slice of its total experts. This decouples "how large is this model" from "how expensive is it to actually run," which used to be nearly the same question for a standard, non-MoE transformer — worth
carrying forward explicitly [toward this module's cost discussion](→ this module, quantization cost and operational concerns concept), where it becomes directly relevant to understanding what you're actually paying for.

---

## Quiz cards

> **Q1.** What does a mixture-of-experts model's router actually decide?
> - A) Which token comes next in the output
> - B) Which subset of the model's expert networks actually processes a given token — commonly a small fraction of the total, not all of them ✅
> - C) How many layers the model should have
> - D) The router only operates once, for the entire input, not per token

> **Q2.** In an MoE model, do every token's computations use the exact
> same set of parameters?
> - A) Yes, exactly like a standard transformer layer
> - B) No — different tokens can be routed to different subsets of experts, meaning different tokens use different parameters ✅
> - C) Only the first token in a sequence uses any experts at all
> - D) MoE models don't actually have separate experts

> **Q3.** Why can two models with very different total parameter counts
> end up costing roughly the same to run per token?
> - A) Parameter count never actually affects computational cost
> - B) If the larger model routes each token through only a small slice of its total experts, its actual per-token computation can be similar to a much smaller model's, despite having more total parameters ✅
> - C) This is impossible — total parameter count always determines cost directly
> - D) Only non-MoE models have this property

---

*(End of Concept 5 — final concept section of Lesson 3. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
