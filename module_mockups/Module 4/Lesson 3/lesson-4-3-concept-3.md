# Module 4, Lesson 3 — Concept 3: Where Lesson 2's techniques stand, and the fights ahead

---

## Checking last lesson's work against the cache

[Lesson 2](→ this module, context that fits but still hurts lesson) added two things to what the agent sends: a re-anchored plan at the end, and pruning of superseded tool results. Both improve what the model sees. [The previous concept](→ this lesson, what makes an agent cache friendly and what breaks it concept) gave a way to check what each costs in cache reuse. Here are both checked.

## Re-anchoring: nearly free

The anchor is added to the last message of each request and never saved into the history. So on the next turn, that message is sent again *without* the anchor:

```python
SYSTEM = "You are the registry assistant."
plan = ToolUseBlock(name="update_plan", input={"plan": "[ ] check research_agent\n[ ] report"})
history = [{"role": "user", "content": "Check research_agent."},
           {"role": "assistant", "content": [plan]},
           {"role": "user", "content": [{"type": "tool_result", "tool_use_id": plan.id, "content": "plan saved"}]}]
turn_1 = assemble_context(history)

call = ToolUseBlock(name="get_status", input={"agent_name": "research_agent"})
history = history + [{"role": "assistant", "content": [call]},
                     {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": "healthy"}]}]
turn_2 = assemble_context(history)

result = first_divergence({"tools": [], "system": SYSTEM, "messages": turn_1},
                          {"tools": [], "system": SYSTEM, "messages": turn_2})
print(result, f"-- turn 1 sent {len(turn_1)} messages")
```
```
{'diverges_at': 'messages[2]', 'reusable_tokens': 63} -- turn 1 sent 3 messages
```
*(runs live, shows output — read-only demo snippet, not graded; `assemble_context` is Lesson 2's)*

Turn 2's request diverges at `messages[2]`, the message that carried turn 1's anchor. Everything before it is reused; that one message, and what's new, is processed again. That's the whole cost: one message per turn, however long the history grows. For the benefit of keeping the current plan right beside the next decision, that's a good trade, and it's the best available one. Saving the anchor into the history instead would avoid the miss, but every turn would then leave an old copy of the plan behind, bringing back exactly the stale content Lesson 2 removed.

## Pruning: expensive if done every turn

Pruning is different. It edits a tool result *in the middle* of the history, and [everything after an edit is processed again](→ this lesson, what makes an agent cache friendly and what breaks it concept). Done every turn, every new supersession means another edit, and another large reprocessing.

Here's the registry agent watching three agents through a rollout, checking each one's status round after round, with each new result superseding the previous one for that agent. The same run is sent three ways: never pruned, pruned every turn, and pruned in batches, only once enough stale content has built up:

```python
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

def stale_tokens(messages: list) -> int:
    return count_tokens(messages) - count_tokens(prune_superseded(messages))

class BatchPruner:
    """Sends the history append-only, and prunes only once enough stale content has built up."""
    def __init__(self, threshold: int):
        self.threshold = threshold
        self.view = []

    def prepare(self, history: list) -> list:
        view = self.view + history[len(self.view):]
        if stale_tokens(view) >= self.threshold:
            view = prune_superseded(view)
        self.view = view
        return view
```

```python
TOOLS = [{"name": "get_status", "description": "An agent's health.", "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}}}]
SYSTEM = "You are the registry assistant, watching agents during a rollout."

# a long watch: the same three agents' status checked round after round, each result superseding the last
history = [{"role": "user", "content": "Watch research_agent, support_agent and billing_agent through the rollout."}]
snapshots = []
for round_number in range(1, 9):
    for agent in ["research_agent", "support_agent", "billing_agent"]:
        call = ToolUseBlock(name="get_status", input={"agent_name": agent})
        report = f"{agent} round {round_number}: " + "p50 410ms p99 1.2s errors 0.1% " * 12
        history = history + [{"role": "assistant", "content": [call]},
                             {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": report}]}]
        snapshots.append(history)

def run(policy) -> tuple:
    requests = [{"tools": TOOLS, "system": SYSTEM, "messages": policy(h)} for h in snapshots]
    final_stale = stale_tokens(requests[-1]["messages"])
    return cost_of_run(requests, read_multiplier=0.1, write_multiplier=1.25), final_stale

batcher = BatchPruner(threshold=1_000)
for label, policy in [("never prune", lambda h: h),
                      ("prune every turn", prune_superseded),
                      ("prune in batches", batcher.prepare)]:
    cost, stale = run(policy)
    print(f"{label:17} cost {cost:>7,} token-units   stale tokens still sent at the end: {stale:>5,}")
```
```
never prune       cost   9,741 token-units   stale tokens still sent at the end: 1,650
prune every turn  cost  16,721 token-units   stale tokens still sent at the end:     0
prune in batches  cost  10,345 token-units   stale tokens still sent at the end:   628
```
*(runs live, shows output — read-only demo snippet, not graded; cost uses the same example multipliers as Concept 1, and `prune_superseded` is Lesson 2's)*

Pruning every turn removes all the stale content, and costs **72% more** than never pruning, because nearly every request edits something in the middle. Never pruning is cheapest and leaves the most misleading content in front of the model. Batching sits between them: about 6% more than never pruning, while cutting the stale content still sent by more than half.

`BatchPruner` keeps its own `view`, the version of the history it last sent. Between batches, new messages are simply appended to that view, so each request is a pure append for the cache. When stale content reaches the threshold, the view is pruned all at once, costing one reprocessing instead of many, and after that new messages append to the *pruned* view, so the saving holds.

There's no universally right threshold. It's the trade this whole module keeps making: [quality](→ this module, context that fits but still hurts lesson, agents get worse before the window is full concept) (less stale content in front of the model) against cost (more reprocessing), and the right setting depends on how misleading the stale content is and how much the cache is worth in your setup. What's universal is the shape of the answer: **edits to the history should be occasional and batched, never routine.**

## Two fights ahead

Two techniques later in this module run straight into this lesson, and it's better to name them now than to meet them by surprise:

- **Compaction** ([Lesson 5](→ this module, compaction and summarization lesson)) replaces a long run of old turns with a short summary. That's an edit near the *start* of the history, so the cache is lost from that point on. It has to be an occasional, deliberate operation, exactly like batched pruning, never something done every turn.
- **Loading tools only when needed** ([Lesson 7](→ this module, just in time context and dynamic tool exposure lesson)) wants the tool list to change during a run, and tool definitions come first in every request, so changing them invalidates everything. The workable approaches add new definitions without rewriting the ones already sent. Some providers now support exactly this, letting a tool definition be added partway through a conversation instead of by editing the tool list. Lesson 7 comes back to it.

Both come down to the same tension this lesson has been about: the most useful thing to send and the cheapest thing to send are not always the same, and the design job is to choose deliberately, with the cost measured, rather than by accident.

---

## Quiz cards

> **Q1.** What does re-anchoring cost in cache reuse each turn?
> - A) The whole history is reprocessed every turn
> - B) Nothing at all
> - C) One message: the one that carried last turn's anchor is sent without it, so it and everything new are processed again ✅
> - D) The tool definitions are reprocessed
>
> *Explanation:* The anchor lives only in the last message and is never saved. That message differs next turn, but everything before it is still reused.

