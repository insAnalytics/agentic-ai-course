# Module 4, Lesson 6 — Concept 3: Notes the agent keeps

> **Note for the site build:** add `SECTIONS` and `Notes` (the code block under "Notes the agent can't scramble") to this lesson's setup. The demo also needs Lesson 5's `compact` and Lesson 3's `add_to_end`.

---

## What compaction doesn't carry

The last two concepts kept *results* restorable. An agent also builds up something else as it works: what it has learned, what it decided, and what's still left to do. Some of that lives in its reasoning, and some in its reading of a tool result. None of it has a home of its own, so it survives only as long as the messages it's in.

Anthropic's engineers ran into exactly this while building [agents that work across many context windows](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). Compaction alone wasn't enough: it doesn't always pass perfectly clear instructions to the next context. What worked was having the agent keep a progress file, and read it back (along with the project's git history) at the start of each new context window, so it could quickly understand the state of the work.

This concept builds the in-task version of that: notes the agent writes as it goes, which live outside the conversation, so no compaction can touch them.

## Four places a fact can live

This module now has four places to put something the agent must not lose. They differ in who writes them and when they're seen:

- **The plan** ([Lesson 2](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept)). The agent writes it with a tool, and it's restated at the end of every request. It's the Manus team's todo-list recitation, in this course's form.
- **The change ledger** ([Lesson 5](→ this module, compaction and summarization lesson, when a summary loses something concept)). Code derives it from the history, and it's restated every turn. It can't be wrong, but it only covers changes.
- **The summary** ([Lesson 5](→ this module, compaction and summarization lesson, compacting a summary in rounds out concept)). The model writes it once, at compaction time, and it's lossy.
- **Notes**, this concept. The agent writes them whenever it learns something worth keeping, and reads them when it needs them.

## Notes the agent can't scramble

Anthropic's harness also found that *how* notes can change matters. For their list of features to build, they switched from Markdown to JSON, because the model was less likely to inappropriately change or overwrite JSON. They also told agents to change only each feature's pass/fail status, never its description.

With tools, that constraint doesn't have to depend on a file format. Give the agent [narrow tools](→ Module 3, designing tools a model can use well lesson, granularity narrow vs broad tools concept) that can only add an item or mark an open item done, and never a tool that rewrites the notes. Then the agent can't drop an old fact while writing up a new one:

```python
SECTIONS = ["facts", "decisions", "open"]

class Notes:
    """The agent's own notes for one task. It can add items and mark open ones done, but never rewrite them."""
    def __init__(self, max_items: int = 40):
        self.items = []
        self.max_items = max_items

    def add(self, section: str, text: str) -> str:
        if section not in SECTIONS:
            return f"Error: no section called {section}. Use one of: {', '.join(SECTIONS)}."
        if len(self.items) >= self.max_items:
            return f"Error: notes are full ({self.max_items} items). Keep notes to what the rest of the task needs."
        item_id = f"n{len(self.items) + 1}"
        self.items.append({"id": item_id, "section": section, "text": text, "done": False})
        return f"Noted as {item_id} under {section}."

    def mark_done(self, item_id: str) -> str:
        for item in self.items:
            if item["id"] == item_id:
                if item["section"] != "open":
                    return f"Error: {item_id} is not an open item, so it can't be marked done."
                item["done"] = True
                return f"Marked {item_id} done."
        return f"Error: no note called {item_id}."

    def render(self) -> str:
        if not self.items:
            return "No notes yet."
        lines = []
        for section in SECTIONS:
            entries = [item for item in self.items if item["section"] == section]
            if not entries:
                continue
            lines.append(f"{section}:")
            for item in entries:
                box = ("[x] " if item["done"] else "[ ] ") if section == "open" else ""
                lines.append(f"- {box}{item['id']}: {item['text']}")
        return "\n".join(lines)

    def index_line(self) -> str:
        if not self.items:
            return ""
        facts = len([i for i in self.items if i["section"] == "facts"])
        decisions = len([i for i in self.items if i["section"] == "decisions"])
        still_open = len([i for i in self.items if i["section"] == "open" and not i["done"]])
        return f"Your notes: {facts} facts, {decisions} decisions, {still_open} open items. Read them with read_notes()."
```

A few choices here are deliberate:

