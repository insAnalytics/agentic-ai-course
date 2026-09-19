# The Training Pipeline

> **You'll be able to**
> - Explain what pretraining actually produces, and why a base model
>   doesn't reliably follow instructions on its own
> - Explain what SFT adds — behavior, not primarily new knowledge — and
>   why it builds directly on a pretrained model rather than replacing it
> - Explain preference training (RLHF/RLAIF/DPO), where message roles
>   actually come from, why sycophancy is a real side effect, and the
>   mechanistic root cause of prompt injection
> - Explain RL for reasoning as a distinct, recent training stage, and
>   why it's the actual origin of reasoning models' extra cost
> - Choose correctly between prompting, retrieval, and fine-tuning for a
>   real adaptation need, and explain what LoRA does to make fine-tuning
>   accessible

**Why it matters**
Nearly every practical question about why a model behaves the way it
does — why it sometimes tells you what you want to hear, why a system
prompt isn't an unbreakable security wall, why a "thinking" model costs
more — has its actual answer in this lesson, not in the model's
architecture alone. And the closing shift toward adaptation options
matters just as directly: knowing whether a real problem is a knowledge
gap, a behavior inconsistency, or something prompting alone can already
fix is exactly the judgment call this course is building toward being
able to make confidently.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** What is pretraining's actual training objective?
> - A) Learning to follow specific instructions correctly
> - B) Predicting the next token, given the text so far, across a massive body of text ✅
> - C) Learning to hold a multi-turn conversation
> - D) Learning to recognize and refuse harmful requests

> **Q2.** Why might a base model, given a direct question, continue with
> more questions instead of answering it?
> - A) This represents a bug or malfunction
> - B) Continuing in the same style as a common training pattern can be a genuinely plausible next-token continuation, since the base model was never taught to recognize "answer this" as distinct behavior ✅
> - C) Base models can't generate text about geography
> - D) This only happens with very small models

> **Q3.** Is SFT primarily how a model learns new factual knowledge?
> - A) Yes, entirely
> - B) No — SFT's curated dataset is far too small to be the primary knowledge source; that comes overwhelmingly from pretraining ✅
> - C) SFT and pretraining contribute knowledge equally
> - D) Neither stage contributes any factual knowledge

> **Q4.** Are message roles like `system` and `user` architecturally
> enforced, hardcoded categories?
> - A) Yes, a special separate channel built into the architecture
> - B) No — they're special tokens in a flat sequence; a model's "respect" for them is a learned behavioral pattern from preference training ✅
> - C) Message roles don't actually exist in real models
> - D) Only the system role is architecturally special

> **Q5.** What is the actual mechanistic root cause of prompt injection?
> - A) A software bug present in some models but not others
> - B) Roles are a learned convention, not a hard security boundary — instructions and data are processed as the same kind of tokens, so a model can't always reliably distinguish them ✅
> - C) User error, unrelated to how models are trained
> - D) It only affects models never given preference training

> **Q6.** What is sycophancy, and where does it come from?
> - A) A deliberate design goal
> - B) A tendency to favor agreeable responses over accurate ones, arising because human preference judgments tend to rate agreeable answers more favorably ✅
> - C) A bug unrelated to training
> - D) Something only affecting models with no human feedback

> **Q7.** What reward signal does RL for reasoning typically use?
> - A) The same human preference judgments as preference training
> - B) Whether the final answer is actually correct, often checkable automatically for domains like math or code ✅
> - C) Response generation speed
> - D) Word count

> **Q8.** Why do reasoning models tend to cost more and take longer?
> - A) Each token is somehow individually more expensive to compute
> - B) They generate substantially more tokens — the reasoning itself — before a final answer, and every token requires its own full generation step ✅
> - C) They use an entirely different architecture
> - D) They always run on slower hardware

> **Q9.** When does retrieval (RAG) fit better than fine-tuning?
> - A) When the model needs a more consistent writing style
> - B) When the actual problem is missing or changing knowledge the model structurally can't have baked into its parameters ✅
> - C) They always solve exactly the same problem
> - D) When cost is the only consideration

> **Q10.** What does LoRA actually do?
> - A) Retrains every parameter in the model, just more efficiently
> - B) Trains only a small set of additional parameters, leaving the vast majority of the original model unchanged ✅
> - C) Removes the need for any training data
> - D) Only works for very small models

---

## Closing synthesis — one scenario, every concept

*(end of lesson, reflective rather than graded — applying the whole
pipeline and the builder's decision framework together)*

A company wants its support agent to: **(a)** always respond in a
specific, formal tone; **(b)** know current product pricing, which
changes monthly; **(c)** reliably decline to discuss competitor pricing,
even when asked persistently or indirectly. Reason through which of
[prompting, retrieval, or fine-tuning](→ this lesson, fine-tuning as a builders option concept) fits each need, before checking below.

*Reasoning to check against:* **(a)** is a consistent-behavior problem
— [exactly what fine-tuning fits](→ this lesson, fine-tuning as a builders option concept), though careful prompting might get partway there for lower-stakes cases; this is fundamentally a *behavior* question, the same kind of problem [SFT and preference training were built to shape](→ this lesson, sft teaching a model to actually follow instructions concept), not a knowledge gap. **(b)** is unmistakably a retrieval problem — pricing that changes monthly is structurally similar to [the knowledge-cutoff problem from Lesson 4](→ this module, how llms generate text lesson, knowledge cutoff concept): baking current pricing into the model's weights via fine-tuning would mean retraining every single month, exactly the scenario retrieval exists to avoid. **(c)** is the most interesting case: it looks like a fine-tuning problem (consistent refusal behavior), but it's genuinely hard to make fully reliable — worth connecting back to [Concept 3's prompt injection point](→ this lesson, preference training and why message roles exist concept): since instructions and cleverly-phrased user text are processed through the same mechanism, no single layer of training alone (prompting, fine-tuning, or otherwise) provides an absolute guarantee against persistent, adversarial attempts to route around a stated refusal — genuine defense-in-depth here belongs to the Agentic AI basics module's scope, not something this lesson's tools alone can promise.

The pattern worth taking away: correctly diagnosing *which kind* of
problem you actually have — behavior, knowledge, or something no single
layer fully solves — is what the entire training pipeline covered in
this lesson equips you to do, before ever touching prompting, retrieval,
or fine-tuning at all.
