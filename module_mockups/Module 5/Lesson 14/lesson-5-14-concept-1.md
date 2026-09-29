# Module 5, Lesson 14 — Concept 1: What Module 4's keyword matching misses

> **Note for the site build:**
> - **Lesson 14's shared setup,** for every demo and exercise in the lesson:
>   the Lesson 13 comprehensive sandbox's `lib.py`, unchanged, then
>   `load_context_step` and Module 4's matchers, exactly as in the first code
>   block below. numpy, `sqlite3` and networkx must be loaded.
> - **Data:** `context-step.json`, from `scripts/generate-rag-context-step.py`.
>   Its embedding files are first used in the next concept.

---

## Five matchers, one assumption

Module 4 built an agent's context step: the machinery that decides what goes
into each request. Five parts of it choose things by relevance, and all five
decide relevance the same way, by shared words:

- **Lesson 7's `find_tools`** picks tool definitions from a catalog, one point
  per query word found in a tool's name or description.
- **Lesson 8's `recall`** picks memories sharing the most keywords with the
  task.
- **Lesson 9's store search** does the same over stored memory records and
  their tags.
- **Lesson 10's duplicate check** calls two memories the same when 80% of
  their keywords overlap.
- **Lesson 11's recall score** uses shared keywords as its relevance term.

Each of those lessons said that matching by meaning was this module's subject.
This lesson delivers it. First, the measurement, on a labelled set written for
this lesson: Module 4's own tool catalog, one user's memories, and tasks in two
kinds of wording, the words of what they should find, and other words. Here
are Module 4's matchers, copied unchanged apart from their names:

```python
def load_context_step() -> dict:
    """Module 4's tool catalog as text, one user's memories, and the labelled tasks and pairs."""
    return json.loads((DATA / "context-step.json").read_text(encoding="utf-8"))

# Module 4's keyword matching, unchanged apart from the names, which Module 5's own would clash with
M4_STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "was", "it", "this", "that",
                "with", "as", "at", "by", "be", "i", "you", "my", "me", "we", "our", "please", "about", "from", "last"}

def m4_keywords(text: str) -> set:
    """Module 4 Lesson 8's keywords: lowercased, punctuation removed, common and one-letter words dropped."""
    text = text.lower()
    for mark in ".,;:!?()'\"":
        text = text.replace(mark, " ")
    return {word for word in text.split() if len(word) > 1} - M4_STOPWORDS

def m4_find_tools(tools: dict, query: str, limit: int = 3) -> list[str]:
    """Module 4 Lesson 7's find_tools scoring: one point per query word found in a tool's name and description."""
    words = query.lower().split()
    scored = [(len([w for w in words if w in text.lower()]), name) for name, text in tools.items()]
    return [name for score, name in sorted([p for p in scored if p[0]], key=lambda p: p[0], reverse=True)[:limit]]

def m4_recall(memories: list[str], task: str, limit: int = 3) -> list[str]:
    """Module 4 Lesson 8's recall: the memories sharing the most keywords with the task."""
    wanted = m4_keywords(task)
    scored = [(len(wanted & m4_keywords(m)), m) for m in memories]
    return [m for score, m in sorted([p for p in scored if p[0]], key=lambda p: p[0], reverse=True)[:limit]]

def m4_overlap(a: str, b: str) -> float:
    """Module 4 Lesson 10's duplicate test: shared keywords over all keywords (0.8 or more was a duplicate)."""
    union = m4_keywords(a) | m4_keywords(b)
    return len(m4_keywords(a) & m4_keywords(b)) / len(union) if union else 0.0
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

---

## Finding tools

```python
data = load_context_step()
for worded in (True, False):
    tasks = [t for t in data["tool_tasks"] if t["worded"] == worded]
    print("tasks using the tools' own words:" if worded else "\ntasks in other words:")
    for task in tasks:
        found = m4_find_tools(data["tools"], task["task"])
        hit = any(name.startswith(task["server"] + "__") for name in found)
        print(f"  {'found ' if hit else 'MISSED'} {task['server']:<11} {task['task']:<52} -> {found[:2]}")
```
```
tasks using the tools' own words:
  found  monitoring  What alerts are firing for support_agent?            -> ['monitoring__list', 'monitoring__get']
  found  github      Is there an open pull request for the retry fix?     -> ['github__list', 'github__get']
  found  deploy      Roll back the release that broke the dashboard       -> ['deploy__list', 'deploy__get']
  found  billing     Show me the latest invoices                          -> ['billing__list', 'billing__get']
  found  calendar    What's on my schedule tomorrow?                      -> ['calendar__list', 'calendar__get']

tasks in other words:
  MISSED billing     How much did billing_agent cost us last month?       -> ['registry__list', 'registry__get']
  MISSED calendar    When is the next on-call handover meeting?           -> ['registry__list', 'registry__get']
  MISSED slack       Did anyone post in the channel about the outage?     -> ['registry__list', 'registry__get']
  MISSED tickets     Which customer complaints are still unresolved?      -> []
  found  registry    Change which model support_agent runs on             -> ['registry__list', 'registry__get']
  MISSED monitoring  Is the registry up, or is it down right now?         -> ['registry__list', 'registry__get']
  MISSED github      Find where the retry limit is set in the source      -> ['registry__list', 'registry__get']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every task using a tool's own words finds it. Of the seven in other words,