- **Three fixed sections.** Facts, decisions and open items cover what the agent needs to pick up where it left off. The fixed set keeps the notes easy to scan.
- **Numbered ids.** A done item can be named exactly, and ids never change, because nothing is ever removed.
- **Errors as messages.** A wrong section, an unknown id or a full notebook comes back as text the model can act on, and changes nothing.
- **A cap.** Notes are for what the rest of the task needs. An agent that notes everything has rebuilt its context somewhere else.

## Notes across a compaction

Here the agent learns two facts early, including a rate limit its fix will have to respect, and notes them. Later, the rounds holding those notes are compacted away by a summary that leaves the rate limit out:

```python
notes = Notes()
tools = {
    "add_note": lambda section, text: notes.add(section, text),
    "mark_done": lambda item_id: notes.mark_done(item_id),
    "read_notes": lambda: notes.render(),
}

def call(name, result, **arguments):
    block = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

def note_call(name, **arguments):
    # the agent's note tools run for real; their results go into the history like any other
    return call(name, tools[name](**arguments), **arguments)

history = [{"role": "user", "content": "Find out why the support queue is slow, then fix it."}]
history += call("get_metrics", "billing_agent: p99 4.8s on /lookup. Lookups go to the legacy pricing API, "
                               "which allows 50 requests per minute.", agent_name="billing_agent")
history += note_call("add_note", section="facts", text="billing_agent /lookup p99 4.8s, once per ticket")
history += note_call("add_note", section="facts", text="the legacy pricing API allows 50 requests/min")
history += note_call("add_note", section="open", text="cache billing lookups without exceeding 50/min")
for agent in ["research_agent", "triage_agent", "search_agent"]:
    history += call("get_logs", f"{agent} INFO request handled in 412ms\n" * 30, agent_name=agent)

# a summary that reads well and drops the rate limit (scripted)
compacted = compact(history, "billing_agent's lookup (p99 4.8s) is the likely cause; three agents ruled out.", keep_recent=1)
sent = add_to_end(compacted, notes.index_line())
text = json.dumps(_plain(sent))
print("rate limit in what's sent:", "50 requests" in text or "50/min" in text)
print("notes index in what's sent:", notes.index_line() in text)
print("\nread_notes() ->")
print(tools["read_notes"]())
print("\nmark_done('n1') ->", tools["mark_done"](item_id="n1"))
```
```
rate limit in what's sent: False
notes index in what's sent: True

read_notes() ->
facts:
- n1: billing_agent /lookup p99 4.8s, once per ticket
- n2: the legacy pricing API allows 50 requests/min
open:
- [ ] n3: cache billing lookups without exceeding 50/min

mark_done('n1') -> Error: n1 is not an open item, so it can't be marked done.
```
*(runs live, shows output — read-only demo snippet, not graded; the summary is scripted to show a plausible omission, and the note calls are written into the history as a model's calls would be)*

The rate limit is gone from what's sent, but it isn't lost. The notes live in the `Notes` object, not in the messages, so compaction never touched them. The one thing that is sent every turn is the **index line**, added at the end of the request like [Lesson 5's anchor](→ this module, compaction and summarization lesson, when a summary loses something concept, dont make the summary carry what code can derive). Like that anchor, it's never saved into the history. It tells the agent its notes exist and what's in them, without the cost of restating them every turn. Reading them in full is one call. Loading detail only when it's needed is [Lesson 7's](→ this module, just in time context and dynamic tool exposure lesson) subject.

## What notes are, and aren't

- **Notes are the agent's claims.** The model writes them, so they can be wrong, just as a summary can. The ledger stays code-derived for exactly that reason.
- **Notes belong to one task.** Like the result store, they're created with the task and end with it. What should outlast a task is long-term memory, which [Lesson 8](→ this module, short term and long term memory lesson) starts on.
- **Notes don't replace the plan.** The plan says what happens next. Notes hold what was learned and decided on the way there.

---

## Quiz cards

> **Q1.** Why did the rate limit survive compaction in the demo, when the summary left it out?
> - A) The summary was rewritten to include it
> - B) Compaction skips messages that contain numbers
> - C) The note lives in the `Notes` object outside the conversation, so compaction never touched it ✅
> - D) The rate limit was pinned in the task message
>
> *Explanation:* Compaction rewrites messages. Notes aren't messages: the calls that wrote them were summarized away, but what they wrote is still there, one `read_notes()` call away.

