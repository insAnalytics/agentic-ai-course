# Module 1, Lesson 8 — Concept 4: Test-time compute and reasoning models

---

## A different axis of scaling: at inference time, not training time

Every concept in this lesson so far has been about **training-time**
scaling — a bigger model, more data, more compute, all spent before the
model is ever actually used. **Test-time compute** is a genuinely
different axis: improving performance not by training a bigger model at
all, but by letting a model spend *more compute at the moment of
actually answering a specific question* — generating more tokens of
reasoning before producing its final answer.

---

## Where this behavior actually comes from

This is the direct practical consequence of [RL for reasoning, from Lesson 7](→ this module, the training pipeline lesson, rl for reasoning the newest training stage concept) — the training stage that specifically rewards generating extended intermediate reasoning leading to correct final answers. A reasoning model, faced with a genuinely difficult problem, will generate substantially more reasoning tokens before answering — and [every one of those tokens is a real, full generation step](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept), the same cost as any other token.

---

## The real cost, made concrete

```python
def estimate_cost(num_tokens: int, cost_per_1k_tokens: float) -> float:
    return (num_tokens / 1000) * cost_per_1k_tokens

standard_response_tokens = 150            # a direct answer, no extended reasoning
reasoning_response_tokens = 150 + 2000    # the same final answer, plus ~2000 reasoning tokens

cost_per_1k = 0.015   # illustrative price per 1,000 tokens

print(f"standard: ${estimate_cost(standard_response_tokens, cost_per_1k):.4f}")
print(f"reasoning: ${estimate_cost(reasoning_response_tokens, cost_per_1k):.4f}")
```
```
standard: $0.0023
reasoning: $0.0323
```
*(illustrative figures — real pricing and reasoning-token counts vary
by model and provider)*

The same final answer, roughly **14× more expensive**, purely because of
the added reasoning tokens — and those tokens are typically billed the
same as any other output token, [exactly as covered forward in this module's cost lesson](→ this module, quantization cost and operational concerns lesson). This is real, measurable cost, not a hypothetical concern.

---

## The practical tradeoffs, as a real design decision

- **Slower** — more tokens generated means more generation time, [directly following from Lesson 4's per-token cost](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept).
- **Costs more** — thinking tokens are billed, [as shown above](→ this lesson, test time compute and reasoning models concept).
- **Helps most on genuinely multi-step problems** — math, code, planning
  tasks where working through intermediate steps actually improves the
  correctness of the final answer.
- **Often unnecessary for simple tasks** — a straightforward factual
  lookup or a basic format transformation rarely benefits meaningfully
  from extra reasoning tokens; the added cost and latency there is often
  simply wasted.

This is a genuine, practical design decision when building an agent, not
an academic curiosity: routing every request through a reasoning model
regardless of difficulty spends real money and time for often negligible
benefit, while routing genuinely hard, multi-step tasks through a
standard model can mean settling for a worse answer than a bit more
compute would have bought. Matching the tool to the task's actual
difficulty is the real skill this concept is building toward.

---

## Quiz cards

> **Q1.** What does "test-time compute" refer to, as distinct from the
> training-time scaling covered earlier in this lesson?
> - A) The total compute spent training a model before it's ever used
> - B) Additional compute spent at the moment of actually answering a specific question — generating more reasoning tokens before a final answer ✅
> - C) The compute required to fine-tune a model
> - D) The compute needed to evaluate a model's benchmark scores

> **Q2.** Where does a reasoning model's tendency to generate extended
> reasoning before answering actually come from?
> - A) It's an unexplained, accidental emergent property
> - B) RL for reasoning — a specific training stage that rewards generating extended reasoning leading to correct final answers ✅
> - C) It comes entirely from pretraining alone
> - D) It's a property of the tokenizer, not the training process

> **Q3.** In the cost demo, why does the reasoning response cost roughly
> 14× more than the standard response, despite reaching the same final
> answer?
> - A) Reasoning models charge a higher price per token for identical content
> - B) The reasoning response includes roughly 2,000 additional reasoning tokens, each billed the same as any other output token ✅
> - C) The demo contains an error — both should cost exactly the same
> - D) Standard responses are always free, only reasoning responses cost money

> **Q4.** Why might routing every single request through a reasoning
> model, regardless of task difficulty, be a poor design choice?
> - A) Reasoning models are strictly worse at every task
> - B) Simple tasks rarely benefit meaningfully from extra reasoning tokens, so the added cost and latency in those cases is often wasted ✅
> - C) Reasoning models cannot handle simple tasks at all
> - D) This is actually always the best choice, regardless of task

---

*(End of Concept 4 — final concept section of Lesson 8. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
