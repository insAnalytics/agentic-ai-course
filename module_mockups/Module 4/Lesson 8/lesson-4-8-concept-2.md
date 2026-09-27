# Module 4, Lesson 8 — Concept 2: Storage, retrieval, injection

> **Note for the site build:** add `STOPWORDS`, `keywords`, `recall`, `session_prompt` and `recall_for` (the code block under "Storage, retrieval, injection, in code") to this lesson's setup. The second demo also needs Lesson 3's `first_divergence`.

---

## Three decisions

[The previous concept](→ this lesson, what dies with the session and what shouldnt concept) ended with three hand-picked memories at the start of a new session. Every long-term memory system, however it's built, has to make three decisions to get there:

- **Storage:** what a memory is, where it's kept, and whose it is.
- **Retrieval:** when to look memories up, and how to find the right ones.
- **Injection:** where the memories that are found go in the request.

This concept builds the smallest system that makes all three, on plain strings. [Lesson 9](→ this module, building a memory store lesson) builds a real store on the same three decisions.

## Storage: what, where, whose

- **What:** one memory is one self-contained statement, readable on its own weeks later without the conversation it came from. "cc Priya on anything about support_agent" works; "yes, do that from now on" doesn't. A memory that can go stale says when it was true: "found 2026-09-21".
- **Where:** outside the model and outside the conversation, somewhere that outlives the session. Here it's a dict; in Lesson 9 it's a store with a record for each memory, carrying its type, source, time and tags.
- **Whose:** every memory belongs to one user, and the store is keyed by user from the start. Looking up memories means looking up *this user's* memories, never everyone's.

## Retrieval: when, and how

**When** is a design choice with three common answers:

- **At session start,** from the task. That's cheap, and it happens once.
- **Each turn,** as the task shifts. It's more responsive, and it costs more.
- **On demand,** with a tool the agent calls when it thinks memory would help, the same way [Lesson 7's agent read guides](→ this module, just in time context and dynamic tool exposure lesson, instructions and reference material on demand concept).

**How** here is keyword matching: a memory scores one point for each keyword it shares with the task. Searching by meaning rather than words is Module 5's subject. Even keyword matching has a trap, though:

```python
memories = ["The user wants summaries as bullet points.",
            "cc Priya on anything about support_agent; she owns it.",
            "The user is on call the last week of each month.",
            "The user's team uses the billing dashboard daily."]
task = "Write the weekly status note on support_agent."

def naive_recall(memories, task):
    words = set(task.lower().split())
    return [m for m in memories if words & set(m.lower().split())]

print("matching raw words:  ", naive_recall(memories, task))
print("matching keywords:   ", recall(memories, task))
print("keywords of the task:", sorted(keywords(task)))
```
```
matching raw words:   ['The user wants summaries as bullet points.', 'cc Priya on anything about support_agent; she owns it.', 'The user is on call the last week of each month.', "The user's team uses the billing dashboard daily."]
matching keywords:    ['cc Priya on anything about support_agent; she owns it.']
keywords of the task: ['note', 'status', 'support_agent', 'weekly', 'write']
```
*(runs live, shows output — read-only demo snippet, not graded; `recall` and `keywords` are shown in the next section)*

Matching raw words recalled every memory, because every one of them contains "the". Dropping common words, one-letter words and punctuation fixes that. The fixed version recalled only the memory about `support_agent`.

It also missed one it should have kept: the user wants summaries as bullet points. That applies to *every* note this user asks for, whatever its words. A standing instruction like that shouldn't depend on matching the task at all. It should always be loaded. That difference, between facts to look up and instructions to always follow, is where [the next concept's](→ this lesson, episodic semantic procedural concept) taxonomy starts.

## Injection: where the memories go

The rule from [Lesson 7](→ this module, just in time context and dynamic tool exposure lesson, what you load and where it goes concept, the rule) decides this: the prefix is fixed for the run, and anything loaded later goes into the conversation. For memory, that gives each "when" its natural place:

- **Recalled at session start →** the system prompt, built once and then fixed for the whole session.
- **Recalled each turn →** the end of the request, restated and never saved, like [Lesson 2's plan](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept).
- **Recalled on demand →** a tool result, like a guide.

Whichever place is used, the memories go under a header that says what they are: things from earlier sessions, not the user speaking now. What the agent should trust in its memories, and what should never become one, is [Lesson 10's](→ this module, deciding what to remember lesson) subject. [Lesson 9](→ this module, building a memory store lesson) measures what each placement costs the cache.

## Storage, retrieval, injection, in code

```python
STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "was", "it", "this", "that",
             "with", "as", "at", "by", "be", "i", "you", "my", "me", "we", "our", "please", "about", "from", "last"}

def keywords(text: str) -> set:
    """The words in `text` worth matching on: lowercased, punctuation removed, common and one-letter words dropped."""
    text = text.lower()
    for mark in ".,;:!?()'\"":
        text = text.replace(mark, " ")
    # single letters, like the "s" a possessive leaves behind, carry no meaning either
    return {word for word in text.split() if len(word) > 1} - STOPWORDS

def recall(memories: list, task: str, limit: int = 3) -> list:
    """The memories sharing the most keywords with the task, best first, at most `limit`."""
    wanted = keywords(task)
    scored = []
    for memory in memories:
        score = len(wanted & keywords(memory))
        if score:
            scored.append((score, memory))
    return [memory for score, memory in sorted(scored, key=lambda pair: pair[0], reverse=True)[:limit]]

def session_prompt(base: str, recalled: list) -> str:
    """The session's system prompt: fixed from its first request to its last."""
    if not recalled:
        return base
    return base + "\n\nFrom earlier sessions with this user:\n- " + "\n- ".join(recalled)

def recall_for(store: dict, user_id: str, task: str, limit: int = 3) -> list:
    """Recall only from this user's memories. An unknown user has none."""
    return recall(store.get(user_id, []), task, limit)
```

Here are two users' memories in one store, recalled at session start and injected into the system prompt:

```python
# storage: memories kept outside the model, one list per user
store = {
    "u_simar": ["cc Priya on anything about support_agent; she owns it.",
                "support_agent's bottleneck was billing_agent's per-ticket lookup (found 2026-09-21)."],
    "u_ravi": ["Ravi's team is migrating search_agent to a new index.",
               "Send Ravi's status notes to #search-team, not by email."],
}
BASE = "You are the operations assistant."
task = "Write the weekly status note on support_agent."

for user in ["u_simar", "u_ravi", "u_new"]:
    # retrieval: once, when the session starts, from this user's memories only
    recalled = recall_for(store, user, task)
    # injection: into the session's system prompt, which then stays fixed for the whole session
    system = session_prompt(BASE, recalled)
    print(f"{user}: {len(recalled)} recalled")
    print("   " + system.replace("\n", "\n   "))

# the mistake scoping prevents: recalling from everyone's memories at once
everyone = store["u_simar"] + store["u_ravi"]
print("\nunscoped recall for u_simar:", recall(everyone, task))

# over a three-turn session, the prefix never changes
system = session_prompt(BASE, recall_for(store, "u_simar", task))
history = [{"role": "user", "content": task}]
requests = []
for turn in range(3):
    requests.append({"tools": [], "system": system, "messages": history})
    history = history + [{"role": "assistant", "content": [TextBlock(text=f"Working, step {turn + 1}.")]},
                         {"role": "user", "content": "Go on."}]
print("\nprefix stable all session:",
      all(first_divergence(a, b)["diverges_at"] not in ("tools", "system") for a, b in zip(requests, requests[1:])))
```
```
u_simar: 2 recalled
   You are the operations assistant.
   
   From earlier sessions with this user:
   - cc Priya on anything about support_agent; she owns it.
   - support_agent's bottleneck was billing_agent's per-ticket lookup (found 2026-09-21).
u_ravi: 1 recalled
   You are the operations assistant.
   
   From earlier sessions with this user:
   - Send Ravi's status notes to #search-team, not by email.
u_new: 0 recalled
   You are the operations assistant.

unscoped recall for u_simar: ['cc Priya on anything about support_agent; she owns it.', "support_agent's bottleneck was billing_agent's per-ticket lookup (found 2026-09-21).", "Send Ravi's status notes to #search-team, not by email."]

prefix stable all session: True
```
*(runs live, shows output — read-only demo snippet, not graded; the memories are written by hand)*

- **Retrieval was scoped.** Each user got only their own memories, and a new user got none.
- **Scoping is what kept the sessions apart.** Without it, the note Simar asked for would come with Ravi's instruction to post status notes to #search-team. It matched the task as well as anything of Simar's did.
- **The prefix was fixed from first request to last,** because the memories went in once, when the session began.

---

## Quiz cards

> **Q1.** What are the three decisions every long-term memory system makes?
> - A) Storage, retrieval and injection ✅
> - B) Summarizing, clearing and trimming
> - C) Episodic, semantic and procedural
> - D) Tools, system prompt and messages
>
> *Explanation:* What a memory is and where it's kept, how the right ones are found, and where they go in the request. The types in C are the next concept's subject.

