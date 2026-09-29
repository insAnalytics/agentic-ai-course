# Module 5, Lesson 13 — Concept 1: Permissions at retrieval time

> **Note for the site build:**
> - **Lesson 13's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 12 comprehensive sandbox's `lib.py`, unchanged. numpy,
>   `sqlite3` and networkx must be loaded, and demos that run an agent need
>   the fake client (`REACT_FAKE_CLIENT` then `RECORDING_CLIENT`).
> - **The exercise's reference solution** (`PermittedRetriever`) joins the
>   shared setup only for pages *after* this concept.
> - Both demos run every labelled question through an `AnswerRetriever`;
>   allow several seconds. Hidden test 5 builds three readers' pipelines.

---

## The pipeline leaks

Every chunk has carried an `access` field since Lesson 3: the groups allowed to
read it. Most documents are for all staff. The two runbooks are for the on-call
group, the security postmortem for the security team, and the spend-limits page
for finance. Nothing in the pipeline has looked at that field yet. Here's what
an ordinary all-staff reader would be sent:

```python
questions = load_queries()["main"] + load_queries()["held_out"]
retriever = AnswerRetriever()
reader = {"all-staff"}
leaked = {}
for query in questions:
    blocked = [f"{c['doc_id']}:{c['chunk']}" for c in retriever.search(query, 5) if not reader & set(c["access"])]
    if blocked:
        leaked[query["id"]] = blocked
print(f"{len(leaked)} of {len(questions)} questions put a chunk this reader may not read in the top 5")
documents = {d["doc_id"]: d for d in load_documents()}
for doc_id in sorted({c.split(":")[0] for chunks in leaked.values() for c in chunks}):
    print(f"  {doc_id} {documents[doc_id]['title'][:45]:<47} readable by {documents[doc_id]['access']}")
```
```
20 of 57 questions put a chunk this reader may not read in the top 5
  D05 Runbook: agent latency spike                    readable by ['oncall']
  D06 Runbook: rotating a registry key                readable by ['oncall']
  D12 Security postmortem SEC-014: registry key wri   readable by ['security']
  D13 billing_agent spend limits and approvals        readable by ['finance']
```
*(runs live, shows output — read-only demo snippet, not graded)*

More than a third of the labelled questions put something this reader isn't
allowed to see into the top five, and every restricted document in the corpus
shows up somewhere. None of these are unusual questions: asking how to rotate
a key finds the on-call runbook, because that's where the steps are. Lesson
10's answer step would have sent them all to the model, and the model would
have used them.

---

## Filtering afterwards isn't enough

