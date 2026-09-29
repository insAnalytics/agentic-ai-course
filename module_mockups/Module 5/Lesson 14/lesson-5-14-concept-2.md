# Module 5, Lesson 14 — Concept 2: Meaning alongside keywords, fused

> **Note for the site build:**
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `text_vectors`, `task_vectors`, `fuse`, `by_meaning` and
>   `by_keywords`, exactly as in the first code block below.
> - **Data:** `context-step-texts.json` and `context-step-queries.json`, under
>   `embeddings/bge-small-en-v1.5/`.
> - **The exercise's reference solution** (`hybrid_search`) joins the shared
>   setup only for pages *after* this concept.

---

## One helper, two rankings

Lesson 6 answered the question this lesson asks: when keyword search and search
by meaning each catch what the other misses, run both and
[fuse their rankings](→ this module, Lesson 6, fusing rankings concept)
with reciprocal rank fusion. Nothing about that is specific to document
chunks. Tools, memories and anything else with text can be ranked both ways
and fused, so the same few functions upgrade every matcher in Module 4:

```python
def text_vectors(texts: list[str]) -> np.ndarray:
    """bge-small's stored embeddings of the lesson's texts, as documents, looked up by exact text."""
    return vectors_for([{"text": t} for t in texts], chunking="context-step-texts")

def task_vectors() -> dict[str, np.ndarray]:
    """bge-small's embeddings of the lesson's tasks, with its retrieval instruction, by task id."""
    stored = json.loads((EMBEDDINGS / "bge-small-en-v1.5" / "context-step-queries.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored["instructed"], stored["dim"])))

def fuse(rankings: list[list[str]], k: int = 60) -> list[str]:
    """Reciprocal rank fusion (Lesson 6) over rankings of ids: each id scores 1 / (k + rank) per ranking."""
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, item in enumerate(ranking, 1):
            scores[item] += 1 / (k + rank)
    return sorted(scores, key=lambda item: -scores[item])

def by_meaning(query_vector: np.ndarray, items: list[str], vectors: np.ndarray) -> list[str]:
    """Every item, most similar in meaning to the query first."""
    order = np.argsort(-(vectors @ query_vector), kind="stable")
    return [items[i] for i in order]

def by_keywords(query: str, items: dict[str, str]) -> list[str]:
    """Items sharing at least one of Module 4's keywords with the query, most shared first, ties in order."""
    wanted = m4_keywords(query)
    scored = [(len(wanted & m4_keywords(text)), item) for item, text in items.items()]
    return [item for score, item in sorted([p for p in scored if p[0]], key=lambda p: -p[0])]
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

The vectors are stored, as everywhere in this module: the lesson's tools,
memories and tasks were embedded with bge-small in advance, since this page's
browser can't run the embedding model on new text. A deployed agent would
embed a memory when it's saved and a task when it arrives.

---

## Finding tools, fused

Here are four ways to find tools for the twelve tasks:

```python
data = load_context_step()
tools, vectors = data["tools"], task_vectors()
tool_vectors = text_vectors(list(tools.values()))
approaches = {
    "Module 4's find_tools": lambda t: m4_find_tools(tools, t["task"]),
    "by meaning": lambda t: by_meaning(vectors[t["id"]], list(tools), tool_vectors)[:3],
    "fused with find_tools": lambda t: fuse([m4_find_tools(tools, t["task"], limit=40),
                                             by_meaning(vectors[t["id"]], list(tools), tool_vectors)])[:3],
    "fused with keywords": lambda t: fuse([by_keywords(t["task"], tools),
                                           by_meaning(vectors[t["id"]], list(tools), tool_vectors)])[:3],
}
print(f"{'':<24}{'own words':>11}{'other words':>13}   (right service in the top 3)")
for name, find in approaches.items():
    hits = [t for t in data["tool_tasks"] if any(n.startswith(t["server"] + "__") for n in find(t))]
    own = sum(t["worded"] for t in hits)
    print(f"{name:<24}{f'{own} of 5':>11}{f'{len(hits) - own} of 7':>13}")
```
```
                          own words  other words   (right service in the top 3)
