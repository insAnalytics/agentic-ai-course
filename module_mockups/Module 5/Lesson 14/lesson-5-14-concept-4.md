# Module 5, Lesson 14 — Concept 4: Relevance in the recall score

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `duplicate_candidates`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `days_between`, `min_max` and `score_memories`, exactly
>   as in the first code block below.
> - **The exercise's reference solution** (`recall_scored`) joins the shared
>   setup only for pages *after* this concept.

---

## Swapping one term of a score

Module 4's Lesson 11 didn't recall memories by relevance alone.
[It scored them](→ Module 4, forgetting, aging and retrieval quality lesson, scoring what to recall concept)
on three things, each scaled to between 0 and 1 and added with weights:
**recency**, decaying by 1% a day; **importance**, from 1 to 10; and
**relevance**, the keywords a memory shares with the task. Here's that score
with the relevance values passed in, so any measure of relevance can be
plugged in:

```python
from datetime import datetime

def days_between(earlier: str, later: str) -> float:
    return (datetime.fromisoformat(later) - datetime.fromisoformat(earlier)).total_seconds() / 86400

def min_max(values: list) -> list:
    """Module 4 Lesson 11's scaling to between 0 and 1; all equal means all 0.5."""
    low, high = min(values), max(values)
    if high == low:
        return [0.5 for v in values]
    return [(v - low) / (high - low) for v in values]

def score_memories(memories: list[dict], relevance: list[float], now: str, weights: tuple = (1.0, 1.0, 1.0),
                   decay: float = 0.99) -> list[float]:
    """Module 4 Lesson 11's score, with the relevance values passed in: recency, importance and relevance,
    each scaled to 0-1, then weighted and added."""
    recency = [decay ** days_between(m["created"], now) for m in memories]
    importance = [m["importance"] for m in memories]
    r, i, v = min_max(recency), min_max(importance), min_max(relevance)
    w_recency, w_importance, w_relevance = weights
    return [w_recency * r[k] + w_importance * i[k] + w_relevance * v[k] for k in range(len(memories))]
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

Module 4 said its relevance term would be replaced by search by meaning. The
obvious change is a one-line swap: similarity between the task and each memory
instead of shared keywords. Module 4 also left procedures out of this contest,
since they're always loaded, so ten of the twelve recall tasks have a fact or
an episode to find.

---

## The same weights, a different term

Here's the swap, measured, at Module 4's equal weights and with relevance
weighted more heavily:

```python
data, vectors = load_context_step(), task_vectors()
candidates = [m for m in data["memories"] if m["type"] != "procedural"]
memory_vectors = dict(zip([m["content"] for m in candidates], text_vectors([m["content"] for m in candidates])))
tasks = [t for t in data["recall_tasks"] if {m["id"] for m in candidates} & set(t["relevant"])]
now = "2026-09-29T09:00:00"

relevance = {
    "keywords": lambda t: [len(m4_keywords(t["task"]) & m4_keywords(m["content"] + " " + " ".join(m["tags"])))
                           for m in candidates],
    "meaning": lambda t: [float(memory_vectors[m["content"]] @ vectors[t["id"]]) for m in candidates],
}
print(f"relevance weight:{'':>3}" + "".join(f"{w:>6}" for w in (1, 1.5, 2, 3))
      + f"   (a relevant memory in the top 3, of {len(tasks)} tasks)")
for name, measure in relevance.items():
    row = []
    for weight in (1, 1.5, 2, 3):
        hits = 0
        for task in tasks:
            scores = score_memories(candidates, measure(task), now, weights=(1, 1, weight))
            top = [candidates[k]["id"] for k in sorted(range(len(candidates)), key=lambda k: -scores[k])[:3]]
            hits += bool(set(top) & set(task["relevant"]))
        row.append(hits)
    print(f"{name:<20}" + "".join(f"{h:>6}" for h in row))
