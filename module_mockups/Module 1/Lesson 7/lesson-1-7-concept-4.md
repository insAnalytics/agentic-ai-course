# Module 1, Lesson 7 — Concept 4: RL for reasoning — the newest training stage

---

## A different kind of reward signal: correctness, not preference

[Preference training](→ this lesson, preference training and why message roles exist concept) improves which *style* or *approach* of response humans (or an AI judge) prefer. It doesn't specifically train a model to reason through a problem step by step before answering. **RL for reasoning** is a newer training stage built for exactly that: training a model, via reinforcement learning, to generate extended intermediate reasoning before producing a final answer — with the reward signal here often being something more objective than human preference: whether the *final answer* is actually correct.

**Interactive: the training pipeline diagram.** [The pipeline from Concepts 1–3](→ this lesson, pretraining the base stage concept), now completed with RL for reasoning as its fourth and most recent stage.

---

## Why correctness works as a reward signal here

For domains with objectively checkable answers — math problems, code
that either passes tests or doesn't, logic puzzles with one correct
solution — you don't need a human to manually judge each response the
way [preference training does](→ this lesson, preference training and why message roles exist concept). You can automatically check whether the final answer, after a chain of reasoning steps, is actually correct, and use that as a reward signal reinforcing whichever reasoning patterns tend to *lead to* correct answers. This is a genuinely more scalable, automatable training signal than human preference judgments, at least for the specific domains where "correct" is unambiguous and checkable.

---

## Where this leads directly: reasoning models and test-time compute

This training stage is precisely what produces what get called
**reasoning models** — models that, when actually generating a
response, produce a substantial amount of intermediate reasoning text
before their final answer, because that's exactly the behavior this
training stage rewarded. And [every one of those intermediate reasoning tokens is a real, full generation step](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept) — the same computational cost as any other token, [covered back in Lesson 4](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept). This directly explains why reasoning models cost more and take longer to respond: they're not doing something mysteriously different per token, they're simply generating *more* tokens — the reasoning itself — before reaching their answer. The practical tradeoffs of this, and when it's actually worth the extra cost, are [covered directly in the next lesson](→ this module, scaling laws and emergent behavior lesson) under **test-time compute** — this concept's job is only establishing where that behavior actually comes from: a specific, deliberate training stage, not an emergent accident.

---

## Quiz cards

> **Q1.** What reward signal does RL for reasoning typically use, that's
> different from preference training's signal?
> - A) The exact same human preference judgments used in preference training
> - B) Whether the final answer is actually correct, often checkable automatically for domains like math or code ✅
> - C) How quickly the model generates its response
> - D) How many words the response contains

> **Q2.** Why does correctness work well as an automatic reward signal
> for domains like math or code, specifically?
> - A) It doesn't — every domain requires human judgment
> - B) These domains have objectively checkable answers, so correctness can be verified automatically without needing a human to judge each response ✅
> - C) Math and code problems never have a single correct answer
> - D) Correctness-based rewards only work for very short responses

> **Q3.** Why do reasoning models tend to cost more and take longer to
> respond, mechanically?
> - A) Each individual token they generate is somehow more computationally expensive than a normal token
> - B) They generate substantially more tokens — the intermediate reasoning itself — before reaching a final answer, and every token requires its own full, real generation step ✅
> - C) Reasoning models use an entirely different, unrelated architecture
> - D) Reasoning models always run on slower hardware

> **Q4.** What does this concept establish as the actual origin of
> "reasoning" behavior in a model?
> - A) It's an accidental, unexplained emergent property with no clear cause
> - B) A specific, deliberate training stage — RL for reasoning — that rewards generating extended reasoning leading to correct final answers ✅
> - C) Reasoning behavior is present in every model regardless of training
> - D) It comes entirely from pretraining, with no additional stage needed

---

*(End of Concept 4. This lesson continues with Concept 5 — fine-tuning
as a builder's option — drafted separately.)*
