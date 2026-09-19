# Module 1, Lesson 5 — Concept 6: Stop sequences, and nondeterminism even at temperature 0

---

## Stop sequences: controlling when generation ends, not which token comes next

Every control covered so far in this lesson shapes *which* token gets
picked. A **stop sequence** is different in kind: an explicit string
that, the moment it appears in the generated output, halts generation
immediately — regardless of what the model would otherwise have
continued producing.

```python
def generate_until_stop(tokens_to_generate: list, stop_sequence: str) -> str:
    generated = ""
    for token in tokens_to_generate:
        generated += token
        if stop_sequence in generated:
            break
    return generated

tokens = ["Here", " is", " the", " answer", ":", " 42", "\n\n", "Let", " me", " explain", " further", "..."]
result = generate_until_stop(tokens, stop_sequence="\n\n")
print(result)
```
```
Here is the answer: 42

```
*(runs live, shows output — read-only demo snippet, not graded)*

The moment `"\n\n"` shows up in the accumulated text, the loop breaks —
`"Let me explain further..."` never gets included in the result, even
though it was sitting right there in `tokens`, ready to be appended.
This is a genuinely practical control: cutting a response off precisely
at a known structural marker, rather than relying on the model to
decide on its own when to stop.

---

## A common wrong assumption: temperature 0 means identical output, always

[Temperature approaching 0 was covered as equivalent, in the limit, to greedy decoding](→ this lesson, temperature reshaping the distribution before sampling concept) — always taking the single highest-probability token. It's tempting to conclude from this that temperature `0` guarantees byte-for-byte identical output for the exact same input, every single time. In practice, this often isn't quite true.

The reason comes down to real infrastructure, not the decoding math
itself: floating-point arithmetic isn't perfectly consistent regardless
of the order operations happen in —

```python
a = (0.1 + 0.2) + 0.3
b = 0.1 + (0.2 + 0.3)
print(a == b)
```
```
False
```
*(runs live, shows output — read-only demo snippet, not graded)*

— and providers commonly **batch** multiple different users' requests
together on the same hardware for efficiency. Exactly which other
requests happen to be batched alongside yours, at any given moment,
subtly changes the order floating-point operations actually execute
in — the same underlying phenomenon the toy example above illustrates,
just happening inside a model's real computation instead of a simple
arithmetic expression. When two candidate tokens' logits are extremely
close, this tiny numerical variation can occasionally flip which one
comes out narrowly ahead — even at temperature `0`, even for the exact
same prompt.

This is worth being direct about, since it's a genuinely common,
reasonable-sounding assumption that turns out to be wrong in practice:
temperature `0` makes output *far* more consistent and predictable than
higher temperatures, but it doesn't provide an absolute, mathematical
guarantee of byte-for-byte identical output across every call.

---

## Quiz cards

> **Q1.** What does a stop sequence actually control?
> - A) Which specific token gets chosen at each generation step
> - B) When generation halts entirely — the moment the specified string appears in the output, generation stops immediately, regardless of what would have come next ✅
> - C) The overall length of every response, regardless of content
> - D) How confident the model is in its output

> **Q2.** In the stop-sequence demo, why doesn't `"Let me explain
> further..."` appear in the final result, even though it was present
> in `tokens_to_generate`?
> - A) It's a bug in the function
> - B) The loop breaks the moment the stop sequence appears in the accumulated text, before ever reaching the remaining tokens in the list ✅
> - C) `"Let me explain further..."` isn't a valid string
> - D) Stop sequences only work on the very first token, not later ones

> **Q3.** Why can temperature `0` fail to produce byte-for-byte identical
> output across identical requests, in practice?
> - A) It always produces identical output — this never actually happens
> - B) Real infrastructure details, like batching multiple requests together on shared hardware, can subtly change the order floating-point operations execute in, which can occasionally flip which of two very close candidates comes out narrowly ahead ✅
> - C) Temperature 0 disables the model's logit computation entirely
> - D) This only happens with sampling-based decoding, never greedy

> **Q4.** What does `(0.1 + 0.2) + 0.3 != 0.1 + (0.2 + 0.3)` illustrate,
> in the context of this concept?
> - A) That Python's arithmetic is fundamentally broken
> - B) The same underlying floating-point phenomenon — operation order subtly affecting the exact result — that also applies inside a real model's computation, contributing to nondeterminism even at temperature 0 ✅
> - C) That temperature settings directly control floating-point precision
> - D) That stop sequences and floating-point arithmetic are the same mechanism

---

*(End of Concept 6 — final concept section of Lesson 5. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
