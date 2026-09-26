# Module 4, Lesson 4 — Concept 4: Reasoning travels with its tool call

> **Note for the site build:** add `check_open_round` (first code block below) to this lesson's shared setup, after `CHECK_PAIRING`. Both demos need `split_rounds` and `trim_to_fit` from Concept 2; the second also needs `clear_old_results` and `fit` from Concept 3 and `strip_old_thinking` and `fit_history` from this concept. The exercise provides `count_tokens`, `_plain`, `is_tool_results`, `check_pairing`, `check_open_round`, `split_rounds`, `trim_to_fit`, `clear_old_results` and `fit` as read-only code, plus `ToolUseBlock`, `TextBlock` and `ThinkingBlock`.

---

## A third kind of block

With a reasoning model, an assistant message often holds three kinds of block: the model's [reasoning](→ Module 1, calling llm apis and processing responses lesson, reasoning output in responses concept), then maybe some text, then its tool calls. [Module 2's ReAct lesson](→ Module 2, react and reasoning in the loop lesson, the react pattern concept) added `ThinkingBlock` to the fake client for exactly this shape. Reasoning blocks can be large, so when a history has to shrink they look like an easy target.

They come with a rule of their own, and it's the same idea as tool pairing: **the assistant message whose tool results you're sending goes back exactly as it was returned, reasoning included.** The model is in the middle of a step: it reasoned, called a tool, and is about to read the result. Its reasoning is part of that step.

- **Claude's API** requires the complete, unmodified thinking block that came with a tool request to be sent back along with the tool results.
- **Gemini 3** does the same with its encrypted "thought signatures": every function call in the current turn must come back with its signature, or the request fails with a 400.

Here's the rule as a check, next to `check_pairing`:

```python
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
```
*(defined once here and already loaded for every later demo in this lesson; real thinking blocks carry a signature that the API verifies, and the fake `ThinkingBlock` doesn't, so this checks structure only)*

## Two ways to save space

Here's a three-step investigation where each step starts with reasoning. One tempting saving strips every reasoning block; the other is the round-based trimming from [earlier in this lesson](→ this lesson, cutting whole rounds not messages concept):

```python
def reasoning_round(agent, thought):
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    logs = f"{agent} INFO request handled in 412ms status=200\n" * 40
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=thought), call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": logs}]}]

history = [{"role": "user", "content": "Find out why the support queue is slow."}]
history += reasoning_round("support_agent", "The queue is slow; start with support_agent's own logs. " * 12)
history += reasoning_round("search_agent", "support_agent looks fine, but it calls search_agent on every ticket. " * 12)
history += reasoning_round("billing_agent", "search_agent is fast too. Billing lookups happen per ticket; check billing_agent next. " * 12)

thinking_tokens = 0
for m in history:
    if m["role"] == "assistant":
        for b in m["content"]:
            if b.type == "thinking":
                thinking_tokens += count_tokens(b.thinking)
print(f"history: {count_tokens(history):,} tokens, of which reasoning: {thinking_tokens:,}")

def strip_all_thinking(messages):
    stripped = []
    for m in messages:
        if m["role"] == "assistant":
            m = {**m, "content": [b for b in m["content"] if b.type != "thinking"]}
        stripped.append(m)
    return stripped

for label, sent in [("strip all reasoning", strip_all_thinking(history)),
                    ("trim by rounds", trim_to_fit(history, budget=1_500))]:
    problems = check_pairing(sent) + check_open_round(history, sent)
    print(f"{label:20} {count_tokens(sent):>5,} tokens   problems: {problems}")
```
```
history: 2,537 tokens, of which reasoning: 636
strip all reasoning  1,873 tokens   problems: ['the newest assistant message was not sent back exactly as returned']
trim by rounds         910 tokens   problems: []
```
*(runs live, shows output — read-only demo snippet, not graded; the reasoning and logs are made up, and the check is structural)*

Stripping everything broke the open round: the step the model is in the middle of lost its reasoning. Round-based trimming passed without any change, because it never splits a message. A round leaves with its reasoning or stays with it.

## Old reasoning first

Reasoning from *finished* steps is a different matter. Its step is done, and what it concluded shows up in what the model did next. Providers differ on whether to keep it:

- Some strip it themselves. On earlier Claude models, the API drops thinking from previous turns automatically, even if you send it.
- Others keep it by default, because it helps the model stay consistent. On Claude Opus 4.5 and later Opus models, and Claude Sonnet 4.6 and later Sonnet models, previous thinking stays in the context and counts toward the window like any other input.

When it's kept, it's a reasonable first thing to remove when a history is over budget. Unlike a tool result, it's the model's own intermediate work, not evidence it gathered. So the full order becomes: old reasoning, then old results, then whole rounds, and never the open round.

```python
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
```

```python
def reasoning_round(agent, thought):
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    logs = f"{agent} INFO request handled in 412ms status=200\n" * 40
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=thought), call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": logs}]}]

history = [{"role": "user", "content": "Find out why the support queue is slow."}]
history += reasoning_round("support_agent", "The queue is slow; start with support_agent's own logs. " * 12)
history += reasoning_round("search_agent", "support_agent looks fine, but it calls search_agent on every ticket. " * 12)
history += reasoning_round("billing_agent", "search_agent is fast too. Billing lookups happen per ticket; check billing_agent next. " * 12)

for label, sent in [("strip old reasoning", strip_old_thinking(history)),
                    ("fit_history, 2,000", fit_history(history, 2_000, keep_last=1)),
                    ("fit_history, 1,000", fit_history(history, 1_000, keep_last=1))]:
    problems = check_pairing(sent) + check_open_round(history, sent)
    reasoning = 0
    for m in sent:
        if m["role"] == "assistant":
            reasoning += len([b for b in m["content"] if b.type == "thinking"])
    print(f"{label:20} {count_tokens(sent):>5,} tokens, {len(sent)} messages, reasoning blocks kept: {reasoning}   problems: {problems}")
```
```
strip old reasoning  2,143 tokens, 7 messages, reasoning blocks kept: 1   problems: []
fit_history, 2,000   1,082 tokens, 7 messages, reasoning blocks kept: 1   problems: []
fit_history, 1,000     996 tokens, 5 messages, reasoning blocks kept: 1   problems: []
```
*(runs live, shows output — read-only demo snippet, not graded; the reasoning and logs are made up)*

At each budget, only as much goes as needed, and in the same order. Stripping old reasoning alone wasn't quite enough for 2,000 tokens, so old results were cleared too. At 1,000, a round went as well. In every case the newest step kept its reasoning.

## When the provider binds reasoning to everything before it

Some providers go further than the open-round rule, and this changes how every technique in this module behaves.

On Claude's newest models (Claude Fable 5.1 and Claude Opus 5.5, as of September 2026), a thinking block stays valid only while everything sent before it is unchanged: the system prompt, the tool list, and every earlier message. Edit anything before a thinking block, and that block and every later one are invalid. For accounts created on or after August 31, 2026, the API rejects such a request with a 400 by default. You can opt to have the invalid blocks dropped instead. The model then works without that reasoning.

That makes every *client-side* edit in this module an edit that invalidates reasoning: [Lesson 2's pruning](→ this module, context that fits but still hurts lesson, what goes stale in a scratchpad concept), [Lesson 3's batching](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept), and this lesson's clearing and trimming. The techniques are still right; what changes is what you do alongside them:

- **Shape a result before it first enters the history.** A result that's small when it's first sent never needs editing. [Module 3's shaping lesson](→ Module 3, shaping what tools return lesson, truncation and pagination concept) is the first defense.
- **Batch every edit.** The fewer edits, the fewer times reasoning is lost. It's the same rule as for the cache, and for the same reason: both depend on an unchanged prefix.
- **After a client-side edit, don't send back reasoning produced before it.** Removing thinking blocks from the start of the history, from the end, or all of them is allowed. Removing one from the middle and keeping later ones isn't.
- **Or let the provider do the trimming.** Server-side trimming doesn't count as an edit, because the check compares what you sent, not the server's trimmed copy.

## You don't always build this yourself

Several providers now trim context on their side. Claude's API, for example, has **context editing** (a beta, enabled with the `context-management-2025-06-27` header). Its `clear_tool_uses_20250919` strategy clears the oldest tool results once the input passes a threshold, and replaces them with placeholders while keeping the calls. It can exclude chosen tools, and it has a `clear_at_least` setting so that each clearing removes enough to be worth the cache miss. A companion strategy clears old thinking blocks. It's the same design as this concept, run on the server, and the client keeps its full history.

The same documentation now points to server-side **compaction**, which summarizes older turns, as the main strategy for long conversations. That's [Lesson 5](→ this module, compaction and summarization lesson). These features change quickly, so check the provider's current documentation before relying on one. The ideas in this lesson are what they implement.

---

## Quiz cards

> **Q1.** Why can't an agent strip the reasoning from the assistant message whose tool results it's about to send?
> - A) The reasoning is part of the step the model is in the middle of, and providers require that message back as it was returned ✅
> - B) Reasoning blocks are free, so stripping them saves nothing
> - C) The tool results refer to the reasoning block's id
> - D) Stripping reasoning changes the tool's input
>
> *Explanation:* The model reasoned, called a tool, and is about to read the result. Claude requires the unmodified thinking block with the tool results, and Gemini 3 rejects a current-turn call without its thought signature.

