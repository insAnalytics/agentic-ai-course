# Module 5, Lesson 4 — Concept 1: From similarity to search

> **Note for the site build:**
> - **Lesson 4's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 3 comprehensive sandbox's `lib.py`, unchanged, followed by the
>   code in "Vectors computed ahead of time" below (`text_key`,
>   `vectors_for`, `query_vectors`). **numpy must be loaded** in Pyodide.
> - **Data for this concept:** `embeddings/bge-small-en-v1.5/structured-200.json`
>   and `embeddings/bge-small-en-v1.5/queries.json`, fetched on the first Run
>   and written under `/data/rag/`, plus the documents and labels as before.
> - **The exercise's reference solution** (`VectorIndex`) joins the shared
>   setup only for pages *after* this concept.

---

## The same two halves

Search by meaning has the two halves Lesson 1 described, with a different
thing computed in each:

- **Indexing:** run every chunk through an embedding model once, and store
  the vector next to the chunk.
- **Querying:** run the question through the same model, compare its
  vector with every stored vector, and return the chunks whose vectors are
  closest.

Everything expensive, one model call per chunk, happens once, at indexing.
Each question costs one model call for the question, plus arithmetic.

---

## Vectors computed ahead of time

Embedding models are neural networks, and they can't run inside this
page's sandbox. So both halves' model calls were made ahead of time, with a
real model, bge-small, run offline. Every chunk of the module's chosen
chunking, structured chunks of up to 200 tokens, has a stored vector, and
so does every labelled question. The search itself, the comparing and
ranking, runs live.

That has one consequence worth stating plainly: **you can't type your own
questions** in this lesson. Only the questions in the labelled set have
vectors. Everything else on the page, the scores and the rankings, is real.

Each stored vector is filed under a hash of its chunk's text, so the page
finds it by hashing the text its own chunker produced:

```python
import base64
import hashlib

import numpy as np

EMBEDDINGS = Path("/data/rag/embeddings")

def text_key(text: str) -> str:
    """How a chunk's vector is filed: the first 16 hex digits of the SHA-256 of its text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def _unpack(encoded: str, dim: int) -> np.ndarray:
    return np.frombuffer(base64.b64decode(encoded), dtype="<f2").reshape(-1, dim).astype(np.float32)

def vectors_for(chunks: list[dict], model: str = "bge-small-en-v1.5", chunking: str = "structured-200") -> np.ndarray:
    """The precomputed embedding of each chunk, one row per chunk, in the chunks' order."""
    stored = json.loads((EMBEDDINGS / model / f"{chunking}.json").read_text())
    matrix = _unpack(stored["vectors"], stored["dim"])
    rows = {key: row for row, key in enumerate(stored["keys"])}
    missing = [c for c in chunks if text_key(c["text"]) not in rows]
    if missing:
        raise KeyError(f"{len(missing)} chunks have no precomputed vector in {model}/{chunking}; "
                       f"their text differs from the text that was embedded")
    return matrix[[rows[text_key(c["text"])] for c in chunks]]

def query_vectors(model: str = "bge-small-en-v1.5", kind: str = "instructed") -> dict[str, np.ndarray]:
    """The precomputed embedding of every labelled query, by query id. kind is "instructed" or "plain"."""
    stored = json.loads((EMBEDDINGS / model / "queries.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored[kind], stored["dim"])))
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

If the chunker's output ever differed from the text that was embedded, even
by one character, the hash wouldn't match and `vectors_for` would say so,
rather than pairing a chunk with the wrong vector.

```python
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
matrix = vectors_for(chunks)
print(f"{matrix.shape[0]:,} chunks, {matrix.shape[1]} numbers each, {matrix.nbytes / 1e6:.1f} MB as float32")

lengths = np.linalg.norm(matrix, axis=1)
print(f"vector lengths: {lengths.min():.3f} to {lengths.max():.3f}")
```
```
1,968 chunks, 384 numbers each, 3.0 MB as float32
vector lengths: 1.000 to 1.000
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every vector has length 1. That's deliberate, and it makes the next step
simple.