```
```
relevance weight:        1   1.5     2     3   (a relevant memory in the top 3, of 10 tasks)
keywords                 7     7     7     7
meaning                  6     9     9     9
```
*(runs live, shows output — read-only demo snippet, not graded)*

At Module 4's weights, the swap makes recall *worse*: six tasks against seven.
Give relevance a little more weight and search by meaning finds a relevant
memory for nine of the ten, where keywords stay at seven whatever the weight.
The measure of relevance is better; the score just wasn't built for it.

---

## Why the weights have to change

Here's one task at equal weights, with each part of the score:

```python
data, vectors = load_context_step(), task_vectors()
candidates = [m for m in data["memories"] if m["type"] != "procedural"]
memory_vectors = dict(zip([m["content"] for m in candidates], text_vectors([m["content"] for m in candidates])))
task = next(t for t in data["recall_tasks"] if t["id"] == "r08")
now = "2026-09-29T09:00:00"
similarity = [float(memory_vectors[m["content"]] @ vectors[task["id"]]) for m in candidates]
recency = min_max([0.99 ** days_between(m["created"], now) for m in candidates])
importance = min_max([m["importance"] for m in candidates])
relevance = min_max(similarity)
print(f"{task['task']}\n{'':<6}{'recency':>9}{'importance':>12}{'relevance':>11}{'total':>7}   similarity")
totals = [recency[k] + importance[k] + relevance[k] for k in range(len(candidates))]
for k in sorted(range(len(candidates)), key=lambda k: -totals[k])[:4]:
    print(f"{candidates[k]['id']:<6}{recency[k]:>9.2f}{importance[k]:>12.2f}{relevance[k]:>11.2f}{totals[k]:>7.2f}"
          f"   {similarity[k]:.2f}  {candidates[k]['content'][:40]}")
print(f"similarities range from {min(similarity):.2f} to {max(similarity):.2f}")
```
```
Who is the contact for kb-search?
        recency  importance  relevance  total   similarity
m24        1.00        0.50       0.27   1.77   0.48  The user is writing a proposal to move b
m09        0.79        0.83       0.00   1.63   0.37  On 27 August the registry was down for 4
m07        0.22        1.00       0.25   1.47   0.47  research_agent moves from claude-legacy 
m12        0.12        0.33       1.00   1.45   0.78  Tom is the Search team's contact for kb-
similarities range from 0.37 to 0.78
```
*(runs live, shows output — read-only demo snippet, not graded)*

The kb-search contact is by far the most similar memory, 0.78 against
0.48 for the next, so it scores a full 1.00 on relevance. It still comes fourth,
because it's older and rated less important than three memories that have
nothing to do with kb-search. Similarity gives every memory *some* relevance,
0.37 at the least, so after scaling, the best memory's lead on relevance is
smaller than a clean keyword match's: others score 0.25 or so, where keyword
relevance mostly gives the rest a zero. Recency and importance, unchanged, then
outvote it.

The general lesson is Module 4's own habit, measure before and after, applied
to a component swap. The weights were tuned for a relevance term with a
particular spread. Change the term and the tuning is stale, even though every
part of the score is individually better. With ten tasks, 1.5, 2 and 3 all
score nine; the smallest weight that works keeps recency and importance
meaningful, so it's the one to choose.

---

## Quiz cards

> **Q1.** Swapping keyword relevance for similarity made recall worse at
> Module 4's weights. Why?
> - Every memory gets some similarity, so the best one's lead on relevance shrinks and recency and importance outvote it ✅
> - Similarity is less accurate than keywords
> - The vectors were stored with the wrong instruction
> - Min-max scaling can't handle decimals
>
> *Explanation: keyword relevance gave most memories a zero. Similarity
> gives all of them a partial score, which changes how much the relevance
> term can move the total.*

> **Q2.** What does the measurement say to do after swapping a component
> of a weighted score?
> - Re-tune the weights on labelled tasks, since they were set for the old component ✅
> - Keep the old weights, since they were already measured
> - Remove the other components
> - Always double the new component's weight
>
> *Explanation: weights balance components with particular spreads. A
> better component with a different spread needs the balance measured again.*

> **Q3.** Weights of 1.5, 2 and 3 on relevance all gave nine of ten. Why
> choose 1.5?
> - It's the smallest that works, so recency and importance still count ✅
> - Smaller weights are faster to compute
> - Module 4 required a weight below 2
> - Larger weights break min-max scaling
>
> *Explanation: with ten tasks the higher weights can't be told apart, and
> the smallest keeps the other two terms able to break ties.*

> **Q4.** Why don't procedural memories compete in this score?
> - Module 4 always loads them, so they don't need a place in recall ✅
> - They have no vectors
> - They're never relevant to tasks
> - They have no importance rating
>
> *Explanation: procedures, like the user's formatting preferences, apply
> to every task and are loaded every time. Recall chooses among facts and
> episodes.*

---

## Applied sandbox exercise
*(graded — Module 4's scored recall, with relevance by meaning)*

**Task shown to learner:**

Write `recall_scored(memories, task_vector, vectors, now, limit=3,
weights=(1.0, 1.0, 1.5))`:

- Leave out procedural memories. With none left, return `[]`.
- Relevance for each remaining memory is `float(vectors[content] @
  task_vector)`.
- Score them with `score_memories(candidates, relevance, now, weights)`, and
  return the best `limit` memories, highest score first.

**Starter code:**

```python
def recall_scored(memories: list[dict], task_vector, vectors: dict, now: str, limit: int = 3,
                  weights: tuple = (1.0, 1.0, 1.5)) -> list[dict]:
    """Module 4's scored recall with relevance by meaning: facts and episodes only (procedures are always
    loaded), scored on recency, importance and similarity to the task, best first."""
    # TODO
    ...
