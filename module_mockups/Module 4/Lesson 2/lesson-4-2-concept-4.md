# Module 4, Lesson 2 — Concept 4: Re-anchoring the goal

---

## What the model most needs isn't in one place

[Concept 1](→ this lesson, agents get worse before the window is full concept) showed something easy to miss: the user's original request sits near the *start* of the context, and stays there, since the loop only appends. The start is a position models use well. So the original goal isn't what gets lost.

What *does* get lost is the task's **current state**. By turn thirty, the request itself is still clear, but "what have I already done, what's left, and what are the rules now?" is scattered across dozens of tool calls, each answering part of it. The most useful thing the model could see before its next decision, the up-to-date plan, doesn't exist anywhere in the context as one piece of text. It has to be reconstructed from the middle every turn, which is the position and the distractor-heavy situation [the evidence says](→ this lesson, agents get worse before the window is full concept) models handle worst.

## The fix: a plan the model rewrites, restated at the end

The team behind the Manus agent described their answer in their July 2025 post on context engineering, and called it *recitation*. Their agent keeps a `todo.md` file and rewrites it as it works, ticking items off, so that the objective and the remaining steps are restated at the end of the context on every turn. Their tasks average around fifty tool calls, and they found that without this, agents drift off-topic or lose track of earlier goals.

The pattern has two halves:

- **The model maintains the plan.** Give it an `update_plan(plan)` tool, described as "rewrite the full current plan: what's done, what's next". Like [`set_rule` in the previous concept](→ this lesson, instructions that pile up and contradict concept), each call replaces the whole thing, so the latest version is complete on its own.
- **The loop restates it last.** Before each model call, context assembly takes the *latest* plan, and the current rules, and adds them at the very end of what's sent. That's the most recent position in the context, right beside the latest tool results, where the next decision is made.

```python
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
```

`current_rules_block` is the previous concept's function.

## Where the anchor goes

The anchor is added to the last message, which in a running loop is the user message carrying the latest tool results. There's a rule about *where* in that message, stated in Anthropic's tool-use documentation: in a user message containing tool results, the `tool_result` blocks must come **first**, and any text must come after them. Putting text first gets the request rejected. So the anchor is appended as a text block after the results:

```python
def tool_turn(call, result):
    return [{"role": "assistant", "content": [call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": result}]}]

messages = [{"role": "user", "content": "Move every research agent to claude-opus, but leave billing_agent alone."}]
messages += tool_turn(ToolUseBlock(name="set_rule", input={"name": "billing_agent", "value": "never modify"}), "rule set")
messages += tool_turn(ToolUseBlock(name="update_plan", input={"plan":
    "[ ] list agents\n[ ] find the research agents\n[ ] switch each to claude-opus\n[ ] confirm"}), "plan saved")
messages += tool_turn(ToolUseBlock(name="list_agents", input={}), "research_agent, research_agent_2, support_agent, billing_agent")
messages += tool_turn(ToolUseBlock(name="update_plan", input={"plan":
    "[x] list agents\n[x] find the research agents: research_agent, research_agent_2\n[ ] switch research_agent to claude-opus\n[ ] switch research_agent_2 to claude-opus\n[ ] confirm"}), "plan saved")

sent = assemble_context(messages)
final_blocks = sent[-1]["content"]
print("last message's blocks:", [b["type"] for b in final_blocks])
print(final_blocks[-1]["text"])
print("original scratchpad unchanged:", len(messages[-1]["content"]) == 1)
```
```
last message's blocks: ['tool_result', 'text']
<current_plan>
[x] list agents
[x] find the research agents: research_agent, research_agent_2
[ ] switch research_agent to claude-opus
[ ] switch research_agent_2 to claude-opus
[ ] confirm
</current_plan>
<current_rules>
- billing_agent: never modify
</current_rules>
original scratchpad unchanged: True
```
*(runs live, shows output — read-only demo snippet, not graded)*