---

## Scoring every chunk at once

[Module 1's cosine similarity](→ Module 1, embeddings lesson, cosine similarity concept)
divides the dot product of two vectors by both their lengths. When every
length is 1, the division does nothing, and **cosine similarity is just the
dot product**.

That turns search into one operation. Stack the chunk vectors as the rows
of a matrix, and multiplying the matrix by the question's vector computes
every chunk's dot product with the question at once. In Python that's `@`,
and numpy does it in compiled code rather than a Python loop:

```python
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
matrix = vectors_for(chunks)
query = next(q for q in load_queries()["main"] if q["id"] == "q01")
query_vector = query_vectors()["q01"]

# one matrix-vector product scores every chunk at once: 1,968 dot products
scores = matrix @ query_vector
best = np.argsort(-scores)[:3]

print(query["query"])
for row in best:
    print(f"  {scores[row]:.3f}  {chunks[row]['doc_id']} | {chunks[row]['section']}")
```
```
Can I put my agent on the most powerful model?
  0.774  D14 | Agent owners' FAQ > Can my agent use the biggest model?
  0.716  D07 | Runbook: migrating agents off claude-legacy > Step 1: Check the target is allowed
  0.696  D01 | Registry API reference > Tiers and models
```
*(runs live, shows output — read-only demo snippet, not graded)*

`np.argsort(-scores)` gives the row numbers from highest score to lowest,
and `[:3]` keeps the top three. For a corpus this size that's instant: the
whole search is 1,968 dot products of 384 numbers each.

---

## Why it found them

All three results answer the question: the FAQ on the biggest model, the
runbook's check that the target model is allowed, and the API reference's
table of tiers and models. Here's what Lesson 1's keyword search makes of
the same question, over the same chunks:

```python
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
index = KeywordIndex()
index.add(chunks)
question = "Can I put my agent on the most powerful model?"
print("shared keywords with the question:")
for result in index.search(question, 3):
    words = keywords(question) & keywords(result["text"])
    print(f"  {result['score']}  {result['doc_id']} | {result['section']}  {sorted(words)}")
```
```
shared keywords with the question:
  3  D02 | Error code reference > Request errors  ['agent', 'can', 'model']
  3  D07 | Runbook: migrating agents off claude-legacy > Why and by when  ['agent', 'can', 'put']
  3  D07 | Runbook: migrating agents off claude-legacy > Which agents are affected  ['agent', 'can', 'model']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Keyword search matched "agent", "can" and "model", the most common words in
the question. The FAQ answer, which ranked first by meaning, says "biggest"
where the question says "most powerful", so the words never met. Their
vectors did: the embedding model places "biggest model" and "most powerful
model" close together, because they're used in the same kinds of sentences.

That's one question chosen to show the idea. Whether search by meaning is
better *overall*, and where it's worse, is a measurement, and it comes after
the next concept.

---

## Quiz cards

> **Q1.** Why do the stored vectors all have length 1?
> - So the dot product equals the cosine similarity, and one matrix product scores everything ✅
> - Because embedding models can only output vectors of length 1
> - So the vectors take less memory when stored as float16
> - Because vectors longer than 1 can't be compared with each other
>
> *Explanation: cosine similarity divides the dot product by the two
> lengths. With every length already 1, the division is unnecessary, so
> `matrix @ query` gives every chunk's cosine similarity in one step.*

> **Q2.** Why can't you type your own question into this lesson's demos?
> - Only the labelled questions were embedded ahead of time; the model doesn't run in the page ✅
> - Search by meaning only works on questions written in the labelled set's style
> - Your question's words wouldn't appear in the corpus, so it would find nothing
> - The index is locked after indexing, so new questions can't be compared
>
> *Explanation: the embedding model runs offline, so only the texts given
> to it then have vectors. In a real system the model runs at query time,
> one call per question, and any question works.*

> **Q3.** Keyword search missed the FAQ's "Can my agent use the biggest
> model?" for "Can I put my agent on the most powerful model?". Why did
> search by meaning find it?
> - The model places "biggest" and "most powerful" close together, though the words differ ✅
> - Search by meaning ignores common words like "can" and "my"
> - The FAQ section is short, and search by meaning prefers short chunks
> - The embedding model was trained on this company's FAQ
>
> *Explanation: embeddings put text used in similar ways near each other,
> so paraphrases land close even with no words in common. The registry's
> documents were never in the model's training; it generalises from
> language in general.*

> **Q4.** Where does the expensive work of search by meaning happen?
> - At indexing: one model call per chunk, done once ✅
> - At querying: one model call per chunk, for every question
> - At querying: the matrix product, which grows with every question
> - At indexing and querying equally, since both call the model
>
> *Explanation: each chunk is embedded once and stored. A question costs
> one model call for itself plus arithmetic over the stored vectors, which
> is cheap for thousands of chunks. This lesson's last concept covers what
> changes when there are millions.*

---

## Applied sandbox exercise
*(graded — build the index that stores vectors and searches by cosine similarity)*

**Task shown to learner:**

Complete `VectorIndex`, which holds chunks with their vectors.

- `add(chunks, vectors)` takes a list of chunk dicts and a 2-D array with
  one row per chunk. Raise `ValueError` if the counts don't match, the array
  isn't 2-D, or any chunk lacks a `doc_id` or `section`. Store each vector
  scaled to length 1, after any added earlier.
- `search(query_vector, k=3)` scales the query to length 1, scores every
  stored chunk by the dot product, and returns the best `k`, highest first.
  Equal scores keep the order the chunks were added in. Each result is a
  **new** dict: the chunk's fields plus `"score"` as a plain Python `float`.
- `len(index)` is the number of chunks stored.

**Starter code:**

```python
class VectorIndex:
    """Chunks with their embeddings, searched by cosine similarity to a query vector."""

    def __init__(self, dim: int = 384):
        self._chunks = []
        self._matrix = np.empty((0, dim), dtype=np.float32)

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict], vectors: np.ndarray) -> None:
        # TODO: check there's one vector per chunk and every chunk has its source,
        #       then store the vectors at length 1, after any already stored
        ...

    def search(self, query_vector: np.ndarray, k: int = 3) -> list[dict]:
        # TODO: score every chunk against the query at length 1, and return the
        #       best k as new dicts with a float "score", best first
        ...