> **Q2.** Why did round-based trimming pass the open-round check without any change to its code?
> - A) It checks every message's reasoning before dropping it
> - B) It never splits a message, so reasoning leaves or stays together with its tool call ✅
> - C) It only ever drops user messages
> - D) Rounds with reasoning are never dropped
>
> *Explanation:* A round is removed whole, and the newest round is never removed. Whatever keeps tool pairing intact keeps reasoning with its call for the same reason.

> **Q3.** Why does `fit_history` remove old reasoning before clearing old tool results?
> - A) Reasoning from finished steps is the model's own intermediate work, while tool results are evidence it gathered ✅
> - B) The API rejects histories that contain old reasoning
> - C) Reasoning blocks are always larger than tool results
> - D) Clearing results would invalidate the reasoning anyway
>
> *Explanation:* What a finished step concluded already shows in what the model did next. A tool result may be the only copy of data the agent needs. This is an ordering choice, and some providers remove old reasoning themselves.

> **Q4.** On a provider that binds each thinking block to everything before it, what happens to the kept reasoning when the client clears an old tool result?
> - A) Nothing, because only the tool result changed
> - B) Only the thinking block in that tool result's round becomes invalid
> - C) Every thinking block after the cleared result becomes invalid, so the request is rejected or those blocks are dropped ✅
> - D) The provider restores the original tool result automatically
>
> *Explanation:* The check compares everything before a block with what was sent when the block was produced. A client-side edit changes that for every later block. Server-side trimming doesn't, because the check compares what the client sent.

> **Q5.** Claude's `clear_tool_uses_20250919` strategy has a `clear_at_least` setting. Which idea from this lesson does it match?
> - A) Keeping the task message pinned
> - B) Cutting whole rounds instead of messages
> - C) Keeping failed results
> - D) Fitting in batches, so each edit removes enough to be worth the cache miss ✅
>
> *Explanation:* Clearing changes the history, which costs the cached prefix. Clearing only when a worthwhile amount goes is the same trade as `HistoryFitter`'s low-water mark.

---

## Applied sandbox exercise

*(graded — reasoning-aware fitting)*

**Task shown to learner:** everything from this lesson so far is provided. Implement:

- **`strip_old_thinking(messages)`:** return a new list in which every assistant message except the newest one has its `thinking` blocks removed.
  - Keep all other blocks, in their order.
  - The newest assistant message is returned untouched.
  - If removing the thinking would leave an assistant message with no blocks, leave that message as it is.
  - Never modify `messages` or the messages in it.
