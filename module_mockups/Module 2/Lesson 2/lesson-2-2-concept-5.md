# Module 2, Lesson 2 — Concept 5: Iterating systematically rather than by vibes

> **What this concept actually teaches:** no new prompting technique —
> everything below reuses Concepts 1–4 as-is. What's new is a
> *discipline* for actually improving a prompt during development: check
> a small set of representative cases together, not one. This is also
> deliberately *not* formal evaluation — scoring metrics, benchmarking,
> and statistical rigor belong to the later Evaluation & Observability
> module; this concept stays at the level of a practical development
> habit.

---

## The pain: judging a change from a single example

A common, unsystematic pattern: tweak a prompt's wording, run it once,
look at the one resulting output, and decide by gut feeling whether the
change "helped." This is a genuinely weak signal — a model's output can
vary somewhat from run to run even for the same prompt, so one example
looking better or worse after a change might just be noise, not a real
improvement or regression at all.

---

## The fix: a small set of representative cases, checked together

```
Test set for the "Name (Role)" extraction prompt from Concept 2:

1. "Dr. Sarah Chen, who leads the research division, announced..."
   (a clear, simple case)
2. "The keynote was delivered by Marcus Webb, Senior Vice President of
   Global Operations and Strategic Partnerships."
   (a longer, more complex title)
3. "Elena Ruiz spoke about the upcoming product launch."
   (no role explicitly stated at all)

Illustrative results, Prompt Version A:
1. "Sarah Chen (Research Division Lead)" — correct
2. "Marcus Webb (Senior Vice President of Global Operations and
   Strategic Partnerships)" — correct, but awkwardly long
3. "Elena Ruiz (Unknown)" — arguably reasonable, but never specified
   how to handle a missing role
```

Checking *only* case 1 would have suggested Prompt A works well — it's
the easy case, and it succeeds cleanly. Checking all three together
reveals real, specific gaps: no instruction for handling a long title
gracefully, and no defined behavior for a missing role at all. This is
exactly the value of a representative set: it surfaces problems a
single lucky (or unlucky) example would never reveal either way.

---

## What makes a set actually representative

The same principle from [Concept 2's discussion of representative few-shot examples](→ this lesson, examples in the prompt few shot concept) applies here directly: a good test set covers the genuine range of real input variation — different lengths, real edge cases, different phrasings — not several near-identical easy cases that would only ever produce a false sense of confidence. Iterating against three cases that are all essentially the same case restated doesn't actually tell you much more than iterating against one.

---

## Quiz cards

> **Q1.** Why is judging a prompt change from a single example output a
> genuinely weak signal?
> - A) A single example is always sufficient — this concern doesn't actually apply
> - B) A model's output can vary somewhat from run to run for the same prompt, so one example looking better or worse might just be noise, not a real change ✅
> - C) Single examples are always misleading, in every case, with no exceptions
> - D) This is only a concern for very long prompts

> **Q2.** What did checking all three test cases together reveal, that
> checking only the first case wouldn't have?
> - A) Nothing — all three cases produced identical results
> - B) Real, specific gaps — no instruction for a long title, and no defined behavior for a missing role — that the easy first case alone never surfaced ✅
> - C) That the prompt should be discarded entirely and rewritten from scratch
> - D) That few-shot examples don't actually help with this task

> **Q3.** Why does this concept explicitly distinguish itself from
> formal evaluation methodology?
> - A) Formal evaluation and this practice are exactly the same thing
> - B) This concept stays at the level of a practical development habit — checking a few representative cases together — while scoring metrics and statistical rigor belong to a later, dedicated module ✅
> - C) Formal evaluation is never actually necessary for prompt development
> - D) This concept teaches complete benchmarking methodology directly

> **Q4.** Why would a test set of three near-identical, equally easy
> cases fail to be genuinely useful for iterating on a prompt?
> - A) It wouldn't fail — any three cases are equally useful regardless of similarity
> - B) It would give a false sense of confidence, the same way a narrow, non-representative few-shot example set can mislead — real variation needs to actually be covered to surface real gaps ✅
> - C) Three cases are never enough, regardless of their content
> - D) Near-identical cases always produce completely different results

---

*(End of Concept 5 — final concept section of Lesson 2. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
