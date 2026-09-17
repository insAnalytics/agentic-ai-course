# Module 1, Lesson 2 — Concept 2: Token embeddings — the model's internal input layer

---

## From token ID to vector: the model's actual entry point

[A tokenizer turns text into token IDs](→ Module 1, the tokenization lesson). Those IDs are still just arbitrary integers — [exactly the problem Concept 1 opened with](→ this lesson, what an embedding actually is concept, an id alone carries no meaning explanation). Before any real processing happens, the very first thing a transformer does with an incoming token ID is look up its **token embedding** — the learned vector [from Concept 1](→ this lesson, what an embedding actually is concept) that actually represents that token in meaning-space. This lookup is the literal entry point into the model — [the first layer of the architecture covered next in this lesson](→ this lesson, attention and transformer architecture concept).

```python
# a tiny toy embedding table — real ones have one row per vocabulary
# entry (tens of thousands) and hundreds of numbers per row, not 2
embedding_table = {
    2: [0.90, 0.10],    # "cat"
    47: [0.85, 0.15],   # "kitten" — close to cat
    103: [-0.20, 0.90], # "car" — far from both
}

def token_id_to_embedding(token_id: int) -> list:
    return embedding_table[token_id]

print(token_id_to_embedding(2))
print(token_id_to_embedding(47))
print(token_id_to_embedding(103))
```
```
[0.9, 0.1]
[0.85, 0.15]
[-0.2, 0.9]
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is [the same lookup-table pattern from Lesson 1's vocabulary dict](→ Module 1, the tokenization lesson, the vocabulary problem concept), just with a vector as the value instead of a single ID — `"cat"` and `"kitten"`'s vectors sit close together, `"car"`'s sits far away, exactly [the distance-means-similarity structure from Concept 1](→ this lesson, what an embedding actually is concept).

---

## Where the actual numbers come from

The toy table above has hand-picked numbers, for illustration — real
token embeddings are never set by hand. They start out **random**, as
one ordinary set of parameters among the model's many others, and get
adjusted the same way every other weight in the network does: through
training, via gradient descent, as the model learns to predict text
well. Nobody designs `"cat"`'s vector directly — it ends up close to
`"kitten"`'s vector purely as a side effect of the model learning that
those two tokens tend to appear in similar contexts, across a vast
amount of training text. The meaningful geometry — similar tokens
landing near each other — *emerges* from training, rather than being
built in from the start.

---

## Entirely internal — not something an API user ever touches

This matters as a scope boundary worth being explicit about: token
embeddings are a purely internal part of the model's own architecture.
An API user sending text to an LLM never computes, requests, or sees a
token embedding directly — it's an implementation detail sitting
between the tokenizer and the rest of the transformer, invisible from
the outside. [The next concept](→ this lesson, text embeddings a distinct separate use case concept) covers something that sounds similar but is genuinely different: a kind of embedding an API user *does* request directly, for a completely different purpose.

---

## Quiz cards

> **Q1.** What's the first thing a transformer does with an incoming
> token ID?
> - A) It immediately generates the next token
> - B) It looks up that token's learned embedding vector — the model's actual entry point into the rest of the architecture ✅
> - C) It converts the ID back into the original word
> - D) It discards the ID and starts over with raw text

> **Q2.** Where do a token embedding's actual numbers come from?
> - A) They're hand-set by whoever designed the tokenizer
> - B) They start random and get adjusted through training, via gradient descent, the same way every other weight in the model does ✅
> - C) They're copied directly from a dictionary definition
> - D) They're computed fresh, from scratch, every time the model runs

> **Q3.** Why do semantically related tokens, like `"cat"` and
> `"kitten"`, end up with similar embedding vectors?
> - A) Someone manually assigns similar vectors to related words
> - B) It emerges from training — the model learns that related tokens tend to appear in similar contexts, and that similarity ends up reflected in their learned vectors as a byproduct ✅
> - C) Similar-sounding words are always given similar vectors by rule
> - D) It's determined by the two tokens' numeric IDs being close together

> **Q4.** Does an API user ever directly request or compute a token
> embedding when calling an LLM?
> - A) Yes, it's a required part of every API request
> - B) No — token embeddings are entirely internal to the model's own architecture, invisible from outside ✅
> - C) Only when using a reasoning-capable model
> - D) Only for non-English text

---

*(End of Concept 2. This lesson continues with Concept 3 — text
embeddings, a distinct, separate use case — drafted separately.)*
