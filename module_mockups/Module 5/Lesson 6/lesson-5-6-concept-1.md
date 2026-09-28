# Module 5, Lesson 6 — Concept 1: Two stages

> **Note for the site build:**
> - **Lesson 6's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 5 comprehensive sandbox's `lib.py`, unchanged, followed by
>   `RERANK` and `CrossEncoderScores`, exactly as in "Scores computed ahead
>   of time" below. numpy must be loaded.
> - **Data for this lesson:** the documents, labels, bge-small's
>   `structured-200.json` and `queries.json`, and
>   `rerank/ms-marco-MiniLM-L6-v2/structured-200.json` (about 640 KB).
> - The two demos are independent.

---

## Precise, but too slow for everything

Every search so far has worked the same way: represent each chunk ahead of
time, as a vector or a set of word counts, then compare the question with
those stored representations. That's what makes it fast. It's also what
limits it. A chunk's vector was made without knowing the question, so it
has to summarise everything the chunk might be asked about in 384 numbers.

A **reranker** works differently. It reads the question and a chunk
*together*, and outputs one number: how well this chunk answers this
question. The next concept explains why reading them together is more
accurate. This one is about what it costs: nothing about a chunk can be
computed in advance, because the score depends on the question. Every
question needs one model run for every chunk it's compared with.

The way out is to split the work in two:

- **Stage one:** a cheap search over every chunk, keyword or meaning or
  both, returns a few dozen candidates.
- **Stage two:** the reranker scores only those candidates, and the best of
  them go to the model.

The first stage needs to be good at *finding*: if the answer isn't among its
candidates, the second stage can't recover it. The second stage needs to be
good at *ordering*: putting the answer at the very top.

---

## Scores computed ahead of time

This module's reranker is `ms-marco-MiniLM-L6-v2`, a small cross-encoder
of about 23 million parameters, trained to rank passages for search
questions. As with the embeddings, it can't run inside this page, so its
scores were computed offline for every labelled question against every
chunk. They're looked up by question id and by the same text hash as the
vectors:

```python
RERANK = Path("/data/rag/rerank")

class CrossEncoderScores:
    """Precomputed cross-encoder scores for every labelled question against every chunk."""

    def __init__(self, model: str = "ms-marco-MiniLM-L6-v2", chunking: str = "structured-200"):
        stored = json.loads((RERANK / model / f"{chunking}.json").read_text())
        self.timing = stored["timing"]
        shape = (len(stored["query_keys"]), len(stored["chunk_keys"]))
        self._matrix = np.frombuffer(base64.b64decode(stored["scores"]), dtype="<f4").reshape(shape)
        self._rows = {query_id: row for row, query_id in enumerate(stored["query_keys"])}
        # identical chunk texts share a key and a score, so any one of their columns will do
        self._columns = {key: column for column, key in enumerate(stored["chunk_keys"])}

    def score(self, query_id: str, chunk: dict) -> float:
        """The cross-encoder's score for this question and chunk, read together: higher is more relevant."""
        return float(self._matrix[self._rows[query_id], self._columns[text_key(chunk["text"])]])
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

One consequence to keep in mind: because every pair was scored, the lesson
can rerank any first stage's candidates with real scores. In a live system
you'd only ever score the candidates, for the reason the next section
shows.

---

## What reading together costs

The offline run also timed itself:

```python
timing = CrossEncoderScores().timing
per_pair = timing["seconds_per_pair"]
print(f"measured: {per_pair * 1000:.2f} ms per question-chunk pair; "
      f"30 candidates for one question took {timing['seconds_for_30_candidates'] * 1000:.0f} ms")
for label, pairs in [("the top 30 candidates", 30), ("this whole corpus", 1_968), ("a corpus of a million chunks", 1_000_000)]:
    seconds = pairs * per_pair
    print(f"  scoring {label:<30} {pairs:>9,} pairs  ~{seconds:,.1f} s per question")
```
```
measured: 3.55 ms per question-chunk pair; 30 candidates for one question took 97 ms
  scoring the top 30 candidates                 30 pairs  ~0.1 s per question
  scoring this whole corpus                  1,968 pairs  ~7.0 s per question
  scoring a corpus of a million chunks   1,000,000 pairs  ~3,552.6 s per question
