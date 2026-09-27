# Module 4, Lesson 12 — Concept 1: One context step, in order

> **Note for the site build:** this lesson's setup is the whole module's code, in dependency order: the fake client with `count_tokens`, `WindowedClient` and `CHECK_PAIRING`; Lesson 2's rules and plan functions; Lesson 3's `add_to_end`, `serialize`, `first_divergence` and `cost_of_run`; Lesson 4's fitting code; Lesson 5's compaction and anchoring; Lesson 6's store, offloading, restorable clearing and `Notes`; Lessons 8–11's memory code, with `CoreBlock` from Lesson 9. Use the corrected version of each (Lesson 4's `is_tool_results`, Lesson 6's counter-based `ResultStore`, Lesson 8's `keywords`, Lesson 9's `save_memory` message). Add `anchor_text` and `ContextManager` from this concept. The session's tools and script (the third code block) are defined once, and loaded for this lesson's demos.

---

## Three phases

This module built one piece at a time. In a working agent, they all live in one place: the step that prepares each request, between the loop keeping its history and the model call. [Lesson 3](→ this module, prompt caching lesson) started that step, and every lesson since has added to it. Assembled, it works in three phases:

- **At session start,** everything in the prefix is decided, once:
  - the tool list ([Lesson 7](→ this module, just in time context and dynamic tool exposure lesson))
  - the system prompt and the guide index
  - the memory block as it stands, and the memories recalled for this task, with the user's instructions first ([Lessons 9–11](→ this module, building a memory store lesson))
- **Each turn,** in this order:
  - Tool results are shaped as they arrive, by the tools themselves: large ones offloaded to the store, with a preview and a handle ([Lesson 6](→ this module, offloading context to storage and note taking lesson)).
  - The view is fitted only when it's over budget. Old reasoning is stripped and old results cleared to the store; compaction, with an archive, follows only if that isn't enough; trimming is the last resort ([Lessons 4–6](→ this module, when the history wont fit lesson)).
  - The anchor is added at the end: the plan, the rules, the change ledger, the notes index, and any edits to the memory block ([Lessons 2, 5, 6 and 9](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept)).
- **After the session,** the write path runs: extract, check, admit and store ([Lesson 10](→ this module, deciding what to remember lesson)), then forget ([Lesson 11](→ this module, forgetting aging and retrieval quality lesson)).

## The integration rules

Each piece worked on its own page. Putting them together surfaced rules that aren't obvious from any single lesson, and each one was learned the hard way somewhere in this module:

- **Anchors are read from the full history, never the prepared copy.** After compaction, the calls that set the plan and rules are gone from the copy ([Lesson 5](→ this module, compaction and summarization lesson, when a summary loses something concept)).
- **Room is reserved for everything restated at the end.** The anchor counts against the budget ([Lesson 5's sandbox](→ this module, compaction and summarization lesson)).
- **Cheap before expensive, and nothing lost:** strip old reasoning, then clear to the store, then compact with an archive, then trim.
- **The summary is asked for inside the conversation,** with the agent's own tools and system prompt, so it reuses the cache ([Lesson 5](→ this module, compaction and summarization lesson, when to compact and what it costs concept)).
- **The prefix is fixed for the session.** Memories recalled at the start and the block as it was then go in it. Changes during the session go at the end, and join the prefix at the next session ([Lesson 9](→ this module, building a memory store lesson, where recalled memories go and what it costs concept)).
- **Tools are bound to the session's user,** and the tool list never changes ([Lessons 7 and 9](→ this module, just in time context and dynamic tool exposure lesson, what you load and where it goes concept)).
- **Recall before forgetting,** so what a task needs is refreshed before it's judged ([Lesson 11](→ this module, forgetting aging and retrieval quality lesson)).
- **Summaries don't pile up forever.** [Lesson 5](→ this module, compaction and summarization lesson, when a summary loses something concept, summaries of summaries) appends each new summary rather than rewriting old ones, and said that rewriting them would eventually be a deliberate step. Here it is: when the summaries take more than a set share of the budget, they're folded into one, and the old ones are stored first, so nothing is lost. The next concept shows what happens without it.
- **A request always fits.** Whatever the steps above leave, a view still over budget is trimmed by whole rounds, as the last resort.
- **The write path fits the window too.** After a long session, [Lesson 10's extraction](→ this module, deciding what to remember lesson, extraction with evidence concept) can't send the whole transcript in one request. It reads the session in chunks that fit, with entry numbers kept global so every quote can still be checked. The lesson's sandbox is where this surfaced.

## The context step, in code

The anchor is one function, with its parts in a fixed order, each included only if it has something to say:

```python
def anchor_text(history: list, notes, block, block_at_start: str, write_tools: list) -> str:
    """Everything restated at the end of each request, read from the full history, in a fixed order."""
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
    index = notes.index_line()
    if index:
        parts.append(index)
    if block.text != block_at_start:
        parts.append("Your memory block has changed this session. It now reads:\n" + block.text)
    return "\n\n".join(parts)
```

The context step builds the prefix once, then fits and anchors each turn, using the module's code for every part. `fold` is the one new step, and the next concept shows why it's needed:

```python
FOLD_INSTRUCTIONS = """Rewrite all the summaries above as one summary. Keep every fact, decision and exact value,
and every stored record they mention by name. Plain text, under 300 words."""

class ContextManager:
    """The one place in the loop that prepares each request: a fixed prefix, a fitted view, and an anchor at the end."""
    def __init__(self, llm, base: str, tools: list, window: int, max_tokens: int, memory, user_id: str, task: str, now: str,
                 block, notes, results, write_tools: list, guide_index: str = "", keep_last: int = 2, keep_recent: int = 2,
                 low_water: float = 0.6, fold_share: float = 0.3):
        self.llm, self.tools, self.notes, self.results, self.block = llm, tools, notes, results, block
        self.write_tools, self.keep_last, self.keep_recent, self.low_water = write_tools, keep_last, keep_recent, low_water
        # when the summaries in the first message take more than this share of the budget, they're folded into one
        self.fold_share = fold_share
        self.task = task
        # session start: everything in the prefix is decided here, once
        self.block_at_start = block.text
        instructions = [m for m in memory.search(user_id, kind="procedural", limit=100) if m.source == "user"]
        recalled = render_memories(instructions + recall_scored(memory, user_id, task, now))
        system = base
        if guide_index:
            system += "\n\n" + guide_index
        if block.text:
            system += "\n\n<memory_block>\n" + block.text + "\n</memory_block>"
        if recalled:
            system += "\n\n" + recalled
        self.system = system
        self.budget = window - count_tokens(system) - count_tokens(tools) - max_tokens
        self.view, self.seen = [], 0
        self.steps = []

    def build(self, history: list) -> dict:
        view = self.view + history[self.seen:]
        anchor = anchor_text(history, self.notes, self.block, self.block_at_start, self.write_tools)
        room = count_tokens(add_to_end(view, anchor)) - count_tokens(view) if anchor else 0
        budget = self.budget - room
        low_water = int(budget * self.low_water)
        step = next_step(view, budget, low_water, self.keep_last, self.keep_recent)
        if step != "send":
            view = clear_to_store(strip_old_thinking(view), self.keep_last, self.results)
        if step == "compact":
            request = summary_request(view, self.keep_recent)
            response = self.llm.create(messages=request, tools=self.tools, system=self.system)
            summary = "".join(b.text for b in response.content if b.type == "text")
            if summary:
                view = compact_with_archive(view, summary, self.keep_recent, self.results)
            else:
                step = "trim"
        if step == "compact" and self.fold_share is not None and count_tokens(view[0]) > self.fold_share * budget:
            view = self.fold(view)
        # whatever happened above, a request must fit: trimming whole rounds is the last resort
        if step == "trim" or count_tokens(view) > budget:
            view = trim_to_fit(view, low_water)
            step = "trim"
        self.view, self.seen = view, len(history)
        self.steps.append(step)
        messages = add_to_end(view, anchor) if anchor else list(view)
        return {"tools": self.tools, "system": self.system, "messages": messages}

    def fold(self, view: list) -> list:
        """Rewrite the pile of summaries as one. The old ones are stored first, so nothing is lost."""
        handle = self.results.put(view[0]["content"])
        request = [{"role": "user", "content": view[0]["content"] + "\n\n" + FOLD_INSTRUCTIONS}]
        response = self.llm.create(messages=request, tools=self.tools, system=self.system)
        summary = "".join(b.text for b in response.content if b.type == "text")
        if not summary:
            return view
        first = {"role": "user", "content": self.task + "\n\n<summary_of_earlier_work>\n" + summary +
                 f"\nThe earlier summaries are stored as {handle}.\n</summary_of_earlier_work>"}
        self.steps.append("fold")
        return [first] + view[1:]
```

## One session, end to end

Here's a session that exercises every part. The user sets a rule, the agent writes a plan and a note, pulls a large log (offloaded when it arrives), checks seven agents in detail, edits its memory block, and makes a change. The window is small enough that fitting has to happen:

```python
BASE = "You are the registry assistant. Follow your plan, the user's rules, and your notes."
TOOL_NAMES = ["get_logs", "get_status", "set_cache", "set_rule", "update_plan", "add_note", "read_notes", "read_result", "find_in_result",
              "block_append"]
TOOLS = [{"name": n, "description": n, "input_schema": {"type": "object", "properties": {}}} for n in TOOL_NAMES]
AGENTS = ["research_agent", "triage_agent", "search_agent", "report_agent", "auth_agent", "notify_agent", "billing_agent"]

class ScriptedAgent(FakeLLMClient):
    """Plays the agent's scripted steps, and answers any summary request with a scripted summary."""
    def create(self, messages, tools=None, system=""):
        last = messages[-1]["content"]
        if isinstance(last, list) and _plain(last[-1]).get("text") == SUMMARY_INSTRUCTIONS:
            return FakeResponse(content=[TextBlock(text="Rule and plan set; billing_agent's per-ticket lookup (p99 4.8s) is the likely cause; "
                                                        "several agents' logs looked normal.")])
        return super().create(messages)

def script():
    def think(text):
        return ThinkingBlock(thinking=text + " " + "Weighing what the evidence so far shows. " * 5)
    steps = [
        [think("Record the user's rule first."), ToolUseBlock(name="set_rule", input={"name": "restarts", "value": "never restart production agents"})],
        [think("Plan the work."), ToolUseBlock(name="update_plan", input={"plan": "[ ] find the cause\n[ ] fix it without restarts\n[ ] report"})],
        [think("Start with billing."), ToolUseBlock(name="get_status", input={"agent_name": "billing_agent"})],
        [think("That's the finding; keep it."), ToolUseBlock(name="add_note", input={"section": "facts", "text": "billing_agent /lookup p99 4.8s, once per ticket"})],
        [think("Pull the full support log."), ToolUseBlock(name="get_logs", input={"agent_name": "support_agent", "full": True})],
        [think("Look for errors in it."), ToolUseBlock(name="find_in_result", input={"handle": "res_1", "text": "ERROR"})],
    ]
    for agent in AGENTS:
        steps.append([think(f"Rule out {agent}."), ToolUseBlock(name="get_status", input={"agent_name": agent, "detail": True})])
    steps += [
        [think("Remember the owner across sessions."), ToolUseBlock(name="block_append", input={"line": "support_agent is owned by Tom."})],
        [think("Fix it without a restart."), ToolUseBlock(name="set_cache", input={"agent_name": "billing_agent", "ttl_seconds": 300})],
        [think("Check the notes before reporting."), ToolUseBlock(name="read_notes", input={})],
        [TextBlock(text="- Cause: billing_agent's per-ticket lookup (p99 4.8s)\n- Fix: 300s lookup cache, no restart")],
    ]
    return steps

def make_impls(notes, results, block):
    def get_logs(agent_name, full=False):
        lines = [f"{agent_name} INFO request handled in 412ms" for n in range(300)]
        lines[217] = f"{agent_name} ERROR upstream billing lookup timed out after 30s"
        return offload("\n".join(lines), results, threshold=400)
    def get_status(agent_name, detail=False):
        text = {"billing_agent": "billing_agent: p99 4.8s on /lookup, called once per ticket"}.get(agent_name, f"{agent_name}: healthy")
        return text + ("\n" + "metric: value, normal\n" * 40 if detail else "")
    return {"get_logs": get_logs, "get_status": get_status,
            "set_cache": lambda agent_name, ttl_seconds: f"{agent_name}: lookup cache on, ttl {ttl_seconds}s",
            "set_rule": lambda name, value: "rule saved", "update_plan": lambda plan: "plan saved",
            "add_note": lambda section, text: notes.add(section, text), "read_notes": lambda: notes.render(),
            "read_result": lambda handle, offset, limit: read_result(results, handle, offset, limit),
            "find_in_result": lambda handle, text: find_in_result(results, handle, text),
            "block_append": lambda line: block.append(line)}

def run(context, llm, task, impls, max_steps=30):
    history = [{"role": "user", "content": task}]
    sent = []
    for step in range(max_steps):
        request = context.build(history)
        sent.append(request)
        response = llm.create(messages=request["messages"], tools=request["tools"], system=request["system"])
        history.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text"), history, sent
        history.append({"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": c.id, "content": impls[c.name](**c.input)} for c in calls]})
    return "stopped", history, sent
```
*(defined once here and already loaded for this lesson's demos: the session's tools, its scripted steps, and the loop)*

```python
memory = ArchiveStore()
memory.save("u_simar", ArchivableMemory(content="Write summaries as bullet points.", type="procedural", source="user",
                                        created="2026-09-14T10:00:00", importance=9))
notes, results, block = Notes(), ResultStore(), CoreBlock("User: Simar, operations lead.")
TASK = "support_agent is slow. Find the cause and fix it."
llm = ScriptedAgent(script())
context = ContextManager(llm, BASE, TOOLS, window=3_500, max_tokens=1_000, memory=memory, user_id="u_simar", task=TASK,
                         now="2026-09-28T09:00:00", block=block, notes=notes, results=results, write_tools=["set_cache"])
answer, history, sent = run(context, llm, TASK, make_impls(notes, results, block))

print("turn  sent  step")
for turn in range(len(sent)):
    print(f"{turn + 1:>4} {count_tokens(sent[turn]['messages']):>5}  {context.steps[turn]}")
last = json.dumps(_plain(sent[-1]["messages"]))
print("\nanswer:", answer.split("\n")[0])
print("history:", count_tokens(history), "tokens; largest request's messages:", max(count_tokens(r["messages"]) for r in sent))
print("prefix unchanged all session:", all(r["system"] == sent[0]["system"] and r["tools"] is TOOLS for r in sent))
print("pairing intact every turn:", all(check_pairing(r["messages"]) == [] for r in sent))
print("in the last request: rule", "never restart production agents" in last, "| plan", "fix it without restarts" in last,
      "| change", "set_cache(agent_name=billing_agent" in last, "| notes index", "Your notes:" in last, "| block edit", "owned by Tom" in last)
print("early finding still in the last request:", "4.8s" in last)
print("results stored away:", len(results.items), "(the full log, cleared results, and the compacted rounds' record)")
```
```
turn  sent  step
   1    21  send
   2   188  send
   3   352  send
   4   494  send
   5   661  send
   6   943  send
   7  1091  send
   8  1461  send
   9  1829  send
  10   835  compact
  11  1203  send
  12  1570  send
  13  1938  send
  14  1234  clear
  15  1401  send
  16  1579  send
  17  1718  send

answer: - Cause: billing_agent's per-ticket lookup (p99 4.8s)
history: 4065 tokens; largest request's messages: 1938
prefix unchanged all session: True
pairing intact every turn: True
in the last request: rule True | plan True | change True | notes index True | block edit True
early finding still in the last request: True
results stored away: 13 (the full log, cleared results, and the compacted rounds' record)
```
*(runs live, shows output — read-only demo snippet, not graded; the agent's calls and the summary are scripted)*

- **Fitting happened only when it was needed,** and in order. Nine turns were sent as they were. Then, over budget and with clearing not enough, the view was compacted with an archive. Later, clearing alone was enough.
- **The prefix never changed,** and pairing held on every turn.
- **Everything that matters was in the last request:** the user's rule, the plan, the change to billing_agent, the notes index and the memory block's edit, all restated from the full history. The early finding, the 4.8-second lookup, was carried by the compaction summary.
- **Nothing was lost.** Thirteen items went to the store: the full log, the results that were cleared, and the record of the compacted rounds.

The next concept measures this against a loop without the context step. After the session, [Lesson 10's write path](→ this module, deciding what to remember lesson) and [Lesson 11's forgetting](→ this module, forgetting aging and retrieval quality lesson) run exactly as those lessons built them. The lesson's sandbox runs them too.

---

## Quiz cards

> **Q1.** What does the context step decide at session start, and never change afterwards?
> - A) The fitted view
> - B) The anchor
> - C) The tool list and the system prompt, including the guide index, the memory block as it stood, and the recalled memories ✅
> - D) The change ledger
>
> *Explanation:* Everything in the prefix is fixed for the session, so the cache is never broken. Anything newer goes at the end of each request.

