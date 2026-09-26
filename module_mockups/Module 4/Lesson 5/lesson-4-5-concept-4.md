# Module 4, Lesson 5 — Concept 4: When to compact, and what it costs

> **Note for the site build:** this concept's demo setup is the lesson's setup so far, plus `Compactor` (first code block below) and Lesson 3's `cost_of_run`. The exercise provides `count_tokens`, `strip_old_thinking`, `clear_old_results`, `summary_request` and `compact` as read-only code, plus `ToolUseBlock` and `ThinkingBlock`.

---

## A token trigger, not a turn count

"Compact every 30 turns" is the obvious trigger, and it's the wrong unit. [Lesson 1](→ this module, context as a budget lesson, watching it grow across the loop concept) showed that tool results dominate an agent's growth, and they vary enormously: a status check might add 50 tokens and a log dump 5,000. A fixed turn count compacts too early on a run of small results, losing detail for no reason, and too late on a run of large ones.

Compaction should be triggered by the thing it manages: the size of the request, measured with `count_tokens`. There are two limits worth distinguishing:

- **The capacity limit** is the budget from [Lesson 4](→ this module, when the history wont fit lesson, cutting whole rounds not messages concept): the window minus the system prompt, the tools and the reply room. Past it, the request fails.
- **A quality limit** can sit well below it, because models get worse as their context grows, even when everything fits. That was [Lesson 2's evidence](→ this module, context that fits but still hurts lesson). Claude's server-side compaction, for example, defaults to triggering at 150,000 input tokens, far below its newest models' 1M-token windows, and its documentation gives degrading response quality as the reason. Where to set your own quality limit depends on your model and your tasks, so it should be measured, not guessed.

Lesson 2's other warning signs (stale results, instructions that contradict each other) already have cheaper remedies: pruning, clearing, and restating the current rules. They don't call for compaction by themselves. Compaction is for when the history is too large even after those have done their work.

## The order, in one place

Put together, each time the history goes over budget:

1. **Strip old reasoning, then clear old results.** If that brings the history under the low-water mark, stop there.
2. **Compact** if it doesn't: summarize the older rounds, keep the newest few.
3. **Trim whole rounds** only if there's nothing left to summarize.

As in [Lesson 4's `HistoryFitter`](→ this module, when the history wont fit lesson, clear before you cut and cut in batches concept, fit in batches not every turn), this only happens when the history is over budget, and the result is sent append-only until it's over budget again:

```python
class Compactor:
    """Sends the history append-only. Over budget: strip and clear first; compact only if that isn't enough."""
    def __init__(self, budget: int, low_water: int, keep_last: int, keep_recent: int, summarize):
        self.budget = budget
        self.low_water = low_water
        self.keep_last = keep_last
        self.keep_recent = keep_recent
        # summarize(request_messages) -> summary text: a model call in a real agent
        self.summarize = summarize
        self.view = []
        self.seen = 0
        self.compactions = 0

    def prepare(self, history: list) -> list:
        view = self.view + history[self.seen:]
        if count_tokens(view) > self.budget:
            view = clear_old_results(strip_old_thinking(view), self.keep_last)
            if count_tokens(view) > self.low_water:
                summary = self.summarize(summary_request(view, self.keep_recent))
                view = compact(view, summary, self.keep_recent)
                self.compactions += 1
        self.view = view
        self.seen = len(history)
        return view
```

## What compaction costs

Here's a 120-round investigation run three ways, with each summary request counted as a request of its own. The summaries are placeholders of realistic length, so this measures cost only:

```python
TOOLS = [{"name": "get_logs", "description": "Recent logs for an agent.", "input_schema": {"type": "object", "properties": {}}}]
SYSTEM = "You are the registry assistant, investigating a slow support queue."

# a long investigation: 120 rounds, each result about 450 tokens
history = [{"role": "user", "content": "Find out why the support queue is slow, checking every agent's logs."}]
snapshots = []
for n in range(120):
    agent = ["research_agent", "support_agent", "billing_agent", "triage_agent", "search_agent"][n % 5]
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    history = history + [{"role": "assistant", "content": [TextBlock(text=f"Checking {agent}, pass {n // 5 + 1}."), call]},
                         {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id,
                                                       "content": f"{agent} pass {n // 5 + 1}\n" + f"{agent} INFO handled in 412ms\n" * 60}]}]
    snapshots.append(history)

def run(policy, separate_summarizer=False):
    """Every request the policy sends, summary requests included, and what they cost."""
    requests = []
    def summarize(request_messages):
        if separate_summarizer:
            requests.append({"tools": [], "system": "You summarize agent transcripts.", "messages": request_messages})
        else:
            requests.append({"tools": TOOLS, "system": SYSTEM, "messages": request_messages})
        # stands in for the model's reply: a summary of realistic length
        return "Checked research, support, billing, triage and search agents; all logs normal so far. " * 4
    context = policy(summarize)
    for h in snapshots:
        requests.append({"tools": TOOLS, "system": SYSTEM, "messages": context.prepare(h)})
    sent = sum(count_tokens(r["messages"]) for r in requests)
    return cost_of_run(requests, 0.1, 1.25), context.compactions, sent

BUDGET = 12_000
policies = [
    ("clear first, then compact", lambda s: Compactor(BUDGET, int(BUDGET * 0.6), keep_last=3, keep_recent=2, summarize=s), False),
    ("compact first", lambda s: Compactor(BUDGET, 0, keep_last=10_000, keep_recent=2, summarize=s), False),
    ("compact first, separate call", lambda s: Compactor(BUDGET, 0, keep_last=10_000, keep_recent=2, summarize=s), True),
]
for label, policy, separate in policies:
    cost, compactions, sent = run(policy, separate)
    print(f"{label:29} cost {cost:>8,}   tokens sent {sent:>9,}   compactions {compactions:>2}")

# the model above counts input only; each summary is also output, billed higher
# (on Claude Opus 5.5, for example, output costs five times input)
clear_cost, clear_n, _ = run(policies[0][1], False)
compact_cost, compact_n, _ = run(policies[1][1], False)
for summary_tokens in [300, 1_000, 3_000]:
    a = clear_cost + clear_n * summary_tokens * 5
    b = compact_cost + compact_n * summary_tokens * 5
    print(f"with {summary_tokens:>5,}-token summaries: clear first {a:>8,}   compact first {b:>8,}")
```
```
clear first, then compact     cost  209,210   tokens sent   942,431   compactions  1
compact first                 cost  189,556   tokens sent   863,074   compactions  7
compact first, separate call  cost  273,996   tokens sent   863,074   compactions  7
with   300-token summaries: clear first  210,710   compact first  200,056
with 1,000-token summaries: clear first  214,210   compact first  224,556
with 3,000-token summaries: clear first  224,210   compact first  294,556
```
*(runs live, shows output — read-only demo snippet, not graded; costs are in the token-units of Lesson 3's model, with the same example multipliers, and the summaries are placeholders)*

Three results, one of which isn't what this lesson set out to show:

- **Ask for the summary inside the conversation.** Sending the summary request as a separate call, with its own system prompt and no tools, cost about 45% more than sending it as [the previous concept built it](→ this lesson, compacting a summary in rounds out concept, how to ask say what must survive): the agent's own prefix with instructions added at the end. The separate call can't reuse anything the agent's requests cached.
- **Counting input alone, compacting early is cheaper.** Compacting first, without clearing, made seven compactions against one, and still sent fewer tokens overall. Each compaction shrinks every request after it, while a cleared history hovers near the budget. So compaction is the most expensive single edit, as [the first concept of this lesson](→ this lesson, what clearing cant do concept, where compaction fits) said, but not necessarily the most expensive policy.
- **Each summary is also output, which costs more.** On Claude Opus 5.5, for example, output tokens cost five times as much as input. Counted at that ratio, compacting first stays cheaper only while summaries are under about 650 tokens. Real summaries of long agent runs are often longer: Claude's own compaction documentation shows one example compaction producing 3,500 output tokens.

So the case for clearing first is not mainly about token cost, which depends on summary length and prices. It's about what each stage loses. Clearing loses nothing that can't be fetched again. Every compaction is a lossy rewrite ([the previous concept](→ this lesson, when a summary loses something concept)), and in the JetBrains study, summarizing agents also [ran longer](→ this lesson, what clearing cant do concept, what the evidence says about summarizing). This demo can't measure either effect, because the fake client isn't a real model.

## Letting the provider compact

Several providers can now compact on their side. Claude's API, for example, has **compaction at a token threshold** (a beta, the `compact_20260112` strategy with the `compact-2026-01-12` header):

- **The trigger is input tokens.** It defaults to 150,000 and can't be set below 50,000.
- **The summary comes back as a `compaction` block** in the response. You append the response as usual, and on later requests the API ignores everything before that block.
- **`instructions` replaces the default summary prompt** entirely, so if you write your own, include everything [a summary must carry](→ this lesson, compacting a summary in rounds out concept, how to ask say what must survive).
- **`pause_after_compaction`** returns right after the summary, so you can put recent messages back after it: the keep-tail form. The same thinking caveat applies to those messages as in [Lesson 4](→ this module, when the history wont fit lesson, reasoning travels with its tool call concept, when the provider binds reasoning to everything before it).
- **The docs flag the same failure as the previous concept:** with tools defined, the model occasionally calls a tool instead of summarizing, and they suggest instructions that say not to.

The provider's summary is still a summary. Everything in this lesson about what it can lose, and about restating what code can derive, applies to it just the same.

## Beyond one context window

Compaction keeps one agent's context small by rewriting its history. The other way is to never let the mess in: hand a messy exploration to a sub-agent that works in its own context window and returns only a condensed result. The main agent's context sees the result, never the exploration. That's the subject of Module 8, and it's a design choice as much as a context technique.

---

## Quiz cards

> **Q1.** Why is a fixed turn count a poor compaction trigger?
> - A) Turn counts can't be measured reliably
> - B) Turns vary hugely in size, so a fixed count compacts too early on small turns and too late on large ones ✅
> - C) The API resets the turn count after each request
> - D) Compaction can only run on even turns
>
> *Explanation:* The history's size is set mostly by tool results, which can differ by a hundred times. Measuring tokens triggers compaction at the point it's actually needed.

