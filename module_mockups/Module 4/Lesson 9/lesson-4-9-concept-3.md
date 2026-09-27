# Module 4, Lesson 9 — Concept 3: Where recalled memories go, and what it costs

> **Note for the site build:** add `MemoryContext` to this lesson's setup. The demo also needs Lesson 3's `serialize`, `first_divergence`, `cost_of_run` and `add_to_end`.

---

## The question

[Lesson 8](→ this module, short term and long term memory lesson, storage retrieval injection concept, injection where the memories go) set out the rule: memories recalled when a session starts go in the prefix, which then stays fixed, and anything later goes at the end of the request or in a tool result. This concept measures the choices, including the tempting one that breaks the rule. It also settles a question [the previous concept](→ this lesson, three ways an agent uses the store concept, a block the agent edits) left open: where the agent's editable block goes when it changes mid-session.

## Four places for recalled memories

Here's one twelve-turn session. The task moves across three agents, the user has twenty memories spread over five topics, and the agent edits its block twice. Each placement is run over the same work:

```python
BASE = "You are the operations assistant."
TOOLS = [{"name": "search_memory", "description": "Search this user's memories.",
          "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}]
store = MemoryStore()
topics = ["support_agent", "billing_agent", "search_agent", "deploys", "on-call"]
for n in range(20):
    topic = topics[n % 5]
    store.save("u_simar", Memory(content=f"Note {n} about {topic}: something learned in an earlier session.", type="semantic",
                                 source="user", created=f"2026-09-{10 + n}T09:00:00", tags=[topic]))

def lines(memories):
    return "\n".join(f"- [{m.type}] {m.content}" for m in memories)

def run(recall, block_edits):
    """One 12-turn session; the task moves across topics, and the agent edits its block twice."""
    block = CoreBlock("User: Simar, operations lead.\nPrefers: bullet points.", max_chars=400)
    at_start = block.text
    first = lines(store.search("u_simar", "support_agent", limit=3))
    history = [{"role": "user", "content": "Review support_agent, then billing_agent, then search_agent."}]
    requests = []
    for turn in range(12):
        topic = topics[turn // 4]
        if turn in (4, 8):
            block.append(f"Reviewed {topics[turn // 4 - 1]} this week.")
        system = BASE
        shown_block = block.text if block_edits == "in the prefix" else at_start
        system += "\n\n<memory_block>\n" + shown_block + "\n</memory_block>"
        if recall in ("at session start", "each turn, at the end"):
            system += "\n\nFrom earlier sessions:\n" + first
        if recall == "each turn, in the prefix":
            system += "\n\nFrom earlier sessions:\n" + lines(store.search("u_simar", topic, limit=3))
        end = []
        if block_edits == "at the end" and block.text != at_start:
            end.append("Your memory block has changed this session. It now reads:\n" + block.text)
        if recall == "each turn, at the end":
            end.append("Recalled for this step:\n" + lines(store.search("u_simar", topic, limit=3)))
        messages = add_to_end(history, "\n\n".join(end)) if end else list(history)
        requests.append({"tools": TOOLS, "system": system, "messages": messages})
        # the turn itself: a status check of realistic size; on demand, the agent also searches memory when the topic changes
        calls = [ToolUseBlock(name="get_status", input={"agent_name": topic})]
        results = [f"{topic} status:\n" + "field: value, updated 10:04, ok\n" * 25]
        if recall == "on demand" and turn % 4 == 0:
            calls.append(ToolUseBlock(name="search_memory", input={"query": topic}))
            results.append(lines(store.search("u_simar", topic, limit=3)))
        history = history + [{"role": "assistant", "content": calls},
                             {"role": "user", "content": [{"type": "tool_result", "tool_use_id": calls[i].id, "content": results[i]}
                                                          for i in range(len(calls))]}]
    breaks = len([i for i in range(1, len(requests))
                  if first_divergence(requests[i - 1], requests[i])["diverges_at"] in ("tools", "system")])
    return cost_of_run(requests, 0.1, 1.25), breaks

print("where recalled memories go (block edits shown at the end):")
for recall in ["at session start", "each turn, in the prefix", "each turn, at the end", "on demand"]:
    cost, breaks = run(recall, "at the end")
    print(f"   {recall:26} cost {cost:>6,}   prefix broken on {breaks} turns")
print("where the block's edits go (memories recalled at session start):")
for edits in ["in the prefix", "at the end"]:
    cost, breaks = run("at session start", edits)
    print(f"   {edits:26} cost {cost:>6,}   prefix broken on {breaks} turns")
```
```
where recalled memories go (block edits shown at the end):
   at session start           cost  8,077   prefix broken on 0 turns
   each turn, in the prefix   cost 11,231   prefix broken on 2 turns
   each turn, at the end      cost  9,990   prefix broken on 0 turns
   on demand                  cost  8,693   prefix broken on 0 turns
where the block's edits go (memories recalled at session start):
   in the prefix              cost  9,148   prefix broken on 2 turns
   at the end                 cost  8,077   prefix broken on 0 turns
```
*(runs live, shows output — read-only demo snippet, not graded; costs are in Lesson 3's token-units with its example multipliers, and the memories and calls are made up)*

- **At session start** is the cheapest, and it never breaks the prefix. Its limit is that the memories were chosen for the opening topic. When the task moved on to billing_agent and search_agent, nothing was recalled for them.
- **Each turn, in the prefix** keeps memories current by putting each turn's recall in the system prompt. That changed the prefix whenever the topic changed, so everything after it was processed again. It was the most expensive: about 39% more than recalling at session start.
- **Each turn, at the end** keeps memories just as current, and never breaks the prefix, the way [Lesson 2's plan](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept) is restated. It still costs about 24% more than session start: the recalled lines are new text on every turn, and they're never cached.
- **On demand** lets the agent search when it thinks memory will help. Here it did so at each topic change, alongside its normal work. It cost about 8% more than session start, because each search result joins the history and is cached from then on.

So the rule holds, and it's a trade rather than a winner. Recall at session start is cheapest when a session stays on one subject. Recall at the end or on demand costs more, but follows the task. Recalling into the prefix is never the right choice.

## Where the block's edits go

The editable block raises the same question in a sharper form. It's meant to be always present, so the obvious home is the system prompt, rebuilt whenever the agent edits it. That's the design Letta uses. In this session, keeping edits in the prefix cost about 13% more than the alternative, and broke the prefix at each edit.

The alternative follows the rule. The block goes into the prefix as it was when the session started. When the agent edits it, the new text rides at the end of each request, where the agent sees it immediately, until the session ends. The next session starts with the edited block in its prefix. The agent loses nothing, since every edit is visible at once, and the prefix changes only between sessions.

## Putting it together

```python
class MemoryContext:
    """One session's use of memory: fixed in the prefix at the start, anything newer at the end of each request."""
    def __init__(self, base: str, store: MemoryStore, user_id: str, block: CoreBlock, task: str, limit: int = 3):
        self.block = block
        self.block_at_start = block.text
        recalled = store.search(user_id, task, limit=limit)
        system = base
        if block.text:
            system += "\n\n<memory_block>\n" + block.text + "\n</memory_block>"
        if recalled:
            system += "\n\nFrom earlier sessions:\n" + "\n".join(f"- [{m.type}] {m.content}" for m in recalled)
        # built once: the prefix never changes during the session
        self.system = system

    def messages(self, history: list) -> list:
        """What to send: the history, plus the block's current text at the end if it has changed this session."""
        if self.block.text == self.block_at_start:
            return list(history)
        return add_to_end(history, "Your memory block has changed this session. It now reads:\n" + self.block.text)
```

`MemoryContext` builds the prefix once, from the block as it stands and this user's recalled memories, and never touches it again. `messages` sends the history as it is until the block changes, and from then on with the block's current text at the end, never saved into the history. A new `MemoryContext` at the next session starts from the edited block.

## Claude's memory tool

[Claude's memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) is generally available, with no beta header. Checked against its docs, it maps onto this lesson like this:

- **It works on files.** The model asks to view, create or edit files under a `/memories` path.
- **It runs client-side.** Your application carries out each operation against storage you control.
- **Scoping is your handler's job.** The docs describe mapping the `/memories` prefix onto storage such as a per-user directory, and rejecting any path outside it. That's the binding from the previous concept, done by your code.
- **Memories arrive on demand.** When the tool is enabled, the model checks its memory directory before starting a task, and what it reads arrives as tool results. That's the on-demand placement measured above, and it leaves the prefix alone.

---

## Quiz cards

> **Q1.** Recalling memories each turn into the system prompt cost the most. Why?
> - A) The recalled memories were longer
> - B) Recalling is slow
> - C) Each time the topic changed, the recalled memories changed, so the prefix changed, and everything after it was processed again ✅
> - D) The system prompt isn't cached
>
> *Explanation:* The system prompt is part of the prefix. Anything that changes during a session belongs at the end of the request, or in a tool result.

