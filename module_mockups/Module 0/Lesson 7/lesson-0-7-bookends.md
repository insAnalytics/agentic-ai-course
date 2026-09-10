# Write Asynchronous and Concurrent Python

> **You'll be able to**
> - Explain why sequential code wastes time on I/O-bound work, and what
>   "concurrency" actually means as a fix for that specific problem
> - Write `async def` coroutines, use `await`, and avoid the "called
>   without `await`" gotcha — a coroutine object that never actually runs
> - Use `asyncio.gather()` to run multiple independent operations
>   concurrently, and `asyncio.create_task()` when you need to start
>   something before you're ready to wait for its result
> - Avoid the specific trap of a blocking call (like `time.sleep()`)
>   silently freezing an entire event loop from inside a coroutine
> - Handle errors in async code — both a normal `try`/`except` around
>   `await`, and `gather()`'s `return_exceptions=True` for collecting
>   partial failures instead of losing every result to the first one
> - Recognize when async is the wrong tool entirely — CPU-bound work needs
>   a different answer (`multiprocessing`), not `async`/`await`

**Why it matters**
An agent that calls three tools, or three different LLM providers, or
fans a single request out to several data sources, is doing exactly the
kind of independent, I/O-bound waiting this lesson is built around.
Writing that sequentially — waiting for each one to fully finish before
starting the next — is correct but slow, in a way that compounds badly
as an agent calls more tools per turn. Everything in this lesson, from
`gather()` to `return_exceptions=True`, is aimed at the same real
target: agent code that does several things at once, and handles it
gracefully when one of them doesn't come back cleanly.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** Why is it wasteful for three independent API calls to run
> strictly one after another, each with its own separate wait?
> - A) It isn't wasteful — this is the only correct way to run them
> - B) The CPU sits idle during each wait, and there's no actual reason independent calls couldn't be waiting at the same time instead ✅
> - C) Running them in a different order would change their results
> - D) Sequential calls always take longer than the sum of their waits

> **Q2.** What actually happens when you call an `async def` function
> without `await`?
> - A) The function body runs normally
> - B) It returns a coroutine object without running the function's body at all ✅
> - C) It raises a `SyntaxError`
> - D) It runs the function in a background thread automatically

> **Q3.** Given three calls with waits of 2s, 1s, and 0.5s run through
> `asyncio.gather()`, what's the expected total time?
> - A) 3.5s, the sum of all three
> - B) Roughly 2s, the single longest wait, since all three overlap ✅
> - C) 0.5s, the shortest wait
> - D) Unpredictable, varies randomly

> **Q4.** What happens if a coroutine's body calls the blocking
> `time.sleep()` instead of `await asyncio.sleep()`?
> - A) Nothing different — both behave identically inside `async def`
> - B) It blocks the entire event loop, preventing every other coroutine sharing that loop from making progress too ✅
> - C) It raises a `SyntaxError` immediately
> - D) It only affects coroutines defined later in the file

> **Q5.** What does `asyncio.create_task(some_coroutine())` let you do
> that calling `some_coroutine()` alone doesn't?
> - A) Nothing different — they're equivalent
> - B) Start the coroutine running immediately in the background, and `await` its result later, potentially after doing other work in between ✅
> - C) Run the coroutine synchronously, blocking until it finishes
> - D) Guarantee the coroutine runs on a separate CPU core

> **Q6.** By default, if one coroutine passed to `asyncio.gather()`
> raises an exception, what happens?
> - A) The other coroutines' results are still returned normally
> - B) `gather()` itself raises that exception, and any other results — even successful ones — are discarded ✅
> - C) The failed coroutine is automatically retried
> - D) The failure is silently replaced with `None`

> **Q7.** With `return_exceptions=True`, how do you tell a real result
> apart from a failure in `gather()`'s returned list?
> - A) Real results always appear before exceptions in the list
> - B) Check each item with `isinstance(item, Exception)` ✅
> - C) Exceptions are automatically converted to `None`
> - D) There's no reliable way to distinguish them

> **Q8.** Why doesn't wrapping a CPU-heavy loop (with no `await` inside
> it) in `async def` make it run any faster?
> - A) `async def` functions can't contain loops at all
> - B) Without an `await` point inside the loop, the coroutine never actually pauses to let anything else run — it behaves like one long blocking call ✅
> - C) This actually does make it significantly faster
> - D) `gather()` refuses to accept CPU-bound coroutines

