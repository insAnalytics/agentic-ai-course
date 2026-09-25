# Module 4, Lesson 2 — Concept 2: What goes stale in a scratchpad

---

## Not all old content is equal

[The previous concept](→ this lesson, agents get worse before the window is full concept) showed that a longer context makes a model less reliable, and that a scratchpad full of similar-looking tool results is a particularly bad kind of long context. The obvious response is to remove things. But a scratchpad isn't a pile of interchangeable text: some old content is actively misleading, some is harmless, and some is exactly what the model needs to avoid a mistake. Telling them apart is the first skill of context management.

## Stale: a result a later call has superseded

The clearest case is a tool result that a later call has replaced. The registry agent is watching `research_agent` during a model rollout:

- Turn 1: `get_status` says **healthy**, with a long block of latency numbers.
- Turn 2: the agent switches `research_agent` to a new model.
- Turn 4: `get_status` says **degraded**, 14% errors since the change.

Both status results are still in the scratchpad. The first is now wrong, and it's also the longer and more detailed of the two: a confident, specific-sounding "healthy" sitting beside the true answer. That's the similar-but-misleading content the context-rot study found most damaging. It should go.

## The rule for removing it: replace the content, never the pair

There's one constraint that decides *how* to remove a stale result. Every `tool_use` block the model produced must be answered by a `tool_result` with its id. That's [the canonical loop's rule](→ Module 2, react and reasoning in the loop lesson, the react pattern concept), and model APIs enforce it: a conversation where a `tool_use` has lost its result, or a result has lost its `tool_use`, is rejected. So a stale result isn't deleted. Its *content* is replaced with a short note saying what happened, and the pair stays intact:

```python
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
```

`json.dumps(block.input, sort_keys=True)` turns a call's arguments into a string with the keys in a fixed order, so two calls with the same arguments always produce the same key, whatever order the arguments were written in. `{**block, "content": ...}` makes a new dict with one value replaced, [the dict spread from Module 3](→ Module 3, shaping what tools return lesson, structured results and useful error messages concept), so the original scratchpad is never changed.

Applied to the rollout scratchpad:

```python
def exchange(name, arguments, result, is_error=False):
    call = ToolUseBlock(name=name, input=arguments)
    tool_result = {"type": "tool_result", "tool_use_id": call.id, "content": result}
    if is_error:
        tool_result["is_error"] = True
    return [{"role": "assistant", "content": [call]}, {"role": "user", "content": [tool_result]}]

long_status = "research_agent: healthy. " + "latency p50 412ms, p99 1.2s, error rate 0.1%. " * 30
messages = [{"role": "user", "content": "Keep an eye on research_agent while I roll out the new model."}]
messages += exchange("get_status", {"agent_name": "research_agent"}, long_status)
messages += exchange("set_agent_model", {"agent_name": "research_agent", "model": "claude-sonnet"}, "research_agent now runs on claude-sonnet")
messages += exchange("get_status", {"agent_name": "research_agent"}, "Error: status service timed out", is_error=True)
messages += exchange("get_status", {"agent_name": "research_agent"}, "research_agent: DEGRADED. error rate 14% since the model change.")

pruned = prune_superseded(messages)
for before, after in zip(messages, pruned):
    if before["role"] == "user" and isinstance(before["content"], list):
        changed = "  <- replaced" if before["content"][0]["content"] != after["content"][0]["content"] else ""
        print(f"{after['content'][0]['content'][:70]}{changed}")
print(f"scratchpad: {count_tokens(messages):,} tokens before, {count_tokens(pruned):,} after; {len(messages)} messages both times")
```
```
[superseded: a later get_status call with the same arguments returned   <- replaced
research_agent now runs on claude-sonnet
Error: status service timed out
research_agent: DEGRADED. error rate 14% since the model change.
scratchpad: 670 tokens before, 339 after; 9 messages both times
```
*(runs live, shows output — read-only demo snippet, not graded)*

The misleading "healthy" is gone, the true "degraded" remains, the scratchpad is half the size, and all nine messages are still there with every pair intact. The placeholder also tells the model *why* the content is missing, so it doesn't wonder whether to call the tool again.

## Not stale: failures

Look at what the pruning kept: `Error: status service timed out`. It's older than the final status, and it's a failure, so it's tempting to clean it up too. Don't.

The team behind the Manus agent wrote about this in their July 2025 post on context engineering, and their advice is to *keep failed actions and their errors in context*. When the model can see that an action failed and why, it steers away from repeating it; erase the failure and the model loses the evidence, and may try the same thing again. A failure is information about what doesn't work. That's why the rule above only ever replaces *successful* results, and only when a later call has superseded them.

## Watch for: repetitive patterns

There's a subtler kind of staleness the same post describes. When a scratchpad fills with many near-identical actions and observations, such as the same tool called on agent after agent with the same shape of result, the model can start imitating the pattern rather than thinking about the next step. Models are strong [in-context learners](→ Module 1, scaling laws and emergent behavior lesson, in context learning as a mechanism concept), and a long run of repeated examples is a lesson they pick up whether you meant it or not. The Manus team calls this getting "few-shotted" by your own context.

This one has no simple deletion rule, since the repeated results aren't wrong. The responses are later lessons: [compacting](→ this module, compaction and summarization lesson) a run of similar results into a short summary, or [storing them outside the window](→ this module, offloading context to storage and note taking lesson) and keeping only what's needed.

---

## Quiz cards

> **Q1.** Why is a superseded tool result worse than just wasted tokens?
> - A) It's charged at a higher rate
> - B) It's a specific, confident-looking answer that's now wrong, sitting beside the true one, the kind of misleading content that hurts most ✅
> - C) The model always prefers older results
> - D) It breaks the tool_use pairing
>
> *Explanation:* Old results don't just take up space. When a later call superseded them, they actively contradict the current truth.

