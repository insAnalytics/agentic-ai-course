# Offloading Context to Storage, and Note-Taking

> **Note for the site build:** the comprehensive sandbox is multi-file, in the same shape as Lessons 4 and 5. The tests import `fake` and `tokens` as site-provided modules, with the same exports as Lesson 5's sandbox. `lib.py` is read-only and shown in full below. It collects everything the sandbox uses from Lessons 2–6, with the corrected `ResultStore` (handles from a counter), plus Lesson 5's reference `CompactingContext` for the before/after test. `agent.py` is the entry file.

## Intro

> **You'll be able to**
> - Keep a large tool result out of the context while keeping it reachable: store it, send a preview and a handle, and give the agent tools to read it back
> - Make clearing and compaction restorable, so nothing the agent saw is lost for good
> - Keep a store safe to use: one per task, a size cap that says what it removed, and handles the store mints itself
> - Give an agent notes it keeps for itself, through tools that can't scramble them, and that survive compaction

**Why it matters**

Every technique in [Lessons 4](→ this module, when the history wont fit lesson) and [5](→ this module, compaction and summarization lesson) makes the context smaller by throwing something away: a result's content, a whole round, the exact words behind a summary. That's fine for data the agent can fetch again. It isn't fine for a snapshot that will never be the same twice, or for a detail whose importance only shows up ten steps later.

This lesson moves what the agent has seen out of the context instead of out of existence. Large results go to a store the moment they arrive. Cleared results and compacted rounds go there too. What the agent learns along the way goes into notes of its own. The context stays small, and everything in it stays one call away from the full detail.

---

## Recap & Practice

### Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Why can paging through a live source give an agent an inconsistent view, when paging through an offloaded copy can't?
> - A) Each page re-queries the source, so lines can repeat or go missing if it changes between pages ✅
> - B) Live sources only return the first page
> - C) An offloaded copy is sorted, so pages never overlap
> - D) Pagination doesn't work with tool calls
>
> *Explanation:* Offloading stores one snapshot and pages through that, so every page comes from the same moment.

> **Q2.** What does the header that `offload` puts in the context do?
> - A) It holds a compressed copy of the whole result
> - B) It tells the model what was stored, how large it is, and the exact call that reads more ✅
> - C) It marks the result so the cache skips it
> - D) It asks the model to summarize the result
>
> *Explanation:* A handle is only useful if the model knows the rest exists and how to reach it. The preview gives a first look.

> **Q3.** Why does `clear_to_store` leave results that are already placeholders alone?
> - A) Placeholders are too short to be worth storing
> - B) The API rejects changed placeholders
> - C) Context steps re-clear their saved view, and storing a placeholder would change the view and point a new handle at a placeholder instead of the data ✅
> - D) Placeholders are always newer than `keep_last`
>
> *Explanation:* With the skip, clearing a cleared view changes nothing. That's what makes repeated clearing free.

> **Q4.** A queue snapshot was cleared with Lesson 4's placeholder, "call snapshot_queue again". What goes wrong if the agent does?
> - A) It gets a later snapshot, with nothing to say that it differs from the one it saw ✅
> - B) The tool refuses a second call
> - C) The pairing breaks
> - D) The cache is invalidated
>
> *Explanation:* Re-fetching restores only what the source still returns unchanged. A stored copy restores exactly what the agent saw.

> **Q5.** How does `compact_with_archive` differ from Lesson 5's `compact`?
> - A) It writes a longer summary
> - B) It keeps the replaced rounds in the context
> - C) It skips compaction when the summary is too short
> - D) It stores a record of the replaced rounds first, and the summary says which handle holds it ✅
>
> *Explanation:* The summary stays short, and the exact detail is one search away when it turns out to matter.

> **Q6.** Why does the store mint handles itself, rather than accepting names or file paths from the model?
> - A) Minted handles are shorter
> - B) The model's argument should never become a file path, or a crafted "handle" could read files outside the store ✅
> - C) The model can't produce valid names
> - D) It keeps the cache stable
>
> *Explanation:* It's Module 3's least-privilege rule applied to one argument. The model only passes back handles it was given.

> **Q7.** Why can the note tools only add items and mark open items done?
> - A) Notes are read-only after the first turn
> - B) Rewriting notes would break the cache
> - C) A rewrite can drop an old fact while adding a new one, and narrow tools make that impossible ✅
> - D) The model can't produce valid JSON
>
> *Explanation:* Anthropic's long-running-agent harness limited edits to a status field for the same reason. Here the tools enforce it, whatever the storage format.

> **Q8.** In the demo, a summary dropped a rate limit the agent had noted. Why wasn't it lost?
> - A) Compaction never summarizes note calls
> - B) The notes live outside the conversation, so compaction never touched them, and the index line in every request says they're there ✅
> - C) The summary was checked and rejected
> - D) The rate limit was restated in the task
>
> *Explanation:* The calls that wrote the notes were summarized away, but what they wrote is still in the `Notes` object, one `read_notes()` call away.

