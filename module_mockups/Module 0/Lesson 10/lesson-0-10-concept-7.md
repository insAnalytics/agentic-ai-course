# Module 0, Lesson 10 — Concept 7: Testing async routes

---

## Something you've already been doing without noticing

[Concept 6's `test_generate_success`](→ this lesson, mocking external calls concept, the unittest.mock replacing the real call explanation) tested `POST /generate` — a route declared `async def` — using a completely ordinary, non-`async` test function:

```python
def test_generate_success(mock_call_llm_api, client):   # not async def
    response = client.post("/generate", json={"prompt": "hello"})
    ...
```

This works because `TestClient` handles running the event loop
internally — calling `client.post(...)` runs the entire `async def`
route to completion and hands back a normal, already-resolved response,
without the *test* itself needing to be `async` or use `await` anywhere.
For testing a route through `TestClient`, whether that route is declared
`async def` or plain `def` makes no difference to how you write the
test — this has been true in every example so far, without it being
named explicitly until now.

---

## When a test genuinely does need to be `async`

The exception: testing an `async def` function *directly* — not through
a route, not through `TestClient` — by calling and `await`-ing it the
way [any coroutine gets called](→ Module 0, the async lesson, async/await and coroutines concept). This does require the test function itself to be `async def`, plus a plugin (`pytest-asyncio`) that teaches pytest how to actually run an `async def` test function to completion:

```python
import pytest

async def call_llm_api(prompt: str) -> str:
    await asyncio.sleep(0.1)
    return f"response to: {prompt}"

@pytest.mark.asyncio
async def test_call_llm_api_directly():
    result = await call_llm_api("hello")
    assert result == "response to: hello"
```

`@pytest.mark.asyncio` tells pytest this specific test function needs
`pytest-asyncio`'s support to run — without it, pytest doesn't know how
to execute an `async def` test function at all, since a plain,
un-awaited coroutine object [is exactly the gotcha from the async lesson](→ Module 0, the async lesson, async/await and coroutines concept, the gotcha calling a coroutine function doesn't run it explanation) — the test function itself would just return an unexecuted coroutine, never actually running its body or its assertions.

---

## The practical rule

Testing *through* `TestClient` (any route, `async def` or not): write a
normal, non-`async` test function — `TestClient` handles the event loop
for you, invisibly. Testing an `async def` function or coroutine
*directly*, without going through `TestClient` at all: write an
`async def` test function, marked with `@pytest.mark.asyncio`, and
`await` it yourself. Most of this lesson's tests fall into the first
category, precisely because most of what's worth testing about a route
is reachable through `TestClient` — the second category mainly comes up
when testing a standalone async helper function in isolation, [as a genuine unit test](→ this lesson, pytest basics and unit tests concept), separate from any route that happens to call it.

---

## Quiz cards

> **Q1.** Why can a test for an `async def` route be written as a plain,
> non-`async` test function?
> - A) FastAPI routes are never actually async, regardless of the `async def` keyword
> - B) `TestClient` handles running the event loop internally — calling `client.post(...)` runs the route to completion and returns an already-resolved response, with no `await` needed in the test itself ✅
> - C) This is actually incorrect and would fail to run
> - D) Only `GET` routes can be tested this way

> **Q2.** When does a test function genuinely need to be declared
> `async def` itself?
> - A) Whenever testing any route at all, async or not
> - B) When directly calling and `await`-ing an `async def` function or coroutine, rather than going through `TestClient` ✅
> - C) Never — `TestClient` always removes the need for `async def` tests
> - D) Only when using `@pytest.mark.parametrize`

> **Q3.** What does `@pytest.mark.asyncio` actually do?
> - A) It makes a route run faster
> - B) It tells pytest this test function needs `pytest-asyncio`'s support to actually execute an `async def` test function to completion ✅
> - C) It's required on every test function in a file that contains any async code anywhere
> - D) It converts a synchronous test into an asynchronous one automatically

> **Q4.** What would happen if `test_call_llm_api_directly` were written
> as `async def` but *without* `@pytest.mark.asyncio` (and without
> `pytest-asyncio` configured to apply automatically)?
> - A) It would run exactly the same as with the marker
> - B) pytest wouldn't know how to execute the async test function's body — closely related to the "called without await" gotcha from the async lesson ✅
> - C) It would raise a `SyntaxError` at collection time
> - D) It would automatically fall back to running synchronously

---

*(End of Concept 7. This lesson continues with Concept 8 — organizing a
growing test suite — drafted separately.)*
