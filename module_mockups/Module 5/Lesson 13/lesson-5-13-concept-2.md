# Module 5, Lesson 13 — Concept 2: Derived data carries its sources' permissions

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `PermittedRetriever`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `CHUNK_ACCESS` and `readable`, exactly as in the first
>   code block below.
> - **The exercise's reference solution** (`graph_for_reader`,
>   `summaries_for_reader`) joins the shared setup only for pages *after* this
>   concept. networkx must be loaded.

---

## Everything built from a restricted document

Filtering chunks protects the chunks. But this module has built a lot of other
things out of them: Lesson 9's contexts, Lesson 4's vectors, Lesson 12's graph
edges and community summaries. Each is new text or data derived from the
documents, and each carries some of what its sources said. Here's how much of
it comes from documents an all-staff reader may not see:

```python
CHUNK_ACCESS = {f"{c['doc_id']}:{c['chunk']}": set(c["access"])
                for d in load_documents() for c in structured_chunks(d, 200)}

def readable(chunk_id: str, groups) -> bool:
    """Whether a reader with these groups may read the chunk with this id."""
    return bool(set(groups) & CHUNK_ACCESS[chunk_id])
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

```python
contexts = json.loads((DATA / "chunk-contexts.json").read_text())["contexts"]
graph_data = load_graph_data()
graph = build_graph(graph_data["triples"])
restricted = {chunk_id for chunk_id, access in CHUNK_ACCESS.items() if "all-staff" not in access}

print(f"Lesson 9: {sum(1 for key in contexts if key in restricted)} model-written contexts describe restricted chunks, e.g.")
print(f"  D12:0 -> {contexts['D12:0'][:110]}...")
edges = [edge for edge, sources in graph.items() if any(s in restricted for s in sources)]
print(f"Lesson 12: {len(edges)} graph edges come from restricted chunks: {edges}")
for community in graph_communities(graph):
    sources = community_sources(graph, community)
    hidden = [s for s in sources if s in restricted]
    anchor = next(name for name in graph_data["community_summaries"] if name in community)
    print(f"  {anchor}'s community summary rests on {len(sources)} chunks, {len(hidden)} restricted {hidden}")
```
```
Lesson 9: 17 model-written contexts describe restricted chunks, e.g.
  D12:0 -> Summary of security postmortem SEC-014: support_agent's write-scoped registry key was found in plain text in i...
Lesson 12: 2 graph edges come from restricted chunks: [('SEC-014', 'affected', 'support_agent'), ('SEC-014', 'root_cause', 'a debug flag left on after an investigation')]
  INC-2041's community summary rests on 5 chunks, 0 restricted []
  INC-2093's community summary rests on 5 chunks, 2 restricted ['D12:0', 'D12:1']
  INC-2067's community summary rests on 5 chunks, 0 restricted []
  registry-api's community summary rests on 8 chunks, 0 restricted []
```
*(runs live, shows output — read-only demo snippet, not graded)*

The context for the SEC-014 report's first chunk restates its finding in one
sentence. Two graph edges exist only because of that report. And the INC-2093
community's summary, written from all the edges in its community, repeats
SEC-014's cause in plain words. None of these is a chunk, so none of them is
stopped by a chunk filter unless someone decides it should be.

---

## Rules for each kind of derived data

The principle is that **derived data inherits the permissions of what it was
derived from.** How that works depends on what it was derived from:

- **Derived from one chunk:** a context, a vector, a header. It gets the chunk's
  access, and it's filtered with the chunk. `PermittedRetriever` already does
  this, because each reader's pipeline is built from permitted chunks, with
  their contexts and vectors. Vectors deserve the same care as text: Morris
  and colleagues (EMNLP 2023) recovered 92% of 32-token inputs *exactly* from
  their embeddings, and concluded embeddings should be protected like the text
  they came from.
- **Derived from several chunks, each enough on its own:** a graph edge. If
  one source a reader may read states the fact, the reader may know it. So an
  edge is visible when at least one of its sources is readable, and it shows
  only those sources.
- **Derived from several chunks together:** a summary. It can repeat anything
  from any of its sources, so a reader may see it only if they may read
  *every* source. The alternative is to write a separate summary for each
  permission level, which multiplies the summaries' cost by the number of
  levels.
- **Caches of any of these.** A cached answer or a cached prompt prefix built
  for one reader must never be served to another with different permissions,
  which is why Lesson 1 noted that pasting a corpus means a separate cached
  prefix per set of permissions. Key every cache by the permission set as well
  as the question.

---

## Quiz cards

> **Q1.** Why isn't filtering chunks enough to protect a restricted
> document?
> - Contexts, vectors, graph edges and summaries derived from it can carry its content too ✅
> - Chunk filters only work on text
> - Restricted documents aren't chunked
> - The reranker bypasses the filter
>
> *Explanation: every artifact built from a document holds some of what it
> said. Each one needs the permissions of its sources applied to it.*

> **Q2.** A graph edge comes from one all-staff chunk and one security-only
> chunk. May an all-staff reader see it?
> - Yes, with only the all-staff chunk as its source ✅
> - No, because one source is restricted
> - Yes, with both sources shown
> - Only if the security team approves
>
> *Explanation: the fact is stated in a document the reader may read, so
> they may know it. The restricted source's id, and anything only it says,
> stays hidden.*

> **Q3.** Why must a reader be able to read *every* source of a summary?
> - A summary can repeat anything from any of its sources ✅
> - Summaries are longer than edges
> - Summaries are written by a model
> - Only complete summaries can be cited
>
> *Explanation: the INC-2093 summary repeats SEC-014's cause. If any source
> is off-limits, the summary may be too.*

> **Q4.** Why should embeddings of restricted text be protected like the
> text?
> - Research has recovered short texts exactly from their embeddings ✅
> - Embeddings are larger than the text
> - Vector stores don't support permissions
> - Embeddings can't be deleted
>
> *Explanation: Morris and colleagues recovered 92% of 32-token inputs
> exactly. A vector is a form of the text, not an anonymous number.*

---

## Applied sandbox exercise
*(graded — the graph and its summaries as one reader may see them)*

**Task shown to learner:**

Write two functions. `readable(chunk_id, groups)` says whether a reader may
read a chunk.

**`graph_for_reader(graph, groups)`** takes a graph from `build_graph` and
returns it as this reader may see it: each edge keeps only its readable
sources, in their original order, and an edge left with none is dropped.

**`summaries_for_reader(graph, groups, summaries)`** takes the full graph and
the stored community summaries, keyed by one entity in each community. Find
the communities with `graph_communities(graph)`; for each, the summary's key is
the first name in `summaries` that's in the community. Return the summaries,
keyed the same way, for communities where the reader may read every chunk in
`community_sources(graph, community)`. Skip a community with no summary.

**Starter code:**

```python
def graph_for_reader(graph: dict, groups) -> dict:
    """The graph as this reader may see it: each edge keeps only the sources they may read,
    and an edge with no readable source is dropped."""
    # TODO
    ...