six fail, and the one that succeeds does so by accident:

```python
tools = load_context_step()["tools"]
query = "Change which model support_agent runs on"
matches = {name: [w for w in query.lower().split() if w in text.lower()] for name, text in tools.items()}
print(f"registry__list matched {matches['registry__list']}")
print(f"tools by score: {dict(Counter(len(m) for m in matches.values()))}")
print(f"first three, in catalog order: {list(tools)[:3]}")
```
```
registry__list matched ['on']
tools by score: {1: 40}
first three, in catalog order: ['registry__list', 'registry__get', 'registry__search']
```
*(runs live, shows output — read-only demo snippet, not graded)*

No word of the task means anything to the catalog. Every tool scores one point,
for "on", which appears inside words in every description, and the tie
falls to catalog order, where the registry's tools come first. The failures
return the same registry tools for the same reason. Worse than finding nothing,
they find the wrong thing confidently: an agent asking "is the registry up?"
gets registry tools, not monitoring ones.

---

## Recalling memories

```python
data = load_context_step()
memories = [m["content"] for m in data["memories"]]
by_id = {m["id"]: m["content"] for m in data["memories"]}
for worded in (True, False):
    tasks = [t for t in data["recall_tasks"] if t["worded"] == worded]
    hits = [t for t in tasks if set(m4_recall(memories, t["task"])) & {by_id[i] for i in t["relevant"]}]
    print(f"{'own words' if worded else 'other words'}: a relevant memory in the top 3 for {len(hits)} of {len(tasks)} tasks")
    for task in tasks:
        if task not in hits:
            print(f"  missed: {task['task']!r} -> {m4_recall(memories, task['task'])}")
```
```
own words: a relevant memory in the top 3 for 5 of 5 tasks
other words: a relevant memory in the top 3 for 4 of 7 tasks
  missed: 'Who should I send the update about the customer-facing assistant to?' -> ["Dashboards should use their own registry keys, not an agent's."]
  missed: 'What deadline do we have for moving off the old model?' -> ["notes_agent's target model is claude-haiku."]
  missed: 'Who do I report to?' -> []
```
*(runs live, shows output — read-only demo snippet, not graded)*

Memory recall does better, because Module 4's keywords drop common words, but
it fails the same way. "Who do I report to?" shares no word with "The user's
manager is Grace Okafor." "The old model" and "claude-legacy" are the same
thing to a person and unrelated to a set of words. And a near miss is worse
than no match: asked about the deadline for moving off the old model, recall
returns notes_agent's target model, which shares the word "model" and answers
nothing.

---

## Spotting duplicates

The duplicate check fails in a different way. Here's the keyword overlap for
pairs of memories labelled as the same fact, related facts, and contradicting
facts:

```python
pairs = load_context_step()["pairs"]
for label in ("duplicate", "related", "contradiction"):
    scores = [round(m4_overlap(p["a"], p["b"]), 2) for p in pairs if p["label"] == label]
    print(f"{label:<14} keyword overlap {scores}")
print("\nModule 4 counted 0.8 or more as a duplicate.")
```
```
duplicate      keyword overlap [0.5, 0.25, 0.09, 0.5, 0.27, 0.0, 0.25]
related        keyword overlap [0.5, 0.25, 0.0, 0.08, 0.09, 0.2]
contradiction  keyword overlap [0.5, 0.33, 0.78, 0.43, 0.6]

Module 4 counted 0.8 or more as a duplicate.
```
*(runs live, shows output — read-only demo snippet, not graded)*

Not one duplicate gets near 0.8: "Keep replies brief and skip the
introduction" shares no keyword with "The user prefers short answers without a
preamble". And the pairs that overlap most are the contradictions, because two
statements that disagree about one detail share every other word. Keyword
overlap measures shared wording, and that's close to the opposite of what a
duplicate check needs.

---

## Quiz cards

> **Q1.** What do all five of Module 4's matchers have in common?
> - They decide relevance by shared words, so a task in other words finds nothing, or the wrong thing ✅
> - They all use the same stopword list
> - They all rank by recency first
> - They all call a model
>
> *Explanation: tools, memories, duplicates and relevance scores were all
> matched on words. Paraphrased tasks fail every one of them.*

> **Q2.** "Change which model support_agent runs on" found registry tools.
> Why was that luck?
> - Every tool scored one point for "on", and the tie fell to catalog order ✅
> - The word "model" is in the registry tools' descriptions
> - The registry tools are marked as the default
> - find_tools understood the task
>
> *Explanation: substring matching counted "on" inside other words in
> every description. With all 40 tools tied, the first in the catalog won.*

> **Q3.** Why is a wrong match worse than no match?
> - The agent acts on it confidently, where no match would prompt a different search or a question ✅
> - Wrong matches use more tokens
> - No match raises an error
> - Wrong matches can't be cached
>
> *Explanation: recall returned notes_agent's target model for a question
> about a deadline. Nothing in the result says it's irrelevant.*

> **Q4.** Why do contradictions score higher than duplicates on keyword
> overlap?
> - Two statements disagreeing about one detail share every other word ✅
> - Contradictions are always longer
> - Duplicates contain more stopwords
> - The overlap formula favours negations
>
> *Explanation: "Tom owns support_agent" and "Priya owns support_agent"
> differ in one word. A duplicate in other words may share none.*
