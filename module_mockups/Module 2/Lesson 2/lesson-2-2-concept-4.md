# Module 2, Lesson 2 — Concept 4: Chain-of-thought prompting

---

## The pain: jumping straight to an answer, on a multi-step problem

```
Prompt: "A store has 23 apples. They sell 8 in the morning and receive
a shipment of 15 in the afternoon. Then they sell half of what they now
have. How many apples do they have left? Answer with just the number."

Illustrative (incorrect) output: "22"
```

Asked for only a final number, with no room to work through the
problem, a model can jump straight to a plausible-*sounding* answer
that's actually wrong — here, skipping or misapplying one of the
problem's several sequential steps (23 − 8 = 15, +15 = 30, half of 30 =
15 — the correct answer is `15`, not `22`).

---

## The fix: asking for the reasoning explicitly

```
Prompt: "A store has 23 apples. They sell 8 in the morning and receive
a shipment of 15 in the afternoon. Then they sell half of what they now
have. How many apples do they have left? Think step by step, then give
your final answer."

Illustrative output:
"Start with 23 apples.
Sell 8: 23 - 8 = 15.
Receive 15 more: 15 + 15 = 30.
Sell half of 30: 30 / 2 = 15.
Final answer: 15"
```

This isn't just a formatting difference — [every step written out becomes part of the context the next prediction actually conditions on](→ Module 1, how llms generate text lesson, autoregressive generation one token at a time concept). Working through `23 - 8 = 15` explicitly, as generated text, means that intermediate result is genuinely present in the sequence when the model goes on to compute the next step — skipping straight to a final number means none of that intermediate scaffolding was ever actually available to condition on in the first place.

---

## Not the same thing as a trained reasoning model

This is worth being precise about, since it's easy to conflate with
[Module 1's reasoning models](→ Module 1, scaling laws and emergent behavior lesson, test time compute and reasoning models concept): chain-of-thought *prompting*, as covered here, is a technique that works on *any* model, achieved purely by how the prompt is written — no special training required. A dedicated reasoning model has been *specifically trained*, via [RL for reasoning](→ Module 1, the training pipeline lesson, rl for reasoning the newest training stage concept), to produce this kind of extended reasoning automatically, often without even needing to be explicitly asked. These are two different routes to a similar-looking behavior: one a prompting technique applicable to any model, the other a trained, often more sophisticated capability inherent to specific models. Prompted chain-of-thought on a standard model is generally less reliable than a genuinely trained reasoning model's native behavior — but it's still a real, widely-applicable, and often sufficient technique, especially when a full reasoning model isn't available or isn't worth its extra cost for a given task.

---

## Where this leads next

Reasoning *before* answering is exactly the idea [the next lesson extends into an agent loop specifically](→ this module, react and reasoning in the loop lesson) — interleaving reasoning with actual tool use, rather than reasoning about a standalone question in isolation.

---

## Quiz cards

> **Q1.** Why does asking for step-by-step reasoning tend to improve
> accuracy on a multi-step problem, mechanically?
> - A) It doesn't actually have any real effect on accuracy
> - B) Each written-out intermediate step becomes part of the sequence the model conditions on for the next prediction — skipping straight to a final answer means that scaffolding was never actually available ✅
> - C) It only helps because it makes the response longer, regardless of content
> - D) Step-by-step prompting only works for arithmetic problems specifically

> **Q2.** Is chain-of-thought prompting the same thing as using a
> dedicated reasoning model?
> - A) Yes, they're identical in every respect
> - B) No — CoT prompting works on any model purely through how the prompt is written; a reasoning model has been specifically trained via RL to produce extended reasoning automatically ✅
> - C) CoT prompting only works on reasoning models, never standard ones
> - D) Reasoning models can't be asked to show their reasoning at all

> **Q3.** Why might CoT prompting on a standard model still be worth
> using, even though a dedicated reasoning model is generally more
> reliable at this same kind of task?
> - A) CoT prompting is always strictly better, so this comparison never actually matters
> - B) A full reasoning model isn't always available or worth its extra cost for a given task, and CoT prompting is a real, widely-applicable technique that works on any model without that added cost ✅
> - C) Standard models are incapable of chain-of-thought reasoning under any circumstances
> - D) There's no real difference in reliability between the two approaches

---

## Applied sandbox exercise 2

*(writing a genuine chain-of-thought prompt — grades the learner's
written prompt directly, not model output)*

*Task shown to learner:* Write a prompt for this problem: "A library has
140 books. It lends out 45 books, then receives a donation of 60 more
books. Later, it removes a third of its current collection for
repairs. How many books remain available?" Your prompt must explicitly
ask the model to reason through the problem step by step *before*
stating a final answer — not just ask for the final answer alone.

*Grading (checks the learner's submitted prompt text directly):*
confirms the prompt includes the full word problem, an explicit
instruction requesting step-by-step reasoning (phrases like "step by
step," "show your reasoning," or equivalent), and that this reasoning
request comes *before* any request for a final answer, not tacked on
disconnected from it.

*Hint (shown on request):* The structure that worked in this concept's
demo: state the problem, then add something like `"Think step by step,
then give your final answer."` — the key requirement is that the
prompt asks for the reasoning process itself, not just a bare final
number.

*Correct answer + explanation (shown on failure, if requested):*
```
A library has 140 books. It lends out 45 books, then receives a
donation of 60 more books. Later, it removes a third of its current
collection for repairs. How many books remain available? Think step by
step, then give your final answer.
```
This explicitly requests the intermediate reasoning — each step (140 −
45 = 95, +60 = 155, minus a third of 155) gets written out and becomes
part of what the model conditions on for the next step, rather than
jumping straight to a single, unscaffolded final number.

---

*(End of Concept 4. This lesson continues with Concept 5 — iterating
systematically rather than by vibes — drafted separately.)*
