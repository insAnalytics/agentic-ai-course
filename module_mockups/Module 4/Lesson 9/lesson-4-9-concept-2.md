# Module 4, Lesson 9 — Concept 2: Three ways an agent uses the store

> **Note for the site build:** add `make_memory_tools`, `write_after_session` and `CoreBlock` to this lesson's setup, after `Memory` and `MemoryStore`, with `from pydantic import ValidationError`.

---

## Three ways, three questions

The handover between a session and the store can happen in three ways, and they differ on three questions:

- **Who decides what's remembered:** the model, as it works, or code, afterwards?
- **What does it cost:** extra tool calls, an extra model call per session, or tokens on every request?
- **When does it take effect:** immediately, or from the next session?

## Tools the model calls

The most direct way: give the model a `save_memory` and a `search_memory` tool, and let it decide when to use them.

One detail is decisive. **The model never says whose memory it's using.** It would be natural to give the search tool a `user_id` parameter. Here's what that allows:

```python
store = MemoryStore()
store.save("u_simar", Memory(content="Priya owns support_agent.", type="semantic", source="user", created="2026-09-21T10:04:00"))
store.save("u_ravi", Memory(content="Ravi's on-call phone is +44 7700 900123.", type="semantic", source="user", created="2026-09-19T15:20:00"))

# the mistake: a search tool that takes the user as an argument, so the model decides whose memory it reads
def search_any_user(user_id: str, query: str) -> str:
    return "\n".join(m.content for m in store.search(user_id, query))

# in Simar's session, a scripted call names another user; the model might do that if a page or message told it to
call = ToolUseBlock(name="search_memory", input={"user_id": "u_ravi", "query": "on-call phone"})
print("unbound:", search_any_user(**call.input))

# bound: the loop decides whose memories these tools use, and the model has no way to say otherwise
tools = make_memory_tools(store, "u_simar", now=lambda: "2026-09-28T09:00:00")
print("bound:  ", tools["search_memory"](query="on-call phone"))
try:
    tools["search_memory"](**call.input)
except TypeError as error:
    print("bound, with a user_id argument:", error)
```
```
unbound: Ravi's on-call phone is +44 7700 900123.
bound:   No matching memories.
bound, with a user_id argument: make_memory_tools.<locals>.search_memory() got an unexpected keyword argument 'user_id'
```
*(runs live, shows output — read-only demo snippet, not graded; the call naming another user is scripted)*

With a `user_id` parameter, anything that can steer the model can steer it into another user's memories: a crafted message, or a web page it read, as [Module 3's threat model](→ Module 3, the tool threat model lesson, prompt injection through tool results concept) described. The fix is for the loop to decide. It creates the tools for each session, bound to that session's user, and the model has no way to name anyone else. In a real loop, the unexpected argument would be caught by [Module 3's validation](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept) and come back as an error observation. It's the same principle as [Lesson 6's minted handles](→ this module, offloading context to storage and note taking lesson, clearing and compaction that can be undone concept, keeping the store in bounds): the model passes back only what it's given.

```python
def make_memory_tools(store: MemoryStore, user_id: str, now) -> dict:
    """save_memory and search_memory for one session, bound to its user. now() returns an ISO timestamp."""
    def save_memory(content: str, kind: str, tags: list = None) -> str:
        try:
            memory = Memory(content=content, type=kind, source="agent", created=now(), tags=tags or [])
        except ValidationError as error:
            first = error.errors()[0]
            return f"Error: {first['loc'][0]}: {first['msg']}"
        store.save(user_id, memory)
        return f"Saved as a {kind} memory."

    def search_memory(query: str, kind: str = None) -> str:
        results = store.search(user_id, query, kind=kind)
        if not results:
            return "No matching memories."
        return "\n".join(f"- [{m.type}, {m.created[:10]}] {m.content}" for m in results)

    return {"save_memory": save_memory, "search_memory": search_memory}
```

