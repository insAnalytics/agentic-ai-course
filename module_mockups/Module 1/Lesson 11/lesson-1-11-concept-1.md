# Module 1, Lesson 11 — Concept 1: Quantization — FP16 → INT8 → INT4

---

## Every weight is a number stored at some precision

Every parameter in a model — [the embeddings and attention weights from Lesson 3](→ this module, the attention and transformer architecture lesson), everything learned during [training](→ this module, the training pipeline lesson) — is stored as a number, at some specific numerical precision. Models are commonly trained and stored in **FP16** (16-bit floating point) or **FP32** (32-bit) by default — more bits per number means a more precise representation of that weight's actual value, but also more memory to store it and more computation to process it.

---

## Quantization: fewer bits, less precision, less memory

**Quantization** reduces that precision after training — converting
FP16 weights down to **INT8** (8-bit integers) or even **INT4** (4-bit
integers), representing each weight with meaningfully fewer possible
distinct values:

```python
def quantize_to_n_levels(value: float, min_val: float, max_val: float, n_levels: int) -> float:
    step_size = (max_val - min_val) / (n_levels - 1)
    quantized_step = round((value - min_val) / step_size)
    return min_val + quantized_step * step_size

original_weight = 0.7234891
print(f"original (full precision): {original_weight}")
print(f"quantized to 256 levels (~INT8-like): {quantize_to_n_levels(original_weight, -1, 1, 256):.7f}")
print(f"quantized to 16 levels (~INT4-like): {quantize_to_n_levels(original_weight, -1, 1, 16):.7f}")
```
```
original (full precision): 0.7234891
quantized to 256 levels (~INT8-like): 0.7254902
quantized to 16 levels (~INT4-like): 0.7333333
```
*(runs live, shows output — a simplified stand-in for real quantization
schemes, illustrating the core idea rather than an exact production
technique)*

Both quantized versions are approximations of the original value —
`256`-level quantization stays quite close (`0.7255` vs. `0.7235`), but
`16`-level quantization is visibly coarser (`0.7333`), since there are
far fewer discrete values available to round to. This is the actual
mechanical shape of what quantization does: fewer possible values per
weight, less memory per weight, at the direct cost of some genuine
precision loss in what each weight actually represents.

---

## The real tradeoff

Moving from FP16 → INT8 → INT4 progressively shrinks a model's memory
footprint and can meaningfully speed up inference — genuinely useful
for running a model on limited hardware. It also progressively
increases the risk of degraded output quality, since the model's
actually-learned weights are being approximated with less and less
precision than what they were trained with. This is a real tradeoff,
not a free efficiency gain: more aggressive quantization (INT4 over
INT8) generally means a real quality cost, in exchange for a real
efficiency gain.

---

## Who this actually matters to

Worth stating plainly: quantization is a decision made by whoever is
actually *running* a model — self-hosting it on their own or rented
hardware, choosing how to trade off memory and speed against quality.
An API user calling a provider's endpoint never sees or chooses this
directly — the provider has already made that decision on their end,
whatever it is, before the API is ever exposed. This distinction matters
for knowing which parts of this concept apply to you: if you're only
ever calling an API, quantization isn't a setting you'll ever touch; if
you're deploying a model yourself, it's a genuinely central decision.

---

## Quiz cards

> **Q1.** What does quantization actually do to a model's parameters?
> - A) It adds new parameters to improve the model's capabilities
> - B) It reduces the numerical precision used to store each weight — fewer bits, fewer possible distinct values ✅
> - C) It removes parameters from the model entirely
> - D) It retrains the model on new data

> **Q2.** Why does INT4 quantization produce a coarser approximation of
> an original weight than INT8 quantization?
> - A) There's no actual difference between the two
> - B) INT4 has far fewer possible discrete values to round to than INT8, since it uses fewer bits ✅
> - C) INT4 is only used for very small models
> - D) INT8 doesn't actually reduce precision at all

> **Q3.** What's the real tradeoff quantization involves?
> - A) There's no tradeoff — quantization only ever improves a model
> - B) Reduced memory footprint and often faster inference, at the cost of some genuine risk to output quality, since weights are approximated with less precision ✅
> - C) Quantization only affects a model's training speed, never inference
> - D) Quantization always improves output quality as a side effect

> **Q4.** Who actually makes quantization decisions, and who typically
> doesn't?
> - A) Every API user configures quantization settings directly
> - B) Whoever is actually running/self-hosting a model makes this decision; an API user calling a provider's endpoint never sees or chooses it directly ✅
> - C) Quantization is decided automatically by the tokenizer
> - D) Only reasoning models support quantization at all

---

*(End of Concept 1. This lesson continues with Concept 2 — the model
landscape and selection — drafted separately.)*