> **Q2.** Why did matching raw words recall every memory?
> - A) The memories were too short
> - B) Every memory contains common words like "the", which also appear in the task ✅
> - C) Raw matching ignores capital letters
> - D) The limit was set too high
>
> *Explanation:* Common words match everything and mean nothing. Dropping them, along with punctuation and case, leaves the words that carry meaning.

> **Q3.** Keyword recall missed "the user wants summaries as bullet points". Why, and what does it suggest?
> - A) The memory was misspelled
> - B) The limit cut it off
> - C) It shares no keywords with the task, yet it applies to every note, so standing instructions like it should always be loaded rather than looked up ✅
> - D) Bullet points aren't a valid memory
>
> *Explanation:* Some memories are facts to look up when they're relevant. Others are instructions to always follow. The next concept separates them.

> **Q4.** Memories recalled once at session start go into the system prompt. Why is that safe for the cache?
> - A) System prompts are never cached
> - B) The memories are short
> - C) The cache ignores memories
> - D) The prompt is built once and stays fixed for the whole session, so the prefix never changes ✅
>
> *Explanation:* That follows Lesson 7's rule. Memories recalled partway through a session belong at the end of the request, or in a tool result.

> **Q5.** What would unscoped recall have done in the demo?
> - A) Returned nothing for Simar
> - B) Brought Ravi's instruction to post status notes to #search-team into Simar's session ✅
> - C) Returned Simar's memories twice
> - D) Broken the cache
>
> *Explanation:* Ravi's memory matched the task as well as Simar's did. Only scoping recall to the user whose session it is keeps it out.

---

## Applied sandbox exercise

*(graded — a minimal memory cycle)*

**Task shown to learner:** `STOPWORDS` is provided. Implement:

- **`keywords(text)`:** lowercase the text, replace each of `.,;:!?()'"` with a space, split it, and return the set of words that are longer than one letter and aren't in `STOPWORDS`.
- **`recall(memories, task, limit=3)`:**
  - Score each memory by the number of keywords it shares with the task, and drop memories that score zero.
  - Return up to `limit` memories, highest score first, with ties kept in stored order.
  - Don't change `memories`.
- **`session_prompt(base, recalled)`:** return `base` if nothing was recalled. Otherwise return `base`, then `"\n\nFrom earlier sessions with this user:\n- "`, then the memories joined by `"\n- "`.
- **`recall_for(store, user_id, task, limit=3)`:** recall from `store[user_id]` only. A user who isn't in the store has no memories.

**Provided code:** `STOPWORDS` as shown in this concept.

**Starter code:**
```python
STOPWORDS = {...}   # provided, as shown above

def keywords(text: str) -> set:
    # TODO: lowercase, replace each punctuation mark with a space, split, drop one-letter words and STOPWORDS
    ...

def recall(memories: list, task: str, limit: int = 3) -> list:
    # TODO: score by shared keywords; best first, ties in stored order; skip zero scores
    ...

def session_prompt(base: str, recalled: list) -> str:
    # TODO: the base alone, or the base plus the header and one "- " line per memory
    ...

def recall_for(store: dict, user_id: str, task: str, limit: int = 3) -> list:
    # TODO: recall from this user's memories only
    ...
```

