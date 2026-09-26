# Module 4, Lesson 5 — Concept 3: When a summary loses something

> **Note for the site build:** this concept's demos need Lesson 2's `rule_history`, `current_rules_block`, `latest_plan` and `assemble_context`, exactly as Lesson 2 defines them, plus `SUMMARY_INSTRUCTIONS`, `summary_request` and `compact` from Concept 2. The shared scenario (the first code block) is defined once and loaded for every demo in this concept. Add `changes_ledger` and `anchor_from_history` to this lesson's setup from here on. Concept 2's `SUMMARY_INSTRUCTIONS` gained one line while this concept was written (about not repeating an earlier summary); use the updated text.

---

## A summary is model output

[The previous concept](→ this lesson, compacting a summary in rounds out concept) asked for a summary with careful instructions, and the scripted reply followed them. A real reply might not. A summary is written by the model, and it can leave out exactly the thing that mattered, with no error anywhere to say so.

Here's a rollout the registry agent is part way through. Partway in, the user adds a constraint, which the agent records with [Lesson 2's `set_rule`](→ this module, context that fits but still hurts lesson, instructions that pile up and contradict concept). Then it moves `support_agent` too:

```python
WRITE_TOOLS = ["set_agent_model", "restart_agent"]

def call(tool, result, **arguments):
    block = ToolUseBlock(name=tool, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

def status(agent, text):
    return call("get_status", f"{agent}: {text}. " + "p50 410ms p99 1.2s errors 0.1% " * 8, agent_name=agent)

history = [{"role": "user", "content": "Move research_agent and support_agent to claude-sonnet, one at a time, and watch for trouble."}]
history += status("research_agent", "healthy on claude-haiku")
history += call("set_agent_model", "research_agent now runs on claude-sonnet", agent_name="research_agent", model="claude-sonnet")
history += [{"role": "assistant", "content": [TextBlock(text="research_agent is on claude-sonnet. Watching it before moving support_agent.")]},
            {"role": "user", "content": "Also: don't restart anything in production today."}]
history += call("set_rule", "rule saved", name="restarts", value="never restart production agents today")
history += status("research_agent", "healthy on claude-sonnet")
history += call("set_agent_model", "support_agent now runs on claude-sonnet", agent_name="support_agent", model="claude-sonnet")
history += status("support_agent", "error rate rising on claude-sonnet")
history += status("support_agent", "DEGRADED, errors 9% on claude-sonnet")
```
*(defined once here and already loaded for every demo in this concept)*

Now a summary that reads well but covers only part of the run:

```python
# a plausible summary, written the way a model might: it covers the rollout, but not everything
summary = ("Task: move research_agent and support_agent to claude-sonnet one at a time and watch them. "
           "research_agent was moved to claude-sonnet and stayed healthy. Next: finish the rollout.")

compacted = compact(history, summary, keep_recent=2)
sent = assemble_context(compacted)
print(f"compacted: {len(history)} -> {len(compacted)} messages")
print("is the restart rule in what's sent?     ", "never restart production" in json.dumps(_plain(sent)))
print("does it say support_agent was switched? ", "support_agent now runs" in json.dumps(_plain(sent)))
```
```
compacted: 17 -> 5 messages
is the restart rule in what's sent?      False
does it say support_agent was switched?  False
```
*(runs live, shows output — read-only demo snippet, not graded; the summary is scripted to show a plausible omission)*

Two things are gone from what the model will see next:

- **The user's constraint.** It was in a `set_rule` call, and that round was summarized away. [`assemble_context`](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept) restates rules and the plan, but it reads them from the messages it's given, so after compaction it finds nothing to restate.
- **A change the agent made.** `support_agent` was moved to `claude-sonnet`. The kept rounds show it degrading, but nothing says the agent caused that, or what model it was on before.

## Don't make the summary carry what code can derive

Some of what a summary has to carry, code can work out exactly from the full history:

- **the current rules**, from the `set_rule` calls
- **the current plan**, from the latest `update_plan` call
- **every change the agent made**, from its calls to tools that write, and their results

The loop always has the full history. Only the prepared copy it sends is compacted. So these three can be computed from the full history on every turn and restated at the end of the request, the way Lesson 2's anchoring already works. The only change is where they're read from. The summary is then left with what code can't derive: conclusions, reasons, and what was learned.

The changes are the new part: a short ledger of every call to a write tool, with its result. [Module 3](→ Module 3, designing for least privilege lesson, separate reads from writes and gate the writes concept) already separated reads from writes, so the list of write tools is one the agent's designer has.

