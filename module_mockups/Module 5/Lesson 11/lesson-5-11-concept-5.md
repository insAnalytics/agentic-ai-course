# Module 5, Lesson 11 — Concept 5: Keyword tools against the full pipeline

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `query_database`. No other new shared code.
> - Both demos build an `AnswerRetriever` and run every labelled question;
>   allow several seconds each. They need `query-variants.json`.

---

## What two recent papers found

If an agent can search as often as it likes, does it still need search by
meaning, contextual chunks and a reranker? Two recent papers put that to the
test, and both are worth reading closely rather than by their titles.

**"Keyword search is all you need"** (Subramanian and colleagues, at Amazon,
arXiv 2602.23368) gave a ReAct agent, running Claude 3 Sonnet, nothing but
command-line keyword tools, `rga` and `pdfgrep`, over folders of PDFs. They
compared it with a standard RAG baseline: fixed 300-token chunks, one embedding
model, the top five chunks. Answers were scored by a model acting as judge,
using the RAGAS library, across five document sets. The agent reached about
94.5% of the baseline's faithfulness score, 88% of its context recall and
91.5% of its answer correctness, on average, with no vector database. The
authors state that it generally performed slightly *below* the baseline. On
FinanceBench, with complex financial filings, it did better: about 30% of
answers correct against 24%. They list its limits themselves: large documents,
images, context-window constraints and ambiguous questions.

**"Is Grep All You Need? How Agent Harnesses Reshape Agentic Search"** (Sen
and colleagues, arXiv 2605.15184) compared grep with vector retrieval on 116
questions about long conversation histories, from the LongMemEval benchmark,
inside several agent harnesses: their own and the command-line agents of three
model providers. Grep generally gave higher accuracy. Their other finding
matters as much: overall scores depended strongly on the harness and on how
tool results were delivered to the model, even on the same data.

Read together, they say keyword tools in an agent loop can come close to a
simple vector pipeline, and sometimes beat it. Read carefully, they compare
against simple baselines, with no hybrid search and no reranking, on particular
kinds of data, with scores from a model judge, and the surrounding agent design
moves results as much as the retriever does. That's a claim worth testing on
your own documents, which is what this module has done at every step.

---

## On this corpus

Here are four ways to retrieve for the module's labelled questions. The
"retries" row stands in for an agent searching several times: it fuses keyword
searches for the question, its model-written rewrite and, where it has them,
its sub-queries, all from Lesson 8. They're real queries a model wrote, though
not queries an agent chose in a loop:

```python
variants_by_id = load_query_variants()
labelled = [q for q in load_queries()["main"] if q["evidence"]]
pipeline = AnswerRetriever()

def keyword_retries(query: dict, k: int) -> list[dict]:
    """Several keyword searches fused: the question, its model-written rewrite and any sub-queries."""
    searches = [query["query"], variants_by_id["rewrites"][query["id"]], *variants_by_id["sub_queries"].get(query["id"], [])]
    return rrf([CONTEXT_INDEX.search(words, 50) for words in searches])[:k]

approaches = {
    "keyword, once": lambda q, k: CORPUS_INDEX.search(q["query"], k),
    "contextual keyword, once": lambda q, k: CONTEXT_INDEX.search(q["query"], k),
    "contextual keyword, retries": keyword_retries,
    "full pipeline, once": lambda q, k: pipeline.search(q, k),
}
print(f"{'':<30}{'top 5':>7}{'top 10':>8}   (of {len(labelled)} answerable questions)")
for name, search in approaches.items():
    counts = [sum(answerable(search(q, k), q) for q in labelled) for k in (5, 10)]
    print(f"{name:<30}{counts[0]:>7}{counts[1]:>8}")
```
```
                                top 5  top 10   (of 43 answerable questions)
keyword, once                      25      26
contextual keyword, once           28      32
contextual keyword, retries        31      34
full pipeline, once                36      36
```
*(runs live, shows output — read-only demo snippet, not graded)*

Keyword search alone, once, answers 25 in the top five. Searching Lesson 9's
contextual text lifts that to 28, and retrying with other wordings to 31. The
full pipeline, once, answers 36. So keyword search with retries reaches about
86% of the pipeline in the top five and 94% in the top ten, close to the first
paper's attainment figures. The gap narrows as more results are allowed,
because keyword search often finds the right chunk but ranks it lower.