> **Q2.** Why might you compact below the capacity limit, while the request still fits?
> - A) Models get worse as context grows, so a lower quality limit can be worth it ✅
> - B) Requests near the limit are rejected at random
> - C) The cache only works on small requests
> - D) Compaction is cheaper on short histories
>
> *Explanation:* Fitting and working well are different things, which was Lesson 2's point. Claude's server-side compaction defaults to triggering far below its newest models' windows for this reason.

> **Q3.** Why did sending the summary request as a separate call, with its own system prompt, cost so much more?
> - A) Separate calls use a more expensive model
> - B) The separate call produced a longer summary
> - C) Its prefix differs from the start, so nothing the agent's requests cached could be reused ✅
> - D) Separate calls can't use the cache at all
>
> *Explanation:* The in-conversation request is the agent's own prefix with instructions added at the end, so almost all of it is read from the cache. A new system prompt and tool list break the match at the very beginning.

> **Q4.** In the demo, compacting first sent fewer tokens than clearing first. Why does the lesson still clear first?
> - A) The demo's numbers were wrong
> - B) Clearing always costs less once output is counted
> - C) Compacting first needs a larger window
> - D) Clearing loses nothing that can't be fetched again, while each compaction is a lossy rewrite, and summarizing agents ran longer in the JetBrains study ✅
>
> *Explanation:* Whether compacting first is cheaper depends on summary length and output price. The reasons to prefer clearing are about quality, which a token count can't measure.