> **Q2.** Why does `anchor_text` take the full history, when the request sends a fitted copy?
> - A) The copy may have been compacted, and the calls that set the plan and rules would be gone from it ✅
> - B) The full history is shorter
> - C) The anchor is saved into the history
> - D) The copy doesn't include tool results
>
> *Explanation:* That's Lesson 5's lesson. Code can derive the plan, rules and changes exactly, from the full history, which is never changed.

> **Q3.** In what order does the context step shrink an over-budget view?
> - A) Trim, then compact, then clear
> - B) Strip old reasoning and clear to the store; compact with an archive only if that isn't enough; trim as a last resort ✅
> - C) Compact first, since it saves the most
> - D) Clear only, never compact
>
> *Explanation:* Cheapest first, and nothing lost: cleared results and compacted rounds both go to the store.

> **Q4.** Why is room reserved in the budget for the anchor?
> - A) The anchor is sent first
> - B) The anchor is compressed
> - C) Anchors are billed separately
> - D) It's added to every request, so a view that just fits would go over once the anchor is added ✅
>
> *Explanation:* Lessons 5 and 6's sandboxes both found this. The budget for the view is what's left after the anchor.

> **Q5.** Where do edits the agent makes to its memory block go during a session?
> - A) Into the system prompt immediately
> - B) Into the history
> - C) At the end of each request; they join the prefix at the next session ✅
> - D) Nowhere until the next session
>
> *Explanation:* The agent sees every edit at once, and the prefix changes only between sessions. That was Lesson 9's design.

