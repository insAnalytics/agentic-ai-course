# Module 5, Lesson 7 — Concept 1: The question as asked isn't always the best query

> **Note for the site build:**
> - **A one-line change to Lesson 6's shared code, needed from here on:** in
>   `CrossEncoderScores.__init__` (Lesson 6, concept 1, and every `lib.py`
>   that contains it), replace `self.timing = stored["timing"]` with
>   `self.timing = stored.get("timing")`, and add this comment on the line
>   above it: `# only the full scoring run was timed; files scored later may
>   have no timing`. Lesson 6's pages behave exactly as before; Lesson 7's
>   variant scores load through the same class.
> - **Lesson 7's shared setup:** the Lesson 6 comprehensive sandbox's
>   `lib.py` (with the change above), then the code in "The pipeline, and the
>   variants" below, then `rewrite_query` from "Rewriting with a model call".
>   numpy must be loaded.
> - **Data for this lesson:** everything Lesson 6 used, plus
>   `query-variants.json`, `embeddings/bge-small-en-v1.5/query-variants.json`
>   and `rerank/ms-marco-MiniLM-L6-v2/query-variants.json`.
> - **The first demo needs the fake client:** `REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`. Its replies are the stored, model-written rewrites.

---

## Search wants the words of the answer

A question is written for a person. It says "what", "why" and "I", refers
back to things said earlier, and describes the problem in the asker's words:
"wake someone up at night". Documentation is written in the documents'
words: "pages", "outside 08:00 to 20:00". Every search in this module
compares the two, and every lesson so far has found questions whose
wording, not their subject, kept the answer out of reach.

The previous lessons improved how the corpus is searched. This one improves
what is searched *for*: the query itself, before any search runs. The
simplest version is a **rewrite**: one model call that turns the question
into the kind of short, specific query a search engine handles well.

---

## The pipeline, and the variants

This lesson measures every change against the retrieval the module has
built: BM25 and search by meaning fused with RRF, and the top 30 reranked by
the cross-encoder. It's gathered into one class here, with loaders for the
query variants the lesson uses:

```python
from collections import defaultdict

DATA = Path("/data/rag")

def load_query_variants() -> dict:
    """The model-written rewrites, sub-queries and hypothetical documents, with the prompts that asked for them."""
    return json.loads((DATA / "query-variants.json").read_text())

def variant_vectors() -> dict[str, np.ndarray]:
    """Embeddings of the variants, keyed like "q15:rewrite", "q21:sub1" or "q09:hyde"."""
    stored = json.loads((EMBEDDINGS / "bge-small-en-v1.5" / "query-variants.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored["vectors"], stored["dim"])))

def rrf(rankings: list[list[dict]], k: int = 60) -> list[dict]:
    """Reciprocal Rank Fusion of several rankings, as in Lesson 5."""
    scores, found = defaultdict(float), {}
    for ranking in rankings:
        for rank, chunk in enumerate(ranking, 1):
            key = (chunk["doc_id"], chunk["chunk"])
            scores[key] += 1 / (k + rank)
            found.setdefault(key, chunk)
    return [found[key] for key in sorted(scores, key=scores.get, reverse=True)]

class ModulePipeline:
    """The module's retrieval so far: BM25 and search by meaning fused, then the top 30 reranked."""

    def __init__(self, chunks: list[dict]):
        self.bm25 = BM25Index()
        self.bm25.add(chunks)
        self.meaning = VectorIndex()
        self.meaning.add(chunks, vectors_for(chunks))

    def search(self, text: str, vector: np.ndarray, score, k: int = 5, depth: int = 30) -> list[dict]:
        """text feeds BM25, vector feeds search by meaning, and score(chunk) is the reranker's score."""
        candidates = rrf([self.bm25.search(text, 100), self.meaning.search(vector, 100)])[:depth]
        return sorted(candidates, key=score, reverse=True)[:k]
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

`ModulePipeline.search` takes the query in the two forms its first stage
needs, text for BM25 and a vector for search by meaning, plus a function
that gives the reranker's score for a chunk. That separation is what lets a
rewritten query flow through every stage.

The variants themselves, rewrites here and sub-queries and hypothetical
documents later, are model output. They were written for this course by
Claude, following the prompts stored with them, and the demos replay them
through the fake client as scripted replies. For questions about the
company's private documents, they were written without using those
documents, the way a model that has never seen them would have to. That's
a careful simulation, not the real thing, and the results should be read
with that in mind.

---

## Rewriting with a model call

The rewrite prompt asks for a standalone search query and puts firm limits
on it:

> Rewrite the user's latest question as a standalone search query for the company's internal documentation. Use only what the question and the conversation say: resolve references like 'it' or 'the second one', keep identifiers exactly, and don't add facts or guesses. Reply with the query only.

The limits matter as much as the request. "Keep identifiers exactly"
protects the codes keyword search depends on. "Don't add facts or guesses"
stops the model from answering the question inside the query, with details
it may have made up.

```python
def rewrite_query(client, prompt: str, question: str, history: list[dict] = ()) -> str:
    """Ask the model for a standalone search query, given the question and any conversation before it."""
    conversation = "\n".join(f"{turn['role']}: {turn['content']}" for turn in history) or "(none)"
    request = f"{prompt}\n\nConversation so far:\n{conversation}\n\nLatest question: {question}"
    response = client.create([{"role": "user", "content": request}])
    return "".join(block.text for block in response.content if block.type == "text").strip()
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

