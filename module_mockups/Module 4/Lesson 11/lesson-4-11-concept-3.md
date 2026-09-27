# Module 4, Lesson 11 — Concept 3: Forgetting on purpose

> **Note for the site build:** add `ArchivableMemory`, `ArchiveStore` and `forget` to this lesson's setup, after Concept 2's scoring code.

---

## Archive, don't delete

[The previous concept](→ this lesson, scoring what to recall concept) made the right memories rise. The store still grows by a routine note a week, forever, and every search and every recall has to sort through all of it. Something has to leave.

As with [Lesson 10's superseding](→ this module, deciding what to remember lesson, duplicates and contradictions concept, supersede dont delete), leaving shouldn't mean being destroyed. An **archived** memory drops out of search, so it's never recalled, but it stays in the store, with the day it was archived, and it can be restored if it turns out to matter. Deleting is a separate operation, for when the user asks for something to be forgotten for good:

```python
class ArchivableMemory(ScoredMemory):
    # an archived memory is out of search but kept, with the day it was archived, and can be restored
    archived: bool = False
    archived_on: str = ""

class ArchiveStore(ScoredStore):
    """A ScoredStore that can archive memories, restore them, and delete them when the user asks."""
    def save(self, user_id: str, memory: ArchivableMemory) -> None:
        self._by_user.setdefault(user_id, []).append(ArchivableMemory(**memory.model_dump()))

    def search(self, user_id: str, query: str = "", tags: list = None, kind: str = None, limit: int = 5,
               include_superseded: bool = False, include_archived: bool = False) -> list:
        everything = len(self._by_user.get(user_id, []))
        found = super().search(user_id, query, tags, kind, limit=everything, include_superseded=include_superseded)
        if not include_archived:
            found = [m for m in found if not m.archived]
        return found[:limit]

    def archive_one(self, memory: ArchivableMemory, today: str) -> None:
        memory.archived, memory.archived_on = True, today

    def restore(self, user_id: str, content: str) -> bool:
        for memory in self._by_user.get(user_id, []):
            if memory.content == content and memory.archived:
                memory.archived, memory.archived_on = False, ""
                return True
        return False

    def delete(self, user_id: str, content: str) -> int:
        """Remove every copy of a memory for good: for when the user asks to be forgotten."""
        kept = [m for m in self._by_user.get(user_id, []) if m.content != content]
        removed = len(self._by_user.get(user_id, [])) - len(kept)
        self._by_user[user_id] = kept
        return removed
```

## A forgetting policy

A policy decides what's archived, run from time to time, say once a session:

- **Replaced memories are kept for a while, then archived.** A superseded memory is already out of search. Keeping it for a retention period leaves time to notice and undo a bad replacement. After that, it's archived.
- **Over the cap, the lowest scores go first.** When more memories are active than the cap allows, they're scored with the previous concept's scoring. There's no task in view, so relevance is the same for all, and recency and importance decide. The lowest-scoring ones are archived until the store fits.
- **The user's standing instructions are never archived.** Only the user removes an instruction they gave. It's the same asymmetry as [Lesson 10's source rule](→ this module, deciding what to remember lesson, memory poisoning and the source rule concept).

```python
def forget(store, user_id: str, now: str, cap: int = 50, retention_days: int = 90, decay: float = 0.99) -> list:
    """Archive what no longer earns its place. Returns one line per memory archived."""
    report = []
    today = now[:10]
    # 1. replaced memories are kept for a while, then archived
    for memory in store.search(user_id, limit=100000, include_superseded=True):
        if memory.superseded and days_between(memory.last_used or memory.created, now) > retention_days:
            store.archive_one(memory, today)
            report.append(f"archived, replaced long ago: {memory.content}")
    # 2. over the cap, the lowest-scoring memories go first; the user's standing instructions never do
    active = store.search(user_id, limit=100000)
    if len(active) > cap:
        candidates = [m for m in active if not (m.type == "procedural" and m.source == "user")]
        # with no task in view, relevance is the same for all, so recency and importance decide
        scores = score_memories(candidates, "", now, decay=decay)
        lowest_first = sorted(range(len(candidates)), key=lambda k: scores[k])
        for k in lowest_first[:len(active) - cap]:
            store.archive_one(candidates[k], today)
            report.append(f"archived, over the cap: {candidates[k].content}")
    return report
```

One consequence is worth knowing in advance. An important fact that nobody recalls for months can still be archived: importance slows aging, but doesn't stop it. That's usually right, since a fact that hasn't been relevant for months probably isn't pulling its weight. It's also why archiving has to be reversible, and why the balance between importance and recency is a setting to tune, not a law.

## A year, with forgetting

The same year of weekly reviews, now with the policy run every week and a cap of 15 active memories:

```python
from datetime import date, timedelta

def week_start(week):
    return (date(2026, 1, 5) + timedelta(weeks=week)).isoformat()

store, useful = ArchiveStore(), set()
def remember(content, created, importance, kind="episodic", source="agent", matters=False):
    store.save("u_simar", ArchivableMemory(content=content, type=kind, source=source, created=created, importance=importance))
    if matters:
        useful.add(content)

remember("Never restart support_agent during business hours.", week_start(0) + "T09:00:00", 9, "procedural", "user")
remember("support_agent's bottleneck is billing_agent's per-ticket lookup.", week_start(1) + "T09:00:00", 8, matters=True)
remember("Tom owns support_agent.", week_start(4) + "T09:00:00", 7, "semantic", "user", matters=True)
remember("support_agent's queue doubles on the first Monday of each month.", week_start(6) + "T09:00:00", 7, matters=True)
task = "Draft the support_agent status update."
archived = 0
for week in range(1, 53):
    remember(f"Week {week}: support_agent review done, nothing unusual.", week_start(week) + "T17:00:00", 2)
    if week % 4 == 0:
        remember(f"support_agent p99 was {3 + week % 3}.{week % 10}s in week {week}.", week_start(week) + "T17:05:00", 3)
    now = week_start(week) + "T18:00:00"
    recall_scored(store, "u_simar", task, now)
    archived += len(forget(store, "u_simar", now, cap=15))

active = store.search("u_simar", limit=1000)
kept = store.search("u_simar", limit=1000, include_archived=True)
print(f"after a year: {len(kept)} stored, {len(active)} active, {archived} archived")
print("useful memories still active:", sum(1 for m in active if m.content in useful), "of 3")
print("standing instruction still active:", any(m.type == "procedural" for m in active))
print("recalled for this week's task:")
for m in recall_scored(store, "u_simar", task, now, limit=5):
    print("   ", m.content)

# an archived memory is restorable; a deleted one is gone
print("\nrestore 'Week 3': ", store.restore("u_simar", "Week 3: support_agent review done, nothing unusual."))
print("delete it for good:", store.delete("u_simar", "Week 3: support_agent review done, nothing unusual."), "removed")
print("restore it again:  ", store.restore("u_simar", "Week 3: support_agent review done, nothing unusual."))
```
```
after a year: 69 stored, 15 active, 54 archived
useful memories still active: 3 of 3
standing instruction still active: True
recalled for this week's task:
    support_agent's bottleneck is billing_agent's per-ticket lookup.
    support_agent's queue doubles on the first Monday of each month.
    Tom owns support_agent.
    support_agent p99 was 4.2s in week 52.
    support_agent p99 was 3.8s in week 48.

restore 'Week 3':  True
delete it for good: 1 removed
restore it again:   False
```
*(runs live, shows output — read-only demo snippet, not graded; importance ratings are set by hand)*

The active store stays at 15, however many weeks go by. The three memories that matter and the standing instruction are all still active: they were recalled, so they stayed recent, and the instruction is protected. What was archived is almost entirely routine notes and old latency figures. Recall for this week's task finds the useful memories first.

The last three lines show the difference between the two ways of leaving. An archived memory comes back with `restore`. A deleted one doesn't.

## Forgetting is a feature

Forgetting isn't only about recall quality. A store that only grows costs more to search and to keep, and it holds more of a person's history than anyone may have meant it to. Two obligations come from that side:

- **When a user asks to be forgotten, deletion has to be real.** That means every copy, archived and superseded ones included, which is what `delete` does.
- **How long memories may be kept at all** is often set by law or policy, not by recall quality.

Both are part of Module 10's subject. The design here makes them possible: memories are scoped per user, dated, and deletable for good.

---

## Quiz cards

> **Q1.** Why archive memories instead of deleting them?
> - A) Archiving takes less space
> - B) Deleting is slower
> - C) Archived memories are still recalled occasionally
> - D) An archived memory is out of search but kept and dated, so it can be restored if it turns out to matter ✅
>
> *Explanation:* The same reasoning as superseding in Lesson 10. Deletion is kept for when the user asks for something to be forgotten for good.