A memory saved through the tool is marked `source="agent"`: the model wrote it, even when it's recording something the user said. Whether that's the right mark, and what an agent-written memory may contain, is [Lesson 10's](→ this module, deciding what to remember lesson) question.

## A pipeline after the session

The model doesn't always save what matters, and it can save things that don't. A second way puts code in charge of the timing. When a session ends, an extraction step reads the whole finished session and proposes memories, and the pipeline validates and stores them. Seeing the whole session, the extraction can judge what turned out to matter. The cost is one extra model call per session, and nothing it saves is available until the next one.

```python
def write_after_session(store: MemoryStore, user_id: str, extracted: list, now) -> list:
    """Save what an extraction step found after a session. Returns one line per item: saved, or why not."""
    report = []
    for item in extracted:
        try:
            memory = Memory(created=now(), **item)
        except ValidationError as error:
            first = error.errors()[0]
            report.append(f"skipped ({first['loc'][0]}: {first['msg']}): {item.get('content', '')}")
            continue
        store.save(user_id, memory)
        report.append(f"saved {memory.type}: {memory.content}")
    return report
```

The extraction step itself, the model call that decides what's worth keeping, is Lesson 10's subject. Here it's scripted, and the pipeline's job is only to refuse anything malformed and say why.

## A block the agent edits

The third way is a short piece of text that's in every request, and that the agent edits itself. It's for the handful of things that always matter: who the user is, how they like to work. It comes from Letta (formerly MemGPT), whose "core memory" blocks are [pinned to the context window](https://docs.letta.com/guides/ade/core-memory), have length limits, and are edited with tools like `memory_replace`. Claude's memory tool has similar edit commands, working on files.

Two rules make a block like this safe to keep in every request:

- **A hard limit.** It's in every request, so it can't be allowed to grow. An edit that would take it over the limit is refused, with a message saying so.
- **Exact edits.** `replace` changes only the first exact match of the text given, so an edit can't quietly rewrite more than it meant to.

```python
class CoreBlock:
    """A short memory the agent edits itself and sees in every session. It has a hard size limit."""
    def __init__(self, text: str = "", max_chars: int = 400):
        self.text = text
        self.max_chars = max_chars

    def _fits(self, candidate: str) -> str:
        if len(candidate) > self.max_chars:
            return (f"Error: that would make the block {len(candidate)} characters, over its limit of {self.max_chars}. "
                    f"Shorten or replace something first.")
        return ""

    def append(self, line: str) -> str:
        candidate = self.text + ("\n" if self.text else "") + line
        problem = self._fits(candidate)
        if problem:
            return problem
        self.text = candidate
        return "Added."

    def replace(self, old: str, new: str) -> str:
        if old not in self.text:
            return f"Error: the block doesn't contain {old!r}. Replace text exactly as it appears."
        # the 1 means only the first occurrence is replaced
        candidate = self.text.replace(old, new, 1)
        problem = self._fits(candidate)
        if problem:
            return problem
        self.text = candidate
        return "Replaced."
```

Where the block goes in each request, and when edits take effect, is the next concept's subject. It matters for the cache.

```python
store = MemoryStore()
clock = lambda: "2026-09-28T09:00:00"

# way 2: after the session, an extraction step (scripted here; Lesson 10 builds it) proposes memories
extracted = [
    {"content": "cc Priya on anything about support_agent.", "type": "procedural", "source": "user", "tags": ["support_agent"]},
    {"content": "support_agent's bottleneck was billing_agent's lookup.", "type": "episodic", "source": "agent", "tags": ["support_agent"]},
    {"content": "The user seems to prefer short answers.", "type": "preference", "source": "agent"},
]
for line in write_after_session(store, "u_simar", extracted, clock):
    print(line)

# way 3: a small block the agent edits itself, with a hard limit
block = CoreBlock("User: Simar, operations lead.\nPrefers: bullet points.", max_chars=120)
print("\n" + block.replace("bullet points", "bullet points, no more than five"))
print(block.append("Owns: support_agent, billing_agent, search_agent, triage_agent, report_agent."))
print(block.append("Timezone: IST."))
print(block.replace("Prefers: tables", "Prefers: charts"))
print("\n" + block.text, f"\n({len(block.text)} of {block.max_chars} characters)")
```
```
saved procedural: cc Priya on anything about support_agent.
saved episodic: support_agent's bottleneck was billing_agent's lookup.
skipped (type: Input should be 'episodic', 'semantic' or 'procedural'): The user seems to prefer short answers.

Replaced.
Error: that would make the block 150 characters, over its limit of 120. Shorten or replace something first.
Added.
Error: the block doesn't contain 'Prefers: tables'. Replace text exactly as it appears.

User: Simar, operations lead.
Prefers: bullet points, no more than five.
Timezone: IST. 
(87 of 120 characters)
```
*(runs live, shows output — read-only demo snippet, not graded; the extraction output is scripted)*

## Choosing

- **Tools** take effect immediately and cost a call each time. They depend on the model knowing what's worth keeping, and on its judgment in the moment.
- **The pipeline** judges a whole session at once, costs one call per session, and takes effect next time.
- **The block** is always present, costs tokens on every request, and suits only a few lines.

Real systems often combine them: a block for the few things always needed, tools for what the model notices along the way, and a pipeline to catch what it missed.

---

## Quiz cards

> **Q1.** Why doesn't `search_memory` take a `user_id` argument?
> - A) The store doesn't support per-user search
> - B) Anything that can steer the model could then steer it into another user's memories; the loop binds the tools to the session's user instead ✅
> - C) User ids are too long for tool arguments
> - D) The model already knows the user's id
>
> *Explanation:* In the demo, the unbound tool returned Ravi's phone number in Simar's session. The bound tool has no way to name another user at all.

