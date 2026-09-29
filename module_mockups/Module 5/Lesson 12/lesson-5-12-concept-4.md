# Module 5, Lesson 12 — Concept 4: Communities and summaries

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `affected_by`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `graph_communities` and `community_sources`, exactly
>   as in the first code block below. **networkx must be loaded**
>   (`pyodide.loadPackage("networkx")`).
> - **Recheck the first demo's output in Pyodide:** it was produced with
>   networkx 3.6.1 and matches 3.3 on desktop; Louvain's grouping can depend
>   on the library version.
> - The last demo needs the fake client (`REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`); its replies are scripted.

---

## Groups in the graph

"What recurring causes run through our incidents?" isn't answered by any
edge or any chain. It needs a view of the whole collection. GraphRAG's
approach, from Edge and colleagues' paper, is to divide the graph into
**communities**, groups of entities more tightly connected to each other than
to the rest, and to summarise each one in advance. A global question is then
answered from the summaries, not from the raw chunks.

Communities are found by **community detection**, a standard family of graph
algorithms. The Louvain method, used here from the networkx library, looks
for the grouping that puts as many edges as possible inside groups rather than
between them. It involves some randomness, so it's given a fixed seed to make
the result repeatable:

```python
import networkx as nx

def graph_communities(graph: dict, seed: int = 0) -> list[set]:
    """Groups of closely connected entities (Louvain community detection on the undirected graph),
    largest first."""
    undirected = nx.Graph()
    undirected.add_edges_from((subject, obj) for subject, _, obj in graph)
    communities = nx.community.louvain_communities(undirected, seed=seed)
    return sorted(communities, key=lambda c: (-len(c), sorted(c)))

def community_sources(graph: dict, community: set) -> list[str]:
    """The chunks behind every edge inside a community: what its summary, and any answer from it, rests on."""
    return sorted({s for (subject, _, obj), sources in graph.items()
                   if subject in community and obj in community for s in sources})
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

```python
graph = build_graph(load_graph_data()["triples"])
for number, community in enumerate(graph_communities(graph), 1):
    print(f"community {number}, {len(community)} entities: {', '.join(sorted(community))}\n")
```
```
community 1, 8 entities: AgentErrorRateHigh, INC-2041, Identity team, alert fired outside paging hours, so nobody was paged, an expired certificate in auth-service, auth-service, billing_agent, payments-gateway

community 2, 8 entities: INC-2093, SEC-014, a debug flag left on after an investigation, monitoring showed no agents while the registry was down, no alert on standby replication lag, standby replication lag that nothing alerted on, support_agent, triage_agent

community 3, 7 entities: INC-2067, Search team, a cache setting changed without review, kb-search, no alert fired; a user noticed the outdated results, nothing measures whether results are current, research_agent

community 4, 6 entities: Observability team, Platform team, RegistryUnreachable, monitoring, registry-api, registry-db

```
*(runs live, shows output — read-only demo snippet, not graded)*

Nobody told the algorithm about incidents, but each incident ended up at the
centre of its own community, with the services, agents, causes and monitoring
gaps around it. The fourth community is the platform's core. Community 2
joins INC-2093 and SEC-014, because both affected `support_agent`. The paper
goes further than this: it builds a *hierarchy* of communities, groups of
groups, and summarises each level, so a question can be answered at whatever
level of detail it needs. With 29 entities, one level is enough to see the
idea.

---

## A summary for each community

Each community is summarised once, at indexing time, by a model given its
entities and relationships. The prompt starts like this, and here are the four
summaries:

```python
graph_data = load_graph_data()
graph = build_graph(graph_data["triples"])
print(graph_data["community_prompt"].split("\n\n")[0], "\n")
for community in graph_communities(graph):
    anchor = next(name for name in graph_data["community_summaries"] if name in community)
    print(f"[{anchor}'s community, from {len(community_sources(graph, community))} chunks]")
    print(graph_data["community_summaries"][anchor], "\n")
