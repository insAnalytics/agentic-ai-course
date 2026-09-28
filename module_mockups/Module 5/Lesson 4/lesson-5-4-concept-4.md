# Module 5, Lesson 4 — Concept 4: What a vector store adds

> **Note for the site build:**
> - No new shared code. **Data:** bge-small's `structured-200.json` and
>   `queries.json`.
> - The persistence demo writes to `/tmp/vector-store` in Pyodide's
>   in-memory filesystem.
> - **The FAISS example is illustrative only:** FAISS isn't available in
>   Pyodide, so render it as a static code block with its output, with no
>   Run button. It was run locally with `faiss-cpu` 1.15.1 on the same
>   vectors.

---

## A matrix in memory isn't a database

The search so far is a numpy matrix and a list of chunks, rebuilt every
time the page runs. That's enough to learn how search by meaning works, and
it leaves out three things any real system needs:

- **Keeping the index.** Embedding a corpus is the expensive half. It
  should happen once, and the result should survive a restart.
- **Filtering.** A search usually has conditions: only documents this user
  may read, only this team's runbooks, only pages from this year.
- **Scale.** Scoring every vector is fine for 2,000 chunks and too slow for
  hundreds of millions.

A **vector store**, whether a library like FAISS or a database built around
the same ideas, provides these. Each is worth understanding before using
one, because each has a trap.

---

## Keeping the index

Saving an index means saving what indexing produced: the vectors, and the
chunks with their metadata. Nothing else about the index needs keeping.

```python
import json

chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
vectors = vectors_for(chunks)

# save: the vectors as a numpy file, the chunks and their metadata as JSON
store = Path("/tmp/vector-store")
store.mkdir(exist_ok=True)
np.save(store / "vectors.npy", vectors)
(store / "chunks.json").write_text(json.dumps(chunks))

# load, as a later process would, without embedding anything again
index = VectorIndex()
index.add(json.loads((store / "chunks.json").read_text()), np.load(store / "vectors.npy"))
top = index.search(query_vectors()["q01"], 1)[0]
print(f"{len(index):,} chunks reloaded; top result for q01: {top['doc_id']} | {top['section']}")
print(f"on disk: {(store / 'vectors.npy').stat().st_size / 1e6:.1f} MB of vectors, "
      f"{(store / 'chunks.json').stat().st_size / 1e6:.1f} MB of chunks")
```
```
1,968 chunks reloaded; top result for q01: D14 | Agent owners' FAQ > Can my agent use the biggest model?
on disk: 3.0 MB of vectors, 1.6 MB of chunks
```
*(runs live, shows output — read-only demo snippet, not graded)*

The reloaded index answers the same way without a single model call.
What a real store adds beyond this is the hard part of persistence: adding,
changing and deleting chunks as documents change, without rebuilding
everything. Keeping an index in step with its documents is Module 10's
subject.

---

## Filtering, and filtering in the wrong place

Here's the finance-only question from the labelled set, asked by someone in
the `all-staff` group, who may not read the finance page. The filter can go
in two places:

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
matrix = vectors_for(chunks)
question = next(q for q in queries if q["id"] == "q41")
query = query_vectors()["q41"]
reader = {"all-staff"}

def allowed(chunk: dict) -> bool:
    return bool(reader & set(chunk["access"]))

scores = matrix @ query
ranked = np.argsort(-scores, kind="stable")

# filter after taking the top 5
after = [chunks[row] for row in ranked[:5] if allowed(chunks[row])]
# filter before ranking: only permitted chunks compete for the 5 places
before = [chunks[row] for row in ranked if allowed(chunks[row])][:5]

