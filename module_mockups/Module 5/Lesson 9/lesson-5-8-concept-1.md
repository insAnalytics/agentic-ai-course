# Module 5, Lesson 8 — Concept 1: Chunks that don't say what they're about

> **Note for the site build:**
> - **Lesson 8's shared setup:** the Lesson 7 comprehensive sandbox's
>   `lib.py`, unchanged, then `VersionedPipeline` and `with_header`, exactly
>   as in the first two code blocks below. numpy must be loaded.
> - **Data for this lesson:** everything Lesson 7 used, plus
>   `chunk-contexts.json`, and the `structured-200-headers` and
>   `structured-200-contextual` files under both `embeddings/bge-small-en-v1.5/`
>   and `rerank/ms-marco-MiniLM-L6-v2/`. This concept uses the headers files.
> - The last demo builds two full pipelines; allow several seconds.

---

## The subject is somewhere else

Lesson 3 cut documents into chunks along their structure, and warned that a
chunk can lose what makes it findable: its subject is often stated once, in
the document's title or a heading above it, and never repeated. Every lesson
since has run into this. Here's the clearest case in the corpus:

```python
for document in load_documents():
    if document["title"].startswith("Incident INC-"):
        incident = document["title"].split(":")[0].removeprefix("Incident ")
        chunks = structured_chunks(document, 200)
        mentions = sum(incident in c["text"] for c in chunks)
        print(f"{incident}: named in {mentions} of its report's {len(chunks)} chunks")
```
```
INC-2041: named in 0 of its report's 4 chunks
INC-2067: named in 0 of its report's 4 chunks
INC-2093: named in 0 of its report's 4 chunks
```
*(runs live, shows output — read-only demo snippet, not graded)*

An incident report names its incident in its title, and nowhere else. So a
question about "INC-2093" can't match the summary, the timeline or the root
cause by that id, because none of them contain it. The same pattern is
everywhere once you look: a runbook step that never says which runbook, like
the key-rotation step that never says "registry", or a changelog entry that
says "v2.4" but not what v2.4 is a version of.

---

## The free fix: put the path back

Every chunk already carries the missing words. Lesson 3 gave each one a
section path, the document title followed by every heading above it, and
stored it as metadata. Metadata isn't searched. Prepending the path to the
text that gets embedded and indexed is:

```python
def with_header(chunk: dict) -> dict:
    """The chunk with its section path, from the document title down, at the top of its text."""
    return {**chunk, "text": f"{chunk['section']}\n\n{chunk['text']}"}
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

```python
summary = next(c for d in load_documents() if d["doc_id"] == "D11" for c in structured_chunks(d, 200))
print(with_header(summary)["text"][:260])
```
```
Incident INC-2093: registry outage during database failover > Summary

## Summary

On 2026-08-27, registry-api was unavailable for 42 minutes while registry-db failed over to its standby. Agents that look things up in the registry couldn't finish their tasks, 
```
*(runs live, shows output — read-only demo snippet, not graded)*

The chunk text is unchanged; it just starts with where it came from. No
model is involved, so this costs nothing to compute. The header does have to
be applied before indexing, which means new vectors: a changed text is a
different text to the embedding model. They were computed offline, like
every other vector in this module, and this class runs the module's pipeline
over any version of the chunks that has them:

```python
class VersionedPipeline(ModulePipeline):
    """The module's pipeline over another version of the chunks, using that version's stored vectors."""

    def __init__(self, chunks: list[dict], chunking: str):
        self.bm25 = BM25Index()
        self.bm25.add(chunks)
        self.meaning = VectorIndex()
        self.meaning.add(chunks, vectors_for(chunks, chunking=chunking))
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

---

## Measured through the pipeline

