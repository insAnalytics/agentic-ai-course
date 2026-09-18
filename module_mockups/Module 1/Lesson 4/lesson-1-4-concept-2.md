# Module 1, Lesson 4 — Concept 2: Autoregressive generation, one token at a time

---

## The model never generates more than one token at once

[Concept 1 showed how a single next-token probability distribution gets produced](→ this lesson, logits and the probability distribution concept). A full response — a sentence, a paragraph — is never generated in one step. The model picks one token from that distribution (exactly *how* it picks — always the top one, or something more varied — is [Lesson 5's job](→ this module, decoding strategies and generation controls lesson)), appends that single token onto the sequence, and then runs the *entire* process again from scratch: a full pass through every transformer layer, over the whole sequence, including the token it just generated — to produce the distribution for the *next* token.

```python
def predict_next_token(sequence: list) -> str:
    # a toy stand-in for a real model's full forward pass + softmax + selection —
    # a real model recomputes this from scratch, over the whole sequence, every call
    toy_rules = {
        ("The", "cat", "sat"): "on",
        ("The", "cat", "sat", "on"): "the",
        ("The", "cat", "sat", "on", "the"): "mat",
    }
    return toy_rules.get(tuple(sequence[-3:]), ".")

sequence = ["The", "cat", "sat"]
for _ in range(3):
    next_token = predict_next_token(sequence)
    sequence.append(next_token)
    print(sequence)
```
```
['The', 'cat', 'sat', 'on']
['The', 'cat', 'sat', 'on', 'the']
['The', 'cat', 'sat', 'on', 'the', 'mat']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Each call to `predict_next_token` receives the *updated* sequence,
including everything generated in every previous call — `"on"` from the
first call is already part of the sequence by the time the second call
runs. This is the actual meaning of "autoregressive": the model
predicts its next output by looking at *its own prior output*, fed back
in as input, over and over, one token at a time.

---

## Why this matters computationally

Every single one of those calls is [the entire logit/softmax computation from Concept 1](→ this lesson, logits and the probability distribution concept), run over the whole sequence so far — not some cheaper, incremental shortcut. A ten-token response requires ten full passes through the model; a thousand-token response requires a thousand. Generation cost scales directly with how many tokens actually get produced — a fact that becomes directly relevant [once this module reaches test-time compute and reasoning models](→ this module, scaling laws and emergent behavior lesson): a model that "thinks" by generating more tokens before its final answer is spending real, additional passes through this exact loop, not some separate, cheaper reasoning process.

---

## Quiz cards

> **Q1.** How many tokens does a model generate in a single step of the
> autoregressive loop?
> - A) An entire sentence at once
> - B) Exactly one token — the model never produces more than one token per step ✅
> - C) A fixed number of tokens, set in advance
> - D) It varies based on the length of the input

> **Q2.** What does "autoregressive" actually mean in this context?
> - A) The model automatically corrects its own grammar mistakes
> - B) The model predicts its next output by looking at its own prior output, fed back in as input, repeatedly ✅
> - C) The model regenerates its entire response from scratch if an error occurs
> - D) The model only works on regression tasks, not text generation

> **Q3.** In the live demo, why does `predict_next_token` receive a
> different `sequence` argument on each of the three loop iterations?
> - A) It doesn't — `sequence` stays identical across all three calls
> - B) Each generated token gets appended to `sequence` before the next call, so every call sees the full sequence including everything generated so far ✅
> - C) The function randomly shuffles the sequence between calls
> - D) `sequence` resets to empty after each call

> **Q4.** Why does generating a longer response require proportionally
> more computation than a shorter one?
> - A) It doesn't — response length has no effect on computation
> - B) Every generated token requires its own full pass through the entire model, over the whole sequence so far — more tokens generated means more full passes performed ✅
> - C) Only the first few tokens require real computation; the rest are free
> - D) Longer responses use a smaller, cheaper version of the model

---

*(End of Concept 2. This lesson continues with Concept 3 — "the model
predicts, it doesn't know," grounded in mechanics — drafted separately.)*
