# Module 1, Lesson 2 — Concept 3: Text embeddings — a distinct, separate use case

---

## Not the same thing as a token embedding

This is worth stating directly, since the two are easy to conflate
given how similar the word "embedding" makes them sound: [a token embedding, from the previous concept](→ this lesson, token embeddings the models internal input layer concept), is one vector *per token*, entirely internal to a model's own architecture, never touched directly by an API user. A **text embedding** is something different in almost every respect: one vector representing an *entire piece of text* — a sentence, a paragraph, a whole document — produced by a separate, dedicated embedding model, and something an API user requests directly, on purpose, as the actual point of the call.

| | Token embedding | Text embedding |
|---|---|---|
| **Scope** | One per token | One per whole piece of text |
| **Where it lives** | Internal to a model's own architecture | Requested directly via an API call |
| **Who touches it** | Nobody outside the model itself | The API user, directly |
| **Purpose** | The model's own entry-point representation | Comparing meaning across texts |

---

## What a text embedding model actually does

A text embedding model takes a whole piece of text as input and
returns a single vector — hundreds of numbers — meant to capture that
text's overall meaning, positioned in [the same kind of meaning-space from Concept 1](→ this lesson, what an embedding actually is concept), just for whole texts instead of individual words:

```python
# illustrative — not a real embedding model, just showing the shape
def text_to_embedding(text: str) -> list:
    ...  # a real embedding model, not implemented here

sentence_a = text_to_embedding("The cat sat on the mat.")
sentence_b = text_to_embedding("A feline was resting on the rug.")
sentence_c = text_to_embedding("The stock market fell sharply today.")
```
*(illustrative — a real embedding model's actual output isn't shown
here; the point is the shape of the operation, not a specific result)*

`sentence_a` and `sentence_b` share almost no words in common at all —
`"cat"` versus `"feline"`, `"mat"` versus `"rug"` — but they mean nearly
the same thing, and a good text embedding model produces vectors for
them that land close together in the embedding space anyway.
`sentence_c` means something completely unrelated, and its vector lands
far from both. This is the actual payoff: text embeddings let you
compare meaning directly, not exact wording — something plain keyword
matching could never do, since `"cat"` and `"feline"` share no letters
at all.

**Interactive: an embedding space for whole sentences.** The same kind
of visualization from Concept 1, extended from single words to full
sentences a learner types in — showing sentences with similar meaning
but completely different wording clustering together, and sentences
about unrelated topics landing far apart, directly demonstrating the
meaning-not-wording property in action.

---

## Why this matters — a preview, not the full picture yet

Being able to compare pieces of text by meaning rather than exact
wording is the foundational operation a whole later part of this course
is built on: finding the most *relevant* piece of text to a question,
out of a large collection, by comparing embeddings rather than searching
for matching keywords. That's the actual groundwork this concept exists
to lay — the full mechanism (storing many text embeddings, searching
across them efficiently, and using the results to inform an LLM's
answer) is [the RAG Systems module's job](→ this course, the rag systems module), not this lesson's. What matters here is understanding what a text embedding actually is and what comparing two of them can tell you — [covered precisely, with the actual math, next](→ this lesson, cosine similarity concept).

---

## Quiz cards

> **Q1.** What's the key difference between a token embedding and a
> text embedding?
> - A) They're the same thing, just different names for it
> - B) A token embedding is one vector per token, internal to a model's architecture; a text embedding is one vector for an entire piece of text, requested directly via an API call ✅
> - C) Text embeddings are only used for very short pieces of text
> - D) Token embeddings are requested by API users; text embeddings are internal

> **Q2.** Why can two sentences with almost no words in common — like
> `"The cat sat on the mat"` and `"A feline was resting on the rug"` —
> end up with similar text embeddings?
> - A) They can't — shared wording is required for similar embeddings
> - B) A text embedding captures overall meaning, not exact wording — two sentences meaning nearly the same thing can land close together in embedding space even sharing almost no words ✅
> - C) The embedding model checks a thesaurus before comparing sentences
> - D) Similar sentence length alone determines embedding similarity

> **Q3.** What real capability does comparing text embeddings enable
> that plain keyword matching can't?
> - A) Finding text that's similar in *meaning*, even when the actual wording is completely different ✅
> - B) Faster searching, with no difference in what gets found
> - C) Checking whether two pieces of text are byte-for-byte identical
> - D) Automatically translating text between languages

> **Q4.** What does this concept explicitly leave for a later module to
> cover?
> - A) What a text embedding actually is
> - B) The full mechanism of storing and searching across many text embeddings to answer a question — the actual implementation of a RAG pipeline ✅
> - C) The difference between token and text embeddings
> - D) Nothing — this concept covers the complete RAG pipeline already

---

*(End of Concept 3. This lesson continues with Concept 4 — cosine
similarity, measuring how close two vectors actually are — drafted
separately.)*
