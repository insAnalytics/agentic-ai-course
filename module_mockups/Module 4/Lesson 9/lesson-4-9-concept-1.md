# Module 4, Lesson 9 — Concept 1: A memory record, and a store scoped by design

> **Note for the site build:** add `Memory` and `MemoryStore` (the code blocks under "A memory record" and "A store scoped by design") to this lesson's setup, after Lesson 8's `STOPWORDS` and `keywords` (the updated version, which drops one-letter words). They need Pydantic, as Module 0's typed-data-models lesson did. **Module 0 gap list:** `Field(min_length=...)` is used here with a one-line comment; Module 0 teaches `Field` only through Module 3's `description=`.

---

## What a string can't tell you

[Lesson 8](→ this module, short term and long term memory lesson) kept memories as plain strings, then as small dicts with a type and a date. That was enough to show the architecture. A real store has to answer more questions about each memory:

- **Where did it come from?** "Post status notes to #search-team" reads the same whether the user said it, the agent concluded it, or a web page said it. [Lesson 10](→ this module, deciding what to remember lesson) treats those three very differently.
- **When was it made?** Episodes are recalled newest first, and [Lesson 11](→ this module, forgetting aging and retrieval quality lesson) ages memories out.
- **What is it about?** Tags let a search find "everything about support_agent" even when the words differ.

A string can't answer any of them. A record can.

## A memory record

