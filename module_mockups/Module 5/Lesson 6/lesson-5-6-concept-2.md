# Module 5, Lesson 5 — Concept 2: BM25

> **Note for the site build:**
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `terms`, exactly as in "Counting words, not just
>   noticing them" below.
> - **The exercise's reference solution** (`BM25Index`) joins the shared
>   setup only for pages *after* this concept.
> - Hidden tests 5 and 6 read the corpus and build three full indexes; allow
>   several seconds.

---

## Two things a sum of weights ignores

The previous concept weighted each shared word by its rarity and added the
weights up. That left two questions unanswered:

- **Does it matter how often a word appears?** A chunk that mentions
  `REG-1009` four times is probably more about it than one that mentions it
  once. But not four times more: the fourth mention adds little that the
  first three didn't.
- **Does it matter how long the chunk is?** One mention in a 30-word chunk
  is a bigger share of what the chunk is about than one mention in a
  300-word chunk. And a long chunk has more chances to contain any word by
  accident, the bias Lesson 3 measured.

**BM25** answers both. Robertson and Zaragoza's monograph derives it from
the same probabilistic model as the rarity weight, and calls it one of the
most successful text-retrieval algorithms that model produced.

---

## Repeats that saturate

BM25 counts a word's occurrences in a chunk, *tf*, but passes the count
through a curve that flattens out: tf / (k1 + tf). The constant k1 sets
how quickly it flattens:

```python
k1 = 1.2
print(f"{'times in chunk':>15}{'contribution':>14}{'vs once':>9}")
for tf in [1, 2, 3, 5, 10]:
    contribution = tf / (k1 + tf)
    print(f"{tf:>15}{contribution:>14.2f}{contribution / (1 / (k1 + 1)):>8.1f}x")
```
```
 times in chunk  contribution  vs once
              1          0.45     1.0x
              2          0.62     1.4x
              3          0.71     1.6x
              5          0.81     1.8x
             10          0.89     2.0x
```
*(runs live, shows output — read-only demo snippet, not graded)*

With k1 = 1.2, a second mention adds 40% to the first, and ten mentions
are worth only twice one. A chunk can't win just by repeating a word. A
larger k1 lets repeats keep counting for longer; as k1 grows very large,
the score becomes proportional to the count.

---

## Length, measured against the average

Before the count goes through the curve, BM25 scales k1 by how long the
chunk is compared with the average chunk:

> k1 × ( (1 − b) + b × length / average length )

A long chunk gets a bigger denominator, so each mention is worth less; a
short chunk gets a smaller one. The constant b, between 0 and 1, sets how
strongly: b = 1 normalises fully for length, b = 0 ignores length
entirely. Here's what one mention is worth at b = 0.75:

```python
k1, b = 1.2, 0.75
print(f"{'chunk length':>22}{'one mention is worth':>22}")
for label, ratio in [("a quarter of average", 0.25), ("average", 1.0), ("four times average", 4.0)]:
    contribution = 1 / (k1 * ((1 - b) + b * ratio) + 1)
    print(f"{label:>22}{contribution:>22.2f}")
```
```
          chunk length  one mention is worth
  a quarter of average                  0.66
               average                  0.45
    four times average                  0.20
```
*(runs live, shows output — read-only demo snippet, not graded)*

One mention in a chunk a quarter of the average length is worth more than
three times one mention in a chunk four times the average.

---

## The whole score

Putting the pieces together, each question word that appears in a chunk
contributes its rarity weight times its saturated, length-adjusted count:

> score = Σ over the question's words in the chunk of
> idf(word) × tf / ( k1 × ((1 − b) + b × length / average length) + tf )

The model itself doesn't say how to set k1 and b. Robertson and Zaragoza
report that experiments generally find values such as 0.5 < b < 0.8 and
1.2 < k1 < 2 reasonably good, while noting the best values depend on the
documents and the queries. This lesson uses k1 = 1.2 and b = 0.75. Some
published versions multiply the fraction by (k1 + 1); that changes every
score by the same factor, so the ranking doesn't change. Each distinct word
in the question counts once, however often the question repeats it.

---

## Counting words, not just noticing them

`keywords` returns a set, which says whether a word appears but not how
often. BM25 needs the counts, so it uses a list version that keeps repeats:

```python
def terms(text: str) -> list[str]:
    """Like keywords, but a list that keeps repeats, so each word's count in the text is known."""
    words = text.lower().translate(PUNCTUATION).split()
    return [word for word in words if len(word) > 1 and word not in STOPWORDS]
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

`collections.Counter(terms(text))` then gives each word's count in a chunk,
and the total of those counts is the chunk's length in words.

---

## Quiz cards

> **Q1.** With k1 = 1.2, what are ten mentions of a word in a chunk worth,
> compared with one?
> - About twice as much, because repeats saturate ✅
> - Ten times as much, because each mention counts fully
> - The same, because only the first mention counts
> - Nothing more, because repeats are treated as noise
>
> *Explanation: tf / (k1 + tf) rises quickly and then flattens. A chunk
> that repeats a word is somewhat more likely to be about it, but not in
> proportion to the repeats.*

> **Q2.** What does setting b = 0 do?
> - Turns length normalisation off, so long chunks aren't penalised ✅
> - Turns repeat saturation off, so counts become linear
> - Turns rarity weighting off, so all words count the same
> - Makes every chunk's score zero, since b multiplies the score
>
> *Explanation: b controls how much the chunk's length relative to the
> average adjusts the saturation curve. At 0, length has no effect; at 1,
> the adjustment is full. Saturation is k1's job.*

> **Q3.** Why does BM25 compare a chunk's length with the average, rather
> than using its length directly?
> - So the adjustment is relative to what's normal in this collection ✅
> - Because the average length is cheaper to compute than each chunk's
> - So that chunks longer than average are left out of the results
> - Because embedding models expect lengths near the average
>
> *Explanation: a 100-word chunk is long in a collection of 30-word chunks
> and short in one of 1,000-word chunks. Dividing by the average makes the
> normalisation mean the same thing in any collection.*

> **Q4.** A published BM25 formula multiplies each term by (k1 + 1). Does
> it rank chunks differently from the version here?
> - No: it scales every score by the same factor, so the order is unchanged ✅
> - Yes: it gives repeated words more weight than rare ones
> - Yes: it removes length normalisation from the score
> - No, but only when b is set to 0
>
> *Explanation: multiplying every score by the same positive constant
> can't change which is larger. Ranking functions are often written in
> forms that differ only in ways like this.*

---

## Applied sandbox exercise
*(graded — implement BM25 as an index)*

**Task shown to learner:**

Complete `BM25Index(k1=1.2, b=0.75)`.

- `add(chunks)` refuses (with `ValueError`) any chunk without a `doc_id`
  or `section`. It stores each chunk and `Counter(terms(chunk["text"]))`.
  Then it recomputes, **over every chunk stored so far**, each word's idf,
  log((N − n + 0.5) / (n + 0.5)), where N is the number of chunks and n the
  number containing the word, and the average length, where a chunk's
  length is the total of its counts.
- `search(question, k=3)` scores every chunk: the sum, over the question's
  **distinct** terms that appear in the chunk, of
  idf × tf / (k1 × ((1 − b) + b × length / average) + tf). It returns the
  best `k` chunks with scores above zero, highest first, ties in the order
  added, each as a **new** dict with a float `"score"`.
- `len(index)` is the number of chunks stored.

**Starter code:**

```python
import math
from collections import Counter

class BM25Index:
    """Chunks scored by BM25: rarity-weighted matches, saturating with repeats, normalised for length."""

    def __init__(self, k1: float = 1.2, b: float = 0.75):
        self.k1, self.b = k1, b
        self._chunks, self._counts = [], []
        self._idf, self._average_length = {}, 0.0

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict]) -> None:
        # TODO: refuse chunks without their source; store each chunk and Counter(terms(text));
        #       then recompute every word's idf and the average length over all chunks stored
        ...

    def search(self, question: str, k: int = 3) -> list[dict]:
        # TODO: score every chunk with BM25 over the question's distinct terms, and return
        #       the best k with scores above zero, as new dicts with a float "score"
        ...
```

**Hidden tests:**

```python
import math

# shared by the tests below
def chunk(doc_id, text):
    return {"doc_id": doc_id, "section": "s", "text": text}
SMALL = [chunk("A", "rate limit rate limit rate limit"), chunk("B", "rate limit"),
         chunk("C", "priority tier opus"), chunk("D", "tier allowlist models"),
         chunk("E", "incident timeline notes"), chunk("F", "cache flush restart")]

# 1. rarity: the idf formula, over the chunks added
index = BM25Index()
index.add(SMALL)
assert isinstance(index.search("rate", 2), list), f"search should return a list; got {index.search('rate', 2)!r}"
top = index.search("opus", 1)[0]
assert top["doc_id"] == "C", top["doc_id"]
opus_idf = math.log((6 - 1 + 0.5) / (1 + 0.5))
average = (6 + 2 + 3 + 3 + 3 + 3) / 6
assert abs(top["score"] - opus_idf * 1 / (1.2 * (0.25 + 0.75 * 3 / average) + 1)) < 1e-9, \
    f"score should follow BM25 with k1=1.2, b=0.75; got {top['score']}"
assert isinstance(top["score"], float)

# 2. repeats saturate and length normalises: with b=0, A's three mentions win; with b=1, B's shorter text wins
no_length = BM25Index(b=0.0)
no_length.add(SMALL)
assert [r["doc_id"] for r in no_length.search("rate", 2)] == ["A", "B"], "with b=0, more mentions score higher"
full_length = BM25Index(b=1.0)
full_length.add(SMALL)
a, b = (next(r["score"] for r in full_length.search("rate", 2) if r["doc_id"] == d) for d in "AB")
assert abs(a - b) < 1e-9, "with b=1, three mentions in three times the length is worth the same as one"
huge_k1 = BM25Index(k1=1000.0, b=0.0)
huge_k1.add(SMALL)
a, b = (next(r["score"] for r in huge_k1.search("rate", 2) if r["doc_id"] == d) for d in "AB")
assert abs(a / b - 3) < 0.01, f"with a huge k1, repeats should count almost linearly; A/B was {a / b:.2f}"