> **Q5.** With Claude's threshold compaction, what happens to the messages before the `compaction` block on later requests?
> - A) The API ignores them, and continues from the summary ✅
> - B) They're summarized again on every request
> - C) They're kept, and the summary is added alongside
> - D) The request is rejected until you delete them
>
> *Explanation:* You can keep the old messages in your list or drop them yourself; either way, the API uses only the compaction block onward. That's the same shape as compaction on the client: a summary replacing what came before.

---

## Applied sandbox exercise

*(graded — the compaction trigger)*

**Task shown to learner:** `count_tokens`, `strip_old_thinking`, `clear_old_results`, `summary_request` and `compact` are provided. Implement **`next_step(view, budget, low_water, keep_last, keep_recent)`**, which decides what the context step should do with a view, without changing it:

- **`"send"`** if the view is within `budget`.
- **`"clear"`** if, after stripping old reasoning and clearing all but the newest `keep_last` results, it's within `low_water`.
- **`"trim"`** if that isn't enough and `summary_request` finds nothing to summarize with `keep_recent` rounds kept.
- **`"compact"`** otherwise.

**Provided code:** `strip_old_thinking` and `clear_old_results` from Lesson 4, `summary_request` and `compact` from this lesson, and the fake client's `count_tokens`, `ToolUseBlock` and `ThinkingBlock`.

