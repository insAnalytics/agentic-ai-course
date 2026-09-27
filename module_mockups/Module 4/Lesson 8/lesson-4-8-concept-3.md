# Module 4, Lesson 8 — Concept 3: Episodic, semantic, procedural

> **Note for the site build:** add `assemble_memory` and `memory_block` to this lesson's setup. They use `keywords` and `recall` from Concept 2, which changed while this concept was written: `keywords` now also drops one-letter words. Use the updated version.

---

## Three kinds of long-term memory

The standard way to divide an agent's memory comes from [Cognitive Architectures for Language Agents](https://arxiv.org/abs/2309.02427) (Sumers, Yao, Narasimhan and Griffiths), which adapted a long-standing split from cognitive science. Its short-term part, **working memory**, is what this module has managed until now: everything the agent holds for the task at hand. The long-term part has three kinds:

- **Episodic memory** is what happened: records of past events and sessions. "On 2026-09-21, support_agent was slow, and billing_agent's lookup was the cause."
- **Semantic memory** is facts that hold: about the world, the user, and their systems. "Priya owns support_agent."
- **Procedural memory** is how to act. In the paper, that's knowledge built into the model's weights and written into the agent's code. Frameworks such as LangChain's LangMem also store learned procedures as instructions in the agent's prompt. For an agent working for one user, it includes that user's standing instructions: "cc Priya on anything about support_agent."

## Sorting a memory into its type

One question usually decides:

- **Does it describe something that happened, at a time?** Then it's episodic.
- **Does it state something true, which the agent may need to know?** Then it's semantic.
- **Does it change what the agent does, every time it applies?** Then it's procedural.

"Priya owns support_agent" is a fact, and "cc Priya on anything about support_agent" is an instruction, though they're about the same person. Frameworks draw the edges differently: LangMem files a user's preferences as semantic facts. This course files anything that changes what the agent does as procedural, because that's what decides how a memory is loaded, and how carefully it has to be written.

## Each type has its own rules

The types aren't just labels. Each is written, found and outdated differently:

- **Episodes** are recorded after events, and carry their date. They're found when the current task resembles them, and the recent ones matter most. They age: last week's incident is useful context, and last year's rarely is.
- **Facts** are extracted from what was said and found. They're found by relevance to the task. They don't age so much as get **superseded**: a new fact contradicts an old one, and one of them has to go. That's [Lesson 10's](→ this module, deciding what to remember lesson) hard case.
- **Procedures** are few and short, and **always loaded**. The previous concept showed why: a standing instruction applies to every task, whatever its words, so it can't depend on matching them.

So one rule can't serve all three. Here's a user's memories, handled with one rule both ways, and then with each type's own rule:

```python
def assemble_memory(memories: list, task: str, fact_limit: int = 3, episode_limit: int = 2) -> dict:
    """Each type of memory, chosen by its own rule."""
    procedural = [m["text"] for m in memories if m["type"] == "procedural"]
    facts = [m["text"] for m in memories if m["type"] == "semantic"]
    wanted = keywords(task)
    relevant_episodes = [m for m in memories if m["type"] == "episodic" and wanted & keywords(m["text"])]
    # ISO dates ("2026-09-21") sort correctly as text, so the newest come first
    newest = sorted(relevant_episodes, key=lambda m: m["date"], reverse=True)[:episode_limit]
    return {"procedural": procedural,
            "semantic": recall(facts, task, fact_limit),
            "episodic": [f"{m['date']}: {m['text']}" for m in newest]}

def memory_block(assembled: dict) -> str:
    """The recalled memories as text for the session prompt, one section per type, empty sections left out."""
    headers = {"procedural": "How this user wants things done:",
               "semantic": "What you know:",
               "episodic": "What happened before:"}
    parts = []
    for kind in ["procedural", "semantic", "episodic"]:
        if assembled[kind]:
            parts.append(headers[kind] + "\n- " + "\n- ".join(assembled[kind]))
    return "\n\n".join(parts)
```

