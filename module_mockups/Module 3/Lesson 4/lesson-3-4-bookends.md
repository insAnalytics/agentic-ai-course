# Tools That Call the Outside World

## Intro

> **You'll be able to**
> - Put a hard time limit on any external tool call, and explain why none of Module 2's loop guards can stop a call that never returns
> - Decide which failures are worth retrying from their status codes, back off with jitter, honour `Retry-After`, and stop without a pointless final wait
> - Explain why retrying a write can do it twice, and make writes safe to retry with an idempotency key or a check first
> - Throttle your own traffic to a service with a shared semaphore, and tell a concurrency limit apart from a per-minute rate limit
> - Run a response's independent tool calls concurrently, keep every result paired with its call, and stop one failure from sinking the rest

**Why it matters**

Every tool this course has built so far ran inside your own process and answered instantly. Real agents call other people's services, and those services are slow, busy, rate-limited and sometimes down. An agent that handles this badly doesn't just fail occasionally: it hangs on one slow call, burns requests retrying errors that can never succeed, trips rate limits with bursts of its own making, or sends the same alert twice.

None of the fixes are exotic. A timeout, a sensible retry policy, a shared semaphore and `asyncio.gather` are each a few lines. What this lesson adds is knowing *which* failure each one handles, and how they fit together inside the agent loop, where the model, not your code, decides how many calls arrive at once.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** A tool call to a status service never returns. Which of these can stop it?
> - A) `max_steps`, once the loop reaches its limit
> - B) Repeated-action detection, when the model asks again
> - C) A timeout on the call itself ✅
> - D) A goal-state check after the call returns
>
> *Explanation:* The other three all run between steps, and a call that never returns means the loop never reaches the next step. Only a limit on the call itself bounds it.

> **Q2.** Which of these responses is worth retrying?
> - A) 404 Not Found
> - B) 422 Unprocessable Entity
> - C) 403 Forbidden
> - D) 503 Service Unavailable ✅
>
> *Explanation:* 5xx means the server had a problem that may clear. The 4xx codes here describe a problem with the request itself, which will fail the same way every time.

> **Q3.** Why does the concurrent loop still pair every result with the right `tool_use_id` when calls finish in a different order?
> - A) `gather` returns its outputs in the order the calls were passed in ✅
> - B) Each tool includes its call's ID in its return value
> - C) The semaphore forces calls to finish in request order
> - D) The API reorders the results by ID before the model reads them
>
> *Explanation:* Completion order doesn't affect the order of `gather`'s return value, so `zip(tool_calls, outputs)` stays aligned.

> **Q4.** A `create_agent` request times out. What can you conclude?
> - A) The agent was not created
> - B) The agent was created, since the request was sent
> - C) Nothing certain: the request may have succeeded with only the reply delayed ✅
> - D) The registry is down and every later call will fail
>
> *Explanation:* A timeout stops your side from waiting; it can't stop or undo work already done on the server. For a write, the outcome is unknown.

> **Q5.** What does the idempotency-key pattern require?
> - A) A new key for every attempt, so the server can tell retries apart
> - B) One key per logical action, sent unchanged on every attempt of that action ✅
> - C) One key per tool, shared by all its calls
> - D) A key only on the final attempt
>
> *Explanation:* The server uses the key to recognise a repeat of an action it already handled. A new key per attempt makes each retry look like new work.

> **Q6.** A developer creates `asyncio.Semaphore(3)` inside the function that each tool call runs. What limit does that enforce?
> - A) Three calls at a time, as intended
> - B) One call at a time
> - C) Three calls per minute
> - D) No limit at all, because every call has its own semaphore ✅
>
> *Explanation:* A semaphore only limits calls that share it. One semaphore per service, created once, is what actually caps traffic.

> **Q7.** A service allows 100 requests per minute. Why isn't a semaphore on its own enough?
> - A) It caps how many requests overlap, not how many start per minute ✅
> - B) Semaphores only work with synchronous code
> - C) A semaphore can't be larger than 10
> - D) Rate limits are enforced by the SDK, not by your code
>
> *Explanation:* With fast calls, a few slots can still start many requests a minute. A per-minute limit needs requests spaced over time, for example with a token bucket.

> **Q8.** Without `return_exceptions=True`, what happens when one of five concurrent tool calls raises?
> - A) The other four results are returned, with `None` for the failed one
> - B) `gather` raises, and the four successful results are lost ✅
> - C) The failed call is retried automatically
> - D) The loop skips that call and continues
>
> *Explanation:* By default the first exception propagates out of `gather`. With `return_exceptions=True`, each failure sits in its own position and can be reported individually.

