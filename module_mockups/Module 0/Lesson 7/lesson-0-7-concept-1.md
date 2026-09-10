# Module 0, Lesson 7 — Concept 1: Why concurrency matters for I/O-bound work

---

## The problem, before any new syntax

Picture three independent tasks an agent might need to do: call a search
API, call a weather API, call a calculator API. Each one mostly just
*waits* — for a network response, not for the CPU to finish computing
something. Simulate that waiting with `time.sleep()`, and run all three
one after another, the only way you know how to so far:

```python
import time

def call_search_api():
    print("calling search API...")
    time.sleep(2)
    return "3 results found"

def call_weather_api():
    print("calling weather API...")
    time.sleep(1)
    return "72F and sunny"

def call_calculator_api():
    print("calling calculator API...")
    time.sleep(0.5)
    return "4"

start = time.perf_counter()

search_result = call_search_api()
weather_result = call_weather_api()
calculator_result = call_calculator_api()

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

> **Callout:** `time.sleep()` runs directly in this course's in-browser
> sandbox, but its blocking behavior isn't fully reliable across every
> environment the way it is on a real machine — the timing shown above is
> what you'd see running this code locally. Starting in the next concept,
> this lesson switches to `asyncio.sleep()` for anything timing-sensitive,
> which is built specifically to behave correctly and consistently in an
> async context (including in-browser) — one more reason it's the right
> tool once `async`/`await` are actually in play, not just `time.sleep()`
> with extra syntax around it.

`time.perf_counter()` returns a precise timestamp — calling it before and
after, and subtracting, is a standard way to measure how long code
actually took to run. The total here is almost exactly
`2 + 1 + 0.5 = 3.5` seconds — each call fully finishes (including its
wait) before the next one even starts.

---

## Why this is wasteful

Look at what's actually happening during `call_search_api()`'s two-second
`time.sleep(2)`: your program is doing *nothing*. It isn't computing
anything — it's just waiting for a timer (standing in for a network
response) to finish, with the CPU sitting completely idle the entire
time. Meanwhile, `call_weather_api()` and `call_calculator_api()` are
just sitting in line, not even started yet, even though neither one
depends on the search result at all.

This is called **I/O-bound** work — time spent waiting on something
external (network, disk, another process) rather than on the CPU actually
computing. The three calls above have no dependency on each other's
results — there's no real reason the weather call couldn't be starting
its own wait *while* the search call is still waiting on its own. Nothing
about regular, sequential Python function calls lets you express that,
though — one call has to fully return before the next line even runs.

---

## What "concurrency" means here

The rest of this lesson is about a specific tool for exactly this
situation: running multiple independent, *waiting* operations at
overlapping times, so the total time approaches the *longest* single
wait, rather than the *sum* of all of them — 2 seconds instead of 3.5,
for the three calls above, if all three could genuinely overlap.

This is a different kind of speedup than writing more efficient code —
each individual call still takes exactly as long as it did before
(you're not making the network faster). What changes is *how much of that
waiting time happens at once*, across multiple operations, instead of one
after another with nothing else happening in between. That's the specific
problem `async`/`await` — covered starting in the next section — is
designed to solve.

---

## Quiz cards

> **Q1.** In the sequential version above, why does the total elapsed
> time come out to roughly `2 + 1 + 0.5` seconds, rather than something
> shorter?
> - A) `time.sleep()` doesn't actually pause execution
> - B) Each function call fully completes, including its full wait, before the next line of code even begins running ✅
> - C) Python automatically runs independent function calls at the same time
> - D) `time.perf_counter()` is inaccurate for short durations

> **Q2.** What does "I/O-bound" describe?
> - A) Code that's limited by how fast the CPU can compute something
> - B) Code that spends most of its time waiting on something external — network, disk, another process — rather than on active computation ✅
> - C) Code that never finishes running
> - D) Code that only reads files, never writes them

> **Q3.** Why is it wasteful that `call_weather_api()` doesn't start until
> `call_search_api()` fully finishes, given that neither depends on the
> other's result?
> - A) It isn't wasteful — this is the only correct way to run them
> - B) The CPU sits idle during each call's wait, and there's no actual reason the independent calls couldn't be waiting at the same time instead of one after another ✅
> - C) `call_weather_api()` would return a different result if run first
> - D) Running them in a different order would change their return values

> **Q4.** What specifically does the concurrency covered in this lesson
> aim to reduce?
> - A) The time any single operation takes on its own
> - B) The *total* time for several independent, waiting operations — bringing it closer to the single longest wait, instead of the sum of all of them ✅
> - C) The amount of memory a program uses
> - D) The number of lines of code required

---

*(End of Concept 1. This lesson continues with Concept 2 — `async`/`await`
and coroutines — drafted separately.)*
