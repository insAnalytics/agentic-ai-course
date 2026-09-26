# Module 4, Lesson 4 — Concept 2: Cutting whole rounds, not messages

> **Note for the site build:** add `CHECK_PAIRING` to `fakeClient.ts`: the `is_tool_results` and `check_pairing` functions in the first code block below, exactly as shown. They depend only on `_plain`, so append after `COUNT_TOKENS`; backward compatible. Add it to this lesson's shared setup from here on (`... + WINDOWED_CLIENT + CHECK_PAIRING`). The exercise's hidden tests also need `split_rounds`, `trim_to_fit` from the learner's code, nothing else.

---

## Messages depend on each other

The fix for [a request that's too big](→ this lesson, hitting the wall concept) sounds simple: leave out the oldest messages. The trouble is that an agent's history isn't a list of independent messages. [The canonical loop](→ Module 2, react and reasoning in the loop lesson, the react pattern concept) answers every `tool_use` block with a `tool_result` carrying its id, all in the very next message, and the API holds you to that in both directions:

- **Every `tool_use` needs its `tool_result` in the next message.** Claude's API rejects a history that breaks this with "tool_use ids were found without tool_result blocks immediately after".
- **Every `tool_result` needs its `tool_use` in the previous message.** Otherwise the error is "unexpected tool_use_id found in tool_result blocks".

This isn't one provider's quirk. OpenAI's chat format enforces the same rule: an assistant message with tool calls must be followed by tool messages answering each call's id. A local server may not check, but then the model reads a result for a call it never made, or a call that seemingly never came back.

Here are both rules as a function, so any history can be checked before it's sent:

```python
def is_tool_results(message: dict) -> bool:
    return (message["role"] == "user" and isinstance(message["content"], list)
            and all(_plain(b)["type"] == "tool_result" for b in message["content"]))

def check_pairing(messages: list) -> list:
    """The two pairing rules the API enforces, as a list of problems. Empty means the history is valid."""
    problems = []
    for i in range(len(messages)):
        message = messages[i]
        blocks = [_plain(b) for b in message["content"]] if isinstance(message["content"], list) else []
        if message["role"] == "assistant":
            call_ids = [b["id"] for b in blocks if b["type"] == "tool_use"]
            answered = []
            if i + 1 < len(messages) and is_tool_results(messages[i + 1]):
                answered = [b["tool_use_id"] for b in messages[i + 1]["content"]]
            missing = [c for c in call_ids if c not in answered]
            if missing:
                problems.append(f"messages.{i}: tool_use without a tool_result immediately after: {missing}")
        if message["role"] == "user":
            result_ids = [b["tool_use_id"] for b in blocks if b["type"] == "tool_result"]
            called = []
            if i > 0 and messages[i - 1]["role"] == "assistant":
                called = [_plain(b)["id"] for b in messages[i - 1]["content"] if _plain(b)["type"] == "tool_use"]
            unknown = [r for r in result_ids if r not in called]
            if unknown:
                problems.append(f"messages.{i}: tool_result with no tool_use in the previous message: {unknown}")
    return problems
```
*(defined once here and already loaded for every later demo in this lesson; it mirrors the two rules the API checks, but it's a stand-in, not the API itself)*

## Two careless cuts

Here's a history of four rounds of log reading, two of them with parallel calls, cut in two reasonable-looking ways:

```python
def logs(agent):
    return f"2026-09-25T10:00:00Z {agent} INFO request handled in 412ms status=200\n" * 60

def round_of(*agents):
    calls, results = [], []
    for agent in agents:
        call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
        calls.append(call)
        results.append({"type": "tool_result", "tool_use_id": call.id, "content": logs(agent)})
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}]

history = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
history += round_of("research_agent")
history += round_of("support_agent", "billing_agent")
history += round_of("triage_agent")
history += round_of("search_agent", "report_agent")
print(f"full history: {len(history)} messages, {count_tokens(history):,} tokens, problems: {check_pairing(history)}")

# naive cut 1: keep the last five messages
tail = history[-5:]
print("keep the last 5 messages:")
for problem in check_pairing(tail):
    print("  ", problem)

# naive cut 2: drop the single largest message
largest = 0
for i in range(len(history)):
    if count_tokens(history[i]) > count_tokens(history[largest]):
        largest = i
without_largest = history[:largest] + history[largest + 1:]
print(f"drop the largest message (messages.{largest}):")
for problem in check_pairing(without_largest):
    print("  ", problem)
```
```
full history: 9 messages, 7,261 tokens, problems: []
keep the last 5 messages:
   messages.0: tool_result with no tool_use in the previous message: ['toolu_fake_02', 'toolu_fake_03']
drop the largest message (messages.4):
   messages.3: tool_use without a tool_result immediately after: ['toolu_fake_02', 'toolu_fake_03']
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **Keeping the last five messages** lands in the middle of a round. The kept history starts with two tool results whose calls were cut off. This is the cut [the silent trimmer in the previous concept](→ this lesson, hitting the wall concept, the silent version is worse) makes, message by message, with no idea what the messages mean.
- **Dropping the largest message** removes a tool result, the obvious target since tool results are [what grows](→ this module, context as a budget lesson, watching it grow across the loop concept). That leaves two calls with no answer.

Both produce exactly the errors the API returns, and there's a nasty property here: the broken history is *kept*. If the trimming happens inside a session's stored state, every later request carries the same defect and fails the same way. Real agent tools have shipped this bug, with sessions that could no longer send any request at all.

## Cut by round

The unit that can safely go is a **round**: an assistant message together with the message that answers its tool calls. Removing a whole round removes calls and results together, so nothing is left unpaired. A few details make the rule complete:

- **Parallel calls stay in one round.** Several `tool_use` blocks in one assistant message are answered by one user message, so they're one round.
- **A message that answers nothing is a round on its own.** That's an assistant message with only text, or a new instruction from the user.
- **The task is pinned.** The first message is the original request, and [Lesson 2](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept) showed it sits where models use context well. It's never cut.
- **The newest round always stays.** It holds the results the model is about to read. Sending a request without them would ask the model to continue from calls it can't see the answers to.

```python
def split_rounds(messages: list) -> list:
    """Group everything after the first message into rounds that can be removed safely."""
    rounds = []
    for message in messages[1:]:
        if is_tool_results(message) and rounds:
            rounds[-1].append(message)
        else:
            rounds.append([message])
    return rounds

def trim_to_fit(messages: list, budget: int) -> list:
    """Keep the task and the newest rounds; drop the oldest whole rounds until the messages fit."""
    task = messages[0]
    rounds = split_rounds(messages)
    while True:
        kept = [task]
        for r in rounds:
            kept += r
        if count_tokens(kept) <= budget or len(rounds) == 1:
            return kept
        rounds = rounds[1:]
```

`trim_to_fit` takes a budget for the messages alone. The system prompt, the tool definitions and the reply room are fixed, so the caller subtracts them from the window first, the same arithmetic as [Lesson 1's headroom](→ this module, context as a budget lesson, measuring one request part by part concept).

## The fix, in the loop

Here's the agent that [hit the wall](→ this lesson, hitting the wall concept, the forecast comes due), same tiny window, same stand-in that rejects oversized requests. The only change is that the loop sends `trim_to_fit(history, budget)` instead of the history itself. The history keeps everything; only the copy sent is trimmed:

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

# what's left for messages once the fixed parts and the reply room are set aside
WINDOW, MAX_TOKENS = 8_000, 1_500
budget = WINDOW - count_tokens(SYSTEM_PROMPT) - count_tokens(TOOLS) - MAX_TOKENS

history = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
while True:
    to_send = trim_to_fit(history, budget)
    assert check_pairing(to_send) == []
    print(f"history {len(history):>2} messages, {count_tokens(history):>6,} tokens -> sent {len(to_send):>2} messages, {count_tokens(to_send):>5,} tokens")
    response = llm.create(messages=to_send, tools=TOOLS, system=SYSTEM_PROMPT)
    history.append({"role": "assistant", "content": response.content})
    calls = [b for b in response.content if b.type == "tool_use"]
    if not calls:
        break
    history.append({"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": c.id, "content": get_logs(**c.input)} for c in calls]})

print("final answer:", response.content[0].text)
last = llm.seen[-1]
print("task still first:", last[0] is history[0])
print(f"log results in the last request: {sum(1 for m in last if is_tool_results(m))} of {len(AGENTS)}")
```
```
history  1 messages,     26 tokens -> sent  1 messages,    26 tokens
history  3 messages,  1,753 tokens -> sent  3 messages, 1,753 tokens
history  5 messages,  3,463 tokens -> sent  5 messages, 3,463 tokens
history  7 messages,  5,172 tokens -> sent  7 messages, 5,172 tokens
history  9 messages,  6,864 tokens -> sent  7 messages, 5,137 tokens
history 11 messages,  8,556 tokens -> sent  7 messages, 5,119 tokens
history 13 messages, 10,248 tokens -> sent  7 messages, 5,101 tokens
final answer: All six agents look healthy.
task still first: True
log results in the last request: 3 of 6
```
*(runs live, shows output — read-only demo snippet, not graded; the model's replies are scripted, and the window is deliberately tiny)*

The run that was rejected on turn 6 now completes. Every request passed the pairing check, and the task was always first. From turn 5 on, the history keeps growing while what's sent stays at about 5,100 tokens.

Three costs remain, and they set up the rest of this lesson and the next:

- **The model lost more than it had to.** Dropping a round removes the call along with its result, so in the last request the model can't see that it ever checked the first three agents. It might check them again. [The next concept](→ this lesson, clear before you cut and cut in batches concept) clears old results first and keeps the calls.
- **The cut moves every turn.** From turn 5 on, each request drops a different round, so the messages right after the task change on every turn. By [Lesson 3's rule](→ this module, prompt caching lesson, what makes an agent cache friendly and what breaks it concept), that loses the cached prefix every turn. The next concept fixes this too.
- **What's dropped leaves no trace.** Nothing tells the model what happened in the missing rounds. [Lesson 5](→ this module, compaction and summarization lesson) replaces them with a summary instead.

---

## Quiz cards

> **Q1.** A history is trimmed by keeping only its last few messages. Why can that make the API reject the request?
> - A) The API requires every request to contain at least one text block
> - B) The cut can fall inside a round, keeping tool results whose tool calls were removed ✅
> - C) Shorter histories are rejected when the tool list is long
> - D) Removing messages changes the tool call ids in what remains
>
> *Explanation:* Each `tool_result` must follow the assistant message that contains its `tool_use`. A cut by message count ignores that, so it can keep a result and remove its call. The ids themselves never change.