```python
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
```

```python
summary = ("Task: move research_agent and support_agent to claude-sonnet one at a time and watch them. "
           "research_agent was moved to claude-sonnet and stayed healthy. Next: finish the rollout.")
compacted = compact(history, summary, keep_recent=2)

# the rules and every change, read from the full history -- which compaction never touches
print("\n".join(changes_ledger(history, WRITE_TOOLS)))
sent = anchor_from_history(history, compacted, WRITE_TOOLS)
text = json.dumps(_plain(sent))
print("\nrestart rule in what's sent:        ", "never restart production" in text)
print("support_agent's switch in what's sent:", "set_agent_model(agent_name=support_agent" in text)
print("pairing problems:", check_pairing(sent))

# a word check on the summary alone passes, even though the summary never says support_agent was moved
print("\nnames missing from the summary:", [n for n in ["research_agent", "support_agent", "claude-sonnet"] if n not in summary])
```
```
- set_agent_model(agent_name=research_agent, model=claude-sonnet) -> research_agent now runs on claude-sonnet
- set_agent_model(agent_name=support_agent, model=claude-sonnet) -> support_agent now runs on claude-sonnet

restart rule in what's sent:         True
support_agent's switch in what's sent: True
pairing problems: []

names missing from the summary: []
```
*(runs live, shows output — read-only demo snippet, not graded; the summary is the same scripted one as before)*

With the summary unchanged, the rule and both switches are back in front of the model, because neither ever depended on it. The ledger grows only with writes, which are rare next to reads, and it lives in the last message only, never saved, so [its cache cost](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept, re-anchoring nearly free) is the same one message per turn as the rest of the anchor.

## A word check can't read

The last line of that demo is a warning. It's tempting to check a summary in code: list the names and values it must mention, and reject it if any are missing. Here every name is present, yet the summary never says `support_agent` was moved. It mentions it only while restating the task.

A check that looks for words can confirm that something was mentioned, not that the summary says the right thing about it. It's still worth running for the cheap failures, like an empty reply, one cut off at the length limit, or one missing a value that appears nowhere else. But it can't make a summary trustworthy. What makes the agent robust is not depending on the summary for anything code can derive.

## Summaries of summaries

A long run compacts more than once, and there are two ways to handle the earlier summary:

- **Fold it.** Write one new summary from the old summary plus the new rounds, and replace the old one. The total stays bounded, but every compaction rewrites everything summarized so far, so each one is another chance to drop something that an earlier summary kept.
- **Append.** Summarize only the rounds since the last compaction, and add the new summary after the old one, which is never rewritten. `compact` from the previous concept already does this: the first message keeps whatever it held, and the new summary goes after it. Its instructions ask the model not to repeat an earlier summary.

```python
summary_1 = ("research_agent: moved from claude-haiku to claude-sonnet, healthy. "
             "support_agent: moved to claude-sonnet, error rate rising at the last check.")
view = compact(history, summary_1, keep_recent=2)

# more work after the first compaction: support_agent is rolled back
view += call("set_agent_model", "support_agent now runs on claude-haiku", agent_name="support_agent", model="claude-haiku")
view += status("support_agent", "recovered on claude-haiku")
view += status("research_agent", "healthy on claude-sonnet")
summary_2 = "support_agent degraded to 9% errors on claude-sonnet and was rolled back to claude-haiku; it recovered."

# appending: the second summary goes after the first, which is never rewritten
appended = compact(view, summary_2, keep_recent=1)
print(appended[0]["content"])

# folding: one summary, rewritten from the old one plus the new rounds (scripted, and it lost a line)
folded = "support_agent was rolled back to claude-haiku after degrading on claude-sonnet, and recovered."
print("\nresearch_agent's move, appended:", "research_agent: moved" in appended[0]["content"])
print("research_agent's move, folded:  ", "research_agent" in folded)
```
```
Move research_agent and support_agent to claude-sonnet, one at a time, and watch for trouble.

<summary_of_earlier_work>
research_agent: moved from claude-haiku to claude-sonnet, healthy. support_agent: moved to claude-sonnet, error rate rising at the last check.
</summary_of_earlier_work>

<summary_of_earlier_work>
support_agent degraded to 9% errors on claude-sonnet and was rolled back to claude-haiku; it recovered.
</summary_of_earlier_work>

research_agent's move, appended: True
research_agent's move, folded:   False
```
*(runs live, shows output — read-only demo snippet, not graded; both summaries and the folded rewrite are scripted, the fold written to show a plausible loss)*