> **Q2.** Why are superseded memories kept for a retention period before they're archived?
> - A) To leave time to notice and undo a bad replacement ✅
> - B) Because they're still recalled
> - C) Because archiving is expensive
> - D) To keep the store over its cap
>
> *Explanation:* A superseded memory is already out of search. The retention period matters when the replacement was a mistake, or was planted.

> **Q3.** When the store is over its cap, how does `forget` choose what to archive?
> - A) The oldest memories first
> - B) The lowest scores first, by recency and importance, never the user's standing instructions ✅
> - C) At random
> - D) The longest memories first
>
> *Explanation:* There's no task in view, so relevance can't tell memories apart. A memory that's recalled stays recent, and so survives.

> **Q4.** An important fact that nobody recalled for months was archived. Is that a bug?
> - A) Yes: important memories should never be archived
> - B) Yes: importance should be the only signal
> - C) No: importance slows aging but doesn't stop it, and archiving is reversible; the balance is a setting to tune ✅
> - D) No: facts are always archived after a month
>
> *Explanation:* A fact that hasn't been relevant for months probably isn't pulling its weight. If it matters again, it can be restored.

> **Q5.** What must `delete` do when a user asks to be forgotten, that archiving doesn't?
> - A) Move the memory to another user
> - B) Mark it as superseded
> - C) Remove every copy for good, including archived and superseded ones, so it can't be restored ✅
> - D) Lower its importance to zero
>
> *Explanation:* Archiving is designed to be undone. A request to be forgotten is designed not to be. Retention rules and users' rights are Module 10's subject.