Only the latest plan appears: the first version, with nothing ticked, stays buried in its old `update_plan` call and never gets restated. And `assemble_context` builds a new list rather than editing the scratchpad, so the anchor is added fresh each turn instead of accumulating as copies. The scratchpad keeps the true history; what's sent is the history plus one current summary at the end.

Two small but real benefits come with the placement. First, the plan also carries the list of which research agents were found, so a detail discovered twenty turns ago is restated beside the next decision instead of being dug out of the middle. Second, because the anchor is at the *end*, everything before it stays the same from turn to turn, which matters for caching, the subject of [the next lesson](→ this module, prompt structure and cache hits lesson). Putting the plan into the system prompt instead would change the very start of every request.

## Act before the limit

This lesson's four concepts share one conclusion: the time to manage context is **before** it's full. By the time a request doesn't fit, the agent has probably already been working with a degraded view for many turns. Pruning superseded results, keeping one current set of rules and re-anchoring the plan are cheap, and they work at any size. When the history itself grows too long to keep, [Lesson 4](→ this module, when the history wont fit lesson) and [Lesson 5](→ this module, compaction and summarization lesson) take over, and they build on everything here, including the rule that tool calls and their results always stay together.

---

## Quiz cards

> **Q1.** Given where the user's original request sits in the context, what actually gets lost in a long agent run?
> - A) The original request, which drifts into the middle
> - B) The system prompt
> - C) The task's current state: what's done, what's left and what the rules are now, scattered across many tool calls ✅
> - D) The tool definitions
>
> *Explanation:* The original request stays near the start, a well-used position. The up-to-date plan doesn't exist anywhere as one piece of text until the agent writes it.

> **Q2.** What is "recitation", as the Manus team described it?
> - A) Repeating the user's request word for word every turn
> - B) Having the agent rewrite a to-do list as it works, so the objective and remaining steps are restated at the end of the context ✅
> - C) Reading tool results aloud to the user
> - D) Summarizing the whole conversation every turn
>
> *Explanation:* Restating the current plan at the end keeps it in the most recent position, where the next decision is made.

> **Q3.** Why is the anchor appended *after* the tool results in the last message, rather than before them?
> - A) It looks tidier
> - B) Models read the last block first
> - C) The API requires `tool_result` blocks to come first in a user message, and rejects text placed before them ✅
> - D) Tool results would be deleted otherwise
>
> *Explanation:* Anthropic's docs state that text must come after all tool results in that message; putting it first causes a 400 error.

> **Q4.** Why does context assembly build a new list instead of adding the anchor to the scratchpad itself?
> - A) So the anchor is added fresh each turn instead of piling up as old copies, and the scratchpad keeps the true history ✅
> - B) Lists can't be changed in Python
> - C) The API rejects edited scratchpads
> - D) It uses fewer tokens
>
> *Explanation:* If the anchor were saved into the scratchpad, every turn would leave another stale copy behind, recreating the very problem it solves.

> **Q5.** Why is the end of the context a better place for the plan than the system prompt?
> - A) The system prompt can't hold lists
> - B) Models ignore system prompts in long runs
> - C) The end is the most recent position, beside the next decision, and changing only the end keeps everything before it stable for caching ✅
> - D) There's no difference
>
> *Explanation:* A plan in the system prompt would change the start of every request. At the end, it's both recent and cache-friendly.

---

## Applied sandbox exercise

*(graded — assembling context with the goal re-anchored)*

**Task shown to learner:** The agent maintains its plan with an `update_plan` tool, whose input has a `plan`. `current_rules_block` from the previous concept is already loaded. Implement:

- **`latest_plan(messages)`:** the `plan` from the most recent `update_plan` call in any assistant message, or `""` if there isn't one.
- **`assemble_context(messages)`:** return the messages to send, as a **new** list, with the current state restated at the end:
  - The anchor is `<current_plan>`, the plan and `</current_plan>` on separate lines (only if there is a plan), followed on the next line by the rules block (only if there are rules).
  - If there's no plan and no rules, return the messages unchanged.
  - If the last message's content is a string, append `"\n\n"` and the anchor to it.
  - Otherwise, add the anchor as a `{"type": "text", "text": ...}` block **after** all the existing blocks.
  - Don't modify the original messages.

**Starter code:**
```python
def latest_plan(messages: list) -> str:
    # TODO
    ...

def assemble_context(messages: list) -> list:
    # TODO: build the anchor, then return a new list with it added to the last message
    ...
```

**Hidden tests:**
```python
def turn(blocks, results):
    # results pair with the tool_use blocks only; a text block in the same turn has no result
    uses = [b for b in blocks if b.type == "tool_use"]
    return [{"role": "assistant", "content": blocks},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": c.id, "content": r} for c, r in zip(uses, results)]}]

p1 = ToolUseBlock(name="update_plan", input={"plan": "[ ] step one\n[ ] step two"})
r1 = ToolUseBlock(name="set_rule", input={"name": "billing_agent", "value": "never modify"})
p2 = ToolUseBlock(name="update_plan", input={"plan": "[x] step one\n[ ] step two"})
look = ToolUseBlock(name="list_agents", input={})
messages = [{"role": "user", "content": "do the task"}]
messages += turn([TextBlock(text="Planning."), p1], ["plan saved"])
messages += turn([r1], ["rule set"])
messages += turn([p2, look], ["plan saved", "a, b, billing_agent"])

out = assemble_context(messages)

# 1. latest_plan returns the most recent plan
assert latest_plan(messages) == "[x] step one\n[ ] step two"

# 2. the anchor is a text block AFTER every tool_result in the last message
last = out[-1]["content"]
assert [b["type"] for b in last] == ["tool_result", "tool_result", "text"]

# 3. it holds the latest plan, not the old one, followed by the current rules
anchor = last[-1]["text"]
assert anchor.startswith("<current_plan>\n[x] step one\n[ ] step two\n</current_plan>")
assert "[ ] step one" not in anchor
assert anchor.endswith("<current_rules>\n- billing_agent: never modify\n</current_rules>")

# 4. the original messages are not modified, and only the last message changed
assert len(messages[-1]["content"]) == 2
assert out[:-1] == messages[:-1] and len(out) == len(messages)

# 5. a plain-string last message gets the anchor appended to its text
simple = [{"role": "assistant", "content": [p1]},
          {"role": "user", "content": [{"type": "tool_result", "tool_use_id": p1.id, "content": "ok"}]},
          {"role": "assistant", "content": [TextBlock(text="What next?")]},
          {"role": "user", "content": "carry on"}]
got = assemble_context(simple)[-1]["content"]
assert got == "carry on\n\n<current_plan>\n[ ] step one\n[ ] step two\n</current_plan>"

# 6. no plan and no rules: returned unchanged
plain = [{"role": "user", "content": "hi"}]
assert assemble_context(plain) == plain
```

**Hint (shown on request):** Collect the anchor's parts in a list and join them with `"\n"`. For the last message, build a replacement with `{**last, "content": ...}` and return `messages[:-1] + [new_last]`, so the originals are never touched. For list content, `last["content"] + [text_block]` creates a new list with the block at the end.

**Reference solution:**
```python
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
```

**Explanation:** The tests pin down what makes re-anchoring work. The anchor goes after every tool result (test 2), since the API rejects text placed before them. Only the latest plan appears (test 3), because the old plan is exactly the stale content this lesson is about. The originals are untouched and only the last message changes (test 4), so the scratchpad keeps the real history and the anchor doesn't pile up turn after turn.

---

*(End of Concept 4 — final concept of Lesson 2. The lesson continues with the recap and comprehensive sandbox.)*
