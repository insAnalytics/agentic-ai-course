# Module 4, Lesson 11 — Concept 2: Scoring what to recall

> **Note for the site build:** add `ScoredMemory`, `ScoredStore`, `days_between`, `min_max`, `score_memories` and `recall_scored` to this lesson's setup. **Module 0 gap list:** `datetime.fromisoformat`, and subtracting two datetimes to get a `timedelta` (with `.total_seconds()`), used here with a one-line gloss.

---

## Three signals

[The previous concept](→ this lesson, why a store that keeps everything gets worse concept) ended with what the store's search was missing: any sense of importance, and any sense of use. The best-known way to add both comes from [Generative Agents](https://arxiv.org/abs/2304.03442) (Park et al.), whose simulated characters had to recall the right memories from a stream of everything they'd seen. Each memory gets a retrieval score made of three parts:

- **Recency** decays exponentially with the time since the memory was **last retrieved**, not since it was created. Park et al. used a factor of 0.995 per hour of simulated time.
- **Importance** is a number the model assigns when the memory is written. They asked the model for an integer, from mundane to core.
- **Relevance** is how closely the memory relates to the current situation. They used embedding similarity. Here it's shared keywords, and Module 5 replaces it with search by meaning.

Each part is scaled to between 0 and 1 across the memories being compared, so none dominates because of its units. Then the three are combined with weights.

The detail that matters most is the first one. Because recency counts from the last time a memory was recalled, **use keeps a memory alive.** A memory that keeps turning out relevant keeps getting recalled, and so stays recent.

## In code

The record gains two fields: `importance`, rated when the memory is written (the extraction step from Lesson 10 can return it with each candidate), and `last_used`. As in Lesson 10, the store needs a small subclass so that saving keeps the new fields:

```python
# datetime.fromisoformat reads an ISO timestamp; subtracting two datetimes gives a timedelta
from datetime import datetime

class ScoredMemory(MemoryRecord):
    # how much this matters, from 1 to 10, rated when the memory is written
    importance: int = 5
    # when it was last recalled into a session; empty until then
    last_used: str = ""

class ScoredStore(VersionedStore):
    """A VersionedStore that keeps each memory's importance and last use."""
    def save(self, user_id: str, memory: ScoredMemory) -> None:
        self._by_user.setdefault(user_id, []).append(ScoredMemory(**memory.model_dump()))

def days_between(earlier: str, later: str) -> float:
    return (datetime.fromisoformat(later) - datetime.fromisoformat(earlier)).total_seconds() / 86400

def min_max(values: list) -> list:
    """Scale values to between 0 and 1. If they're all equal, they can't tell memories apart, so all get 0.5."""
    low, high = min(values), max(values)
    if high == low:
        return [0.5 for v in values]
    return [(v - low) / (high - low) for v in values]
```

```python
def score_memories(memories: list, task: str, now: str, weights: tuple = (1.0, 1.0, 1.0), decay: float = 0.99) -> list:
    """One score per memory: recency, importance and relevance, each scaled to 0-1, then weighted and added."""
    wanted = keywords(task)
    recency = [decay ** days_between(m.last_used or m.created, now) for m in memories]
    importance = [m.importance for m in memories]
    relevance = [len(wanted & keywords(m.content + " " + " ".join(m.tags))) for m in memories]
    r, i, v = min_max(recency), min_max(importance), min_max(relevance)
    w_recency, w_importance, w_relevance = weights
    return [w_recency * r[k] + w_importance * i[k] + w_relevance * v[k] for k in range(len(memories))]

def recall_scored(store, user_id: str, task: str, now: str, limit: int = 5, weights: tuple = (1.0, 1.0, 1.0),
                  decay: float = 0.99) -> list:
    """The best-scoring facts and episodes for this task; recalling them marks them as used now."""
    # procedures are always loaded (Lesson 8), so they're not competing for these slots
    candidates = [m for m in store.search(user_id, limit=1000) if m.type != "procedural"]
    if not candidates:
        return []
    scores = score_memories(candidates, task, now, weights, decay)
    ranked = sorted(range(len(candidates)), key=lambda k: scores[k], reverse=True)[:limit]
    recalled = [candidates[k] for k in ranked]
    for memory in recalled:
        memory.last_used = now
    return recalled
```