```python
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
versions = {"plain": VersionedPipeline(chunks, "structured-200"),
            "with headers": VersionedPipeline([with_header(c) for c in chunks], "structured-200-headers")}
scores = {"plain": CrossEncoderScores(), "with headers": CrossEncoderScores(chunking="structured-200-headers")}
question_vectors = query_vectors()

answered = {}
for name, pipeline in versions.items():
    results = {q["id"]: pipeline.search(q["query"], question_vectors[q["id"]],
                                        lambda c: scores[name].score(q["id"], c)) for q in queries}
    answered[name] = {k: {q["id"] for q in queries if answerable(results[q["id"]][:k], q)} for k in (1, 5)}
    print(f"{name:<13} answered at rank 1: {len(answered[name][1])}, in the top 5: {len(answered[name][5])}")
gained = answered["with headers"][5] - answered["plain"][5]
lost = answered["plain"][5] - answered["with headers"][5]
print(f"top 5: gained {sorted(gained)}, lost {sorted(lost)}, sign test {sign_test(len(gained), len(lost)):.2f}")
extra = sum(count_tokens(with_header(c)["text"]) - count_tokens(c["text"]) for c in chunks) / len(chunks)
print(f"a header adds {extra:.0f} tokens to the average chunk")
```
```
plain         answered at rank 1: 22, in the top 5: 32
with headers  answered at rank 1: 23, in the top 5: 34
top 5: gained ['q15', 'q27', 'q28'], lost ['q23'], sign test 0.62
a header adds 15 tokens to the average chunk
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three questions gained and one lost, and each one has a clear cause:

- **"What changed in v2.4?"** Every changelog chunk now starts
  "Registry changelog > v2.4 — ...", so the right entry ranks first instead of
  Prometheus's migration notes.
- **Two multi-hop questions** name an incident: "the agent affected by
  INC-2067", "the service that went down in INC-2093". Every chunk of those
  reports now carries the id, so the report's summary comes back alongside the
  other half of the answer.
- **The loss** is the header's cost showing. "When is claude-legacy switched
  off, and which agents still use it?" needs the migration runbook's table of
  affected agents. Every chunk of that runbook now starts with a title
  containing "claude-legacy", so all its steps match equally well and one of
  them crowded the table out.

A header repeats the same words across every chunk of a document. That's
what makes a document findable by its subject, and also what makes its
chunks harder to tell apart from each other. On this corpus the trade was
three to one, a sign test of 0.62: helpful, cheap, and not conclusive on its
own. Each header also adds about 15 tokens to every chunk sent to the model.

---

## Quiz cards

> **Q1.** Why couldn't a search find INC-2093's report by its id?
> - The id appears only in the report's title, and none of its chunks contain it ✅
> - Incident ids are removed as stopwords before indexing
> - The report is restricted, so its chunks aren't indexed
> - Identifiers can only be matched by search by meaning
>
> *Explanation: chunking along headings keeps each section's text, but
> the document title sits above all of them. Nothing in a chunk's text says
> which incident it describes.*

> **Q2.** The section path was already stored on every chunk. Why didn't
> that help search?
> - It was metadata, and searches only score the chunk's text ✅
> - The path is too long to be stored with the chunk
> - Paths are only used for access control
> - The embedding model ignores headings
>
> *Explanation: metadata is for filtering and citing. BM25 counts words
> in the text and the embedding model reads the text. Prepending the path
> moves it to where the searches look.*

> **Q3.** Why does adding headers require new vectors?
> - The embedded text changed, so its vector changes too ✅
> - Headers can only be searched with BM25
> - The old vectors are deleted when metadata changes
> - Headers use a different embedding model
>
> *Explanation: a vector represents one exact text. Any change to what's
> embedded, even a line at the top, means embedding again, and the index
> has to be rebuilt with the new vectors.*

> **Q4.** Headers lost the question about which agents still use
> claude-legacy. What does that show?
> - A header repeated across a document's chunks makes them harder to tell apart ✅
> - Headers hide the chunk's own text from the search
> - The runbook's title was wrong, so the header misled the search
> - Headers only help questions that contain identifiers
>
> *Explanation: every runbook chunk now contains "claude-legacy", so they
> all match that part of the question equally. The chunk that answers the
> other part, the table of agents, lost its edge. Headers help find a
> document; they don't help choose within it.*