```python
memories = [
    {"type": "procedural", "text": "Write summaries as bullet points.", "date": "2026-09-14"},
    {"type": "procedural", "text": "cc Priya on anything about support_agent.", "date": "2026-09-21"},
    {"type": "semantic", "text": "Priya owns support_agent.", "date": "2026-09-21"},
    {"type": "semantic", "text": "The billing dashboard is checked daily by finance.", "date": "2026-08-30"},
    {"type": "semantic", "text": "support_agent handles about 3,000 tickets a day.", "date": "2026-09-02"},
    {"type": "episodic", "text": "support_agent was slow; billing_agent's per-ticket lookup was the bottleneck.", "date": "2026-09-21"},
    {"type": "episodic", "text": "support_agent was moved to claude-sonnet.", "date": "2026-09-21"},
    {"type": "episodic", "text": "support_agent had an outage after a bad deploy.", "date": "2026-07-03"},
    {"type": "episodic", "text": "The search index was rebuilt.", "date": "2026-08-12"},
]
task = "Draft the status update on support_agent for this week."

one_rule = recall([m["text"] for m in memories], task, limit=5)
print("one rule, recall everything by keyword:", len(one_rule), "memories; bullet-point instruction included:",
      "Write summaries as bullet points." in one_rule)
print("one rule, load everything:", len(memories), "memories, including", 
      len([m for m in memories if m["type"] == "episodic" and not keywords(task) & keywords(m["text"])]), "unrelated episode(s)")

print("\neach type by its own rule:\n")
print(memory_block(assemble_memory(memories, task)))
```
```
one rule, recall everything by keyword: 5 memories; bullet-point instruction included: False
one rule, load everything: 9 memories, including 1 unrelated episode(s)

each type by its own rule:

How this user wants things done:
- Write summaries as bullet points.
- cc Priya on anything about support_agent.

What you know:
- Priya owns support_agent.
- support_agent handles about 3,000 tickets a day.

What happened before:
- 2026-09-21: support_agent was slow; billing_agent's per-ticket lookup was the bottleneck.
- 2026-09-21: support_agent was moved to claude-sonnet.
```
*(runs live, shows output — read-only demo snippet, not graded; the memories are written by hand)*

- **Recalling everything by keyword** missed the bullet-point instruction, because the task says "draft", not "write" or "summaries".
- **Loading everything** kept it, and also brought in a fact about the billing dashboard, an old outage and an unrelated index rebuild. Load everything for every session and the pile grows with every session.
- **Each type by its own rule** loaded both instructions, the two facts about support_agent, and the two most recent relevant episodes. The July outage is relevant but older, and it's left out at this limit. ISO dates sort correctly as plain text, which is why the code can sort on them directly.

## Why procedural memory is the one to guard

The paper makes a point that this module's next lessons build on. Writing to procedural memory is much riskier than writing to the other kinds, because it can introduce bugs or let an agent subvert its designers' intentions.

For a per-user memory, the reason is plain. A procedure is loaded into every future session, and followed without being asked. A wrong fact misleads the agent when it happens to come up. A wrong instruction, or one that was slipped in, is obeyed every time. [Lesson 10](→ this module, deciding what to remember lesson) turns this into a rule: anything that would change the agent's future behavior needs a source the user actually controls.

---

## Quiz cards

> **Q1.** "Priya owns support_agent" and "cc Priya on anything about support_agent" are about the same person. Why are they different types?
> - A) The first is older than the second
> - B) The first states a fact the agent may need; the second changes what the agent does every time it applies ✅
> - C) The first came from a tool, the second from the user
> - D) They're the same type with different wording
>
> *Explanation:* The question that sorts them is whether a memory informs the agent or directs it. The instruction is procedural, so it's always loaded, and has to be written carefully.