Procedures don't compete for these slots, because [Lesson 8](→ this module, short term and long term memory lesson, episodic semantic procedural concept) loads them every time. The decay here is per day: at 0.99, a memory nobody has recalled for about ten weeks counts for half as much as a fresh one. Park et al.'s 0.995 per simulated hour was fitted to a simulated town. The right speed depends on how fast things change where the agent works.

## A year again

The same year of weekly reviews as the previous concept, with a third thing that matters added. Each week, the agent recalls memory for its task with `recall_scored`. The comparison is with keyword search, and with scoring when recalling *doesn't* refresh anything:

```python
from datetime import date, timedelta

def week_start(week):
    return (date(2026, 1, 5) + timedelta(weeks=week)).isoformat()

def simulate(refresh: bool):
    """A year of weekly reviews; each week the agent recalls memory for its task. Returns the last week's recall."""
    store, useful = ScoredStore(), set()
    def remember(content, created, importance, source="agent", matters=False):
        store.save("u_simar", ScoredMemory(content=content, type="episodic", source=source, created=created, importance=importance))
        if matters:
            useful.add(content)
    remember("support_agent's bottleneck is billing_agent's per-ticket lookup.", week_start(1) + "T09:00:00", 8, matters=True)
    remember("Tom owns support_agent.", week_start(4) + "T09:00:00", 7, "user", matters=True)
    remember("support_agent's queue doubles on the first Monday of each month.", week_start(6) + "T09:00:00", 7, matters=True)
    task = "Draft the support_agent status update."
    for week in range(1, 53):
        remember(f"Week {week}: support_agent review done, nothing unusual.", week_start(week) + "T17:00:00", 2)
        if week % 4 == 0:
            remember(f"support_agent p99 was {3 + week % 3}.{week % 10}s in week {week}.", week_start(week) + "T17:05:00", 3)
        now = week_start(week) + "T18:00:00"
        recalled = recall_scored(store, "u_simar", task, now)
        if not refresh:
            # undo the refresh, to see what the score does without it
            for m in recalled:
                m.last_used = ""
    return [m.content for m in recalled], useful, store

recalled, useful, store = simulate(refresh=True)
print("week 52, keyword search:        ", sum(1 for m in store.search("u_simar", "Draft the support_agent status update.", limit=5) if m.content in useful), "of 3 useful")
recalled_no_refresh, _, _ = simulate(refresh=False)
print("week 52, scored, no refresh:    ", sum(1 for c in recalled_no_refresh if c in useful), "of 3 useful")
print("week 52, scored, use refreshes: ", sum(1 for c in recalled if c in useful), "of 3 useful")
for content in recalled:
    print("   ", content)
```
```
week 52, keyword search:         0 of 3 useful
week 52, scored, no refresh:     1 of 3 useful
week 52, scored, use refreshes:  3 of 3 useful
    support_agent's bottleneck is billing_agent's per-ticket lookup.
    support_agent's queue doubles on the first Monday of each month.
    Tom owns support_agent.
    support_agent p99 was 4.2s in week 52.
    support_agent p99 was 3.8s in week 48.
```
*(runs live, shows output — read-only demo snippet, not graded; importance ratings are set by hand, as an extraction step would propose them)*

- **Keyword search** finds none of the three by the end of the year, as in the previous concept.
- **Scoring without the refresh** finds one. Importance lifts the useful memories, but they were written early. By week 52 their recency is near zero, while every routine note is fresh.
- **Scoring with the refresh** finds all three. They were recalled in the early weeks, so their `last_used` kept moving forward. Meanwhile the routine notes, never important enough to be recalled, aged in place.

## The loop in the refresh

That last result has a catch, and it's worth seeing clearly. Refreshing on recall means **whatever gets recalled stays recalled.** Here that's what we want, because the recalled memories were the useful ones. But a memory that's recalled and then ignored gets the same boost as one the agent actually relied on, and once it's in the top few, it can hold its place indefinitely.

Better signals exist. One is refreshing a memory only when the agent actually used it. Another is tracking whether tasks that used it went well, as the history-based deletion in [Xiong et al.'s study](https://arxiv.org/abs/2505.16067) does. Both need more information than recall alone provides. Whatever signal is used, the weights and the decay rate are tuning choices, and the only way to set them well is to measure recall quality on your own tasks, which is Module 7's subject.

---

## Quiz cards

> **Q1.** Why does recency count from when a memory was last recalled, not when it was created?
> - A) Creation times aren't stored
> - B) So use keeps a memory alive: one that keeps turning out relevant keeps getting recalled, and stays recent ✅
> - C) It makes scoring faster
> - D) Park et al. didn't record creation times
>
> *Explanation:* In the demo, that refresh made the difference between one useful memory recalled and all three.