> **Q2.** Recalling at session start was the cheapest. What does it give up?
> - A) Memories for later topics: they were chosen for the opening task, and nothing was recalled when the task moved on ✅
> - B) The cache
> - C) Per-user scoping
> - D) The ability to use the block
>
> *Explanation:* It's the right choice for a session that stays on one subject, and a poor one for a session that wanders.

> **Q3.** Why did recalling each turn at the end cost more than recalling at session start, even though it never broke the prefix?
> - A) The end of the request isn't allowed to be cached
> - B) The recalled lines are new text on every turn, restated and never saved, so they're never read from the cache ✅
> - C) It recalled more memories per turn
> - D) It broke tool pairing
>
> *Explanation:* Restating something at the end is cheap per turn, but not free. The price buys memories that follow the task.

> **Q4.** How does `MemoryContext` let the agent see its block edits immediately without changing the prefix?
> - A) It rebuilds the system prompt after each edit
> - B) It saves the edits into the history
> - C) It keeps the block's start-of-session text in the prefix, adds its current text at the end of each request, and folds edits into the prefix at the next session ✅
> - D) It hides the edits until the next session
>
> *Explanation:* Every edit is visible at once, and the prefix changes only between sessions.

> **Q5.** Which placement does Claude's memory tool use for memories it reads?
> - A) The system prompt, rebuilt each turn
> - B) A separate cached block
> - C) The first user message
> - D) Tool results, since the model reads its memory files on demand ✅
>
> *Explanation:* That leaves the prefix alone. Mapping `/memories` onto each user's own storage is left to your handler, which is the same binding as the previous concept's tools.

