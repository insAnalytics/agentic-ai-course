# Module 0, Lesson 7 — Concept 5: Error handling in async code

---

## `try`/`except` around `await` works exactly as you'd expect

Nothing new is needed here — [`try`/`except` from the Python setup lesson](→ Module 0, the Python setup lesson, error handling concept) applies to `await`-ed calls exactly the same way it applies to a regular function call:

```python
import asyncio

async def call_calculator_api(expression: str):
    if expression == "invalid":
        raise ValueError(f"can't evaluate: {expression}")
    await asyncio.sleep(0.5)
    return "4"

async def main():
    try:
        result = await call_calculator_api("invalid")
    except ValueError as e:
        print(f"calculator call failed: {e}")
        result = None
    print(result)

asyncio.run(main())
```
```
calculator call failed: can't evaluate: invalid
None
```
*(runs live, shows output — read-only demo snippet, not graded)*

The exception propagates out of `call_calculator_api()`, through the
`await`, and is caught exactly where you'd expect — `await` doesn't
change how exceptions travel, it just marks where the pause happens.

---

## `gather()`'s default behavior: one failure stops the whole thing

`asyncio.gather()` needs its own explanation, though, since it's
combining *multiple* coroutines at once. By default, if any one of them
raises, `gather()` itself raises that same exception — even though the
other coroutines might have succeeded, or might still be running:

```python
import asyncio

async def call_search_api():
    await asyncio.sleep(1)
    return "3 results found"

async def call_calculator_api():
    await asyncio.sleep(0.5)
    raise ValueError("division by zero")

async def main():
    results = await asyncio.gather(call_search_api(), call_calculator_api())
    print(results)   # never reached

asyncio.run(main())
```
```
Traceback (most recent call last):
  File "script.py", line 14, in <module>
    asyncio.run(main())
  File "script.py", line 11, in main
    results = await asyncio.gather(call_search_api(), call_calculator_api())
  File "script.py", line 8, in call_calculator_api
    raise ValueError("division by zero")
ValueError: division by zero
```
*(runs live, shows output — read-only demo snippet, not graded)*

The whole `gather()` call raises, `results` never gets assigned, and
`call_search_api()`'s successful `"3 results found"` is simply
discarded — even though that call genuinely did succeed. This matters
because it's easy to assume `gather()` behaves like a list of independent
attempts, each one reported on its own — by default, it doesn't; one
failure looks, from the caller's side, exactly like the whole batch
failed.

---

## `return_exceptions=True` — collect failures instead of raising

Passing `return_exceptions=True` changes this: instead of raising on the
first failure, `gather()` waits for every coroutine to finish (success or
failure) and returns a list where each position is either that
coroutine's actual result, or the exception it raised:

```python
import asyncio

async def call_search_api():
    await asyncio.sleep(1)
    return "3 results found"

async def call_calculator_api():
    await asyncio.sleep(0.5)
    raise ValueError("division by zero")

async def main():
    results = await asyncio.gather(
        call_search_api(),
        call_calculator_api(),
        return_exceptions=True,
    )
    print(results)

asyncio.run(main())
```
```
['3 results found', ValueError('division by zero')]
```
*(runs live, shows output — read-only demo snippet, not graded)*

Both positions are filled — `call_search_api()`'s real result at index
0, and the actual `ValueError` *object* (not raised — just sitting there
as a value) at index 1, in the same order the coroutines were passed in,
[exactly as `gather()`'s ordering already worked without `return_exceptions`](→ this lesson, real concurrency concept, the ordering explanation). Distinguishing a real result from a failure means checking each item's type:

```python
for result in results:
    if isinstance(result, Exception):
        print(f"failed: {result}")
    else:
        print(f"succeeded: {result}")
```
```
succeeded: 3 results found
failed: division by zero
```
*(runs live, shows output — read-only demo snippet, not graded)*

`isinstance(result, Exception)` works here because every built-in
exception — and every [custom exception you'd define yourself](→ Module 0, the I/O and error handling lesson, custom exceptions concept) — is a subclass of `Exception`, [the same `isinstance`/inheritance relationship covered back in the OOP lesson](→ Module 0, the OOP lesson, inheritance concept, the isinstance explanation), applying here to tell an exception object apart from a normal return value sitting in the same list.

---

## Quiz cards

> **Q1.** Does wrapping `await some_coroutine()` in a `try`/`except` work
> the same way it would for a regular function call?
> - A) No — `await` requires a completely different error-handling mechanism
> - B) Yes — an exception raised inside the awaited coroutine propagates out through the `await` exactly like a regular function call, and is caught the same way ✅
> - C) `try`/`except` can only be used outside of `async def` functions
> - D) Exceptions are silently swallowed by `await`