---

### Comprehensive sandbox

*(applied, multi-file — a context step where nothing is lost)*

**Task shown to learner:** The registry agent investigates the slow support queue once more. It starts by taking a snapshot of the live queue: large, and different every time it's taken. It notes what the snapshot shows, reads a dozen agents' logs, and at the end checks the first snapshot again. With Lesson 5's `CompactingContext` and no store, that last check has nothing to read. `lib.py`, which is read-only, has everything from Lessons 2–6. Complete `agent.py`:

- **`offloading(function, store, threshold)`:** return a function that takes keyword arguments, calls `function` with them, and passes the result through `offload`.
- **`make_tools(store, notes, service_tools, threshold)`:** a dict of the agent's tools.
  - Every service tool, wrapped with `offloading`.
  - `read_result(handle, offset, limit)` and `find_in_result(handle, text)` on the store.
  - `add_note(section, text)`, `mark_done(item_id)` and `read_notes()` on the notes.
  - The readers and the note tools are never offloaded.
- **`RestorableContext(llm, tools, system, window, max_tokens, keep_last, keep_recent, write_tools, store, notes, low_water=0.6)`:** Lesson 5's `CompactingContext`, with three changes:
  - **Clearing** uses `clear_to_store` with the store.
  - **Compaction** uses `compact_with_archive` with the store.
  - **The anchor** is Lesson 5's `anchor_from_history`, then the notes' `index_line()` added with `add_to_end` if it isn't empty. Room is reserved for the whole anchor, index included. Write it as a method, `anchored(history, messages)`, and use it both to measure the anchor and to build the request.
- **`run_agent(llm, user_message, context, tool_impls, max_steps=40)`:** the same loop as Lesson 5's sandbox.