> **Q2.** Why not save the anchor into the history to avoid that one-message miss?
> - A) Every turn would leave an old copy of the plan behind, bringing back the stale content Lesson 2 removed ✅
> - B) The API rejects anchors in the history
> - C) Saved anchors can't be read by the model
> - D) It would change the tool definitions
>
> *Explanation:* The small cache cost buys a single, current plan. Saving it would trade that for a pile of outdated plans.

> **Q3.** In the rollout demo, why does pruning every turn cost 72% more than never pruning?
> - A) Pruning adds tokens to the history
> - B) Nearly every request edits a result in the middle, so everything after that edit has to be processed again ✅
> - C) Pruned results can't be cached
> - D) Pruning changes the system prompt
>
> *Explanation:* A cache only reuses up to the first change. Frequent edits in the middle keep resetting that point.

> **Q4.** Why does `BatchPruner` append new messages to its *pruned* view after a batch, rather than to the raw history?
> - A) The raw history is deleted after pruning
> - B) So the next request is a pure append of what was just sent, keeping the cache valid until the next batch ✅
> - C) So pruned results are restored
> - D) To make the history shorter
>
> *Explanation:* The cache compares against what was actually sent. Building on the pruned view keeps each later request an exact extension of it.

> **Q5.** Why must compaction be an occasional operation rather than a per-turn one?
> - A) Summaries are expensive to write
> - B) It edits the history near its start, which invalidates the cache from that point on, so doing it every turn would lose the cache every turn ✅
> - C) Models can only read one summary
> - D) It changes the tool definitions
>
> *Explanation:* It's the same rule as pruning, applied to a bigger edit: changes to the history should be deliberate and batched, not routine.

---

## Applied sandbox exercise

*(graded — pruning in batches)*

