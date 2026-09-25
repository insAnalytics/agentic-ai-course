# Context as a Budget

## Intro

> **You'll be able to**
> - Name every part of an agent's request that occupies the context window, including the room reserved for the reply
> - Measure a request as a breakdown by part, and calculate the headroom that's really left
> - Track the budget on every turn of the loop, and read from it what's growing, what it costs, and when it will run out
> - Explain why every technique in this module starts with measuring first

**Why it matters**

Modules 2 and 3 built an agent loop and filled it with tools. Every turn of that loop adds to what the model is sent, and every request resends all of it. On a short task nobody notices. On a long one, the context fills with old tool results, costs climb far faster than the conversation, and eventually a request simply doesn't fit.

This module is about managing that, and it's called **context engineering**: deciding what reaches the model's window, when, in what form, and what gets stored somewhere else instead. It's different from the prompt writing in [Module 2](→ Module 2, prompting fundamentals lesson). That was about *what to say*. This is the architecture of what the model sees at all, and it's one of the biggest levers on an agent's quality and cost that doesn't involve changing the model. It starts here, with the habit every later lesson relies on: measure before you change anything.

---

## Recap & Practice

### Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Which parts of an agent's request are resent in full on every request?
> - A) Only the newest message
> - B) The system prompt, the tool definitions and the whole scratchpad ✅
> - C) Only the system prompt
> - D) Only what changed since the last request
>
> *Explanation:* The model API is stateless, so every request carries everything. Only the scratchpad grows.

> **Q2.** A request has 190,000 input tokens and reserves 12,000 for the reply, in a 200,000-token window. What's its headroom?
> - A) 10,000
> - B) −2,000, so it doesn't fit ✅
> - C) 12,000
> - D) 198,000
>
> *Explanation:* Headroom is window minus input minus reply room: 200,000 − 190,000 − 12,000.

> **Q3.** On an agent's first turn, tool definitions are 80% of the input. What does that suggest?
> - A) The conversation should be shortened first
> - B) The system prompt is too long
> - C) The tool list is the part worth trimming at this point, since the conversation is barely any of it yet ✅
> - D) Nothing; first turns are always like this and can't be changed
>
> *Explanation:* A breakdown shows where the tokens are. Changing the small part saves almost nothing.

> **Q4.** In a long agent run, which part of the breakdown usually becomes the largest?
> - A) The scratchpad, mostly because of accumulated tool results ✅
> - B) The system prompt
> - C) The tool definitions
> - D) The reply room
>
> *Explanation:* The fixed parts stay the same size every turn. The scratchpad grows every iteration, and tool results are usually most of that growth.

> **Q5.** Why is the total number of tokens sent across a task much larger than the final request?
> - A) The model charges extra for long tasks
> - B) The tracker double-counts
> - C) Each request resends the whole history, so earlier content is paid for again on every later turn ✅
> - D) Tool definitions grow each turn
>
> *Explanation:* That's why total cost grows much faster than the conversation, roughly with the square of the number of turns.

> **Q6.** Why does this course use a simple `count_tokens` helper?
> - A) It's more accurate than real tokenizers
> - B) Real tokenizers can't count JSON
> - C) Token counts are the same for every model anyway
> - D) It's a consistent, deterministic approximation, so every budget number in the module agrees with every other ✅
>
> *Explanation:* Real tokenizers differ by model. One labeled approximation keeps the module's arithmetic comparable.

> **Q7.** Why measure the budget every turn, rather than only when a request fails?
> - A) Failed requests can't be measured
> - B) Per-turn history shows what's growing, what it's costing, and when it will run out, before anything breaks ✅
> - C) The API requires a measurement each turn
> - D) It makes the agent faster
>
> *Explanation:* By the time a request fails, the options are worse. Measuring early is what lets you choose the right fix.

---

### Comprehensive sandbox

