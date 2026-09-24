# Module 3, Lesson 4 — Concept 4: Running independent tool calls concurrently

---

## Module 2's loop runs them one at a time

[Module 2's corrected loop](→ Module 2, react and reasoning in the loop lesson, the react pattern concept) handles a response with several `tool_use` blocks correctly: it runs every call and sends every result back together. But it runs them in a `for` loop, one after another. When the tools were in-process dict lookups, that cost nothing. Now that tools call the outside world, each one can take hundreds of milliseconds, and the waits add up.

The model is telling you something useful when it puts several calls in one response. Anthropic's tool-use documentation spells it out: tool calls in a single turn are unordered, you can run them concurrently, sequentially or in any order, and when one call needs another's result, Claude asks for it in a later turn instead. Calls in the same response are meant to be independent.

---

## The pain: waiting for each call in turn

Three status checks, each taking 0.3 seconds, run the Module 2 way:

```python
import asyncio
import time

async def check_model_status(model: str) -> str:
    await asyncio.sleep(0.3)
    return f"{model}: available"

async def main():
    response_content = [
        ToolUseBlock(name="check_model_status", input={"model": "claude-sonnet"}),
        ToolUseBlock(name="check_model_status", input={"model": "claude-haiku"}),
        ToolUseBlock(name="check_model_status", input={"model": "claude-opus"}),
    ]
    tool_calls = [block for block in response_content if block.type == "tool_use"]

    start = time.perf_counter()
    results = []
    for call in tool_calls:
        output = await check_model_status(**call.input)
        results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
    print(f"one after another: {time.perf_counter() - start:.1f}s")

asyncio.run(main())
```
```
one after another: 0.9s
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes are already defined)*

Nothing about the second check needed the first to finish. The agent spent 0.9 seconds on work that could have taken 0.3, and the gap grows with every extra call.

---

## The fix: gather, then pair by position

[`asyncio.gather`, from Module 0](→ Module 0, the async lesson, asyncio gather concept), starts every call at once and waits until all of them finish. Here the three checks take different amounts of time, so they finish in a different order from the one they were requested in:

```python
import asyncio
import time

# how long the status service takes for each model in this demo
RESPONSE_TIMES = {"claude-sonnet": 0.3, "claude-haiku": 0.1, "claude-opus": 0.2}

async def check_model_status(model: str) -> str:
    await asyncio.sleep(RESPONSE_TIMES[model])
    print(f"  finished: {model}")
    return f"{model}: available"

async def main():
    tool_calls = [
        ToolUseBlock(name="check_model_status", input={"model": "claude-sonnet"}),
        ToolUseBlock(name="check_model_status", input={"model": "claude-haiku"}),
        ToolUseBlock(name="check_model_status", input={"model": "claude-opus"}),
    ]

    start = time.perf_counter()
    outputs = await asyncio.gather(*(check_model_status(**call.input) for call in tool_calls))
    print(f"all at once: {time.perf_counter() - start:.1f}s")

    # gather returns outputs in the same order as the calls, whatever order they finished in
    results = [
        {"type": "tool_result", "tool_use_id": call.id, "content": output}
        for call, output in zip(tool_calls, outputs)
    ]
    for call, result in zip(tool_calls, results):
        print(f"{call.id} ({call.input['model']}) -> {result['content']}")

asyncio.run(main())
```
```
  finished: claude-haiku
  finished: claude-opus
  finished: claude-sonnet
all at once: 0.3s
toolu_fake_01 (claude-sonnet) -> claude-sonnet: available
toolu_fake_02 (claude-haiku) -> claude-haiku: available
toolu_fake_03 (claude-opus) -> claude-opus: available
```
*(runs live, shows output — read-only demo snippet, not graded)*

The total drops to 0.3 seconds, the time of the slowest call. And even though Haiku finished first and Sonnet last, every result lands next to the right `tool_use_id`. That's because `gather` returns its outputs in the order the calls were *passed in*, not the order they finished. So `zip(tool_calls, outputs)` pairs each call with its own output safely. The pairing matters: [a real API matches results to calls by `tool_use_id`](→ Module 1, structured output and tool calling lesson, the full round trip concept), and a result attached to the wrong ID gives the model a wrong fact with full confidence.

---

## One failure shouldn't sink the others

By default, if any call inside `gather` raises, `gather` raises that exception, and the results of the calls that succeeded are thrown away. In an agent loop that turns one bad call into a crashed turn. [`return_exceptions=True`, from Module 0's async error handling](→ Module 0, the async lesson, error handling in async code concept), makes `gather` return the exception in that call's position instead, so each failure can be reported on its own:

```python
import asyncio

async def check_model_status(model: str) -> str:
    await asyncio.sleep(0.1)
    if model == "claude-sonet":
        raise ValueError(f"unknown model '{model}'")
    return f"{model}: available"

tool_calls = [
    ToolUseBlock(name="check_model_status", input={"model": "claude-haiku"}),
    ToolUseBlock(name="check_model_status", input={"model": "claude-sonet"}),
    ToolUseBlock(name="check_model_status", input={"model": "claude-opus"}),
]

async def without_return_exceptions():
    try:
        await asyncio.gather(*(check_model_status(**call.input) for call in tool_calls))
    except ValueError as e:
        print(f"gather raised: {e} -- the two successful results are lost")

async def with_return_exceptions():
    outputs = await asyncio.gather(
        *(check_model_status(**call.input) for call in tool_calls),
        return_exceptions=True,
    )
    results = []
    for call, output in zip(tool_calls, outputs):
        if isinstance(output, Exception):
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {output}", "is_error": True})
        else:
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
    for result in results:
        print(result)

asyncio.run(without_return_exceptions())
asyncio.run(with_return_exceptions())
```
```
gather raised: unknown model 'claude-sonet' -- the two successful results are lost
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_01', 'content': 'claude-haiku: available'}
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_02', 'content': "Error: unknown model 'claude-sonet'", 'is_error': True}
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_03', 'content': 'claude-opus: available'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

The failed call becomes an error observation, [exactly as Module 2 taught](→ Module 2, termination failure and control lesson, tool errors as observations not exceptions concept), and the two good results still reach the model. The `"is_error": True` field is the Claude API's way of marking a `tool_result` as a failure, so the model reads it as "this call failed" rather than as ordinary output that happens to start with "Error".

---

## Putting the lesson together

Here's the loop with everything from this lesson combined: each call gets [a timeout](→ this lesson, timeouts a tool that never answers concept), calls to the status service share [one semaphore](→ this lesson, staying under the limit client side throttling concept), and the whole batch runs through `gather`. The model asks about four models at once, and one of them hangs:

```python
import asyncio
import time

RESPONSE_TIMES = {"claude-sonnet": 0.3, "claude-haiku": 0.1, "claude-opus": 0.2, "claude-legacy": 5.0}

async def check_model_status(model: str) -> str:
    await asyncio.sleep(RESPONSE_TIMES[model])
    return f"{model}: available"

async def call_with_timeout(tool_function, timeout_seconds: float, **kwargs) -> str:
    try:
        return await asyncio.wait_for(tool_function(**kwargs), timeout=timeout_seconds)
    except TimeoutError:
        return f"Error: {tool_function.__name__} did not respond within {timeout_seconds} seconds"

TOOLS = {"check_model_status": check_model_status}

# one semaphore for the status service, shared by every call to it
STATUS_SERVICE_SLOTS = asyncio.Semaphore(3)

async def run_one(call, timeout_seconds: float) -> str:
    async with STATUS_SERVICE_SLOTS:
        return await call_with_timeout(TOOLS[call.name], timeout_seconds, **call.input)

async def run_agent(client, user_message: str, timeout_seconds: float = 1.0, max_steps: int = 10) -> str:
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = client.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")

        start = time.perf_counter()
        outputs = await asyncio.gather(*(run_one(call, timeout_seconds) for call in tool_calls), return_exceptions=True)
        print(f"ran {len(tool_calls)} tool calls in {time.perf_counter() - start:.1f}s")

        results = []
        for call, output in zip(tool_calls, outputs):
            if isinstance(output, Exception):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {output}", "is_error": True})
            else:
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer"

client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="Let me check all four."),
     ToolUseBlock(name="check_model_status", input={"model": "claude-sonnet"}),
     ToolUseBlock(name="check_model_status", input={"model": "claude-haiku"}),
     ToolUseBlock(name="check_model_status", input={"model": "claude-opus"}),
     ToolUseBlock(name="check_model_status", input={"model": "claude-legacy"})],
    [TextBlock(text="Sonnet, Haiku and Opus are available. The status check for claude-legacy timed out, so its status is unknown.")],
])

print(asyncio.run(run_agent(client, "Which of our four models are available?", timeout_seconds=1.0)))
```
```
ran 4 tool calls in 1.1s
Sonnet, Haiku and Opus are available. The status check for claude-legacy timed out, so its status is unknown.
```
*(runs live, shows output — read-only demo snippet, not graded; the model's final reply is scripted)*

Why 1.1 seconds? The semaphore allows three calls in flight, so `claude-legacy` waited about 0.1 seconds for Haiku to free a slot, then ran into its 1-second timeout. The other three finished long before. Two design points hide in `run_one`:

- **The timeout sits inside the semaphore**, so it measures only the call itself, not time spent queued for a slot. A call stuck in a long queue isn't the service's fault. If you'd rather cap the *total* time a call can take, including the queue, move `wait_for` outside the `async with`.
- **A slow call only costs its own slot.** The hung check didn't delay the other results; it just made the whole batch as slow as its timeout. That's why a sensible per-tool timeout matters even more once calls run together.

---

## When calls in one batch aren't really independent

Calls in one response are meant to be independent, but a model can occasionally batch two that aren't, for example creating an agent and updating that same agent in one turn. Run concurrently, the update can arrive first and fail because the agent doesn't exist yet.

You don't need to detect this ahead of time. Anthropic's guidance is to dispatch the whole batch and return the failed call's natural error with `is_error: true`. The model sees that the update failed because its prerequisite wasn't there, and asks for it again in the next turn, after the create has completed. The concurrent loop above already handles this correctly, because a failure is just another observation. If a particular agent genuinely must never run two calls at once, the Claude API can turn off parallel tool calls entirely with `disable_parallel_tool_use` in `tool_choice`, at the cost of one tool call per turn.

---

## Quiz cards

> **Q1.** Why does `zip(tool_calls, outputs)` pair each result with the right call, even when the calls finish in a different order?
> - A) `gather` waits for the calls to finish in the order they were started
> - B) `gather` returns outputs in the order the calls were passed in, regardless of which finished first ✅
> - C) Each output carries its `tool_use_id`, and `zip` matches on it
> - D) The fake client sorts the results before returning them
>
> *Explanation:* `gather` preserves argument order in its return value. Completion order only affects when `gather` returns, not the order of what it returns.