**Task shown to learner:** `prune_superseded` from Lesson 2 and `count_tokens` are provided. Implement:

- **`stale_tokens(messages)`:** how many tokens pruning would save: the tokens in `messages` minus the tokens in `prune_superseded(messages)`.
- **`BatchPruner(threshold)`** with a `prepare(history)` method that returns the messages to send:
  - Keep `self.view`, the messages last sent, starting empty.
  - Build this turn's view by taking `self.view` and appending every message of `history` beyond its length, unchanged.
  - If that view's `stale_tokens` has reached `threshold`, prune it with `prune_superseded`.
  - Store the result as `self.view` and return it.
  - Never modify `history`.

**Starter code:**
```python
def stale_tokens(messages: list) -> int:
    # TODO
    ...

class BatchPruner:
    def __init__(self, threshold: int):
        # TODO
        ...

    def prepare(self, history: list) -> list:
        # TODO: append new messages to the last view; prune only once enough is stale
        ...
```

**Hidden tests:**
```python
def turn(agent, text):
    call = ToolUseBlock(name="get_status", input={"agent_name": agent})
    return [{"role": "assistant", "content": [call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": text}]}]

def req(msgs):
    return {"tools": [], "system": "s", "messages": msgs}

h1 = [{"role": "user", "content": "watch"}] + turn("a", "a v1 " + "x" * 400)
h2 = h1 + turn("b", "b v1")
h3 = h2 + turn("a", "a v2 " + "y" * 400)     # supersedes a v1 (about 100 stale tokens)
h4 = h3 + turn("a", "a v3 " + "z" * 400)     # supersedes a v2 as well

# 1. stale_tokens: zero until something is superseded, then the tokens pruning would save
assert stale_tokens(h2) == 0
assert stale_tokens(h3) == count_tokens(h3) - count_tokens(prune_superseded(h3)) > 0

# 2. below the threshold, the view is the history, appended as-is: a pure append for the cache
p = BatchPruner(threshold=10_000)
v1, v2, v3 = p.prepare(h1), p.prepare(h2), p.prepare(h3)
assert v3 == h3
assert first_divergence(req(v1), req(v2))["diverges_at"] is None
assert first_divergence(req(v2), req(v3))["diverges_at"] is None

# 3. once stale content reaches the threshold, the view is pruned, in one go
p = BatchPruner(threshold=150)
p.prepare(h1); p.prepare(h2); p.prepare(h3)          # about 100 stale: not yet
v4 = p.prepare(h4)                                    # about 200 stale: prune now
assert stale_tokens(v4) == 0
assert v4[2]["content"][0]["content"].startswith("[superseded") and v4[6]["content"][0]["content"].startswith("[superseded")

# 4. after a prune, later turns append to the PRUNED view, so the next request is a pure append again
h5 = h4 + turn("b", "b still fine")
v5 = p.prepare(h5)
assert first_divergence(req(v4), req(v5))["diverges_at"] is None
assert v5[:len(v4)] == v4

# 5. the history itself is never changed, and every pair survives in the view
assert h4[2]["content"][0]["content"].startswith("a v1")
ids = [b.id for m in v5 if m["role"] == "assistant" for b in m["content"]]
res = [b["tool_use_id"] for m in v5 if m["role"] == "user" and isinstance(m["content"], list) for b in m["content"]]
assert ids == res and len(v5) == len(h5)
```

**Hint (shown on request):** `history[len(self.view):]` is exactly the messages added since the last call, so `self.view + history[len(self.view):]` extends the previous view without touching what was already sent. `prune_superseded` returns a new list, so the history stays untouched.

**Reference solution:**
```python
def stale_tokens(messages: list) -> int:
    return count_tokens(messages) - count_tokens(prune_superseded(messages))

class BatchPruner:
    """Sends the history append-only, and prunes only once enough stale content has built up."""
    def __init__(self, threshold: int):
        self.threshold = threshold
        self.view = []

    def prepare(self, history: list) -> list:
        view = self.view + history[len(self.view):]
        if stale_tokens(view) >= self.threshold:
            view = prune_superseded(view)
        self.view = view
        return view
```

**Explanation:** Tests 2 and 4 are the reason the class exists: between batches, and after one, each request is a pure append of the last, which `first_divergence` confirms. Test 3 shows the batch itself: nothing happens while stale content is under the threshold, then two superseded results are replaced in one go, costing one reprocessing instead of two. Test 5 checks the two guarantees every technique in this module keeps: the history is never changed, and every tool call keeps its result.

---

*(End of Concept 3 — final concept of Lesson 3. The lesson continues with the recap and comprehensive sandbox.)*
