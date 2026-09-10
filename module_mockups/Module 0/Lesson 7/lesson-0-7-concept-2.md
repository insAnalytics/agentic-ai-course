# Module 0, Lesson 7 — Concept 2: `async`/`await` and coroutines

---

## The syntax, compared to what you know

If you've used JavaScript, this will look immediately familiar — Python's
`async`/`await` is deliberately similar in spelling and purpose. Go
(goroutines) and Java (`CompletableFuture`) solve the same underlying
problem — running many I/O-bound operations without blocking each other —
with different syntax and a different underlying model; Python's is
closest to JS's.

```python
import asyncio

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

asyncio.run(call_search_api())
```
```
calling search API...
```
*(runs live, shows output — read-only demo snippet, not graded)*

`async def` marks a function as a **coroutine function** — a function
that can be paused and resumed, rather than running start-to-finish in
one uninterrupted block the way every function has so far. `await`
inside it marks a specific point where it's willing to pause: "wait here
for `asyncio.sleep(2)` to finish, and let something else run in the
meantime, before continuing past this line."

Note the return value wasn't printed above — `asyncio.run(...)` runs the
coroutine but this example didn't do anything with what it returned.
`asyncio.run()` is the entry point: the thing that actually starts
Python's event loop and runs a coroutine to completion. You'll almost
always see exactly one `asyncio.run()` call, at the very top level of a
program — everything else happens through `await`, inside other
coroutines.

---

## The gotcha: calling a coroutine function doesn't run it

This is worth seeing directly, since it's a genuinely common mistake:
calling an `async def` function the normal way — without `await` — does
*not* execute its body. It returns a **coroutine object** instead, a
paused, not-yet-started task description:

```python
import asyncio

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

result = call_search_api()   # looks like a normal call...
print(result)
print(type(result))
```
```
<coroutine object call_search_api at 0x7f8a2c1b3d90>
<class 'coroutine'>
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice `"calling search API..."` never printed — the function body never
actually ran. `call_search_api()` on its own just *creates* a coroutine
object; it doesn't start it. Getting it to actually run requires either
`await`-ing it (from inside another coroutine) or handing it to
`asyncio.run()` (from regular, non-async code) — one of the two has to
actually drive it forward:

```python
import asyncio

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

result = asyncio.run(call_search_api())
print(result)
```
```
calling search API...
3 results found
```
*(runs live, shows output — read-only demo snippet, not graded)*

If you ever see a warning in the wild like `RuntimeWarning: coroutine
'...' was never awaited`, this is exactly what happened — a coroutine
object got created and then simply discarded, its body never actually
executing.

---

## `await`-ing from inside another coroutine

The more common shape than a single top-level `asyncio.run()` call:
one coroutine `await`s another, chaining them together, with only the
outermost one actually passed to `asyncio.run()`:

```python
import asyncio

async def call_search_api():
    print("calling search API...")
    await asyncio.sleep(2)
    return "3 results found"

async def main():
    result = await call_search_api()
    print(f"got: {result}")

asyncio.run(main())
```
```
calling search API...
got: 3 results found
```
*(runs live, shows output — read-only demo snippet, not graded)*

`main()` itself is a coroutine function too — `async def` all the way
through. `await call_search_api()` inside it is what actually runs
`call_search_api`'s body and waits for its result, exactly the same
mechanism as before, just one level deeper. This nested-`await` shape —
one `async def` function calling `await` on another — is how real
`async` code is actually structured; a single, flat `asyncio.run()` call
on one coroutine, like the earlier examples, is really just the smallest
possible version of that same pattern.

Nothing here is concurrent yet, though — `await call_search_api()` still
waits for it to fully finish before `main()` moves on to its next line,
same as a regular function call would. Making multiple `await`-able
operations actually overlap is exactly what the next section,
`asyncio.gather()`, is for.

---

## Quiz cards

> **Q1.** What does `async def` mark a function as?
> - A) A function that runs faster than a normal function
> - B) A coroutine function — one that can be paused and resumed, rather than running start-to-finish uninterrupted ✅
> - C) A function that can never raise an exception
> - D) A function that runs on a separate CPU core

> **Q2.** What actually happens when you call an `async def` function
> without `await`, like `result = call_search_api()`?
> - A) The function body runs normally and `result` holds its return value
> - B) It returns a coroutine object without running the function's body at all — nothing inside it executes yet ✅
> - C) It raises a `SyntaxError`
> - D) It runs the function body in a separate thread automatically

> **Q3.** What is `asyncio.run()` for?
> - A) It's optional — coroutines run automatically without it
> - B) It's the entry point that actually starts the event loop and drives a coroutine to completion — typically called exactly once, at the top level of a program ✅
> - C) It only works inside another coroutine
> - D) It converts a coroutine function into a regular function

> **Q4.** A `RuntimeWarning: coroutine '...' was never awaited` message
> most directly indicates what?
> - A) A network timeout occurred
> - B) An `async def` function was called without `await` or `asyncio.run()`, so a coroutine object was created and then discarded without ever running ✅
> - C) The event loop crashed
> - D) `asyncio` isn't installed correctly

> **Q5.** In `async def main(): result = await call_search_api()`, does
> `main()` continue past that line before `call_search_api()` finishes?
> - A) Yes — `await` starts it and moves on immediately
> - B) No — `await` still waits for `call_search_api()` to fully finish before continuing, the same as a regular function call, just written differently ✅
> - C) It depends on whether `asyncio.run()` was used
> - D) `main()` runs `call_search_api()` twice

---

*(End of Concept 2. This lesson continues with Concept 3 — real
concurrency with `asyncio.gather()` — drafted separately.)*