---

## Applied sandbox exercise

*(graded — the end-of-request anchor)*

**Task shown to learner:** The module's code is provided, including `latest_plan`, `current_rules_block`, `changes_ledger`, `Notes` and `CoreBlock`. Implement **`anchor_text(history, notes, block, block_at_start, write_tools)`**, which returns these parts, in this order, each only if it has something to say, joined by `"\n\n"`:

1. `"<current_plan>\n" + plan + "\n</current_plan>"`, from `latest_plan(history)`.
2. `current_rules_block(history)`.
3. `"<changes_made>\n"`, then `changes_ledger(history, write_tools)` joined by `"\n"`, then `"\n</changes_made>"`.
4. `notes.index_line()`.
5. If `block.text` differs from `block_at_start`: `"Your memory block has changed this session. It now reads:\n" + block.text`.

Return `""` if there's nothing to say.

**Provided code:** the module's code, as loaded in this lesson's setup.

**Starter code:**
```python
def anchor_text(history: list, notes, block, block_at_start: str, write_tools: list) -> str:
    # TODO: the plan, the rules, the change ledger, the notes index, and the block's new text if it changed,
    #       in that order, each only if there's something to say, joined by blank lines
    ...
```

**Hidden tests:**
```python
def call(tool, result, **arguments):
    block = ToolUseBlock(name=tool, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

history = [{"role": "user", "content": "Fix support_agent."}]
history += call("update_plan", "plan saved", plan="[ ] find the cause\n[ ] fix it")
history += call("set_rule", "rule saved", name="restarts", value="never in production")
history += call("get_status", "billing_agent: p99 4.8s", agent_name="billing_agent")
history += call("set_cache", "billing_agent: cache on", agent_name="billing_agent", ttl_seconds=300)

# 1. every part, in the fixed order: plan, rules, changes, notes index, block edits; separated by blank lines
notes = Notes()
notes.add("facts", "billing_agent is slow")
block = CoreBlock("User: Simar.")
start = block.text
block.append("Owns: support_agent.")
text = anchor_text(history, notes, block, start, ["set_cache"])
assert text == ("<current_plan>\n[ ] find the cause\n[ ] fix it\n</current_plan>\n\n"
                "<current_rules>\n- restarts: never in production\n</current_rules>\n\n"
                "<changes_made>\n- set_cache(agent_name=billing_agent, ttl_seconds=300) -> billing_agent: cache on\n</changes_made>\n\n"
                "Your notes: 1 facts, 0 decisions, 0 open items. Read them with read_notes().\n\n"
                "Your memory block has changed this session. It now reads:\nUser: Simar.\nOwns: support_agent.")

# 2. parts with nothing to say are left out; an unchanged block says nothing
assert anchor_text(history[:1], Notes(), CoreBlock("User: Simar."), "User: Simar.", ["set_cache"]) == ""
only_rules = anchor_text(history[:1] + history[3:5], Notes(), block, block.text, ["set_cache"])
assert only_rules == "<current_rules>\n- restarts: never in production\n</current_rules>"

# 3. only calls to write tools are listed as changes
assert "get_status" not in anchor_text(history, Notes(), block, block.text, ["set_cache"])
assert "<changes_made>" not in anchor_text(history, Notes(), block, block.text, [])

# 4. it reads from the history it's given: a compacted copy without the plan and rule calls would lose them,
#    which is why the context step always passes the full history
compacted = compact(history, "Plan and rule set; billing is slow.", keep_recent=1)
assert "<current_plan>" not in anchor_text(compacted, Notes(), block, block.text, ["set_cache"])
assert "<current_plan>" in anchor_text(history, Notes(), block, block.text, ["set_cache"])
```

**Hint (shown on request):** Collect the parts in a list, appending each one only when it's non-empty, then `"\n\n".join(parts)`. An empty list joins to `""`, so that case takes care of itself.

**Reference solution:**
```python
def anchor_text(history: list, notes, block, block_at_start: str, write_tools: list) -> str:
    """Everything restated at the end of each request, read from the full history, in a fixed order."""
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
    index = notes.index_line()
    if index:
        parts.append(index)
    if block.text != block_at_start:
        parts.append("Your memory block has changed this session. It now reads:\n" + block.text)
    return "\n\n".join(parts)
```

**Explanation:** Test 1 pins the order and the format, since the anchor is restated every turn and a stable order keeps it easy for the model to read. Test 2 checks that empty parts are left out, including an unchanged block. Test 3 checks that only calls to write tools become changes. Test 4 is the integration rule itself: fed a compacted copy, the anchor loses the plan, which is why the context step always passes it the full history.

---

*(End of Concept 1.)*
