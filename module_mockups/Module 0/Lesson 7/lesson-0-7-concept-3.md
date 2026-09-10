# Module 0, Lesson 7 — Concept 3: Real concurrency with `asyncio.gather()`

---

## `async`/`await` alone doesn't give you concurrency

This is worth demonstrating directly, since it's a natural assumption to
make: simply rewriting the three API calls [from Concept 1](→ this lesson, why concurrency matters concept, the sequential timing example) as coroutines, and `await`-ing each one, does **not** make them run concurrently:

```python
import asyncio

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

async def call_weather_api():
    print("calling weather API...")
    await asyncio.sleep(1)
    return "72F and sunny"

async def call_calculator_api():
    print("calling calculator API...")
    await asyncio.sleep(0.5)
    return "4"

async def main():
    search_result = await call_search_api()
    weather_result = await call_weather_api()
    calculator_result = await call_calculator_api()
    return search_result, weather_result, calculator_result

import time
start = time.perf_counter()
results = asyncio.run(main())
elapsed = time.perf_counter() - start
print(f"total time: {elapsed:.1f}s")
```
```
calling search API...
calling weather API...
calling calculator API...
total time: 3.5s
```
*(runs live, shows output — read-only demo snippet, not graded)*

Still 3.5 seconds — every [`await` still fully waits for that specific coroutine to finish before moving to the next line](→ this lesson, async/await and coroutines concept, the sequential await explanation), exactly like a regular function call would. `async`/`await` alone just gives you the *ability* to pause and resume — it doesn't automatically run multiple things at once. Something has to actually schedule them to overlap; that's what `asyncio.gather()` does.

---

## `asyncio.gather()` — actually running things concurrently

`asyncio.gather()` takes multiple coroutines and runs them concurrently,
returning all their results together once every one of them has finished:

```python
import asyncio
import time

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

async def call_weather_api():
    print("calling weather API...")
    await asyncio.sleep(1)
    return "72F and sunny"

async def call_calculator_api():
    print("calling calculator API...")
    await asyncio.sleep(0.5)
    return "4"

async def main():
    return await asyncio.gather(
        call_search_api(),
        call_weather_api(),
        call_calculator_api(),
    )

start = time.perf_counter()
results = asyncio.run(main())
elapsed = time.perf_counter() - start

print(results)
print(f"total time: {elapsed:.1f}s")
```
```
calling search API...
calling weather API...
calling calculator API...
['3 results found', '72F and sunny', '4']
total time: 2.0s
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two things to notice. First, all three `"calling ... API..."` lines print
immediately, one after another — every coroutine starts right away,
rather than waiting for the previous one to finish. Second, the total
time is now roughly **2.0 seconds — the single longest wait**, not the
sum of all three. While `call_search_api()` is in the middle of its
2-second wait, the other two are also waiting, at the same time, instead
of sitting in line — exactly [the overlap Concept 1 identified as the actual goal](→ this lesson, why concurrency matters concept, what concurrency means here explanation).

`asyncio.gather()` is passed each coroutine directly — note
`call_search_api()` here, *calling* the function to produce a coroutine
object, not `await`-ing it individually; `gather()` itself is what you
`await`, and it takes care of running all three underneath that one
`await`.

---

## Results come back in the order you passed them, not the order they finish

`results` above is `['3 results found', '72F and sunny', '4']` — matching
the order `call_search_api`, `call_weather_api`, `call_calculator_api`
were passed to `gather()`, even though `call_calculator_api()` (a
half-second wait) actually *finishes* first, well before
`call_search_api()`'s two-second wait completes:

```python
import asyncio

async def call_search_api():
    await asyncio.sleep(2)
    return "3 results found"

async def call_weather_api():
    await asyncio.sleep(1)
    return "72F and sunny"

async def call_calculator_api():
    await asyncio.sleep(0.5)
    return "4"

async def main():
    search, weather, calc = await asyncio.gather(
        call_search_api(),
        call_weather_api(),
        call_calculator_api(),
    )
    print(search, weather, calc)

