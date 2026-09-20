# Module 1, Lesson 11 — Concept 2: The model landscape and selection

---

## Open-weight vs. closed models

**Open-weight** models have their trained parameters publicly
downloadable — you can self-host them, fine-tune them freely, and
inspect exactly what you're running. This buys real control and
privacy (your data never has to leave your own infrastructure), at the
cost of real operational burden: you're responsible for actually
running the infrastructure, scaling it, and making [quantization decisions like the ones from Concept 1](→ this lesson, quantization fp16 int8 int4 concept) yourself.

**Closed** (API-only) models are reached entirely through a provider's
API — no infrastructure to manage, typically far faster to get started
with, but less control (you can't inspect or directly modify the
model), and your data passes through the provider's own servers, a real
privacy consideration depending on what you're sending.

Neither is universally better — the right choice depends on how much
you actually value control and privacy against how much operational
burden you're willing to take on.

---

## Size tiers within one provider's lineup

Most providers offer several sizes of the same model family — smaller,
faster, cheaper versus larger, slower, more capable. The practical
selection principle: use the smallest, cheapest tier that reliably
handles a given task, reserving larger, more expensive tiers for
genuinely harder cases — [the same reasoning from Lesson 8's model-routing decision](→ this module, scaling laws and emergent behavior lesson, test time compute and reasoning models concept), just applied to model *size* rather than reasoning capability specifically.

---

## Reasoning vs. standard — a separate, orthogonal axis

[Reasoning models, from Lesson 8](→ this module, scaling laws and emergent behavior lesson, test time compute and reasoning models concept), are a genuinely separate selection axis from size tier — a task can be simple-but-needs-a-capable-model, or complex-but-fits-a-smaller-model's-abilities, or land anywhere else across these two independent dimensions. The cost/latency tradeoff for reasoning versus standard was covered in depth back in that lesson; this concept's job is just placing it correctly as one more axis in the overall landscape, not a replacement for size selection.

**Interactive: a model-selection framework.** A simple grid — task
complexity on one axis, privacy/control needs on the other — mapping
combinations onto a rough recommendation: small standard model, large
standard model, small reasoning model, self-hosted open-weight model,
and so on, letting a learner place their own real scenario somewhere on
the grid.

---

## Why total parameter count doesn't tell the whole story

Worth an explicit callback here: [MoE, from Lesson 3](→ this module, the attention and transformer architecture lesson, mixture of experts moe concept), means a model's *total* parameter count and its actual *per-token* cost can diverge significantly — a model marketed with an enormous total parameter count might route each individual token through only a small fraction of those parameters, making it genuinely cheaper and faster per-token than its headline parameter count alone would suggest. Comparing models purely by parameter count, without accounting for whether MoE routing is involved, can be genuinely misleading when actually choosing between options.

---

## Quiz cards

> **Q1.** What's the core tradeoff between open-weight and closed
> models?
> - A) Open-weight models are always cheaper in every respect
> - B) Open-weight models offer more control and privacy at the cost of real operational burden; closed models trade that control away for far less infrastructure responsibility ✅
> - C) Closed models can always be inspected and modified freely
> - D) There's no real difference between the two categories

> **Q2.** What's the practical principle for choosing between size tiers
> within a provider's model lineup?
> - A) Always use the largest, most capable model available, regardless of task
> - B) Use the smallest, cheapest tier that reliably handles the task, reserving larger tiers for genuinely harder cases ✅
> - C) Model size has no relationship to task difficulty at all
> - D) Always use the smallest model regardless of whether it can handle the task

> **Q3.** Why is reasoning-vs-standard considered a separate axis from
> size tier, rather than the same decision?
> - A) They're actually the same decision, just described differently
> - B) A task's complexity and its need for control/privacy/size are independent dimensions — a task can be simple but need a capable model, or complex but fit a smaller model's abilities ✅
> - C) Reasoning models are always the largest size tier available
> - D) Standard models can never be large or capable

> **Q4.** Why can comparing models purely by total parameter count be
> misleading?
> - A) Parameter count is always a perfectly reliable predictor of cost
> - B) A mixture-of-experts model can have a large total parameter count while routing each token through only a small fraction of those parameters, making its actual per-token cost much lower than the headline number suggests ✅
> - C) Parameter count is never actually reported by any provider
> - D) Only closed models report parameter counts

---

*(End of Concept 2. This lesson continues with Concept 3 — token-based
pricing, and every cost driver from this module, pulled together —
drafted separately.)*