> **Q2.** By default, if one coroutine passed to `asyncio.gather()` raises
> an exception, what happens to the other coroutines' results?
> - A) They're still returned normally, alongside the exception
> - B) `gather()` itself raises that exception, and any other coroutines' results are discarded, even if they succeeded ✅
> - C) `gather()` retries the failed coroutine automatically
> - D) The failure is silently ignored and replaced with `None`

> **Q3.** What does `return_exceptions=True` change about
> `asyncio.gather()`'s behavior?
> - A) It prevents any coroutine from ever raising an exception
> - B) Instead of raising on the first failure, it waits for every coroutine to finish and returns a list where each position holds either the real result or the exception that was raised ✅
> - C) It causes `gather()` to run coroutines sequentially instead of concurrently
> - D) It converts every result into a string automatically

> **Q4.** With `return_exceptions=True`, how do you tell which items in
> the returned list are real results versus exceptions?
> - A) Real results always come first in the list, exceptions always come last
> - B) Check each item with `isinstance(item, Exception)` — exceptions and real results can otherwise sit in the same list indistinguishably ✅
> - C) Exceptions are automatically converted to `None`
> - D) There's no way to tell the two apart

> **Q5.** Why does `isinstance(result, Exception)` work for checking any
> exception type, including a custom one you defined yourself?
> - A) It doesn't — custom exceptions require a separate check
> - B) Every exception, built-in or custom, is a subclass of `Exception` — the same inheritance relationship `isinstance()` already checks for any other class hierarchy ✅
> - C) `isinstance()` has special-cased behavior just for exceptions
> - D) Custom exceptions can't be checked with `isinstance()` at all

---

## Applied sandbox exercise 2

*(concurrent calls where some fail, handled with `return_exceptions=True`)*

*Starter code shown to learner:*
```python
import asyncio

async def fetch_item(item_id: int) -> str:
    """
    Simulates fetching an item. Raises ValueError if item_id is negative,
    otherwise waits briefly and returns a success string.
    """
    await asyncio.sleep(0.1)
    if item_id < 0:
        raise ValueError(f"invalid item_id: {item_id}")
    return f"item-{item_id}"

async def fetch_all(item_ids: list) -> tuple:
    """
    Concurrently fetch every id in item_ids using fetch_item, via
    asyncio.gather with return_exceptions=True.

    Return a tuple of two lists:
      (successes, failures)
    where successes contains every successfully-fetched result string,
    and failures contains the string form (str(e)) of every exception
    that occurred — each list in the same relative order they appeared
    in item_ids.
    """
    # TODO: implement using asyncio.gather(..., return_exceptions=True)
    pass
```

*Task shown to learner:* Use `asyncio.gather(..., return_exceptions=True)`
to fetch every id concurrently, then split the results into two lists —
successful result strings, and `str(e)` for each exception — preserving
each item's relative order within its own list.

*Hidden test cases:*
```python
async def run_test():
    return await fetch_all([1, -1, 2, -2, 3])

successes, failures = asyncio.run(run_test())

assert successes == ["item-1", "item-2", "item-3"]
assert failures == ["invalid item_id: -1", "invalid item_id: -2"]
```

*Hint (shown on request):* `results = await asyncio.gather(*[fetch_item(i) for i in item_ids], return_exceptions=True)`
uses [list-comprehension](→ Module 0, the data structures lesson, comprehensions concept) plus `*` to unpack a list of coroutines as separate arguments to `gather()`, one per `item_id`. Then loop through `results`, checking `isinstance(result, Exception)` to sort each one into `successes` or `failures` (using `str(result)` for the failure case).

*Correct answer + explanation (shown on failure, if requested):*
```python
async def fetch_all(item_ids: list) -> tuple:
    results = await asyncio.gather(
        *[fetch_item(item_id) for item_id in item_ids],
        return_exceptions=True,
    )

    successes = []
    failures = []
    for result in results:
        if isinstance(result, Exception):
            failures.append(str(result))
        else:
            successes.append(result)

    return successes, failures
```
This is the realistic shape of concurrent, partially-failing work: every
`fetch_item` call runs concurrently regardless of whether it will
succeed or fail, `return_exceptions=True` means one bad `item_id` doesn't
prevent the others from completing or being reported, and
`isinstance(result, Exception)` is what separates the two outcomes back
out afterward — the same check that works for any exception type,
built-in or custom.

---

*(End of Concept 5. This lesson continues with Concept 6 — when async
isn't the right tool — drafted separately.)*
