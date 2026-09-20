# Quantization, Cost, and Operational Concerns

> **You'll be able to**
> - Explain what quantization actually does to a model's parameters, the
>   real tradeoff it involves, and who it actually matters to
> - Navigate the model landscape — open-weight vs. closed, size tiers,
>   reasoning vs. standard — and avoid being misled by parameter count
>   alone, given MoE
> - Combine every cost driver from this module — language, caching,
>   reasoning, non-text input — into one coherent estimate, rather than
>   reasoning about pricing one factor at a time
> - Explain provider-side rate limits, distinguish them from Module 0's
>   own API rate limiting, and implement exponential backoff correctly

**Why it matters**
This lesson is where the module's technical depth turns into
operational judgment — the difference between understanding how a
model works and actually being able to run something real against one,
reliably and without surprise costs. Every decision here (which model
tier, whether to self-host, how to handle a rate limit) is a decision
you'll actually make building anything with an LLM, and this lesson is
what makes those decisions reasoned rather than guessed.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** What does quantization actually do to a model's parameters?
> - A) It adds new parameters to improve capabilities
> - B) It reduces the numerical precision used to store each weight — fewer bits, fewer possible distinct values ✅
> - C) It removes parameters entirely
> - D) It retrains the model on new data

> **Q2.** Who actually makes quantization decisions in practice?
> - A) Every API user configures this directly
> - B) Whoever is running/self-hosting a model; an API user calling a provider's endpoint never sees or chooses it directly ✅
> - C) The tokenizer decides automatically
> - D) Only reasoning models support quantization

> **Q3.** What's the core tradeoff between open-weight and closed
> models?
> - A) Open-weight models are always cheaper in every respect
> - B) Open-weight models offer more control and privacy at the cost of real operational burden; closed models trade that away for far less infrastructure responsibility ✅
> - C) Closed models can always be freely inspected and modified
> - D) There's no real difference between the two

> **Q4.** Why can comparing models purely by total parameter count be
> misleading?
> - A) Parameter count is always a perfectly reliable predictor of cost
> - B) A mixture-of-experts model can have a large total parameter count while routing each token through only a small fraction of it, making actual per-token cost much lower than the headline number suggests ✅
> - C) Parameter count is never actually reported
> - D) Only closed models report parameter counts

> **Q5.** Why are output tokens typically priced higher than input
> tokens?
> - A) Output tokens are arbitrary and unrelated to actual cost
> - B) Generation is the actual compute-intensive part — each output token requires its own full pass through the model ✅
> - C) Input tokens are never charged at all
> - D) Pricing is unrelated to token type

> **Q6.** What's the actual point of pulling language, caching,
> reasoning, and non-text input together in one cost concept, given none
> of those facts are new?
> - A) To introduce four entirely new pricing mechanisms
> - B) To build the habit of considering multiple cost drivers together, since they compound on real requests rather than acting one at a time ✅
> - C) To replace everything taught earlier with a simpler rule
> - D) To argue cost doesn't actually matter

> **Q7.** How does provider-side rate limiting differ from Module 0's
> FastAPI rate limiting?
> - A) They're the exact same concept
> - B) Module 0's version protects your own API from client misuse; this is the reverse — the provider limiting how often you can call theirs ✅
> - C) Provider-side limiting only applies to free-tier accounts
> - D) There's no real implementation difference

> **Q8.** Why is exponential backoff preferred over immediate retries
> after a `429`?
> - A) Immediate retries always succeed
> - B) Immediate retries would likely hit the same limit again right away; a growing wait time gives shared capacity genuine room to recover ✅
> - C) Exponential backoff is legally required
> - D) There's no real difference between the two approaches

---

## Closing synthesis — one operational decision, every piece

*(end of lesson, reflective rather than graded — a full deployment
decision pulling together quantization, model selection, and rate-limit
handling)*

You're deploying an agent backend under real cost and reliability
constraints: moderate request volume, mixed task difficulty (mostly
simple lookups, occasional genuinely complex planning), and a strict
monthly budget. Before checking below, reason through: self-host or use
an API? If self-hosting, what quantization level? What model
size/reasoning tier for the two different task types? How do you handle
being rate-limited in production?

*Reasoning to check against:* given a strict budget and *moderate*
volume (not massive scale), an **API** is likely the more practical
starting choice — [self-hosting's real ops burden](→ this lesson, the model landscape and selection concept) isn't obviously worth taking on yet, though it stays a real option if volume grows enough to justify it. For the mixed task difficulty, [Concept 2's size-tier and reasoning-axis principles](→ this lesson, the model landscape and selection concept) both apply independently: route simple lookups to a small, standard model; route genuinely complex planning to a larger and/or reasoning-capable model — never the reverse, and never one tier for everything regardless of task. If self-hosting *were* chosen instead, [Concept 1's quantization tradeoff](→ this lesson, quantization fp16 int8 int4 concept) becomes directly relevant: INT8 as a reasonable default balancing cost and quality, reserving INT4 only if the budget genuinely demands it and some quality loss is acceptable. And regardless of which model or provider is chosen, [Concept 4's exponential backoff](→ this lesson, provider side rate limits concept) is a necessary piece of any production system calling an external API — not optional infrastructure, since a `429` under real load is a *when*, not an *if*.

This is the actual shape of the judgment this entire module has been
building toward: not memorized facts, but a coherent set of reasoned
tradeoffs, ready to apply the moment a real system actually needs
building.