```python
variants = load_query_variants()
queries = {q["id"]: q for q in load_queries()["main"]}
examples = ["q15", "q08", "q11"]
# the fake client replays the model-written rewrites, one per call
client = FakeLLMClient([[TextBlock(variants["rewrites"][query_id])] for query_id in examples])

for query_id in examples:
    rewritten = rewrite_query(client, variants["prompts"]["rewrite"], queries[query_id]["query"])
    print(f"{queries[query_id]['query']:<46} -> {rewritten}")
```
```
What changed in v2.4?                          -> registry v2.4 changes
Which alerts wake someone up at night?         -> which alerts page the on-call engineer at night
What happened in INC-2093?                     -> INC-2093 incident summary
```
*(runs live, shows output — read-only demo snippet, not graded. The rewrites are model-written and replayed as scripted replies.)*

---

## Measured through the whole pipeline

Here is every labelled question, searched as asked and searched as
rewritten, through the full pipeline:

```python
from collections import Counter

queries = [q for q in load_queries()["main"] if q["evidence"]]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
pipeline = ModulePipeline(chunks)
variants, vectors, question_vectors = load_query_variants(), variant_vectors(), query_vectors()
question_scores, variant_scores = CrossEncoderScores(), CrossEncoderScores(chunking="query-variants")

def as_asked(query: dict) -> list[dict]:
    return pipeline.search(query["query"], question_vectors[query["id"]],
                           lambda c: question_scores.score(query["id"], c))

def rewritten(query: dict) -> list[dict]:
    key = f"{query['id']}:rewrite"
    return pipeline.search(variants["rewrites"][query["id"]], vectors[key], lambda c: variant_scores.score(key, c))

answered = {name: {q["id"] for q in queries if answerable(search(q), q)}
            for name, search in [("as asked", as_asked), ("rewritten", rewritten)]}
print(f"answered in the top 5: {len(answered['as asked'])} as asked, {len(answered['rewritten'])} rewritten")
gained = answered["rewritten"] - answered["as asked"]
lost = answered["as asked"] - answered["rewritten"]
print(f"gained {sorted(gained)}, lost {sorted(lost)}, sign test {sign_test(len(gained), len(lost)):.2f}")
types = {q["id"]: q["type"] for q in queries}
print("gains by type:", dict(Counter(types[i] for i in sorted(gained))),
      " losses by type:", dict(Counter(types[i] for i in sorted(lost))))
```
```
answered in the top 5: 32 as asked, 36 rewritten
gained ['q08', 'q15', 'q25', 'q26', 'q44'], lost ['q11'], sign test 0.22
gains by type: {'paraphrase': 1, 'identifier': 1, 'conversational': 2, 'public_docs': 1}  losses by type: {'identifier': 1}
```
*(runs live, shows output — read-only demo snippet, not graded. Allow several seconds.)*

