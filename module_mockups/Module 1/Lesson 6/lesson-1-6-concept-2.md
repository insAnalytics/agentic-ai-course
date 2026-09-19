# Module 1, Lesson 6 — Concept 2: Max output length vs. context window

---

## A common, reasonable-sounding assumption that's wrong

It's easy to assume a model's context window and its maximum output
length are two separate budgets — as if a "128k context window" model
gives you 128k tokens for input, *plus* some additional allowance for
whatever it generates back. That's not how it works. [The context window from the previous concept](→ this lesson, what a context window actually is and what happens past it concept) is a single, shared total — input tokens and output tokens draw from the exact same pool, not two independent ones.

---

## What this means concretely

If a model has a 128,000-token context window, and your prompt plus
conversation history already uses 127,500 tokens, there are only 500
tokens of room left — for the *entire* response, no matter how long the
model would otherwise have generated. A `max_tokens`-style parameter,
which most APIs let you set, only specifies a *ceiling* on the output —
it never grants extra room beyond whatever's actually left in the
shared window:

```python
def actual_available_output(context_window: int, input_tokens: int, requested_max_output: int) -> int:
    remaining_budget = context_window - input_tokens
    return min(remaining_budget, requested_max_output)

print(actual_available_output(context_window=128_000, input_tokens=127_500, requested_max_output=4000))
print(actual_available_output(context_window=128_000, input_tokens=50_000, requested_max_output=4000))
```
```
500
4000
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same requested `max_tokens` value, `4000`, in both calls — but the
actual available output is whichever is *smaller*: the requested ceiling,
or whatever's genuinely left in the shared context window. With only
500 tokens of room remaining, requesting 4000 doesn't help at all; the
response still gets cut off at 500, regardless of what was asked for.

---

## Why this matters practically

This is the direct, practical reason a long conversation history or a
large document included in a prompt can silently squeeze out the room
available for the actual response — not because of some separate output
limit being hit, but because input and output were always drawing from
the same total budget the entire time. Managing a long-running
conversation or a document-heavy prompt means actively tracking how much
of that shared budget is already spent, not just assuming the "max
output" setting is a guarantee of how much room remains.

---

## Quiz cards

> **Q1.** Do input tokens and output tokens draw from separate budgets,
> or the same one?
> - A) Separate budgets — input and output each get their own full allowance
> - B) The same shared budget — the context window is a single total covering both input and output together ✅
> - C) Only output tokens count against any limit at all
> - D) Only input tokens count against any limit at all

> **Q2.** Given a 128,000-token context window with 127,500 tokens
> already used by the input, and a `max_tokens` parameter set to 4000,
> how much output actually gets generated?
> - A) The full 4000 tokens requested, regardless of anything else
> - B) At most 500 tokens — whatever's actually left in the shared window, since that's smaller than the requested ceiling ✅
> - C) The request fails immediately with no output at all
> - D) Exactly 128,000 tokens, ignoring the input entirely

> **Q3.** What does a `max_tokens`-style parameter actually specify?
> - A) A guaranteed additional allowance beyond the context window
> - B) A ceiling on the output — capped by whichever is smaller, the requested value or whatever room genuinely remains in the shared window ✅
> - C) The total context window size for the entire request
> - D) The number of tokens the input is allowed to use

---

*(End of Concept 2. This lesson continues with Concept 3 — KV cache,
why it exists — drafted separately.)*
