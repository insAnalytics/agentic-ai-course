# Module 4, Lesson 10 — Concept 2: Duplicates and contradictions

> **Note for the site build:** add `MemoryRecord`, `VersionedStore`, `find_duplicate` and `apply_decision` to this lesson's setup. They build on Lesson 9's `Memory` and `MemoryStore` and Lesson 8's `keywords`.

---

## What goes wrong over time

[The previous concept](→ this lesson, extraction with evidence concept) checked each candidate memory's source. A checked candidate can still be a problem, because of what's already stored. Here's a store after a new session's candidates are simply added:

```python
def record(content, source, created, kind="semantic", origin=""):
    return MemoryRecord(content=content, type=kind, source=source, created=created, origin=origin)

def fresh_store():
    store = VersionedStore()
    store.save("u_simar", record("Priya owns support_agent.", "user", "2026-09-14T10:00:00"))
    store.save("u_simar", record("support_agent escalations go to #support.", "agent", "2026-09-14T10:05:00"))
    return store

# after a new session: checked candidates, each with the decision a model made about it (scripted)
batch = [
    (record("Priya owns support_agent.", "tool", "2026-09-28T09:00:00", origin="wiki/support_agent"), {"action": "add"}),
    (record("support_agent escalations go to #support-oncall.", "tool", "2026-09-28T09:01:00", origin="wiki/support_agent"),
     {"action": "supersede", "replaces": "support_agent escalations go to #support."}),
    (record("Tom owns support_agent.", "tool", "2026-09-28T09:02:00", origin="old-wiki/teams"),
     {"action": "supersede", "replaces": "Priya owns support_agent."}),
    (record("billing_agent handles refunds.", "tool", "2026-09-28T09:03:00", origin="wiki/billing_agent"), {"action": "add"}),
]

naive = fresh_store()
for candidate, decision in batch:
    naive.save("u_simar", candidate)
print("adding everything:")
for m in naive.search("u_simar", limit=10):
    print(f"   [{m.source}] {m.content}")

store = fresh_store()
print("\ndeciding, with the rules:")
for candidate, decision in batch:
    print("  ", apply_decision(store, "u_simar", candidate, decision))

# later, the user corrects it themselves
correction = record("Tom owns support_agent now; Priya moved to billing.", "user", "2026-09-29T08:00:00")
print("  ", apply_decision(store, "u_simar", correction, {"action": "supersede", "replaces": "Priya owns support_agent."}))

print("\nactive memories:")
for m in store.search("u_simar", limit=10):
    print(f"   [{m.source}] {m.content}")
print("kept, but superseded:")
for m in store.search("u_simar", limit=10, include_superseded=True):
    if m.superseded:
        print(f"   [{m.source}] {m.content}")
```
```
adding everything:
   [tool] billing_agent handles refunds.
   [tool] Tom owns support_agent.
   [tool] support_agent escalations go to #support-oncall.
   [tool] Priya owns support_agent.
   [agent] support_agent escalations go to #support.
   [user] Priya owns support_agent.

deciding, with the rules:
   skipped, already known: Priya owns support_agent.
   superseded: support_agent escalations go to #support. -> support_agent escalations go to #support-oncall.
   refused, the user said otherwise: Priya owns support_agent.
   added: billing_agent handles refunds.
   superseded: Priya owns support_agent. -> Tom owns support_agent now; Priya moved to billing.

active memories:
   [user] Tom owns support_agent now; Priya moved to billing.
   [tool] billing_agent handles refunds.
   [tool] support_agent escalations go to #support-oncall.
kept, but superseded:
   [agent] support_agent escalations go to #support.
   [user] Priya owns support_agent.
```
*(runs live, shows output — read-only demo snippet, not graded; the candidates and the model's decisions are scripted)*

"Adding everything" shows both problems a memory store gets over time:

- **Duplicates.** "Priya owns support_agent" is in there twice, once from the user and once from a wiki page. Every duplicate is recalled again and again, and crowds out something else.
- **Contradictions.** Two escalation channels, and two owners. The model has to guess which is current, with nothing to say which came later, or from whom.

The second half of the output is the same batch handled with the rules this concept builds.

## Duplicates: code can catch them

A duplicate is a memory of the same type whose keywords are nearly the same. The overlap is measured as the keywords they share, divided by all the keywords either has. The threshold is 0.8, so "Write summaries as short bullet points" duplicates "Write summaries as bullet points" (four keywords of five), while "escalations go to #support-oncall" isn't a duplicate of "escalations go to #support", because the channel differs. Keyword overlap only catches duplicates that share words. Catching ones that mean the same thing in different words needs Module 5's search by meaning.

## Contradictions need judgment

Whether "Tom owns support_agent" contradicts "Priya owns support_agent" is a question of meaning, so a model decides it. [Mem0's update phase](https://arxiv.org/abs/2504.19413) is the model: for each new fact, it retrieves similar stored memories, and a model picks ADD, UPDATE, DELETE (remove a memory the new fact contradicts) or NOOP. This concept uses three actions:

- **add:** it's new
- **supersede:** it replaces a named stored memory
- **skip:** it adds nothing

The model makes the decision. Code carries it out, and code checks it first, because the decision is model output like any other.

## Supersede, don't delete

Where Mem0 deletes a contradicted memory, this store keeps it and marks it:

```python
class MemoryRecord(Memory):
    # where a memory from a tool came from: a URL, a document, a system
    origin: str = ""
    # a memory that a newer one replaced; kept for the record, left out of search
    superseded: bool = False

class VersionedStore(MemoryStore):
    """A MemoryStore that keeps superseded memories instead of deleting them."""
    def save(self, user_id: str, memory: MemoryRecord) -> None:
        self._by_user.setdefault(user_id, []).append(MemoryRecord(**memory.model_dump()))

    def search(self, user_id: str, query: str = "", tags: list = None, kind: str = None, limit: int = 5,
               include_superseded: bool = False) -> list:
        everything = super().search(user_id, query, tags, kind, limit=len(self._by_user.get(user_id, [])))
        if not include_superseded:
            everything = [m for m in everything if not m.superseded]
        return everything[:limit]

    def supersede(self, user_id: str, old_content: str, new: MemoryRecord) -> None:
        """Mark the active memory with this content as superseded, and save the new one."""
        for memory in self._by_user.get(user_id, []):
            if memory.content == old_content and not memory.superseded:
                memory.superseded = True
        self.save(user_id, new)
```

A superseded memory leaves search, so it's never recalled into a session, but it stays in the store. That keeps a record of what the agent used to believe. It means a replacement can be undone, which matters most when the replacement was itself a mistake, or planted. And it gives [Lesson 11](→ this module, forgetting aging and retrieval quality lesson) the history it needs.

`MemoryRecord` also adds `origin`: where a memory from a tool came from, such as a URL or a system's name. The next concept makes it required.

## Only the user's word replaces the user's word

One rule governs superseding: **a memory the user stated can only be replaced by the user.** Between memories from the agent and from tools, newer evidence may replace older.

A full ranking of sources (user over agent over tool) sounds tidier, and gets real cases wrong. When the team wiki states an escalation channel, it should replace the agent's earlier guess, even though a tool ranks below the agent. The danger worth guarding against is narrower: text from outside overwriting what the user said. An old wiki page claiming "Tom owns support_agent" can't replace the user's own statement that Priya does. When the user says so, it can.

```python
def find_duplicate(store: VersionedStore, user_id: str, candidate: MemoryRecord, threshold: float = 0.8):
    """An active memory of the same type whose keywords nearly match the candidate's, or None."""
    wanted = keywords(candidate.content)
    for memory in store.search(user_id, kind=candidate.type, limit=1000):
        existing = keywords(memory.content)
        union = wanted | existing
        if union and len(wanted & existing) / len(union) >= threshold:
            return memory
    return None

def apply_decision(store: VersionedStore, user_id: str, candidate: MemoryRecord, decision: dict) -> str:
    """Carry out a model's decision about one checked candidate: add it, supersede an old memory, or skip it."""
    duplicate = find_duplicate(store, user_id, candidate)
    if duplicate is not None:
        return f"skipped, already known: {duplicate.content}"
    if decision["action"] == "skip":
        return f"skipped: {candidate.content}"
    if decision["action"] == "add":
        store.save(user_id, candidate)
        return f"added: {candidate.content}"
    if decision["action"] == "supersede":
        old = [m for m in store.search(user_id, limit=1000) if m.content == decision.get("replaces")]
        if not old:
            return f"refused, nothing stored matches: {decision.get('replaces')}"
        # only the user's word replaces the user's word
        if old[0].source == "user" and candidate.source != "user":
            return f"refused, the user said otherwise: {old[0].content}"
        store.supersede(user_id, old[0].content, candidate)
        return f"superseded: {old[0].content} -> {candidate.content}"
    return f"refused, unknown action: {decision['action']}"
```

`apply_decision` checks for a duplicate before anything else, whatever the model decided, then carries out the decision under the rule. A decision to supersede something that isn't stored, or is already superseded, is refused.

---

## Quiz cards

> **Q1.** Why are duplicates a problem, even though each copy is correct?
> - A) They break the store's validation
> - B) They're recalled again and again, and crowd out other memories from a limited recall ✅
> - C) They make contradictions impossible to detect
> - D) Pydantic rejects identical records
>
> *Explanation:* Recall returns a few memories at a time. Three copies of one fact leave room for fewer of everything else.

