# Module 5, Lesson 5 — Concept 3: Tables for retrieval

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `to_markdown`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `table_as_rows`, `pdf_query_vectors`, `contains_facts`,
>   `plain_text`, `added_chunks`, `pdf_chunks` and `index_with_pdfs`, exactly
>   as in the code block below. `table_as_rows`, `plain_text` and
>   `added_chunks` must stay identical to `scripts/rag_pdf.py`.
> - The last demo builds four indexes over the whole corpus; allow several
>   seconds.

---

## A new rule for what counts as relevant

Lesson 2 labelled each question with quotes from the documents, and counted a
chunk as relevant if it contained at least half of one. That assumes every
answer is a passage of text. In a PDF, some answers are a cell in a table, and
some are a bar in a chart, which has no text to quote at all. So the PDF
questions are labelled with **facts**: a few strings the answer depends on,
like `["21 Dec", "Primary", "Tomás Reyes"]`. A chunk counts as relevant if it
comes from the right document and states every one of them. Here it is, with
the code for building and searching the PDF chunks:

```python
def table_as_rows(rows: list[list[str]]) -> str:
    """Each row as its own line of 'header: value' pairs, so a row keeps its meaning on its own."""
    header, *body = rows
    return "\n\n".join("; ".join(f"{h}: {v}" for h, v in zip(header, row)) + "." for row in body)

def pdf_query_vectors() -> dict[str, np.ndarray]:
    """bge-small's embeddings of the PDF questions, with its retrieval instruction, by question id."""
    stored = json.loads((EMBEDDINGS / "bge-small-en-v1.5" / "pdf-queries.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored["instructed"], stored["dim"])))

def contains_facts(chunk: dict, query: dict) -> bool:
    """A PDF question's relevance rule: the chunk is from the right document and states every fact."""
    return chunk["doc_id"] == query["doc_id"] and all(
        normalize(fact).lower() in normalize(chunk["text"]).lower() for fact in query["facts"])

def plain_text(extracted: dict) -> str:
    """What a plain extractor returns: every page's text, pages separated by a blank line."""
    return "\n\n".join(page["plain_text"] for page in extracted["pages"])

def added_chunks(document: dict, chunks: list[dict], texts: list[tuple[str, str]]) -> list[dict]:
    """Extra chunks for one document (table summaries or image descriptions), numbered after its chunks."""
    start = max((c["chunk"] for c in chunks), default=-1) + 1
    metadata = {k: v for k, v in document.items() if k != "text"}
    return [{**metadata, "section": f"{document['title']} > {label}", "chunk": start + n, "text": text}
            for n, (label, text) in enumerate(texts)]

def pdf_chunks(render_table=table_as_markdown, added: list = (), plain: bool = False) -> list[dict]:
    """Chunks for all four PDFs: rebuilt Markdown with tables written by render_table (or the plain
    extracted text), plus any added (doc_id, label, text) chunks such as table summaries."""
    extraction, chunks = load_pdf_extraction(), []
    for doc_id, document in load_pdf_corpus()["documents"].items():
        text = plain_text(extraction[doc_id]) if plain else to_markdown(extraction[doc_id], render_table)
        made = structured_chunks({**document, "text": text}, 200)
        extra = [(label, content) for owner, label, content in added if owner == doc_id]
        chunks += made + added_chunks({**document, "text": text}, made, extra)
    return chunks

def index_with_pdfs(pdf: list[dict]) -> VectorIndex:
    """Search by meaning over the whole corpus plus a version of the PDFs' chunks."""
    corpus = [c for d in load_documents() for c in structured_chunks(d, 200)]
    index = VectorIndex()
    index.add(corpus + pdf, np.vstack([vectors_for(corpus), vectors_for(pdf, chunking="pdf-chunks")]))
    return index
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

`pdf_chunks` builds one version of the four PDFs: plain extracted text, or the
rebuilt Markdown with its tables written by any `render_table` function, plus
any added chunks, such as summaries. `index_with_pdfs` puts that version into
one index with the rest of the corpus, so the PDFs compete with everything
else, as they would in a real system.

---

## A row means nothing without its header

The rota has thirteen rows, which is more than one 200-token chunk can hold.
Lesson 3's chunker splits it where it must, and the later rows land in a chunk
of their own:

```python
query = next(q for q in load_pdf_corpus()["queries"] if q["id"] == "p08")
rota = [c for c in pdf_chunks() if c["doc_id"] == "P03" and "21 Dec" in c["text"]][0]
print(query["query"], "\n")
print(rota["text"])
print("\nholds every fact:", contains_facts(rota, query), " facts:", query["facts"])
```
```
Who is the primary on-call engineer for the week of 21 December? 

## Platform on-call

| 14 Dec | Lena Fischer | Arjun Mehta | Grace Okafor |  |
| 21 Dec | Tomás Reyes | Priya Nair | Daniel Kim | Reduced cover: Friday is a company holiday |
| 28 Dec | Arjun Mehta | Lena Fischer | Grace Okafor | Reduced cover all week |

holds every fact: False  facts: ['21 Dec', 'Primary', 'Tomás Reyes']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every cell of the 21 December row is there, but nothing in this chunk says
which column is the primary engineer. The header row went into the chunk
before. A reader, or a model, can't tell whether Tomás Reyes is on primary or
secondary duty that week, which is why the label requires "Primary" too.

---

## Three ways to write a table

The fix is to write the table so each piece carries its own meaning. There
are three common ways, shown here on the support-tiers table:

```python
corpus = load_pdf_corpus()
tiers = load_pdf_extraction()["P02"]["pages"][0]["tables"][0]["rows"]
print("As a Markdown table:\n" + table_as_markdown(tiers))
print("\nAs rows with their headers:\n" + table_as_rows(tiers))
summary = next(text for doc_id, label, text in corpus["summaries"] if doc_id == "P02")
print(f"\nAs a model-written summary:\n{summary}")
```
```
As a Markdown table:
| Tier | First response | Resolution target | Availability commitment |
|---|---|---|---|
| standard | 1 hour | 1 business day | 99.5% |
| priority | 15 minutes | 4 hours | 99.9% |

As rows with their headers:
Tier: standard; First response: 1 hour; Resolution target: 1 business day; Availability commitment: 99.5%.

Tier: priority; First response: 15 minutes; Resolution target: 4 hours; Availability commitment: 99.9%.

As a model-written summary:
Response targets by agent tier: standard-tier incidents get a first response within 1 hour and resolution within 1 business day, with a 99.5% availability commitment; priority-tier incidents get a first response within 15 minutes and resolution within 4 hours, with a 99.9% commitment.
```
*(runs live, shows output — read-only demo snippet, not graded. The summary is model-written for the course and replayed as stored text.)*

- **Keep it as a Markdown table.** Faithful and compact, and fine while the
  whole table fits in one chunk. When it doesn't, later rows lose their
  header, as above.
- **Write each row with its headers.** Every row becomes a sentence of
  header-value pairs, so any row makes sense on its own, wherever the chunker
  puts it. It costs some repetition: every row repeats the column names.
- **Add a model-written summary.** A common approach in multimodal RAG
  pipelines: ask a model to describe the table in
  prose, and index the description next to the table. The summaries here
  followed this prompt:

  > Summarise this table in one or two sentences of plain prose, so it can be found by search. Say what the table is about and what it shows.

---

## Measured

Here are the five table questions, searched by meaning over the whole corpus,
with the PDFs in each version:

```python
corpus = load_pdf_corpus()
queries = [q for q in corpus["queries"] if q["type"] == "pdf_table"]
vectors = pdf_query_vectors()
versions = {
    "plain text": pdf_chunks(plain=True),
    "Markdown tables": pdf_chunks(),
    "rows with headers": pdf_chunks(render_table=table_as_rows),
    "Markdown + summaries": pdf_chunks(added=corpus["summaries"]),
}
print(f"{'':<22}" + "".join(f"{q['id']:>6}" for q in queries) + "   (rank of the first chunk holding the answer)")
for name, chunks in versions.items():
    index = index_with_pdfs(chunks)
    ranks = [next((r for r, c in enumerate(index.search(vectors[q["id"]], 20), 1) if contains_facts(c, q)), "-")
             for q in queries]
    print(f"{name:<22}" + "".join(f"{rank:>6}" for rank in ranks))
```
```
                         p01   p02   p06   p07   p08   (rank of the first chunk holding the answer)
plain text                 1     1     1     4     -
Markdown tables            1     1     1     3     -
rows with headers          1     1     1     1     1
Markdown + summaries       1     1     1     3     -
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three results stand out, with the caution that five questions is a small
sample:

- **For small tables, plain extraction was already enough to find the answer.**
  The values are all present in the flattened text, and three of the five
  questions were answered at rank 1 without any cleaning. Cleaning helps a
  model *read* the table; for *finding* it, these small tables were already
  findable.
- **Rows with headers were the only version to answer every question at rank
  1.** They're the only version that answers the late rota row at all, and they
  lifted "Which tier comes with a 99.5% availability commitment?" from third to
  first, because the standard tier's row is now a chunk-sized sentence about
  exactly that.
- **Summaries changed nothing here.** The tiers summary ranked seventh for the
  99.5% question, below the table it summarises, because it describes both
  tiers at once and so matches neither sharply. The rota summary describes the
  table, not its cells, so it can't answer a week-by-week question at all.

Summaries earn their place for a different kind of question: about what a
table covers, like "is there an on-call rota for December?", where a sentence
describing the table beats a grid of names. For looking up a value, the row is
the unit that matters.

---

## Quiz cards

> **Q1.** Why are the PDF questions labelled with facts rather than quotes?
> - Some answers are in charts, which have no text to quote ✅
> - Quotes can't contain numbers
> - Facts are shorter, so they match faster
> - PDFs can't be searched for quotes
>
> *Explanation: Lesson 2's half-quote rule assumes the answer is a
> passage. A value read from a bar chart has no passage. Requiring the
> right document and every fact works for text, tables and image
> descriptions alike.*

> **Q2.** A chunk holds the 21 December rota row but not the header. What's
> missing?
> - Which column each name is in, so whether Tomás Reyes is primary or secondary ✅
> - The date, which was in the header row
> - The names, which are stored separately
> - Nothing: the row has every cell
>
> *Explanation: a table row's meaning comes from its column headers. Split
> from them, the cells are just names and dates.*

> **Q3.** Why did writing rows with their headers lift the 99.5% question
> from third to first?
> - The standard tier's row became a short sentence about exactly that commitment ✅
> - Rows are embedded with a different model
> - Rows repeat the question's wording
> - Row chunks are shorter, and search prefers short chunks
>
> *Explanation: "Tier: standard; ... Availability commitment: 99.5%" is a
> focused statement. The whole table, or a summary of both tiers, mixes the
> answer with everything else.*

> **Q4.** When does a table summary help retrieval?
> - For questions about what a table covers, rather than a value in one cell ✅
> - Always, since summaries are written in prose
> - Only for tables too large to chunk
> - Never; summaries only help the answering model
>
> *Explanation: a summary describes the table as a whole, so it matches
> questions about its subject. It rarely states every cell, so value
> lookups need the rows themselves.*
