# Module 1, Lesson 1 — Concept 3: Tokens in practice, and why language matters for cost

---

## Token count is the actual currency an LLM operates in

Every input sent to an LLM and every output it produces gets measured
in tokens, not words or characters — [the pieces built by BPE, covered in the previous concept](→ this lesson, subword tokenization bpe concept), not some other unit. This matters beyond just an internal implementation detail: token count is what actually determines how much of [a context window, covered later in this lesson](→ this lesson, context windows and kv cache concept) a piece of text consumes, and it's the literal unit LLM providers charge for, [covered in depth toward the end of this module](→ this module, quantization cost and operational concerns concept). Every concept in this lesson has really been building toward one fact: tokens, not words, are the actual currency.

A rough rule of thumb for English text: about 4 characters, or roughly
0.75 words, per token — a useful approximation, not an exact rule, since
the real count always depends on the specific tokenizer and the
specific text.

---

## The same sentence, tokenized differently depending on what it contains

```
"The cat sat on the mat."
→ ["The", " cat", " sat", " on", " the", " mat", "."]     (7 tokens)

"The agentic AI framework uses Pydantic for validation."
→ ["The", " agent", "ic", " AI", " framework", " uses",
   " Pyd", "antic", " for", " validation", "."]            (11 tokens)
```
*(illustrative — actual token counts and splits vary by tokenizer, not
shown as live output)*

Both sentences have roughly the same number of *words*, but the second
one costs noticeably more tokens — `"agentic"` and `"Pydantic"` are
specific enough, technical enough, that they weren't frequent enough in
typical training data to earn single tokens the way `"the"` or `"cat"`
did, so they split into smaller, less familiar-looking pieces instead.

---

## Why language itself changes the cost

This same effect shows up at a much larger scale across languages, not
just within English. Tokenizer vocabularies are built from training
corpora that skew heavily toward English — which means the merges that
would combine a language's own common words into efficient, single
tokens simply don't exist for languages that were underrepresented in
that training data.

```
English: "How are you today?"
→ 5 tokens

Hindi (equivalent meaning): "आज आप कैसे हैं?"
→ typically 10-15+ tokens for the same meaning
```
*(illustrative, based on the general, well-documented pattern across
BPE-based tokenizers — exact counts vary by tokenizer and model)*

The same *meaning*, expressed in a language whose scripts and common
word-pieces weren't well-represented during tokenizer training, ends up
costing noticeably more tokens — often falling back to smaller pieces,
sometimes close to individual characters, where English would get a
single clean token. This isn't a minor detail: it means, very
concretely, that the same conversation costs more, and eats into a
fixed context window faster, depending on what language it's conducted
in — [a cost dimension worth carrying forward explicitly](→ this module, quantization cost and operational concerns concept) when this module reaches pricing directly.

**Interactive: token counts across languages.** A text box accepting
the same sentence, entered by the learner in several languages, showing
each one's actual token count and its per-token split side by side —
making the disparity something a learner sees for themselves, on
whatever sentence and languages they choose, rather than only reading
about it.

---

## Quiz cards

> **Q1.** What unit does an LLM's context window and its provider's
> pricing actually measure text in?
> - A) Words
> - B) Tokens — the pieces built by the tokenizer, not words or characters ✅
> - C) Characters
> - D) Sentences

> **Q2.** Why did `"Pydantic"` split into multiple tokens while a common
> word like `"the"` stayed as one, in the example shown?
> - A) `"Pydantic"` is longer than `"the"`, and length alone determines splitting
> - B) `"Pydantic"` wasn't frequent enough as a whole word in training data to be merged into a single token, even though its individual pieces were common enough elsewhere to have their own tokens ✅
> - C) Capitalized words are always split, lowercase words never are
> - D) `"Pydantic"` isn't a real English word, so it can't be tokenized at all

> **Q3.** Why does the same sentence, translated into a language poorly
> represented in a tokenizer's training data, typically require more
> tokens than the English version?
> - A) Other languages are inherently longer to express the same meaning
> - B) The merges that would combine that language's own common words into efficient single tokens don't exist, since the tokenizer's vocabulary was built mostly from English-heavy training data ✅
> - C) Non-English text is always converted to English before tokenization
> - D) This effect only applies to languages using non-Latin scripts, never others

> **Q4.** What's a concrete practical consequence of some languages
> costing more tokens than English for equivalent meaning?
> - A) None — token count differences are purely academic
> - B) The same conversation costs more and consumes a fixed context window faster, depending on what language it's conducted in ✅
> - C) Non-English languages simply can't be processed by LLMs at all
> - D) Token count differences only affect output, never input

---

*(End of Concept 3. This lesson continues with Concept 4 — non-text
inputs also become tokens — drafted separately.)*