---

## Applied sandbox exercise

*(graded — forgetting on purpose)*

**Task shown to learner:** `ArchivableMemory`, `ArchiveStore` (with `archive_one`), `score_memories` and `days_between` are provided. Implement **`forget(store, user_id, now, cap=50, retention_days=90, decay=0.99)`**, which returns one line per memory it archives, in the order it archives them. `today` is `now[:10]`.

1. **Replaced memories.** For each of the user's memories that's superseded and not yet archived, if more than `retention_days` have passed since its `last_used` (or, if empty, its `created`), archive it and add `archived, replaced long ago: CONTENT`.
2. **Over the cap.** Take the user's active memories, meaning neither superseded nor archived. If there are more than `cap`:
   - Leave out the user's standing instructions (procedural, from the user). They're never archived.
   - Score the rest with `score_memories(candidates, "", now, decay=decay)`.
   - Archive the lowest-scoring ones first, until `cap` memories remain active, adding `archived, over the cap: CONTENT` for each.

**Provided code:** everything from Lessons 8–10, the previous concept's scoring code, and `ArchivableMemory` and `ArchiveStore` as shown in this concept.

**Starter code:**
```python
def forget(store, user_id: str, now: str, cap: int = 50, retention_days: int = 90, decay: float = 0.99) -> list:
    # TODO: 1) archive superseded memories not used for more than retention_days
    #       2) if more than `cap` memories are still active, archive the lowest-scoring ones (never the user's
    #          standing instructions) until `cap` are left
    #       Return one line per memory archived.
    ...
```

