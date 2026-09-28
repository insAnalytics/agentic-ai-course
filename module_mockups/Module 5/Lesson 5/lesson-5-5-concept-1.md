# Module 5, Lesson 5 — Concept 1: Rare words should count for more

> **Note for the site build:**
> - **Lesson 5's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 4 comprehensive sandbox's `lib.py`, unchanged (Lessons 1 to 4's
>   code, including `VectorIndex`, `meaning_search` and `answered_ids`).
>   numpy must be loaded.
> - **Data for this lesson:** the documents, the labels, and bge-small's
>   `structured-200.json` and `queries.json`. This concept uses only the
>   documents and labels.
> - No new shared code; the demos are independent.

---

## Every word, counted the same

Lesson 1's keyword search failed on "What does REG-1007 mean?" because it
counted shared words: a chunk sharing "what" and "does" outranked the error
table, which shared only `reg-1007`. Every word was worth one point, though
"what" appears almost everywhere and `reg-1007` almost nowhere.

A word's usefulness for search is about how much it narrows things down. A
word in nearly every chunk tells you almost nothing about which chunk
answers the question. A word in five chunks points straight at them. So the
fix is to weigh each word by how rare it is in the corpus.

---

## Inverse document frequency

The standard weight comes from the probabilistic model of retrieval that
BM25 grew out of. Robertson and Zaragoza's account of it (2009) derives the
weight a word should get when nothing is known about which documents are
relevant, and arrives at a close approximation to classical **inverse
document frequency (IDF)**:

> weight = log( (N − n + 0.5) / (n + 0.5) )

where *N* is the number of chunks and *n* the number of chunks containing
the word. The fewer chunks contain it, the bigger the weight. The 0.5s keep
the formula finite for words in no chunks or every chunk. Here are the
words of the failed question, over the module's 1,968 chunks:

```python
import math

chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
chunk_words = [keywords(c["text"]) for c in chunks]
N = len(chunks)

print(f"{'word':<10}{'in chunks':>10}{'weight':>9}")
for word in sorted(keywords("What does REG-1007 mean?")):
    n = sum(word in words for words in chunk_words)
    print(f"{word:<10}{n:>10}{math.log((N - n + 0.5) / (n + 0.5)):>9.2f}")
```
```
word       in chunks   weight
does              80     3.16
mean               6     5.71
reg-1007           5     5.88
what              92     3.01
```
*(runs live, shows output — read-only demo snippet, not graded)*

`reg-1007` is now worth nearly twice as much as "what". The logarithm keeps
the weights in a narrow band, so a rare word doesn't drown out everything
else, but the order is right.

One edge case of this formula: a word in more than half of all chunks gets a
*negative* weight, counting against the chunks that contain it. The
stopword list removes the usual culprits here, and no word in this corpus
reaches that point. Many implementations add 1 inside the logarithm to keep
every weight positive.

---

## Weighting isn't enough on its own

Score each chunk by the sum of the weights of the question words it
contains, and try the failed question again:

```python
import math
from collections import Counter

chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
chunk_words = [keywords(c["text"]) for c in chunks]
N = len(chunks)
counts = Counter(word for words in chunk_words for word in words)
weight = {word: math.log((N - n + 0.5) / (n + 0.5)) for word, n in counts.items()}

def weighted_search(question: str, k: int) -> list[dict]:
    """Score each chunk by the summed rarity weights of the question words it contains."""
    wanted = keywords(question)
    scored = [(sum(weight[w] for w in wanted & words), row) for row, words in enumerate(chunk_words)]
    ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
    return [{**chunks[row], "score": score} for score, row in ranked[:k]]

question = "What does REG-1007 mean?"
for result in weighted_search(question, 3):
    shared = sorted(keywords(question) & keywords(result["text"]))
    print(f"{result['score']:.2f}  {result['doc_id']} | {result['section'].split(' > ')[-1]}  {shared}")
```
```
8.72  prometheus-docs/instrumenting/writing_exporters.md | Drop less useful statistics  ['mean', 'what']
8.72  prometheus-docs/introduction/comparison.md | Scope  ['mean', 'what']
6.17  prometheus-docs/guides/multi-target-exporter.md | Querying multi-target exporters with Prometheus  ['does', 'what']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Still wrong, and the reason is worth understanding. "mean" is also rare in
this corpus: it appears in only 6 chunks, all of them Prometheus pages,
several about statistics and averages. So "mean" plus "what" outweighs `reg-1007` alone. The error table
never says "mean": its column is headed "Meaning", and exact matching treats
the two as unrelated words. Rarity is measured across the corpus, not
against the question, so a word can be rare and still be the wrong clue.
Keyword engines often reduce words to their stems, so "meaning" and "mean"
match, which is one more lever this lesson doesn't pull.

Across the whole labelled set, rarity weighting alone changes little:

```python
import math
from collections import Counter

queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
chunk_words = [keywords(c["text"]) for c in chunks]
N = len(chunks)
counts = Counter(word for words in chunk_words for word in words)
weight = {word: math.log((N - n + 0.5) / (n + 0.5)) for word, n in counts.items()}

def weighted_search(question: str, k: int) -> list[dict]:
    """Score each chunk by the summed rarity weights of the question words it contains."""
    wanted = keywords(question)
    scored = [(sum(weight[w] for w in wanted & words), row) for row, words in enumerate(chunk_words)]
    ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
    return [{**chunks[row], "score": score} for score, row in ranked[:k]]

overlap = KeywordIndex()
overlap.add(chunks)
plain, weighted = answered_ids(overlap.search, queries), answered_ids(weighted_search, queries)
print(f"word overlap: {len(plain)} answered;  weighted by rarity: {len(weighted)} answered")
print(f"gained {sorted(weighted - plain)}, lost {sorted(plain - weighted)}")
```
```
word overlap: 23 answered;  weighted by rarity: 23 answered
gained ['q31'], lost ['q01']
```
*(runs live, shows output — read-only demo snippet, not graded)*

One gained, one lost, the same total. Weighting fixed the scale of each
word but left two other problems from earlier lessons untouched: a chunk
that mentions a word five times scores the same as one that mentions it
once, and a long chunk has more chances to contain rare words by accident,
the length bias Lesson 3 measured. BM25, in the next concept, addresses
both.

---

## Quiz cards

> **Q1.** Why should a word that appears in 5 chunks count for more than
> one that appears in 92?
> - It narrows the search far more, so a match on it says more about the chunk ✅
> - Rare words are always the most important words in a question
> - Common words are usually misspelled, so their matches are unreliable
> - Embedding models give rare words larger vectors
>
> *Explanation: a word nearly every chunk contains can't tell chunks
> apart. A rare word picks out a handful. IDF turns that into a weight,
> though, as the "mean" example shows, rare isn't the same as relevant.*

> **Q2.** In IDF's formula, what happens to a word that appears in more
> than half of all chunks?
> - Its weight becomes negative, so matching it lowers a chunk's score ✅
> - Its weight becomes zero, so it's ignored
> - Its weight becomes infinite, so it dominates the score
> - It's removed from the index automatically
>
> *Explanation: log((N − n + 0.5)/(n + 0.5)) drops below zero once n is
> more than half of N. Stopword lists usually remove such words, and many
> implementations add 1 inside the logarithm to keep weights positive.*

> **Q3.** With rarity weighting, the Prometheus pages still beat the error
> table for "What does REG-1007 mean?". Why?
> - "mean" is also rare here, and the table says "Meaning", which exact matching doesn't connect ✅
> - The error table is too long, so its weight is divided down
> - `reg-1007` is split into two words, so it matches nothing
> - Rarity weights are computed over the questions, not the chunks
>
> *Explanation: IDF measures rarity across the corpus, where "mean"
> happens to be rare, found only in a few Prometheus pages. Combined with "what", it outweighs
> the one rare word the table shares. Stemming would have let "Meaning"
> match "mean".*

> **Q4.** Rarity weighting alone left the answered count unchanged. What
> two problems does it not address?
> - Repeated mentions of a word, and long chunks matching by accident ✅
> - Paraphrased questions, and questions with identifiers
> - Stopwords, and words shorter than two letters
> - Chunks without metadata, and chunks over the embedding limit
>
> *Explanation: summing weights of shared words ignores how often a word
> appears in a chunk, and gives long chunks more chances to contain rare
> words. BM25 adds term-frequency saturation and length normalisation for
> exactly these.*
