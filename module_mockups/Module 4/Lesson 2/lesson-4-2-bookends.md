# Context That Fits but Still Hurts

## Intro

> **You'll be able to**
> - Explain why an agent's answers get worse as its context grows, long before the window is full, and cite the evidence
> - Tell stale content from useful content in a scratchpad: prune superseded results, but keep failures and their errors
> - Keep instructions from piling up and contradicting, with one current set of rules the agent maintains
> - Re-anchor the current plan at the end of the context each turn, in a way the API accepts
> - Build a context-preparation step that sends a cleaned copy of the history while keeping the full history intact

**Why it matters**

[Lesson 1](→ this module, context as a budget lesson) measured context as a budget of tokens. This lesson is the reason that budget matters long before it runs out: a model's reliability drops as its input grows, and an agent's scratchpad is close to the worst kind of long input, full of similar-looking results, old answers that have since changed, and instructions that no longer agree.

That makes context management a quality problem first and a capacity problem second, and it's the idea the rest of this module keeps returning to. The responses in this lesson are cheap and work at any size: stop sending what's stale, keep one current version of the rules, and restate the plan where the model makes its next decision. The later lessons handle what happens when the history is genuinely too long to keep at all.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** What did Chroma's "Context Rot" study find?
> - A) Accuracy holds until the window is nearly full, then collapses
> - B) Every model tested got less reliable as input grew, even on simple tasks, and more so with similar-looking distractors ✅
> - C) Only small models are affected
> - D) Longer inputs improve accuracy
>
> *Explanation:* The decline is gradual and starts well inside the window, which is why context is managed for quality, not just capacity.

> **Q2.** A status check says "healthy", and a later check of the same agent says "degraded". What should happen to the first result?
> - A) Keep it, since all history is useful
> - B) Delete its message, since it's wrong
> - C) Replace its content with a short note that a later call superseded it, keeping the tool_use/tool_result pair ✅
> - D) Move it to the end of the context
>
> *Explanation:* It's misleading, so its content goes. The pair stays, because the API rejects a `tool_use` without its result.

> **Q3.** Should a failed call and its error be pruned from the scratchpad?
> - A) Yes, failures are always stale
> - B) No, the failure tells the model what doesn't work and steers it away from repeating it ✅
> - C) Only if a later call succeeded
> - D) Only if the error is long
>
> *Explanation:* That's the Manus team's "keep the wrong stuff in". Pruning only ever replaces superseded successful results.

> **Q4.** Why can't code simply detect when two instructions contradict?
> - A) Conflicting instructions often share few words, and working out how one overrides another takes understanding ✅
> - B) Code can't read user messages
> - C) Contradictions never happen in practice
> - D) It would cost too many tokens
>
> *Explanation:* So the model reconciles once, when an instruction arrives, and records the result; code manages the recorded rules.

> **Q5.** In a long run, what information is the model most likely to lose track of?
> - A) The original request, which sits near the start
> - B) The system prompt
> - C) The task's current state, scattered across many tool calls ✅
> - D) The tool definitions
>
> *Explanation:* The start is a well-used position. The up-to-date plan exists nowhere as one piece of text until the agent writes it.

> **Q6.** Where must a text anchor go in a user message that carries tool results?
> - A) Before the tool results, so the model reads it first
> - B) In a separate message sent before the results
> - C) After all the tool results, since text placed before them gets the request rejected ✅
> - D) Anywhere; order doesn't matter
>
> *Explanation:* The API requires `tool_result` blocks to come first in that message.

> **Q7.** Why does a context-preparation step send a cleaned *copy* rather than editing the history?
> - A) Copies are cheaper to send
> - B) The API rejects edited histories
> - C) Python can't edit lists
> - D) The full history stays intact for checkpoints and later decisions, and the anchor doesn't pile up as stale copies ✅
>
> *Explanation:* What's kept and what's sent are different things. Keeping them separate is what makes the cleanup safe to repeat every turn.

---

### Comprehensive sandbox

*(applied, multi-file — a loop that sends a cleaned, re-anchored context)*

**Task shown to learner:** The registry agent is rolling out a model change and watching its effect. Over the task it checks the same agent's status three times, the second check fails, it records a rule, and it updates its plan twice. `rules.py`, which is read-only, contains `current_rules_block` from Concept 3. Complete `agent.py`:

- **`prune_superseded(messages)`** from Concept 2, and **`latest_plan`** and **`assemble_context`** from Concept 4.
- **`prepare_context(messages)`:** prune superseded results, then assemble, so the plan and rules are restated at the end.
- **`run_agent(llm, user_message, tools, tool_impls, max_steps)`:** the collect-every-call loop.
  - Keep the full `history`, and send `prepare_context(history)` on each call, with `tools=tools`.
  - Each tool in `tool_impls` returns `(output, is_error)`. Set `is_error` on the result when it's true, and answer unknown tools locally as errors.
  - Return `(final_text, history)`, or a step-limit message with the history if `max_steps` runs out.

