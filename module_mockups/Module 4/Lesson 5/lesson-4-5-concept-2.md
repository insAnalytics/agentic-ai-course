# Module 4, Lesson 5 — Concept 2: Compacting: a summary in, rounds out

> **Note for the site build:** this concept uses Lesson 3's `add_to_end` in its demo setup and exercise, exactly as Lesson 3 defines it. Add `SUMMARY_INSTRUCTIONS`, `summary_request` and `compact` (the code block under "Two functions") to this lesson's setup from the next concept on. Note that Lesson 4's `is_tool_results` and `check_pairing` were corrected while this concept was written, to accept a results message that also carries text; use the corrected versions.

---

## Three decisions

[Compaction](→ this lesson, what clearing cant do concept) replaces a span of old rounds with a summary of them. Building it means making three decisions:

- **Which rounds to summarize.** Whole rounds only, so no call loses its result, and never the task or the round in progress: the same rules as [Lesson 4's trimming](→ this module, when the history wont fit lesson, cutting whole rounds not messages concept).
- **How to ask for the summary.** What the instructions say, and what the request looks like.
- **Where the summary goes.** Where it sits in the new history, so the history stays valid.

## Which rounds: keep a few, summarize the rest

The span to summarize is every round after the task except the newest few, which stay word for word. Keeping recent rounds verbatim means the model sees exactly what it just did, with the exact output of its last tools, not a paraphrase. The newest round must always be among them, because its results are what the model is about to read.

Keeping no rounds at all, and summarizing everything after the task, is also a legitimate form, and some providers recommend it. But it's only safe at a point where no round is in progress: between tasks, say, or when a new user message arrives. In the middle of a run, keep at least the newest round.

## How to ask: say what must survive

The summary is the only record of what the removed rounds established, so the instructions have to name what it must carry. Anthropic's [guide to context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) recommends tuning for recall first: capture everything that matters, then trim what doesn't. What matters to an agent mid-task is fairly consistent:

- **the task, and every constraint the user stated**, since a summary that loses "don't restart production agents" is worse than no summary
- **decisions made, and the reason for each**, so they aren't reopened
- **facts established, with exact values**: names, ids, numbers, paths, because "billing is slow" is much less useful than "billing_agent /lookup p99 4.8s"
- **what's finished, and what was tried and failed, with why**. Failures are the counter to the [trajectory elongation](→ this lesson, what clearing cant do concept, what the evidence says about summarizing) the JetBrains study found.
- **open questions and next steps**

Raw tool output can go: whatever can be fetched again should be.

The request itself is built for the cache. It's the task and the older rounds exactly as they were sent before, with the instructions added as a text block at the very end of the last message, using [`add_to_end` from Lesson 3](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept). Sent with the same system prompt and tools, it matches the start of the agent's normal request, so everything but its last message can be read from the cache.

Two practical points about that call. It goes out with the agent's tools, so the model might try to call one instead of summarizing: where the API allows it, turn tool use off for this one request (Claude's API, for example, accepts `tool_choice: {"type": "none"}`). And if the reply contains no text, don't compact.

## Where it goes: after the task, in the same message

The summary goes right after the task, in the same first message, inside tags that say what it is. The task stays word for word at the start. The kept rounds follow, and they start with an assistant message, so user and assistant messages still alternate. A separate user message for the summary would put two user messages in a row.

## Two functions

```python
SUMMARY_INSTRUCTIONS = """Write a summary of the work above. The messages it covers will be removed, and you will continue the task from this summary alone.
Include:
- the task, and every constraint or preference the user stated
- decisions made, and the reason for each
- facts established, with exact values: names, ids, numbers, paths
- what is finished, and what was tried and failed, with why
- open questions and the next steps
If an earlier summary appears above, don't repeat it: cover only the work after it.
Leave out raw tool output that can be fetched again. Plain text, under 300 words."""

def summary_request(messages: list, keep_recent: int):
    """The messages to send to get a summary of everything except the newest keep_recent rounds, or None."""
    rounds = split_rounds(messages)
    if keep_recent >= len(rounds):
        return None
    older = [messages[0]]
    for r in rounds[:len(rounds) - keep_recent]:
        older += r
    return add_to_end(older, SUMMARY_INSTRUCTIONS)

def compact(messages: list, summary: str, keep_recent: int) -> list:
    """Replace every round but the newest keep_recent with a summary, placed after the task in the first message."""
    rounds = split_rounds(messages)
    first = {"role": "user",
             "content": messages[0]["content"] + "\n\n<summary_of_earlier_work>\n" + summary + "\n</summary_of_earlier_work>"}
    compacted = [first]
    for r in rounds[len(rounds) - keep_recent:]:
        compacted += r
    return compacted
```

