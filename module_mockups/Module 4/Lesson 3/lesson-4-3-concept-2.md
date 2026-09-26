# Module 4, Lesson 3 — Concept 2: What makes an agent cache-friendly, and what breaks it

---

## Everything after a change is paid for again

[The previous concept](→ this lesson, what a prefix cache is worth to an agent concept) assumed an append-only history, where each request begins with the whole previous request. A prefix cache reuses the longest *exactly identical* beginning, so the question for any request is: where does it first differ from the one before? Everything before that point can be read from the cache. Everything from that point on, however much of it is unchanged, has to be processed again, because the cache only matches from the start.

The order of the parts matters too. A request is laid out as the tool definitions, then the system prompt, then the messages, and a change anywhere invalidates that point and everything after it. A change to the tools invalidates the lot.

Here's a function that finds that point, by comparing two consecutive requests part by part:

```python
import json
from tokens import count_tokens, _plain   # _plain turns content blocks into dicts, as in count_tokens

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
```

`serialize` turns each part into the exact text that would be sent. The comparison is on that text, not on the Python values, for a reason the last case below shows.

## Four requests, one healthy

The registry agent's second request, sent four ways:

```python
TOOLS = [{"name": "get_status", "description": "An agent's health.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}}}]
SYSTEM = "You are the registry assistant. Check agent health and report problems clearly."
call = ToolUseBlock(name="get_status", input={"agent_name": "research_agent"})
turn_1 = [{"role": "user", "content": "Is research_agent healthy?"},
          {"role": "assistant", "content": [call]},
          {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": "healthy " * 200}]}]
next_call = ToolUseBlock(name="get_status", input={"agent_name": "support_agent"})
turn_2 = turn_1 + [{"role": "assistant", "content": [next_call]},
                   {"role": "user", "content": [{"type": "tool_result", "tool_use_id": next_call.id, "content": "ok"}]}]

previous = {"tools": TOOLS, "system": SYSTEM, "messages": turn_1}
cases = {
    "append only": {"tools": TOOLS, "system": SYSTEM, "messages": turn_2},
    "time in the system prompt": {"tools": TOOLS, "system": SYSTEM + " The time is 10:42:07.", "messages": turn_2},
    "an early result edited": {"tools": TOOLS, "system": SYSTEM,
        "messages": turn_2[:2] + [{"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": "[superseded]"}]}] + turn_2[3:]},
    "a tool added": {"tools": TOOLS + [{"name": "list_agents", "description": "All names.", "input_schema": {"type": "object", "properties": {}}}],
        "system": SYSTEM, "messages": turn_2},
}
full = first_divergence(previous, cases["append only"])["reusable_tokens"]
for label, current in cases.items():
    result = first_divergence(previous, current)
    print(f"{label:26} diverges at {str(result['diverges_at']):12} reusable {result['reusable_tokens']:>4} of {full} tokens")
```
```
append only                diverges at None         reusable  534 of 534 tokens
time in the system prompt  diverges at system       reusable   37 of 534 tokens
an early result edited     diverges at messages[2]  reusable  108 of 534 tokens
a tool added               diverges at tools        reusable    0 of 534 tokens
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes and `count_tokens` are already loaded)*

- **Append only:** the healthy case. Nothing earlier changed, so all 534 tokens of the previous request can be reused, and only the new turn is processed.
- **The time in the system prompt:** this is the classic mistake, and it's easy to make, since "tell the agent what time it is" sounds harmless. But the system prompt comes before the whole conversation, so a value that changes every request means only the tool definitions are ever reused. Every request pays again for every message. If the agent needs the time, put it at the end, in the latest message, where it breaks nothing.
- **An early result edited:** the previous lesson's [pruning](→ this module, context that fits but still hurts lesson, what goes stale in a scratchpad concept) did exactly this, replacing an old tool result with a placeholder. Everything before the edit is still reused; everything after it isn't. The earlier the edit, the more it costs. [The next concept](→ this lesson, where lesson 2s techniques stand concept) deals with this directly.
- **A tool added:** the tool definitions come first, so changing them in any way (adding one, removing one, rewording a description) reuses nothing. This is why an agent's tool list should be settled before the loop starts, and it's the tension [Lesson 7](→ this module, just in time context and dynamic tool exposure lesson) has to resolve.

## The same meaning isn't the same bytes

One more cache breaker is invisible when you read the code. Here, the same tool call is rebuilt with its arguments in a different order, as can happen when a history is saved and reloaded:

```python
SYSTEM = "You are the registry assistant."
call = ToolUseBlock(name="set_agent_model", input={"agent_name": "research_agent", "model": "claude-opus"})
history = [{"role": "user", "content": "Move research_agent to opus."},
           {"role": "assistant", "content": [call]},
           {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": "done"}]}]

# the same call, rebuilt with its arguments in a different key order (say, after being reloaded from storage)
rebuilt = ToolUseBlock(name="set_agent_model", input={"model": "claude-opus", "agent_name": "research_agent"})
rebuilt.id = call.id
reloaded = [history[0], {"role": "assistant", "content": [rebuilt]}, history[2]]

print("same meaning:", call.input == rebuilt.input)
print(first_divergence({"tools": [], "system": SYSTEM, "messages": history},
                       {"tools": [], "system": SYSTEM, "messages": reloaded}))
```
```
same meaning: True
{'diverges_at': 'messages[1]', 'reusable_tokens': 24}
```
*(runs live, shows output — read-only demo snippet, not graded)*

To Python the two inputs are equal, since dict comparison ignores order. To a cache they're different text, and the request diverges at the rebuilt message. Anything that rebuilds history, [saving and reloading a checkpoint](→ Module 2, agent state and the scratchpad lesson, checkpoint and resume concept), converting between formats, or a language whose JSON library doesn't keep key order, can quietly break the cache this way. The fix is to keep what's sent exactly stable: store the messages as they were sent, or write JSON with a fixed key order, [the `sort_keys=True` from the previous lesson](→ this module, context that fits but still hurts lesson, what goes stale in a scratchpad concept).

## The rules, collected

A cache-friendly agent:

- keeps the tool definitions and system prompt **identical** for the whole run
- puts anything that changes per request (the time, the current plan, per-request context) **at the end**
- only **appends** to the history, never edits earlier messages as a routine step
- sends the history **exactly** as it was sent before, byte for byte

That's also exactly the shape [the previous lesson's re-anchoring](→ this module, context that fits but still hurts lesson, re anchoring the goal concept) already has: the plan is added at the end of each request and never saved into the history, so it changes every turn without disturbing anything before it.

---

## Quiz cards

> **Q1.** A request differs from the previous one only in its third message. What can be read from the cache?
> - A) Everything except the third message
> - B) Nothing, since the requests differ
> - C) Only the new messages at the end
> - D) The tools, the system prompt and the first two messages; everything from the third message on is processed again ✅
>
> *Explanation:* A prefix cache matches from the start. Once the request differs, everything after that point is new to the cache, even if it's unchanged.

> **Q2.** Why is putting the current time in the system prompt so costly?
> - A) Timestamps are long
> - B) The system prompt comes before every message, so a value that changes each request means no message is ever reused ✅
> - C) Models can't read timestamps
> - D) It changes the tool definitions
>
> *Explanation:* A change early in the request invalidates everything after it. Put changing values at the end instead.

> **Q3.** What does changing an agent's tool list mid-run do to the cache?
> - A) Nothing, since tools are separate from messages
> - B) Only the changed tool is reprocessed
> - C) Nothing can be reused, because tool definitions come first ✅
> - D) Only the system prompt is reprocessed
>
> *Explanation:* The request is laid out as tools, then system, then messages, so a change to the tools invalidates everything.

> **Q4.** Two tool calls have the same arguments in a different key order. Why can they break a cache?
> - A) The model treats them as different tools
> - B) The cache compares the exact text sent, and the two serialize differently even though they mean the same thing ✅
> - C) Key order changes the tool's schema
> - D) They can't; dicts with the same keys are equal
>
> *Explanation:* Python compares dicts by content; a cache compares bytes. Keeping what's sent exactly stable avoids the miss.

> **Q5.** Where should a value that changes every request, like the time or the current plan, go?
> - A) In the system prompt, where the model sees it first
> - B) In the tool descriptions
> - C) At the end of the request, where changing it disturbs nothing before it ✅
> - D) In the first user message
>
> *Explanation:* The end is the only position where a change costs nothing in reuse. It's also where Lesson 2 already put the plan.

---

## Applied sandbox exercise

*(graded — finding where a request stops matching)*

**Task shown to learner:** Implement `first_divergence(previous, current)`. Each request is a dict with `tools`, `system` and `messages`. `serialize` and `count_tokens` are provided. Compare the parts in order, using `serialize` for every comparison:

- If the tools differ, return `{"diverges_at": "tools", "reusable_tokens": 0}`.
- If the system prompts differ, return `"system"`, with the tools' tokens as reusable.
- Otherwise walk the previous request's messages in order. At the first index `i` where the current request has no message, or a different one, return `f"messages[{i}]"`, with the tokens of the tools, the system prompt and every matching message before `i`.
- If every previous message matches, return `None` with everything reusable.

**Starter code:**
```python
def first_divergence(previous: dict, current: dict) -> dict:
    # TODO: compare tools, then system, then each previous message, adding up what's reusable
    ...
```

**Hidden tests:**
```python
T = [{"name": "a", "description": "x", "input_schema": {"type": "object", "properties": {}}}]
S = "system prompt text"
m = [{"role": "user", "content": "q1"}, {"role": "assistant", "content": [TextBlock(text="a1")]}, {"role": "user", "content": "q2"}]
prev = {"tools": T, "system": S, "messages": m}

# 1. a pure append: no divergence, and the whole previous request is reusable
cur = {"tools": T, "system": S, "messages": m + [{"role": "assistant", "content": [TextBlock(text="a2")]}]}
r = first_divergence(prev, cur)
assert r == {"diverges_at": None, "reusable_tokens": count_tokens(T) + count_tokens(S) + count_tokens(m)}

# 2. a changed tool list: nothing is reusable
r = first_divergence(prev, {"tools": T + T, "system": S, "messages": m})
assert r == {"diverges_at": "tools", "reusable_tokens": 0}

# 3. a changed system prompt: only the tools are reusable
r = first_divergence(prev, {"tools": T, "system": S + " now 10:42", "messages": m})
assert r == {"diverges_at": "system", "reusable_tokens": count_tokens(T)}

# 4. an edited middle message: reusable up to it, and it names the index
edited = [m[0], {"role": "assistant", "content": [TextBlock(text="a1 EDITED")]}, m[2]]
r = first_divergence(prev, {"tools": T, "system": S, "messages": edited})
assert r == {"diverges_at": "messages[1]", "reusable_tokens": count_tokens(T) + count_tokens(S) + count_tokens(m[0])}

# 5. messages removed from the end: diverges at the first one that's missing
r = first_divergence(prev, {"tools": T, "system": S, "messages": m[:2]})
assert r["diverges_at"] == "messages[2]"

# 6. same meaning, different key order: still a divergence, because the cache matches exact bytes
c1 = ToolUseBlock(name="set", input={"x": 1, "y": 2})
c2 = ToolUseBlock(name="set", input={"y": 2, "x": 1}); c2.id = c1.id
r = first_divergence({"tools": [], "system": "", "messages": [{"role": "assistant", "content": [c1]}]},
                     {"tools": [], "system": "", "messages": [{"role": "assistant", "content": [c2]}]})
assert r["diverges_at"] == "messages[0]"
```

**Hint (shown on request):** Keep a running `reusable` total and return as soon as something differs. `enumerate(previous["messages"])` gives each index with its message; check `i >= len(current["messages"])` before comparing, so a shorter request doesn't cause an index error.

**Reference solution:**
```python
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
```

**Explanation:** The function is a small version of the cache-diagnostics tools some providers now offer, which report where two requests diverged. The tests cover each cache breaker from this concept: a changed tool list reuses nothing (test 2), a changed system prompt reuses only the tools (test 3), an edited message reuses only what came before it (test 4), and the key-order case (test 6) diverges even though the Python values are equal. Test 1 is the healthy pattern the whole lesson is aiming for.

---

*(End of Concept 2. This lesson continues with Concept 3 — where Lesson 2's techniques stand, and the fights ahead.)*
