# Compaction and Summarization

> **Note for the site build:** the comprehensive sandbox is multi-file, in the same shape as Lesson 4's. The tests import `fake` and `tokens` as site-provided modules: `tokens` exports `count_tokens` and `_plain`, and `fake` exports `FakeResponse`, `FakeLLMClient`, `ToolUseBlock`, `TextBlock`, `ThinkingBlock`, `WindowedClient` and `ContextWindowExceeded`, as in Lesson 4. `lib.py` is read-only and shown in full below. It collects everything the sandbox uses from Lessons 2–5, with Lesson 4's corrected helpers and Concept 2's updated `SUMMARY_INSTRUCTIONS`, plus Lesson 4's reference `FittingContext` for the before/after test. `agent.py` is the entry file.

## Intro

> **You'll be able to**
> - Explain what compaction is for, and why it comes after clearing, not before
> - Compact a history safely: summarize whole rounds, keep the task and the round in progress, and ask for the summary in a way that reuses the cache
> - Keep what matters out of the summary's hands, by restating the rules, the plan and every change from the full history
> - Decide when to compact by measuring tokens, and say what compaction costs and loses

**Why it matters**

[Lesson 4](→ this module, when the history wont fit lesson) made long runs fit, but at the end of its order it drops whole rounds, and what they established goes with them. Compaction replaces those rounds with a summary, so a finding from early in a run can still shape its end.

A summary is also the least reliable thing in an agent's context: a model's paraphrase, written once and trusted afterwards. The evidence says to use it sparingly, and after cheaper stages that lose nothing. This lesson builds compaction with that in view: when to do it, how to do it without breaking the history or the cache, and how to keep the facts that matter from depending on it at all.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** Clearing old tool results cut a 200-round history's growth from about 710 tokens a round to about 100. What problem does that leave?
> - A) The history still grows every round, so a long enough run fills any window ✅
> - B) Cleared results are restored when the window fills
> - C) Clearing makes the history grow faster after 100 rounds
> - D) The calls are removed, so pairing breaks
>
> *Explanation:* Each round still leaves its call, its placeholder and any text behind. Clearing slows growth; compaction is what bounds it.

> **Q2.** In the JetBrains comparison on coding agents, how did clearing old tool outputs compare with summarizing?
> - A) Summarizing solved far more tasks, at a higher cost
> - B) Clearing solved fewer tasks, but cost half as much
> - C) Clearing matched summarizing's success rate at similar or lower cost; the best result cleared first and summarized only as a last resort ✅
> - D) The two performed identically on every measure
>
> *Explanation:* Summaries cost extra calls, and summarizing agents ran 13–15% longer. The study covers coding agents with long tool outputs, which the authors note as a limit.

> **Q3.** Where does compaction put the summary, and why there?
> - A) In a new user message at the end, where the model reads it last
> - B) In the system prompt, so it's cached
> - C) In the first message, right after the task, so the task stays word for word and user and assistant messages still alternate ✅
> - D) In a new assistant message after the task
>
> *Explanation:* The kept rounds start with an assistant message. A summary in its own user message would put two user messages in a row.

> **Q4.** After compaction, why did Lesson 2's `assemble_context` stop restating the user's rule?
> - A) Rules expire after compaction
> - B) It reads rules from the messages it's given, and the `set_rule` call had been summarized away ✅
> - C) The summary replaced the rule with a newer one
> - D) Rules are only restated when the plan changes
>
> *Explanation:* The fix is to read rules, the plan and the change ledger from the full history, which compaction never touches.

> **Q5.** A code check confirms every required name appears in a summary. What can it not confirm?
> - A) That the summary is plain text
> - B) That the summary is under the length limit
> - C) That the summary is in English
> - D) That the summary says the right thing about those names ✅
>
> *Explanation:* A name can appear while the summary is restating the task. Word checks catch cheap failures, not wrong content.

> **Q6.** Why does `compact` append a new summary after the old one, instead of folding both into one rewritten summary?
> - A) Folding rewrites everything summarized so far each time, and each rewrite is another chance to lose an older fact ✅
> - B) Appending keeps the history shorter
> - C) Folding breaks tool pairing
> - D) The API rejects rewritten summaries
>
> *Explanation:* Appending summarizes only the new rounds and leaves earlier summaries alone. The cost is a first message that grows by one summary per compaction.

> **Q7.** Why is "compact every 30 turns" the wrong trigger?
> - A) Turns can't be counted inside the loop
> - B) Compaction must happen on a token boundary
> - C) A turn can add 50 tokens or 5,000, so a fixed count compacts too early on small turns and too late on large ones ✅
> - D) The provider compacts every 30 turns anyway
>
> *Explanation:* Compaction manages the request's size, so it should be triggered by that size, at a capacity limit or a lower quality limit.

