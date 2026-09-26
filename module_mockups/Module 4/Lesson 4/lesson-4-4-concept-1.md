# Module 4, Lesson 4 — Concept 1: Hitting the wall

> **Note for the site build:** add `WINDOWED_CLIENT` to `fakeClient.ts`, exactly the code in the first block below (`ContextWindowExceeded` and `WindowedClient`). It subclasses whichever `FakeLLMClient` is in scope and only adds a `create(messages, tools=None, system="")` that checks sizes with `count_tokens`, so it's backward compatible and nothing earlier changes. Append it after `COUNT_TOKENS`. This lesson's shared setup is `REACT_FAKE_CLIENT + TOOL_AWARE_CLIENT + COUNT_TOKENS + MEASURE_REQUEST + TRACKER_FUNC` (Lesson 1's `TurnTracker`) `+ WINDOWED_CLIENT`.

---

## The forecast comes due

[Lesson 1's tracker](→ this module, context as a budget lesson, watching it grow across the loop concept) ended its log-reading run with a forecast: at the current growth per turn, headroom runs out in a few more turns. This concept lets that happen.

The fake client can't have a context window, since it isn't a model. So this lesson adds a stand-in that behaves like a provider's front door: it measures each request with `count_tokens` and refuses one that's too large. What it answers with is still scripted.

```python
class ContextWindowExceeded(Exception):
    pass

class WindowedClient(FakeLLMClient):
    """A stand-in for a provider with a context window. It checks each request's size
    before answering; the replies themselves are still scripted."""
    def __init__(self, scripted_responses: list, window: int, on_overflow: str = "error"):
        super().__init__(scripted_responses)
        self.window = window
        self.on_overflow = on_overflow
        self.seen = []
        self.dropped = []

    def create(self, messages: list, tools=None, system: str = "") -> FakeResponse:
        fixed = count_tokens(system) + count_tokens(tools or [])
        size = fixed + count_tokens(messages)
        if size > self.window and self.on_overflow == "error":
            raise ContextWindowExceeded(f"prompt is too long: {size:,} tokens > {self.window:,} maximum")
        kept = list(messages)
        dropped_now = 0
        # silent mode: drop the oldest whole messages, always keeping the latest one
        while fixed + count_tokens(kept) > self.window and len(kept) > 1:
            kept.pop(0)
            dropped_now += 1
        self.dropped.append(dropped_now)
        self.seen.append(kept)
        return super().create(kept)
```
*(defined once here and already loaded for every demo in this lesson; a stand-in that checks request sizes, while the replies stay scripted)*

Here's Lesson 1's log-reading agent again, with a window small enough to fill in six turns. Real windows are far larger (current hosted models offer hundreds of thousands of tokens, up to a million), but the arithmetic is the same, just slower:

```python
SYSTEM_PROMPT = "You are the registry assistant. Investigate agent health using the monitoring tools, then summarise."
TOOLS = [{"name": "monitoring__get_logs", "description": "Recent log lines for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}}]

def get_logs(agent_name: str) -> str:
    line = f"2026-09-25T10:00:00Z {agent_name} INFO request handled in 412ms status=200 route=/v1/answer\n"
    return line * 70

AGENTS = ["research_agent", "support_agent", "billing_agent", "triage_agent", "search_agent", "report_agent"]
def script():
    return ([[ToolUseBlock(name="monitoring__get_logs", input={"agent_name": a})] for a in AGENTS]
            + [[TextBlock(text="All six agents look healthy.")]])

# a deliberately tiny window, so the run fails in a few turns instead of a few hundred
llm = WindowedClient(script(), window=8_000)
tracker = TurnTracker(window=8_000, max_tokens=1_500, warn_below=2_000)
messages = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
try:
    while True:
        row = tracker.record(SYSTEM_PROMPT, TOOLS, messages)
        note = "  <- input fits, but not the reply room" if row["headroom"] < 0 and row["input_total"] <= 8_000 else ""
        print(f"turn {row['turn']}: input {row['input_total']:>5,}  headroom {row['headroom']:>6,}{note}")
        response = llm.create(messages=messages, tools=TOOLS, system=SYSTEM_PROMPT)
        messages.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            print("answer:", response.content[0].text)
            break
        messages.append({"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": c.id, "content": get_logs(**c.input)} for c in calls]})
except ContextWindowExceeded as error:
    print(f"request rejected: {error}")

# resending the same request can't help: nothing about it has changed
try:
    llm.create(messages=messages, tools=TOOLS, system=SYSTEM_PROMPT)
except ContextWindowExceeded as error:
    print(f"retried, rejected again: {error}")
```
```
turn 1: input   101  headroom  6,399
turn 2: input 1,828  headroom  4,672
turn 3: input 3,538  headroom  2,962
turn 4: input 5,247  headroom  1,253
turn 5: input 6,939  headroom   -439  <- input fits, but not the reply room
turn 6: input 8,631  headroom -2,131
request rejected: prompt is too long: 8,631 tokens > 8,000 maximum
retried, rejected again: prompt is too long: 8,631 tokens > 8,000 maximum
```
*(runs live, shows output — read-only demo snippet, not graded; the model's replies are scripted, and the 8,000-token window is deliberately tiny)*

Three stages show up, in order:

- **Turn 5 still fits, but the reply doesn't.** The input is under the window, but [headroom](→ this module, context as a budget lesson, measuring one request part by part concept) is negative: there's no longer room for a full reply of `max_tokens`.
- **Turn 6 is rejected.** The input alone is larger than the window.
- **The retry fails identically.** Nothing about the request changed, so nothing about the answer does.

## Three ways a window says no

[Module 1](→ Module 1, context windows and kv cache lesson, what a context window is concept, what happens when you exceed it) listed the general patterns. In an agent loop, they arrive as three concrete behaviors, and which one you get depends on the provider or server:

- **Rejected.** On Claude's API, a request whose input alone exceeds the window returns a 400 `invalid_request_error` ("prompt is too long"), on every model. Other hosted APIs reject too, with their own error codes.
- **Accepted, then cut short.** On Claude 4.5 models and newer, a request whose input fits but whose input plus `max_tokens` doesn't is accepted. If generation then reaches the window's end, it stops with `stop_reason: "model_context_window_exceeded"`. For an agent, that turn may be an answer cut off mid-sentence or a tool call that never finished. It's the same trap as [a reply cut off by `max_tokens`](→ Module 1, context windows and kv cache lesson, max output length vs context window concept): the loop has to check why the model stopped before trusting what it produced.
- **Silently trimmed.** Some local servers drop content until the request fits and answer as if nothing happened. Ollama's chat endpoint does this by default: it removes the oldest whole messages until the prompt fits, always keeping system messages and the latest message, and returns an ordinary response. Its default window is also small (4k tokens on machines with less than 24 GiB of GPU memory, per its docs), so an agent can hit this far sooner than the model's advertised window suggests.

Turn 5 above is the second case. The tracker caught it only because Lesson 1 defined headroom as window minus input minus reply room. A check against the window alone would have said everything was fine.

## Why this error can't be handled like the others

[Module 2](→ Module 2, termination failure and control lesson, tool errors as observations not exceptions concept) taught that a failing tool shouldn't crash the loop: its error goes back to the model as an observation, and the model adapts. That doesn't work here. The failing thing isn't a tool, it's the request. There's no model call to send the error to, and anything added to the conversation makes the next request bigger still.

[Retrying with backoff](→ Module 2, termination failure and control lesson, timeouts retry with backoff and graceful give-up concept) doesn't help either, because it's for failures that might go away. This one is deterministic. The only fix is to send a smaller request, and in this course's design that's the job of the step that prepares each request. Since [Lesson 3](→ this module, prompt caching lesson), the loop keeps the full history and sends a prepared copy each turn. The rest of this lesson teaches that step to make the copy fit.

## The silent version is worse

A rejection at least stops the run. Here's the same agent against a stand-in that trims the way Ollama does instead of refusing:

```python
SYSTEM_PROMPT = "You are the registry assistant. Investigate agent health using the monitoring tools, then summarise."
TOOLS = [{"name": "monitoring__get_logs", "description": "Recent log lines for an agent.",
          "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}}]

def get_logs(agent_name: str) -> str:
    line = f"2026-09-25T10:00:00Z {agent_name} INFO request handled in 412ms status=200 route=/v1/answer\n"
    return line * 70

AGENTS = ["research_agent", "support_agent", "billing_agent", "triage_agent", "search_agent", "report_agent"]
llm = WindowedClient(
    [[ToolUseBlock(name="monitoring__get_logs", input={"agent_name": a})] for a in AGENTS]
    + [[TextBlock(text="All six agents look healthy.")]],
    window=8_000, on_overflow="drop_front")

messages = [{"role": "user", "content": "Check the logs for all six agents and tell me if anything looks wrong."}]
while True:
    response = llm.create(messages=messages, tools=TOOLS, system=SYSTEM_PROMPT)
    messages.append({"role": "assistant", "content": response.content})
    calls = [b for b in response.content if b.type == "tool_use"]
    if not calls:
        break
    messages.append({"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": c.id, "content": get_logs(**c.input)} for c in calls]})

print("final answer:", response.content[0].text)
print("messages silently dropped on each call:", llm.dropped)

last = llm.seen[-1]
print("the model's last request began with:", last[0]["role"], [_plain(b)["type"] for b in last[0]["content"]])
print("was the original task in it?", messages[0] in last)
seen_results = sum(1 for m in last if m["role"] == "user" and isinstance(m["content"], list))
print(f"log results it could still see: {seen_results} of {len(AGENTS)}")
```
```
final answer: All six agents look healthy.
messages silently dropped on each call: [0, 0, 0, 0, 0, 3, 5]
the model's last request began with: assistant ['tool_use']
was the original task in it? False
log results it could still see: 4 of 6
```
*(runs live, shows output — read-only demo snippet, not graded; the final answer is scripted, and what the demo shows is what the model was sent)*

The run "succeeded", and the final request had lost the original task and two of the six log results. A real model at that point would be writing a health summary without the instruction it's answering or a third of the evidence, and nothing in the response would say so. [Lesson 2](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept) noted that the original request sits at the start of the context, a position models use well. Trimming from the front removes exactly that message first.

There's also nothing here to catch. The only defenses are to configure the server's window deliberately, and to do your own counting so your code decides what goes, before the server does.

## Measure before you send

Both demos point to the same rule: **the loop should know a request won't fit before it sends it.** `measure_request` from Lesson 1 already gives the number. A negative headroom means the next call is headed for one of the three outcomes above, and the preparation step should act before making it.

What to take out is the hard part. Removing messages from an agent's history is not like trimming a chat log, because the messages depend on each other. The next concept shows how a careless cut breaks the conversation in a way the API refuses to accept.

---

## Quiz cards

> **Q1.** In the first demo, turn 5's input was under the 8,000-token window, yet the tracker flagged it. Why?
> - A) The system prompt counted twice
> - B) Input plus the reply room exceeded the window, so a full-length reply had no room ✅
> - C) The warning line was set too high
> - D) Tool definitions are counted separately from the window
>
> *Explanation:* Headroom subtracts `max_tokens` as well as the input. On Claude 4.5 and newer, such a request is accepted, but the reply may be cut off with `stop_reason: "model_context_window_exceeded"`. Checking the input against the window alone misses this case.