**Starter code:**
```python
def next_step(view: list, budget: int, low_water: int, keep_last: int, keep_recent: int) -> str:
    # TODO: "send" if it fits; "clear" if stripping and clearing reach the low-water mark;
    #       "trim" if nothing is left to summarize; otherwise "compact"
    ...
```

**Hidden tests:**
```python
def round_of(agent, size, thought=""):
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    content = ([ThinkingBlock(thinking=thought)] if thought else []) + [call]
    return [{"role": "assistant", "content": content},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": "x" * size}]}]

task = {"role": "user", "content": "Investigate."}
view = [task]
for i in range(6):
    view += round_of(f"agent_{i}", 2_000, thought="y" * 400)
full = count_tokens(view)
cleared = count_tokens(clear_old_results(strip_old_thinking(view), 2))

# 1. under budget: nothing to do
assert next_step(view, full, 0, keep_last=2, keep_recent=2) == "send"

# 2. over budget, but stripping and clearing get it under the low-water mark: clear
assert next_step(view, full - 1, cleared, keep_last=2, keep_recent=2) == "clear"

# 3. stripping and clearing aren't enough: compact
assert next_step(view, full - 1, cleared - 1, keep_last=2, keep_recent=2) == "compact"

# 4. old reasoning counts toward what clearing can recover: without stripping it, this would compact
assert next_step(view, full - 1, cleared + 10, keep_last=2, keep_recent=2) == "clear"
assert count_tokens(clear_old_results(view, 2)) > cleared + 10

# 5. nothing left to summarize (every round must be kept): fall back to trimming
assert next_step(view, full - 1, 10, keep_last=2, keep_recent=6) == "trim"

# 6. the view itself is never changed
assert count_tokens(view) == full
```

**Hint (shown on request):** Compute the stripped-and-cleared view once, and compare its size with `low_water`, not `budget`: the point of the low-water mark is to leave room for several turns before the next fit. `summary_request` returns `None` when `keep_recent` covers every round.

**Reference solution:**
```python
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
```

**Explanation:** Tests 2 and 3 check the low-water boundary: clearing is enough when it gets the view to the mark, and compaction takes over one token past it. A version that compares with the budget instead would clear in cases where the next turn would be over budget again. Test 4 checks that old reasoning is stripped before judging whether clearing is enough; without it, this view would be compacted unnecessarily. Test 5 is the fallback: when every round has to be kept, there's nothing to summarize, and only Lesson 4's trimming is left.

---

*(End of Concept 4 — final concept of Lesson 5. The lesson continues with the recap and comprehensive sandbox.)*