> **Q8.** Asking for the summary as a separate call, with its own system prompt and no tools, cost about 45% more in the demo. Why?
> - A) The separate call wrote a longer summary
> - B) Its prefix differed from the start, so nothing the agent's requests had cached could be reused ✅
> - C) Separate calls are billed at output rates
> - D) The separate call had to include the whole history twice
>
> *Explanation:* The in-conversation request is the agent's own prefix with instructions added at the end, so most of it is read from the cache.

---

### Comprehensive sandbox

*(applied, multi-file — a context step that compacts)*

**Task shown to learner:** The registry agent investigates the slow support queue again, over a run long enough to need more than clearing. Early on it finds the cause: `billing_agent`'s 4.8-second lookup. Then it records a user rule, rules out a dozen agents, and applies a fix. With Lesson 4's `FittingContext`, the run fits the window, but by the end the finding has been dropped. `lib.py`, which is read-only, has everything from this lesson and the ones before. Complete `agent.py`:

- **`CompactingContext(llm, tools, system, window, max_tokens, keep_last, keep_recent, write_tools, low_water=0.6)`** with `build(history)`:
  - Compute the budget for messages once, as in Lesson 4: the window minus the tokens in the system prompt, the tools and `max_tokens`.
  - **Take in what's new.** Keep the view last sent and how much of the history it has taken in, and append the history's new messages to that view.
  - **Reserve room for the anchor.** Measure how many tokens `anchor_from_history(history, view, write_tools)` adds to the view, and subtract it from the budget for this turn. The low-water target is that reduced budget times `low_water`, as an integer.
  - **Ask `next_step` what to do,** and act on it:
    - For anything but `"send"`, strip old reasoning and clear old results first.
    - For `"compact"`, build a `summary_request`, record it in `self.summary_requests`, and send it with `self.llm.create(messages=..., tools=self.tools, system=self.system)`. If the reply has text, compact with it. If it doesn't, trim instead.
    - For `"trim"`, use `trim_to_fit` down to the low-water target.
  - **Save the fitted view without the anchor.** Return `{"tools": ..., "system": ..., "messages": ...}`, with the anchor added from the full history.
  - Never change the history.
- **`run_agent(llm, user_message, context, tool_impls, max_steps=40)`:** the same loop as Lesson 4's sandbox.

**Tab: `lib.py`** (read-only)
```python
# everything from Lessons 2-5 that this sandbox uses -- read-only
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
```

**Tab: `agent.py`** (starter, entry file)
```python
from tokens import count_tokens
from lib import (next_step, strip_old_thinking, clear_old_results, summary_request, compact,
                 trim_to_fit, anchor_from_history)

class CompactingContext:
    def __init__(self, llm, tools: list, system: str, window: int, max_tokens: int,
                 keep_last: int, keep_recent: int, write_tools: list, low_water: float = 0.6):
        # TODO: keep the settings, work out the message budget, start with an empty view,
        #       and keep a list of the summary requests sent
        ...

    def build(self, history: list) -> dict:
        # TODO: 1) append what's new to the last view
        #       2) reserve room for the anchor, then ask next_step what to do
        #       3) clear, compact (asking self.llm for the summary) or trim, as needed
        #       4) save the view, and return the request with the anchor added
        ...

def run_agent(llm, user_message, context, tool_impls, max_steps=40):
    # TODO: the collect-every-call loop from Lesson 4's sandbox
    ...
```