> **Q2.** Why does pruning replace a stale result's content instead of deleting the result?
> - A) Deleting is slower
> - B) The model needs the full text
> - C) Every `tool_use` must keep its matching `tool_result`, and APIs reject a conversation where the pair is broken ✅
> - D) Placeholders use more tokens, which helps caching
>
> *Explanation:* The pair is part of the conversation's structure. Replacing only the content keeps the structure valid while dropping the stale text.

> **Q3.** Should an old failed tool call and its error be pruned too?
> - A) Yes, failures are always stale
> - B) No: the failure is evidence of what doesn't work, and removing it can lead the model to try the same thing again ✅
> - C) Only if it's the most recent message
> - D) Yes, but only if the error message is long
>
> *Explanation:* That's the lesson from the Manus team: keep the wrong stuff in. A failure with its error steers the model away from repeating it.

> **Q4.** Two `get_status` calls, one for `research_agent` and one for `support_agent`. Does the later one supersede the earlier?
> - A) Yes, because it's the same tool
> - B) Yes, because only the newest status matters
> - C) Only if both succeeded
> - D) No: the arguments differ, so they're different calls and each result is still current ✅
>
> *Explanation:* A result is superseded only by a later call to the same tool with the same arguments.

> **Q5.** What's the risk of a long run of near-identical actions and results?
> - A) The model may imitate the repeated pattern instead of thinking about the next step ✅
> - B) The API rejects repeated tool calls
> - C) The results are all wrong
> - D) It has no effect on the model
>
> *Explanation:* Models learn from examples in their context, including ones you didn't intend as examples. The fixes, summarizing or storing the results, come in later lessons.

---

## Applied sandbox exercise

*(graded — pruning superseded tool results)*

**Task shown to learner:** Implement `prune_superseded(messages)`. It returns a **new** list of messages in which:

- A *call* is identified by its tool name plus its arguments (use `json.dumps(input, sort_keys=True)` for the arguments).
- For each call, only the **latest successful** result keeps its content. Any earlier successful result of the same call has its content replaced with a string starting `[superseded` that names the tool.
- Results marked `is_error` are never replaced.
- Every message stays, in order, and every `tool_use` keeps its `tool_result`. Only content changes.
- The input list and its messages must not be modified.

A single assistant message can contain several `tool_use` blocks, and a single user message several results.

