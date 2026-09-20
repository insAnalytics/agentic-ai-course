# Module 1, Lesson 11 — Concept 3: Token-based pricing, and every cost driver from this module, pulled together

> **What this concept actually teaches:** no new mechanism — every
> individual fact here has already been covered somewhere earlier in
> this module. This concept's job is assembling all of them into one
> coherent cost picture, since in practice they compound together, not
> one at a time.

---

## The basic pricing mechanics

LLM APIs typically charge per token, usually with **different rates for
input and output tokens** — output tokens are generally priced higher,
since generation is the actual compute-intensive part of the process,
[one full pass per token, as established back in Lesson 4](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept).

---

## Every cost driver from this module, combined into one calculation

```python
def estimate_request_cost(
    input_tokens: int,
    output_tokens: int,
    cached_tokens: int,
    input_price_per_1k: float,
    cached_input_price_per_1k: float,
    output_price_per_1k: float,
) -> float:
    fresh_input_tokens = input_tokens - cached_tokens
    fresh_input_cost = (fresh_input_tokens / 1000) * input_price_per_1k
    cached_cost = (cached_tokens / 1000) * cached_input_price_per_1k
    output_cost = (output_tokens / 1000) * output_price_per_1k
    return fresh_input_cost + cached_cost + output_cost

# a support bot: large, stable system prompt (mostly cached), short question
cost_standard = estimate_request_cost(
    input_tokens=2000, output_tokens=150, cached_tokens=1800,
    input_price_per_1k=0.003, cached_input_price_per_1k=0.0003, output_price_per_1k=0.015,
)

# the same request, but routed through a reasoning model
cost_reasoning = estimate_request_cost(
    input_tokens=2000, output_tokens=150 + 2000, cached_tokens=1800,
    input_price_per_1k=0.003, cached_input_price_per_1k=0.0003, output_price_per_1k=0.015,
)

print(f"standard: ${cost_standard:.4f}")
print(f"reasoning: ${cost_reasoning:.4f}")
```
```
standard: $0.0034
reasoning: $0.0334
```
*(illustrative pricing figures — real rates vary by provider and model)*

This one calculation already combines two threads from across this
module: [cache-friendly prompt structure from Lesson 6](→ this module, context windows and kv cache lesson, why prompt structure affects cache hit rate and real cost concept) — `1800` of the `2000` input tokens hit the cheaper cached rate, because the stable system prompt sits first — and [reasoning tokens from Lesson 8](→ this module, scaling laws and emergent behavior lesson, test time compute and reasoning models concept), roughly `10×`-ing the cost when the same request routes through a reasoning model.

Two more real drivers this exact same calculation would need to account
for in practice, both already covered earlier in this module: **[language](→ this module, the tokenization lesson, tokens in practice and why language matters for cost concept)** — the identical conversation conducted in a language poorly represented in the tokenizer's training data would inflate both `input_tokens` and `output_tokens` well beyond what the same meaning costs in English — and **[non-text inputs](→ this module, the tokenization lesson, non text inputs also become tokens concept; → this module, calling llm apis and processing responses lesson, sending non text inputs concept)** — an image attached to that support request adds real tokens to `input_tokens`, often several hundred, before a single word of the actual question is even considered.

---

## The habit worth building

None of these four factors — language, caching, reasoning, non-text
input — acts alone in a real system; a genuinely cost-aware agent
backend is affected by some combination of all four on nearly every
request. The actual skill this lesson has been building toward isn't
memorizing any one of these facts individually — each was already
taught where it belongs — but developing the habit of checking all four
together when actually estimating what a real workload will cost,
rather than reasoning about pricing as if only one factor were ever in
play at a time.

---

## Quiz cards

> **Q1.** Why are output tokens typically priced higher than input
> tokens?
> - A) Output tokens are simply arbitrary and unrelated to actual cost
> - B) Generation is the actual compute-intensive part of the process — each output token requires its own full pass through the model ✅
> - C) Input tokens are never actually charged at all
> - D) Pricing is unrelated to which kind of token is involved

> **Q2.** In the combined cost demo, what made most of the `2000` input
> tokens cost less than the full input rate?
> - A) A random discount applied for no particular reason
> - B) Most of them were cached, hitting cache-friendly pricing because the stable system prompt sat first in the request, exactly as covered in Lesson 6 ✅
> - C) Input tokens are always free regardless of caching
> - D) The reasoning model automatically discounts all input tokens

> **Q3.** Beyond caching and reasoning, what two other cost drivers does
> this concept explicitly pull in from earlier in the module?
> - A) Quantization and open-weight vs. closed model choice
> - B) Language-dependent token counts, and tokens consumed by non-text inputs like images ✅
> - C) Model size tier and MoE routing
> - D) Stop sequences and temperature

> **Q4.** What's the actual point of this concept, given that none of
> its individual facts are new?
> - A) To introduce four entirely new pricing mechanisms
> - B) To build the habit of considering multiple cost drivers together, since they compound on real requests rather than acting one at a time ✅
> - C) To replace everything taught earlier in the module with a simpler rule
> - D) To argue that cost doesn't actually matter in practice

---

*(End of Concept 3. This lesson continues with Concept 4 — provider-side
rate limits — drafted separately.)*
