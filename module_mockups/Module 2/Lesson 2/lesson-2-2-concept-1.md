# Module 2, Lesson 2 — Concept 1: Specificity and clear instructions

> **Note:** this lesson has no live LLM available in the sandbox, and
> the exercise infrastructure for later lessons is still an open
> question — the prompt/output examples below are illustrative, marked
> clearly, not fetched from a real call.

---

## The pain: a vague instruction leaves too much to guess

```
Prompt: "Write something about our product."
```

There's nothing technically wrong with this prompt — it's grammatical,
it's on-topic — but it leaves nearly everything about the actual output
unspecified: what aspect of the product, what tone, what length, what
format, who the audience even is. Two equally "valid" completions of
this exact same prompt:

```
Illustrative output A:
"Introducing our newest innovation — built for people who refuse to
settle. Experience the difference today."

Illustrative output B:
"Our product is a cloud-based inventory management system supporting
real-time SKU tracking, automated reorder thresholds, and integration
with major ERP platforms via REST API."
```

Both are genuinely reasonable responses to "write something about our
product" — one reads like ad copy, the other like a technical spec —
and nothing in the original prompt actually rules either one out. This
is the real cost of vagueness: not that the model fails, but that it
has to *guess* at everything left unstated, and different guesses,
across different runs or different models, land in genuinely different
places.

---

## The fix: specify what, how, and the constraints

```
Prompt: "Write a 2-sentence product description for our inventory
management software, aimed at small business owners with no technical
background. Avoid jargon like 'API' or 'SKU' — describe what it does
in plain terms."
```

This specifies **what** (a product description, not marketing copy or a
spec), **how** (2 sentences, plain language), and a genuine
**constraint** (no jargon, a specific audience). Nothing here restricts
the model's actual writing ability — it still has real room to phrase
things well — but the *shape* of a correct response is now genuinely
narrow, rather than "grammatically valid text about the product" being
the entire bar.

---

## Why this matters more once you're building an agent

For a single one-off request, vagueness mostly costs you style or tone
you didn't want. Inside an agent's own instructions — [its system prompt, covered in the next lesson](→ this module, the system prompt as agent design lesson) — vagueness has sharper, structural consequences: an ambiguous instruction about *when* to call a tool can mean the model calls it at the wrong moment, or not at all; ambiguity about what counts as "done" can mean [the loop from Lesson 1](→ this module, agents workflows and the loop lesson, what an agent is structurally the perceive reason act observe cycle concept) never actually terminates, or stops too early. Specificity here isn't a stylistic nicety — it's the difference between an agent behaving reliably and one whose behavior is genuinely unpredictable from one run to the next.

---

## Quiz cards

> **Q1.** Why is `"Write something about our product"` considered a
> genuinely vague prompt, despite being grammatically correct?
> - A) It contains a grammatical error
> - B) It leaves what aspect, tone, length, format, and audience entirely unspecified, so many genuinely different completions are all equally "valid" responses to it ✅
> - C) It's too short to ever produce a useful response
> - D) The word "product" is inherently ambiguous in any context

> **Q2.** What did the specific version of the prompt actually add,
> compared to the vague one?
> - A) It removed the model's ability to phrase things well
> - B) It specified what to write, how to write it, and a real constraint — narrowing the shape of a correct response without restricting genuine writing quality ✅
> - C) It made the request shorter overall
> - D) It removed the need for the model to do any actual work

> **Q3.** Why does vagueness in an agent's own instructions carry sharper
> consequences than vagueness in a one-off content request?
> - A) It doesn't — the consequences are identical in both cases
> - B) Ambiguity about when to call a tool, or what counts as "done," can produce structural failures — wrong tool calls, premature stopping, or a loop that never terminates — not just stylistic ones ✅
> - C) Agents are immune to the effects of vague instructions
> - D) This only matters for agents with more than ten available tools

---

*(End of Concept 1. This lesson continues with Concept 2 — examples in
the prompt (few-shot) — drafted separately.)*