Where the two disagree is informative:

```python
variants_by_id = load_query_variants()
labelled = [q for q in load_queries()["main"] if q["evidence"]]
pipeline = AnswerRetriever()

def keyword_retries(query: dict, k: int) -> list[dict]:
    searches = [query["query"], variants_by_id["rewrites"][query["id"]], *variants_by_id["sub_queries"].get(query["id"], [])]
    return rrf([CONTEXT_INDEX.search(words, 50) for words in searches])[:k]

by_keyword = {q["id"] for q in labelled if answerable(keyword_retries(q, 5), q)}
by_pipeline = {q["id"] for q in labelled if answerable(pipeline.search(q, 5), q)}
types = {q["id"]: q["type"] for q in labelled}
print("only the pipeline:", [f"{i} ({types[i]})" for i in sorted(by_pipeline - by_keyword)])
print("only keyword retries:", [f"{i} ({types[i]})" for i in sorted(by_keyword - by_pipeline)])
print(f"sign test: {sign_test(len(by_pipeline - by_keyword), len(by_keyword - by_pipeline)):.2f}")
```
```
only the pipeline: ['q04 (paraphrase)', 'q24 (conversational)', 'q27 (multi_hop)', 'q28 (multi_hop)', 'q32 (relationship)', 'q36 (conflict)']
only keyword retries: ['q15 (identifier)']
sign test: 0.12
```
*(runs live, shows output — read-only demo snippet, not graded)*

The pipeline's wins are the questions this module predicted: a paraphrase
with no shared words, a follow-up whose words aren't in the documents, two
multi-hop questions, a relationship question and a conflict question. Keyword
retries won one, a question about a version identifier, the kind of exact term
BM25 handles best. Six against one gives a sign test of 0.12, suggestive
rather than conclusive. And an agent that actually hops, as the multi-hop concept
showed, can answer the two multi-hop questions that fused retries can't.

---

## What to take from it

- **Keyword tools are a strong baseline for an agent,** especially over
  identifiers, names and error codes, and they need no embedding model or
  vector index to build and keep current.
- **Search by meaning still earns its place** on paraphrases, follow-ups and
  questions phrased in the user's words rather than the documents'. An agent's
  retries narrow that gap but didn't close it here.
- **The two combine.** The strongest design this lesson points to is an agent
  whose search tool *is* the full pipeline: every search as good as retrieval
  can make it, and the loop for the questions that need more than one.
- **Measure on your own documents.** The papers' corpora, models and harnesses
  aren't yours, and neither are this module's numbers.

---

## Quiz cards

> **Q1.** The first paper's agent reached about 90% of its RAG baseline's
> scores. What limits how far that result carries?
> - The baseline was simple, with no hybrid search or reranking, and scores came from a model judge ✅
> - The agent used a newer model than the baseline
> - The documents were all in Markdown
> - It tested only one question
>
> *Explanation: a keyword agent matching a simple pipeline doesn't show it
> matches a strong one. The comparison is real but narrower than its title.*

> **Q2.** What did the second paper find beyond grep beating vector
> retrieval?
> - Scores depended as much on the agent harness and how tool results were delivered ✅
> - Vector retrieval was faster in every harness
> - Grep only worked with one model
> - The benchmark was too small to show anything
>
> *Explanation: the same retriever did better or worse depending on the
> surrounding agent design. The retriever isn't the only thing being
> measured.*

> **Q3.** On this corpus, which questions did only the full pipeline
> answer?
> - Paraphrases, follow-ups and others whose words don't match the documents ✅
> - Identifier questions with exact codes
> - Questions about the PDFs
> - Only the unanswerable questions
>
> *Explanation: meaning search, contexts and reranking recover passages
> that share few words with the question. Keyword retries narrowed that gap
> but didn't close it.*

> **Q4.** What design does this lesson point to as the strongest?
> - An agent whose search tool is the full retrieval pipeline ✅
> - A keyword-only agent with no index
> - A fixed pipeline with no agent
> - An agent that searches with every tool at once
>
> *Explanation: the pipeline makes each search as good as possible, and the
> loop handles questions that need several searches or other tools.*