> **Q9.** The Anthropic SDK already retries 429s and 5xx errors. Why does this lesson still build retry logic?
> - A) The SDK's retries don't honour `Retry-After`
> - B) The SDK only retries synchronous calls
> - C) The SDK's retries were removed in recent versions
> - D) They protect the model calls, not the calls your own tools make to other services ✅
>
> *Explanation:* Model calls go through the SDK and get its retry behaviour. A tool calling some other API with a plain HTTP client gets only the retries you write.

> **Q10.** In one turn the model asks to create an agent and update that same agent, and the update fails because the agent doesn't exist yet. What's the recommended handling?
> - A) Return the update's error with `is_error: true`, and the model will reissue it next turn ✅
> - B) Stop the loop, since the model made an invalid request
> - C) Always run tool calls one at a time so this can't happen
> - D) Retry the update with backoff until the create completes
>
> *Explanation:* Calls in one turn are meant to be independent. When they occasionally aren't, the error observation is enough for the model to recover in its next turn.

---

### Comprehensive sandbox

*(applied, multi-file — a resilient tool executor for the agent registry)*

**Task shown to learner:** The registry agent now calls two external services: a status service (`get_agent_status`) and a model catalog (`get_model_info`). Both are simulated in `services.py`, which is read-only. Each allows at most two requests in flight and answers anything beyond that with a 429, and each can be scripted to fail, hang or rate-limit. Complete `agent.py`:

- **`SERVICE_SLOTS`:** one `asyncio.Semaphore(2)` per tool, created once.
- **`execute_tool(call, timeout_seconds, max_attempts, base_delay)`:**
  - run `TOOLS[call.name](**call.input)` inside that tool's semaphore, with `asyncio.wait_for` and `timeout_seconds`
  - on a timeout, or a `ServiceError` whose status is in `RETRYABLE_STATUS`, try again, up to `max_attempts` attempts in total
  - wait between attempts: the error's `retry_after` if it has one, otherwise `base_delay * 2 ** attempt` plus a random amount up to `base_delay`
  - sleep *outside* the semaphore, and don't sleep after the last attempt
  - a non-retryable status returns an `"Error: ..."` string immediately, naming the tool and the status
  - giving up returns an `"Error: ..."` string naming the tool and the last problem
  - any other exception is not caught
- **`run_agent(client, user_message, timeout_seconds, max_attempts, base_delay, max_steps)`:**
  - the collect-every-call loop, running each response's calls concurrently through `execute_tool` with `asyncio.gather(..., return_exceptions=True)`
  - every call gets one `tool_result` with its `tool_use_id`, in call order, all in one user message
  - a result that's an exception, or a string starting with `"Error:"`, gets `"is_error": True`
  - return the text once a response has no tool calls; return a step-limit message if `max_steps` runs out

**Tab: `services.py`** (read-only)
```python
# simulated external services for the agent registry -- read-only
import asyncio

class ServiceError(Exception):
    def __init__(self, status_code: int, retry_after: float | None = None):
        super().__init__(f"service returned status {status_code}")
        self.status_code = status_code
        self.retry_after = retry_after

# an outcome that never answers
HANG = "hang"

class SimulatedService:
    def __init__(self, max_concurrent: int, response_time: float):
        self.max_concurrent = max_concurrent
        self.response_time = response_time
        self.reset()

    def reset(self, scripts: dict | None = None):
        # scripts maps an argument value to the outcomes of its first few requests
        self.scripts = {key: list(outcomes) for key, outcomes in (scripts or {}).items()}
        self.requests = {}
        self.in_flight = 0
        self.rejected = 0

    async def handle(self, key: str, success: str) -> str:
        self.requests[key] = self.requests.get(key, 0) + 1
        if self.in_flight >= self.max_concurrent:
            self.rejected += 1
            raise ServiceError(429, retry_after=1.0)
        self.in_flight += 1
        try:
            outcome = self.scripts[key].pop(0) if self.scripts.get(key) else success
            if outcome == HANG:
                await asyncio.sleep(60)
            await asyncio.sleep(self.response_time)
            if isinstance(outcome, Exception):
                raise outcome
            return outcome
        finally:
            self.in_flight -= 1

status_service = SimulatedService(max_concurrent=2, response_time=0.1)
catalog_service = SimulatedService(max_concurrent=2, response_time=0.1)

async def get_agent_status(agent_name: str) -> str:
    """Returns an agent's current status from the external status service."""
    return await status_service.handle(agent_name, f"{agent_name}: active")

async def get_model_info(model: str) -> str:
    """Returns a model's availability from the external model catalog."""
    return await catalog_service.handle(model, f"{model}: available")
```

