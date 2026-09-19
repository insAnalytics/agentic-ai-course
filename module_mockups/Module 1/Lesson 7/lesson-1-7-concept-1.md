# Module 1, Lesson 7 — Concept 1: Pretraining — the base stage

---

## What actually produces the parameters behind every logit

Every mechanism covered across [Lessons 3–5](→ this module, the attention and transformer architecture lesson) — attention weights, token embeddings, the logits that softmax turns into a distribution — depends on the model's parameters having *specific, learned values*, not random ones. **Pretraining** is the stage that actually produces those values: training on a truly massive amount of raw text — web pages, books, code, and more — with one single, simple objective, repeated an enormous number of times: given some text, predict what comes next.

**Interactive: the training pipeline diagram.** A horizontal pipeline —
pretraining → SFT → preference training → RL for reasoning — that fills
in stage by stage across this lesson, with pretraining highlighted here
as the first and by far the most resource-intensive stage.

---

## No notion of "instructions" yet — just next-token prediction

This is worth being precise about: pretraining doesn't involve any
curated notion of "being helpful," "following instructions," or
"answering a question" at all. It's exactly [the autoregressive next-token prediction loop from Lesson 4](→ this module, how llms generate text lesson, autoregressive generation one token at a time concept), applied across an enormous, largely unstructured body of text — the model is only ever learning "what token plausibly comes next, given this context," never anything more specific than that.

A model that's *only* gone through pretraining — often called a **base
model** — doesn't behave like a helpful assistant. Ask it a direct
question, and it might not actually answer at all:

```
Prompt: "What is the capital of France?"

Base model continuation: "What is the capital of Germany? What is
the capital of Italy? What is the capital of Spain?"
```
*(illustrative — a real base model's specific output would vary, but
this general pattern is well-documented)*

This isn't a malfunction — it's the training objective working exactly
as intended. Text resembling a list of quiz questions is a genuinely
common pattern across a huge amount of training text, so continuing with
*more questions in the same style* is a statistically plausible
continuation — arguably more plausible, in raw next-token-prediction
terms, than switching into "answer mode," a distinct behavior the base
model was never actually taught to recognize as the "correct" response
to a question.

---

## Setting up the rest of this lesson

This is exactly the gap the next stage exists to close: pretraining
builds a model with genuinely broad, general language ability — the
parameters underlying every mechanism this module has covered — but
with no learned notion of what a *conversation*, an *instruction*, or a
*question expecting an answer* should actually look like as behavior.
[SFT, covered next](→ this lesson, sft teaching a model to actually follow instructions concept), is the stage that teaches exactly that.

---

## Quiz cards

> **Q1.** What is pretraining's actual training objective?
> - A) Learning to follow specific instructions correctly
> - B) Predicting the next token, given the text so far — applied across a massive, largely unstructured body of text ✅
> - C) Learning to hold a multi-turn conversation
> - D) Learning to recognize and refuse harmful requests

> **Q2.** What does pretraining actually produce, in terms of the
> mechanisms covered earlier in this module?
> - A) The transformer architecture's overall structure, but not its actual parameter values
> - B) The learned values of the model's parameters — the embeddings and attention weights that everything else in the architecture depends on ✅
> - C) A curated dataset of question-answer pairs
> - D) The tokenizer's vocabulary

> **Q3.** Why might a base model, given a direct question, continue with
> more questions instead of answering it?
> - A) This represents a bug or malfunction in the model
> - B) Continuing in the same style as a common training pattern (like a list of quiz questions) can be a genuinely plausible next-token continuation, since the base model was never taught to recognize "answer this" as a distinct behavior ✅
> - C) Base models are incapable of generating any text about geography
> - D) This only happens with very small models

> **Q4.** What gap does the next stage of training, SFT, exist to close?
> - A) Pretraining already produces a model that behaves like a helpful assistant, so no further stage is needed
> - B) Pretraining builds broad language ability but no learned notion of what following an instruction or answering a question should actually look like as behavior ✅
> - C) SFT exists only to make a model faster, not to change its behavior
> - D) SFT replaces pretraining entirely rather than building on it

---

*(End of Concept 1. This lesson continues with Concept 2 — SFT,
teaching a model to actually follow instructions — drafted separately.)*