Here's the investigation from [the previous concept](→ this lesson, what clearing cant do concept, what a dropped round takes with it), compacted while keeping the two newest rounds. The summary comes from the fake client, so it's scripted:

```python
def step(thought, name, agent, result):
    call = ToolUseBlock(name=name, input={"agent_name": agent})
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=thought), call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": result}]}]

def filler(agent):
    return f"{agent} INFO request handled in 412ms status=200\n" * 30

history = [{"role": "user", "content": "Find out why the support queue is slow, then propose a fix."}]
history += step("Start with the metrics for the agents on the ticket path.", "get_metrics", "support_agent",
                "support_agent: p99 0.9s, queue depth 340")
history += step("support_agent itself looks fine; its dependencies next.", "get_metrics", "billing_agent",
                "billing_agent: p99 4.8s on /lookup, called once per ticket")
history += step("billing_agent's 4.8s lookup, once per ticket, explains the queue. Confirm the others are fine.",
                "get_logs", "search_agent", filler("search_agent"))
for agent in ["triage_agent", "report_agent", "auth_agent", "research_agent", "search_agent", "triage_agent"]:
    history += step(f"Ruling out {agent}.", "get_logs", agent, filler(agent))

SYSTEM = "You are the registry assistant."
TOOLS = [{"name": n, "description": f"{n} tool", "input_schema": {"type": "object", "properties": {}}} for n in ["get_metrics", "get_logs"]]

# 1. what gets sent to ask for the summary: the older rounds, with the instructions added at the very end
request = summary_request(history, keep_recent=2)
print(f"history: {len(history)} messages; summary request: {len(request)} messages, ends with:")
print("   ", request[-1]["content"][-1]["text"].splitlines()[0])
print("    pairing problems:", check_pairing(request))
reuse = first_divergence({"tools": TOOLS, "system": SYSTEM, "messages": history},
                         {"tools": TOOLS, "system": SYSTEM, "messages": request})
print("    compared with the normal request, it first differs at", reuse["diverges_at"])

# 2. the summary comes back from the model (scripted here), and replaces the older rounds
llm = WindowedClient([[TextBlock(text=(
    "Task: find why the support queue is slow and propose a fix.\n"
    "Established: support_agent p99 0.9s, queue depth 340. billing_agent /lookup p99 4.8s, "
    "called once per ticket: the likely cause.\n"
    "Ruled out so far: search_agent, triage_agent, report_agent, auth_agent (normal logs).\n"
    "Next: finish ruling out the remaining agents, then propose caching billing lookups."))]], window=8_000)
response = llm.create(messages=request, tools=TOOLS, system=SYSTEM)
summary = "".join(b.text for b in response.content if b.type == "text")

compacted = compact(history, summary, keep_recent=2)
print(f"\nbefore: {len(history)} messages, {count_tokens(history):,} tokens")
print(f"after:  {len(compacted)} messages, {count_tokens(compacted):,} tokens")
print("pairing problems:", check_pairing(compacted), "| open round intact:", check_open_round(history, compacted) == [])
print("the 4.8s figure survives:", "4.8s" in json.dumps(_plain(compacted)))
```
```
history: 19 messages; summary request: 15 messages, ends with:
    Write a summary of the work above. The messages it covers will be removed, and you will continue the task from this summary alone.
    pairing problems: []
    compared with the normal request, it first differs at messages[14]

before: 19 messages, 3,662 tokens
after:  5 messages, 1,107 tokens
pairing problems: [] | open round intact: True
the 4.8s figure survives: True
```
*(runs live, shows output — read-only demo snippet, not graded; the summary is scripted, written as a good model's summary might be, and the demo checks structure, not summary quality)*

- **The request reuses the cache.** It first differs from the agent's normal request at `messages[14]`, the message the instructions were added to. Everything before that is the same.
- **The history shrank to a third, and stayed valid.** Five messages instead of 19, the pairing intact, the round in progress exactly as returned.
- **The finding survived.** Where Lesson 4's fitter lost the 4.8-second figure, the summary carries it, because the instructions asked for exact values and this scripted summary followed them. A real summary might not, which is the next concept's subject.

## What compaction costs the cache

Compaction changes the first message, so the request after it can reuse only the tools and system prompt. Everything else is processed fresh, once. After that, the loop appends to the compacted history as usual, and the cache builds up again. That's why compaction has to be occasional: each one costs a nearly full reprocessing, [as Lesson 3 predicted](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept, two fights ahead). The last concept of this lesson decides when it's worth it.

One more cost applies on providers that bind reasoning to everything before it. The kept rounds' thinking blocks were produced before the history was rewritten, so on those models they're no longer valid. As [Lesson 4 described](→ this module, when the history wont fit lesson, reasoning travels with its tool call concept, when the provider binds reasoning to everything before it), strip them from the kept rounds when you compact on the client, or let the provider compact on its side.

---

## Quiz cards

> **Q1.** Why does compaction keep the newest round word for word instead of summarizing it too?
> - A) The newest round is always too short to summarize
> - B) Its results are what the model is about to read, and summarizing them mid-step would replace exact output with a paraphrase ✅
> - C) The API rejects a summary that covers the newest round
> - D) Keeping it makes the summary call cheaper
>
> *Explanation:* The model is in the middle of that step. Recent rounds are kept verbatim so it can act on exactly what its tools returned.