---

## Comprehensive sandbox

*(end of lesson, applied — combines all six concepts in a new scenario:
a background logging task started with `create_task()`, several tool
calls run concurrently with `gather(..., return_exceptions=True)`, and
the results split into successes and failures — verified against actual
elapsed time to confirm real concurrency occurred, not just correct
async syntax.)*

*Starter code shown to learner:*
```python
import asyncio

async def log_run_start(log: list) -> None:
    await asyncio.sleep(0.1)
    log.append("started")

async def call_tool(tool_name: str, delay: float, should_fail: bool = False) -> str:
    await asyncio.sleep(delay)
    if should_fail:
        raise ValueError(f"{tool_name} failed")
    return f"{tool_name}: ok"

async def run_tools(tool_specs: list, log: list) -> tuple:
    """
    tool_specs: a list of dicts, each shaped like:
      {"tool_name": ..., "delay": ..., "should_fail": ...}  ("should_fail" optional, defaults False)
    log: a list to record lifecycle events into

    - Immediately start log_run_start(log) running in the background
      using create_task — don't await it yet.
    - Concurrently run call_tool(...) for every spec in tool_specs, using
      asyncio.gather with return_exceptions=True.
    - Await the logging task too, so it's guaranteed to have finished
      before this function returns.
    - Split the gather results into two lists: successes (real results)
      and failures (str(e) for each exception), preserving relative
      order within each list.
    - Return (successes, failures).
    """
    # TODO: implement using create_task, gather, and return_exceptions=True
    pass
```

*Task shown to learner:* Implement `run_tools` exactly as described —
start the logging task in the background immediately, run every tool
call concurrently with `return_exceptions=True`, await the logging task
before returning, and split the results into successes and failures.

*Hidden test cases:*
```python
import time

async def run_test():
    log = []
    tool_specs = [
        {"tool_name": "search", "delay": 0.3},
        {"tool_name": "calculator", "delay": 0.1, "should_fail": True},
        {"tool_name": "weather", "delay": 0.2},
    ]
    start = time.perf_counter()
    successes, failures = await run_tools(tool_specs, log)
    elapsed = time.perf_counter() - start
    return successes, failures, log, elapsed

successes, failures, log, elapsed = asyncio.run(run_test())

assert successes == ["search: ok", "weather: ok"]
assert failures == ["calculator failed"]
assert log == ["started"]   # the background task genuinely completed
assert elapsed < 0.5   # concurrent: ~0.3s, the longest wait — NOT 0.3+0.1+0.2=0.6s
```

*Hint (shown on request):* Start with
`log_task = asyncio.create_task(log_run_start(log))` before anything
else. Build the tool coroutines with a
[list comprehension](→ Module 0, the data structures lesson, comprehensions concept)
— `[call_tool(spec["tool_name"], spec["delay"], spec.get("should_fail", False)) for spec in tool_specs]`
— then `await asyncio.gather(*that_list, return_exceptions=True)`. After
the `gather()` call, `await log_task` to make sure the background task
has actually finished. Then loop through the gather results, sorting
each into `successes` or `failures` with `isinstance(result, Exception)`,
same as the per-concept exercise earlier in this lesson.

*Correct answer + explanation (shown on failure, if requested):*
```python
async def run_tools(tool_specs: list, log: list) -> tuple:
    log_task = asyncio.create_task(log_run_start(log))

    calls = [
        call_tool(spec["tool_name"], spec["delay"], spec.get("should_fail", False))
        for spec in tool_specs
    ]
    results = await asyncio.gather(*calls, return_exceptions=True)

    await log_task

    successes = []
    failures = []
    for result in results:
        if isinstance(result, Exception):
            failures.append(str(result))
        else:
            successes.append(result)

    return successes, failures
```
Every mechanism from this lesson is doing real work here:
`create_task()` starts the logging coroutine running immediately, in the
background, while the tool calls are being built and gathered —
confirmed by the timing assertion, since if anything were secretly
sequential, `elapsed` would be far closer to 0.6s than 0.3s. `gather()`
with `return_exceptions=True` means the failing `calculator` call doesn't
prevent `search` and `weather` from completing or being reported, and
`isinstance(result, Exception)` is what separates the two outcomes back
out — the exact composition this lesson has been building toward, one
piece at a time.
