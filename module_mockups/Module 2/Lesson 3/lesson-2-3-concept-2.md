# Module 2, Lesson 3 — Concept 2: Role, persona, and behavioral constraints

> **What this concept actually teaches:** no new prompting mechanism —
> a system prompt is just a prompt, so [every technique from Lesson 2](→ this module, prompting fundamentals lesson) already applies to it directly. This concept is about applying that existing technique to this specific, high-stakes use case.

---

## The pain: a role-less system prompt

```
System prompt: "You are a helpful assistant."
```

This is [exactly the kind of vagueness Lesson 2 opened with](→ this module, prompting fundamentals lesson, specificity and clear instructions concept), now sitting in the one place it matters most — the instructions that apply across an agent's *entire* interaction, not just one response. With no defined scope, no constraints, and no guidance on what to do when information isn't actually known, the agent has no particular reason to stay on-topic, or to avoid [producing a fluent, confident-sounding answer it doesn't actually have grounding for](→ Module 1, how llms generate text lesson, hallucination as a direct consequence concept) — hallucination isn't a special malfunction here; it's the default behavior of a system with no instruction telling it otherwise.

---

## Role, and explicit behavioral constraints

```
System prompt: "You are a customer support agent for Riverside Books,
a small independent bookstore. Always mention the specific price when
discussing a book. Never claim a book is in stock unless you've
actually checked using the check_inventory tool. If you don't know
something, say so clearly rather than guessing."
```

- **Role** — `"a customer support agent for Riverside Books"` frames who
  the agent is acting as, narrowing tone and scope directly, [the same kind of specificity from Lesson 2](→ this module, prompting fundamentals lesson, specificity and clear instructions concept), just establishing a persona rather than a one-off task shape.
- **Constraints** — explicit always/never instructions: always cite the
  price, never claim stock without actually checking. These are the
  real, concrete guardrails against the exact failure mode named above
  — a model with no instruction against guessing has no particular
  reason not to; one explicitly told to defer to a real check, and to
  admit uncertainty plainly, has a genuine behavioral target to aim for
  instead.

---

## Quiz cards

> **Q1.** Why does a vague, role-less system prompt increase the risk of
> ungrounded, confidently-stated claims?
> - A) Vague system prompts always cause the model to refuse to answer
> - B) With no instruction constraining it, the model has no particular reason not to produce a fluent, plausible-sounding answer it doesn't actually have grounding for — the default behavior of an unconstrained system ✅
> - C) This risk is entirely unrelated to how the system prompt is written
> - D) Vague system prompts only affect response length, never accuracy

> **Q2.** What does defining a role in a system prompt actually do,
> mechanically?
> - A) It's purely decorative and has no real effect on behavior
> - B) It's a form of specificity, narrowing tone and scope directly, the same underlying technique from Lesson 2 applied to a persistent persona instead of a one-off task ✅
> - C) It requires a completely different mechanism than anything covered in Lesson 2
> - D) It only affects the model's vocabulary, never its actual behavior

> **Q3.** Why is `"Never claim a book is in stock unless you've actually
> checked using the check_inventory tool"` a genuinely useful
> constraint to include?
> - A) It has no real effect on the model's behavior
> - B) It gives the model an explicit behavioral target — defer to a real check rather than guess — directly countering the default risk of a confidently-stated but ungrounded claim ✅
> - C) This constraint is redundant with what the model already does by default
> - D) Tools automatically prevent any claim not based on their results, regardless of the system prompt

---

*(End of Concept 2. This lesson continues with Concept 3 — tool
guidance, strategic not mechanical — drafted separately.)*
