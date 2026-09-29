# Module 5, Lesson 12 — Concept 5: What it costs, and when it's worth it

> **Note for the site build:** no new shared code. The demo reads the
> documents and `graph.json` and runs in a second or two.

---

## Building the graph

A graph index is paid for up front, and the biggest part is extraction: one
model call per chunk. Here's what this lesson's extraction cost, and what the
same prompt would cost over the whole corpus, in tokens:

```python
graph_data = load_graph_data()
prompt = graph_data["extraction_prompt"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
extracted = {f"{c['doc_id']}:{c['chunk']}" for c in chunks} & graph_data["triples"].keys()

def extraction_input(chunk: dict) -> int:
    return count_tokens(prompt.format(title=chunk["title"], section=chunk["section"], chunk=chunk["text"]))

done = [c for c in chunks if f"{c['doc_id']}:{c['chunk']}" in extracted]
output = sum(count_tokens(json.dumps(t)) for t in graph_data["triples"].values())
print(f"this lesson's extraction: {len(done)} calls, {sum(map(extraction_input, done)):,} input tokens, "
      f"about {output:,} output tokens")
whole = sum(map(extraction_input, chunks))
print(f"the whole corpus:        {len(chunks):,} calls, {whole:,} input tokens, "
      f"about {round(output / len(done) * len(chunks)):,} output tokens at the same rate")
print(f"the corpus itself:       {sum(count_tokens(d['text']) for d in load_documents()):,} tokens")
```
```
this lesson's extraction: 25 calls, 7,876 input tokens, about 625 output tokens
the whole corpus:        1,968 calls, 682,083 input tokens, about 49,200 output tokens at the same rate
the corpus itself:       232,241 tokens
```
*(runs live, shows output — read-only demo snippet, not graded)*

Extracting from every chunk would read about 680,000 input tokens, nearly
three times the corpus itself, because each call carries the extraction prompt
and the chunk's title and section as well as the chunk. The output estimate is
rough: it assumes vendor documentation yields relationships at the same rate
as incident reports, which it probably doesn't. Output tokens also usually
cost several times more per token than input.

That's still far less than Lesson 9's contextual retrieval, whose prompts
carried the whole document for every chunk. Extraction needs only the chunk,
its title and its section. But extraction isn't the whole bill:

- **Entity resolution,** done here by hand, is either a person's time or
  more model calls and a review.
- **Community summaries,** one model call per community, and in the paper's
  design, for every level of a hierarchy of communities.
- **Global questions** then cost a model call per community used, every time.
- **Keeping it current.** Edit one incident report, and its chunks need
  extracting again, the new names resolving against the old, the communities
  recomputing, and every summary touching them rewriting. Keeping indexes in
  step with changing documents is Module 10's subject; a graph is one of the
  more expensive indexes to keep in step.

---

## What Microsoft has published since

The cost of building summaries up front was the approach's best-known
drawback, and Microsoft's later work attacks it directly. **LazyGraphRAG**, from
Microsoft Research, builds no summaries in advance and defers model calls to
query time. They report that its indexing costs the same as vector RAG, and
0.1% of full GraphRAG. On global questions, they report answer quality
comparable to GraphRAG's global search at more than 700 times lower query
cost, on their own benchmark of news articles, scored by a model comparing
answers.

The gains themselves have been questioned too. Zeng and colleagues (2025)
argued that the standard evaluations of GraphRAG methods had two flaws:
questions not closely related to the data, and biases in how a model judges
competing answers. With both addressed, they found the performance gains of
three GraphRAG methods much more moderate than previously reported. That
doesn't make the approach wrong. It means its advantages, like everything in
this module, need measuring on your own questions.

---

## When it's worth it

A graph earns its cost when questions are about **structure**, and the
structure is only written down in prose:

- **Chains of relationships:** dependencies between services, who reports to
  whom, which supplier provides which part. This lesson's traversal answered
  four relationship questions from their cited chunks, where the pipeline
  missed the one that needed a chain.
- **Questions about the whole collection:** themes, recurring causes,
  patterns across many reports, where any top k is only a sample.

It's not worth it when:

- **The relationships already exist as data.** If a service catalogue,
  a configuration system or a database records which service calls which, build
  the graph from that, or query it with a tool, as Lesson 11 queried the
  registry. Extracting from prose what a system of record already holds adds
  cost and errors.
- **Questions are mostly about single facts.** Most of this module's
  labelled questions are, and hybrid search with reranking answers them for
  far less.
- **An agent's searches can follow the chain.** Lesson 11's multi-hop search
  handled two-link chains with a few searches and no index to build. A graph
  pays off when chains are long, or when the same structure is asked about
  again and again.

---

## Quiz cards

> **Q1.** Why does extraction over the whole corpus read nearly three times
> as many tokens as the corpus contains?
> - Every call carries the extraction prompt and the chunk's title and section as well as the chunk ✅
> - Each chunk is extracted three times
> - The model reads the whole document for every chunk
> - Graph indexes store every token three times
>
> *Explanation: the fixed prompt is paid for on every one of the 1,968
> calls. Contextual retrieval cost far more because it sent the whole
> document each time.*

> **Q2.** One incident report is edited. What does the graph index need?
> - Its chunks extracted again, the names resolved, communities recomputed and affected summaries rewritten ✅
> - Nothing; graphs don't depend on the text
> - Only the edited chunk re-embedded
> - A new graph built from scratch for every edit
>
> *Explanation: every layer is derived from the one before. That makes a
> graph one of the more expensive indexes to keep current.*

> **Q3.** What did LazyGraphRAG change?
> - It builds no summaries in advance, deferring model calls to query time, so indexing costs about the same as vector RAG ✅
> - It extracts more relationships per chunk
> - It replaces the graph with a vector index
> - It removes global questions from scope
>
> *Explanation: Microsoft reports its indexing at 0.1% of full GraphRAG's
> cost, with comparable quality on global questions at far lower query
> cost, on their benchmark.*

> **Q4.** When is extracting a graph from documents the wrong choice?
> - When the relationships already exist as data in a system of record ✅
> - When questions are about chains of dependencies
> - When the corpus is larger than the context window
> - When answers need citations
>
> *Explanation: a service catalogue or database that records the
> relationships is more accurate and cheaper to use directly, as a graph
> source or as a tool.*
