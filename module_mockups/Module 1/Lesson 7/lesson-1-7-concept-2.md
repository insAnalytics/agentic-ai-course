# Module 1, Lesson 7 — Concept 2: SFT — teaching a model to actually follow instructions

---

## The same training process, a much smaller, curated dataset

[A base model, from the previous concept](→ this lesson, pretraining the base stage concept), doesn't reliably recognize "answer this" as the right behavior for a question — it just continues text plausibly, which sometimes means continuing the *pattern* of a question rather than actually answering it. **Supervised Fine-Tuning (SFT)** fixes this using the exact same underlying training process as pretraining — still adjusting parameters so the model's predicted probabilities better match a desired target — just applied to a very different dataset: a much smaller, carefully curated set of instruction-response pairs, showing the model what an actual helpful response to an instruction should look like.

**Interactive: the training pipeline diagram.** [The same pipeline from Concept 1](→ this lesson, pretraining the base stage concept), with SFT now highlighted as the second stage — a much shorter, narrower training pass compared to pretraining's massive scale, layered directly on top of the pretrained base model rather than starting over from scratch.

---

## The same prompt, before and after SFT

```
Prompt: "What is the capital of France?"

Base model (pretraining only): "What is the capital of Germany?
What is the capital of Italy?"

After SFT: "The capital of France is Paris."
```
*(illustrative — a real comparison would depend on the specific models
involved, but this general shift in behavior is well-documented)*

Nothing about the model's underlying *knowledge* changed here — it
already had the fact `"Paris"` embedded somewhere in its parameters,
purely from pretraining on a vast amount of text mentioning it. What
changed is *behavior*: SFT reshaped what the model has learned is the
appropriate continuation for text that looks like a direct question,
away from "continue the pattern" and toward "actually answer it."

---

## SFT teaches behavior, not primarily new facts

This distinction is worth stating directly, since it's an easy point of
confusion: SFT is not primarily how a model learns new facts or
knowledge — that's overwhelmingly [pretraining's job](→ this lesson, pretraining the base stage concept), given the sheer scale of text involved. SFT's actual job is teaching *how* to respond — format, tone, the basic shape of following an instruction rather than merely continuing text — using a dataset that's small and curated specifically for demonstrating that behavior, not for teaching content.

---

## Quiz cards

> **Q1.** What kind of dataset does SFT actually train on, compared to
> pretraining?
> - A) An even larger, less curated body of raw internet text
> - B) A much smaller, carefully curated set of instruction-response pairs, showing what a good response to an instruction looks like ✅
> - C) The exact same dataset used for pretraining, unchanged
> - D) A dataset containing no text at all, only numerical labels

> **Q2.** Is SFT a fundamentally different training mechanism from
> pretraining, or the same one applied differently?
> - A) A completely different, unrelated mechanism
> - B) The same underlying training process — adjusting parameters via gradient descent to better match a target — just applied to a different, curated dataset ✅
> - C) SFT doesn't involve any actual training, just manual rule-writing
> - D) SFT replaces the model's architecture entirely

> **Q3.** After SFT, why does the model now answer `"What is the capital
> of France?"` directly, rather than continuing with more questions?
> - A) SFT taught the model the fact `"Paris"` for the very first time
> - B) SFT reshaped what the model has learned is the appropriate continuation for question-like text, away from "continue the pattern" and toward "actually answer it" ✅
> - C) The model's vocabulary was expanded to include the word "Paris"
> - D) This change has nothing to do with training at all

> **Q4.** Is SFT primarily how a model learns new factual knowledge?
> - A) Yes, entirely — pretraining contributes no factual knowledge at all
> - B) No — SFT's dataset is far too small and curated to be the primary source of a model's knowledge; that comes overwhelmingly from pretraining's massive scale ✅
> - C) SFT and pretraining contribute knowledge in exactly equal amounts
> - D) Neither stage contributes any factual knowledge

---

*(End of Concept 2. This lesson continues with Concept 3 — preference
training, and why message roles exist — drafted separately.)*
