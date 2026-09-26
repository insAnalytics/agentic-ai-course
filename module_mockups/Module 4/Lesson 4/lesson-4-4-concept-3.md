# Module 4, Lesson 4 — Concept 3: Clear before you cut, and cut in batches

> **Note for the site build:** the cache demo in this concept needs Lesson 3's `serialize`, `first_divergence` and `cost_of_run` in its setup, exactly as Lesson 3 defines them, plus `split_rounds` and `trim_to_fit` from Concept 2 and `clear_old_results`, `fit` and `HistoryFitter` from this concept. From this concept on, the lesson's demo setup is `... + WINDOWED_CLIENT + CHECK_PAIRING` plus those functions. The exercise provides `count_tokens`, `is_tool_results`, `check_pairing`, `split_rounds` and `trim_to_fit` (Concept 2's reference solution) as read-only code.

---

## Dropping a round loses the call too

[Cutting whole rounds](→ this lesson, cutting whole rounds not messages concept) keeps the history valid, but it removes more than it needs to. The bulk of a round is its tool result. The call is a few dozen tokens, and it's the record that the work was done. Drop both, and the model can't see that it ever checked those agents.

**Clearing** takes out only the bulk: an old tool result's content is replaced with a short placeholder, and everything else stays where it was. The call, the result block and its id all remain, so the pairing can't break, and the model still sees every step it took. It's the same move [Lesson 2's pruning](→ this module, context that fits but still hurts lesson, what goes stale in a scratchpad concept) made, for a different reason: pruning replaces a result a later call superseded, clearing replaces a result that's simply old.

Two choices in the version below come straight from Lesson 2:

- **Failed results are never cleared.** They're short, and they steer the model away from repeating a failed action.
- **The placeholder says what was there and how to get it back.** The model reads it like any other text, so it should know it can call the tool again.

```python
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
                if not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                if not block.get("is_error") and block["tool_use_id"] not in to_keep:
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
```

`fit` puts the two techniques in order: nothing happens while the messages fit; clearing comes first; rounds are dropped only if clearing wasn't enough. It reuses `trim_to_fit` from the previous concept.

## Clearing in the loop

The same six-agent run, with `fit` in place of `trim_to_fit`, keeping the two newest results in full:

```python
SYSTEM_PROMPT = "You are the registry assistant. Investigate agent health using the monitoring tools, then summarise."
TOOLS = [{"name": "monitoring__get_logs", "description": "Recent log lines for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}}]

def get_logs(agent_name: str) -> str:
    line = f"2026-09-25T10:00:00Z {agent_name} INFO request handled in 412ms status=200 route=/v1/answer\n"
    return line * 70

AGENTS = ["research_agent", "support_agent", "billing_agent", "triage_agent", "search_agent", "report_agent"]
llm = WindowedClient([[ToolUseBlock(name="monitoring__get_logs", input={"agent_name": a})] for a in AGENTS]
                     + [[TextBlock(text="All six agents look healthy.")]], window=8_000)

WINDOW, MAX_TOKENS = 8_000, 1_500
budget = WINDOW - count_tokens(SYSTEM_PROMPT) - count_tokens(TOOLS) - MAX_TOKENS

history = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
while True:
    to_send = fit(history, budget, keep_last=2)
    assert check_pairing(to_send) == []
    print(f"history {count_tokens(history):>6,} tokens -> sent {len(to_send):>2} messages, {count_tokens(to_send):>5,} tokens")
    response = llm.create(messages=to_send, tools=TOOLS, system=SYSTEM_PROMPT)
    history.append({"role": "assistant", "content": response.content})
    calls = [b for b in response.content if b.type == "tool_use"]
    if not calls:
        break
    history.append({"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": c.id, "content": get_logs(**c.input)} for c in calls]})

last = llm.seen[-1]
calls_seen, full_results = 0, 0
for m in last:
    if m["role"] == "assistant":
        calls_seen += len([b for b in m["content"] if b.type == "tool_use"])
    if is_tool_results(m):
        full_results += len([b for b in m["content"] if not b["content"].startswith("[cleared")])
print(f"last request: {calls_seen} of {len(AGENTS)} calls visible, {full_results} results in full")
print("a cleared result reads:", last[2]["content"][0]["content"])
```
```
history     26 tokens -> sent  1 messages,    26 tokens
history  1,753 tokens -> sent  3 messages, 1,753 tokens
history  3,463 tokens -> sent  5 messages, 3,463 tokens
history  5,172 tokens -> sent  7 messages, 5,172 tokens
history  6,864 tokens -> sent  9 messages, 3,617 tokens
history  8,556 tokens -> sent 11 messages, 3,694 tokens
history 10,248 tokens -> sent 13 messages, 3,789 tokens
last request: 6 of 6 calls visible, 2 results in full
a cleared result reads: [cleared: an earlier monitoring__get_logs result, removed to save space. Call monitoring__get_logs again if you need it.]
```
*(runs live, shows output — read-only demo snippet, not graded; the model's replies are scripted, and the window is deliberately tiny)*

Compared with [trimming alone](→ this lesson, cutting whole rounds not messages concept, the fix in the loop), the final request is smaller (about 3,800 tokens against 5,100) and it lost less: all six calls are still visible, and no round had to be dropped. The model can see that it read every agent's logs, and that it has the last two in full.

Clearing assumes a result can be fetched again. Logs and status checks can. Some results can't, or shouldn't be: a one-off query, a page that has changed since, a slow or paid call. Those are better kept, or written somewhere the agent can read back from, which is [Lesson 6's subject](→ this module, offloading context to storage and note taking lesson).

## Fit in batches, not every turn

`fit` as used above runs on every turn. Once the history is over budget, every new turn pushes one more result past the `keep_last` line, so every request clears a different result. By [Lesson 3's rule](→ this module, prompt caching lesson, what makes an agent cache friendly and what breaks it concept), an edit in the middle of the history means everything after it is processed again, every turn.

The fix is the one [`BatchPruner`](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept) used. Keep the version of the history last sent, append new messages to it, and only fit when it goes over budget. When it does, fit down to a **low-water mark** well below the budget, so the next several turns are pure appends:

```python
class HistoryFitter:
    """Sends the history append-only, and fits it only when it's over budget, down to a lower target."""
    def __init__(self, budget: int, low_water: int, keep_last: int):
        self.budget = budget
        self.low_water = low_water
        self.keep_last = keep_last
        self.view = []
        self.seen = 0

    def prepare(self, history: list) -> list:
        view = self.view + history[self.seen:]
        if count_tokens(view) > self.budget:
            view = fit(view, self.low_water, self.keep_last)
        self.view = view
        self.seen = len(history)
        return view
```

One change from `BatchPruner`: it tracked new messages by `len(self.view)`, which works when the view is always as long as the history. Once rounds can be dropped, the view gets shorter, so the fitter counts what it has already seen in `self.seen` instead.

Here's a long watch of 30 status checks, sent three ways, with Lesson 3's cost model:

```python
TOOLS = [{"name": "get_status", "description": "An agent's health.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}}}]
SYSTEM = "You are the registry assistant, watching agents during a rollout."

# a long watch: 30 status checks, each result about 190 tokens
history = [{"role": "user", "content": "Watch research_agent, support_agent and billing_agent through the rollout."}]
snapshots = []
for check in range(1, 31):
    agent = ["research_agent", "support_agent", "billing_agent"][check % 3]
    call = ToolUseBlock(name="get_status", input={"agent_name": agent})
    report = f"{agent} check {check}: " + "p50 410ms p99 1.2s errors 0.1% " * 20
    history = history + [{"role": "assistant", "content": [call]},
                         {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": report}]}]
    snapshots.append(history)

BUDGET = 3_000
fitter = HistoryFitter(budget=BUDGET, low_water=1_800, keep_last=3)
policies = [("trim every turn", lambda h: trim_to_fit(h, BUDGET)),
            ("fit every turn", lambda h: fit(h, BUDGET, keep_last=3)),
            ("fit in batches", fitter.prepare)]
for label, policy in policies:
    requests = [{"tools": TOOLS, "system": SYSTEM, "messages": policy(h)} for h in snapshots]
    edits = 0
    for i in range(1, len(requests)):
        if first_divergence(requests[i - 1], requests[i])["diverges_at"] is not None:
            edits += 1
    largest = max(count_tokens(r["messages"]) for r in requests)
    cost = cost_of_run(requests, read_multiplier=0.1, write_multiplier=1.25)
    print(f"{label:16} cost {cost:>6,} token-units   turns that broke the prefix: {edits:>2}   largest request: {largest:,}")
```
```
trim every turn  cost 67,393 token-units   turns that broke the prefix: 17   largest request: 2,929
fit every turn   cost 27,456 token-units   turns that broke the prefix: 17   largest request: 2,967
fit in batches   cost 19,002 token-units   turns that broke the prefix:  3   largest request: 2,996
```
*(runs live, shows output — read-only demo snippet, not graded; cost uses the same example multipliers as Lesson 3, and the demo measures what's sent, not how well a model would do with it)*

- **Trimming every turn** is the worst. Once the history is over budget, every request drops a different round right after the task, so almost nothing is reused.
- **Fitting every turn** is much cheaper, because clearing keeps the early messages in place and the change lands further in. It still breaks the prefix on every turn once the history is full.
- **Fitting in batches** breaks the prefix only 3 times in 30 turns. It costs about 31% less than fitting every turn, and about 72% less than trimming every turn. Every request stayed under the same budget in all three.

The low-water mark is the setting that matters. Set it lower and batches happen less often, but right after each one the model sees less of its history. Set it close to the budget and the fitter runs nearly every turn, which is the per-turn case above. It's [Lesson 3's trade](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept) again: edits to the history should be occasional and deliberate, never routine.

---

## Quiz cards

> **Q1.** Why does clearing an old tool result lose less than dropping its round?
> - A) Clearing compresses the result, so its content can be restored later
> - B) The call and the result block stay in place, so the model still sees the step was taken and the pairing holds ✅
> - C) Cleared results don't count toward the context window
> - D) The API restores cleared results automatically when needed
>
> *Explanation:* Only the bulky content is replaced. What remains is small, keeps the history valid, and tells the model what it did and how to fetch it again. Nothing restores the content by itself: the model has to call the tool again.