The appended history still says `research_agent` was moved and was healthy. The fold kept the most recent news and lost the older fact. That's drift: nothing any single summary did was unreasonable, but each rewrite was another lossy pass over what came before.

How much this happens with real models isn't well measured yet: a 2026 paper on memory compaction, ["What to Keep, What to Forget"](https://arxiv.org/abs/2607.08032), describes compounding loss under repeated summarization as the least-measured failure in this area. The mechanism is clear enough to design against, and appending does. The cost is that the first message grows by one summary per compaction. Compactions are rare, so that's slow. If it ever grows too large, rewriting the old summaries becomes a deliberate step of its own, with the ledger, rules and plan still read from the full history underneath it.

What neither a summary nor a ledger can hold is detail too large or too specific to restate every turn. That goes somewhere the agent can read back from, which is [Lesson 6](→ this module, offloading context to storage and note taking lesson).

---

## Quiz cards

> **Q1.** After compaction, why did `assemble_context` stop restating the user's restart rule?
> - A) The rule expired after the first compaction
> - B) It reads rules from the messages it's given, and the round with the `set_rule` call was summarized away ✅
> - C) Rules can only be restated once
> - D) The summary overwrote the rule with a newer value
>
> *Explanation:* Nothing was wrong with the rule. The function looked in the compacted copy, where the call no longer exists. Reading from the full history fixes that.

> **Q2.** Why read the rules, the plan and the change ledger from the full history instead of trusting the summary to carry them?
> - A) The full history is shorter than the summary
> - B) Summaries can't include lists
> - C) Code can derive them exactly from the history, which compaction never changes, so they can't be lost by a summary ✅
> - D) The API requires rules to come from `set_rule` calls
>
> *Explanation:* The loop keeps everything; only the copy it sends is compacted. Anything computable from the full history should be computed, not paraphrased.

> **Q3.** A code check confirmed that every required name appeared in the summary, yet the summary never said `support_agent` was moved. What does that show?
> - A) The check had a bug in its string matching
> - B) The summary was too long to check
> - C) The names should have been checked in lowercase
> - D) A word check confirms that something is mentioned, not that the summary says the right thing about it ✅
>
> *Explanation:* `support_agent` appeared while restating the task. Checks like this still catch cheap failures, but they can't make a summary correct.

> **Q4.** What is the difference between folding and appending summaries across repeated compactions?
> - A) Folding rewrites everything summarized so far each time, which risks losing older facts; appending leaves earlier summaries untouched ✅
> - B) Folding keeps every summary; appending keeps only the latest
> - C) Appending needs no model call
> - D) Folding keeps the cache valid; appending breaks it
>
> *Explanation:* Each fold is another lossy pass over older content. Appending summarizes only new rounds, at the cost of a first message that grows by one summary per compaction.

> **Q5.** Why does the ledger's cost to the cache stay small, even though it's restated on every turn?
> - A) Ledgers are never sent to the model
> - B) It's added to the last message only and never saved into the history, so it changes one message per turn ✅
> - C) The ledger is compressed before sending
> - D) The cache ignores text added to a results message
>
> *Explanation:* It's the same design as Lesson 2's anchor: restated at the end, never stored. The previous request's last message is resent without it, which is the one-message miss Lesson 3 measured.

---

## Applied sandbox exercise

*(graded — restating what code can derive)*

**Task shown to learner:** `latest_plan`, `current_rules_block`, `add_to_end`, `is_tool_results`, `compact` and `check_pairing` are provided. Implement:

- **`changes_ledger(messages, write_tools)`:** one line per call to a tool in `write_tools` that has a result, in the order the calls were made.
  - Each line is `"- NAME(KEY=VALUE, KEY=VALUE) -> RESULT"`, with the call's arguments in their order and the first line of its result's content.
  - If the result has `"is_error": True`, the result part starts with `"FAILED: "`.
  - Calls to other tools, and write calls with no result, are left out.
- **`anchor_from_history(history, messages, write_tools)`:** return `messages` with the following added at the end with `add_to_end`, as one text block, lines joined by `"\n"`:
  - `"<current_plan>\n" + plan + "\n</current_plan>"`, if `latest_plan(history)` isn't empty
  - `current_rules_block(history)`, if it isn't empty
  - `"<changes_made>\n"` + the ledger lines joined by `"\n"` + `"\n</changes_made>"`, if there are any
  - Everything is read from `history`, not from `messages`. If there's nothing to add, return `messages` unchanged.

