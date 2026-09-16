# Module 1, Lesson 1 — Concept 4: Non-text inputs also become tokens

---

## Images and documents aren't a special case to the model

Everything covered so far in this lesson has been about text — but a
modern LLM can also take an image, or a document, as input. It's worth
being precise about what actually happens there: an image isn't
processed by some entirely separate mechanism sitting alongside the
text-handling machinery. It gets converted into tokens too, the same
general idea as [BPE turning text into pieces](→ this lesson, subword tokenization bpe concept, the fix pieces small enough explanation) — some numeric, sequence-shaped representation the model can process using the exact same underlying architecture it uses for text.

---

## Roughly how an image becomes tokens

The mechanism differs from BPE's character-merging process — an image
is typically divided into a grid of smaller patches, and each patch gets
encoded into its own token-like unit — but the *result* is conceptually
the same shape as text tokenization: a single image turns into a whole
sequence of tokens, not one token representing "an image." A document
(a PDF, say) often becomes some mix of extracted text tokens and
image-style tokens for pages where layout or visual content actually
matters, rather than being handled as one uniform thing.

This lesson isn't the place for the mechanics of *how* to actually send
an image or document to a model — [that's covered properly once real API calls are introduced](→ this module, calling llm apis and processing responses concept). What matters here is just the conceptual fact underneath it.

---

## The practical consequence: it counts, the same way text does

Whatever tokens an image or document turns into count against [the same context window](→ this lesson, this concept forward-pointer) and [the same per-token pricing](→ this module, quantization cost and operational concerns concept) as any text token would — there's no separate, free allowance for non-text input. A single image can easily cost several hundred to over a thousand tokens depending on its resolution and the specific model — often far more than a learner's first intuition would expect, given that "one image" feels like it should be one small thing, not a few hundred tokens' worth of context space and cost.

---

## Quiz cards

> **Q1.** How does a modern LLM actually process an image given as
> input?
> - A) Through a completely separate system, unrelated to how it processes text
> - B) The image gets converted into tokens — some numeric, sequence-shaped representation — processed using the same underlying architecture as text ✅
> - C) Images are stored as-is and never actually processed by the model itself
> - D) Only the image's filename is passed to the model, not its content

> **Q2.** What do the tokens an image or document produces count
> against?
> - A) Nothing — non-text input is free and doesn't affect context or cost
> - B) The same context window and the same per-token pricing as any text token ✅
> - C) A separate, larger context window reserved specifically for images
> - D) Only cost, never context window space

> **Q3.** Why might a learner's first intuition about how "expensive" a
> single image is, in terms of tokens, be wrong?
> - A) Images are always cheaper than any amount of text
> - B) A single image can cost several hundred to over a thousand tokens, which is often far more than "one image" intuitively feels like it should cost ✅
> - C) Images never actually consume any tokens at all
> - D) Token cost for images is identical regardless of resolution

---

*(End of Concept 4 — final concept section of Lesson 1. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
