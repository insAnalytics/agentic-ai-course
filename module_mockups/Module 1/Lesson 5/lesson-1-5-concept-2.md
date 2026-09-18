# Module 1, Lesson 5 — Concept 2: Temperature — reshaping the distribution before sampling

---

## Finally: what `temperature` has actually been doing

Every `AgentConfig`-style example across [Module 0](→ Module 0, the Pydantic lesson) included a `temperature` field, completely unexplained until now. This is that explanation: temperature is a knob that reshapes the *distribution itself*, before sampling ever happens — it changes how sharp or flat the probabilities are, without changing which tokens are even in the running.

---

## The mechanism: dividing logits before softmax

Temperature works by dividing every logit by the temperature value
*before* applying softmax — [the exact softmax function from Lesson 4](→ this module, how llms generate text lesson, logits and the probability distribution concept), with one small change inserted right before it runs:

```python
import math

def softmax_with_temperature(logits: dict, temperature: float) -> dict:
    scaled_logits = {token: score / temperature for token, score in logits.items()}
    exp_values = {token: math.exp(score) for token, score in scaled_logits.items()}
    total = sum(exp_values.values())
    return {token: value / total for token, value in exp_values.items()}

logits = {"mat": 4.2, "floor": 3.1, "chair": 2.8, "moon": -1.5, "xylophone": -3.0}

print(softmax_with_temperature(logits, temperature=0.5))
print(softmax_with_temperature(logits, temperature=1.5))
```
```
{'mat': 0.854, 'floor': 0.094, 'chair': 0.052, 'moon': 0.0, 'xylophone': 0.0}
{'mat': 0.525, 'floor': 0.252, 'chair': 0.207, 'moon': 0.012, 'xylophone': 0.004}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same logits, two completely different resulting distributions. At
`temperature=0.5` (below 1), dividing sharpens the gaps between logits
before they're exponentiated — `"mat"` climbs to `85.4%`, up from its
`temperature=1.0` baseline of `61.8%` [established back in Lesson 4](→ this module, how llms generate text lesson, logits and the probability distribution concept). At `temperature=1.5` (above 1), dividing shrinks those gaps —
`"mat"` drops to `52.5%`, while `"floor"` and `"chair"` become genuinely
competitive at `25.2%` and `20.7%`.

---

## The two extremes, and why "temperature" is the right word for it

As temperature approaches `0`, this sharpening effect intensifies until
the top logit's probability approaches `1` and everything else
approaches `0` — [temperature `0` is, in the limit, equivalent to greedy decoding](→ this lesson, greedy decoding vs sampling the baseline choice concept), always taking the top candidate, since nothing else has any
meaningful chance left. As temperature climbs well above `1`, the
distribution keeps flattening, approaching a nearly uniform spread
across every candidate — genuinely unpredictable, often incoherent
output, since even very implausible tokens start getting real
consideration. The word "temperature" itself is a deliberate physics
metaphor: low temperature is "cold" and settled, everything crystallizes
around the most likely state; high temperature is "hot" and energetic,
with far more randomness in play.

**Interactive: temperature slider, live.** Extending [Concept 1's decoding playground](→ this lesson, greedy decoding vs sampling the baseline choice concept) — a slider from near-`0` to well above `1`, reshaping the same real distribution live as it moves, with the actual sampled output updating alongside it.

---

## Quiz cards

> **Q1.** What does temperature actually do to a token distribution?
> - A) It removes low-probability tokens from consideration entirely
> - B) It reshapes the distribution's sharpness — dividing logits by the temperature value before softmax — without changing which tokens are candidates ✅
> - C) It only affects the very first token generated, not later ones
> - D) It has no measurable effect on the output at all

> **Q2.** Why does `temperature=0.5` make `"mat"`'s probability climb
> higher than its `temperature=1.0` value?
> - A) Lower temperature always removes some tokens from the distribution entirely
> - B) Dividing logits by a value below 1 sharpens the gaps between them before exponentiating, concentrating more probability on the already-highest-scoring token ✅
> - C) `temperature=0.5` has no actual effect on the distribution
> - D) Lower temperature always produces exactly the same result as higher temperature

> **Q3.** What does temperature approaching `0` become equivalent to?
> - A) Pure random selection, ignoring probabilities entirely
> - B) Greedy decoding — the top candidate's probability approaches 1 and everything else approaches 0 ✅
> - C) A completely flat, uniform distribution
> - D) Removing the softmax step entirely

> **Q4.** Why does very high temperature tend to produce less coherent
> output?
> - A) High temperature always causes the model to repeat itself
> - B) The distribution flattens toward nearly uniform, giving even very implausible tokens real consideration during sampling ✅
> - C) High temperature disables sampling and forces greedy decoding
> - D) High temperature only affects punctuation, not word choice

---

*(End of Concept 2. This lesson continues with Concept 3 — top-p and
top-k, restricting the sampling pool itself — drafted separately.)*