**Starter code:**
```python
import json

def prune_superseded(messages: list) -> list:
    # TODO: map each tool_use_id to its call, find the latest successful result per call,
    # then build a new message list with earlier successful results replaced
    ...
```

**Hidden tests:**
```python
def exchange(calls_and_results):
    """calls_and_results: list of (name, arguments, result_text, is_error) in ONE assistant turn"""
    calls = [ToolUseBlock(name=n, input=a) for n, a, _, _ in calls_and_results]
    results = []
    for call, (_, _, text, err) in zip(calls, calls_and_results):
        r = {"type": "tool_result", "tool_use_id": call.id, "content": text}
        if err:
            r["is_error"] = True
        results.append(r)
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}], calls

msgs = [{"role": "user", "content": "watch research_agent"}]
m1, c1 = exchange([("get_status", {"agent_name": "research_agent"}, "healthy v1", False),
                   ("get_status", {"agent_name": "support_agent"}, "support healthy", False)])
m2, c2 = exchange([("get_status", {"agent_name": "research_agent"}, "Error: timed out", True)])
m3, c3 = exchange([("get_status", {"agent_name": "research_agent"}, "degraded v2", False)])
msgs += m1 + m2 + m3
snapshot = json.dumps([m if isinstance(m["content"], str) else {"role": m["role"], "n": len(m["content"])} for m in msgs])
original_first = msgs[2]["content"][0]["content"]

out = prune_superseded(msgs)

def result_for(messages, tool_use_id):
    for m in messages:
        if m["role"] == "user" and isinstance(m["content"], list):
            for b in m["content"]:
                if b.get("tool_use_id") == tool_use_id:
                    return b

# 1. the older successful research_agent status is replaced; the latest is kept
old = result_for(out, c1[0].id)
assert old["content"].startswith("[superseded") and "get_status" in old["content"]
assert result_for(out, c3[0].id)["content"] == "degraded v2"

# 2. the error result is never replaced
assert result_for(out, c2[0].id)["content"] == "Error: timed out" and result_for(out, c2[0].id)["is_error"] is True

# 3. a call with different arguments is a different call: support_agent's only result is kept
assert result_for(out, c1[1].id)["content"] == "support healthy"

# 4. structure unchanged: same number of messages, every tool_use still has its tool_result
assert len(out) == len(msgs)
for m in out:
    if m["role"] == "assistant":
        for b in m["content"]:
            assert result_for(out, b.id) is not None
assert [b.id for b in out[1]["content"]] == [c.id for c in c1]

# 5. the original list is not changed
assert msgs[2]["content"][0]["content"] == original_first == "healthy v1"

# 6. nothing to prune: the output matches the input content
single = [{"role": "user", "content": "hi"}] + exchange([("list_agents", {}, "a, b", False)])[0]
assert [m["content"] if isinstance(m["content"], str) else len(m["content"]) for m in prune_superseded(single)] == ["hi", 1, 1]
assert prune_superseded(single)[2]["content"][0]["content"] == "a, b"
```

**Hint (shown on request):** Three passes. First, walk the assistant messages and map each `tool_use` id to `(name, json.dumps(input, sort_keys=True))`. Second, walk the tool results in order, recording for each call the id of the latest successful one; later ones overwrite earlier ones. Third, build the new list: a result is stale if it succeeded and its id isn't the latest for its call. Use `{**block, "content": ...}` so the original block isn't changed.

**Reference solution:**
```python
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
```

**Explanation:** The three passes separate the question "which call is this?" from "is it still current?" and "what should the model see?". The tests pin down each rule: the superseded "healthy" is replaced and the latest kept (test 1), the error is untouched (test 2), a different agent's status isn't treated as the same call (test 3), the structure and every pair survive (test 4), and the original scratchpad is unchanged (test 5), which matters because the loop may still need it, for instance to [checkpoint the full history](→ Module 2, agent state and the scratchpad lesson). [Lesson 4](→ this module, when the history wont fit lesson) builds on exactly this pairing rule when whole messages have to go.

---

*(End of Concept 2. This lesson continues with Concept 3 — instructions that pile up and contradict.)*