> **Q2.** Why does `clear_old_results` leave failed results alone?
> - A) Errors are short, and they steer the model away from repeating an action that already failed ✅
> - B) The API rejects a placeholder in an error result
> - C) Failed results were never counted by `count_tokens`
> - D) Clearing an error would invalidate the tool call's id
>
> *Explanation:* That's Lesson 2's finding: keeping failures is useful, and they cost almost nothing. The large, successful results are where the space is.

> **Q3.** Once the history is over budget, why does running `fit` on every turn break the cache on every turn?
> - A) `fit` changes the system prompt each time it runs
> - B) Each new turn pushes another result past the `keep_last` line, so each request clears a different result in the middle ✅
> - C) Clearing reorders the messages
> - D) `fit` always drops the task message
>
> *Explanation:* The cache reuses a request only up to its first change. A per-turn fit makes a new change every turn, a little further along each time.

> **Q4.** `HistoryFitter` fits down to a low-water mark below the budget, not to the budget itself. What does that buy?
> - A) The request is always as small as possible
> - B) Room for several turns of pure appends before the next fit, so the prefix only changes occasionally ✅
> - C) It leaves space for the model's reply
> - D) It guarantees no round is ever dropped
>
> *Explanation:* Fitting exactly to the budget means the next turn is over again, so it fits every turn. The reply room is already outside the budget, subtracted when the budget was computed.

> **Q5.** Why does `HistoryFitter` count new messages with `self.seen`, where `BatchPruner` used `len(self.view)`?
> - A) Once rounds can be dropped, the view can be shorter than the history, so its length no longer marks where the new messages start ✅
> - B) `len` is slow on long histories
> - C) The history is rebuilt from scratch each turn
> - D) Cleared results change the view's length
>
> *Explanation:* Pruning and clearing keep every message, so the view and the history stay the same length. Dropping rounds breaks that, and `self.seen` records how much of the history has been taken in.

---

## Applied sandbox exercise

*(graded — clear old results, then cut if needed)*

**Task shown to learner:** `count_tokens`, `is_tool_results`, `check_pairing`, `split_rounds` and `trim_to_fit` are provided. Implement:

- **`clear_old_results(messages, keep_last)`:** return a new message list in which every successful tool result, except the newest `keep_last`, has its content replaced with `"[cleared: an earlier NAME result, removed to save space. Call NAME again if you need it.]"`, where NAME is the name of the tool that produced it.
  - Count results one by one, newest last. Parallel results in one message count separately.
  - A result with `"is_error": True` is never cleared, and doesn't count toward `keep_last`.
  - `keep_last=0` clears every successful result.
  - Keep every message and block in place, and never modify `messages` or the blocks in it.
- **`fit(messages, budget, keep_last)`:** if the messages fit, return a copy unchanged. Otherwise clear old results first, then pass the result to `trim_to_fit`.

**Provided code:** `is_tool_results` and `check_pairing`, and the reference `split_rounds` and `trim_to_fit`, all from the previous concept, and the fake client's `count_tokens`, `_plain` and `ToolUseBlock`.