---

## Applied sandbox exercise

*(graded — memory in the right places)*

**Task shown to learner:** `MemoryStore`, `CoreBlock` and `add_to_end` are provided. Implement `MemoryContext`:

- **`__init__(base, store, user_id, block, task, limit=3)`:**
  - Keep `block` and a copy of its text right now, `block_at_start`.
  - Build `self.system` once. Start with `base`. If the block has text, add `"\n\n<memory_block>\n" + text + "\n</memory_block>"`. If `store.search(user_id, task, limit=limit)` returns anything, add `"\n\nFrom earlier sessions:\n"` and one line per memory, `- [TYPE] CONTENT`, joined by `"\n"`.
- **`messages(history)`:**
  - If the block's text hasn't changed since the start, return a copy of `history`.
  - Otherwise return `add_to_end(history, "Your memory block has changed this session. It now reads:\n" + current_text)`.
  - Never change `history`, and never change `self.system`.

**Provided code:** `Memory` and `MemoryStore` from the first concept, `CoreBlock` from the previous concept, and `add_to_end` from Lesson 3.

**Starter code:**
```python
class MemoryContext:
    def __init__(self, base: str, store: MemoryStore, user_id: str, block: CoreBlock, task: str, limit: int = 3):
        # TODO: remember the block and its text right now; build self.system once:
        #       the base, then the block (if any), then this user's recalled memories (if any)
        ...

    def messages(self, history: list) -> list:
        # TODO: a copy of the history, with the block's current text added at the end if it changed
        ...
```