> **Q2.** The summary instructions ask for "facts established, with exact values". Why stress exact values?
> - A) A summary that says "billing is slow" loses the number and the name the agent needs to act on it ✅
> - B) Exact values make the summary shorter
> - C) Exact values keep the cache valid
> - D) The API rejects summaries without numbers
>
> *Explanation:* A paraphrase can sound right and still be useless. Ids, numbers and names are what later steps use, and they're the first things a vague summary drops.

> **Q3.** Why is the summary request built as the older rounds plus the instructions added to the end of the last message?
> - A) The model can only summarize messages it has seen twice
> - B) It keeps the request under the context window
> - C) It matches the start of the agent's normal request, so everything before the last message can be read from the cache ✅
> - D) It stops the model from calling tools
>
> *Explanation:* The same system prompt, tools and messages form the same prefix. Only the message carrying the instructions differs. Stopping tool calls is a separate setting, where the API offers one.

> **Q4.** Why does the summary go into the first message, after the task, rather than into a new message of its own?
> - A) A new message would count twice toward the window
> - B) The kept rounds start with an assistant message, so a separate user message for the summary would put two user messages in a row ✅
> - C) The task message is the only place the model reads summaries
> - D) It keeps the cached prefix intact
>
> *Explanation:* User and assistant messages alternate. Putting the summary after the task in the same message keeps that true, and the task itself stays word for word at the start.

> **Q5.** After compaction, what can the next request read from the cache?
> - A) Everything up to the kept rounds
> - B) Nothing at all, including the tools
> - C) Everything, because the summary is shorter
> - D) Only the tools and the system prompt, because the first message changed ✅
>
> *Explanation:* The first message now holds the summary, so the prefix differs from there on. It's a one-time cost: later turns append to the compacted history and reuse it again.

---

## Applied sandbox exercise

*(graded — building compaction)*

**Task shown to learner:** `SUMMARY_INSTRUCTIONS`, `add_to_end`, `split_rounds`, `check_pairing` and `check_open_round` are provided. Implement:

- **`summary_request(messages, keep_recent)`:** the messages to send to ask for a summary.
  - The first message (the task), then every round except the newest `keep_recent`, exactly as they are.
  - `SUMMARY_INSTRUCTIONS` is added at the end with `add_to_end`.
  - Return `None` if `keep_recent` leaves no round to summarize.
- **`compact(messages, summary, keep_recent)`:** the compacted history.
  - A first message with role `"user"` and content: the task's text, then `"\n\n<summary_of_earlier_work>\n"`, the summary, and `"\n</summary_of_earlier_work>"`.
  - Then the newest `keep_recent` rounds, exactly as they are.
  - Never modify `messages` or the messages in it, including the task message.

Assume the task's content is a string, and that every round after it starts with an assistant message.

**Provided code:** `SUMMARY_INSTRUCTIONS` (as shown in this concept), `add_to_end` from Lesson 3, `split_rounds`, `check_pairing` and `check_open_round` from Lesson 4, and the fake client's `count_tokens`, `ToolUseBlock`, `TextBlock` and `ThinkingBlock`.

```python
def add_to_end(messages: list, text: str) -> list:
    last = messages[-1]
    if isinstance(last["content"], str):
        new_last = {**last, "content": last["content"] + "\n\n" + text}
    else:
        new_last = {**last, "content": last["content"] + [{"type": "text", "text": text}]}
    return messages[:-1] + [new_last]
```

**Starter code:**
```python
SUMMARY_INSTRUCTIONS = """..."""   # provided, as shown above

def summary_request(messages: list, keep_recent: int):
    # TODO: the task and every round but the newest keep_recent, instructions added at the end; None if nothing to summarize
    ...

def compact(messages: list, summary: str, keep_recent: int) -> list:
    # TODO: one first message holding the task, then the summary; then the newest keep_recent rounds, untouched
    ...
```