> **Q2.** Why are procedures always loaded, instead of recalled by relevance like facts?
> - A) They're too short to search
> - B) The model can't search instructions
> - C) They're stored in a different file
> - D) A standing instruction applies to every task, whatever its words, so it can't depend on matching the task ✅
>
> *Explanation:* Keyword recall missed the bullet-point instruction because the task said "draft". Loading procedures unconditionally is only affordable because they're few and short.

> **Q3.** How do facts and episodes go out of date differently?
> - A) Facts are superseded when a new fact contradicts them; episodes stay true about their date but matter less as they age ✅
> - B) Facts age and episodes are superseded
> - C) Neither goes out of date once stored
> - D) Both expire after a fixed number of sessions
>
> *Explanation:* "support_agent was slow on 2026-09-21" stays true forever, but gets less useful. "Priya owns support_agent" stays useful until it stops being true.

> **Q4.** In the demo, why did loading every memory work badly, even though it kept the bullet-point instruction?
> - A) It broke the cache
> - B) It lost the dates on the episodes
> - C) It brought in unrelated facts and episodes, and would bring in more with every new session ✅
> - D) It put facts before instructions
>
> *Explanation:* Loading everything trades a missed instruction for a growing pile of irrelevant memories, which is Lesson 2's problem again.

> **Q5.** Why is writing procedural memory riskier than writing the other two kinds?
> - A) Procedures take more storage
> - B) Procedures are harder to search
> - C) Procedures are loaded into every session and followed without being asked, so a wrong or injected one is obeyed every time ✅
> - D) Procedures can't be deleted once written
>
> *Explanation:* The CoALA paper makes the same point about agents in general. Lesson 10 turns it into a rule: behavior-changing memories need a source the user controls.

---

## Applied sandbox exercise

*(graded — each type by its own rule)*

**Task shown to learner:** `keywords` and `recall` from the previous concept are provided. Each memory is a dict with `type` (`"procedural"`, `"semantic"` or `"episodic"`), `text` and `date` (an ISO date string such as `"2026-09-21"`). Implement:

- **`assemble_memory(memories, task, fact_limit=3, episode_limit=2)`:** return a dict with three keys.
  - `"procedural"`: the text of every procedural memory, in stored order.
  - `"semantic"`: `recall` over the text of the semantic memories, with `fact_limit`.
  - `"episodic"`: the episodic memories that share at least one keyword with the task, newest first, at most `episode_limit`, each formatted as `"DATE: TEXT"`.
- **`memory_block(assembled)`:** for each type in the order procedural, semantic, episodic that has any items, a section of its header followed by `"\n- "` and the items joined by `"\n- "`. The headers are `How this user wants things done:`, `What you know:` and `What happened before:`. Sections are joined by `"\n\n"`, and it returns `""` if all are empty.

**Provided code:** `STOPWORDS`, `keywords` and `recall` from the previous concept.

**Starter code:**
```python
def assemble_memory(memories: list, task: str, fact_limit: int = 3, episode_limit: int = 2) -> dict:
    # TODO: every procedure; facts via recall; relevant episodes, newest first, each as "DATE: TEXT"
    ...

def memory_block(assembled: dict) -> str:
    # TODO: a header and "- " lines for each non-empty type, in a fixed order, separated by blank lines
    ...
```