print(question["query"])
print(f"top 5 overall:      {[chunks[row]['doc_id'] for row in ranked[:5]]}")
print(f"filtered after:     {[c['doc_id'] for c in after]}  ({len(after)} results)")
print(f"filtered before:    {[c['doc_id'] for c in before]}  ({len(before)} results)")
```
```
What is billing_agent's monthly spending cap?
top 5 overall:      ['D13', 'D13', 'D14', 'D09', 'D09']
filtered after:     ['D14', 'D09', 'D09']  (3 results)
filtered before:    ['D14', 'D09', 'D09', 'D01', 'D01']  (5 results)
```
*(runs live, shows output — read-only demo snippet, not graded)*

Filtering **after** taking the top five throws away the two finance chunks
and returns only three results. The reader gets less context, and never
learns there was room for more. With a stricter filter, the list can come
back empty even when plenty of permitted chunks exist. Filtering **before**
ranking lets only permitted chunks compete, so all five places go to text
this reader may see.

Vector stores offer filters for exactly this, applied during the search.
Two principles follow, and Lesson 12 builds on both:

- **The filter runs before the ranking picks its results,** not after.
- **The filter is code.** The finance chunks were never candidates, so no
  instruction to the model, and no mistake by it, can reveal them.

---

## Why scoring everything stops scaling

Exact search scores every vector: 1,968 dot products of 384 numbers per
question, here. At ten million chunks that's nearly four billion
multiplications per question, for one user. **Approximate nearest-neighbour
(ANN)** search skips most of that work by accepting that it will sometimes
miss one of the true top results.

The simplest version groups the vectors in advance. At indexing time,
cluster the chunks around a set of centres. At query time, find the few
centres nearest the question, and score only the chunks in those clusters:

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
matrix = vectors_for(chunks)
vectors = query_vectors()

def cluster(matrix: np.ndarray, count: int, rounds: int = 10, seed: int = 0) -> tuple[np.ndarray, np.ndarray]:
    """k-means by cosine: returns each cluster's centre and each row's cluster."""
    centres = matrix[np.random.default_rng(seed).choice(len(matrix), count, replace=False)]
    for _ in range(rounds):
        members = np.argmax(matrix @ centres.T, axis=1)
        for c in range(count):
            if (members == c).any():
                centre = matrix[members == c].mean(axis=0)
                centres[c] = centre / np.linalg.norm(centre)
    return centres, np.argmax(matrix @ centres.T, axis=1)

# indexing: group the chunks once, around 32 centres
centres, members = cluster(matrix, 32)

def approximate_top(query: np.ndarray, probes: int, k: int = 5) -> tuple[list[int], int]:
    """Score only the chunks in the `probes` clusters whose centres are nearest the query."""
    nearest = np.argsort(-(centres @ query))[:probes]
    candidates = np.flatnonzero(np.isin(members, nearest))
    scores = matrix[candidates] @ query
    return list(candidates[np.argsort(-scores, kind="stable")[:k]]), len(candidates)

print(f"{'clusters searched':>18}{'chunks scored':>15}{'exact top 5 found':>19}")
for probes in [1, 2, 4, 8, 32]:
    found, scored = 0, 0
    for q in queries:
        exact = set(np.argsort(-(matrix @ vectors[q["id"]]), kind="stable")[:5])
        approx, count = approximate_top(vectors[q["id"]], probes)
        found += len(exact & set(approx))
        scored += count
    print(f"{probes:>18}{scored / len(queries) / len(chunks):>15.0%}{found / (5 * len(queries)):>19.0%}")
```
```
 clusters searched  chunks scored  exact top 5 found
                 1             2%                62%
                 2             4%                80%
                 4             9%                88%
                 8            22%                96%
                32           100%               100%
```
*(runs live, shows output — read-only demo snippet, not graded)*

Searching 4 of the 32 clusters scores 9% of the chunks and still finds 88%
of the exact top five. Searching 8 scores 22% and finds 96%. The trade is
tunable, and it's the one every ANN method offers: how much work to do
against how much of the exact answer to find. Any of the missed results that was a
relevant chunk is recall lost.

---

## HNSW: searching a graph

The method most vector stores use by default is **HNSW** (hierarchical
navigable small world graphs, Malkov and Yashunin, 2016). Instead of
clusters, it links each vector to a few of its nearest neighbours, forming
a graph, and builds several layers of these graphs over smaller and smaller
subsets of the vectors.

A search starts in the top layer, where only a few vectors live and each
link covers a long distance. It moves greedily to whichever neighbour is
closer to the question, and when it can't get closer, it drops a layer, to
a denser graph with shorter links, and continues. By the bottom layer it's
in the right neighbourhood, and it keeps a short list of the best
candidates it has seen. Starting from the top is what lets the search time
grow roughly with the logarithm of the number of vectors, rather than in
proportion to it.