> **Q2.** Why does code catch duplicates, while a model decides contradictions?
> - A) Duplicates share words, which code can measure; whether two statements contradict is a question of meaning ✅
> - B) Models can't detect duplicates
> - C) Contradictions are rarer
> - D) Code is cheaper for everything
>
> *Explanation:* Keyword overlap handles near-identical memories. "Tom owns it" against "Priya owns it" needs judgment. Duplicates in different words need Module 5's search by meaning.

> **Q3.** Why does this store mark a contradicted memory as superseded instead of deleting it, as Mem0 does?
> - A) Deleting is slower
> - B) Superseded memories are recalled with a warning
> - C) It keeps a record, lets a bad replacement be undone, and gives Lesson 11 the history it needs ✅
> - D) Pydantic can't delete records
>
> *Explanation:* A superseded memory leaves search, so it doesn't reach sessions, but it isn't gone. Undoing matters most when the replacement was a mistake or was planted.

> **Q4.** Why doesn't the rule rank sources user over agent over tool?
> - A) Rankings are too slow to check
> - B) Tools are always more reliable than the agent
> - C) The agent's memories can't be superseded
> - D) It would stop a wiki from correcting the agent's earlier guess; the real danger is narrower, outside text overwriting what the user said ✅
>
> *Explanation:* So the rule protects exactly that: only the user's word replaces the user's word. Between agent and tool memories, newer evidence wins.