> **Q2.** Why is each part scaled to between 0 and 1 before they're added?
> - A) So no part dominates just because of its units: importance runs to 10, recency to 1, keyword counts to a few ✅
> - B) Python can't add numbers of different sizes
> - C) So the total is always 3
> - D) To make the memories shorter
>
> *Explanation:* Min-max scaling puts each part on the same footing, and the weights then decide the balance on purpose.

> **Q3.** In the demo, scoring without the refresh found only one useful memory. Why?
> - A) Importance was ignored
> - B) The useful memories were deleted
> - C) Keyword relevance was switched off
> - D) The useful memories were written early, so by week 52 their recency was near zero while every routine note was fresh ✅
>
> *Explanation:* Importance lifted them, but not enough to beat a year of recency. The refresh is what kept them in the running.

> **Q4.** Why don't procedures compete for these recall slots?
> - A) They have no importance score
> - B) They can't be scored
> - C) They're always loaded, since a standing instruction applies to every task, whatever its words ✅
> - D) They're stored somewhere else
>
> *Explanation:* That was Lesson 8's rule. Scoring decides among the facts and episodes.

> **Q5.** What is the risk in refreshing a memory every time it's recalled?
> - A) The store runs out of space
> - B) Whatever gets recalled stays recalled, including a memory that's recalled and then ignored ✅
> - C) Memories lose their importance
> - D) Old memories are deleted
>
> *Explanation:* Refreshing on actual use, or on whether tasks went well, is a better signal, but needs more information than recall alone.

---

## Applied sandbox exercise

*(graded — scoring what to recall)*

**Task shown to learner:** `ScoredMemory`, `ScoredStore`, `days_between`, `min_max` and `keywords` are provided. Implement:

- **`score_memories(memories, task, now, weights=(1.0, 1.0, 1.0), decay=0.99)`:** one score per memory, in order.
  - **Recency** is `decay ** days_between(m.last_used or m.created, now)`.
  - **Importance** is `m.importance`.
  - **Relevance** is the number of keywords the task shares with the memory's content and tags, joined by a space.
  - Scale each of the three lists with `min_max`, then return `w_recency * recency + w_importance * importance + w_relevance * relevance` for each memory.
- **`recall_scored(store, user_id, task, now, limit=5, weights=..., decay=...)`:**
  - Take this user's active memories that aren't procedural, and return `[]` if there are none.
  - Score them, and return the `limit` highest scores, best first.
  - Set `last_used` to `now` on each memory returned.

**Provided code:** `keywords` from Lesson 8, the stores from Lessons 9 and 10, and `ScoredMemory`, `ScoredStore`, `days_between` and `min_max` as shown in this concept.

**Starter code:**
```python
def score_memories(memories: list, task: str, now: str, weights: tuple = (1.0, 1.0, 1.0), decay: float = 0.99) -> list:
    # TODO: recency (decay ** days since last use, or creation), importance, and relevance (shared keywords);
    #       scale each with min_max; return the weighted sum for each memory
    ...

def recall_scored(store, user_id: str, task: str, now: str, limit: int = 5, weights: tuple = (1.0, 1.0, 1.0),
                  decay: float = 0.99) -> list:
    # TODO: this user's active non-procedural memories, scored; the best `limit`, each marked as used now
    ...
```