> **Q2.** Why does an assistant message with two parallel tool calls belong in the same round as the message after it?
> - A) Both calls are answered by that one message, so removing either message alone breaks the pairing ✅
> - B) Parallel calls are always to the same tool
> - C) The API counts parallel calls as a single call
> - D) Rounds must contain exactly two messages
>
> *Explanation:* The canonical loop answers every call from one assistant message in a single user message. The two messages depend on each other, so they're removed together or not at all. A text-only reply, by contrast, is a round of one message.

> **Q3.** Why does `trim_to_fit` keep the newest round even when that round alone is over the budget?
> - A) The newest round is always the smallest
> - B) It holds the results the model is about to act on, and without them the request has nothing to continue from ✅
> - C) The API rejects any request that doesn't end with an assistant message
> - D) Dropping it would change the task message
>
> *Explanation:* The loop just ran those tools and is sending their results. If even that doesn't fit, the problem is one oversized result, which needs shaping before it enters the history, as in [Module 3's tool-results lesson](→ Module 3, shaping what tools return lesson, truncation and pagination concept).

> **Q4.** After the fix, the agent's final request kept only three of the six log results. What else was lost with the three dropped rounds?
> - A) Nothing: the tool calls stay when a round is dropped
> - B) The tool calls themselves, so the model can't see that it checked those agents at all ✅
> - C) The system prompt, which was trimmed with the oldest round
> - D) The task message, which moves forward as rounds are dropped
>
> *Explanation:* A dropped round takes the call and the result together. That's what keeps the pairing valid, but it also erases the record that the work was done. Clearing results while keeping calls, in the next concept, loses less.