**Hidden tests:**
```python
def mem(content, created, importance=5, kind="episodic", source="agent", last_used=""):
    return ArchivableMemory(content=content, type=kind, source=source, created=created, importance=importance, last_used=last_used)

NOW = "2026-06-01T12:00:00"

def build():
    store = ArchiveStore()
    store.save("u", mem("Never restart support_agent at night.", "2026-01-01T00:00:00", importance=1, kind="procedural", source="user"))
    store.save("u", mem("Old escalation channel is #support.", "2026-01-10T00:00:00"))
    store.save("u", mem("Recent channel note.", "2026-05-20T00:00:00"))
    store.supersede("u", "Old escalation channel is #support.", mem("Escalations go to #support-oncall.", "2026-05-01T00:00:00", importance=8))
    store.supersede("u", "Recent channel note.", mem("Newer channel note.", "2026-05-25T00:00:00", importance=6))
    store.save("u", mem("Routine note A.", "2026-02-01T00:00:00", importance=2))
    store.save("u", mem("Routine note B.", "2026-03-01T00:00:00", importance=2))
    store.save("u", mem("Tom owns support_agent.", "2026-02-15T00:00:00", importance=9, kind="semantic", source="user"))
    store.save("u_other", mem("Another user's old note.", "2025-01-01T00:00:00", importance=1))
    return store

# 1. replaced memories past the retention period are archived; recently replaced ones and active ones aren't
store = build()
report = forget(store, "u", NOW, cap=50, retention_days=90)
assert report == ["archived, replaced long ago: Old escalation channel is #support."]
everything = {m.content: m for m in store.search("u", limit=100, include_superseded=True, include_archived=True)}
assert everything["Old escalation channel is #support."].archived and everything["Old escalation channel is #support."].archived_on == "2026-06-01"
assert not everything["Recent channel note."].archived and not everything["Routine note A."].archived

# 2. over the cap, the lowest scores are archived first until the active count fits; the user's instructions never go.
#    Tom's fact is important but old and never recalled, so recency and importance together rank it low
store = build()
report = forget(store, "u", NOW, cap=3, retention_days=90)
assert report == ["archived, replaced long ago: Old escalation channel is #support.",
                  "archived, over the cap: Routine note A.",
                  "archived, over the cap: Routine note B.",
                  "archived, over the cap: Tom owns support_agent."]
assert sorted(m.content for m in store.search("u", limit=100)) == [
    "Escalations go to #support-oncall.", "Never restart support_agent at night.", "Newer channel note."]

# 3. under the cap, nothing is archived for size
store = build()
assert forget(store, "u", NOW, cap=10, retention_days=1000) == []

# 4. even a cap of zero never archives the user's standing instructions
store = build()
forget(store, "u", NOW, cap=0, retention_days=90)
assert [m.content for m in store.search("u", limit=100)] == ["Never restart support_agent at night."]

# 5. archived memories are still stored, dated, and can be restored; other users are untouched
assert store.restore("u", "Tom owns support_agent.") is True
assert "Tom owns support_agent." in [m.content for m in store.search("u", limit=100)]
assert [m.content for m in store.search("u_other", limit=10)] == ["Another user's old note."]
assert len(store.search("u", limit=100, include_superseded=True, include_archived=True)) == 8
```

**Hint (shown on request):** `store.search(user_id, limit=100000, include_superseded=True)` lists the superseded memories along with the active ones, and without `include_archived` it leaves out what's already archived. To find the lowest scores, sort the indexes by score, ascending, and archive the first `len(active) - cap` of them.

**Reference solution:**
```python
def forget(store, user_id: str, now: str, cap: int = 50, retention_days: int = 90, decay: float = 0.99) -> list:
    """Archive what no longer earns its place. Returns one line per memory archived."""
    report = []
    today = now[:10]
    # 1. replaced memories are kept for a while, then archived
    for memory in store.search(user_id, limit=100000, include_superseded=True):
        if memory.superseded and days_between(memory.last_used or memory.created, now) > retention_days:
            store.archive_one(memory, today)
            report.append(f"archived, replaced long ago: {memory.content}")
    # 2. over the cap, the lowest-scoring memories go first; the user's standing instructions never do
    active = store.search(user_id, limit=100000)
    if len(active) > cap:
        candidates = [m for m in active if not (m.type == "procedural" and m.source == "user")]
        # with no task in view, relevance is the same for all, so recency and importance decide
        scores = score_memories(candidates, "", now, decay=decay)
        lowest_first = sorted(range(len(candidates)), key=lambda k: scores[k])
        for k in lowest_first[:len(active) - cap]:
            store.archive_one(candidates[k], today)
            report.append(f"archived, over the cap: {candidates[k].content}")
    return report
```

**Explanation:** Test 2 checks the cap rule end to end: the lowest scores go first, until the active count fits, including an old, never-recalled fact that importance alone couldn't save. Test 4 checks that nothing, not even a cap of zero, archives the user's standing instructions. Test 1 checks the retention period, where a recently replaced memory stays. Test 5 checks that archiving isn't deleting: everything is still stored, and can be restored.

---

*(End of Concept 3 — final concept of Lesson 11. The lesson continues with the recap and comprehensive sandbox.)*