**Provided code:** `latest_plan` and `current_rules_block` from Lesson 2, `add_to_end` from Lesson 3, `is_tool_results` and `check_pairing` from Lesson 4, `compact` from the previous concept, and the fake client's `_plain` and `ToolUseBlock`.

**Starter code:**
```python
def changes_ledger(messages: list, write_tools: list) -> list:
    # TODO: map each tool_use id to its result, then one line per answered call to a write tool
    ...

def anchor_from_history(history: list, messages: list, write_tools: list) -> list:
    # TODO: plan, rules and changes, all read from `history`, added to the end of `messages`
    ...
```

**Hidden tests:**
```python
def step(blocks_and_results):
    calls, results = [], []
    for name, arguments, content, failed in blocks_and_results:
        block = ToolUseBlock(name=name, input=arguments)
        calls.append(block)
        result = {"type": "tool_result", "tool_use_id": block.id, "content": content}
        if failed:
            result["is_error"] = True
        results.append(result)
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}]

WRITES = ["set_agent_model", "restart_agent"]
task = {"role": "user", "content": "Roll out claude-sonnet."}
history = ([task]
           + step([("update_plan", {"plan": "[ ] research\n[ ] support"}, "plan saved", False)])
           + step([("get_status", {"agent_name": "research_agent"}, "healthy", False)])
           + step([("set_agent_model", {"agent_name": "research_agent", "model": "claude-sonnet"}, "research_agent now on claude-sonnet\nold model: claude-haiku", False)])
           + step([("set_rule", {"name": "restarts", "value": "never in production"}, "rule saved", False)])
           + step([("restart_agent", {"agent_name": "support_agent"}, "Error: permission denied", True),
                   ("set_agent_model", {"agent_name": "support_agent", "model": "claude-sonnet"}, "support_agent now on claude-sonnet", False)])
           + step([("get_status", {"agent_name": "support_agent"}, "degraded", False)]))
snapshot = [len(m["content"]) if isinstance(m["content"], list) else m["content"] for m in history]

# 1. one line per write call, in order, with its arguments and the first line of its result; reads are left out
lines = changes_ledger(history, WRITES)
assert lines == ["- set_agent_model(agent_name=research_agent, model=claude-sonnet) -> research_agent now on claude-sonnet",
                 "- restart_agent(agent_name=support_agent) -> FAILED: Error: permission denied",
                 "- set_agent_model(agent_name=support_agent, model=claude-sonnet) -> support_agent now on claude-sonnet"]

# 2. a write call with no result yet is not listed
assert changes_ledger(history[:-4] + [history[-4]], WRITES) == lines[:1]

# 3. the anchor is read from the full history, even when the messages sent no longer contain those calls
compacted = compact(history, "Rollout in progress.", keep_recent=1)
sent = anchor_from_history(history, compacted, WRITES)
last_block = sent[-1]["content"][-1]
assert last_block.get("type") == "text", "no anchor was added"
anchor = last_block["text"]
assert anchor == ("<current_plan>\n[ ] research\n[ ] support\n</current_plan>\n"
                  "<current_rules>\n- restarts: never in production\n</current_rules>\n"
                  "<changes_made>\n" + "\n".join(lines) + "\n</changes_made>")

# 4. the anchor goes after the results, and the history stays valid
assert sent[-1]["content"][0]["type"] == "tool_result" and check_pairing(sent) == []
assert sent[:-1] == compacted[:-1]

# 5. with nothing to restate, the messages come back as they were
bare = [task] + step([("get_status", {"agent_name": "research_agent"}, "healthy", False)])
assert anchor_from_history(bare, bare, WRITES) == bare

# 6. neither the history nor the messages passed in are changed
assert [len(m["content"]) if isinstance(m["content"], list) else m["content"] for m in history] == snapshot
assert len(compacted[-1]["content"]) == 1
```

**Hint (shown on request):** In `changes_ledger`, loop over the messages once to build a dict from `tool_use_id` to its result block, then loop again over the assistant messages and look each write call up by `block.id`. `str(content).split("\n")[0]` gives the first line. For the arguments, join `[f"{key}={value}" for key, value in block.input.items()]` with `", "`.

**Reference solution:**
```python
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
```

**Explanation:** Test 3 is the point of the exercise: the messages sent have been compacted and no longer contain the plan, the rule or the write calls, yet all three are restated, because they're read from the full history. A version that reads from `messages` adds nothing at all. Test 1 checks the ledger's format, including a failed write, which the agent needs to know about as much as a successful one. Test 6 catches adding the anchor by appending to the last message's content list in place, which would change the loop's own history.

---

*(End of Concept 3.)*