**Tab: `rules.py`** (read-only)
```python
# current rules, from this lesson's third concept -- read-only
def rule_history(messages: list) -> dict:
    history = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "set_rule":
                    history.setdefault(block.input["name"], []).append(block.input["value"])
    return history

def changed_rules(messages: list) -> list:
    return [name for name, values in rule_history(messages).items() if len(values) > 1]

def current_rules_block(messages: list) -> str:
    history = rule_history(messages)
    if not history:
        return ""
    lines = [f"- {name}: {values[-1]}" for name, values in history.items()]
    return "<current_rules>\n" + "\n".join(lines) + "\n</current_rules>"
```

**Tab: `agent.py`** (starter, entry file)
```python
from rules import current_rules_block
import json

def prune_superseded(messages: list) -> list:
    # TODO: from Concept 2
    ...

def latest_plan(messages: list) -> str:
    # TODO: from Concept 4
    ...

def assemble_context(messages: list) -> list:
    # TODO: from Concept 4
    ...

def prepare_context(messages: list) -> list:
    # TODO: prune, then assemble
    ...

def run_agent(llm, user_message, tools, tool_impls, max_steps=30):
    # TODO: keep the full history; send a prepared copy on every call
    ...
```

**Hidden tests:**
```python
from fake import *
from agent import run_agent, prepare_context

STATUS = {"n": 0}
def get_status(agent_name):
    STATUS["n"] += 1
    if STATUS["n"] == 1:
        return ("research_agent: healthy. " + "p99 1.2s, errors 0.1%. " * 20, False)
    if STATUS["n"] == 2:
        return ("Error: status service timed out", True)
    return ("research_agent: DEGRADED, 14% errors", False)

IMPLS = {
    "get_status": get_status,
    "set_agent_model": lambda agent_name, model: (f"{agent_name} now on {model}", False),
    "update_plan": lambda plan: ("plan saved", False),
    "set_rule": lambda name, value: ("rule set", False),
}
TOOLS = [{"name": n} for n in IMPLS]

def status(): return ToolUseBlock(name="get_status", input={"agent_name": "research_agent"})
plan1 = ToolUseBlock(name="update_plan", input={"plan": "[ ] check status\n[ ] roll out\n[ ] recheck"})
rule1 = ToolUseBlock(name="set_rule", input={"name": "rollback", "value": "only with user approval"})
s1, s2, s3 = status(), status(), status()
roll = ToolUseBlock(name="set_agent_model", input={"agent_name": "research_agent", "model": "claude-sonnet"})
plan2 = ToolUseBlock(name="update_plan", input={"plan": "[x] check status\n[x] roll out\n[ ] recheck: degraded, report to user"})

llm = ToolAwareClient([
    [TextBlock(text="Planning."), plan1, rule1],
    [s1],
    [roll],
    [s2],
    [s3, plan2],
    [TextBlock(text="research_agent is degraded after the rollout; I have not rolled back without your approval.")],
])
STATUS["n"] = 0
answer, history = run_agent(llm, "Roll research_agent to claude-sonnet and watch it.", TOOLS, IMPLS)
assert answer.startswith("research_agent is degraded")
last_sent = llm.seen[-1]

def find_result(messages, tool_use_id):
    for m in messages:
        if m["role"] == "user" and isinstance(m["content"], list):
            for b in m["content"]:
                if isinstance(b, dict) and b.get("tool_use_id") == tool_use_id:
                    return b

# 1. what was sent: the superseded "healthy" is replaced, the error is kept, the latest status is intact
assert find_result(last_sent, s1.id)["content"].startswith("[superseded")
assert find_result(last_sent, s2.id)["content"] == "Error: status service timed out"
assert find_result(last_sent, s3.id)["content"] == "research_agent: DEGRADED, 14% errors"

# 2. every tool_use in what was sent still has its tool_result
for m in last_sent:
    if m["role"] == "assistant":
        for b in m["content"]:
            if b.type == "tool_use":
                assert find_result(last_sent, b.id) is not None

# 3. the anchor is the last block sent: latest plan, then the rules, after the tool results
final = last_sent[-1]["content"]
assert final[-1]["type"] == "text" and all(b["type"] == "tool_result" for b in final[:-1])
anchor = final[-1]["text"]
assert "[ ] recheck: degraded, report to user" in anchor and "[ ] check status" not in anchor
assert anchor.endswith("<current_rules>\n- rollback: only with user approval\n</current_rules>")

# 4. the kept history is untouched: the original healthy result is still there, and no anchor is saved in it
assert find_result(history, s1.id)["content"].startswith("research_agent: healthy")
for m in history:
    if isinstance(m["content"], list):
        assert not any(isinstance(b, dict) and b.get("type") == "text" and "<current_plan>" in b.get("text", "") for b in m["content"])

# 5. each request got exactly one anchor (not an accumulating pile)
for sent in llm.seen[1:]:
    anchors = [b for m in sent if isinstance(m["content"], list) for b in m["content"]
               if isinstance(b, dict) and b.get("type") == "text" and "<current_plan>" in b.get("text", "")]
    assert len(anchors) == 1

# 6. pruning genuinely shrinks what's sent: smaller than the same history anchored but not pruned
from tokens import count_tokens
from agent import assemble_context
assert count_tokens(prepare_context(history)) < count_tokens(assemble_context(history)) - 100

# 7. an unknown tool is answered locally, and max_steps bounds the loop
llm = ToolAwareClient([[ToolUseBlock(name="delete_agent", input={})], [TextBlock(text="ok")]])
answer, history = run_agent(llm, "x", TOOLS, IMPLS)
assert history[2]["content"][0]["is_error"] is True
llm = ToolAwareClient([[ToolUseBlock(name="update_plan", input={"plan": "p"})] for _ in range(5)])
answer, _ = run_agent(llm, "x", TOOLS, IMPLS, max_steps=2)
assert llm.call_count == 2 and "2" in answer
```

