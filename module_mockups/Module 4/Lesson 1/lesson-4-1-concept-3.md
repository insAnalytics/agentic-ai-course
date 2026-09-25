# Module 4, Lesson 1 — Concept 3: Watching it grow across the loop

---

## One measurement is a snapshot

[The previous concept](→ this lesson, measuring one request part by part concept) measured the registry agent's first turn, where tool definitions were most of the request and the scratchpad was almost nothing. That was a snapshot of turn one. An agent's request changes on every iteration of [the loop](→ Module 2, react and reasoning in the loop lesson, the react pattern concept), so the useful measurement is the same breakdown, taken every turn, kept as a history.

Here's a small tracker that does exactly that. It calls `measure_request` from the previous concept on every turn, and records how much the input grew since the turn before and whether headroom has dropped below a warning line:

```python
class TurnTracker:
    def __init__(self, window: int, max_tokens: int, warn_below: int):
        self.window = window
        self.max_tokens = max_tokens
        self.warn_below = warn_below
        self.rows = []

    def record(self, system: str, tools: list, messages: list) -> dict:
        report = measure_request(system, tools, messages, self.max_tokens, self.window)
        previous = self.rows[-1]["input_total"] if self.rows else report["input_total"]
        row = {
            "turn": len(self.rows) + 1,
            "input_total": report["input_total"],
            "growth": report["input_total"] - previous,
            "headroom": report["headroom"],
            "warning": report["headroom"] < self.warn_below,
        }
        self.rows.append(row)
        return row

    def total_sent(self) -> int:
        return sum(row["input_total"] for row in self.rows)
```

## An agent reading logs

Now the registry agent on a real task: check the logs for six agents. Each `get_logs` call returns a few hundred log lines, around 1,700 tokens, which is small for real logs. The tracker records the request at the top of every iteration, just before it's sent:

```python
SYSTEM_PROMPT = "You are the registry assistant. Investigate agent health using the monitoring tools, then summarise."
TOOLS = [{"name": "monitoring__get_logs", "description": "Recent log lines for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}}]

def get_logs(agent_name: str) -> str:
    # a realistic tool result: a few hundred log lines, around 1,500 tokens
    line = f"2026-09-25T10:00:00Z {agent_name} INFO request handled in 412ms status=200 route=/v1/answer\n"
    return line * 70

AGENTS = ["research_agent", "support_agent", "billing_agent", "triage_agent", "search_agent", "report_agent"]
llm = ToolAwareClient(
    [[ToolUseBlock(name="monitoring__get_logs", input={"agent_name": a})] for a in AGENTS]
    + [[TextBlock(text="All six agents look healthy.")]]
)

# the warning line is set high so this short demo crosses it; a real one sits lower
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=190_000)
messages = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
while True:
    tracker.record(SYSTEM_PROMPT, TOOLS, messages)
    response = llm.create(messages=messages, tools=TOOLS)
    messages.append({"role": "assistant", "content": response.content})
    calls = [b for b in response.content if b.type == "tool_use"]
    if not calls:
        break
    messages.append({"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": c.id, "content": get_logs(**c.input)} for c in calls]})

for row in tracker.rows:
    flag = "  <- below warning line" if row["warning"] else ""
    print(f"turn {row['turn']}: input {row['input_total']:>6,}  (+{row['growth']:>5,})  headroom {row['headroom']:>7,}{flag}")
print(f"tokens sent across all {len(tracker.rows)} requests: {tracker.total_sent():,}")

last = tracker.rows[-1]
per_turn = last["growth"]
print(f"at +{per_turn:,} tokens per turn, headroom runs out in about {last['headroom'] // per_turn} more turns")
```
```
turn 1: input    101  (+    0)  headroom 195,899
turn 2: input  1,828  (+1,727)  headroom 194,172
turn 3: input  3,538  (+1,710)  headroom 192,462
turn 4: input  5,247  (+1,709)  headroom 190,753
turn 5: input  6,939  (+1,692)  headroom 189,061  <- below warning line
turn 6: input  8,631  (+1,692)  headroom 187,369  <- below warning line
turn 7: input 10,323  (+1,692)  headroom 185,677  <- below warning line
tokens sent across all 7 requests: 36,607
at +1,692 tokens per turn, headroom runs out in about 109 more turns
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three things show up only because the budget was measured every turn:

- **The growth is almost entirely tool results.** The system prompt and tool definition are the same 100 or so tokens every turn. Each iteration adds one `tool_use` block and one `tool_result`, and the result is nearly all of the +1,700. That's the scratchpad [Module 2 described](→ Module 2, agent state and the scratchpad lesson) turning into the dominant cost, the reverse of the first-turn picture.
- **You pay for the history again on every turn.** The last request was about 10,000 tokens, but the seven requests together sent over 36,000, because each one [resent everything before it](→ Module 1, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept). As a task gets longer, the total grows much faster than the conversation itself: double the number of turns and you roughly quadruple the tokens sent. [Prompt caching](→ this module, prompt structure and cache hits lesson) makes the repeated part much cheaper, which is Lesson 3.
- **You can project when it runs out.** At about 1,700 tokens a turn, this agent has roughly 109 turns left. A task that reads a hundred log files, or a few very large ones, would hit the limit, and knowing that *before* it happens is the whole point of measuring.

## Measure first

Every technique in the rest of this module, trimming old tool results, compacting history, loading tools only when needed, storing things outside the window, has a cost, and each one fixes a different part of the breakdown. The tracker's history tells you which fix fits: a request dominated by tool definitions needs a different remedy from one dominated by old tool results. Guessing leads to optimizing the wrong part.

There's also a reason to act well before the window is full, and it has nothing to do with running out of room. An agent's answers get worse as its context grows, long before the hard limit. That's [the next lesson](→ this module, context that fits but still hurts lesson), and it's why the warning line in the demo sits far above zero.

---

## Quiz cards

> **Q1.** In the log-reading demo, what makes up nearly all of each turn's growth?
> - A) The system prompt, resent each turn
> - B) The tool definitions, which grow each turn
> - C) The new `tool_result`, the log lines the tool returned ✅
> - D) The reply room reserved for the model
>
> *Explanation:* The system prompt and tool definitions are the same size every turn. Each iteration adds one tool call and its result, and the result is almost all of it.

> **Q2.** The last request was about 10,000 tokens, but the seven requests together sent over 36,000. Why?
> - A) The tracker counts some tokens twice
> - B) Each request resent the whole history before it, so earlier content was paid for on every later turn ✅
> - C) The reply room is added to the total
> - D) Tool definitions grew on every turn
>
> *Explanation:* The model API is stateless. Every turn carries everything so far, so total tokens sent grows much faster than the conversation.

> **Q3.** Roughly what happens to the total tokens sent if a task takes twice as many turns, with each turn adding about the same amount?
> - A) It stays the same
> - B) It roughly doubles
> - C) It roughly quadruples ✅
> - D) It halves
>
> *Explanation:* Each request resends all previous turns, so the requests themselves get longer as they go. Twice the turns means about four times the total.

> **Q4.** Why does the warning line sit far above zero headroom?
> - A) Because the tracker can't measure small numbers
> - B) Because the model API rejects requests near the limit
> - C) Because agents get worse as their context grows, well before it's full, so it pays to act early ✅
> - D) Because headroom is always overestimated
>
> *Explanation:* Running out of room is only the final failure. Quality drops long before that, which is the next lesson's subject.

---

## Applied sandbox exercise

*(graded — a per-turn budget tracker)*

**Task shown to learner:** Implement the `TurnTracker` class. `measure_request` from the previous concept is already loaded.

- `__init__(window, max_tokens, warn_below)` stores its settings and starts an empty `rows` list.
- `record(system, tools, messages)` measures the request with `measure_request`, and appends and returns a row with:
  - `turn`: 1 for the first recorded turn, then 2, 3, ...
  - `input_total`: from the measurement.
  - `growth`: this turn's `input_total` minus the previous turn's; `0` for the first turn.
  - `headroom`: from the measurement.
  - `warning`: `True` when headroom is below `warn_below`.
- `total_sent()` returns the sum of every recorded turn's `input_total`.

**Starter code:**
```python
class TurnTracker:
    def __init__(self, window: int, max_tokens: int, warn_below: int):
        # TODO
        ...

    def record(self, system: str, tools: list, messages: list) -> dict:
        # TODO: measure this turn, compare it with the last row, and store the new row
        ...

    def total_sent(self) -> int:
        # TODO
        ...