**Tab: `lib.py`** (read-only)
```python
# everything from Lessons 2-6 that this sandbox uses -- read-only
import json
from tokens import count_tokens, _plain

def is_tool_results(message: dict) -> bool:
    """A user message that answers tool calls. It may also carry text added after the results."""
    return (message["role"] == "user" and isinstance(message["content"], list)
            and any(_plain(b)["type"] == "tool_result" for b in message["content"]))

def check_pairing(messages: list) -> list:
    """The two pairing rules the API enforces, as a list of problems. Empty means the history is valid."""
    problems = []
    for i in range(len(messages)):
        message = messages[i]
        blocks = [_plain(b) for b in message["content"]] if isinstance(message["content"], list) else []
        if message["role"] == "assistant":
            call_ids = [b["id"] for b in blocks if b["type"] == "tool_use"]
            answered = []
            if i + 1 < len(messages) and is_tool_results(messages[i + 1]):
                answered = [_plain(b)["tool_use_id"] for b in messages[i + 1]["content"] if _plain(b)["type"] == "tool_result"]
            missing = [c for c in call_ids if c not in answered]
            if missing:
                problems.append(f"messages.{i}: tool_use without a tool_result immediately after: {missing}")
        if message["role"] == "user":
            result_ids = [b["tool_use_id"] for b in blocks if b["type"] == "tool_result"]
            called = []
            if i > 0 and messages[i - 1]["role"] == "assistant":
                called = [_plain(b)["id"] for b in messages[i - 1]["content"] if _plain(b)["type"] == "tool_use"]
            unknown = [r for r in result_ids if r not in called]
            if unknown:
                problems.append(f"messages.{i}: tool_result with no tool_use in the previous message: {unknown}")
    return problems

def check_open_round(history: list, sent: list) -> list:
    """The assistant message whose tool results are being sent must go back exactly as it was returned."""
    def last_assistant(messages):
        found = None
        for message in messages:
            if message["role"] == "assistant":
                found = message
        return found
    returned, resent = last_assistant(history), last_assistant(sent)
    if returned is None:
        return []
    if resent is None or _plain(resent["content"]) != _plain(returned["content"]):
        return ["the newest assistant message was not sent back exactly as returned"]
    return []

def split_rounds(messages: list) -> list:
    """Group everything after the first message into rounds that can be removed safely."""
    rounds = []
    for message in messages[1:]:
        if is_tool_results(message) and rounds:
            rounds[-1].append(message)
        else:
            rounds.append([message])
    return rounds

def trim_to_fit(messages: list, budget: int) -> list:
    """Keep the task and the newest rounds; drop the oldest whole rounds until the messages fit."""
    task = messages[0]
    rounds = split_rounds(messages)
    while True:
        kept = [task]
        for r in rounds:
            kept += r
        if count_tokens(kept) <= budget or len(rounds) == 1:
            return kept
        rounds = rounds[1:]

def clear_old_results(messages: list, keep_last: int) -> list:
    """Replace the content of all but the newest `keep_last` successful tool results with a placeholder.
    Tool calls, failed results, and every message stay where they are."""
    names = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if _plain(block)["type"] == "tool_use":
                    names[block.id] = block.name

    successful = []
    for message in messages:
        if is_tool_results(message):
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error") and block["tool_use_id"] not in to_keep:
                    name = names[block["tool_use_id"]]
                    block = {**block, "content": f"[cleared: an earlier {name} result, removed to save space. Call {name} again if you need it.]"}
                new_content.append(block)
            cleared.append({**message, "content": new_content})
        else:
            cleared.append(message)
    return cleared

def fit(messages: list, budget: int, keep_last: int) -> list:
    """Clear old results first; drop whole rounds only if that still isn't enough."""
    if count_tokens(messages) <= budget:
        return list(messages)
    return trim_to_fit(clear_old_results(messages, keep_last), budget)

def strip_old_thinking(messages: list) -> list:
    """Remove thinking blocks from every assistant message except the newest one."""
    last = -1
    for i in range(len(messages)):
        if messages[i]["role"] == "assistant":
            last = i
    stripped = []
    for i in range(len(messages)):
        message = messages[i]
        if message["role"] == "assistant" and i != last:
            kept = [b for b in message["content"] if _plain(b)["type"] != "thinking"]
            if kept:
                message = {**message, "content": kept}
        stripped.append(message)
    return stripped

def fit_history(messages: list, budget: int, keep_last: int) -> list:
    """Old reasoning goes first, then old results, then whole rounds."""
    if count_tokens(messages) <= budget:
        return list(messages)
    return fit(strip_old_thinking(messages), budget, keep_last)

def add_to_end(messages: list, text: str) -> list:
    last = messages[-1]
    if isinstance(last["content"], str):
        new_last = {**last, "content": last["content"] + "\n\n" + text}
    else:
        new_last = {**last, "content": last["content"] + [{"type": "text", "text": text}]}
    return messages[:-1] + [new_last]

def rule_history(messages: list) -> dict:
    """Every value each rule has been set to, in order, from the agent's set_rule calls."""
    history = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "set_rule":
                    history.setdefault(block.input["name"], []).append(block.input["value"])
    return history

def current_rules_block(messages: list) -> str:
    history = rule_history(messages)
    if not history:
        return ""
    lines = [f"- {name}: {values[-1]}" for name, values in history.items()]
    return "<current_rules>\n" + "\n".join(lines) + "\n</current_rules>"

def latest_plan(messages: list) -> str:
    plan = ""
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "update_plan":
                    plan = block.input["plan"]
    return plan

def assemble_context(messages: list) -> list:
    """Return the messages to send, with the current plan and rules restated at the very end."""
    parts = []
    plan = latest_plan(messages)
    if plan:
        parts.append(f"<current_plan>\n{plan}\n</current_plan>")
    rules = current_rules_block(messages)
    if rules:
        parts.append(rules)
    if not parts:
        return messages
    anchor = "\n".join(parts)

    last = messages[-1]
    if isinstance(last["content"], str):
        new_last = {**last, "content": last["content"] + "\n\n" + anchor}
    else:
        # tool_result blocks must come first in a user message, so the anchor goes after them
        new_last = {**last, "content": last["content"] + [{"type": "text", "text": anchor}]}
    return messages[:-1] + [new_last]

SUMMARY_INSTRUCTIONS = """Write a summary of the work above. The messages it covers will be removed, and you will continue the task from this summary alone.
Include:
- the task, and every constraint or preference the user stated
- decisions made, and the reason for each
- facts established, with exact values: names, ids, numbers, paths
- what is finished, and what was tried and failed, with why
- open questions and the next steps
If an earlier summary appears above, don't repeat it: cover only the work after it.
Leave out raw tool output that can be fetched again. Plain text, under 300 words."""

def summary_request(messages: list, keep_recent: int):
    """The messages to send to get a summary of everything except the newest keep_recent rounds, or None."""
    rounds = split_rounds(messages)
    if keep_recent >= len(rounds):
        return None
    older = [messages[0]]
    for r in rounds[:len(rounds) - keep_recent]:
        older += r
    return add_to_end(older, SUMMARY_INSTRUCTIONS)

def compact(messages: list, summary: str, keep_recent: int) -> list:
    """Replace every round but the newest keep_recent with a summary, placed after the task in the first message."""
    rounds = split_rounds(messages)
    first = {"role": "user",
             "content": messages[0]["content"] + "\n\n<summary_of_earlier_work>\n" + summary + "\n</summary_of_earlier_work>"}
    compacted = [first]
    for r in rounds[len(rounds) - keep_recent:]:
        compacted += r
    return compacted

def changes_ledger(messages: list, write_tools: list) -> list:
    """One line per call to a write tool, with its arguments and the first line of its result."""
    results = {}
    for message in messages:
        if is_tool_results(message):
            for block in message["content"]:
                if block.get("type") == "tool_result":
                    results[block["tool_use_id"]] = block
    lines = []
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if _plain(block)["type"] == "tool_use" and block.name in write_tools and block.id in results:
                    result = results[block.id]
                    arguments = ", ".join([f"{key}={value}" for key, value in block.input.items()])
                    outcome = "FAILED: " if result.get("is_error") else ""
                    first_line = str(result["content"]).split("\n")[0]
                    lines.append(f"- {block.name}({arguments}) -> {outcome}{first_line}")
    return lines

def anchor_from_history(history: list, messages: list, write_tools: list) -> list:
    """Restate the plan, the rules and every change made, all read from the full history, at the end of `messages`."""
    parts = []
    plan = latest_plan(history)
    if plan:
        parts.append(f"<current_plan>\n{plan}\n</current_plan>")
    rules = current_rules_block(history)
    if rules:
        parts.append(rules)
    changes = changes_ledger(history, write_tools)
    if changes:
        parts.append("<changes_made>\n" + "\n".join(changes) + "\n</changes_made>")
    if not parts:
        return messages
    return add_to_end(messages, "\n".join(parts))

def next_step(view: list, budget: int, low_water: int, keep_last: int, keep_recent: int) -> str:
    """What the context step should do with this view: "send", "clear", "compact", or "trim"."""
    if count_tokens(view) <= budget:
        return "send"
    cleared = clear_old_results(strip_old_thinking(view), keep_last)
    if count_tokens(cleared) <= low_water:
        return "clear"
    if summary_request(cleared, keep_recent) is None:
        return "trim"
    return "compact"


def serialize(x) -> str:
    # byte-for-byte form, as a cache sees it: key order matters, exactly as sent
    return json.dumps(_plain(x))

def first_divergence(previous: dict, current: dict) -> dict:
    """Where does `current` stop matching `previous`, and how much of it could be read from the cache?"""
    reusable = 0
    if serialize(current["tools"]) != serialize(previous["tools"]):
        return {"diverges_at": "tools", "reusable_tokens": 0}
    reusable += count_tokens(current["tools"])
    if serialize(current["system"]) != serialize(previous["system"]):
        return {"diverges_at": "system", "reusable_tokens": reusable}
    reusable += count_tokens(current["system"])
    for i, old in enumerate(previous["messages"]):
        if i >= len(current["messages"]) or serialize(current["messages"][i]) != serialize(old):
            return {"diverges_at": f"messages[{i}]", "reusable_tokens": reusable}
        reusable += count_tokens(old)
    return {"diverges_at": None, "reusable_tokens": reusable}

def cost_of_run(requests: list, read_multiplier: float, write_multiplier: float) -> int:
    """Cost of the requests actually sent, using first_divergence to see what each could reuse."""
    total = 0.0
    previous = None
    for request in requests:
        size = count_tokens(request["tools"]) + count_tokens(request["system"]) + count_tokens(request["messages"])
        reused = first_divergence(previous, request)["reusable_tokens"] if previous else 0
        total += reused * read_multiplier + (size - reused) * write_multiplier
        previous = request
    return round(total)

# Lesson 4's context step, for comparison
class FittingContext:
    def __init__(self, tools: list, system: str, window: int, max_tokens: int, keep_last: int, low_water: float = 0.6):
        # the prefix is fixed for the run, so the room left for messages is too
        self.tools = tools
        self.system = system
        self.budget = window - count_tokens(system) - count_tokens(tools) - max_tokens
        self.low_water = int(self.budget * low_water)
        self.keep_last = keep_last
        self.view = []
        self.seen = 0

    def build(self, history: list) -> dict:
        view = self.view + history[self.seen:]
        if count_tokens(view) > self.budget:
            view = fit_history(view, self.low_water, self.keep_last)
        self.view = view
        self.seen = len(history)
        return {"tools": self.tools, "system": self.system, "messages": view}

class ResultStore:
    """Large tool results, kept outside the conversation under handles the store mints."""
    def __init__(self):
        self.items = {}
        self.minted = 0

    def put(self, content: str) -> str:
        self.minted += 1
        handle = f"res_{self.minted}"
        self.items[handle] = content
        return handle

    def get(self, handle: str):
        return self.items.get(handle)

def offload(content: str, store: ResultStore, threshold: int, preview_lines: int = 10) -> str:
    """Small results pass through. Large ones are stored, and a preview with the handle goes into the context."""
    if count_tokens(content) <= threshold:
        return content
    handle = store.put(content)
    lines = content.split("\n")
    preview = "\n".join(lines[:preview_lines])
    return (f"[Stored as {handle}: {len(lines)} lines, about {count_tokens(content):,} tokens. "
            f"The first {preview_lines} lines are below. "
            f"Read more with read_result(handle=\"{handle}\", offset=..., limit=...).]\n{preview}")

def read_result(store: ResultStore, handle: str, offset: int = 0, limit: int = 50) -> str:
    content = store.get(handle)
    if content is None:
        return f"Error: no stored result called {handle}. Use a handle exactly as it appears in an earlier result."
    lines = content.split("\n")
    page = lines[offset:offset + limit]
    text = "\n".join(page)
    if offset + limit < len(lines):
        text += f"\n\n... lines {offset}-{offset + len(page)} of {len(lines)}. Call again with offset={offset + limit} for more."
    return text

def find_in_result(store: ResultStore, handle: str, text: str, max_matches: int = 20) -> str:
    """The lines of a stored result that contain `text`, with their line numbers."""
    content = store.get(handle)
    if content is None:
        return f"Error: no stored result called {handle}. Use a handle exactly as it appears in an earlier result."
    lines = content.split("\n")
    matches = [f"{i}: {lines[i]}" for i in range(len(lines)) if text in lines[i]]
    if not matches:
        return f"No lines in {handle} contain {text}."
    shown = "\n".join(matches[:max_matches])
    if len(matches) > max_matches:
        shown += f"\n... {len(matches) - max_matches} more matches not shown."
    return shown

def clear_to_store(messages: list, keep_last: int, store: ResultStore) -> list:
    """Like clear_old_results, but each cleared result is stored first, and its placeholder says how to read it back."""
    names = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if _plain(block)["type"] == "tool_use":
                    names[block.id] = block.name

    successful = []
    for message in messages:
        if is_tool_results(message):
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                old = block.get("type") == "tool_result" and not block.get("is_error") and block["tool_use_id"] not in to_keep
                # a result that's already a placeholder is left alone, so clearing twice changes nothing
                if old and not str(block["content"]).startswith("[cleared:"):
                    handle = store.put(str(block["content"]))
                    name = names[block["tool_use_id"]]
                    block = {**block, "content": f"[cleared: an earlier {name} result, stored as {handle}. "
                                                 f"Read it with read_result(handle=\"{handle}\", offset=..., limit=...).]"}
                new_content.append(block)
            cleared.append({**message, "content": new_content})
        else:
            cleared.append(message)
    return cleared

def transcript(messages: list) -> str:
    """A plain-text record of messages: what was said, what was called, what came back."""
    lines = []
    for message in messages:
        if isinstance(message["content"], str):
            lines.append(f"{message['role']}: {message['content']}")
            continue
        for block in message["content"]:
            block = _plain(block)
            if block["type"] == "text":
                lines.append(f"{message['role']}: {block['text']}")
            elif block["type"] == "tool_use":
                lines.append(f"called {block['name']}({json.dumps(block['input'])})")
            elif block["type"] == "tool_result":
                lines.append(f"result: {block['content']}")
    return "\n".join(lines)

def compact_with_archive(messages: list, summary: str, keep_recent: int, store: ResultStore) -> list:
    """compact, but the rounds being replaced are stored first, and the summary says where."""
    rounds = split_rounds(messages)
    replaced = []
    for r in rounds[:len(rounds) - keep_recent]:
        replaced += r
    handle = store.put(transcript(replaced))
    note = f"\nThe full record of this work is stored as {handle}; read it with read_result(handle=\"{handle}\", offset=..., limit=...)."
    return compact(messages, summary + note, keep_recent)

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

# Lesson 5's context step, for comparison
class CompactingContext:
    def __init__(self, llm, tools: list, system: str, window: int, max_tokens: int,
                 keep_last: int, keep_recent: int, write_tools: list, low_water: float = 0.6):
        self.llm = llm
        self.tools = tools
        self.system = system
        self.budget = window - count_tokens(system) - count_tokens(tools) - max_tokens
        self.low_water_ratio = low_water
        self.keep_last = keep_last
        self.keep_recent = keep_recent
        self.write_tools = write_tools
        self.view = []
        self.seen = 0
        self.summary_requests = []

    def build(self, history: list) -> dict:
        view = self.view + history[self.seen:]
        # the anchor is restated every turn, so the view gets what's left after it
        anchor_size = count_tokens(anchor_from_history(history, view, self.write_tools)) - count_tokens(view)
        budget = self.budget - anchor_size
        low_water = int(budget * self.low_water_ratio)

        step = next_step(view, budget, low_water, self.keep_last, self.keep_recent)
        if step != "send":
            view = clear_old_results(strip_old_thinking(view), self.keep_last)
        if step == "compact":
            request = summary_request(view, self.keep_recent)
            self.summary_requests.append(request)
            response = self.llm.create(messages=request, tools=self.tools, system=self.system)
            summary = "".join(b.text for b in response.content if b.type == "text")
            if summary:
                view = compact(view, summary, self.keep_recent)
            else:
                step = "trim"
        if step == "trim":
            view = trim_to_fit(view, low_water)

        self.view = view
        self.seen = len(history)
        return {"tools": self.tools, "system": self.system,
                "messages": anchor_from_history(history, view, self.write_tools)}
```

