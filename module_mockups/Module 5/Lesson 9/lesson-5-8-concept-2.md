# Module 5, Lesson 8 — Concept 2: Contextual retrieval

> **Note for the site build:**
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `with_context` and `situate_chunk`, exactly as in the
>   first two code blocks below.
> - The first demo needs the fake client (`REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`); its reply is the stored, model-written context.
> - The second demo builds three full pipelines; allow ten seconds or so.

---

## A context written for each chunk

A header says where a chunk sits. It doesn't say what the chunk is *about*,
and it says the same thing for every chunk of a document, which is why it
couldn't tell the claude-legacy runbook's steps apart. Anthropic's
**contextual retrieval** (2024) writes something specific for every chunk
instead: a model reads the whole document and the chunk, and writes a short
context that situates the chunk within the document. That context is
prepended to the chunk before it's embedded and before the BM25 index is
built. Their prompt, which the stored contexts followed:

> <document>
> {document}
> </document>
> Here is the chunk we want to situate within the whole document
> <chunk>
> {chunk}
> </chunk>
> Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.

On their datasets, contextual embeddings reduced the share of questions whose
relevant chunk wasn't retrieved in the top 20 by 35%, adding contextual BM25
took the reduction to 49%, and adding reranking as well took it to 67%.
Those are Anthropic's reported results on their data; what follows is this
corpus.

```python
def with_context(chunk: dict, contexts: dict[str, str]) -> dict:
    """The chunk with its model-written context at the top, if it has one; otherwise with its header."""
    context = contexts.get(f"{chunk['doc_id']}:{chunk['chunk']}")
    if context is None:
        return with_header(chunk)
    return {**chunk, "text": f"{context}\n\n{chunk['text']}"}
```

