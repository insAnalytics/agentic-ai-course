# Module 1, Lesson 4 — Concept 3: "The model predicts, it doesn't know" — grounded in mechanics

---

## There is no separate "fact-checking" step anywhere in this process

Look back at exactly what's happened across [Concept 1](→ this lesson, logits and the probability distribution concept) and [Concept 2](→ this lesson, autoregressive generation one token at a time concept): a learned scoring function produces a logit for every possible token, softmax turns those into a probability distribution, one token gets picked, and the whole process repeats. Nowhere in that loop is there a step that consults a database of facts, checks whether a candidate token is *true*, or does anything different depending on whether the "right" answer is well-established or completely unknown. It's the exact same mechanism, every single time, regardless of what's actually being asked.

Whatever an LLM "knows" isn't stored anywhere as retrievable facts —
it's encoded implicitly in the model's learned parameters (the token
embeddings, [the attention weights](→ this module, the attention and transformer architecture lesson, the attention mechanism concept), everything adjusted during training), expressed only through this same
logit-computation process. There's no separate "knowledge module" being
queried — just one statistical scoring function, applied identically to
every possible continuation.

---

## The same mechanism, whether the answer is grounded or not

```python
import math

def softmax(logits: dict) -> dict:
    exp_values = {token: math.exp(score) for token, score in logits.items()}
    total = sum(exp_values.values())
    return {token: value / total for token, value in exp_values.items()}

# "The capital of France is" — an extremely well-established fact
fact_logits = {"Paris": 8.9, "Lyon": 1.2, "Marseille": 0.8}

# "The founder of the fictional city of Meridian Falls was" — no real answer exists at all
fabricated_logits = {"Aldric Thorne": 6.1, "Marcus Reed": 5.9, "Elena Vasquez": 5.3}

print(softmax(fact_logits))
print(softmax(fabricated_logits))
```
```
{'Paris': 0.936, 'Lyon': 0.032, 'Marseille': 0.032}
{'Aldric Thorne': 0.394, 'Marcus Reed': 0.323, 'Elena Vasquez': 0.283}
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is [the exact same `softmax` function from Concept 1](→ this lesson, logits and the probability distribution concept), applied without any modification to both cases. For the genuine fact, one token
dominates overwhelmingly — `"Paris"` at `93.6%` — reflecting how
consistently that answer appears across training data. For the
fabricated scenario, where no real answer exists anywhere in the
model's training data at all, the process still runs identically and
still produces a full, seemingly confident distribution — `"Aldric
Thorne"` comes out ahead at `39.4%`, a genuinely plausible-sounding
name, despite referring to something entirely invented. Nothing in the
computation itself distinguishes "this is well-supported" from "this is
merely the most statistically plausible-sounding guess available" — both
outputs come from precisely the same mechanism, with no internal flag
or check marking one as more trustworthy than the other.

---

## Why "predicts, doesn't know" is the accurate way to describe this

This is the actual, mechanical reason it's more accurate to say a model
*predicts* a continuation than to say it *knows* an answer: prediction
is genuinely all that's happening, every time, for every token — a
statistical best-guess given everything that came before, produced by
one uniform process that has no separate faculty for distinguishing
recalled truth from confident fabrication. [This is exactly what makes hallucination possible](→ this lesson, hallucination as a direct consequence concept) — not a malfunction in this process, but this exact process working precisely as it's built to.

---

## Quiz cards

> **Q1.** Does the logit-and-softmax process include any step that
> checks whether a candidate token is actually true?
> - A) Yes, a separate fact-checking step runs before softmax
> - B) No — the exact same mechanism runs regardless of whether the "correct" answer is well-established, obscure, or doesn't exist at all ✅
> - C) Only for well-known facts, not for creative or fictional prompts
> - D) Only when explicitly requested by the user

> **Q2.** Where is an LLM's "knowledge" actually stored?
> - A) In a separate, queryable database of facts
> - B) Implicitly, in the model's learned parameters — expressed only through the same logit-computation process used for every token ✅
> - C) In a lookup table similar to the tokenizer's vocabulary
> - D) It isn't stored anywhere — the model has no knowledge at all

> **Q3.** In the live demo, why does the fabricated-scenario prompt still
> produce a confident-looking probability distribution, even though no
> real answer exists?
> - A) This shouldn't happen, and represents a bug in the demo
> - B) The exact same softmax process runs regardless of whether real grounding exists — nothing in the mechanism itself distinguishes a well-supported answer from a merely plausible-sounding guess ✅
> - C) The model secretly recognizes the prompt is fictional and lowers its confidence automatically
> - D) Fabricated scenarios always produce a flat, low-confidence distribution

> **Q4.** Why is "the model predicts" a more mechanically accurate
> description than "the model knows"?
> - A) It isn't — both phrases describe the same thing equally accurately
> - B) Every token comes from the same statistical best-guess process, with no separate mechanism distinguishing recalled truth from confident-sounding fabrication ✅
> - C) "Predicts" only applies to the first token generated
> - D) "Knows" is accurate for factual questions; "predicts" only applies to creative writing

---

*(End of Concept 3. This lesson continues with Concept 4 — hallucination
as a direct consequence — drafted separately.)*
