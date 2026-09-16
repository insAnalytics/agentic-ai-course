# Tokenization and the Vocabulary Problem

> **You'll be able to**
> - Explain why text has to become numbers before a model can process
>   it, and why a fixed, word-level vocabulary can't work at the scale
>   an LLM actually operates at
> - Describe how BPE builds a subword vocabulary by repeatedly merging
>   frequent character pairs, and why that means nothing is ever truly
>   unrepresentable, even a word the tokenizer has never seen
> - Predict, roughly, when a word will stay a single token versus split
>   into pieces, based on how common it (or its pieces) are
> - Explain why the same sentence can cost meaningfully more tokens in
>   some languages than others, and why that's a direct consequence of
>   how tokenizers are trained
> - Explain that images and documents become tokens too, counting
>   against the same context window and cost as text

**Why it matters**
Every other lesson in this module refers back to "tokens" as the basic
unit everything else operates on — how a model generates text, what a
context window actually limits, what an API call actually costs. None
of that lands properly without first understanding what a token
actually is and why it exists in the shape it does — not a word, not a
character, but a frequency-justified compromise between the two,
built specifically so that no input, in any language or format, is ever
something the model simply can't represent.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** Why does text need to be converted into numbers before a
> neural network can process it at all?
> - A) It's a stylistic convention, not a technical requirement
> - B) A neural network is built entirely out of numbers — weights, activations, matrix multiplications — with no built-in way to operate on raw text directly ✅
> - C) Numbers are only needed for very long pieces of text
> - D) This conversion only matters for languages other than English

> **Q2.** Why is "just make the vocabulary bigger" not a real fix for
> the vocabulary problem?
> - A) A larger vocabulary always solves the problem completely
> - B) The number of possible words is effectively unbounded, so no fixed list, however large, can contain all of it ✅
> - C) Dictionaries in Python can't hold more than a fixed number of keys
> - D) Vocabulary size has no relationship to this problem at all

> **Q3.** What does BPE actually do to build its vocabulary?
> - A) It randomly selects a fixed number of words to include
> - B) It starts from individual characters and repeatedly merges whichever adjacent pair appears most frequently across a large body of training text ✅
> - C) It translates every word into a numeric hash
> - D) It removes all rare words from the training data before tokenizing

> **Q4.** Why does BPE never need an `<UNK>` fallback the way a
> word-level vocabulary did?
> - A) BPE vocabularies are simply larger than word-level ones
> - B) Because the vocabulary's pieces go all the way down to individual characters, any possible string can always be represented, in the worst case falling back to single characters ✅
> - C) `<UNK>` is still used in BPE, just less often
> - D) BPE only tokenizes words that already exist in a dictionary

> **Q5.** Why did `"Pydantic"` split into multiple tokens in this
> lesson's example, while a common word like `"the"` stayed as one?
> - A) `"Pydantic"` is longer, and length alone determines splitting
> - B) `"Pydantic"` wasn't frequent enough as a whole word in training data to be merged into a single token, even though its individual pieces were common enough elsewhere to have their own tokens ✅
> - C) Capitalized words are always split, lowercase words never are
> - D) `"Pydantic"` isn't a real English word, so it can't be tokenized

> **Q6.** Why does the same sentence, translated into a language poorly
> represented in a tokenizer's training data, typically cost more
> tokens than the English version?
> - A) Other languages are inherently longer to express the same meaning
> - B) The merges that would combine that language's own common words into efficient single tokens don't exist, since the tokenizer's vocabulary was built mostly from English-heavy training data ✅
> - C) Non-English text is always converted to English before tokenization
> - D) This only applies to non-Latin scripts, never others

> **Q7.** What do the tokens an image or document produces count
> against?
> - A) Nothing — non-text input is free
> - B) The same context window and the same per-token pricing as any text token ✅
> - C) A separate, larger context window reserved specifically for images
> - D) Only cost, never context window space

---

## Closing synthesis — predict, then check

*(end of lesson, reflective rather than graded — an interactive
extension of the tokenizer visualizations from Concepts 2 and 3, meant
for review, not required completion)*

Before revealing the actual token counts, predict which of these four
inputs will tokenize into the *most* tokens per character, and which
will tokenize into the *fewest* — then use [the interactive tokenizer visualization](→ this lesson, subword tokenization bpe concept, the interactive tokenizer visualization explanation) to check:

1. `"The cat sat on the mat."` — plain, common English words
2. `"The agentic AI framework uses Pydantic for validation."` — the
   same rough length, but denser with technical jargon
3. The same sentence as (1), translated into a language the learner
   speaks or is curious about
4. `"xqzflorp wibbleton"` — invented, nonsense words that share no real
   pieces with anything in the vocabulary

*Reasoning to check your prediction against:* (1) should tokenize
efficiently — short, common words merge into single tokens easily. (2)
should cost noticeably more than its word count suggests, since
`"agentic"` and `"Pydantic"` split into pieces the way [Concept 3's example showed](→ this lesson, tokens in practice and why language matters for cost concept). (3) will very likely cost more tokens than (1) for the same
meaning, for exactly the reason covered in that same concept. (4) is the
most revealing case: nonsense words have no learned merges to fall back
on at all, so they should tokenize into unusually small, choppy
pieces — direct, hands-on confirmation that [BPE's fallback to smaller pieces](→ this lesson, subword tokenization bpe concept, the fix pieces small enough explanation) is a real, observable behavior, not just a claim in the reading.

This isn't a task to get "right" — it's a chance to build real intuition
for what drives token count before the rest of this module starts
relying on that intuition being there.
