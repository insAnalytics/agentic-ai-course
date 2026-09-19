# Module 1, Lesson 8 — Concept 1: Scaling laws — the training-time picture

---

## A surprisingly predictable relationship

A **scaling law**, in this context, describes an empirically observed
relationship: as model size (parameters), training data, and total
training compute increase together, [training loss — the same objective driving pretraining, from Lesson 7](→ this module, the training pipeline lesson, pretraining the base stage concept) — tends to decrease in a smooth, remarkably predictable way. Not randomly, not chaotically: a fairly consistent, power-law-shaped pattern, observed across many different model families and training runs.

---

## Why "predictable" is the notable part

This predictability is genuinely useful, not just a tidy observation:
given a certain planned increase in compute, data, or parameters, it's
possible to reasonably estimate *in advance*, before spending the money
on an expensive full training run, roughly how much loss should improve
as a result. Labs actually use this — running smaller, cheaper training
runs at various scales, plotting the resulting relationship, and
extrapolating it to decide how large and how long to train a genuinely
expensive full-scale model, rather than guessing.

**Interactive: a scaling curve.** A log-log plot of training loss
against total training compute, built from real published scaling-law
data — displaying as a straight line on log-log axes, the visual
signature of a genuine power-law relationship, letting a learner see
the actual smoothness this concept describes rather than just reading a
claim about it.

---

## What this describes, precisely

Worth being precise about scope here, since it matters directly for
[the next concept's debate](→ this lesson, emergent behavior a genuinely contested debate concept): scaling laws, as covered here, primarily describe **training loss** — a raw measure of how well the model predicts the next token, [directly tied to pretraining's exact objective](→ this module, the training pipeline lesson, pretraining the base stage concept) — not necessarily every specific downstream task's performance directly. Loss improvements do generally correlate with better performance on real tasks, but the smooth, predictable curve itself is about this one underlying training metric, not a guarantee that every capability improves in lockstep with it.

---

## Quiz cards

> **Q1.** What does a scaling law, in this context, actually describe?
> - A) A fixed legal requirement for how large a model can be
> - B) An empirically observed relationship where training loss decreases in a smooth, predictable way as model size, data, and compute increase together ✅
> - C) A random, unpredictable relationship between model size and performance
> - D) A rule that only applies to models below a certain size

> **Q2.** Why is the *predictability* of scaling laws practically
> useful, beyond being a tidy observation?
> - A) It isn't useful — scaling laws are purely academic
> - B) It lets labs estimate, in advance, roughly how much loss should improve from a planned increase in compute or data, informing decisions before an expensive full training run ✅
> - C) It guarantees every model will perform identically regardless of scale
> - D) It only matters after a model has already been fully trained

> **Q3.** What metric does the scaling-law relationship, as covered
> here, primarily describe?
> - A) A model's exact dollar cost to run
> - B) Training loss — the same underlying objective from pretraining's next-token prediction task ✅
> - C) How many parameters a model has, with no relationship to performance
> - D) The number of languages a model can process

---

*(End of Concept 1. This lesson continues with Concept 2 — emergent
behavior, a genuinely contested debate — drafted separately.)*