**Hidden tests:**
```python
from fake import *
from tokens import count_tokens, _plain
from lib import (SUMMARY_INSTRUCTIONS, check_pairing, check_open_round, first_divergence, FittingContext,
                 anchor_from_history)
from agent import CompactingContext, run_agent
import json

TOOLS = [{"name": n, "description": f"{n} tool", "input_schema": {"type": "object", "properties": {}}}
         for n in ["get_metrics", "get_logs", "set_rule", "set_lookup_cache"]]
SYSTEM = "You are the registry assistant. Find out why the support queue is slow, fix it, and report."
WRITES = ["set_lookup_cache"]
AGENTS = ["research_agent", "triage_agent", "search_agent", "report_agent", "auth_agent", "notify_agent"]

def impls():
    return {
        "get_metrics": lambda agent_name: {"support_agent": "support_agent: p99 0.9s, queue depth 340",
                                           "billing_agent": "billing_agent: p99 4.8s on /lookup, called once per ticket"}.get(agent_name, f"{agent_name}: normal"),
        "get_logs": lambda agent_name: f"{agent_name} logs\n" + f"{agent_name} INFO request handled in 412ms status=200\n" * 45,
        "set_rule": lambda name, value: "rule saved",
        "set_lookup_cache": lambda agent_name, ttl_seconds: f"{agent_name}: lookup cache on, ttl {ttl_seconds}s",
    }

def script():
    def think(text):
        return ThinkingBlock(thinking=text + " " + "Weighing what the evidence so far shows. " * 6)
    steps = [
        [think("Start with the agent at the head of the queue."), ToolUseBlock(name="get_metrics", input={"agent_name": "support_agent"})],
        [think("support_agent is fine; check what it calls per ticket."), ToolUseBlock(name="get_metrics", input={"agent_name": "billing_agent"})],
        [think("The user said to avoid restarts; record it."), ToolUseBlock(name="set_rule", input={"name": "restarts", "value": "never restart production agents"})],
    ]
    for agent in AGENTS + AGENTS:
        steps.append([think(f"Rule out {agent}."), ToolUseBlock(name="get_logs", input={"agent_name": agent})])
    steps.append([think("Cache the billing lookups; no restart needed."),
                  ToolUseBlock(name="set_lookup_cache", input={"agent_name": "billing_agent", "ttl_seconds": 300})])
    steps.append([TextBlock(text="Cause: billing_agent's /lookup (p99 4.8s, once per ticket). Fixed with a 300s lookup cache.")])
    return steps

SUMMARY = ("Task: find why the support queue is slow, fix it, report. Established: support_agent p99 0.9s; "
           "billing_agent /lookup p99 4.8s, called once per ticket, the likely cause. "
           "Ruled out several agents from their logs. Next: rule out the rest, then fix billing lookups.")

class ScriptedAgent(WindowedClient):
    """Plays the agent's scripted steps, and answers any summary request with a scripted summary."""
    def __init__(self, steps, window, summary=SUMMARY):
        super().__init__(steps, window=window)
        self.summary = summary
        self.summaries_written = 0
    def create(self, messages, tools=None, system=""):
        last = messages[-1]["content"]
        if isinstance(last, list) and _plain(last[-1]).get("text") == SUMMARY_INSTRUCTIONS:
            self.summaries_written += 1
            self.summary_prefix = (tools, system)
            if self.summary is None:
                return FakeResponse(content=[ToolUseBlock(name="get_logs", input={"agent_name": "billing_agent"})])
            return FakeResponse(content=[TextBlock(text=self.summary)])
        return super().create(messages, tools=tools, system=system)

class Watch:
    def __init__(self, inner):
        self.inner = inner
        self.lengths = []
    def build(self, history):
        self.lengths.append(len(history))
        return self.inner.build(history)

WINDOW, MAX_TOKENS = 5_000, 1_000
TASK = "Find out why the support queue is slow, then fix it."
text = lambda r: json.dumps(_plain(r["messages"]))

# 1. before: last lesson's context step keeps the run inside the window, but by the end the finding is gone
_, _, before = run_agent(ScriptedAgent(script(), WINDOW), TASK,
                         FittingContext(TOOLS, SYSTEM, WINDOW, MAX_TOKENS, keep_last=2), impls())
assert "4.8s" not in text(before[-1])

# ... after: with compaction, the run completes and the finding is still in the final request
llm = ScriptedAgent(script(), WINDOW)
context = CompactingContext(llm, TOOLS, SYSTEM, WINDOW, MAX_TOKENS, keep_last=2, keep_recent=2, write_tools=WRITES)
watch = Watch(context)
answer, history, sent = run_agent(llm, TASK, watch, impls())
assert answer.startswith("Cause: billing_agent")
assert "4.8s" in text(sent[-1])

# 2. every request, anchor included, leaves room for the reply, and carries exactly one anchor
for r in sent:
    assert count_tokens(r["messages"]) <= context.budget
    assert text(r).count("<current_rules>") <= 1 and text(r).count("<changes_made>") <= 1
    assert count_tokens(r["system"]) + count_tokens(r["tools"]) + count_tokens(r["messages"]) + MAX_TOKENS <= WINDOW
    assert r["tools"] is TOOLS and r["system"] is SYSTEM

# 3. every request is valid: the task first, calls paired, the step in progress sent back as returned
for n, r in zip(watch.lengths, sent):
    assert r["messages"][0]["content"].startswith(TASK)
    assert check_pairing(r["messages"]) == []
    assert check_open_round(history[:n], r["messages"]) == []

# 4. the rule and the change are restated from the full history, including after compaction
rule_from = next(i for i, n in enumerate(watch.lengths) if n > 6)
assert all("never restart production agents" in text(r) for r in sent[rule_from:])
assert "set_lookup_cache(agent_name=billing_agent, ttl_seconds=300)" in text(sent[-1])

# 5. clearing came first, and compaction happened, through the agent's own client, but rarely
first_summary = next(i for i, r in enumerate(sent) if "<summary_of_earlier_work>" in text(r))
assert any("[cleared" in text(r) for r in sent[:first_summary])
assert 1 <= len(context.summary_requests) <= 3 and llm.summaries_written == len(context.summary_requests)

# 6. each summary request carries the agent's own tools and system prompt, and ends with the instructions
assert llm.summary_prefix[0] is TOOLS and llm.summary_prefix[1] is SYSTEM
for req in context.summary_requests:
    assert req[0]["content"].startswith(TASK)
    assert req[-1]["content"][-1] == {"type": "text", "text": SUMMARY_INSTRUCTIONS}
    assert check_pairing(req) == []

# 7. edits to the history are rare: on most turns only the previous request's last message (its anchor) changes
edits = 0
for previous, current in zip(sent, sent[1:]):
    at = first_divergence(previous, current)["diverges_at"]
    if at is not None and int(at[len("messages["):-1]) < len(previous["messages"]) - 1:
        edits += 1
assert 1 <= edits <= 4, edits

# 8. the history keeps everything: no cleared result, and every step's reasoning
assert "[cleared" not in json.dumps(_plain(history))
assert all(_plain(m["content"][0])["type"] == "thinking" for m in history[:-1] if m["role"] == "assistant")

# 9. a summary request that comes back without text falls back to trimming, and the run still completes
bad = ScriptedAgent(script(), WINDOW, summary=None)
answer, _, bad_sent = run_agent(bad, TASK, CompactingContext(bad, TOOLS, SYSTEM, WINDOW, MAX_TOKENS, 2, 2, WRITES), impls())
assert answer.startswith("Cause:") and bad.summaries_written >= 1
assert all(check_pairing(r["messages"]) == [] and "<summary_of_earlier_work>" not in text(r) for r in bad_sent)
assert all(count_tokens(r["system"]) + count_tokens(r["tools"]) + count_tokens(r["messages"]) + MAX_TOKENS <= WINDOW for r in bad_sent)
# 10. the anchor's size is reserved: a history that fits on its own, but not with its anchor, gets fitted
def answered(name, arguments, result):
    call = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": result}]}]
tight = ([{"role": "user", "content": TASK}]
         + answered("set_rule", {"name": "restarts", "value": "never restart production agents"}, "rule saved")
         + answered("get_logs", {"agent_name": "a"}, "x" * 2_000)
         + answered("get_logs", {"agent_name": "b"}, "y" * 2_000))
plain = count_tokens(tight)
anchor = count_tokens(anchor_from_history(tight, tight, WRITES)) - plain
window = plain + anchor // 2 + count_tokens(SYSTEM) + count_tokens(TOOLS) + MAX_TOKENS
tight_context = CompactingContext(ScriptedAgent([], window), TOOLS, SYSTEM, window, MAX_TOKENS, 1, 1, WRITES)
assert count_tokens(tight_context.build(tight)["messages"]) <= tight_context.budget
```