**Tab: `agent.py`** (starter, entry file)
```python
from tokens import count_tokens
from lib import (next_step, strip_old_thinking, clear_to_store, summary_request, compact_with_archive,
                 trim_to_fit, anchor_from_history, add_to_end, offload, read_result, find_in_result)

def offloading(function, store, threshold: int):
    # TODO: return a function that calls `function` and passes its result through offload
    ...

def make_tools(store, notes, service_tools: dict, threshold: int) -> dict:
    # TODO: the service tools, offloaded; plus read_result, find_in_result, add_note, mark_done, read_notes
    ...

class RestorableContext:
    def __init__(self, llm, tools: list, system: str, window: int, max_tokens: int, keep_last: int,
                 keep_recent: int, write_tools: list, store, notes, low_water: float = 0.6):
        # TODO: as Lesson 5's CompactingContext, plus the store and the notes
        ...

    def anchored(self, history: list, messages: list) -> list:
        # TODO: Lesson 5's anchor from the full history, then the notes index line if there is one
        ...

    def build(self, history: list) -> dict:
        # TODO: Lesson 5's build, with clear_to_store, compact_with_archive and the anchor above
        ...

def run_agent(llm, user_message, context, tool_impls, max_steps=40):
    # TODO: the same loop as Lesson 5's sandbox
    ...
```