**Hidden tests:**
```python
def round_of(*agents):
    calls, results = [], []
    for agent in agents:
        call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
        calls.append(call)
        results.append({"type": "tool_result", "tool_use_id": call.id, "content": agent + " " + "x" * 300})
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=f"check {agents}")] + calls},
            {"role": "user", "content": results}]

def roles_alternate(messages):
    for i in range(1, len(messages)):
        if messages[i]["role"] == messages[i - 1]["role"]:
            return False
    return True

task = {"role": "user", "content": "Find out why the support queue is slow."}
history = [task] + round_of("a") + round_of("b", "c") + round_of("d") + round_of("e")
before = [len(m["content"]) if isinstance(m["content"], list) else m["content"] for m in history]

# 1. the summary request: the task and every round but the newest keep_recent, unchanged,
#    with the instructions added as a final text block on the last of them
req = summary_request(history, keep_recent=2)
assert len(req) == 5 and req[0] is task and req[1] is history[1] and req[3] is history[3]
assert req[4]["content"][:2] == history[4]["content"][:2]
assert req[4]["content"][-1] == {"type": "text", "text": SUMMARY_INSTRUCTIONS}
assert check_pairing(req) == [] and roles_alternate(req)

# 2. keep_recent=0 covers every round; nothing left to summarize gives None
assert len(summary_request(history, keep_recent=0)) == len(history)
assert summary_request(history, keep_recent=4) is None and summary_request(history, keep_recent=9) is None

# 3. compact: the task, followed by the summary, in one first message; then the newest rounds, untouched
out = compact(history, "SUMMARY TEXT", keep_recent=2)
assert out[0]["role"] == "user"
assert out[0]["content"] == task["content"] + "\n\n<summary_of_earlier_work>\nSUMMARY TEXT\n</summary_of_earlier_work>"
assert len(out) == 5 and out[1] is history[5] and out[4] is history[8]
assert check_pairing(out) == [] and check_open_round(history, out) == [] and roles_alternate(out)

# 4. keep_recent=1 keeps only the round in progress
out = compact(history, "S", keep_recent=1)
assert len(out) == 3 and out[1:] == history[-2:]

# 5. the two fit together: what's summarized plus what's kept is every round, once
assert (len(summary_request(history, 3)) - 1) + (len(compact(history, "S", 3)) - 1) == len(history) - 1

# 6. the history, including the task message, is never changed
assert [len(m["content"]) if isinstance(m["content"], list) else m["content"] for m in history] == before
```

**Hint (shown on request):** Both functions start from `rounds = split_rounds(messages)`. The rounds to summarize are `rounds[:len(rounds) - keep_recent]` and the ones to keep are `rounds[len(rounds) - keep_recent:]`, so together they cover every round exactly once. Build the new first message as a new dict; assigning to `messages[0]["content"]` would change the loop's own history.

**Reference solution:**
```python
SUMMARY_INSTRUCTIONS = """Write a summary of the work above. The messages it covers will be removed, and you will continue the task from this summary alone.
Include:
- the task, and every constraint or preference the user stated
- decisions made, and the reason for each
- facts established, with exact values: names, ids, numbers, paths
- what is finished, and what was tried and failed, with why
- open questions and the next steps
If an earlier summary appears above, don't repeat it: cover only the work after it.
Leave out raw tool output that can be fetched again. Plain text, under 300 words."""

def summary_request(messages: list, keep_recent: int):
    """The messages to send to get a summary of everything except the newest keep_recent rounds, or None."""
    rounds = split_rounds(messages)
    if keep_recent >= len(rounds):
        return None
    older = [messages[0]]
    for r in rounds[:len(rounds) - keep_recent]:
        older += r
    return add_to_end(older, SUMMARY_INSTRUCTIONS)

def compact(messages: list, summary: str, keep_recent: int) -> list:
    """Replace every round but the newest keep_recent with a summary, placed after the task in the first message."""
    rounds = split_rounds(messages)
    first = {"role": "user",
             "content": messages[0]["content"] + "\n\n<summary_of_earlier_work>\n" + summary + "\n</summary_of_earlier_work>"}
    compacted = [first]
    for r in rounds[len(rounds) - keep_recent:]:
        compacted += r
    return compacted
```

**Explanation:** Test 1 checks that the summary request is the old request with only its last message extended, which is what lets it reuse the cache. Test 3 checks the compacted history: the task first, the summary right after it in the same message, the kept rounds untouched, and roles still alternating. That last check fails for a summary placed in a message of its own. Test 5 checks that the two functions split the rounds between them with nothing lost or doubled. Test 6 catches building the first message by changing the task message in place.

---

*(End of Concept 2.)*
