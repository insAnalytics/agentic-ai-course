# Module 1, Lesson 7 — Concept 5: Fine-tuning as a builder's option

---

## Shifting perspective: from how labs train to how you'd adapt

Everything covered so far in this lesson describes how a major lab
builds a general-purpose model from scratch — pretraining, SFT,
preference training, RL for reasoning. This concept shifts the question
entirely: as someone *building on top of* an existing model, what are
your actual options for adapting its behavior to a specific need,
without retraining an entire model yourself?

---

## Three real options, and when each one fits

**Prompting** — including giving examples directly in the prompt
(few-shot) — is the cheapest, fastest option, requiring no training at
all. It's the right default first choice for most behavior or format
changes that can genuinely be described in instructions or demonstrated
with a few examples. Actual prompting *technique* is [covered properly in the Agentic AI basics module](→ this course, the agentic ai basics module) — this lesson only places it as one of the three options.

**Retrieval (RAG)** fits when the actual problem is *knowledge* the
model doesn't have and structurally can't have baked in — information
that's private, or that changes too often to ever be captured by
training a model at all, [directly connecting back to the knowledge-cutoff problem from Lesson 4](→ this module, how llms generate text lesson, knowledge cutoff concept). Implementation belongs to [the later RAG Systems module](→ this course, the rag systems module) — this lesson only places it as the right tool for *that specific kind of problem*, not for behavior or style changes.

**Fine-tuning** fits a different case than either of the above:
consistently reproducing a specific style or format across a large
volume of uses, or reliably performing a narrow, specialized task
extremely well — cases where prompting alone tends to be inconsistent
or unreliable at scale, and where the actual issue isn't missing
knowledge (which RAG would fix) but insufficiently reliable *behavior*.

**Interactive: choosing between the three.** A simple decision flow —
"is the problem missing/changing knowledge?" → retrieval; "does behavior
need to be extremely consistent across many uses, or highly specialized?"
→ fine-tuning; otherwise → prompting, as the default starting point.

---

## LoRA: what makes fine-tuning actually accessible

Retraining every parameter of a large model would be enormously
expensive — genuinely out of reach for an individual or small team.
**LoRA** (Low-Rank Adaptation) makes fine-tuning practical by training
only a small set of *additional* parameters — an add-on — while leaving
the vast majority of the original model's parameters completely
unchanged:

```python
total_parameters = 70_000_000_000       # a "70 billion parameter" model, for illustration
lora_added_parameters = 20_000_000      # a small, added set of LoRA parameters

percentage_touched = (lora_added_parameters / total_parameters) * 100
print(f"{percentage_touched:.4f}% of the original model's parameter count")
```
```
0.0286% of the original model's parameter count
```
*(illustrative figures — real LoRA setups vary, but the scale of the
ratio is representative)*

Training and storing an add-on that's a tiny fraction of a percent of
the full model's size is genuinely feasible on modest hardware, in a
way that touching every one of a large model's parameters simply isn't
— this is the concrete reason fine-tuning has become accessible to
individuals and small teams, not just large labs with massive compute
budgets.

---

## Quiz cards

> **Q1.** What are the three options this concept identifies for
> adapting a model's behavior, as a builder rather than a lab training
> from scratch?
> - A) Pretraining, SFT, and preference training
> - B) Prompting, retrieval (RAG), and fine-tuning ✅
> - C) Tokenization, embeddings, and attention
> - D) Temperature, top-p, and stop sequences

> **Q2.** When does retrieval (RAG) fit better than fine-tuning?
> - A) When the model needs a more consistent writing style
> - B) When the actual problem is missing or changing knowledge the model doesn't have and structurally can't have baked into its parameters ✅
> - C) Retrieval and fine-tuning always solve the exact same problem equally well
> - D) When cost is the only consideration

> **Q3.** What does LoRA actually do, to make fine-tuning more
> accessible?
> - A) It retrains every single parameter in the model, just more efficiently
> - B) It trains only a small set of additional parameters, leaving the vast majority of the original model's parameters completely unchanged ✅
> - C) It removes the need for any training data at all
> - D) It only works for very small models with few parameters to begin with

> **Q4.** Why is prompting generally recommended as the default first
> option to try, before reaching for fine-tuning?
> - A) Prompting is always more effective than fine-tuning in every case
> - B) It's the cheapest and fastest option, requiring no training at all, and fits most behavior or format changes that can be described or demonstrated directly ✅
> - C) Fine-tuning is no longer possible for individuals or small teams
> - D) Prompting is the only option that can add new knowledge to a model

---

*(End of Concept 5 — final concept section of Lesson 7. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
