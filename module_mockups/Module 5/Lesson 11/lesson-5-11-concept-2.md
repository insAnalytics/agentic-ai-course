# Module 5, Lesson 11 — Concept 2: Multi-hop questions

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `search_documents`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `CONTEXTS`, `CONTEXT_INDEX`, `SOURCE_CHUNKS` and
>   `contextual_search`, exactly as in the code block below. It needs
>   `chunk-contexts.json`.
> - The last demo builds an `AnswerRetriever`; allow a few seconds.

---

## A question that needs two answers

"What model does the agent affected by INC-2067 need to move to, and by
when?" No single passage answers it. The incident report says which agent was
affected. The migration runbook says where that agent must move and by when.
The runbook never mentions INC-2067, and the incident report never mentions
the migration. To find the second passage you need the answer from the first:
the agent's name. Questions like this are called **multi-hop**, and they're
where an agent that can search more than once has a real advantage.

There's a problem before the first hop, though:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q27")
print(query["query"])
print("chunks containing 'INC-2067':", [f"{c['doc_id']}:{c['chunk']}" for c in CORPUS_CHUNKS if "INC-2067" in c["text"]])
print("\nsearch_documents('INC-2067 affected agent'), sources returned:")
print(re.findall(r'<source id="([^"]+)"[^>]*section="([^"]+)"', search_documents("INC-2067 affected agent")))
```
```
What model does the agent affected by INC-2067 need to move to, and by when?
chunks containing 'INC-2067': []

search_documents('INC-2067 affected agent'), sources returned:
[('D07:1', 'Runbook: migrating agents off claude-legacy > Which agents are affected'), ('D11:2', 'Incident INC-2093: registry outage during database failover > What made it worse'), ('prometheus-server/command-line/prometheus.md:10', 'prometheus > Flags'), ('D01:3', 'Registry API reference > Reading one agent'), ('prometheus-server/feature_flags.md:27', 'Feature flags > OTLP Delta Conversion')]
```
*(runs live, shows output — read-only demo snippet, not graded)*

No chunk contains "INC-2067", because the id is only in the incident report's
title, which is exactly [Lesson 9's problem](→ this module, Lesson 9, chunks that don't say what they're about concept).
The keyword tool can't find the report however many times the agent tries,
because the words it would need aren't in the index. Searching harder doesn't
fix a gap in what was indexed.

So from here on, the tool searches Lesson 9's contextual text, where every
internal chunk carries its model-written context, and every vendor chunk its
header. It still sends the model source text only, as Lesson 9 required:

```python
CONTEXTS = json.loads((DATA / "chunk-contexts.json").read_text())["contexts"]
CONTEXT_INDEX = BM25Index()
CONTEXT_INDEX.add([with_context(c, CONTEXTS) for c in CORPUS_CHUNKS])
SOURCE_CHUNKS = {(c["doc_id"], c["chunk"]): c for c in CORPUS_CHUNKS}

def contextual_search(query: str, k: int = 5) -> str:
    """search_documents over Lesson 9's contextual text: chunks are found by their header or
    context, but the model is sent the source text only."""
    query = query.strip()
    if not query:
        return "Error: the query is empty. Search with a few specific words, such as a name, an error code or an incident id."
    results = CONTEXT_INDEX.search(query, min(max(int(k), 1), 10))
    if not results:
        return f"No documents matched {query!r}. Try different words, such as a synonym or a more specific term."
    sources = [SOURCE_CHUNKS[(c["doc_id"], c["chunk"])] for c in results]
    return "\n\n".join(format_source(f"{c['doc_id']}:{c['chunk']}", c) for c in sources)
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

---

## Two hops

Here's the agent answering the question with that tool:

```python
client = RecordingClient([
    [ToolUseBlock("search_documents", {"query": "INC-2067 affected agent"})],
    [ToolUseBlock("search_documents", {"query": "research_agent claude-legacy target model switched off"})],
    [TextBlock("INC-2067 affected research_agent [D10:0]. It must move from claude-legacy to claude-sonnet "
               "[D07:1] before claude-legacy is switched off on 2026-10-31 [D07:0].")],
])
messages = [{"role": "user", "content": "What model does the agent affected by INC-2067 need to move to, and by when?"}]
answer = run_agent(client, messages, {"search_documents": contextual_search})

for message in messages:
    for block in message["content"] if isinstance(message["content"], list) else []:
        if getattr(block, "type", None) == "tool_use":
            print(f"search: {block.input['query']!r}")
        elif isinstance(block, dict) and block["type"] == "tool_result":
            ids = re.findall(r'<source id="([^"]+)"', block["content"])
            print(f"  got {ids}")
print(f"\nanswer: {answer}")
```
```
search: 'INC-2067 affected agent'
  got ['D10:3', 'D10:2', 'D07:1', 'D11:2', 'D10:0']
search: 'research_agent claude-legacy target model switched off'
  got ['D07:0', 'D07:1', 'D03:1', 'D07:3', 'D07:2']

answer: INC-2067 affected research_agent [D10:0]. It must move from claude-legacy to claude-sonnet [D07:1] before claude-legacy is switched off on 2026-10-31 [D07:0].
```
*(runs live, shows output — read-only demo snippet, not graded. The model's tool calls and answer are scripted; every search runs for real.)*

The first search finds the incident report. Its chunks name `research_agent`,
and even the chunks that don't are tagged with the report's title, which
`format_source` includes. So the model writes its second query with a word the
user never said: the agent's name. That search finds the runbook's table and
its deadline. The answer cites both hops.

---

## Measured

Here are the module's three multi-hop questions, with the scripted two-hop
queries written the same way. For a fair comparison, single searches return
ten results, as many as two hops of five:

```python
labelled = {q["id"]: q for q in load_queries()["main"]}
# the queries a model writes after reading each first search's results, as in the run above
hops = {
    "q27": ["INC-2067 affected agent", "research_agent claude-legacy target model switched off"],
    "q28": ["INC-2093 unavailable", "monitoring can't reach Registry API error code"],
    "q29": ["INC-2041 alert fired first", "AgentErrorRateHigh"],
}
pipeline = AnswerRetriever()
# single searches return 10 results, the same number as two hops of 5
print(f"{'':<6}{'keyword, once':>15}{'contextual keyword, once':>26}{'full pipeline, once':>21}{'contextual keyword, two hops':>30}")
for query_id, (first, second) in hops.items():
    query = labelled[query_id]
    two_hops = CONTEXT_INDEX.search(first, 5) + CONTEXT_INDEX.search(second, 5)
    row = [answerable(CORPUS_INDEX.search(query["query"], 10), query),
           answerable(CONTEXT_INDEX.search(query["query"], 10), query),
           answerable(pipeline.search(query, 10), query),
           answerable(two_hops, query)]
    print(f"{query_id:<6}" + "".join(f"{str(v):>{w}}" for v, w in zip(row, (15, 26, 21, 30))))
```
```
        keyword, once  contextual keyword, once  full pipeline, once  contextual keyword, two hops
q27             False                      True                 True                          True
q28             False                     False                 True                          True
q29             False                     False                False                          True
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three things to read from this, with the obvious caution that three questions
is a very small sample:

- **Plain keyword search, once, answered none.** The identifiers these
  questions start from are in titles, not text.
- **The full pipeline, once, answered two.** Search by meaning, contextual
  chunks and reranking together found both hops' passages in one search for
  q27 and q28. A good single search can cover two hops when both passages are
  close enough in meaning to the question.
- **Only two hops answered q29,** "What does the alert that fired first in
  INC-2041 actually measure?" The alert's definition is in the monitoring
  guide, which shares almost no words with the question. It's found by the alert's
  name, `AgentErrorRateHigh`, and the only way to learn that name from this
  question is to read the incident report first. No single search, however good, can use a word the question doesn't
  contain.

Keep in mind what's scripted here. The model's queries were written to be
what a model plausibly writes after reading the first results, and the
searches are real. A real model might write better or worse queries, or stop
after one hop. Measuring that needs a live model, and it's the kind of
evaluation Module 7 covers.

---

## Quiz cards

> **Q1.** What makes a question multi-hop?
> - Its answer needs information that can only be found using an earlier answer ✅
> - It has more than one clause
> - Its answer is in more than one document
> - It needs more than five results
>
> *Explanation: in q27, the agent's name comes from the incident report,
> and only with that name can the runbook's answer be found. The second
> search depends on the first.*

> **Q2.** The keyword tool couldn't find the INC-2067 report however it was
> asked. Why, and what fixed it?
> - The id wasn't in any chunk's text; indexing Lesson 9's contextual text put it there ✅
> - BM25 ignores identifiers; switching to search by meaning fixed it
> - The report was restricted; removing the filter fixed it
> - The agent searched too few times; searching more fixed it
>
> *Explanation: an agent can only find words that are in the index.
> Contexts written from the whole document put the incident's id next to
> every chunk of its report.*

> **Q3.** Why could no single search answer q29, even the full pipeline?
> - The alert's definition is found by its name, which only the incident report contains ✅
> - The monitoring guide is too long to be retrieved
> - The reranker scores alert definitions too low
> - q29 uses a word that's a stopword
>
> *Explanation: the question says "the alert that fired first", never
> `AgentErrorRateHigh`. The name has to be read from the first search's
> results before the second search can use it.*

> **Q4.** In the measurement, what's real and what's scripted?
> - The searches and their results are real; the model's queries and answer are scripted ✅
> - Everything is real, including the model's queries
> - The results are scripted; the queries are real
> - Everything is scripted, so the comparison shows nothing
>
> *Explanation: the retrieval results are real, so they show that two
> well-chosen searches find what one can't. Whether a real model chooses
> those searches needs a live evaluation.*