```python
def situate_chunk(client, prompt: str, document: dict, chunk: dict) -> str:
    """Ask the model for a short context placing this chunk within its whole document."""
    request = prompt.format(document=document["text"], chunk=chunk["text"])
    response = client.create([{"role": "user", "content": request}])
    return "".join(block.text for block in response.content if block.type == "text").strip()
```
*(both defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

`with_context` falls back to the header for any chunk without a context. That
matters here: contexts were written for the 75 chunks of the company's
internal documents, where this module's retrieval failures have been; the
1,893 chunks of vendor documentation keep their headers. So the comparison
below is contexts against headers on the internal documents, with everything
else the same. Here's one chunk, with its context:

```python
stored = json.loads((DATA / "chunk-contexts.json").read_text())
report = next(d for d in load_documents() if d["doc_id"] == "D11")
timeline = structured_chunks(report, 200)[1]
client = FakeLLMClient([[TextBlock(stored["contexts"]["D11:1"])]])

context = situate_chunk(client, stored["prompt"], report, timeline)
print(with_context(timeline, {"D11:1": context})["text"][:330])
```
```
Timeline of incident INC-2093 (registry outage during database failover), from the registry-db disk check failure to recovery.

## Timeline

- 14:10 — The primary registry-db host failed a disk check and failover started.
- 14:11 — `RegistryUnreachable` fired and paged the on-call engineer. The overview dashboard went blank.
- 1
```
*(runs live, shows output — read-only demo snippet, not graded. The context is model-written with the whole document in view, and replayed as a scripted reply.)*

Where the header said "Incident INC-2093 > Timeline", the context says what
the timeline covers: which incident, what failed, from start to recovery.
That's the difference in kind. The context is written for this chunk, from
the whole document.

---

## Measured through the pipeline

```python
contexts = json.loads((DATA / "chunk-contexts.json").read_text())["contexts"]
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
versions = {
    "plain": ([c for c in chunks], "structured-200"),
    "with headers": ([with_header(c) for c in chunks], "structured-200-headers"),
    "with contexts": ([with_context(c, contexts) for c in chunks], "structured-200-contextual"),
}
question_vectors = query_vectors()

answered = {}
for name, (version, chunking) in versions.items():
    pipeline, scores = VersionedPipeline(version, chunking), CrossEncoderScores(chunking=chunking)
    results = {q["id"]: pipeline.search(q["query"], question_vectors[q["id"]], lambda c: scores.score(q["id"], c))
               for q in queries}
    answered[name] = {k: {q["id"] for q in queries if answerable(results[q["id"]][:k], q)} for k in (1, 5)}
    print(f"{name:<14} answered at rank 1: {len(answered[name][1])}, in the top 5: {len(answered[name][5])}")
for baseline in ("plain", "with headers"):
    gained = answered["with contexts"][5] - answered[baseline][5]
    lost = answered[baseline][5] - answered["with contexts"][5]
    print(f"contexts against {baseline}: gained {sorted(gained)}, lost {sorted(lost)}, "
          f"sign test {sign_test(len(gained), len(lost)):.2f}")
```
```
plain          answered at rank 1: 22, in the top 5: 32
with headers   answered at rank 1: 23, in the top 5: 34
with contexts  answered at rank 1: 26, in the top 5: 36
contexts against plain: gained ['q08', 'q25', 'q27', 'q28'], lost [], sign test 0.12
contexts against with headers: gained ['q08', 'q23', 'q25'], lost ['q15'], sign test 0.62
```
*(runs live, shows output — read-only demo snippet, not graded)*

Against plain chunks, contexts gained four questions and lost none, with a
sign test of 0.12, as strong a result as any single change in this module.
They also put 26 answers first, against 22. Against headers the picture is
more mixed, three gained and one lost, and the details explain both:

- **The claude-legacy question came back.** Headers lost it because every
  runbook step started with the same title. Each step's context now says
  what that step covers, and the table's says "which agents still use
  claude-legacy and the model each should move to", so it stands out again.
- **"Which alerts wake someone up at night?"** was gained: the wiki's
  quiet-hours context says "which alerts page at night", in words close to
  the question's.
- **"What changed in v2.4?"** was lost. The v2.4 entry's context is accurate,
  but the reranker now scores other changelog entries above it. Changing
  the indexed text changes how every stage behaves, not just the one you had
  in mind, which is why the whole pipeline is what gets measured.

---

## What it costs to write the contexts

Every context is a model call that reads the entire document. A document
with twenty chunks is read twenty times. Prompt caching changes that: the
prompt puts the document first, so every call for the same document shares
that prefix, and it can be written to a cache once and read back at a
fraction of the price. Here's the input cost of writing a context for every
chunk, in token-units, with the same example multipliers as Lesson 1:

```python
prompt = json.loads((DATA / "chunk-contexts.json").read_text())["prompt"]
# everything up to and including the document is the same for every chunk of that document
head, tail = prompt.split("{document}")
# one provider's published multipliers, as an example: cached reads at 0.1x, cache writes at 1.25x
READ, WRITE = 0.1, 1.25

def indexing_units(documents: list[dict]) -> tuple[float, float, int]:
    """Input token-units to write a context for every chunk, without and with caching each document."""
    plain = cached = 0.0
    calls = 0
    for document in documents:
        prefix = count_tokens(head + document["text"])
        for number, chunk in enumerate(structured_chunks(document, 200)):
            suffix = count_tokens(tail.format(chunk=chunk["text"]))
            plain += prefix + suffix
            cached += prefix * (WRITE if number == 0 else READ) + suffix
            calls += 1
    return plain, cached, calls

documents = load_documents()
for label, group in [("the 15 internal documents", [d for d in documents if "/" not in d["doc_id"]]),
                     ("the whole corpus", documents)]:
    plain, cached, calls = indexing_units(group)
    print(f"{label:<26} {calls:>5,} calls: {plain:>12,.0f} units uncached, {cached:>10,.0f} cached")
```
```
the 15 internal documents     75 calls:       46,863 units uncached,     22,159 cached
the whole corpus           1,968 calls:   14,005,435 units uncached,  2,013,020 cached
```
*(runs live, shows output — read-only demo snippet, not graded)*

For this corpus, 232,241 tokens of documents, writing contexts uncached
means reading about 14 million tokens, because long documents with many
chunks are re-read once per chunk. With caching it's about 2 million, seven
times less. On the small internal documents the saving is smaller, about
half, because each document has only a few chunks to share its cached
prefix. Output adds a little more: the stored contexts average about 31
tokens each. Caches expire when unused, and some providers only cache
prefixes above a minimum length, so the cached figure is the best case.

It's also a cost that comes back. A chunk's context depends on its whole
document, so editing one paragraph can make every context in that document
stale: regenerate them all, and re-embed every chunk. Headers only change
when a title or heading does. Keeping an index current as documents change is
Module 10's subject; here it's enough to know that contexts are paid for
again with every significant edit.

---

## Quiz cards

> **Q1.** How does a chunk's context differ from its header?
> - It's written for that chunk from the whole document, so it says what this chunk covers ✅
> - It repeats the document's title in every chunk, like a header
> - It replaces the chunk's text with a summary
> - It's stored as metadata, so it doesn't affect search
>
> *Explanation: a header is the same path for every chunk under a heading.
> A context describes this chunk: the timeline of this incident, the table
> of agents still on this model. That's what let the runbook's table stand
> out again.*

> **Q2.** Why does the context prompt put the document before the chunk?
> - So every call for the same document shares a prefix that can be cached ✅
> - Because models read the end of a prompt more carefully
> - So the chunk overrides anything the document says
> - Because the chunk must be shorter than the document
>
> *Explanation: a prefix cache matches from the start of the prompt. With
> the document first, all of its chunks' calls start identically, so the
> document is written to the cache once and read back cheaply after that.*

> **Q3.** Why did caching cut the whole corpus's cost seven-fold, but the
> internal documents' only about in half?
> - The internal documents have few chunks each, so there are few calls to share each cached prefix ✅
> - The internal documents are too short to be cached at all
> - Cached reads cost more for private documents
> - The vendor documents' contexts are shorter
>
> *Explanation: the cache write costs a quarter more than plain input and
> only pays off through later reads. A long document with many chunks is
> re-read many times; a four-chunk document only three.*

> **Q4.** A paragraph is edited in the middle of a 20-chunk document. What
> does contextual retrieval have to redo?
> - Possibly every chunk's context, and re-embed every chunk whose text changed ✅
> - Only the edited chunk's context
> - Nothing, because contexts are written once
> - Only the header of the edited chunk
>
> *Explanation: each context was written from the whole document, so an
> edit can change what's true of other chunks too. A header changes only
> when a title or heading does.*