> **Q2.** What happens to the successful results if one call inside `gather` raises and `return_exceptions` isn't set?
> - A) They're returned alongside `None` for the failed call
> - B) `gather` retries the failed call automatically
> - C) `gather` raises the exception, and the successful results are lost ✅
> - D) Only the failed call's position is skipped
>
> *Explanation:* By default the first exception propagates out of `gather`. `return_exceptions=True` puts each exception in its call's position instead, so the rest survive.

> **Q3.** What does `"is_error": True` add to a `tool_result`?
> - A) It marks the result as a failure, so the model reads it as "this call failed" rather than ordinary output ✅
> - B) It tells the API to retry the tool call
> - C) It stops the loop immediately
> - D) Nothing; it's only for logging on your side
>
> *Explanation:* The content still explains what went wrong, and the flag removes any ambiguity about whether the call succeeded.

> **Q4.** Four status checks run through one semaphore of three slots, each with a 1-second timeout, and one of them hangs. Roughly how long does the batch take?
> - A) 0.3 seconds, the time of the slowest successful call
> - B) 4 seconds, one timeout per call
> - C) It never finishes, because the hung call holds a slot forever
> - D) About as long as the hung call's timeout, plus any time it waited for a slot ✅
>
> *Explanation:* Calls run together, so the batch lasts as long as its slowest member. The hung call is capped by its timeout, which also frees its slot.