**Hint (shown on request):** `build` follows the shape of [Lesson 4's `FittingContext`](→ this module, when the history wont fit lesson), with [`next_step`](→ this lesson, when to compact and what it costs concept) deciding what happens and [`Compactor`](→ this lesson, when to compact and what it costs concept, the order in one place) as a model for the compaction branch. Two things are easy to get wrong. The anchor goes on the request you return, never on `self.view`, or old anchors pile up in the saved view. And the summary request goes through the agent's own client, tools and system prompt, so it reuses the agent's cached prefix.

**Reference solution — `agent.py`:**
```python
from tokens import count_tokens
from lib import (next_step, strip_old_thinking, clear_old_results, summary_request, compact,
                 trim_to_fit, anchor_from_history)

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

- **Before and after:** Lesson 4's fitter completes the run without the finding. This context step completes it with the finding still in the final request, carried by the summary (test 1). The summary here is scripted, so the test checks where it goes, not how well it's written.
- **Every request fits and is valid:** reply room is left, the anchor is counted, only one anchor is carried, the task comes first, calls are paired, and the step in progress goes back as returned (tests 2, 3 and 10).
- **The rule survives compaction without the summary's help:** the scripted summary leaves the rule out, as a real one might, and the rule is still in every request, because it's read from the full history (test 4).
- **The order holds:** clearing happens before the first compaction, and compaction happens rarely, through the agent's own client (tests 5 and 6).
- **Edits stay rare:** on most turns, only the previous request's last message, the one that carried the anchor, differs (test 7).
- **The loop's history is untouched** (test 8).
- **A summary call that returns no text** falls back to trimming, and the run still completes (test 9).

This context step and Lesson 3's `CacheAwareContext` are two halves of the same job. [Lesson 12](→ this module, putting it together a context managed agent lesson) combines them.