**Starter code:**
```python
def clear_old_results(messages: list, keep_last: int) -> list:
    # TODO: 1) map each tool_use id to its tool name
    #       2) list the ids of successful results, oldest first, and pick the newest keep_last
    #       3) build a new list, replacing every other successful result's content
    ...

def fit(messages: list, budget: int, keep_last: int) -> list:
    # TODO: nothing if it fits; otherwise clear, then trim
    ...
```

**Hidden tests:**
```python
def exchange(pairs, is_error=False):
    calls, results = [], []
    for name, text in pairs:
        call = ToolUseBlock(name=name, input={})
        calls.append(call)
        result = {"type": "tool_result", "tool_use_id": call.id, "content": text}
        if is_error:
            result["is_error"] = True
        results.append(result)
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}]

task = {"role": "user", "content": "Check everything."}
history = ([task]
           + exchange([("get_logs", "logs one " + "x" * 400)])
           + exchange([("get_status", "status one " + "y" * 400), ("get_logs", "logs two " + "z" * 400)])
           + exchange([("get_status", "Error: status service timed out")], is_error=True)
           + exchange([("get_status", "status two " + "w" * 400)]))
def texts(messages):
    found = []
    for m in messages:
        if is_tool_results(m):
            for b in m["content"]:
                found.append(b["content"])
    return found

original_texts = texts(history)

# 1. only the newest keep_last successful results stay; the others become placeholders
out = clear_old_results(history, keep_last=2)
t = texts(out)
assert t[0].startswith("[cleared") and t[1].startswith("[cleared")
assert t[2] == original_texts[2] and t[4] == original_texts[4]

# 2. the placeholder names the tool whose result it replaces
assert "get_logs" in t[0] and "get_status" in t[1]

# 3. failed results are never cleared and don't use up keep_last
assert t[3] == "Error: status service timed out"

# 4. parallel results are counted one by one, including in the newest message
t = texts(clear_old_results(history, keep_last=1))
assert t[2].startswith("[cleared") and t[4] == original_texts[4]
ending_in_pair = [task] + exchange([("get_logs", "a" * 400)]) + exchange([("get_logs", "b" * 400), ("get_status", "c" * 400)])
t = texts(clear_old_results(ending_in_pair, keep_last=2))
assert t[0].startswith("[cleared") and t[1] == "b" * 400 and t[2] == "c" * 400

# 5. keep_last=0 clears every successful result
t = texts(clear_old_results(history, keep_last=0))
assert all(x.startswith("[cleared") for x in [t[0], t[1], t[2], t[4]]) and t[3].startswith("Error")

# 6. calls and message count are untouched, pairing still holds, and the history itself isn't changed
assert len(out) == len(history) and out[1]["content"] is history[1]["content"]
assert check_pairing(out) == []
assert texts(history) == original_texts

# 7. fit: when everything fits, nothing is cleared or dropped
kept = fit(history, budget=100_000, keep_last=1)
assert kept == history and kept is not history

# 8. fit: when clearing is enough, no round is dropped
budget = count_tokens(clear_old_results(history, keep_last=1)) + 10
kept = fit(history, budget, keep_last=1)
assert len(kept) == len(history) and count_tokens(kept) <= budget
assert texts(kept)[0].startswith("[cleared")

# 9. fit: when clearing isn't enough, whole rounds go too, after clearing
budget = count_tokens(clear_old_results(history, keep_last=1)) - 60
kept = fit(history, budget, keep_last=1)
assert kept[0] is task and count_tokens(kept) <= budget and check_pairing(kept) == []
assert len(kept) < len(history) and texts(kept)[-1] == original_texts[4]
```

**Hint (shown on request):** Build a new dict for each result you clear, with `{**block, "content": ...}`, so the original block is untouched. `successful[len(successful) - keep_last:]` gives the newest `keep_last` ids, and none when `keep_last` is 0. Watch out for the shorter-looking `successful[-keep_last:]`: with 0 it becomes `successful[-0:]`, which is the whole list.

**Reference solution:**
```python
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
                if not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                if not block.get("is_error") and block["tool_use_id"] not in to_keep:
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
```

**Explanation:** Test 4 is the one a per-message count gets wrong: with two parallel results in the newest message and `keep_last=2`, both stay. Test 3 checks that failures are kept and don't use up `keep_last`. Test 6 catches the easiest mistake, writing the placeholder into the original block, which would change the loop's own history. Tests 8 and 9 check the order in `fit`: clearing alone when it's enough, whole rounds only after clearing.

---

*(End of Concept 3.)*