**Hidden tests:**
```python
memories = [
    {"type": "procedural", "text": "Write summaries as bullet points.", "date": "2026-09-14"},
    {"type": "semantic", "text": "Priya owns support_agent.", "date": "2026-09-21"},
    {"type": "episodic", "text": "support_agent had an outage.", "date": "2026-07-03"},
    {"type": "procedural", "text": "Never restart production agents.", "date": "2026-08-01"},
    {"type": "semantic", "text": "Finance checks the billing dashboard daily.", "date": "2026-08-30"},
    {"type": "episodic", "text": "support_agent moved to claude-sonnet.", "date": "2026-09-21"},
    {"type": "episodic", "text": "The search index was rebuilt.", "date": "2026-08-12"},
    {"type": "episodic", "text": "support_agent latency spiked.", "date": "2026-08-20"},
]
task = "Draft the status update on support_agent."

# 1. procedures: all of them, in stored order, whatever the task says
out = assemble_memory(memories, task)
assert out["procedural"] == ["Write summaries as bullet points.", "Never restart production agents."]

# 2. facts: only those that share keywords with the task, via recall
assert out["semantic"] == ["Priya owns support_agent."]

# 3. episodes: only relevant ones, newest first, at most episode_limit, each with its date
assert out["episodic"] == ["2026-09-21: support_agent moved to claude-sonnet.", "2026-08-20: support_agent latency spiked."]
assert assemble_memory(memories, task, episode_limit=5)["episodic"] == [
    "2026-09-21: support_agent moved to claude-sonnet.", "2026-08-20: support_agent latency spiked.",
    "2026-07-03: support_agent had an outage."]

# 4. the limits apply
many_facts = [{"type": "semantic", "text": f"support_agent fact {n}.", "date": "2026-09-01"} for n in range(6)]
assert len(assemble_memory(many_facts, task, fact_limit=2)["semantic"]) == 2

# 5. the block: one section per type in a fixed order, empty sections left out
block = memory_block(out)
assert block == ("How this user wants things done:\n- Write summaries as bullet points.\n- Never restart production agents.\n\n"
                 "What you know:\n- Priya owns support_agent.\n\n"
                 "What happened before:\n- 2026-09-21: support_agent moved to claude-sonnet.\n- 2026-08-20: support_agent latency spiked.")
assert memory_block({"procedural": [], "semantic": ["x"], "episodic": []}) == "What you know:\n- x"
assert memory_block({"procedural": [], "semantic": [], "episodic": []}) == ""

# 6. nothing passed in is changed
assert memories[2]["date"] == "2026-07-03" and len(memories) == 8
```

**Hint (shown on request):** `keywords(task) & keywords(m["text"])` is empty, and so false, when an episode shares nothing with the task. Sort the relevant episodes with `key=lambda m: m["date"], reverse=True`: ISO dates sort correctly as text.

**Reference solution:**
```python
def assemble_memory(memories: list, task: str, fact_limit: int = 3, episode_limit: int = 2) -> dict:
    """Each type of memory, chosen by its own rule."""
    procedural = [m["text"] for m in memories if m["type"] == "procedural"]
    facts = [m["text"] for m in memories if m["type"] == "semantic"]
    wanted = keywords(task)
    relevant_episodes = [m for m in memories if m["type"] == "episodic" and wanted & keywords(m["text"])]
    # ISO dates ("2026-09-21") sort correctly as text, so the newest come first
    newest = sorted(relevant_episodes, key=lambda m: m["date"], reverse=True)[:episode_limit]
    return {"procedural": procedural,
            "semantic": recall(facts, task, fact_limit),
            "episodic": [f"{m['date']}: {m['text']}" for m in newest]}

def memory_block(assembled: dict) -> str:
    """The recalled memories as text for the session prompt, one section per type, empty sections left out."""
    headers = {"procedural": "How this user wants things done:",
               "semantic": "What you know:",
               "episodic": "What happened before:"}
    parts = []
    for kind in ["procedural", "semantic", "episodic"]:
        if assembled[kind]:
            parts.append(headers[kind] + "\n- " + "\n- ".join(assembled[kind]))
    return "\n\n".join(parts)
```

**Explanation:** Test 1 is the rule the previous concept's miss pointed to: procedures are always loaded, whatever the task says. Test 3 checks the episode rule in both parts: only relevant episodes, and the newest of those. A version that skips the relevance check lets unrelated episodes in once the limit allows. Test 5 pins the block's shape, including leaving out empty sections, so a session with no episodes doesn't get an empty "What happened before:" heading.

---

*(End of Concept 3 — final concept of Lesson 8. The lesson continues with the recap and comprehensive sandbox.)*