def summaries_for_reader(graph: dict, groups, summaries: dict) -> dict:
    """The community summaries this reader may see: only those whose every source they may read,
    since a summary can repeat anything it was written from. Keyed like `summaries`."""
    # TODO
    ...
```

**Hidden tests:**

```python
# shared by the tests below
graph_data = load_graph_data()
graph = build_graph(graph_data["triples"])
summaries = graph_data["community_summaries"]

# 1. each edge keeps only readable sources; an edge with none left is dropped
toy = {("a", "depends_on", "b"): ["D04:2", "D12:1"], ("c", "depends_on", "d"): ["D12:0"], ("e", "fired", "f"): ["D09:1"]}
seen = graph_for_reader(toy, {"all-staff"})
assert isinstance(seen, dict), f"graph_for_reader should return a dict; got {seen!r}"
assert seen == {("a", "depends_on", "b"): ["D04:2"], ("e", "fired", "f"): ["D09:1"]}, seen
assert graph_for_reader(toy, {"security"}) == {("a", "depends_on", "b"): ["D12:1"], ("c", "depends_on", "d"): ["D12:0"]}
assert graph_for_reader(toy, set()) == {}, "a reader with no groups sees nothing"

# 2. the real graph: SEC-014 disappears for all staff, and nothing else changes
staff = graph_for_reader(graph, {"all-staff"})
assert len(staff) == 33 and not any("SEC-014" in edge for edge in staff), f"33 edges, none about SEC-014; got {len(staff)}"
assert graph_for_reader(graph, {"all-staff", "security"}) == graph, "a security reader sees the whole graph"
assert affected_by(staff, "auth-service") == affected_by(graph, "auth-service"), \
    "the auth-service chain rests only on all-staff documents, so it's unchanged"

# 3. a summary is shown only if the reader may read every source it was written from
shown = summaries_for_reader(graph, {"all-staff"}, summaries)
assert isinstance(shown, dict) and sorted(shown) == ["INC-2041", "INC-2067", "registry-api"], \
    f"INC-2093's summary rests on SEC-014's report, so all staff don't see it; got {sorted(shown)}"
assert shown["INC-2041"] == summaries["INC-2041"]
assert sorted(summaries_for_reader(graph, {"all-staff", "security"}, summaries)) == ["INC-2041", "INC-2067", "INC-2093", "registry-api"]
assert summaries_for_reader(graph, {"all-staff"}, {}) == {}, "no summaries, nothing shown"
```

**Hint (shown on request):**

`graph_for_reader` is one filtered list per edge. For summaries,
`next((name for name in summaries if name in community), None)` finds the key or
`None`, and `all(...)` checks every source. Use the full graph for both the
communities and their sources: the summaries were written from the full graph.

**Reference solution:**

```python
def graph_for_reader(graph: dict, groups) -> dict:
    """The graph as this reader may see it: each edge keeps only the sources they may read,
    and an edge with no readable source is dropped."""
    visible = {}
    for edge, sources in graph.items():
        permitted = [s for s in sources if readable(s, groups)]
        if permitted:
            visible[edge] = permitted
    return visible

def summaries_for_reader(graph: dict, groups, summaries: dict) -> dict:
    """The community summaries this reader may see: only those whose every source they may read,
    since a summary can repeat anything it was written from. Keyed like `summaries`."""
    shown = {}
    for community in graph_communities(graph):
        anchor = next((name for name in summaries if name in community), None)
        if anchor and all(readable(s, groups) for s in community_sources(graph, community)):
            shown[anchor] = summaries[anchor]
    return shown
```

**Explanation:**

For an all-staff reader the graph loses two edges, both about SEC-014, and
keeps 33. The auth-service chain is untouched, because every link in it comes
from documents all staff may read, so the traversal answer from Lesson 12
survives filtering. Three of the four community summaries are shown; INC-2093's
isn't, because it rests on SEC-014's report. The hint's last line matters. It's
tempting to filter the graph first and then find communities in what's left:
INC-2093's community would then contain no restricted edges, and its stored
summary would be shown, still quoting SEC-014's cause, because it was written
from the full graph. A summary's permissions come from what it was written
from, not from the graph it's displayed next to.