```

**Hidden tests:**

```python
# shared by the tests below
A = {"doc_id": "D01", "section": "Rate limits", "text": "60 requests per minute"}
B = {"doc_id": "D02", "section": "Errors", "text": "REG-1009 means too many requests"}
C = {"doc_id": "D07", "section": "Step 1", "text": "priority tier for claude-opus"}

# 1. search ranks by cosine similarity, best first, and reports the score
index = VectorIndex(dim=2)
index.add([A, B, C], np.array([[1.0, 0.0], [0.6, 0.8], [0.0, 1.0]]))
results = index.search(np.array([1.0, 0.2]), k=3)
assert isinstance(results, list), f"search should return a list of result dicts; got {results!r}"
assert [r["doc_id"] for r in results] == ["D01", "D02", "D07"], \
    f"highest similarity first; got {[r['doc_id'] for r in results]}"
assert abs(results[1]["score"] - (0.6 + 0.16) / np.sqrt(1.04)) < 1e-6, \
    f"score should be the cosine similarity; got {results[1]['score']}"
assert isinstance(results[0]["score"], float), "scores should be plain floats, not numpy values"

# 2. vector length doesn't matter, only direction
index = VectorIndex(dim=2)
index.add([A, B], np.array([[10.0, 0.0], [0.0, 0.5]]))
top = index.search(np.array([3.0, 0.1]), k=1)[0]
assert top["doc_id"] == "D01" and abs(top["score"] - 3.0 / np.sqrt(9.01)) < 1e-6, \
    "normalize both the stored vectors and the query, so scores are cosines whatever their lengths"