[Module 0's Pydantic model](→ Module 0, typed data models lesson, pydantic fundamentals concept) is the natural fit: fixed fields, checked when a memory is created, and [`Literal`](→ Module 3, designing tools a model can use well lesson, parameter design concept) for fields with a fixed set of allowed values:

```python
from typing import Literal
from pydantic import BaseModel, Field

class Memory(BaseModel):
    # min_length=1 makes Pydantic reject an empty string
    content: str = Field(min_length=1)
    type: Literal["episodic", "semantic", "procedural"]
    # who the memory came from: the user, the agent's own conclusion, or a tool result
    source: Literal["user", "agent", "tool"]
    # an ISO timestamp such as "2026-09-21T10:04:00", which sorts correctly as text
    created: str
    tags: list[str] = []
```

- **`content`** is one self-contained statement, as [Lesson 8 described](→ this module, short term and long term memory lesson, storage retrieval injection concept, storage what where whose).
- **`type`** is one of [Lesson 8's three kinds](→ this module, short term and long term memory lesson, episodic semantic procedural concept).
- **`source`** records who the memory came from: `"user"` (the user said it), `"agent"` (the agent concluded it) or `"tool"` (it came from a tool result, a fetched page or a document). What each source is allowed to become is Lesson 10's rule. The record just has to carry it.
- **`created`** is an ISO timestamp, kept as a string. ISO timestamps sort correctly as text, which is all the store needs from them.
- **`tags`** are short labels for finding related memories.

```python
from pydantic import ValidationError

# a memory as a plain string: all you can do is read it
plain = "Post status notes to #search-team, not by email."

# the same memory as a record: who it came from, when, and what it's about
record = Memory(content="Post status notes to #search-team, not by email.", type="procedural",
                source="user", created="2026-09-19T15:20:00", tags=["status-notes", "search_agent"])
print(record.model_dump())

# a record that's missing something, or has a value outside the allowed set, is refused
for bad in [dict(content="", type="semantic", source="user", created="2026-09-21T10:00:00"),
            dict(content="Priya owns support_agent.", type="preference", source="user", created="2026-09-21T10:00:00"),
            dict(content="Priya owns support_agent.", type="semantic", source="a web page", created="2026-09-21T10:00:00")]:
    try:
        Memory(**bad)
    except ValidationError as error:
        first = error.errors()[0]
        print(f"refused, {first['loc'][0]}: {first['msg']}")
```
```
{'content': 'Post status notes to #search-team, not by email.', 'type': 'procedural', 'source': 'user', 'created': '2026-09-19T15:20:00', 'tags': ['status-notes', 'search_agent']}
refused, content: String should have at least 1 character
refused, type: Input should be 'episodic', 'semantic' or 'procedural'
refused, source: Input should be 'user', 'agent' or 'tool'
```
*(runs live, shows output — read-only demo snippet, not graded)*

Pydantic refuses a record with no content, an unknown type, or a source outside the three, before it ever reaches the store. "a web page" isn't a source; it's a `"tool"` source, and the difference matters in Lesson 10.

## A store scoped by design

Per-user separation isn't a filter applied after the fact. It's built into the shape of the store's interface: **every method takes the user it acts for, and no method can return another user's memories.** There's no "search everything" call to misuse.

```python
class MemoryStore:
    """Every user's memories, kept apart. Every method takes the user it acts for."""
    def __init__(self):
        self._by_user = {}

    def save(self, user_id: str, memory: Memory) -> None:
        # a copy, so the caller changing their object later can't change what's stored
        self._by_user.setdefault(user_id, []).append(Memory(**memory.model_dump()))

    def search(self, user_id: str, query: str = "", tags: list = None, kind: str = None, limit: int = 5) -> list:
        """This user's memories that match, best first; with no query, newest first."""
        candidates = []
        for memory in self._by_user.get(user_id, []):
            if kind is not None and memory.type != kind:
                continue
            if tags and not set(tags) & set(memory.tags):
                continue
            candidates.append(memory)
        newest_first = sorted(candidates, key=lambda m: m.created, reverse=True)
        if not query:
            return newest_first[:limit]
        wanted = keywords(query)
        scored = [(len(wanted & keywords(m.content + " " + " ".join(m.tags))), m) for m in newest_first]
        # sorting is stable, so memories with equal scores stay newest first
        ranked = sorted([pair for pair in scored if pair[0] > 0], key=lambda pair: pair[0], reverse=True)
        return [m for score, m in ranked[:limit]]
```

Search applies the filters first, type and then tags, where any matching tag counts. Then, if there's a query, it keeps the memories that share a keyword with it, in content or tags, and ranks them by how many. With no query, it returns the newest first. Keywords are [Lesson 8's](→ this module, short term and long term memory lesson, storage retrieval injection concept, retrieval when and how); searching by meaning is Module 5's subject.

```python
store = MemoryStore()
simar = [
    Memory(content="Write summaries as bullet points.", type="procedural", source="user", created="2026-09-14T09:00:00", tags=["summaries"]),
    Memory(content="Priya owns support_agent.", type="semantic", source="user", created="2026-09-21T10:04:00", tags=["support_agent", "people"]),
    Memory(content="billing_agent's per-ticket lookup was support_agent's bottleneck.", type="episodic", source="agent",
           created="2026-09-21T11:30:00", tags=["support_agent", "billing_agent"]),
    Memory(content="support_agent had an outage after a bad deploy.", type="episodic", source="tool", created="2026-07-03T08:00:00", tags=["support_agent"]),
]
for memory in simar:
    store.save("u_simar", memory)
store.save("u_ravi", Memory(content="Post status notes to #search-team, not by email.", type="procedural", source="user",
                            created="2026-09-19T15:20:00", tags=["status-notes"]))

def show(label, results):
    print(label)
    for m in results:
        print(f"   {m.created[:10]}  {m.type:10} {m.source:5}  {m.content}")

show("simar, query 'support_agent status':", store.search("u_simar", "support_agent status"))
show("simar, tag 'people':", store.search("u_simar", tags=["people"]))
show("simar, episodic only, newest first:", store.search("u_simar", kind="episodic"))
show("ravi, query 'support_agent status':", store.search("u_ravi", "support_agent status"))
show("someone new:", store.search("u_new", "support_agent"))
```
```
simar, query 'support_agent status':
   2026-09-21  episodic   agent  billing_agent's per-ticket lookup was support_agent's bottleneck.
   2026-09-21  semantic   user   Priya owns support_agent.
   2026-07-03  episodic   tool   support_agent had an outage after a bad deploy.
simar, tag 'people':
   2026-09-21  semantic   user   Priya owns support_agent.
simar, episodic only, newest first:
   2026-09-21  episodic   agent  billing_agent's per-ticket lookup was support_agent's bottleneck.
   2026-07-03  episodic   tool   support_agent had an outage after a bad deploy.
ravi, query 'support_agent status':
   2026-09-19  procedural user   Post status notes to #search-team, not by email.
someone new:
```
*(runs live, shows output — read-only demo snippet, not graded)*

The three results for Simar share a score of one each, so they come back newest first, the order that usually matters most for memories. Ravi's search finds only his own note, and a new user finds nothing at all.

In a production system the dict would be a database table, and the same rule becomes: every query includes the user's id, and there's no code path that runs one without it.

---

## Quiz cards

> **Q1.** Why does every memory record carry a `source`?
> - A) To make search faster
> - B) Because the same sentence can come from the user, the agent or a web page, and later rules treat those very differently ✅
> - C) So memories can be sorted
> - D) Pydantic requires at least four fields
>
> *Explanation:* "Post status notes to #search-team" is a legitimate standing instruction if the user said it, and a warning sign if a fetched page said it. Lesson 10's rules depend on knowing which.