**Hint (shown on request):** The order inside `prepare_context` matters: prune first, then assemble, so the anchor is added to the already-cleaned last message. In the loop, `llm.create(messages=prepare_context(history), tools=tools)` is the only change from Lesson 1's loop, and the results are appended to `history`, never to the prepared copy.

**Reference solution — `agent.py`:**
```python
from rules import current_rules_block
import json

def prune_superseded(messages: list) -> list:
    # which tool call each tool_use_id belongs to: (name, arguments)
    calls = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use":
                    calls[block.id] = (block.name, json.dumps(block.input, sort_keys=True))

    # the id of the LATEST successful result for each distinct call
    latest = {}
    for message in messages:
        if message["role"] == "user" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error"):
                    latest[calls[block["tool_use_id"]]] = block["tool_use_id"]

    pruned = []
    for message in messages:
        if message["role"] == "user" and isinstance(message["content"], list):
            new_content = []
            for block in message["content"]:
                key = calls.get(block.get("tool_use_id"))
                stale = (block.get("type") == "tool_result" and not block.get("is_error")
                         and latest.get(key) != block["tool_use_id"])
                if stale:
                    name = key[0]
                    block = {**block, "content": f"[superseded: a later {name} call with the same arguments returned newer data]"}
                new_content.append(block)
            pruned.append({**message, "content": new_content})
        else:
            pruned.append(message)
    return pruned

def latest_plan(messages: list) -> str:
    plan = ""
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "update_plan":
                    plan = block.input["plan"]
    return plan

def assemble_context(messages: list) -> list:
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
        new_last = {**last, "content": last["content"] + [{"type": "text", "text": anchor}]}
    return messages[:-1] + [new_last]

def prepare_context(messages: list) -> list:
    """What to send this turn: stale results pruned, then the plan and rules restated at the end."""
    return assemble_context(prune_superseded(messages))

def run_agent(llm, user_message, tools, tool_impls, max_steps=30):
    history = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        # the full history is kept; only a prepared copy is sent
        response = llm.create(messages=prepare_context(history), tools=tools)
        history.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text"), history
        results = []
        for call in calls:
            if call.name not in tool_impls:
                results.append({"type": "tool_result", "tool_use_id": call.id,
                                "content": f"Error: there is no tool called {call.name}", "is_error": True})
                continue
            output, is_error = tool_impls[call.name](**call.input)
            result = {"type": "tool_result", "tool_use_id": call.id, "content": output}
            if is_error:
                result["is_error"] = True
            results.append(result)
        history.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer", history
```

**Explanation:** The tests read what the model actually received on its final call, and check each part of the lesson:

- **Stale versus useful:** the superseded "healthy" status was replaced, the timeout error was kept, and the latest "degraded" status is intact (test 1).
- **Structure:** every `tool_use` still has its result (test 2).
- **The anchor:** it's the last block, after the tool results, with the latest plan and the current rules (test 3), and exactly one anchor on every request, not an accumulating pile (test 5).
- **The history is untouched:** the original "healthy" result is still in it, and no anchor was saved into it (test 4).
- **It pays off:** pruning makes what's sent measurably smaller (test 6).

That split, a full history that's kept and a prepared context that's sent, is the shape the rest of the module builds on. Lessons 4 and 5 change what `prepare_context` does when the history outgrows the window, without ever changing what's kept.
