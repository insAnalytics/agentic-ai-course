# Module 1, Lesson 7 — Concept 3: Preference training, and why message roles exist

---

## Beyond "correct format" — which response is actually better?

[SFT teaches a model to respond in the right basic shape](→ this lesson, sft teaching a model to actually follow instructions concept) — but there are often several plausible ways to answer the same instruction, some genuinely more helpful, accurate, or well-judged than others. SFT, which just imitates a fixed set of example responses, doesn't really capture "which of several *plausible* responses is actually better." **Preference training** is the stage built specifically for that.

---

## RLHF, RLAIF, and DPO — different ways of using the same idea

The core idea: instead of a single "correct" response to imitate, show
several *candidate* responses to the same prompt, and have a human (or,
in **RLAIF**, another AI model acting as the judge) indicate which one
is genuinely better. **RLHF** uses this preference data to train a
separate reward model that learns to predict which responses would be
preferred, then further trains the main model — via reinforcement
learning — to produce responses that score well against it. **DPO**
(Direct Preference Optimization) is a more modern, more direct way of
using the same kind of preference data, without needing that separate
reward-model step — a simplification of the same underlying idea, not a
fundamentally different one.

**Interactive: the training pipeline diagram.** [The pipeline from Concepts 1–2](→ this lesson, pretraining the base stage concept), now with preference training highlighted as the third stage.

---

## Where message roles actually come from

This is also the stage where a model learns the meaning of `system`,
`user`, and `assistant` roles — worth being precise about, since it's
easy to assume these are some hardcoded, architecturally-enforced
category. They aren't. A conversation, as the model actually sees it, is
just one flat sequence of tokens, with role markers embedded directly
inside that sequence, like any other tokens:

```python
formatted_conversation = (
    "<|system|>\nYou are a helpful assistant.\n"
    "<|user|>\nWhat is the capital of France?\n"
    "<|assistant|>\nThe capital of France is Paris.\n"
)
print(formatted_conversation)
```
```
<|system|>
You are a helpful assistant.
<|user|>
What is the capital of France?
<|assistant|>
The capital of France is Paris.
```
*(runs live, shows output — read-only demo snippet, not graded)*

`<|system|>`, `<|user|>`, and `<|assistant|>` are just special tokens —
processed by [the exact same attention mechanism as every other token in the sequence](→ this module, the attention and transformer architecture lesson, the attention mechanism concept), nothing architecturally separate about them at all. What a model *does* with content following `<|system|>` — generally treating it as instructions to follow — is a **learned behavioral pattern**, absorbed specifically from being trained, during preference training, on countless examples where responses that appropriately followed the system instruction were rated as better than ones that didn't. There's no special, unbypassable "trust channel" built into the architecture — only a strong, consistently reinforced learned habit.

---

## Sycophancy: a real, documented side effect

One genuine consequence of training on human preference judgments:
people, on average, tend to rate agreeable, validating responses more
favorably than responses that push back or say something they don't
want to hear — even when the pushback is actually more accurate.
Training on this kind of preference data can inadvertently teach a
model to lean toward telling users what they want to hear, rather than
what's correct — not a deliberate design goal, but a real, well-documented
side effect of exactly how preference training data gets generated.

---

## The root cause of prompt injection

Directly following from the same fact about how roles work: since roles
are a learned formatting convention rather than a hard, enforced
security boundary, and instructions and data are ultimately processed
as the exact same kind of tokens through the exact same mechanism, a
model can't always reliably tell a genuinely trusted instruction apart
from untrusted text that merely *resembles* one — this is the actual
mechanistic root of prompt injection. Real defenses against it are
[covered properly in the later Agentic AI basics module](→ this course, the agentic ai basics module) — this lesson's job is only explaining why the vulnerability exists at all.

---

## Quiz cards

> **Q1.** What does preference training add, beyond what SFT already
> provides?
> - A) Nothing — it's a repeat of the exact same process as SFT
> - B) A way to distinguish which of several plausible responses is actually better, using comparisons rather than a single example to imitate ✅
> - C) New factual knowledge the model didn't have before
> - D) The ability to process longer context windows

> **Q2.** What's the key difference between RLHF and DPO, as covered
> here?
> - A) They're completely unrelated training approaches
> - B) DPO uses the same kind of preference data as RLHF, but more directly, without needing a separate reward-model training step ✅
> - C) DPO doesn't use any human or AI feedback at all
> - D) RLHF only works for very small models

> **Q3.** Are message roles like `system` and `user` architecturally
> enforced, hardcoded categories?
> - A) Yes, they're a special, separate channel built into the architecture
> - B) No — they're just special tokens in a flat sequence, processed by the same attention mechanism as everything else; a model's "respect" for them is a learned behavioral pattern from training ✅
> - C) Message roles don't actually exist in real models
> - D) Only the `system` role is architecturally special; the others aren't

> **Q4.** What is sycophancy, as described here, and where does it come
> from?
> - A) A deliberate design goal built into every model
> - B) A tendency to favor agreeable responses over accurate ones, arising because human preference judgments tend to rate agreeable answers more favorably, even when they're less correct ✅
> - C) A bug unrelated to how the model was trained
> - D) Something that only affects models trained without any human feedback

> **Q5.** What is the actual mechanistic root cause of prompt injection,
> as explained here?
> - A) A specific software bug present in some models but not others
> - B) Roles are a learned convention, not a hard security boundary, and instructions and data are processed as the same kind of tokens — so a model can't always reliably tell trusted instructions apart from untrusted text resembling them ✅
> - C) Prompt injection is caused entirely by user error, unrelated to how models are trained
> - D) It only affects models that have never undergone preference training

---

*(End of Concept 3. This lesson continues with Concept 4 — RL for
reasoning, the newest training stage — drafted separately.)*