> **Q5.** Why does `apply_decision` check for a duplicate before looking at the model's decision?
> - A) The decision is model output like any other, and a duplicate shouldn't be stored whatever it says ✅
> - B) Duplicates can only be found before adding
> - C) The model never sees duplicates
> - D) It's faster to check first
>
> *Explanation:* The model decides; code checks and carries out. A decision to "supersede" with a duplicate would otherwise replace a memory with a copy of another.

---

## Applied sandbox exercise

*(graded — keeping the store consistent)*

**Task shown to learner:** `keywords`, `MemoryRecord` and `VersionedStore` are provided. Implement:

- **`find_duplicate(store, user_id, candidate, threshold=0.8)`:**
  - Among the user's active memories of the same type as `candidate`, return the first one where the keywords shared with the candidate, divided by all the keywords either has, reach `threshold`.
  - Return `None` if there's no such memory.
- **`apply_decision(store, user_id, candidate, decision)`:** return a line saying what happened.
  - First, if `find_duplicate` finds one, return `skipped, already known: CONTENT` (the stored memory's content), whatever the decision.
  - `{"action": "skip"}` returns `skipped: CONTENT`, and `{"action": "add"}` saves the candidate and returns `added: CONTENT`.
  - `{"action": "supersede", "replaces": OLD}`:
    - If no active memory has content `OLD`, return `refused, nothing stored matches: OLD`.
    - If that memory's source is `"user"` and the candidate's isn't, return `refused, the user said otherwise: OLD`.
    - Otherwise call `store.supersede` and return `superseded: OLD -> NEW`.
  - Any other action returns `refused, unknown action: ACTION`.

**Provided code:** `keywords` from Lesson 8, `Memory` and `MemoryStore` from Lesson 9, and `MemoryRecord` and `VersionedStore` as shown in this concept.

**Starter code:**
```python
def find_duplicate(store: VersionedStore, user_id: str, candidate: MemoryRecord, threshold: float = 0.8):
    # TODO: among active memories of the same type, return the first whose keywords overlap the candidate's
    #       by at least `threshold` (shared / all), or None
    ...

def apply_decision(store: VersionedStore, user_id: str, candidate: MemoryRecord, decision: dict) -> str:
    # TODO: skip duplicates first; then carry out "skip", "add" or "supersede" under the rules; refuse anything else
    ...
```

**Hidden tests:**
```python
def record(content, source="user", created="2026-09-28T09:00:00", kind="semantic"):
    return MemoryRecord(content=content, type=kind, source=source, created=created)

def setup():
    store = VersionedStore()
    store.save("u", record("Priya owns support_agent.", "user", "2026-09-14T10:00:00"))
    store.save("u", record("support_agent escalations go to #support.", "agent", "2026-09-14T10:05:00"))
    store.save("u", record("Write summaries as bullet points.", "user", "2026-09-14T10:06:00", kind="procedural"))
    return store

active = lambda store: sorted(m.content for m in store.search("u", limit=100))

# 1. find_duplicate: same type, keywords nearly the same (case and punctuation don't matter)
store = setup()
assert find_duplicate(store, "u", record("priya owns SUPPORT_AGENT")).content == "Priya owns support_agent."
assert find_duplicate(store, "u", record("Priya owns support_agent.", kind="episodic")) is None
assert find_duplicate(store, "u", record("support_agent escalations go to #support-oncall.")) is None
assert find_duplicate(store, "u", record("Priya owns billing_agent.")) is None
assert find_duplicate(store, "u", record("Write summaries as short bullet points.", kind="procedural")).content == \
    "Write summaries as bullet points."

# 2. a duplicate is skipped whatever the decision says, and nothing is saved
assert apply_decision(store, "u", record("Priya owns support_agent!", "tool"), {"action": "add"}) == \
    "skipped, already known: Priya owns support_agent."
assert len(store.search("u", limit=100, include_superseded=True)) == 3
assert apply_decision(store, "u", record("Priya owns support_agent.", "user"),
                      {"action": "supersede", "replaces": "support_agent escalations go to #support."}) == \
    "skipped, already known: Priya owns support_agent."
assert "support_agent escalations go to #support." in active(store)

# 3. add and skip do what they say
assert apply_decision(store, "u", record("billing_agent handles refunds.", "tool"), {"action": "add"}) == "added: billing_agent handles refunds."
assert apply_decision(store, "u", record("The weather was nice.", "agent"), {"action": "skip"}) == "skipped: The weather was nice."
assert "The weather was nice." not in active(store)

# 4. supersede: the old memory is kept, marked, and leaves search; the new one takes its place
assert apply_decision(store, "u", record("support_agent escalations go to #support-oncall.", "tool"),
                      {"action": "supersede", "replaces": "support_agent escalations go to #support."}) == \
    "superseded: support_agent escalations go to #support. -> support_agent escalations go to #support-oncall."
assert "support_agent escalations go to #support." not in active(store)
kept = [m for m in store.search("u", limit=100, include_superseded=True) if m.superseded]
assert [m.content for m in kept] == ["support_agent escalations go to #support."]

# 5. only the user's word replaces the user's word
for source in ["tool", "agent"]:
    assert apply_decision(store, "u", record("Tom owns support_agent.", source),
                          {"action": "supersede", "replaces": "Priya owns support_agent."}) == \
        "refused, the user said otherwise: Priya owns support_agent."
assert "Priya owns support_agent." in active(store) and "Tom owns support_agent." not in active(store)
assert apply_decision(store, "u", record("Tom owns support_agent now.", "user"),
                      {"action": "supersede", "replaces": "Priya owns support_agent."}).startswith("superseded:")

# 6. superseding something that isn't stored, or is already superseded, is refused
assert apply_decision(store, "u", record("x y z", "user"), {"action": "supersede", "replaces": "Nothing like this."}) == \
    "refused, nothing stored matches: Nothing like this."
assert apply_decision(store, "u", record("p q r", "user"), {"action": "supersede", "replaces": "Priya owns support_agent."}) == \
    "refused, nothing stored matches: Priya owns support_agent."

# 7. an unknown action is refused
assert apply_decision(store, "u", record("m n o", "user"), {"action": "delete"}) == "refused, unknown action: delete"
```

**Hint (shown on request):** `store.search(user_id, kind=candidate.type, limit=1000)` gives the active memories of the same type, and `a | b` is the set of all keywords either has. For superseding, search the active memories only, so a memory that was already replaced can't be replaced again.

**Reference solution:**
```python
def find_duplicate(store: VersionedStore, user_id: str, candidate: MemoryRecord, threshold: float = 0.8):
    """An active memory of the same type whose keywords nearly match the candidate's, or None."""
    wanted = keywords(candidate.content)
    for memory in store.search(user_id, kind=candidate.type, limit=1000):
        existing = keywords(memory.content)
        union = wanted | existing
        if union and len(wanted & existing) / len(union) >= threshold:
            return memory
    return None

def apply_decision(store: VersionedStore, user_id: str, candidate: MemoryRecord, decision: dict) -> str:
    """Carry out a model's decision about one checked candidate: add it, supersede an old memory, or skip it."""
    duplicate = find_duplicate(store, user_id, candidate)
    if duplicate is not None:
        return f"skipped, already known: {duplicate.content}"
    if decision["action"] == "skip":
        return f"skipped: {candidate.content}"
    if decision["action"] == "add":
        store.save(user_id, candidate)
        return f"added: {candidate.content}"
    if decision["action"] == "supersede":
        old = [m for m in store.search(user_id, limit=1000) if m.content == decision.get("replaces")]
        if not old:
            return f"refused, nothing stored matches: {decision.get('replaces')}"
        # only the user's word replaces the user's word
        if old[0].source == "user" and candidate.source != "user":
            return f"refused, the user said otherwise: {old[0].content}"
        store.supersede(user_id, old[0].content, candidate)
        return f"superseded: {old[0].content} -> {candidate.content}"
    return f"refused, unknown action: {decision['action']}"
```

**Explanation:** Test 5 is the rule: neither a tool nor the agent can replace what the user said, and the user can. A version that ranks sources fully also blocks the wiki from correcting the agent's guess in test 4. Test 1 checks that duplicates are near-identical memories of the same type, including one that differs by a single word. Test 2 checks that duplicates are skipped whatever the model decided, including a decision to supersede. Test 6 refuses replacing a memory that's already been replaced.

---

*(End of Concept 2.)*