- **`fit_history(messages, budget, keep_last)`:** if the messages fit, return a copy unchanged. Otherwise strip old reasoning, then pass the result to `fit` from the previous concept.

**Provided code:** `is_tool_results`, `check_pairing`, `check_open_round`, `split_rounds`, `trim_to_fit`, `clear_old_results` and `fit`, and the fake client's `count_tokens`, `_plain`, `ToolUseBlock`, `TextBlock` and `ThinkingBlock`.

**Starter code:**
```python
def strip_old_thinking(messages: list) -> list:
    # TODO: find the newest assistant message, then rebuild the others without thinking blocks
    ...

def fit_history(messages: list, budget: int, keep_last: int) -> list:
    # TODO: nothing if it fits; otherwise old reasoning first, then fit
    ...
```

**Hidden tests:**
```python
def reasoning_round(agent, thought, size=300):
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=thought), TextBlock(text=f"Checking {agent}."), call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": agent + " " + "x" * size}]}]

def kinds(message):
    return [_plain(b)["type"] for b in message["content"]]

task = {"role": "user", "content": "Find out why the support queue is slow."}
history = ([task] + reasoning_round("support_agent", "a" * 800) + reasoning_round("search_agent", "b" * 800)
           + reasoning_round("billing_agent", "c" * 800))
snapshot = [kinds(m) for m in history if m["role"] == "assistant"]

# 1. every assistant message but the newest loses its thinking; its other blocks stay, in order
out = strip_old_thinking(history)
assert kinds(out[1]) == ["text", "tool_use"] and kinds(out[3]) == ["text", "tool_use"]
assert kinds(out[5]) == ["thinking", "text", "tool_use"]

# 2. the newest assistant message goes back untouched, and nothing else changes shape
assert out[5] is history[5] and len(out) == len(history)
assert check_pairing(out) == [] and check_open_round(history, out) == []

# 3. the history itself is not changed
assert [kinds(m) for m in history if m["role"] == "assistant"] == snapshot

# 4. an assistant message holding nothing but thinking is left as it is
odd = [task, {"role": "assistant", "content": [ThinkingBlock(thinking="hmm")]},
       {"role": "user", "content": "Go on."}] + reasoning_round("support_agent", "d" * 100)
assert kinds(strip_old_thinking(odd)[1]) == ["thinking"]

# 5. fit_history: when everything fits, nothing changes, reasoning included
kept = fit_history(history, budget=100_000, keep_last=1)
assert kept == history and kept is not history

# 6. when stripping old reasoning is enough, no result is cleared and no round dropped
budget = count_tokens(strip_old_thinking(history)) + 10
kept = fit_history(history, budget, keep_last=1)
assert count_tokens(kept) <= budget and len(kept) == len(history)
assert kept[2]["content"][0]["content"].startswith("support_agent")

# 7. when it isn't, results are cleared and rounds dropped as before, and the open round keeps its reasoning
budget = count_tokens(strip_old_thinking(history)) - 200
kept = fit_history(history, budget, keep_last=1)
assert count_tokens(kept) <= budget and kept[0] is task
assert check_pairing(kept) == [] and check_open_round(history, kept) == []
```

**Hint (shown on request):** Find the newest assistant message's index in a first loop. In a second loop, build a filtered list of blocks for every other assistant message, and use `{**message, "content": kept}` only when that list isn't empty. Building a new list instead of calling `.remove()` keeps the original messages unchanged.

**Reference solution:**
```python
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
```

**Explanation:** Tests 1 and 2 check the rule this concept is about: old reasoning goes, the newest message comes back exactly as returned. Test 3 catches removing blocks from the original messages' lists, which would silently change the loop's history. Test 4 is the edge case: a message can't be sent with no blocks, so a thinking-only message is left alone. Tests 6 and 7 check the order: when stripping reasoning is enough, every tool result survives; when it isn't, clearing and trimming continue as before, and the open round still has its reasoning.

---

*(End of Concept 4 — final concept of Lesson 4. The lesson continues with the recap and comprehensive sandbox.)*