> **Q2.** Why do the note tools only add items and mark open items done, instead of letting the agent rewrite its notes?
> - A) Rewriting notes costs more tokens
> - B) A rewrite can drop an old fact while writing a new one, and narrow tools make that impossible ✅
> - C) The API doesn't allow tools that edit text
> - D) Numbered ids only work for new items
>
> *Explanation:* Anthropic's harness found the model was less likely to wrongly overwrite structured notes, and limited edits to a status field. Narrow tools enforce the same thing in code, whatever the file format.

> **Q3.** Why is only an index line sent every turn, instead of the full notes?
> - A) The full notes can't be serialized
> - B) Notes are private to the agent
> - C) The index is required for the cache
> - D) The index tells the agent its notes exist and what's in them, without paying to restate them every turn ✅
>
> *Explanation:* Notes can grow to dozens of items. A one-line index is cheap to anchor, and reading the full notes is one call when they're needed.

> **Q4.** How do notes differ from Lesson 5's change ledger?
> - A) Notes are written by the model, so they can be wrong; the ledger is derived by code from the history ✅
> - B) Notes are restated every turn; the ledger is read on demand
> - C) The ledger survives compaction; notes don't
> - D) They're the same thing with different names
>
> *Explanation:* Both survive compaction, but for different reasons, and with different reliability. Anything code can derive belongs in the ledger. Notes hold what only the agent knows: its conclusions and decisions.

> **Q5.** What does `Notes` do when it's full?
> - A) Removes the oldest note to make room
> - B) Refuses the new note and returns a message saying so, changing nothing ✅
> - C) Compacts the notes into a summary
> - D) Raises an exception that stops the loop
>
> *Explanation:* The cap keeps notes to what the rest of the task needs. Returning a message, as with every error here, lets the model adjust instead of crashing the run.

---

## Applied sandbox exercise