**Tab: `agent.py`** (starter, entry file)
```python
import asyncio
import random
from services import ServiceError, get_agent_status, get_model_info

RETRYABLE_STATUS = {408, 429, 500, 502, 503, 504}

TOOLS = {"get_agent_status": get_agent_status, "get_model_info": get_model_info}

# TODO: one asyncio.Semaphore(2) per external service, keyed by tool name
SERVICE_SLOTS = {}

async def execute_tool(call, timeout_seconds: float = 1.0, max_attempts: int = 3, base_delay: float = 0.5) -> str:
    # TODO: run TOOLS[call.name](**call.input) inside that tool's semaphore, with a timeout.
    # Retry timeouts and retryable ServiceErrors (honouring retry_after), up to max_attempts,
    # sleeping between attempts outside the semaphore. A non-retryable status returns an
    # "Error: ..." string at once. Anything else raises. Giving up returns an "Error: ..." string.
    ...

async def run_agent(client, user_message: str, timeout_seconds: float = 1.0, max_attempts: int = 3, base_delay: float = 0.5, max_steps: int = 10) -> str:
    # TODO: the collect-every-call loop, running each response's calls concurrently through
    # execute_tool. A call whose output is an exception, or a string starting with "Error:",
    # gets "is_error": True on its tool_result.
    ...
```

**Hidden tests:**
```python
from fake import *
import asyncio, time
import services
from services import ServiceError, HANG, status_service, catalog_service
from agent import run_agent

def results_of(client, request_index):
    return client.seen[request_index][-1]["content"]

async def all_tests():
    fast = dict(timeout_seconds=0.3, max_attempts=3, base_delay=0.01)

    # 1. transient 503s are retried until they succeed
    status_service.reset({"research_agent": [ServiceError(503), ServiceError(503)]})
    call = ToolUseBlock(name="get_agent_status", input={"agent_name": "research_agent"})
    client = RecordingClient([[call], [TextBlock(text="done")]])
    assert await run_agent(client, "status?", **fast) == "done"
    r = results_of(client, 1)[0]
    assert r["content"] == "research_agent: active" and not r.get("is_error"), r
    assert status_service.requests["research_agent"] == 3

    # 2. a 404 is not retried, and comes back flagged as an error
    status_service.reset({"ghost_agent": [ServiceError(404)]})
    call = ToolUseBlock(name="get_agent_status", input={"agent_name": "ghost_agent"})
    client = RecordingClient([[call], [TextBlock(text="done")]])
    await run_agent(client, "status?", **fast)
    r = results_of(client, 1)[0]
    assert r["is_error"] is True and "404" in r["content"], r
    assert status_service.requests["ghost_agent"] == 1

    # 3. six calls to a service that allows two at once: throttled, never rejected
    status_service.reset()
    calls = [ToolUseBlock(name="get_agent_status", input={"agent_name": f"agent_{i}"}) for i in range(6)]
    client = RecordingClient([[TextBlock(text="Checking all six.")] + calls, [TextBlock(text="done")]])
    await run_agent(client, "status of all?", **fast)
    assert status_service.rejected == 0, status_service.rejected
    results = results_of(client, 1)
    assert [x["tool_use_id"] for x in results] == [c.id for c in calls]
    assert all(x["content"] == f"agent_{i}: active" for i, x in enumerate(results))

    # 4. a hung service is cut off, retried, then reported -- without holding up another service
    catalog_service.reset({"claude-legacy": [HANG, HANG]})
    status_service.reset()
    hung = ToolUseBlock(name="get_model_info", input={"model": "claude-legacy"})
    ok = ToolUseBlock(name="get_agent_status", input={"agent_name": "research_agent"})
    client = RecordingClient([[hung, ok], [TextBlock(text="done")]])
    start = time.perf_counter()
    await run_agent(client, "check", timeout_seconds=0.2, max_attempts=2, base_delay=0.01)
    elapsed = time.perf_counter() - start
    results = results_of(client, 1)
    assert results[0]["is_error"] is True and results[0]["content"].startswith("Error:"), results[0]
    assert catalog_service.requests["claude-legacy"] == 2
    assert results[1]["content"] == "research_agent: active"
    assert elapsed < 1.0, elapsed

    # 5. a retry_after from the service is honoured
    catalog_service.reset({"claude-opus": [ServiceError(429, retry_after=0.3)]})
    call = ToolUseBlock(name="get_model_info", input={"model": "claude-opus"})
    client = RecordingClient([[call], [TextBlock(text="done")]])
    start = time.perf_counter()
    await run_agent(client, "opus?", **fast)
    assert time.perf_counter() - start >= 0.3
    assert results_of(client, 1)[0]["content"] == "claude-opus: available"

    # 6. two calls in one response to different services run concurrently
    status_service.reset(); catalog_service.reset()
    a = ToolUseBlock(name="get_agent_status", input={"agent_name": "research_agent"})
    b = ToolUseBlock(name="get_model_info", input={"model": "claude-sonnet"})
    client = RecordingClient([[a, b], [TextBlock(text="done")]])
    start = time.perf_counter()
    await run_agent(client, "both", **fast)
    assert time.perf_counter() - start < 0.18

    # 7. a bug in a tool is not retried as if it were a service failure
    status_service.reset({"broken_agent": [KeyError("unexpected field")]})
    call = ToolUseBlock(name="get_agent_status", input={"agent_name": "broken_agent"})
    client = RecordingClient([[call], [TextBlock(text="done")]])
    await run_agent(client, "status?", **fast)
    r = results_of(client, 1)[0]
    assert r["is_error"] is True
    assert status_service.requests["broken_agent"] == 1

asyncio.run(all_tests())
```