**Hidden tests:**
```python
# 1. keywords: lowercase, punctuation gone, common words dropped
assert keywords("The weekly Status note, on support_agent!") == {"weekly", "status", "note", "support_agent"}
assert keywords("(Priya's) team: \"billing\"; dashboard?") == {"priya", "team", "billing", "dashboard"}
assert keywords("the and of") == set()

memories = ["Priya owns support_agent.",
            "The billing dashboard is checked daily.",
            "support_agent status notes go to Priya weekly.",
            "Status of search_agent: migrating."]

# 2. recall: best matches first, ties in stored order, nothing that shares no keyword, at most `limit`
assert recall(memories, "weekly status note on support_agent") == [
    "support_agent status notes go to Priya weekly.", "Priya owns support_agent.", "Status of search_agent: migrating."]
assert recall(memories, "weekly status note on support_agent", limit=1) == ["support_agent status notes go to Priya weekly."]
assert recall(memories, "the and of it") == []
assert recall([], "anything") == []

# 3. recall_for: only this user's memories; an unknown user has none
store = {"u_a": ["Priya owns support_agent."], "u_b": ["support_agent notes go to #search-team."]}
assert recall_for(store, "u_a", "support_agent note") == ["Priya owns support_agent."]
assert recall_for(store, "u_zzz", "support_agent note") == []

# 4. session_prompt: the base alone, or the base with the recalled memories under a header
assert session_prompt("Base.", []) == "Base."
assert session_prompt("Base.", ["one", "two"]) == "Base.\n\nFrom earlier sessions with this user:\n- one\n- two"

# 5. nothing passed in is changed
kept = list(memories)
recall(memories, "status")
assert memories == kept
```

**Hint (shown on request):** `a & b` gives the keywords two sets share, and `len` of that is the score. Sort the `(score, memory)` pairs with `key=lambda pair: pair[0], reverse=True`, so equal scores keep their order. Sorting the pairs directly would also compare the memories' text, which changes that order. `store.get(user_id, [])` gives an unknown user an empty list.

**Reference solution:**
```python
STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "was", "it", "this", "that",
             "with", "as", "at", "by", "be", "i", "you", "my", "me", "we", "our", "please", "about", "from", "last"}

def keywords(text: str) -> set:
    """The words in `text` worth matching on: lowercased, punctuation removed, common and one-letter words dropped."""
    text = text.lower()
    for mark in ".,;:!?()'\"":
        text = text.replace(mark, " ")
    # single letters, like the "s" a possessive leaves behind, carry no meaning either
    return {word for word in text.split() if len(word) > 1} - STOPWORDS

def recall(memories: list, task: str, limit: int = 3) -> list:
    """The memories sharing the most keywords with the task, best first, at most `limit`."""
    wanted = keywords(task)
    scored = []
    for memory in memories:
        score = len(wanted & keywords(memory))
        if score:
            scored.append((score, memory))
    return [memory for score, memory in sorted(scored, key=lambda pair: pair[0], reverse=True)[:limit]]

def session_prompt(base: str, recalled: list) -> str:
    """The session's system prompt: fixed from its first request to its last."""
    if not recalled:
        return base
    return base + "\n\nFrom earlier sessions with this user:\n- " + "\n- ".join(recalled)

def recall_for(store: dict, user_id: str, task: str, limit: int = 3) -> list:
    """Recall only from this user's memories. An unknown user has none."""
    return recall(store.get(user_id, []), task, limit)
```

**Explanation:** Test 1 checks the cleanups in `keywords`, including the stray "s" that removing an apostrophe leaves behind. A version that skips any one of them misses matches or makes false ones. Test 2 checks the ranking, including ties kept in stored order, which sorting the pairs directly breaks. Test 3 is the scoping rule: only this user's memories, and none for a stranger. A version that searches the whole store passes a quick look and leaks between users.

---

*(End of Concept 2.)*