```
```
These entities and relationships form one group in a graph built from the company's
documents. Summarise what the group is about in two or three sentences: the entities that matter
most, how they relate, and any incidents, causes or monitoring gaps it contains. 

[INC-2041's community, from 5 chunks]
billing_agent depends on payments-gateway, which checks every certificate with auth-service, owned by the Identity team. In INC-2041 an expired certificate in auth-service stopped billing_agent issuing invoices; AgentErrorRateHigh fired, but outside paging hours, so nobody was paged. 

[INC-2093's community, from 5 chunks]
support_agent, and triage_agent through it, were affected by two incidents. In INC-2093 standby replication lag that nothing alerted on stretched a registry failover to 42 minutes, and monitoring showed no agents while the registry was down. In SEC-014 a debug flag left on after an investigation wrote support_agent's registry key to its logs. 

[INC-2067's community, from 5 chunks]
research_agent depends on kb-search, owned by the Search team. In INC-2067 a cache setting changed without review made research_agent answer from outdated articles for a week; no alert fired, because nothing measures whether results are current. 

[registry-api's community, from 8 chunks]
registry-api, owned by the Platform team, depends on registry-db and auth-service. Monitoring, owned by the Observability team, gets its list of agents from registry-api, and RegistryUnreachable watches the registry. 

```
*(runs live, shows output — read-only demo snippet, not graded. The summaries are model-written for the course and replayed as stored text.)*

Each summary is built from the edges inside its community, and
`community_sources` keeps the chunk ids behind those edges, so anything said
from a summary can still be traced to the documents.

---

## Answering from every summary: map and reduce

The question goes to every community summary separately, the **map** step:
answer as far as this summary allows, and score how much it helps. The
partial answers that help are then combined, the **reduce** step. This is how
the paper's global search works:

```python
graph_data = load_graph_data()
graph = build_graph(graph_data["triples"])
question = "What recurring causes run through our incidents?"
MAP_PROMPT = ("Using only this summary of part of our documents, answer the question as far as it can. "
              "End with a line 'Score: N', from 0 to 100, for how much the summary helps answer it.\n\n"
              "Summary: {summary}\n\nQuestion: {question}")
REDUCE_PROMPT = "Combine these partial answers into one answer to the question.\n\n{partials}\n\nQuestion: {question}"

client = RecordingClient([
    [TextBlock("An expired certificate in auth-service, which nothing flagged before it failed (INC-2041). Score: 90")],
    [TextBlock("Standby replication lag that nothing alerted on (INC-2093), and a debug flag left on "
               "after an investigation (SEC-014). Score: 95")],
    [TextBlock("A cache setting changed without review (INC-2067). Score: 85")],
    [TextBlock("This part describes how services depend on each other, not what caused incidents. Score: 0")],
    [TextBlock("Two causes recur. Changes that were made and never checked or undone: a cache setting "
               "changed without review (INC-2067) and a debug flag left on (SEC-014). And conditions that "
               "drifted with nothing watching them: a certificate that expired (INC-2041) and standby "
               "replication lag (INC-2093). In each case, nothing alerted before the failure.")],
])
partials, used = [], []
for community in graph_communities(graph):
    anchor = next(name for name in graph_data["community_summaries"] if name in community)
    prompt = MAP_PROMPT.format(summary=graph_data["community_summaries"][anchor], question=question)
    reply = "".join(b.text for b in client.create([{"role": "user", "content": prompt}]).content if b.type == "text")
    score = int(reply.rsplit("Score:", 1)[1])
    print(f"map, {anchor}'s community: score {score}")
    if score > 0:
        partials.append((score, reply.rsplit("Score:", 1)[0].strip()))
        used.append(community)
partials.sort(reverse=True)
prompt = REDUCE_PROMPT.format(partials="\n".join(text for _, text in partials), question=question)
answer = "".join(b.text for b in client.create([{"role": "user", "content": prompt}]).content if b.type == "text")
sources = sorted({s for community in used for s in community_sources(graph, community)})
print(f"\nreduce: {answer}\n\nmodel calls: {client.call_count}; sources behind the answer: {sources}")

chunks = {f"{c['doc_id']}:{c['chunk']}": c for d in load_documents() for c in structured_chunks(d, 200)}
query = next(q for q in load_queries()["main"] if q["id"] == "q33")
print("those sources hold every labelled piece of the answer:", answerable([chunks[s] for s in sources], query))
```
```
map, INC-2041's community: score 90
map, INC-2093's community: score 95
map, INC-2067's community: score 85
map, registry-api's community: score 0

reduce: Two causes recur. Changes that were made and never checked or undone: a cache setting changed without review (INC-2067) and a debug flag left on (SEC-014). And conditions that drifted with nothing watching them: a certificate that expired (INC-2041) and standby replication lag (INC-2093). In each case, nothing alerted before the failure.

model calls: 5; sources behind the answer: ['D04:1', 'D04:3', 'D04:4', 'D09:0', 'D09:1', 'D09:2', 'D10:0', 'D10:1', 'D10:2', 'D11:1', 'D11:2', 'D12:0', 'D12:1']
those sources hold every labelled piece of the answer: True
```
*(runs live, shows output — read-only demo snippet, not graded. Every model reply is scripted: four partial answers with scores, and a final answer.)*

Three communities contributed and one was scored 0 and left out. The final
answer names a pattern no single document states: changes nobody checked,
and conditions nobody watched. Its sources are every chunk behind the three
communities used, and they contain all four labelled pieces of the answer,
where the pipeline's top ten contained three.

Three things to weigh, with this corpus's tiny size in mind:

- **It costs a model call per community, per question.** Here that's five
  calls. The paper's corpora have hundreds or thousands of communities, and
  it answers from a chosen level of the hierarchy to keep that manageable.
- **The summaries are fixed at indexing time.** A question they didn't
  anticipate gets whatever the summaries happened to include. The map step can
  only work with what each summary says.
- **Summaries mix sources, including restricted ones.** SEC-014 comes from a
  security-team report that only the security team may read. Its cause is now
  in a community summary, and in an answer anyone could have asked for.
  Derived data carries the permissions problem with it. Lesson 13 deals with
  that.

---

## Quiz cards

> **Q1.** What does community detection look for?
> - Groups of entities with more edges inside the group than between groups ✅
> - The entities mentioned most often
> - Chains of dependencies from one entity to another
> - Entities with the same relation type
>
> *Explanation: a community is a tightly connected group. Here each
> incident's services, agents, causes and gaps formed one, without the
> algorithm being told anything about incidents.*

> **Q2.** In the map step, why is each partial answer given a score?
> - So summaries that don't help can be left out, and the best combined first ✅
> - The score decides which community to summarise next
> - It measures how long the summary is
> - Scores replace the citations
>
> *Explanation: the platform community scored 0 for a question about
> incident causes, so it didn't dilute the final answer.*

> **Q3.** What's the main cost of answering a global question this way?
> - A model call for every community, for every question, on top of summarising them all in advance ✅
> - Rebuilding the graph for each question
> - Re-embedding every chunk
> - Nothing: summaries make global questions free
>
> *Explanation: the summaries are paid for once, at indexing time, and
> each global question then pays a call per community used. The paper uses a
> hierarchy of communities to control that.*

> **Q4.** Why does SEC-014 appearing in a community summary matter?
> - It comes from a restricted document, and the summary could reach people not allowed to read it ✅
> - SEC-014 isn't an incident
> - Summaries can't mention security reports
> - It makes the community too large
>
> *Explanation: a summary is new text derived from its sources, and it
> doesn't carry their permissions unless someone makes it. Retrieval has to
> filter derived data too.*