asyncio.run(main())
```
```
3 results found 72F and sunny 4
```
*(runs live, shows output — read-only demo snippet, not graded)*

This makes `gather()`'s results reliably unpackable — [the same tuple-unpacking mechanism from the data structures lesson](→ Module 0, the data structures lesson, tuples concept, the unpacking explanation) — `search, weather, calc = await asyncio.gather(...)` always lines up correctly with which call is which, regardless of which one actually completed fastest behind the scenes.

---

## Quiz cards

> **Q1.** Rewriting three sequential API calls as coroutines and
> `await`-ing each one in turn, without `gather()` — does this run them
> concurrently?
> - A) Yes, `async`/`await` alone makes any awaited call concurrent
> - B) No — each `await` still fully waits for that specific coroutine to finish before the next line runs, same total time as the non-async version ✅
> - C) Only if `asyncio.run()` is called more than once
> - D) Only the first two calls run concurrently, never the third

> **Q2.** What does `asyncio.gather()` actually do with the coroutines
> passed to it?
> - A) It runs them one at a time, in the order given
> - B) It runs them concurrently, returning all their results together once every one has finished ✅
> - C) It only runs the first one and ignores the rest
> - D) It requires each coroutine to finish before the next one is even created

> **Q3.** Given three calls with waits of 2s, 1s, and 0.5s run through
> `asyncio.gather()`, what's the expected total time, and why?
> - A) 3.5s — the sum of all three, same as running them sequentially
> - B) Roughly 2s — the single longest individual wait, since all three overlap rather than happening one after another ✅
> - C) 0.5s — the shortest wait always determines the total
> - D) It's unpredictable and varies randomly each run

> **Q4.** In `asyncio.gather(call_search_api(), call_weather_api())`, why
> are the coroutine functions called directly (with `()`), rather than
> `await`-ed individually before being passed in?
> - A) This is a mistake — each one needs its own `await` first
> - B) `gather()` itself is what gets `await`-ed as a whole; it takes the coroutine objects directly and handles running and awaiting each one internally ✅
> - C) Calling them with `()` actually runs them synchronously first
> - D) `gather()` only accepts already-completed results, not coroutines

> **Q5.** If `call_calculator_api()` finishes well before
> `call_search_api()` inside a `gather()` call, in what order does
> `gather()`'s returned list place their results?
> - A) In the order they actually finished — calculator's result first
> - B) In the same order the coroutines were originally passed to `gather()`, regardless of which one finished first ✅
> - C) In a random order each time
> - D) Only the fastest result is included; the rest are dropped

---

## Applied sandbox exercise 1

*(writing and timing a concurrent multi-fetch with `gather()`)*

*Starter code shown to learner:*
```python
import asyncio

async def fetch_user(user_id: int) -> str:
    await asyncio.sleep(1)
    return f"user-{user_id}"

async def fetch_permissions(user_id: int) -> str:
    await asyncio.sleep(1.5)
    return f"permissions-for-{user_id}"

async def fetch_settings(user_id: int) -> str:
    await asyncio.sleep(0.5)
    return f"settings-for-{user_id}"

async def load_profile(user_id: int) -> tuple:
    """
    Call fetch_user, fetch_permissions, and fetch_settings CONCURRENTLY
    (using asyncio.gather, not sequential awaits), all for the same
    user_id, and return their three results as a tuple, in that order:
    (user, permissions, settings).
    """
    # TODO: implement using asyncio.gather
    pass
```

*Task shown to learner:* Implement `load_profile` so all three fetches
run concurrently via `asyncio.gather()`, returning their results as a
tuple in the order `(user, permissions, settings)`.

*Hidden test cases:*
```python
import time

async def run_test():
    start = time.perf_counter()
    result = await load_profile(42)
    elapsed = time.perf_counter() - start
    return result, elapsed

result, elapsed = asyncio.run(run_test())

assert result == ("user-42", "permissions-for-42", "settings-for-42")
assert elapsed < 2.0   # concurrent: ~1.5s, the longest single wait — NOT 1 + 1.5 + 0.5 = 3.0s
```

*Hint (shown on request):* `return await asyncio.gather(fetch_user(user_id), fetch_permissions(user_id), fetch_settings(user_id))`
— pass all three coroutine calls to `gather()` in one call, in the exact
order the return tuple needs to match, and `await` that single `gather()`
call rather than `await`-ing each fetch individually.

*Correct answer + explanation (shown on failure, if requested):*
```python
async def load_profile(user_id: int) -> tuple:
    return await asyncio.gather(
        fetch_user(user_id),
        fetch_permissions(user_id),
        fetch_settings(user_id),
    )
```
The test's timing assertion is the real check here: a sequential version
awaiting each fetch individually would take roughly `1 + 1.5 + 0.5 = 3.0`
seconds, while the `gather()`-based version takes roughly `1.5` seconds —
the single longest wait — because all three fetches are genuinely
overlapping rather than running one after another.

---

*(End of Concept 3. This lesson continues with Concept 4 —
`asyncio.sleep()` vs. `time.sleep()`, and `create_task()` — drafted
separately.)*