```

**Hidden tests:**
```python
system = "s" * 40      # 10 tokens
tools = []
t = TurnTracker(window=1_000, max_tokens=100, warn_below=500)

# 1. the first turn: numbered 1, growth 0, headroom from measure_request
messages = [{"role": "user", "content": "q" * 40}]
r1 = t.record(system, tools, messages)
expected_input = count_tokens(system) + count_tokens(tools) + count_tokens(messages)
assert r1["turn"] == 1 and r1["growth"] == 0 and r1["input_total"] == expected_input
assert r1["headroom"] == 1_000 - expected_input - 100 and r1["warning"] is False

# 2. a later turn reports growth since the previous turn
messages.append({"role": "user", "content": "x" * 800})
r2 = t.record(system, tools, messages)
assert r2["turn"] == 2 and r2["growth"] == r2["input_total"] - r1["input_total"] and r2["growth"] > 0

# 3. the warning trips once headroom drops below warn_below, and stays on while it's below
messages.append({"role": "user", "content": "y" * 1_600})
r3 = t.record(system, tools, messages)
assert r3["headroom"] < 500 and r3["warning"] is True

# 4. every turn is kept, in order
assert [row["turn"] for row in t.rows] == [1, 2, 3]

# 5. total_sent sums every request's input: the whole history was resent each time
assert t.total_sent() == r1["input_total"] + r2["input_total"] + r3["input_total"]
assert t.total_sent() > r3["input_total"]

# 6. trackers are independent
other = TurnTracker(window=1_000, max_tokens=100, warn_below=500)
assert other.rows == [] and other.total_sent() == 0
```

**Hint (shown on request):** For `growth`, take the previous row's `input_total` if there is one (`self.rows[-1]`), and otherwise use this turn's own total, which makes the first turn's growth zero. The turn number is `len(self.rows) + 1`, read before appending.

**Reference solution:**
```python
class TurnTracker:
    def __init__(self, window: int, max_tokens: int, warn_below: int):
        self.window = window
        self.max_tokens = max_tokens
        self.warn_below = warn_below
        self.rows = []

    def record(self, system: str, tools: list, messages: list) -> dict:
        report = measure_request(system, tools, messages, self.max_tokens, self.window)
        previous = self.rows[-1]["input_total"] if self.rows else report["input_total"]
        row = {
            "turn": len(self.rows) + 1,
            "input_total": report["input_total"],
            "growth": report["input_total"] - previous,
            "headroom": report["headroom"],
            "warning": report["headroom"] < self.warn_below,
        }
        self.rows.append(row)
        return row

    def total_sent(self) -> int:
        return sum(row["input_total"] for row in self.rows)
```

**Explanation:** The tracker is a thin layer over the previous concept's measurement: it only adds memory of earlier turns. That memory is what turns a snapshot into something you can act on: growth per turn shows what's filling the window (test 2), the warning shows when to act (test 3), and `total_sent` shows the real cost of resending history (test 5), which is always larger than the last request alone.

---

*(End of Concept 3 — final concept of Lesson 1. The lesson continues with the recap and comprehensive sandbox.)*