Here's HNSW on this lesson's vectors, using FAISS:

```python
import faiss

queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
matrix = vectors_for(chunks)
vectors = query_vectors()
query_matrix = np.stack([vectors[q["id"]] for q in queries])

# exact search: every vector scored, as in this lesson
exact = faiss.IndexFlatIP(384)
exact.add(matrix)
_, exact_top = exact.search(query_matrix, 5)

# HNSW: a layered graph, each vector linked to 32 neighbours
hnsw = faiss.IndexHNSWFlat(384, 32, faiss.METRIC_INNER_PRODUCT)
hnsw.add(matrix)
for breadth in [8, 16, 64]:
    # how many candidates the search keeps in play while it walks the graph
    hnsw.hnsw.efSearch = breadth
    _, approx_top = hnsw.search(query_matrix, 5)
    found = sum(len(set(e) & set(a)) for e, a in zip(exact_top, approx_top))
    print(f"efSearch {breadth:>2}: {found / exact_top.size:.0%} of the exact top 5 found")
```
```
efSearch  8: 96% of the exact top 5 found
efSearch 16: 99% of the exact top 5 found
efSearch 64: 100% of the exact top 5 found
```
*(illustrative — FAISS can't run in this page's sandbox. This was run locally with faiss-cpu 1.15.1 on the same vectors, and the output is real.)*

Keeping 16 candidates in play finds 99% of the exact top five. `efSearch` is
the knob: a wider search is slower and finds more.

---

## When a plain matrix is enough

For this corpus, none of that is needed. 1,968 chunks is a few million
multiplications per question, which numpy does in well under a second, and
the result is exact. That holds well into the tens of thousands of chunks
on an ordinary machine.

So the order of decisions is: start with exact search and a matrix, measure
retrieval quality with it, and add approximate search when speed at your
real size demands it. Then measure again, because the recall it trades away
is recall your labelled questions can see.

---

## Quiz cards

> **Q1.** A search takes the top 5 results and then removes the ones the
> user may not read, leaving 3. What's wrong?
> - The filter ran after ranking, so permitted chunks never got the freed places ✅
> - Nothing: removing forbidden results is exactly what filtering is for
> - The model should have been told not to use the forbidden chunks instead
> - The index should have held a separate copy of the corpus for each user
>
> *Explanation: filtering after taking the top k leaves gaps, and with a
> strict filter can return nothing. Filtering before ranking lets only
> permitted chunks compete. And the filter belongs in code; instructions to
> a model are not an access control.*

> **Q2.** What does approximate nearest-neighbour search trade?
> - Some of the exact top results, in exchange for scoring far fewer vectors ✅
> - Storage space, since it keeps several copies of every vector
> - Embedding quality, since it uses a smaller model for queries
> - Filtering, since approximate indexes can't hold metadata
>
> *Explanation: in the clustering demo, scoring 9% of the chunks found
> 88% of the exact top five. More work finds more. The misses are real
> retrieval losses, so they're worth measuring.*

> **Q3.** Why does HNSW start its search in the top layer?
> - Its few, long links reach the right region quickly before denser layers refine it ✅
> - The top layer holds the most important chunks, chosen at indexing
> - The top layer is the only one that stores full vectors
> - Starting at the top guarantees the exact nearest neighbour is found
>
> *Explanation: each layer is a graph over a smaller subset, so the top
> layer's links span long distances. Greedy steps there cover ground fast,
> and each lower layer narrows in. It's approximate: a wider search
> (efSearch) finds more of the true top results.*

> **Q4.** For this module's corpus of about 2,000 chunks, what's the right
> index?
> - A plain matrix with exact search, since it's fast and loses nothing ✅
> - HNSW, since it's the default in vector databases
> - Clustering with one probe, since it scores only 2% of the chunks
> - A separate vector store per document, for faster filtering
>
> *Explanation: exact search over a few thousand vectors is instant and
> has perfect recall. Approximate search earns its place when scale makes
> exact search too slow, and even then its lost recall should be measured.*