# 3. k, ties in insertion order, and adding in batches
index = VectorIndex(dim=2)
index.add([A], np.array([[0.0, 1.0]]))
index.add([B, C], np.array([[0.0, 1.0], [1.0, 0.0]]))
assert len(index) == 3, "len should count every chunk added, across batches"
assert [r["doc_id"] for r in index.search(np.array([0.0, 1.0]), k=2)] == ["D01", "D02"], \
    "equal scores keep the order the chunks were added in"
assert len(index.search(np.array([1.0, 1.0]), k=10)) == 3, "k larger than the index returns everything"

# 4. results are new dicts, and bad input is refused
result = index.search(np.array([1.0, 0.0]), k=1)[0]
assert "score" not in C, "search added a score to the stored chunk; return a new dict per result"
for chunks, vectors in [([A, B], np.array([[1.0, 0.0]])), ([{"doc_id": "D09", "text": "no section"}], np.array([[1.0, 0.0]]))]:
    try:
        VectorIndex(dim=2).add(chunks, vectors)
    except ValueError:
        pass
    else:
        raise AssertionError(f"add should raise ValueError for {len(chunks)} chunk(s) with {len(vectors)} vector(s) or a chunk without its source")

# 5. the real corpus
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
index = VectorIndex()
index.add(chunks, vectors_for(chunks))
results = index.search(query_vectors()["q01"], k=3)
assert [(r["doc_id"], r["section"].split(" > ")[-1]) for r in results] == [
    ("D14", "Can my agent use the biggest model?"), ("D07", "Step 1: Check the target is allowed"),
    ("D01", "Tiers and models")], [(r["doc_id"], r["section"]) for r in results]
assert round(results[0]["score"], 3) == 0.774, results[0]["score"]
```

**Hint (shown on request):**

`np.linalg.norm(vectors, axis=1, keepdims=True)` gives each row's length as
a column, so dividing by it scales every row at once. `np.vstack` appends
new rows to the stored matrix. For the ranking, `np.argsort(-scores,
kind="stable")` puts the highest scores first and keeps ties in their
original order; the default sort isn't guaranteed to. `float(...)` turns a
numpy number into a plain one.

**Reference solution:**

```python
class VectorIndex:
    """Chunks with their embeddings, searched by cosine similarity to a query vector."""

    def __init__(self, dim: int = 384):
        self._chunks = []
        self._matrix = np.empty((0, dim), dtype=np.float32)

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict], vectors: np.ndarray) -> None:
        vectors = np.asarray(vectors, dtype=np.float32)
        if vectors.ndim != 2 or len(vectors) != len(chunks):
            raise ValueError(f"need one vector per chunk: got {len(chunks)} chunks and vectors of shape {vectors.shape}")
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
        # stored at length 1, so a dot product with a length-1 query is the cosine
        unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        self._chunks.extend(chunks)
        self._matrix = np.vstack([self._matrix, unit])

    def search(self, query_vector: np.ndarray, k: int = 3) -> list[dict]:
        query = np.asarray(query_vector, dtype=np.float32)
        scores = self._matrix @ (query / np.linalg.norm(query))
        # a stable sort keeps equal scores in the order the chunks were added
        best = np.argsort(-scores, kind="stable")[:k]
        return [{**self._chunks[row], "score": float(scores[row])} for row in best]
```

**Explanation:**

Scaling inside the index, rather than trusting the caller, makes the scores
cosines whatever vectors arrive: test 2 stores a vector of length 10 and
queries with one of length 3, and the scores are still cosines. Normalizing
once, at `add`, puts that cost on the indexing side, so each search is a
single matrix product plus a sort. The rest mirrors Lesson 1's
`KeywordIndex` on purpose: every chunk must carry its source, results are
new dicts so callers can't change the index, and ties stay in insertion
order so results are reproducible. The two indexes differ only in how they
score, which is what lets later lessons combine them.