*(applied, multi-file — instrumenting the registry agent's loop)*

**Task shown to learner:** `budget.py`, which is read-only, contains `measure_request` and `TurnTracker` from this lesson's exercises. Complete `agent.py`:

- **`run_instrumented_agent(llm, user_message, system, tools, tool_impls, tracker, max_steps)`:** the collect-every-call loop from Module 2.
  - **Before each model call,** record the request that's about to be sent with `tracker.record(system, tools, messages)`.
  - Pass `tools=tools` to `llm.create`.
  - Run each call through `tool_impls`, answering an unknown tool name locally as an error.
  - Return the final text, or a step-limit message if `max_steps` runs out.
- **`summarize_budget(tracker)`** returns:
  - `turns`: how many requests were recorded.
  - `peak_input`: the largest `input_total`.
  - `total_sent`: from the tracker.
  - `average_growth`: the average `growth` of every turn *after the first*, rounded to a whole number; `0` if there's only one turn.
  - `first_warning_turn`: the turn number of the first row with a warning, or `None` if there wasn't one.

**Tab: `budget.py`** (read-only)
```python
# measurement and tracking, from this lesson's concepts -- read-only
from tokens import count_tokens

def measure_request(system: str, tools: list, messages: list, max_tokens: int, window: int) -> dict:
    parts = {
        "system": count_tokens(system),
        "tools": count_tokens(tools),
        "messages": count_tokens(messages),
    }
    input_total = sum(parts.values())
    headroom = window - input_total - max_tokens
    largest = max(parts, key=parts.get)
    return {
        "parts": parts,
        "input_total": input_total,
        "reply_room": max_tokens,
        "headroom": headroom,
        "fits": headroom >= 0,
        "largest": largest,
    }

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

**Tab: `agent.py`** (starter, entry file)
```python
from budget import TurnTracker

def run_instrumented_agent(llm, user_message, system, tools, tool_impls, tracker, max_steps=20):
    # TODO: the collect-every-call loop, recording each request just before it's sent
    ...

def summarize_budget(tracker) -> dict:
    # TODO: turns, peak input, total sent, average growth after turn 1, first warning turn
    ...
```

**Hidden tests:**
```python
from fake import *
from budget import TurnTracker
from agent import run_instrumented_agent, summarize_budget

SYSTEM = "You check agent health."
TOOLS = [{"name": "get_logs", "description": "Logs for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}},
         {"name": "get_status", "description": "Status for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}}]
IMPLS = {"get_logs": lambda agent_name: f"{agent_name} log line\n" * 100,
         "get_status": lambda agent_name: f"{agent_name}: ok"}

# 1. a text block before two calls in one response, then an answer: two requests measured
a = ToolUseBlock(name="get_logs", input={"agent_name": "research_agent"})
b = ToolUseBlock(name="get_status", input={"agent_name": "research_agent"})
llm = ToolAwareClient([[TextBlock(text="Checking."), a, b], [TextBlock(text="Healthy.")]])
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=150_000)
answer = run_instrumented_agent(llm, "Is research_agent ok?", SYSTEM, TOOLS, IMPLS, tracker)
assert answer == "Healthy."
assert len(tracker.rows) == 2 == llm.call_count
results = llm.seen[1][-1]["content"]
assert [r["tool_use_id"] for r in results] == [a.id, b.id]

# 2. each row measured exactly what was sent on that request
from tokens import count_tokens
for row, sent in zip(tracker.rows, llm.seen):
    assert row["input_total"] == count_tokens(SYSTEM) + count_tokens(TOOLS) + count_tokens(sent)

# 3. a longer run: growth, peak, total and the first warning turn
calls = [[ToolUseBlock(name="get_logs", input={"agent_name": f"agent_{i}"})] for i in range(8)]
llm = ToolAwareClient(calls + [[TextBlock(text="done")]])
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=196_000)
run_instrumented_agent(llm, "check all", SYSTEM, TOOLS, IMPLS, tracker)
s = summarize_budget(tracker)
assert s["turns"] == 9
assert s["peak_input"] == tracker.rows[-1]["input_total"]
assert s["total_sent"] == sum(r["input_total"] for r in tracker.rows)
assert s["average_growth"] > 500
first = s["first_warning_turn"]
assert first is not None and tracker.rows[first - 1]["warning"] and not any(r["warning"] for r in tracker.rows[:first - 1])

# 4. no warnings at all gives None
llm = ToolAwareClient([[TextBlock(text="hi")]])
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=1_000)
run_instrumented_agent(llm, "hello", SYSTEM, TOOLS, IMPLS, tracker)
s = summarize_budget(tracker)
assert s["first_warning_turn"] is None and s["turns"] == 1 and s["average_growth"] == 0

# 5. an unknown tool is answered locally, and max_steps still bounds the loop
llm = ToolAwareClient([[ToolUseBlock(name="delete_agent", input={})], [TextBlock(text="ok")]])
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=1_000)
run_instrumented_agent(llm, "x", SYSTEM, TOOLS, IMPLS, tracker)
assert llm.seen[1][-1]["content"][0]["is_error"] is True
llm = ToolAwareClient([[ToolUseBlock(name="get_status", input={"agent_name": "a"})] for _ in range(10)])
tracker = TurnTracker(window=200_000, max_tokens=4_000, warn_below=1_000)
out = run_instrumented_agent(llm, "x", SYSTEM, TOOLS, IMPLS, tracker, max_steps=3)
assert llm.call_count == 3 and len(tracker.rows) == 3 and "3" in out
```

**Hint (shown on request):** The only new line in the loop is `tracker.record(...)` at the top of each iteration, before `llm.create`, so it measures exactly what's about to be sent. For `average_growth`, skip the first row with `tracker.rows[1:]`, since the first turn's growth is always zero and would pull the average down.

**Reference solution — `agent.py`:**
```python
from budget import TurnTracker

def run_instrumented_agent(llm, user_message, system, tools, tool_impls, tracker, max_steps=20):
    messages = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        # measure exactly what is about to be sent
        tracker.record(system, tools, messages)
        response = llm.create(messages=messages, tools=tools)
        messages.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text")
        results = []
        for call in calls:
            if call.name in tool_impls:
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": tool_impls[call.name](**call.input)})
            else:
                results.append({"type": "tool_result", "tool_use_id": call.id,
                                "content": f"Error: there is no tool called {call.name}", "is_error": True})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer"

def summarize_budget(tracker) -> dict:
    rows = tracker.rows
    later_growth = [row["growth"] for row in rows[1:]]
    warnings = [row["turn"] for row in rows if row["warning"]]
    return {
        "turns": len(rows),
        "peak_input": max(row["input_total"] for row in rows),
        "total_sent": tracker.total_sent(),
        "average_growth": round(sum(later_growth) / len(later_growth)) if later_growth else 0,
        "first_warning_turn": warnings[0] if warnings else None,
    }
```

**Explanation:** Where `record` sits is the detail that matters. Placed just before `llm.create`, it measures the request that's actually sent, and test 2 checks that every row matches what the fake client received, token for token. The summary turns a table of rows into the few numbers you'd act on:

- **Peak input:** will a request fit?
- **Total sent:** what did the task cost?
- **Average growth:** how fast is it filling?
- **First warning turn:** when should something have been done?

Every lesson from here to the end of the module is about what to do at that warning turn. This exercise is the measurement they all start from.