> **Q2.** A memory saved through `save_memory` is marked `source="agent"`, even when it records something the user said. Why?
> - A) It's a mistake that Lesson 10 fixes
> - B) The user can't save memories
> - C) The model wrote it, so it's the agent's account of what was said; what that allows is Lesson 10's question ✅
> - D) Tools can only save agent memories to keep them separate
>
> *Explanation:* Recording who wrote a memory honestly is what makes Lesson 10's source rules possible.

> **Q3.** What does the post-session pipeline do better than tools the model calls as it works?
> - A) It judges the whole finished session, so it can see what turned out to matter ✅
> - B) It takes effect immediately
> - C) It costs nothing
> - D) It doesn't need validation
>
> *Explanation:* The cost is one extra model call per session, and anything it saves is available only from the next session.

> **Q4.** Why does `CoreBlock` refuse an edit that would take it over its limit, instead of trimming it?
> - A) Trimming is slow
> - B) The block is saved to disk
> - C) The limit only applies to new sessions
> - D) The block is in every request, so it can't grow; refusing, with a message, lets the agent decide what to shorten ✅
>
> *Explanation:* Trimming silently would lose text the agent chose to keep. A refusal leaves the choice with the agent.

> **Q5.** Why does `replace` change only the first exact match?
> - A) So an edit can't quietly rewrite more of the block than it meant to ✅
> - B) Python can only replace one match
> - C) To keep the block under its limit
> - D) The model can only see the first line
>
> *Explanation:* A short phrase can appear more than once. Replacing the first exact match keeps each edit small and predictable.

---

## Applied sandbox exercise

*(graded — memory tools and a core block)*

**Task shown to learner:** `Memory`, `MemoryStore` and `ValidationError` are provided. Implement:

- **`make_memory_tools(store, user_id, now)`:** return `{"save_memory": ..., "search_memory": ...}`. Both functions use `user_id` and neither takes it as an argument. `now()` returns the current ISO timestamp.
  - **`save_memory(content, kind, tags=None)`:** build a `Memory` with `source="agent"`, `created=now()` and `tags` (or `[]`), save it for this user, and return `Saved as a KIND memory.`. If Pydantic refuses it, save nothing and return `Error: FIELD: MESSAGE`, using the first error's `loc[0]` and `msg`.
  - **`search_memory(query, kind=None)`:** search this user's memories. Return `No matching memories.` if there are none, or one line per result, `- [TYPE, DATE] CONTENT`, where DATE is the first ten characters of `created`, joined by `"\n"`.
- **`CoreBlock(text="", max_chars=400)`:**
  - **`append(line)`:** add the line, after a newline unless the block is empty, and return `Added.`.
  - **`replace(old, new)`:** replace the first exact occurrence of `old` and return `Replaced.`. If `old` isn't there, return `Error: the block doesn't contain OLD. Replace text exactly as it appears.`, with OLD written using `!r`.
  - Either edit that would make the block longer than `max_chars` is refused with `Error: that would make the block N characters, over its limit of MAX. Shorten or replace something first.`.
  - A refused edit changes nothing.

**Provided code:** `Memory` and `MemoryStore` from the previous concept, `keywords` from Lesson 8, and `ValidationError` from Pydantic.

**Starter code:**
```python
def make_memory_tools(store: MemoryStore, user_id: str, now) -> dict:
    # TODO: define save_memory(content, kind, tags=None) and search_memory(query, kind=None) inside,
    #       both using this user_id, and return them in a dict
    ...

class CoreBlock:
    def __init__(self, text: str = "", max_chars: int = 400):
        self.text = text
        self.max_chars = max_chars

    def append(self, line: str) -> str:
        # TODO: add the line (on a new line, unless the block is empty), unless that goes over the limit
        ...

    def replace(self, old: str, new: str) -> str:
        # TODO: replace the first exact match, unless it isn't there or the result goes over the limit
        ...
```

**Hidden tests:**
```python
store = MemoryStore()
times = iter(["2026-09-28T09:00:00", "2026-09-28T09:05:00", "2026-09-28T09:10:00", "2026-09-28T09:15:00"])
simar = make_memory_tools(store, "u_simar", now=lambda: next(times))
ravi = make_memory_tools(store, "u_ravi", now=lambda: "2026-09-28T10:00:00")

# 1. save_memory stores a memory for this session's user, written by the agent, at the current time
assert simar["save_memory"](content="Priya owns support_agent.", kind="semantic", tags=["people"]) == "Saved as a semantic memory."
saved = store.search("u_simar")[0]
assert (saved.source, saved.created, saved.tags) == ("agent", "2026-09-28T09:00:00", ["people"])

# 2. an invalid memory is refused with an error the model can act on, and nothing is stored
assert simar["save_memory"](content="Short answers.", kind="preference") == \
    "Error: type: Input should be 'episodic', 'semantic' or 'procedural'"
assert simar["save_memory"](content="", kind="semantic") == "Error: content: String should have at least 1 character"
assert len(store.search("u_simar")) == 1

# 3. search_memory lists matches with their type and date, filtered by kind if asked
simar["save_memory"](content="support_agent moved to claude-sonnet.", kind="episodic")
assert simar["search_memory"](query="support_agent") == (
    "- [episodic, 2026-09-28] support_agent moved to claude-sonnet.\n- [semantic, 2026-09-28] Priya owns support_agent.")
assert simar["search_memory"](query="support_agent", kind="semantic") == "- [semantic, 2026-09-28] Priya owns support_agent."
assert simar["search_memory"](query="kubernetes") == "No matching memories."

# 4. each session's tools only ever touch its own user, and there is no way to name another
ravi["save_memory"](content="support_agent notes go to #search-team.", kind="procedural")
assert "#search-team" not in simar["search_memory"](query="support_agent notes")
assert ravi["search_memory"](query="Priya") == "No matching memories."
try:
    simar["search_memory"](query="notes", user_id="u_ravi")
    assert False, "accepted a user_id"