```

**Hidden tests:**

```python
# shared by the tests below
data, tasks = load_context_step(), task_vectors()
memories = data["memories"]
vectors = dict(zip([m["content"] for m in memories], text_vectors([m["content"] for m in memories])))
NOW = "2026-09-29T09:00:00"
ids = lambda found: [m["id"] for m in found]

# 1. procedures never compete, and nothing to recall gives nothing
found = recall_scored(memories, tasks["r08"], vectors, NOW)
assert isinstance(found, list), f"recall_scored should return a list; got {found!r}"
assert ids(found) == ["m12", "m24", "m09"], f"with relevance weighted 1.5, the kb-search contact comes first; got {ids(found)}"
assert all(m["type"] != "procedural" for m in recall_scored(memories, tasks["r07"], vectors, NOW, limit=10)), \
    "procedural memories are always loaded, so they don't compete here"
assert recall_scored([m for m in memories if m["type"] == "procedural"], tasks["r07"], vectors, NOW) == []

# 2. the weights are passed through to score_memories
assert ids(recall_scored(memories, tasks["r08"], vectors, NOW, weights=(1, 1, 1))) == ["m24", "m09", "m07"], \
    "at equal weights, recency and importance outvote relevance"
assert len(recall_scored(memories, tasks["r08"], vectors, NOW, limit=5)) == 5

# 3. the recall tasks with facts or episodes to find: 9 of 10 at the default weights
eligible = [t for t in data["recall_tasks"] if {m["id"] for m in memories if m["type"] != "procedural"} & set(t["relevant"])]
hits = sum(bool(set(ids(recall_scored(memories, tasks[t["id"]], vectors, NOW))) & set(t["relevant"])) for t in eligible)
assert (len(eligible), hits) == (10, 9), f"expected 9 of 10; got {hits} of {len(eligible)}"
```

**Hint (shown on request):**

`sorted(range(len(candidates)), key=lambda k: -scores[k])[:limit]` gives the
positions of the best scores; turn them back into memories. Module 4's version
also marked each recalled memory as used; this one leaves that out, since the
records here are plain dicts shared across tests.

**Reference solution:**

```python
def recall_scored(memories: list[dict], task_vector, vectors: dict, now: str, limit: int = 3,
                  weights: tuple = (1.0, 1.0, 1.5)) -> list[dict]:
    """Module 4's scored recall with relevance by meaning: facts and episodes only (procedures are always
    loaded), scored on recency, importance and similarity to the task, best first."""
    candidates = [m for m in memories if m["type"] != "procedural"]
    if not candidates:
        return []
    relevance = [float(vectors[m["content"]] @ task_vector) for m in candidates]
    scores = score_memories(candidates, relevance, now, weights)
    return [candidates[k] for k in sorted(range(len(candidates)), key=lambda k: -scores[k])[:limit]]
```

**Explanation:**

At the default weights, the kb-search contact comes first for "Who is the
contact for kb-search?", where it came fourth at equal weights, and a relevant
memory reaches the top three for nine of the ten tasks with facts or episodes to
find. Test 2 checks that the weights are passed through, by reproducing the
equal-weights order from the demo. The one miss that remains is "Who do I report
to?", the task no method in this lesson has answered. The manager memory isn't
even the most similar to it: the question is short and says almost nothing, and
memories about owners and people score as high or higher. A question that
vague may need a follow-up question more than a better score.