> **Q2.** A tool failure goes back to the model as an observation. Why can't a "prompt is too long" error be handled the same way?
> - A) The provider hides the error text from the loop
> - B) The request itself failed, and adding the error to the conversation would only make the next request larger ✅
> - C) The model would repeat the same tool call
> - D) Observations must come from tools, never from the API
>
> *Explanation:* Feeding errors back works when the model can act on them in its next call. Here there is no next call until the request shrinks, and that is a job for the code that prepares requests, not for the model.

> **Q3.** Why doesn't retrying with backoff help with an oversized request?
> - A) Providers block clients that retry
> - B) The size check is deterministic: the same request gets the same answer every time ✅
> - C) Backoff delays are too short for large requests
> - D) Each retry adds the error message to the history
>
> *Explanation:* Retries are for failures that might clear on their own, like a timeout or a rate limit. A request that is too large stays too large until something is removed from it.

> **Q4.** Why is silent front-trimming more dangerous for an agent than an outright rejection?
> - A) It is slower, because the server tokenizes the request twice
> - B) It drops tool definitions first, so the model can't call tools
> - C) The run continues normally while the model has lost the oldest messages, starting with the original task ✅
> - D) It removes the system prompt, which the model needs to answer
>
> *Explanation:* A rejection stops the run where you can see it. Trimming keeps going with the task and early evidence missing, and nothing in the response says so. Ollama keeps system messages and the latest message, so the system prompt survives. The task, in the first user message, is the first thing to go.

---

*(End of Concept 1. No graded exercise here: the lesson's exercises start with the fix, in Concept 2.)*