# 3. each distinct question word counts once; no match means no result
assert index.search("rate rate rate", 2) == index.search("rate", 2), "repeating a word in the question shouldn't change scores"
assert index.search("kubernetes", 3) == [], "chunks sharing no words with the question are left out"

# 4. statistics cover every batch; results are new dicts; sources are required
batched = BM25Index()
batched.add(SMALL[:2])
batched.add(SMALL[2:])
assert [(r["doc_id"], round(r["score"], 9)) for r in batched.search("rate tier", 6)] == \
       [(r["doc_id"], round(r["score"], 9)) for r in index.search("rate tier", 6)], \
    "rarity and average length must describe every chunk added, not just the last batch"
assert "score" not in SMALL[0], "search added a score to a stored chunk; return new dicts"
try:
    BM25Index().add([{"doc_id": "X", "text": "no section"}])
except ValueError:
    pass
else:
    raise AssertionError("add should raise ValueError for a chunk without its source")

# 5. the real corpus, with the module's chunks
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
bm25 = BM25Index()
bm25.add(chunks)
overlap = KeywordIndex()
overlap.add(chunks)
bm25_ids, overlap_ids = answered_ids(bm25.search, queries), answered_ids(overlap.search, queries)
assert len(bm25_ids) == 25, f"expected 25 answered in the top 5, got {len(bm25_ids)}"
assert (sorted(bm25_ids - overlap_ids), sorted(overlap_ids - bm25_ids)) == (["q05", "q09"], []), \
    (sorted(bm25_ids - overlap_ids), sorted(overlap_ids - bm25_ids))

# 6. length normalisation, on Lesson 1's uneven heading sections
sections = [s for d in load_documents() for s in split_sections(d)]
answered_by_b = {}
for b in (0.0, 0.75):
    index = BM25Index(b=b)
    index.add(sections)
    answered_by_b[b] = len(answered_ids(index.search, queries))
assert answered_by_b == {0.0: 17, 0.75: 26}, answered_by_b
```

**Hint (shown on request):**

Keep the per-chunk counts in a list parallel to the chunks. After adding a
batch, `Counter(word for counts in self._counts for word in counts)` gives
the number of chunks containing each word, since iterating over a Counter
yields each word once. A separate `score(question, row)` method keeps
`search` short. `set(terms(question))` gives the distinct question terms.

**Reference solution:**

```python
import math
from collections import Counter

class BM25Index:
    """Chunks scored by BM25: rarity-weighted matches, saturating with repeats, normalised for length."""

    def __init__(self, k1: float = 1.2, b: float = 0.75):
        self.k1, self.b = k1, b
        self._chunks, self._counts = [], []
        self._idf, self._average_length = {}, 0.0

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict]) -> None:
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
            self._chunks.append(chunk)
            self._counts.append(Counter(terms(chunk["text"])))
        # rarity and average length describe the whole collection, so recompute them after every batch
        n = len(self._counts)
        containing = Counter(word for counts in self._counts for word in counts)
        self._idf = {word: math.log((n - df + 0.5) / (df + 0.5)) for word, df in containing.items()}
        self._average_length = sum(sum(c.values()) for c in self._counts) / n

    def score(self, question: str, row: int) -> float:
        counts = self._counts[row]
        length = sum(counts.values())
        norm = self.k1 * ((1 - self.b) + self.b * length / self._average_length)
        return sum(self._idf[word] * counts[word] / (norm + counts[word])
                   for word in set(terms(question)) if word in counts)

    def search(self, question: str, k: int = 3) -> list[dict]:
        scored = [(self.score(question, row), row) for row in range(len(self._chunks))]
        # sorting is stable, so equal scores keep the order the chunks were added in
        ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
        return [{**self._chunks[row], "score": float(score)} for score, row in ranked[:k]]
```

**Explanation:**

The idf and the average length describe the whole collection, which is why
`add` recomputes them over everything stored: test 4 adds the same chunks
in two batches and expects identical scores. Test 2 pins down what each
parameter does. With b = 0, three mentions beat one. With b = 1, three
mentions in three times the length are worth exactly one mention, because
the length adjustment cancels the count. With a very large k1, repeats
count almost in proportion. On the real corpus BM25 answers 25 questions in
the top five against word overlap's 23, gaining two and losing none. One of
the gains is "What does REG-1007 mean?", though not the way you might hope:
the error table still doesn't rank in the top five, and the question is
answered by the changelog's v2.3 entry at fourth place. Test 6 shows length
normalisation at work on Lesson 1's uneven heading sections, which run from
a line to thousands of tokens. With b = 0, BM25 answers 17 questions; with
b = 0.75, it answers 26.