except TypeError:
    pass

block = CoreBlock("User: Simar.", max_chars=40)

# 5. append adds a line; replace changes the first exact match only
assert block.append("Prefers: bullets.") == "Added." and block.text == "User: Simar.\nPrefers: bullets."
assert block.replace("bullets", "short bullets") == "Replaced." and block.text == "User: Simar.\nPrefers: short bullets."
assert CoreBlock("").append("First line.") == "Added."
twice = CoreBlock("a a")
twice.replace("a", "b")
assert twice.text == "b a"

# 6. nothing may take the block over its limit; exactly at the limit is fine; a refused edit changes nothing
assert block.append("Timezone: IST, UTC+5:30.") == \
    "Error: that would make the block 61 characters, over its limit of 40. Shorten or replace something first."
assert block.text == "User: Simar.\nPrefers: short bullets."
exact = CoreBlock("", max_chars=5)
assert exact.append("12345") == "Added." and exact.append("6").startswith("Error:")

# 7. replacing text that isn't there says so
assert block.replace("Prefers: tables", "x") == "Error: the block doesn't contain 'Prefers: tables'. Replace text exactly as it appears."
```

**Hint (shown on request):** Define the two tool functions inside `make_memory_tools`, so they can use `store`, `user_id` and `now` without taking them as arguments. That's a closure, as in Module 0's decorators. In `CoreBlock`, build the candidate text first, check its length, and only then assign it to `self.text`.

**Reference solution:**
```python
def make_memory_tools(store: MemoryStore, user_id: str, now) -> dict:
    """save_memory and search_memory for one session, bound to its user. now() returns an ISO timestamp."""
    def save_memory(content: str, kind: str, tags: list = None) -> str:
        try:
            memory = Memory(content=content, type=kind, source="agent", created=now(), tags=tags or [])
        except ValidationError as error:
            first = error.errors()[0]
            return f"Error: {first['loc'][0]}: {first['msg']}"
        store.save(user_id, memory)
        return f"Saved as a {kind} memory."

    def search_memory(query: str, kind: str = None) -> str:
        results = store.search(user_id, query, kind=kind)
        if not results:
            return "No matching memories."
        return "\n".join(f"- [{m.type}, {m.created[:10]}] {m.content}" for m in results)

    return {"save_memory": save_memory, "search_memory": search_memory}

class CoreBlock:
    """A short memory the agent edits itself and sees in every session. It has a hard size limit."""
    def __init__(self, text: str = "", max_chars: int = 400):
        self.text = text
        self.max_chars = max_chars

    def _fits(self, candidate: str) -> str:
        if len(candidate) > self.max_chars:
            return (f"Error: that would make the block {len(candidate)} characters, over its limit of {self.max_chars}. "
                    f"Shorten or replace something first.")
        return ""

    def append(self, line: str) -> str:
        candidate = self.text + ("\n" if self.text else "") + line
        problem = self._fits(candidate)
        if problem:
            return problem
        self.text = candidate
        return "Added."

    def replace(self, old: str, new: str) -> str:
        if old not in self.text:
            return f"Error: the block doesn't contain {old!r}. Replace text exactly as it appears."
        # the 1 means only the first occurrence is replaced
        candidate = self.text.replace(old, new, 1)
        problem = self._fits(candidate)
        if problem:
            return problem
        self.text = candidate
        return "Replaced."
```

**Explanation:** Test 4 is the scoping rule for tools: each session's tools touch only their own user, and a call that tries to name another user fails outright. A version with a `user_id` parameter, even one that defaults to the session's user, accepts it. Test 1 checks that saved memories carry the agent as their source and the current time. Test 6 checks the block's limit, including a block filled exactly to it, and that a refused edit changes nothing. Test 5 catches replacing every occurrence instead of the first.

---

*(End of Concept 2.)*
