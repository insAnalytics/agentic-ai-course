# Module 5, Lesson 12 — Concept 1: When similarity search is the wrong shape

> **Note for the site build:**
> - **Lesson 12's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 11 comprehensive sandbox's `lib.py`, unchanged. numpy and
>   `sqlite3` must be loaded, and demos that run an agent need the fake client
>   (`REACT_FAKE_CLIENT` then `RECORDING_CLIENT`).
> - Both demos build an `AnswerRetriever`; allow a few seconds each.

---

## Five questions about the whole system

Every technique in this module so far answers the same kind of question: one
whose answer is written down somewhere, in a passage or two, that retrieval
has to find. The labelled set has five questions of a different kind, about
how things connect and about the corpus as a whole. Here's the lesson's best
pipeline on them, given ten results each:

```python
labelled = {q["id"]: q for q in load_queries()["main"]}
pipeline = AnswerRetriever()
for query_id in ("q30", "q31", "q32", "q33", "q34"):
    query = labelled[query_id]
    results = pipeline.search(query, 10)
    found = [any(is_relevant(c, s) for c in results for s in group) for group in query["evidence"]]
    print(f"{query_id} {query['query']}\n     evidence groups in the top 10: {sum(found)} of {len(found)}"
          f"  -> {'answered' if all(found) else 'not answered'}")
```
```
q30 Which agents stop working if auth-service goes down?
     evidence groups in the top 10: 2 of 5  -> not answered
q31 What depends on kb-search?
     evidence groups in the top 10: 2 of 2  -> answered
q32 If registry-db fails, what else is affected?
     evidence groups in the top 10: 4 of 4  -> answered
q33 What recurring causes run through our incidents?
     evidence groups in the top 10: 3 of 4  -> not answered
q34 What kinds of monitoring gaps have our incidents exposed?
     evidence groups in the top 10: 2 of 3  -> not answered
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two of the five are answered, both about direct dependencies ("what depends on
kb-search?"), which a document states in so many words. The other three fail,
and not because retrieval did a poor job on them. They have a different shape.

---

## A chain no passage describes

"Which agents stop working if auth-service goes down?" Here's what the answer
needs, and what the ten results contained:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q30")
results = AnswerRetriever().search(query, 10)
for group in query["evidence"]:
    found = any(is_relevant(c, s) for c in results for s in group)
    print(f"{'found  ' if found else 'missing'}  {group[0]['doc_id']}: {group[0]['quote'][:78]}")
```
```
found    D04: When a request reaches registry-api, it first asks auth-service to validate th
missing  D04: It looks up agent and account configuration through registry-api
missing  D04: `triage_agent` reads incoming tickets and hands the ones it can't close to `su
found    D09: payments-gateway checks every request's certificate with auth-service before i
missing  D09: Every attempt ended in a timeout from payments-gateway.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The answer is a chain. registry-api asks auth-service to validate every
request, and `support_agent` looks things up through registry-api, and
`triage_agent` hands work to `support_agent`. Separately, payments-gateway checks
every certificate with auth-service, and `billing_agent` calls payments-gateway.
So all three agents depend on auth-service, some of them two or three links
away.

The links that were found both mention auth-service. The links that were
missed don't: "support_agent looks things up through registry-api" says nothing
about auth-service, so it doesn't resemble the question at all. Similarity
search finds passages that look like the question. In a chain, the passages
further along look less and less like it, and that's not a ranking problem more
results or a better reranker can fix. It needs something that follows links.

---

## A question about everything

"What recurring causes run through our incidents?" has no answer passage at
all. The answer is a pattern across every incident report: a certificate that
expired unnoticed, a cache setting changed without review, replication lag that
nothing alerted on, a debug flag left on. Each report contains one piece; the
answer is what they share. Retrieval found three of the four pieces in its top
ten, but finding pieces isn't the problem. A question like this is about the
corpus as a whole, and in a corpus of thousands of reports, "the top ten"
would be a sample, not the whole.

The GraphRAG paper, by Edge and colleagues at Microsoft, calls these **global**
questions, and treats them as a summarisation task rather than a retrieval
task. Its approach, and its answer to chains too, starts by turning the
documents into a graph: the entities they mention and the relationships between
them. The rest of this lesson builds one from this corpus, answers the chain by
walking the graph, and the global questions by summarising parts of it, then
weighs what that costs.

---

## Quiz cards

> **Q1.** Why did retrieval miss "support_agent looks things up through
> registry-api" for a question about auth-service?
> - That passage doesn't mention auth-service, so it doesn't resemble the question ✅
> - The runbook it comes from is restricted
> - The reranker scored it too low because it's short
> - The passage was cut in half by the chunker
>
> *Explanation: in a chain, only the first link mentions the thing the
> question is about. Each further link resembles the question less, so
> similarity search can't follow the chain.*

> **Q2.** Why were "what depends on kb-search?" and "if registry-db fails,
> what else is affected?" answered?
> - The documents state those dependencies directly, in passages that resemble the questions ✅
> - They're shorter questions
> - kb-search and registry-db appear in the question's title
> - They were in the held-out set
>
> *Explanation: a direct dependency written down in one or two passages is
> ordinary retrieval. Only answers that need several links chained together
> defeat it.*

> **Q3.** What makes "what recurring causes run through our incidents?" a
> global question?
> - Its answer is a pattern across all the reports, not a passage in any of them ✅
> - It contains the word "our"
> - It needs the newest reports only
> - It's about monitoring
>
> *Explanation: each report holds one piece. The answer is what they share,
> which requires considering the whole collection rather than retrieving a
> few pieces of it.*

> **Q4.** Why doesn't returning more results solve global questions in
> general?
> - In a large corpus, any top k is a sample of the collection, not the whole of it ✅
> - More results always reduce precision to zero
> - Rerankers can't score more than ten results
> - Global questions have no labelled evidence
>
> *Explanation: with three reports, ten results nearly covers them. With
> thousands, no practical k does. The approach has to summarise the corpus,
> not sample it.*