**Hidden tests:**
```python
def mem(content, created, importance=5, last_used="", kind="episodic", tags=None):
    return ScoredMemory(content=content, type=kind, source="agent", created=created, importance=importance,
                        last_used=last_used, tags=tags or [])

NOW = "2026-06-01T00:00:00"
a = mem("support_agent bottleneck is billing lookup.", "2026-05-31T00:00:00", importance=9)
b = mem("support_agent review done.", "2026-01-01T00:00:00", importance=2)
c = mem("billing_agent handles refunds.", "2026-05-01T00:00:00", importance=5, last_used="2026-05-31T00:00:00")

# 1. each part is scaled to 0-1 across the memories, then weighted and added
scores = score_memories([a, b, c], "support_agent status", NOW)
recency = [0.99 ** 1, 0.99 ** 151, 0.99 ** 1]
r = [(x - min(recency)) / (max(recency) - min(recency)) for x in recency]
i = [(9 - 2) / 7, 0.0, (5 - 2) / 7]
v = [1.0, 1.0, 0.0]
for k in range(3):
    assert abs(scores[k] - (r[k] + i[k] + v[k])) < 1e-9, (k, scores[k])

# 2. recency counts from last use when there is one, not from creation
assert abs(scores[2] - (1.0 + 3 / 7 + 0.0)) < 1e-9

# 3. weights change the balance; a weight of zero switches a part off
only_relevance = score_memories([a, b, c], "support_agent status", NOW, weights=(0.0, 0.0, 1.0))
assert only_relevance == [1.0, 1.0, 0.0]

# 4. a part that's the same for every memory can't tell them apart, so it adds 0.5 to each
same = score_memories([mem("x one", NOW), mem("y two", NOW)], "nothing", NOW, weights=(1.0, 0.0, 0.0))
assert same == [0.5, 0.5]

store = ScoredStore()
for m in [a, b, c, mem("Never restart support_agent at night.", "2026-05-30T00:00:00", importance=10, kind="procedural")]:
    store.save("u", m)
store.save("u_other", mem("support_agent secret of another user.", "2026-05-31T00:00:00", importance=10))

# 5. recall: the best scores first, procedures excluded, this user only, at most `limit`
recalled = recall_scored(store, "u", "support_agent status", NOW, limit=2)
assert [m.content for m in recalled] == ["support_agent bottleneck is billing lookup.", "billing_agent handles refunds."]

# 6. recalled memories are marked as used now, in the store; the others aren't
used = {m.content: m.last_used for m in store.search("u", limit=10)}
assert used["support_agent bottleneck is billing lookup."] == NOW and used["support_agent review done."] == ""
assert all(m.type != "procedural" for m in recall_scored(store, "u", "support_agent", NOW, limit=10))

# 7. nothing to recall gives nothing
assert recall_scored(ScoredStore(), "u", "anything", NOW) == []
```

**Hint (shown on request):** Build three lists, one per signal, with list comprehensions, scale each with `min_max`, then combine them by index. To rank, sort the indexes: `sorted(range(len(candidates)), key=lambda k: scores[k], reverse=True)`. The memories that `store.search` returns are the store's own objects, so setting `last_used` on them updates the store.

**Reference solution:**
```python
def score_memories(memories: list, task: str, now: str, weights: tuple = (1.0, 1.0, 1.0), decay: float = 0.99) -> list:
    """One score per memory: recency, importance and relevance, each scaled to 0-1, then weighted and added."""
    wanted = keywords(task)
    recency = [decay ** days_between(m.last_used or m.created, now) for m in memories]
    importance = [m.importance for m in memories]
    relevance = [len(wanted & keywords(m.content + " " + " ".join(m.tags))) for m in memories]
    r, i, v = min_max(recency), min_max(importance), min_max(relevance)
    w_recency, w_importance, w_relevance = weights
    return [w_recency * r[k] + w_importance * i[k] + w_relevance * v[k] for k in range(len(memories))]

def recall_scored(store, user_id: str, task: str, now: str, limit: int = 5, weights: tuple = (1.0, 1.0, 1.0),
                  decay: float = 0.99) -> list:
    """The best-scoring facts and episodes for this task; recalling them marks them as used now."""
    # procedures are always loaded (Lesson 8), so they're not competing for these slots
    candidates = [m for m in store.search(user_id, limit=1000) if m.type != "procedural"]
    if not candidates:
        return []
    scores = score_memories(candidates, task, now, weights, decay)
    ranked = sorted(range(len(candidates)), key=lambda k: scores[k], reverse=True)[:limit]
    recalled = [candidates[k] for k in ranked]
    for memory in recalled:
        memory.last_used = now
    return recalled
```

**Explanation:** Test 1 checks the whole calculation against numbers worked out by hand, which catches unscaled parts and missing weights. Test 2 checks that recency counts from last use. A version that always counts from creation loses the effect the demo turned on. Test 6 checks that recall marks exactly the recalled memories as used, not all of them and not none. Test 5 checks that procedures stay out of the competition.

---

*(End of Concept 2.)*