Rewriting took the pipeline from 32 answered questions to 36, gaining five
and losing one. The gains are the kind rewriting is for:

- **Plain wording.** "Which alerts page the on-call engineer at night"
  uses the documents' word, "page", where the question said "wake someone
  up".
- **Missing context made explicit.** "What changed in v2.4?" became
  "registry v2.4 changes", naming what v2.4 is a version of.
- **Two follow-up questions,** which the next concept looks at on their own.

The loss is a warning. "What happened in INC-2093?" became "INC-2093
incident summary", and the added word "incident" pulled in Alertmanager's
configuration for an integration called incident.io, which pushed the real
answer out of the top five. A rewrite changes the words the search sees,
and a changed word can mislead as easily as it can help.

The sign test is 0.22: five to one on 43 questions is encouraging, not
proof. As with every change in this module, the pattern behind the numbers
matters as much as the numbers.

---

## What a rewrite costs

A rewrite is one more model call per question, and it runs *before* the
search, so its time is added to every question's wait rather than
overlapping with anything. It's small, a short prompt and a short reply,
but it's never free. Two design choices soften its risks:

- **Keep the original too.** Search with both the question and its
  rewrite, and fuse the results with RRF, so a rewrite that drifts can't
  lose what the original would have found.
- **Rewrite only when needed.** Follow-up questions nearly always need it;
  a question that already names the exact code may not.

---

## Quiz cards

> **Q1.** Why can a rewritten query retrieve better than the question as
> asked?
> - It uses the kind of words documentation uses, not the asker's conversational ones ✅
> - It contains the answer, so the search can match it directly
> - Search engines reject questions that contain "what" or "why"
> - It's shorter, and shorter queries always retrieve better
>
> *Explanation: questions and documents are written differently.
> "Page the on-call engineer" matches the documents' vocabulary where
> "wake someone up" doesn't. The prompt forbids adding facts, so the
> rewrite describes what to find rather than answering.*

> **Q2.** Why does the rewrite prompt say "don't add facts or guesses"?
> - A model that answers inside the query can introduce details it made up, steering the search wrongly ✅
> - Search engines can't index facts, only keywords
> - Facts make the query too long for the embedding model
> - The reranker ignores any query that contains a number
>
> *Explanation: the rewrite's job is to describe what to look for. If
> it guesses the answer, a wrong guess becomes part of the query and pulls
> the search towards passages that match the guess.*

> **Q3.** "What happened in INC-2093?" was answered as asked but not after
> rewriting. What went wrong?
> - The rewrite added "incident", which matched pages about an integration named incident.io ✅
> - The rewrite dropped the identifier INC-2093
> - The reranker can't score rewritten queries
> - Rewritten queries skip BM25 and use search by meaning only
>
> *Explanation: the identifier was kept, but a new word came with it, and
> in this corpus "incident" matches Alertmanager's incident.io settings.
> Every word a rewrite adds is a word the search acts on.*

> **Q4.** How can a system use rewriting without risking what the original
> question would have found?
> - Search with both the question and the rewrite, and fuse the results ✅
> - Rewrite the question several times until the results stop changing
> - Use the rewrite only for the reranker, and the question for the first stage
> - Ask the model whether its rewrite is better than the question
>
> *Explanation: fusing both searches keeps the original's results in
> play, so a drifting rewrite can add answers without taking any away. It
> costs a second search, which is cheap next to the model call.*