```
*(runs live, shows output — read-only demo snippet, not graded. The timings were measured on a laptop GPU, an RTX 3070 Ti, scoring one question at a time in batches of 64. A laptop CPU is several times slower; a data-centre GPU is faster.)*

Thirty candidates take about a tenth of a second. Scoring every chunk of
this small corpus would take seven seconds per question, and a corpus of a
million chunks nearly an hour, for every question. Search by meaning, by
comparison, scores all 1,968 chunks with one matrix product. That's why a
reranker is only ever a second stage: its precision is affordable on a few
candidates and nowhere else.

---

## Two stages on one question

Here's "What does REG-1007 mean?", the question that has troubled every
search in this module. Search by meaning takes the first stage and returns
30 candidates; the reranker reorders them. An asterisk marks a chunk that
answers the question:

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
meaning = meaning_search(chunks, queries)
cross_encoder = CrossEncoderScores()
question = next(q for q in queries if q["id"] == "q09")

# stage one: cheap, over every chunk
candidates = meaning(question["query"], 30)
# stage two: expensive, over the 30 candidates only
reranked = sorted(candidates, key=lambda c: cross_encoder.score(question["id"], c), reverse=True)

print(question["query"])
for label, results in [("search by meaning, top 5", candidates[:5]), ("after reranking its top 30", reranked[:5])]:
    print(f"  {label}:")
    for chunk in results:
        marker = "*" if is_relevant_to_query(chunk, question) else " "
        print(f"   {marker} {chunk['doc_id']} | {chunk['section'].split(' > ')[-1]}")
```
```
What does REG-1007 mean?
  search by meaning, top 5:
     D02 | Limits and availability
     D05 | Step 4: Check for rate limiting
   * D03 | v2.3 — 2026-03-10
     D15 | Registry key errors
     D02 | Authentication errors
  after reranking its top 30:
   * D01 | Errors
   * D02 | Request errors
   * D03 | v2.3 — 2026-03-10
   * D07 | Step 1: Check the target is allowed
     D05 | Step 4: Check for rate limiting
```
*(runs live, shows output — read-only demo snippet, not graded)*

Search by meaning found one answering chunk in its top five, in third
place. The same 30 candidates, reordered by the reranker, put four answering
chunks in the top five, with the API reference's error example first and
the error-code table second. The first stage had found them all within its
thirty; it just hadn't been able to tell them apart from pages about rate
limits and key errors, which look similar as whole vectors. Whether that
holds across all the questions is the subject of the third concept in this
lesson.

---

## Quiz cards

> **Q1.** Why can't a cross-encoder's work on a chunk be done in advance,
> the way an embedding can?
> - Its score depends on the question, so every question needs a new run per chunk ✅
> - Its outputs are too large to store for every chunk
> - Cross-encoders can only read chunks shorter than a question
> - Its weights change after every question it scores
>
> *Explanation: an embedding describes a chunk on its own, so it can be
> computed once and reused. A cross-encoder scores a question and a chunk
> as a pair, and there's nothing to reuse until the question arrives.*

> **Q2.** In a two-stage search, what does each stage need to be good at?
> - The first at finding the answer somewhere in its candidates; the second at putting it first ✅
> - The first at putting the answer first; the second at finding more candidates
> - Both at the same thing, since the second stage repeats the first
> - The first at speed only; the second at speed only
>
> *Explanation: the reranker can only reorder what it's given, so an answer
> the first stage missed is gone. The first stage's job is coverage; the
> reranker's job is order.*

> **Q3.** At the measured 3.55 ms per pair, why isn't the reranker used
> to search the whole corpus directly?
> - Every question would cost a model run per chunk: seconds here, hours at scale ✅
> - The reranker can't read more than 30 chunks in total
> - The reranker's scores are only valid within one first stage's results
> - The measured time only applies to the first 30 chunks
>
> *Explanation: 1,968 pairs is about seven seconds per question here, and
> a million chunks nearly an hour. Thirty candidates is a tenth of a
> second. The cost grows with every chunk scored, so it's spent only on
> candidates.*

> **Q4.** Search by meaning had all four answering chunks for REG-1007
> within its top 30, but only one in its top 5. What does that show?
> - It found the answers but couldn't order them well, which is the reranker's job ✅
> - Its top 30 is where its real ranking starts, so the top 5 should be ignored
> - The reranker invented the extra answers from its training
> - The four chunks were added to its candidates by the reranker
>
> *Explanation: coverage at depth was fine; ordering at the top wasn't.
> Chunks about rate limits and key errors looked similar as whole vectors.
> Reading the question with each chunk separated them.*