*(graded — notes the agent can't scramble)*

**Task shown to learner:** Implement the `Notes` class, with `SECTIONS = ["facts", "decisions", "open"]`:

- **`Notes(max_items=40)`** starts with no items. Each instance has its own.
- **`add(section, text)`:**
  - A section not in `SECTIONS` returns `Error: no section called SECTION. Use one of: facts, decisions, open.`
  - If there are already `max_items` items, it returns `Error: notes are full (MAX items). Keep notes to what the rest of the task needs.`
  - Otherwise it adds an item with id `n1`, `n2`, … in order, not done, and returns `Noted as ID under SECTION.`
- **`mark_done(item_id)`:**
  - An unknown id returns `Error: no note called ID.`
  - An item outside `"open"` returns `Error: ID is not an open item, so it can't be marked done.`
  - Otherwise it marks the item done and returns `Marked ID done.`
- **`render()`:**
  - `No notes yet.` when there are none.
  - Otherwise, for each section in `SECTIONS` order that has items: a line `SECTION:`, then one line per item, `- ID: TEXT`.
  - In `open`, the text is prefixed with `[x] ` or `[ ] ` for done or not.
  - Lines are joined by `"\n"`.
- **`index_line()`:**
  - `""` when there are none.
  - Otherwise `Your notes: F facts, D decisions, O open items. Read them with read_notes().`, where O counts open items not yet done.

An error never changes the notes.

**Starter code:**
```python
SECTIONS = ["facts", "decisions", "open"]

class Notes:
    def __init__(self, max_items: int = 40):
        # TODO: an empty list of items, and the cap
        ...

    def add(self, section: str, text: str) -> str:
        # TODO: check the section, then the cap; then add an item with the next id
        ...

    def mark_done(self, item_id: str) -> str:
        # TODO: only an existing item in "open" can be marked done
        ...

    def render(self) -> str:
        # TODO: "No notes yet.", or each non-empty section in order, with boxes for open items
        ...

    def index_line(self) -> str:
        # TODO: "" for no notes; otherwise the one-line count
        ...
```

**Hidden tests:**
```python
notes = Notes(max_items=4)

# 1. empty notes
assert notes.render() == "No notes yet." and notes.index_line() == ""

# 2. adding: numbered ids, one of the three sections only
assert notes.add("facts", "billing /lookup p99 4.8s") == "Noted as n1 under facts."
assert notes.add("open", "cache billing lookups") == "Noted as n2 under open."
assert notes.add("todo", "anything") == "Error: no section called todo. Use one of: facts, decisions, open."
assert notes.render() == "facts:\n- n1: billing /lookup p99 4.8s\nopen:\n- [ ] n2: cache billing lookups"
assert notes.add("decisions", "no restarts in production") == "Noted as n3 under decisions."

# 3. only open items can be marked done, and only ones that exist
assert notes.mark_done("n1") == "Error: n1 is not an open item, so it can't be marked done."
assert notes.mark_done("n9") == "Error: no note called n9."
assert notes.mark_done("n2") == "Marked n2 done."

# 4. rendering: sections in a fixed order, empty ones left out, open items with a box
notes.add("open", "report to the team")
assert notes.render() == ("facts:\n- n1: billing /lookup p99 4.8s\n"
                          "decisions:\n- n3: no restarts in production\n"
                          "open:\n- [x] n2: cache billing lookups\n- [ ] n4: report to the team")

# 5. the index counts facts, decisions, and open items not yet done
assert notes.index_line() == "Your notes: 1 facts, 1 decisions, 1 open items. Read them with read_notes()."

# 6. the cap: once full, nothing more is added, and the message says why
assert notes.add("facts", "one more") == "Error: notes are full (4 items). Keep notes to what the rest of the task needs."
assert len(notes.items) == 4

# 7. an error never changes the notes
before = notes.render()
notes.add("todo", "x"); notes.mark_done("n1"); notes.mark_done("n9")
assert notes.render() == before

# 8. two tasks, two notes objects: nothing is shared
other = Notes()
assert other.render() == "No notes yet." and other.add("facts", "x") == "Noted as n1 under facts."
```

**Hint (shown on request):** Keep each item as a dict with `id`, `section`, `text` and `done`. `render` loops over `SECTIONS` and collects that section's items with a list comprehension, skipping the section if there are none. Create the item list in `__init__` as `self.items = []`. A list written on the class itself would be shared by every `Notes` instance.

**Reference solution:**
```python
SECTIONS = ["facts", "decisions", "open"]

class Notes:
    """The agent's own notes for one task. It can add items and mark open ones done, but never rewrite them."""
    def __init__(self, max_items: int = 40):
        self.items = []
        self.max_items = max_items

    def add(self, section: str, text: str) -> str:
        if section not in SECTIONS:
            return f"Error: no section called {section}. Use one of: {', '.join(SECTIONS)}."
        if len(self.items) >= self.max_items:
            return f"Error: notes are full ({self.max_items} items). Keep notes to what the rest of the task needs."
        item_id = f"n{len(self.items) + 1}"
        self.items.append({"id": item_id, "section": section, "text": text, "done": False})
        return f"Noted as {item_id} under {section}."

    def mark_done(self, item_id: str) -> str:
        for item in self.items:
            if item["id"] == item_id:
                if item["section"] != "open":
                    return f"Error: {item_id} is not an open item, so it can't be marked done."
                item["done"] = True
                return f"Marked {item_id} done."
        return f"Error: no note called {item_id}."

    def render(self) -> str:
        if not self.items:
            return "No notes yet."
        lines = []
        for section in SECTIONS:
            entries = [item for item in self.items if item["section"] == section]
            if not entries:
                continue
            lines.append(f"{section}:")
            for item in entries:
                box = ("[x] " if item["done"] else "[ ] ") if section == "open" else ""
                lines.append(f"- {box}{item['id']}: {item['text']}")
        return "\n".join(lines)

    def index_line(self) -> str:
        if not self.items:
            return ""
        facts = len([i for i in self.items if i["section"] == "facts"])
        decisions = len([i for i in self.items if i["section"] == "decisions"])
        still_open = len([i for i in self.items if i["section"] == "open" and not i["done"]])
        return f"Your notes: {facts} facts, {decisions} decisions, {still_open} open items. Read them with read_notes()."
```

**Explanation:** Tests 2 and 4 pin down the format, including leaving out a section that has no items yet. Test 3 is the narrow-tools rule: only open items can be marked done, and only ones that exist. Test 5 checks that the index counts only open items still to do. Test 7 checks that every error leaves the notes exactly as they were. Test 8 catches keeping the list on the class instead of the instance, which would let one task's notes leak into another's.

---

*(End of Concept 3 — final concept of Lesson 6. The lesson continues with the recap and comprehensive sandbox.)*
