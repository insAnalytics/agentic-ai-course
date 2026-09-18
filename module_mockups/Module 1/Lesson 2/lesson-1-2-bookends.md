# Embeddings

> **You'll be able to**
> - Explain why representing something as a vector, rather than a
>   single arbitrary ID, lets meaning be captured geometrically —
>   distance and direction corresponding to similarity
> - Explain what a token embedding is, where its numbers actually come
>   from, and why it's entirely internal to a model
> - Explain what a text embedding is, how it differs from a token
>   embedding, and why comparing text embeddings enables search by
>   meaning rather than exact wording
> - Compute cosine similarity directly, and explain why it measures
>   angle rather than raw distance

**Why it matters**
Nearly everything the rest of this course does with meaning — finding
relevant context for a question, comparing whether two pieces of text
are really saying the same thing, the eventual RAG pipeline this lesson
laid groundwork for — comes down to embeddings and the cosine similarity
between them. Getting the token-embedding/text-embedding distinction
genuinely clear now, rather than papering over it, is what prevents real
confusion later when both start showing up in the same conversation
about a real system.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** Why does a token ID alone fail to capture any meaningful
> relationship between two words?
> - A) Token IDs are always sequential and therefore meaningful
> - B) A token ID is just an arbitrary lookup key, assigned based on vocabulary-building order, not meaning ✅
> - C) Token IDs only exist for rare words
> - D) This isn't actually true — token IDs do reflect meaning directly

> **Q2.** What does "distance in embedding space" actually correspond
> to?
> - A) How many letters two words share
> - B) Similarity in meaning ✅
> - C) Alphabetical order
> - D) How frequently each word appears in training data

> **Q3.** Where do a token embedding's actual numbers come from?
> - A) They're hand-set by whoever designed the tokenizer
> - B) They start random and get adjusted through training, via gradient descent, like every other weight in the model ✅
> - C) They're copied from a dictionary definition
> - D) They're computed fresh from scratch every time the model runs

> **Q4.** Does an API user ever directly request or compute a token
> embedding?
> - A) Yes, it's required on every API request
> - B) No — token embeddings are entirely internal to a model's architecture ✅
> - C) Only when using a reasoning-capable model
> - D) Only for non-English text

> **Q5.** What's the key difference between a token embedding and a
> text embedding?
> - A) They're the same thing
> - B) A token embedding is one vector per token, internal to a model; a text embedding is one vector for an entire piece of text, requested directly via an API call ✅
> - C) Text embeddings only work for short text
> - D) Token embeddings are requested by users; text embeddings are internal

> **Q6.** Why can two sentences sharing almost no words end up with
> similar text embeddings?
> - A) They can't — shared wording is required
> - B) A text embedding captures overall meaning, not exact wording ✅
> - C) The embedding model checks a thesaurus first
> - D) Sentence length alone determines similarity

> **Q7.** What does cosine similarity actually measure?
> - A) The raw distance between two vectors' endpoints
> - B) The angle between them — near `1` for the same direction, near `-1` for opposite, near `0` for unrelated ✅
> - C) Which vector has more dimensions
> - D) The sum of both vectors' values

> **Q8.** Why does cosine similarity focus on angle rather than raw
> distance or vector length?
> - A) Angle is simply easier to compute
> - B) A vector's length isn't inherently meaningful — direction is what encodes similarity ✅
> - C) Distance and angle always give identical results
> - D) Vector length is the only thing that matters

---

## Closing synthesis — predict, then check

*(end of lesson, reflective rather than graded — extending the
interactive visualizations from this lesson into one combined exercise)*

Before checking with [the pairwise-similarity tool from Concept 4](→ this lesson, cosine similarity concept, the interactive pairwise similarity explanation), predict roughly how similar (high, medium, or low) each of these sentence pairs' cosine similarity will be, and *why*:

1. `"The cat sat on the mat."` vs. `"A feline was resting on the rug."`
2. `"The cat sat on the mat."` vs. `"The stock market fell sharply today."`
3. `"How do I reset my password?"` vs. `"I forgot my login credentials, help."`
4. `"How do I reset my password?"` vs. `"The weather is nice today."`

*Reasoning to check your predictions against:* (1) should score high —
different wording, nearly identical meaning, [exactly Concept 3's example](→ this lesson, text embeddings a distinct separate use case concept). (2) should score low — no real relationship in meaning at all, regardless of both being complete, grammatical sentences. (3) should score high, for the same reason as (1) — this is also the case that actually matters practically: a real search system needs to recognize that a support query and a rephrased version of it mean the same thing, even with zero shared vocabulary. (4) should score low, the same shape as (2).

The pattern worth internalizing: cosine similarity tracks *meaning*, consistently, regardless of shared wording — pairs (1) and (3) prove that directly, and pairs (2) and (4) confirm it isn't just rewarding "any two full sentences" with a high score by default.

**One more self-check, before moving on:** if you're asked to explain,
in one sentence, why a token embedding and a text embedding aren't the
same thing — can you? If not, [Concept 3's comparison table](→ this lesson, text embeddings a distinct separate use case concept) is worth a second look before starting the next lesson, since the rest of this module and the eventual RAG module both lean on that distinction staying clear.