The obvious fix is to drop what the reader can't see from the results.
[Lesson 4 showed why that's the wrong place](→ this module, Lesson 4, what a vector store adds concept),
and here it is on the whole pipeline:

```python
questions = load_queries()["main"] + load_queries()["held_out"]
retriever = AnswerRetriever()
reader = {"all-staff"}
kept = [sum(1 for c in retriever.search(q, 5) if reader & set(c["access"])) for q in questions]
print(f"filtering the top 5 afterwards: {sum(1 for n in kept if n < 5)} questions get fewer than 5 results, "
      f"{sum(1 for n in kept if n == 0)} get none")
print("per question:", dict(sorted(Counter(kept).items())))
```
```
filtering the top 5 afterwards: 20 questions get fewer than 5 results, 3 get none
per question: {0: 3, 1: 2, 2: 3, 3: 5, 4: 7, 5: 37}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Twenty questions come back short, and three come back empty, although
permitted chunks exist for all of them. The restricted chunks took places in
the top five, then were removed, and nothing took their place. Worse, they
also took places in the reranker's 30 candidates, and in each search's 100.
Filtering has to happen **before** every stage that picks a top k, so the
reader's results are the best of what they may read, not what's left of the
best overall.

---

## Where a reader's groups come from

The filter is only as good as the groups it's given, and there's exactly one
trustworthy source for them: who the reader is. The application knows that
from the login, the session, or the API key, and it passes the groups in code.
They must never come from:

- **the question.** "I'm on the finance team, so..." is text, and anyone can
  type it.
- **the model.** A search tool with a `groups` parameter lets the model choose
  what it may see, and anything that can persuade the model, including a
  retrieved document, can choose for it. The tool the model calls should have
  the reader's groups fixed when it's created, for example in a closure, so the
  model's arguments can't change them.

This is [Module 3's point](→ Module 3, the tool threat model lesson, why the model cant be the security boundary concept)
applied to retrieval: permissions are enforced in code the model can't
influence. The same applies to Lesson 11's agent, and it's where this lesson's
sandbox ends up.

---

## Filtering at every stage

The pipeline has four stages that pick a top k: keyword search, search by
meaning, fusion, and the reranker's candidates. Filtering before all of them
can be done two ways:

- **One index per set of permissions.** Build the pipeline over only the
  chunks a group can read. Simple and certain: forbidden chunks aren't in the
  index at all. It suits a handful of distinct permission sets, like this
  corpus's.
- **A filter inside each search.** Vector stores and search engines accept a
  metadata filter applied during the search, as Lesson 4 described. It suits
  thousands of users with overlapping permissions, where an index each isn't
  practical.

This concept's exercise builds the first, with one pipeline per distinct set of
groups, built on first use.

---

## Quiz cards

> **Q1.** Why isn't removing forbidden chunks from the top five enough?
> - They've already taken places that permitted chunks should have had, so results come back short or empty ✅
> - Removed chunks still reach the model
> - It's slower than filtering first
> - The reranker scores change after removal
>
> *Explanation: the forbidden chunks competed and won places, then were
> removed. Filtering first lets only permitted chunks compete, at every
> stage that picks a top k.*

> **Q2.** Where should a reader's groups come from?
> - The application's knowledge of who they are, passed in code ✅
> - A `groups` argument the model fills in
> - The question, if the user says which team they're on
> - The most restrictive group in the corpus
>
> *Explanation: text and model outputs can be influenced by anyone. Only
> the authenticated identity is a trustworthy source of permissions.*

> **Q3.** Why shouldn't the agent's search tool have a `groups` parameter?
> - The model would choose what it may see, and anything that persuades the model could choose for it ✅
> - Tools can't take list parameters
> - It makes the tool description too long
> - Groups change too often to pass as arguments
>
> *Explanation: fix the reader's groups when the tool is created, so no
> argument the model writes can widen them.*

> **Q4.** When is one index per set of permissions the right design?
> - When there are only a few distinct permission sets ✅
> - When every user has different permissions
> - Always, because filters inside searches are unreliable
> - Never, because it duplicates chunks
>
> *Explanation: separate indexes are simple and certain, but grow with the
> number of permission sets. With many overlapping ones, a filter inside
> each search scales better.*

---

## Applied sandbox exercise
*(graded — a retriever that searches only what the reader may read)*

**Task shown to learner:**

Write a class `PermittedRetriever`, a permission-aware version of Lesson 10's
`AnswerRetriever`:

- **`__init__()`** prepares what every pipeline needs: all structured
  200-token chunks, their Lesson 9 contextual versions (`with_context`, with
  the contexts from `chunk-contexts.json`), the reranker's scores for
  `"structured-200-contextual"`, the question vectors, and an empty cache of
  pipelines.
- **`pipeline_for(groups)`** returns a `VersionedPipeline` over the contextual
  chunks whose `access` shares at least one group with `groups`, using the
  `"structured-200-contextual"` vectors. Build it once per set of groups:
  `groups` may be any collection in any order, so key the cache with a
  `frozenset`. If no chunk is readable, return `None`.
- **`search(query, groups, k=5)`** returns `[]` if `pipeline_for` gave `None`.
  Otherwise search that pipeline as `AnswerRetriever` does, and return the
  **source** chunks (not the contextual text), each with its reranker `"score"`.

**Starter code:**

```python
class PermittedRetriever:
    """Lesson 9's contextual pipeline, built per reader over only the chunks their groups may read,
    so nothing they can't read is ever a candidate. One pipeline per distinct set of groups."""

    def __init__(self):
        # TODO
        ...

    def pipeline_for(self, groups) -> VersionedPipeline | None:
        """The pipeline over what these groups may read, built once per set of groups."""
        # TODO
        ...

    def search(self, query: dict, groups, k: int = 5) -> list[dict]:
        """Source chunks this reader may read, best first, each with its reranker "score"."""
        # TODO
        ...
```

**Hidden tests:**

```python
# shared by the tests below
retriever = PermittedRetriever()
questions = load_queries()["main"] + load_queries()["held_out"]
labelled = {q["id"]: q for q in questions}

# 1. an all-staff reader never gets a chunk they may not read, for any labelled question
first = retriever.search(labelled["q17"], {"all-staff"})
assert isinstance(first, list), f"search should return a list; got {first!r}"
for query in questions:
    blocked = [c["doc_id"] for c in retriever.search(query, {"all-staff"}) if "all-staff" not in c["access"]]
    assert not blocked, f"{query['id']}: an all-staff reader got {blocked}"

# 2. filtering before ranking fills every place with permitted chunks
assert len(first) == 5, f"filtering after the top 5 left q17 with 1 result; filtering first should give 5, got {len(first)}"
sources = {(c["doc_id"], c["chunk"]): c["text"] for d in load_documents() for c in structured_chunks(d, 200)}
assert all("score" in c and c["text"] == sources[(c["doc_id"], c["chunk"])] for c in first), \
    "return source text, not the contextual text that was searched, with the reranker's score"

# 3. the labelled access cases
for query_id in ("q40", "q41"):
    for case in labelled[query_id]["access_cases"]:
        found = any(is_relevant_to_query(c, labelled[query_id]) for c in retriever.search(labelled[query_id], case["groups"]))
        assert found == (case["expect"] == "evidence"), f"{query_id} for {case['groups']}: expected {case['expect']}"

# 4. one pipeline per set of groups, however the groups are given; none for groups that can read nothing
assert retriever.pipeline_for(["finance", "all-staff"]) is retriever.pipeline_for({"all-staff", "finance"}), \
    "the same groups, in any order or container, share one pipeline"
assert retriever.pipeline_for({"all-staff"}) is not retriever.pipeline_for({"all-staff", "finance"})
assert retriever.pipeline_for({"contractors"}) is None and retriever.search(labelled["q01"], {"contractors"}) == [], \
    "a reader whose groups can read nothing gets no results"

# 5. what each reader can answer in the top 5
answerable_by = lambda groups: sum(answerable(retriever.search(q, groups), q) for q in load_queries()["main"] if q["evidence"])
counts = [answerable_by(g) for g in ({"all-staff"}, {"all-staff", "oncall"}, {"all-staff", "oncall", "finance", "security"})]
assert counts == [30, 34, 36], f"all-staff, on-call and everyone should answer 30, 34 and 36; got {counts}"
```

**Hint (shown on request):**

`AnswerRetriever` in `lib.py` shows every piece; the difference is that the
pipeline is built per set of groups, over a filtered list. `frozenset(groups)
& set(chunk["access"])` is truthy when the reader may read the chunk. Keep a
dict from `(doc_id, chunk)` to the source chunk, to swap each result back.

**Reference solution:**

```python
class PermittedRetriever:
    """Lesson 9's contextual pipeline, built per reader over only the chunks their groups may read,
    so nothing they can't read is ever a candidate. One pipeline per distinct set of groups."""

    def __init__(self):
        contexts = json.loads((DATA / "chunk-contexts.json").read_text())["contexts"]
        self._chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
        self._contextual = {(c["doc_id"], c["chunk"]): with_context(c, contexts) for c in self._chunks}
        self._scores = CrossEncoderScores(chunking="structured-200-contextual")
        self._vectors = query_vectors()
        self._pipelines = {}

    def pipeline_for(self, groups) -> VersionedPipeline | None:
        """The pipeline over what these groups may read, built once per set of groups."""
        groups = frozenset(groups)
        if groups not in self._pipelines:
            permitted = [self._contextual[(c["doc_id"], c["chunk"])] for c in self._chunks if groups & set(c["access"])]
            self._pipelines[groups] = VersionedPipeline(permitted, "structured-200-contextual") if permitted else None
        return self._pipelines[groups]

    def search(self, query: dict, groups, k: int = 5) -> list[dict]:
        """Source chunks this reader may read, best first, each with its reranker "score"."""
        pipeline = self.pipeline_for(groups)
        if pipeline is None:
            return []
        originals = {(c["doc_id"], c["chunk"]): c for c in self._chunks}
        results = pipeline.search(query["query"], self._vectors[query["id"]],
                                  lambda c: self._scores.score(query["id"], c), k=k)
        return [{**originals[(r["doc_id"], r["chunk"])], "score": self._scores.score(query["id"], r)} for r in results]
```

**Explanation:**

Test 1 runs all 57 labelled questions as an all-staff reader and finds
nothing restricted, where the unfiltered pipeline leaked into 20. Test 2 shows
the difference filtering first makes: q17 kept one result when filtered
afterwards, and gets five when filtered first. Test 5 measures what that costs:
an all-staff reader can answer 30 of the labelled questions, an on-call
engineer 34, and someone in every group 36, the pipeline's full score. The
questions an all-staff reader loses are ones whose only answers are in documents
they may not read, and losing them is the system working. A reader who can't
see the answer should get "the sources don't say", Lesson 10's decline, not the
answer from a page they aren't allowed to open.