> **Q5.** The model batches `create_agent` and `update_agent` for the same agent in one turn, and the update fails because the agent doesn't exist yet. What's the recommended handling?
> - A) Detect dependencies before dispatching and reorder the calls
> - B) Always run tool calls one at a time to avoid this
> - C) Return the update's error with `is_error: true`; the model will reissue it in the next turn ✅
> - D) Retry the update in a loop until the create finishes
>
> *Explanation:* Calls in one turn are meant to be independent, and when they occasionally aren't, the error observation is enough for the model to recover. Turning parallelism off entirely is possible, but costs a turn per call.

---

## Applied sandbox exercise

*(graded — concurrent tool execution in the agent loop)*

**Task shown to learner:** Implement `async def run_agent(client, user_message, timeout_seconds=1.0, max_steps=10)`. `call_with_timeout` (from this lesson's first concept) and a `TOOLS` registry of async tools are provided.

- Start `messages` with the user's message, then loop up to `max_steps` times.
- Call `client.create(messages=messages)` and append the assistant's full `response.content` once.
- Collect every `tool_use` block; a response may start with a text block. If there are none, return the response's text blocks joined together.
- Otherwise run **all** the calls at once with `asyncio.gather`, each through `call_with_timeout(TOOLS[call.name], timeout_seconds, **call.input)`, with `return_exceptions=True`.
- Build one `tool_result` per call, in call order, each with its `tool_use_id`. A call that raised gets `"content": "Error: <the exception>"` and `"is_error": True`.
- Send all the results back in one user message, and keep looping.
- If `max_steps` runs out, return a message saying so that includes the number of steps.

**Provided code:**
```python
import asyncio, time

async def call_with_timeout(tool_function, timeout_seconds: float, **kwargs) -> str:
    try:
        return await asyncio.wait_for(tool_function(**kwargs), timeout=timeout_seconds)
    except TimeoutError:
        return f"Error: {tool_function.__name__} did not respond within {timeout_seconds} seconds"

CALLS = []

async def get_agent_status(agent_name: str) -> str:
    CALLS.append(agent_name)
    await asyncio.sleep(0.3)
    if agent_name == "ghost_agent":
        raise KeyError(f"no agent named '{agent_name}'")
    return f"{agent_name}: active"

async def get_agent_model(agent_name: str) -> str:
    CALLS.append(agent_name)
    await asyncio.sleep(0.3)
    return f"{agent_name}: claude-sonnet"

async def slow_audit(agent_name: str) -> str:
    await asyncio.sleep(5)
    return "audit complete"

TOOLS = {"get_agent_status": get_agent_status, "get_agent_model": get_agent_model, "slow_audit": slow_audit}
```

**Starter code:**
```python
async def run_agent(client, user_message: str, timeout_seconds: float = 1.0, max_steps: int = 10) -> str:
    # TODO: the loop described above, running each response's tool calls concurrently
    ...
```

**Hidden tests:**
```python
def tool_results_sent(client, request_index):
    # the last message of a given request, i.e. the user message carrying tool results
    return client.seen[request_index][-1]["content"]

# 1. a text block before two tool calls: both run, together, and pair by id
CALLS.clear()
a = ToolUseBlock(name="get_agent_status", input={"agent_name": "research_agent"})
b = ToolUseBlock(name="get_agent_model", input={"agent_name": "support_agent"})
client = RecordingClient([[TextBlock(text="Checking both."), a, b], [TextBlock(text="done")]])
start = time.perf_counter()
answer = asyncio.run(run_agent(client, "status and model?"))
elapsed = time.perf_counter() - start
assert answer == "done", answer
assert sorted(CALLS) == ["research_agent", "support_agent"], CALLS
results = tool_results_sent(client, 1)
assert [r["tool_use_id"] for r in results] == [a.id, b.id]
assert results[0]["content"] == "research_agent: active"
assert results[1]["content"] == "support_agent: claude-sonnet"
# 2. the two 0.3s calls overlapped
assert elapsed < 0.5, elapsed
# 3. the assistant turn was appended once, before the results
assert client.seen[1][1]["role"] == "assistant" and len(client.seen[1]) == 3

# 4. one call fails: it comes back as an error, the other still succeeds
ok = ToolUseBlock(name="get_agent_status", input={"agent_name": "research_agent"})
bad = ToolUseBlock(name="get_agent_status", input={"agent_name": "ghost_agent"})
client = RecordingClient([[ok, bad], [TextBlock(text="one missing")]])
assert asyncio.run(run_agent(client, "check both")) == "one missing"
results = tool_results_sent(client, 1)
assert results[0]["content"] == "research_agent: active" and not results[0].get("is_error")
assert results[1]["is_error"] is True and results[1]["content"].startswith("Error:") and "ghost_agent" in results[1]["content"]

# 5. a hung tool is cut off by the timeout and reported, without holding up the other call
slow = ToolUseBlock(name="slow_audit", input={"agent_name": "research_agent"})
fast = ToolUseBlock(name="get_agent_status", input={"agent_name": "support_agent"})
client = RecordingClient([[slow, fast], [TextBlock(text="partial")]])
start = time.perf_counter()
asyncio.run(run_agent(client, "audit", timeout_seconds=0.4))
assert time.perf_counter() - start < 1.0
results = tool_results_sent(client, 1)
assert results[0]["content"].startswith("Error:") and results[1]["content"] == "support_agent: active"

# 6. max_steps still bounds the loop
loop = [[ToolUseBlock(name="get_agent_status", input={"agent_name": f"a{i}"})] for i in range(10)]
client = RecordingClient(loop)
out = asyncio.run(run_agent(client, "x", max_steps=2))
assert client.call_count == 2 and "2" in out, out
```

**Hint (shown on request):** Start from Module 2's collect-every-call loop. Replace its inner `for` loop that runs each call with one `await asyncio.gather(*(... for call in tool_calls), return_exceptions=True)`, then loop over `zip(tool_calls, outputs)` to build the results, checking `isinstance(output, Exception)` for each one.

**Reference solution:**
```python
async def run_agent(client, user_message: str, timeout_seconds: float = 1.0, max_steps: int = 10) -> str:
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = client.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")
        outputs = await asyncio.gather(
            *(call_with_timeout(TOOLS[call.name], timeout_seconds, **call.input) for call in tool_calls),
            return_exceptions=True,
        )
        results = []
        for call, output in zip(tool_calls, outputs):
            if isinstance(output, Exception):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {output}", "is_error": True})
            else:
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer"
```

**Explanation:** The loop's shape is unchanged from Module 2: the assistant turn is appended once, every call is answered, and all results go back in one message. Only the execution changed, from a `for` loop to one `gather`. The tests check what matters about that change: the two 0.3-second calls finish in under half a second (test 2), results still pair with the right IDs even though the calls ran together (test 1), a failing call is reported with `is_error` without losing its neighbour (test 4), and a hung call is cut off by its timeout without holding up the fast one (test 5).

---

*(End of Concept 4 — final concept of Lesson 4. The lesson continues with the recap and comprehensive sandbox.)*