**Hidden tests:**
```python
from fake import *
from tokens import count_tokens, _plain
from lib import (SUMMARY_INSTRUCTIONS, ResultStore, Notes, check_pairing, check_open_round, CompactingContext)
from agent import make_tools, RestorableContext, run_agent
import json

TOOLS = [{"name": n, "description": f"{n} tool", "input_schema": {"type": "object", "properties": {}}}
         for n in ["snapshot_queue", "get_logs", "read_result", "find_in_result", "add_note", "mark_done", "read_notes"]]
SYSTEM = "You are the registry assistant. Find out why the support queue is slow, then report."
AGENTS = ["research_agent", "triage_agent", "search_agent", "report_agent", "auth_agent", "notify_agent"] * 2
TASK = "Find out why the support queue is slow."
WINDOW, MAX_TOKENS = 4_000, 1_000

class QueueService:
    """A live queue: every snapshot is different."""
    def __init__(self):
        self.taken = 0
    def snapshot(self, queue):
        self.taken += 1
        cause = "stuck in billing lookup" if self.taken == 1 else "waiting for triage"
        return f"{queue} queue, snapshot {self.taken}\n" + "\n".join(f"ticket {4100 + n}: {cause}" for n in range(150))

def services():
    live = QueueService()
    return {"snapshot_queue": lambda queue: live.snapshot(queue),
            "get_logs": lambda agent_name: f"{agent_name} logs\n" + f"{agent_name} INFO request handled in 412ms\n" * 45}

def script():
    steps = [[TextBlock(text="Taking a queue snapshot first."), ToolUseBlock(name="snapshot_queue", input={"queue": "support"})],
             [ToolUseBlock(name="find_in_result", input={"handle": "res_1", "text": "billing"})],
             [ToolUseBlock(name="add_note", input={"section": "facts", "text": "at snapshot 1, tickets were stuck in billing lookup"})],
             [ToolUseBlock(name="add_note", input={"section": "open", "text": "confirm billing is the bottleneck"})]]
    for agent in AGENTS:
        steps.append([ToolUseBlock(name="get_logs", input={"agent_name": agent})])
    steps += [[ToolUseBlock(name="read_notes", input={})],
              [ToolUseBlock(name="find_in_result", input={"handle": "res_1", "text": "ticket 4100"})],
              [TextBlock(text="Tickets were stuck in billing lookup at the first snapshot; billing is the bottleneck.")]]
    return steps

class ScriptedAgent(FakeLLMClient):
    """Plays the agent's scripted steps, and answers any summary request with a scripted summary."""
    def __init__(self, steps):
        super().__init__(steps)
        self.summaries_written = 0
    def create(self, messages, tools=None, system=""):
        last = messages[-1]["content"]
        if isinstance(last, list) and _plain(last[-1]).get("text") == SUMMARY_INSTRUCTIONS:
            self.summaries_written += 1
            return FakeResponse(content=[TextBlock(text="A queue snapshot was taken; several agents' logs were normal.")])
        return super().create(messages)

class Watch:
    def __init__(self, inner):
        self.inner = inner
        self.lengths = []
    def build(self, history):
        self.lengths.append(len(history))
        return self.inner.build(history)

text = lambda messages: json.dumps(_plain(messages))

# 1. before: Lesson 5's context step, with no store or notes. The late check on the first snapshot has nothing to read.
before_llm = ScriptedAgent(script())
_, before_history, _ = run_agent(before_llm, TASK,
                                 CompactingContext(before_llm, TOOLS, SYSTEM, WINDOW, MAX_TOKENS, 2, 2, []), services())
last_check = before_history[-2]["content"][0]["content"]
assert last_check == "Error: there is no tool called find_in_result"

# ... after: the same script, with this lesson's tools and context step
store, notes = ResultStore(), Notes()
llm = ScriptedAgent(script())
context = RestorableContext(llm, TOOLS, SYSTEM, WINDOW, MAX_TOKENS, keep_last=2, keep_recent=2,
                            write_tools=[], store=store, notes=notes)
watch = Watch(context)
answer, history, sent = run_agent(llm, TASK, watch, make_tools(store, notes, services(), threshold=600))
assert answer.startswith("Tickets were stuck in billing lookup")
assert "ticket 4100: stuck in billing lookup" in history[-2]["content"][0]["content"]

# 2. large results were offloaded when created; the readers' and note tools' output was not
results = {}
for m in history:
    if m["role"] == "user" and isinstance(m["content"], list):
        for b in m["content"]:
            results[b["tool_use_id"]] = b["content"]
calls = {b.id: b.name for m in history if m["role"] == "assistant" for b in m["content"] if b.type == "tool_use"}
assert results[next(i for i, n in calls.items() if n == "snapshot_queue")].startswith("[Stored as res_1: 151 lines")
assert all(not results[i].startswith("[Stored as") for i, n in calls.items()
           if n in ["read_result", "find_in_result", "add_note", "mark_done", "read_notes"])
assert all(not results[i].startswith("[Stored as") for i, n in calls.items() if n == "get_logs")

# 3. every request fits, anchor included, and is valid
for n, r in zip(watch.lengths, sent):
    assert count_tokens(r["messages"]) <= context.budget
    assert r["messages"][0]["content"].startswith(TASK)
    assert check_pairing(r["messages"]) == [] and check_open_round(history[:n], r["messages"]) == []

# 4. clearing went through the store, and every cleared result reads back exactly as it was
cleared_somewhere = False
for r in sent:
    for m in r["messages"]:
        if m["role"] == "user" and isinstance(m["content"], list):
            for b in m["content"]:
                if b.get("type") == "tool_result" and str(b["content"]).startswith("[cleared:"):
                    cleared_somewhere = True
                    assert "stored as " in b["content"], "a result was cleared without being stored"
                    handle = b["content"].split("stored as ")[1].split(".")[0]
                    assert store.get(handle) == results[b["tool_use_id"]]
assert cleared_somewhere

# 5. nothing stored is itself a placeholder: clearing a cleared view stored nothing new
assert not any(v.startswith("[cleared:") for v in store.items.values())

# 6. compaction happened, and each summary says where the full record of its rounds is stored
summaries = [r for r in sent if "<summary_of_earlier_work>" in text(r["messages"])]
assert summaries and llm.summaries_written >= 1
first = summaries[0]["messages"][0]["content"]
assert "The full record of this work is stored as " in first, "compaction left no stored record"
archive = first.split("The full record of this work is stored as ")[1].split(";")[0]
assert "called add_note" in store.get(archive) and "snapshot_queue" in store.get(archive)

# 7. the notes survived compaction: the index is in every request after the first note, and read_notes still has the fact
first_note = next(i for i, n in enumerate(watch.lengths) if n > 8)
assert all("Your notes: 1 facts, 0 decisions, 1 open items." in text(r["messages"]) for r in sent[first_note:])
read = results[next(i for i, n in calls.items() if n == "read_notes")]
assert "n1: at snapshot 1, tickets were stuck in billing lookup" in read

# 8. the loop's own history is untouched: no placeholders in it
assert "[cleared:" not in text(history)

# 2b. a reader returns what was asked for, even a large page: it is never offloaded itself
tools_again = make_tools(store, notes, services(), threshold=600)
page = tools_again["read_result"](handle="res_1", offset=0, limit=150)
assert page.startswith("support queue, snapshot 1") and count_tokens(page) > 600

# 10. room is reserved for the whole anchor, notes index included
from lib import anchor_from_history, add_to_end
def answered(name, arguments, result):
    call = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": result}]}]
tight = ([{"role": "user", "content": TASK}]
         + answered("get_logs", {"agent_name": "a"}, "x" * 2_000)
         + answered("get_logs", {"agent_name": "b"}, "y" * 2_000))
tight_notes = Notes()
tight_notes.add("facts", "a fact worth keeping across the whole task")
plain = count_tokens(anchor_from_history(tight, tight, []))
index = count_tokens(add_to_end(tight, tight_notes.index_line())) - count_tokens(tight)
window = plain + index // 2 + count_tokens(SYSTEM) + count_tokens(TOOLS) + MAX_TOKENS
tight_context = RestorableContext(ScriptedAgent([]), TOOLS, SYSTEM, window, MAX_TOKENS, 1, 1, [], ResultStore(), tight_notes)
assert count_tokens(tight_context.build(tight)["messages"]) <= tight_context.budget

# 9. a new task gets a new store and new notes: tools built for one don't see the other's data
other_store, other_notes = ResultStore(), Notes()
other_tools = make_tools(other_store, other_notes, services(), threshold=600)
assert other_tools["read_result"](handle="res_1", offset=0, limit=5).startswith("Error: no stored result called res_1")
assert other_tools["read_notes"]() == "No notes yet."
```