---

## Applied sandbox exercise

*(graded — trimming by rounds)*

**Task shown to learner:** `count_tokens`, `is_tool_results` and `check_pairing` are provided. Implement:

- **`split_rounds(messages)`:** group every message after the first into rounds, returning a list of lists.
  - A message that `is_tool_results` joins the round before it.
  - Any other message (an assistant message, or a user message that isn't tool results) starts a new round.
- **`trim_to_fit(messages, budget)`:** return the messages to send.
  - The first message (the task) is always kept, first.
  - Drop the oldest whole rounds, one at a time, until `count_tokens` of the result is at most `budget`.
  - Stop as soon as it fits, and never drop the newest round, even if the result is still over budget.
  - Return a new list and never modify `messages`.

**Provided code:** `is_tool_results` and `check_pairing` from this concept, and the fake client's `count_tokens`, `ToolUseBlock` and `TextBlock`.

**Starter code:**
```python
def split_rounds(messages: list) -> list:
    # TODO: group messages[1:] so each tool-results message stays with the message before it
    ...

def trim_to_fit(messages: list, budget: int) -> list:
    # TODO: keep the task, drop the oldest whole rounds until the messages fit
    ...
```

**Hidden tests:**
```python
def round_of(*agents, size=400):
    calls, results = [], []
    for agent in agents:
        call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
        calls.append(call)
        results.append({"type": "tool_result", "tool_use_id": call.id, "content": agent + " " + "x" * size})
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}]

task = {"role": "user", "content": "Check every agent."}
history = ([task] + round_of("a") + round_of("b", "c")
           + [{"role": "assistant", "content": [TextBlock(text="a, b and c look fine.")]},
              {"role": "user", "content": "Now check d as well."}]
           + round_of("d"))
snapshot = list(history)

# 1. rounds: a call and its results together (parallel calls included); a text reply or a new user message on its own
rounds = split_rounds(history)
assert [len(r) for r in rounds] == [2, 2, 1, 1, 2]
assert rounds[1][0] is history[3] and rounds[1][1] is history[4]
assert rounds[3][0]["content"] == "Now check d as well."

# 2. the first message is not part of any round, and the history isn't changed
assert all(m is not task for r in rounds for m in r)
assert history == snapshot

# 3. when everything fits, nothing is dropped, and the result is a new list
kept = trim_to_fit(history, budget=100_000)
assert kept == history and kept is not history

# 4. over budget: task first, oldest whole rounds dropped, pairing intact, and it fits
budget = count_tokens(history) - 150
kept = trim_to_fit(history, budget)
assert kept[0] is task and count_tokens(kept) <= budget
assert check_pairing(kept) == []
assert kept[1:] == history[len(history) - len(kept) + 1:]

# 5. it stops as soon as the messages fit: only the oldest round went
assert len(kept) == len(history) - 2

# 6. one token over: removing a single message would be enough, but a round goes whole
kept = trim_to_fit(history, count_tokens(history) - 1)
assert check_pairing(kept) == [] and len(kept) == len(history) - 2

# 7. the newest round always stays, even if it can't fit on its own
kept = trim_to_fit(history, budget=10)
assert kept == [task] + history[-2:]
assert check_pairing(kept) == []

# 8. the history itself is never changed
assert history == snapshot
```

**Hint (shown on request):** In `split_rounds`, loop over `messages[1:]` and look at `rounds[-1]`: a tool-results message is appended to it, anything else becomes `[message]` appended to `rounds`. In `trim_to_fit`, rebuild the candidate list from the task plus the remaining rounds each time, and remove `rounds[0]` only while the candidate is over budget and more than one round remains.

**Reference solution:**
```python
def split_rounds(messages: list) -> list:
    """Group everything after the first message into rounds that can be removed safely."""
    rounds = []
    for message in messages[1:]:
        if is_tool_results(message) and rounds:
            rounds[-1].append(message)
        else:
            rounds.append([message])
    return rounds

def trim_to_fit(messages: list, budget: int) -> list:
    """Keep the task and the newest rounds; drop the oldest whole rounds until the messages fit."""
    task = messages[0]
    rounds = split_rounds(messages)
    while True:
        kept = [task]
        for r in rounds:
            kept += r
        if count_tokens(kept) <= budget or len(rounds) == 1:
            return kept
        rounds = rounds[1:]
```

**Explanation:** Test 1 checks the grouping: calls with their results, parallel calls included, and a text reply or a new user message on its own. Test 6 is the one a message-by-message trimmer fails: one token over the budget, removing a single message would be enough, but that message is an assistant turn with calls, so the whole round has to go. Test 7 covers the limit: the newest round is kept even when it can't fit, because the loop can't continue without it. Throughout, `check_pairing` confirms what the API would, and the history itself is never changed.

---

*(End of Concept 2.)*