> **Q2.** Why can `created` be a plain string and still be sorted by time?
> - A) Pydantic converts it to a date automatically
> - B) The store sorts by insertion order instead
> - C) ISO timestamps such as "2026-09-21T10:04:00" sort correctly as text ✅
> - D) Strings can't be sorted, so it isn't sorted
>
> *Explanation:* The fields run from largest unit to smallest, each at a fixed width, so text order and time order agree.

> **Q3.** How does `MemoryStore` make per-user separation part of its design, rather than something callers must remember?
> - A) Every method takes the user it acts for, and no method can return another user's memories ✅
> - B) It encrypts each user's memories
> - C) It checks the user's name inside each memory
> - D) It deletes other users' memories before searching
>
> *Explanation:* There's no "search everything" call to misuse. In a database, the same rule is that every query includes the user's id.

> **Q4.** Why does `save` store a copy of the memory?
> - A) Pydantic models can't be stored directly
> - B) Copies take less space
> - C) So search can return them in order
> - D) So a caller changing their object afterwards can't change what's stored ✅
>
> *Explanation:* Pydantic models can be changed after they're created. Without the copy, the stored memory and the caller's variable are the same object.

> **Q5.** Three memories matched a query with the same score. In what order did they come back, and why?
> - A) Alphabetical, so results are stable
> - B) Newest first: the store sorts by time before ranking, and a stable sort keeps that order for equal scores ✅
> - C) Oldest first, because they were stored first
> - D) At random
>
> *Explanation:* Recent memories usually matter most. Ranking by score while keeping time order among ties gets both.

---

## Applied sandbox exercise

*(graded — a scoped memory store)*

**Task shown to learner:** `keywords` from Lesson 8 and the `Memory` model are provided. Complete `MemoryStore`:

- **`save(user_id, memory)`:** add a copy of `memory`, made with `Memory(**memory.model_dump())`, to that user's list.
- **`search(user_id, query="", tags=None, kind=None, limit=5)`:**
  - Consider only this user's memories. An unknown user has none.
  - If `kind` is given, keep only memories of that type. If `tags` is given, keep only memories with at least one of those tags.
  - Sort what's left newest first, by `created`.
  - With no query, return the first `limit`.
  - With a query, score each memory by the number of keywords it shares with the query, counting its content and its tags. Drop zero scores, and return the first `limit`, highest score first, with equal scores still newest first.

**Provided code:** `STOPWORDS` and `keywords` from Lesson 8, and `Memory` as shown in this concept.

**Starter code:**
```python
from typing import Literal
from pydantic import BaseModel, Field

class Memory(BaseModel):
    # min_length=1 makes Pydantic reject an empty string
    content: str = Field(min_length=1)
    type: Literal["episodic", "semantic", "procedural"]
    # who the memory came from: the user, the agent's own conclusion, or a tool result
    source: Literal["user", "agent", "tool"]
    # an ISO timestamp such as "2026-09-21T10:04:00", which sorts correctly as text
    created: str
    tags: list[str] = []

class MemoryStore:
    """Every user's memories, kept apart. Every method takes the user it acts for."""
    def __init__(self):
        self._by_user = {}

    def save(self, user_id: str, memory: Memory) -> None:
        # TODO: add a copy of the memory to this user's list
        ...

    def search(self, user_id: str, query: str = "", tags: list = None, kind: str = None, limit: int = 5) -> list:
        # TODO: this user's memories only; filter by kind and tags; newest first;
        #       with a query, keep those sharing a keyword and rank by how many
        ...
```