**Hint (shown on request):** Build it from this lesson's pieces. `execute_tool` is the second concept's retry loop, with the first concept's `wait_for` inside and the third concept's `async with SERVICE_SLOTS[call.name]` around the request only. Catch `TimeoutError` and `ServiceError` separately: both can be retried, but only `ServiceError` has a status to check. `run_agent` is the last concept's concurrent loop, with one extra check: an output string starting with `"Error:"` also gets `is_error`.

**Reference solution — `agent.py`:**
```python
import asyncio
import random
from services import ServiceError, get_agent_status, get_model_info

RETRYABLE_STATUS = {408, 429, 500, 502, 503, 504}

TOOLS = {"get_agent_status": get_agent_status, "get_model_info": get_model_info}

# one semaphore per external service, created once and shared by every call to it
SERVICE_SLOTS = {"get_agent_status": asyncio.Semaphore(2), "get_model_info": asyncio.Semaphore(2)}

async def execute_tool(call, timeout_seconds: float = 1.0, max_attempts: int = 3, base_delay: float = 0.5) -> str:
    name = call.name
    last_problem = None
    for attempt in range(max_attempts):
        try:
            # hold a slot only while the request is actually in flight
            async with SERVICE_SLOTS[name]:
                return await asyncio.wait_for(TOOLS[name](**call.input), timeout=timeout_seconds)
        except TimeoutError:
            last_problem = f"no response within {timeout_seconds} seconds"
            delay = base_delay * 2 ** attempt + random.uniform(0, base_delay)
        except ServiceError as e:
            if e.status_code not in RETRYABLE_STATUS:
                return f"Error: {name} failed with status {e.status_code}; not retried, since the same request would fail the same way"
            last_problem = f"status {e.status_code}"
            if e.retry_after is not None:
                delay = e.retry_after
            else:
                delay = base_delay * 2 ** attempt + random.uniform(0, base_delay)
        # the wait happens outside the semaphore, so a retrying call doesn't block others
        if attempt < max_attempts - 1:
            await asyncio.sleep(delay)
    return f"Error: {name} still failing after {max_attempts} attempts ({last_problem})"

async def run_agent(client, user_message: str, timeout_seconds: float = 1.0, max_attempts: int = 3, base_delay: float = 0.5, max_steps: int = 10) -> str:
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = client.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")
        outputs = await asyncio.gather(
            *(execute_tool(call, timeout_seconds, max_attempts, base_delay) for call in tool_calls),
            return_exceptions=True,
        )
        results = []
        for call, output in zip(tool_calls, outputs):
            if isinstance(output, Exception):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {output}", "is_error": True})
            elif output.startswith("Error:"):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": output, "is_error": True})
            else:
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer"
```

**Explanation:** Each test exercises one concept against the real loop:

- **Retries:** test 1 shows two 503s followed by success, three requests in all. Test 2 shows a 404 sent once and flagged as an error for the model to act on.
- **Throttling:** test 3 fires six calls at a service that allows two at once, and none is rejected. That's the semaphore doing its job, not retries cleaning up afterwards.
- **Timeouts:** test 4 shows a hung service cut off, retried once, then reported, while a call to a different service in the same response still succeeds quickly.
- **`Retry-After`:** test 5 shows the server's requested wait being honoured.
- **Concurrency:** test 6 shows two calls in one response overlapping.
- **Bugs aren't retried:** test 7 shows a tool bug surfacing once instead of being retried as if the service had failed.

One design choice is easy to miss because no test forces it: the backoff sleep happens *outside* the semaphore. Sleeping while holding a slot would leave that slot unused for the whole wait, throttling every other call to the service for no reason.