Module 4's find_tools        5 of 5       1 of 7
by meaning                   4 of 5       5 of 7
fused with find_tools        5 of 5       2 of 7
fused with keywords          5 of 5       4 of 7
```
*(runs live, shows output — read-only demo snippet, not graded)*

Search by meaning alone finds five of the seven tasks in other words, but it
loses one in the tools' own words: "What alerts are firing?" lands on registry
tools. Fusing it with Module 4's `find_tools` barely helps, and the reason is
worth seeing. `find_tools` gives almost every tool a point, as the previous
concept showed, so its "ranking" is the catalog order, and fusing a ranking
with noise mostly adds noise. Fusing with a ranking that means something,
Module 4's own `keywords` from Lesson 8, whole words with common ones dropped,
keeps every own-words task and gains four in other words.

Fusion is only as good as the rankings it combines, which is also why Lesson 6
fused BM25 rather than raw word counts. With twelve tasks, one either way is
within noise; the pattern is what matters.

---

## Recalling memories, fused

The same helpers upgrade `recall`:

```python
data = load_context_step()
memories = {m["id"]: m["content"] for m in data["memories"]}
vectors, memory_vectors = task_vectors(), text_vectors(list(memories.values()))
approaches = {
    "Module 4's recall": lambda t: m4_recall(list(memories.values()), t["task"]),
    "by meaning": lambda t: by_meaning(vectors[t["id"]], list(memories.values()), memory_vectors)[:3],
    "fused": lambda t: fuse([[memories[i] for i in by_keywords(t["task"], memories)],
                             by_meaning(vectors[t["id"]], list(memories.values()), memory_vectors)])[:3],
}
print(f"{'':<20}{'own words':>11}{'other words':>13}   (a relevant memory in the top 3)")
for name, recall in approaches.items():
    hits = [t for t in data["recall_tasks"] if set(recall(t)) & {memories[i] for i in t["relevant"]}]
    own = sum(t["worded"] for t in hits)
    print(f"{name:<20}{f'{own} of 5':>11}{f'{len(hits) - own} of 7':>13}")
task = next(t for t in data["recall_tasks"] if t["id"] == "r12")
print(f"\n{task['task']!r}, fused -> {approaches['fused'](task)}")
```
```
                      own words  other words   (a relevant memory in the top 3)
Module 4's recall        5 of 5       4 of 7
by meaning               5 of 5       6 of 7
fused                    5 of 5       6 of 7

'Who do I report to?', fused -> ['support_agent status notes go to Priya weekly.', "The user drafts incident reports in the team's wiki template.", 'Priya owns support_agent.']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Meaning and fusion both find a relevant memory for eleven of twelve tasks,
where keywords found nine. The twelfth shows what fusion doesn't fix. Module 4's
`recall` returned nothing for "Who do I report to?", which was at least honest.
Search by meaning always returns its top three, however weak, and here they're
three memories about support_agent and reports, none of them the manager. A
ranking has no notion of "nothing relevant". The fix is the one Lesson 10 used:
a floor on similarity, measured on labelled examples, below which the answer is
"nothing found". The next concept chooses exactly that kind of threshold, for
duplicates.

---

## Quiz cards

> **Q1.** Why did fusing with Module 4's `find_tools` barely help?
> - Its ranking was nearly the catalog order, and fusing with noise adds noise ✅
> - Fusion only works on documents
> - `find_tools` returns too few tools to fuse
> - Search by meaning was already perfect
>
> *Explanation: almost every tool scored one point, so the order carried
> no information. A keyword ranking with real signal, like whole-word
> overlap, fused well.*

> **Q2.** Search by meaning alone missed "What alerts are firing?". Why keep
> keywords at all?
> - Tasks using the exact words, like "alerts", are what keywords catch reliably ✅
> - Keywords are cheaper to store
> - Meaning search can't handle questions
> - Fusion needs at least two rankings of any kind
>
> *Explanation: the same trade as Lesson 6. Each method catches what the
> other misses, and fusing them keeps both strengths.*

> **Q3.** For "Who do I report to?", keyword recall returned nothing and
> search by meaning returned three irrelevant memories. Which was better, and
> what's the fix?
> - Nothing was more honest; a similarity floor lets meaning search say "nothing found" too ✅
> - The three memories, since some answer beats none
> - Neither; recall should always return all memories
> - Keywords, and meaning search should be removed
>
> *Explanation: a ranking always has a top three. A threshold, measured on
> labelled examples, is what separates relevant from merely nearest.*

> **Q4.** Why are the tasks' vectors stored rather than computed?
> - The page's browser can't run the embedding model, so everything was embedded in advance ✅
> - Tasks can't be embedded at run time
> - Stored vectors are more accurate
> - Fusion needs identical vectors every run
>
> *Explanation: a deployed agent embeds memories when they're saved and
> tasks as they arrive. The page stands in for that with stored vectors.*

---