**Hidden tests:**
```python
def mem(content, kind="semantic", source="user", created="2026-09-21T10:00:00", tags=None):
    return Memory(content=content, type=kind, source=source, created=created, tags=tags or [])

store = MemoryStore()
store.save("u_a", mem("Priya owns support_agent.", tags=["people", "support_agent"], created="2026-09-21T10:00:00"))
store.save("u_a", mem("support_agent latency spiked.", kind="episodic", source="tool", created="2026-08-20T09:00:00", tags=["support_agent"]))
store.save("u_a", mem("support_agent moved to claude-sonnet.", kind="episodic", source="agent", created="2026-09-21T11:00:00"))
store.save("u_a", mem("Write summaries as bullet points.", kind="procedural", created="2026-09-14T09:00:00"))
store.save("u_b", mem("support_agent notes go to #search-team.", kind="procedural", created="2026-09-19T15:00:00"))

contents = lambda results: [m.content for m in results]

# 1. no query: this user's memories, newest first, at most `limit`
assert contents(store.search("u_a")) == ["support_agent moved to claude-sonnet.", "Priya owns support_agent.",
                                          "Write summaries as bullet points.", "support_agent latency spiked."]
assert len(store.search("u_a", limit=2)) == 2

# 2. a query: only memories that share a keyword with it (content or tags), best first, equal scores newest first
assert contents(store.search("u_a", "support_agent claude-sonnet")) == [
    "support_agent moved to claude-sonnet.", "Priya owns support_agent.", "support_agent latency spiked."]
assert contents(store.search("u_a", "people")) == ["Priya owns support_agent."]
assert store.search("u_a", "kubernetes") == []

# 3. filters: by tag (any of those given) and by type, combined with a query or not
assert contents(store.search("u_a", tags=["people", "nothing"])) == ["Priya owns support_agent."]
assert contents(store.search("u_a", kind="episodic")) == ["support_agent moved to claude-sonnet.", "support_agent latency spiked."]
assert contents(store.search("u_a", "support_agent", kind="episodic", tags=["support_agent"])) == ["support_agent latency spiked."]

# 4. scoping: a user only ever sees their own memories; an unknown user sees none
assert contents(store.search("u_b", "support_agent")) == ["support_agent notes go to #search-team."]
assert "support_agent notes go to #search-team." not in contents(store.search("u_a", "support_agent notes"))
assert store.search("u_zzz") == []

# 5. what's stored is a copy: changing the caller's object afterwards changes nothing
original = mem("The on-call rota changes on Mondays.", created="2026-09-22T08:00:00")
store.save("u_a", original)
original.content = "changed afterwards"
assert store.search("u_a", limit=1)[0].content == "The on-call rota changes on Mondays."
```

**Hint (shown on request):** Filter into a list, then sort it once by `created` with `reverse=True`. Sort the `(score, memory)` pairs by score with `reverse=True`. Python's sort is stable, so ties keep the newest-first order they came in with. For the tags, `" ".join(m.tags)` turns the list into text that `keywords` can read.

**Reference solution:**
```python
class MemoryStore:
    """Every user's memories, kept apart. Every method takes the user it acts for."""
    def __init__(self):
        self._by_user = {}

    def save(self, user_id: str, memory: Memory) -> None:
        # a copy, so the caller changing their object later can't change what's stored
        self._by_user.setdefault(user_id, []).append(Memory(**memory.model_dump()))

    def search(self, user_id: str, query: str = "", tags: list = None, kind: str = None, limit: int = 5) -> list:
        """This user's memories that match, best first; with no query, newest first."""
        candidates = []
        for memory in self._by_user.get(user_id, []):
            if kind is not None and memory.type != kind:
                continue
            if tags and not set(tags) & set(memory.tags):
                continue
            candidates.append(memory)
        newest_first = sorted(candidates, key=lambda m: m.created, reverse=True)
        if not query:
            return newest_first[:limit]
        wanted = keywords(query)
        scored = [(len(wanted & keywords(m.content + " " + " ".join(m.tags))), m) for m in newest_first]
        # sorting is stable, so memories with equal scores stay newest first
        ranked = sorted([pair for pair in scored if pair[0] > 0], key=lambda pair: pair[0], reverse=True)
        return [m for score, m in ranked[:limit]]
```

**Explanation:** Test 4 is the scoping rule: a search for one user never returns another's memory, even when the other memory matches the query better. Test 2 checks that tags count toward the score and that ties come back newest first. A version that ranks without sorting by time first returns ties in the order they were saved. Test 3 checks that `tags` matches any of the given tags, not all of them. Test 5 catches storing the caller's object instead of a copy.

---

*(End of Concept 1.)*