**Hint (shown on request):** Start from [Lesson 5's `CompactingContext`](→ this module, compaction and summarization lesson): the structure doesn't change, only the three calls named in the task. For `make_tools`, a helper that returns an inner function (`offloading`) avoids a classic trap. A lambda written directly in the loop would look up `function` when it's called, not when it's made, so every tool would call the last one.

**Reference solution — `agent.py`:**
```python
from tokens import count_tokens
from lib import (next_step, strip_old_thinking, clear_to_store, summary_request, compact_with_archive,
                 trim_to_fit, anchor_from_history, add_to_end, offload, read_result, find_in_result)

def offloading(function, store, threshold: int):
    """Wrap a tool so a large result is stored, and only its preview and handle come back."""
    def wrapped(**arguments):
        return offload(function(**arguments), store, threshold)
    return wrapped

def make_tools(store, notes, service_tools: dict, threshold: int) -> dict:
    """The agent's tools: service tools with large results offloaded, plus the readers and the note tools."""
    tools = {}
    for name, function in service_tools.items():
        tools[name] = offloading(function, store, threshold)
    tools["read_result"] = lambda handle, offset, limit: read_result(store, handle, offset, limit)
    tools["find_in_result"] = lambda handle, text: find_in_result(store, handle, text)
    tools["add_note"] = lambda section, text: notes.add(section, text)
    tools["mark_done"] = lambda item_id: notes.mark_done(item_id)
    tools["read_notes"] = lambda: notes.render()
    return tools

class RestorableContext:
    def __init__(self, llm, tools: list, system: str, window: int, max_tokens: int, keep_last: int,
                 keep_recent: int, write_tools: list, store, notes, low_water: float = 0.6):
        self.llm = llm
        self.tools = tools
        self.system = system
        self.budget = window - count_tokens(system) - count_tokens(tools) - max_tokens
        self.low_water_ratio = low_water
        self.keep_last = keep_last
        self.keep_recent = keep_recent
        self.write_tools = write_tools
        self.store = store
        self.notes = notes
        self.view = []
        self.seen = 0
        self.summary_requests = []

    def anchored(self, history: list, messages: list) -> list:
        messages = anchor_from_history(history, messages, self.write_tools)
        index = self.notes.index_line()
        return add_to_end(messages, index) if index else messages

    def build(self, history: list) -> dict:
        view = self.view + history[self.seen:]
        anchor_size = count_tokens(self.anchored(history, view)) - count_tokens(view)
        budget = self.budget - anchor_size
        low_water = int(budget * self.low_water_ratio)

        step = next_step(view, budget, low_water, self.keep_last, self.keep_recent)
        if step != "send":
            view = clear_to_store(strip_old_thinking(view), self.keep_last, self.store)
        if step == "compact":
            request = summary_request(view, self.keep_recent)
            self.summary_requests.append(request)
            response = self.llm.create(messages=request, tools=self.tools, system=self.system)
            summary = "".join(b.text for b in response.content if b.type == "text")
            if summary:
                view = compact_with_archive(view, summary, self.keep_recent, self.store)
            else:
                step = "trim"
        if step == "trim":
            view = trim_to_fit(view, low_water)

        self.view = view
        self.seen = len(history)
        return {"tools": self.tools, "system": self.system, "messages": self.anchored(history, view)}

def run_agent(llm, user_message, context, tool_impls, max_steps=40):
    history = [{"role": "user", "content": user_message}]
    sent = []
    for step in range(max_steps):
        request = context.build(history)
        sent.append(request)
        response = llm.create(messages=request["messages"], tools=request["tools"], system=request["system"])
        history.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text"), history, sent
        results = []
        for call in calls:
            if call.name not in tool_impls:
                results.append({"type": "tool_result", "tool_use_id": call.id,
                                "content": f"Error: there is no tool called {call.name}", "is_error": True})
            else:
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": tool_impls[call.name](**call.input)})
        history.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer", history, sent
```

**Explanation:** Each test checks one idea from the lesson:

- **Before and after:** without a store, the final check on the first snapshot has nothing to read. With one, it finds the original line, even though the live queue has changed since (test 1).
- **Offloading happens at creation, and only for service tools:** the snapshot comes back as a handle, and the readers return what was asked for, however large (tests 2 and 2b).
- **Every request fits and is valid,** with room reserved for the whole anchor, notes index included (tests 3 and 10).
- **Clearing is lossless:** every cleared result's handle reads back exactly the original, and no placeholder is ever stored (tests 4 and 5).
- **Compaction leaves a record:** each summary names a stored record of the rounds it replaced (test 6).
- **Notes survive compaction:** the index is in every request once there are notes, and `read_notes` still has the fact (test 7).
- **The loop's history is untouched** (test 8), and **each task gets its own store and notes** (test 9).

One thing the first version of this scenario showed: with its logs small enough to offload too, the context never grew enough to need clearing or compaction at all. Offloading at creation doesn't replace the later stages, but it pushes them a long way back. The sandbox's logs are sized to enter the context whole, so every stage runs.