## Applied sandbox exercise
*(graded — Module 4's store search, with meaning alongside keywords)*

**Task shown to learner:**

Write `hybrid_search(memories, query, query_vector, vectors, limit=5,
kind=None, tags=None)`, Module 4's `MemoryStore.search` with search by
meaning added. Each memory is a dict with `"id"`, `"content"`, `"type"`,
`"tags"` and `"created"`; `vectors` maps a memory's content to its vector.

- **Filter first:** keep memories of `kind` (when given) sharing at least one
  of `tags` (when given), and order them newest first by `"created"`.
- **With no query, or nothing left,** return the first `limit` of those.
- **Otherwise,** make two rankings of the memories' ids, both over the
  filtered, newest-first list:
  - by keywords, with `by_keywords`, over each memory's content and tags joined
    with spaces, as Module 4's store matched them;
  - by meaning, with `by_meaning`, over each memory's content vector.

  Fuse them with `fuse` and return the first `limit` memories, as records.

**Starter code:**

```python
def hybrid_search(memories: list[dict], query: str, query_vector, vectors: dict, limit: int = 5,
                  kind: str | None = None, tags: list | None = None) -> list[dict]:
    """Module 4's store search with meaning alongside keywords: filter by kind and tags, then fuse a
    keyword ranking (content and tags) with a ranking by meaning (content). No query: newest first."""
    # TODO
    ...
```

**Hidden tests:**

```python
# shared by the tests below
data = load_context_step()
memories = data["memories"]
vectors = dict(zip([m["content"] for m in memories], text_vectors([m["content"] for m in memories])))
tasks = task_vectors()
ids = lambda found: [m["id"] for m in found]

# 1. no query: newest first, filtered, at most limit
found = hybrid_search(memories, "", None, vectors, limit=3)
assert isinstance(found, list), f"hybrid_search should return a list; got {found!r}"
assert ids(found) == ["m24", "m10", "m19"], f"with no query, the newest first; got {ids(found)}"
assert ids(hybrid_search(memories, "", None, vectors, kind="procedural", limit=2)) == ["m22", "m20"], \
    "kind filters by type, newest first"
assert ids(hybrid_search(memories, "", None, vectors, tags=["kb-search"])) == ["m13", "m12"], \
    "tags filter: any shared tag"
assert ids(hybrid_search(memories, "", None, vectors, tags=["incident", "registry"])) == ["m10", "m19", "m09", "m23", "m22"], \
    "a memory with any one of the tags counts"

# 2. with a query: the two rankings fused, by Lesson 6's rule
task = next(t for t in data["recall_tasks"] if t["id"] == "r06")
found = hybrid_search(memories, task["task"], tasks["r06"], vectors, limit=3)
assert ids(found) == ["m08", "m07", "m04"], \
    f"keywords put the model memory first and meaning finds the deadline; got {ids(found)}"
assert all(isinstance(m, dict) and "content" in m for m in found), "return the memory records"

assert hybrid_search(memories, "units", tasks["t09"], vectors, limit=3)[0]["id"] == "m20", \
    "keywords match tags as well as content, as Module 4's store did"

# 3. filters apply before ranking
procedural = hybrid_search(memories, "How should I format my reply to this user?", tasks["r07"], vectors,
                           kind="procedural", limit=5)
assert all(m["type"] == "procedural" for m in procedural) and len(procedural) == 5, ids(procedural)
assert hybrid_search(memories, "anything", tasks["r01"], vectors, tags=["no-such-tag"]) == []

# 4. the recall tasks: a relevant memory in the top 3 for 11 of 12
hits = sum(bool(set(ids(hybrid_search(memories, t["task"], tasks[t["id"]], vectors, limit=3))) & set(t["relevant"]))
           for t in data["recall_tasks"])
assert hits == 11, f"fused store search should find a relevant memory for 11 of the 12 recall tasks; got {hits}"
```

**Hint (shown on request):**

Build a dict from id to memory for the filtered list, so the fused ids turn
back into records. `np.array([vectors[m["content"]] for m in newest_first])`
gives `by_meaning` its matrix in the same order as the ids. Filtering before
ranking matters for the same reason as Lesson 13's permissions: filtering
afterwards would leave fewer than `limit` results.

**Reference solution:**

```python
def hybrid_search(memories: list[dict], query: str, query_vector, vectors: dict, limit: int = 5,
                  kind: str | None = None, tags: list | None = None) -> list[dict]:
    """Module 4's store search with meaning alongside keywords: filter by kind and tags, then fuse a
    keyword ranking (content and tags) with a ranking by meaning (content). No query: newest first."""
    candidates = [m for m in memories
                  if (kind is None or m["type"] == kind) and (not tags or set(tags) & set(m["tags"]))]
    newest_first = sorted(candidates, key=lambda m: m["created"], reverse=True)
    if not query or not newest_first:
        return newest_first[:limit]
    by_id = {m["id"]: m for m in newest_first}
    keyword_ranking = by_keywords(query, {m["id"]: m["content"] + " " + " ".join(m["tags"]) for m in newest_first})
    meaning_ranking = by_meaning(query_vector, list(by_id), np.array([vectors[m["content"]] for m in newest_first]))
    return [by_id[i] for i in fuse([keyword_ranking, meaning_ranking])[:limit]]
```

**Explanation:**

On the twelve recall tasks, the fused store search finds a relevant memory in
the top three for eleven, against nine for Module 4's keyword search. Test 2
shows fusion at work on "What deadline do we have for moving off the old
model?": keywords rank notes_agent's model first, because it shares "model",
and meaning brings research_agent's migration deadline in second, which is the
answer. Neither ranking alone gets both in the top two. The tags matter too:
a query for "units" finds the memory tagged `units`, whose content never uses
the word, because keywords match tags as Module 4's store did.