**Hidden tests:**
```python
store = MemoryStore()
store.save("u_a", Memory(content="Priya owns support_agent.", type="semantic", source="user", created="2026-09-21T10:00:00"))
store.save("u_a", Memory(content="support_agent moved to claude-sonnet.", type="episodic", source="agent", created="2026-09-22T10:00:00"))
store.save("u_b", Memory(content="support_agent notes go to #search-team.", type="procedural", source="user", created="2026-09-19T10:00:00"))
block = CoreBlock("User: A.\nPrefers: bullets.", max_chars=200)
history = [{"role": "user", "content": "Review support_agent."}]

# 1. the prefix: the base, the block as it was at the start, then this user's recalled memories
context = MemoryContext("Base.", store, "u_a", block, "support_agent review")
assert context.system == ("Base.\n\n<memory_block>\nUser: A.\nPrefers: bullets.\n</memory_block>\n\n"
                          "From earlier sessions:\n- [episodic] support_agent moved to claude-sonnet.\n- [semantic] Priya owns support_agent.")
assert "#search-team" not in context.system

# 2. with no block text and nothing recalled, it's just the base
assert MemoryContext("Base.", store, "u_new", CoreBlock(""), "anything").system == "Base."

# 3. until the block changes, the history is sent as it is, as a new list
sent = context.messages(history)
assert sent == history and sent is not history

# 4. after an edit: the prefix is unchanged, and the block's new text rides at the end of every request
block.append("Reviewed support_agent on 2026-09-28.")
assert context.system.count("Reviewed support_agent") == 0
sent = context.messages(history)
assert sent[-1]["content"] == ("Review support_agent.\n\nYour memory block has changed this session. It now reads:\n"
                               "User: A.\nPrefers: bullets.\nReviewed support_agent on 2026-09-28.")
assert history == [{"role": "user", "content": "Review support_agent."}]

# 5. the next session starts with the edited block in its prefix, and nothing at the end
next_session = MemoryContext("Base.", store, "u_a", block, "support_agent review")
assert "Reviewed support_agent on 2026-09-28.\n</memory_block>" in next_session.system
assert next_session.messages(history) == history

# 6. the limit on recalled memories applies
assert MemoryContext("Base.", store, "u_a", CoreBlock(""), "support_agent", limit=1).system.count("\n- ") == 1
```

**Hint (shown on request):** Strings can't be changed in place, so `self.block_at_start = block.text` keeps the text as it was, even after the block is edited. Comparing `self.block.text` with it tells you whether anything changed.

**Reference solution:**
```python
class MemoryContext:
    """One session's use of memory: fixed in the prefix at the start, anything newer at the end of each request."""
    def __init__(self, base: str, store: MemoryStore, user_id: str, block: CoreBlock, task: str, limit: int = 3):
        self.block = block
        self.block_at_start = block.text
        recalled = store.search(user_id, task, limit=limit)
        system = base
        if block.text:
            system += "\n\n<memory_block>\n" + block.text + "\n</memory_block>"
        if recalled:
            system += "\n\nFrom earlier sessions:\n" + "\n".join(f"- [{m.type}] {m.content}" for m in recalled)
        # built once: the prefix never changes during the session
        self.system = system

    def messages(self, history: list) -> list:
        """What to send: the history, plus the block's current text at the end if it has changed this session."""
        if self.block.text == self.block_at_start:
            return list(history)
        return add_to_end(history, "Your memory block has changed this session. It now reads:\n" + self.block.text)
```

**Explanation:** Test 4 is the design in one check: after an edit, the prefix is unchanged, and the block's new text arrives at the end of the request. A version that rebuilds the system prompt on each edit fails it. Test 5 checks the other half: the next session starts with the edited block in its prefix and nothing at the end. Test 3 checks that a copy of the history is sent, and test 4 that the history itself is never changed.

---

*(End of Concept 3 — final concept of Lesson 9. The lesson continues with the recap and comprehensive sandbox.)*
