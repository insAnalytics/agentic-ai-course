# Module 0, Lesson 10 — Concept 6: Mocking external calls

---

## Why a real LLM API call has no place in a test

An agent backend's route often calls something genuinely external — an
LLM API, another service. Testing that route by letting it make a real
call has three real problems: it's **slow** (a network round-trip on
every single test run, for every test that touches this route), it
**costs real money** (an actual LLM API call, every time the test suite
runs — including in CI, potentially dozens of times a day), and it's
**not deterministic** (a real LLM's response can vary, and the network
itself can simply fail, unrelated to whether your code is actually
correct).

---

## `unittest.mock` — replacing the real call with a controlled fake

`unittest.mock.patch` temporarily replaces a function (or object) with a
fake one, for the duration of a test, then automatically restores the
real one afterward:

```python
# main.py
async def call_llm_api(prompt: str) -> str:
    # a real network call, in production
    ...

@app.post("/generate")
async def generate(prompt: str):
    result = await call_llm_api(prompt)
    return {"result": result}
```

```python
# test_main.py
from unittest.mock import patch, AsyncMock

@patch("main.call_llm_api", new_callable=AsyncMock)
def test_generate_returns_llm_result(mock_call_llm_api, client):
    mock_call_llm_api.return_value = "mocked response"

    response = client.post("/generate", json={"prompt": "hello"})

    assert response.status_code == 200
    assert response.json() == {"result": "mocked response"}
    mock_call_llm_api.assert_called_once_with("hello")
```

`@patch("main.call_llm_api", new_callable=AsyncMock)` replaces
`call_llm_api`, specifically as it's referenced *inside `main.py`*, with
a mock for the duration of this test — `AsyncMock` specifically, since
[the real function is `async def`, and the mock needs to be `await`-able the same way](→ Module 0, the async lesson, async/await and coroutines concept). Setting `mock_call_llm_api.return_value` controls exactly what the mock produces when awaited, with no real network call happening at all. `mock_call_llm_api.assert_called_once_with("hello")` additionally confirms the route actually called it correctly — with the right argument, exactly once — which is a check a real network call couldn't give you nearly as precisely.

---

## Mocking a failure, not just a success

Mocking is just as useful for testing how a route handles the *external*
call going wrong — something genuinely hard to trigger reliably against
a real API on demand, but trivial against a mock:

```python
@patch("main.call_llm_api", new_callable=AsyncMock)
def test_generate_handles_llm_failure(mock_call_llm_api, client):
    mock_call_llm_api.side_effect = ConnectionError("LLM API unreachable")

    response = client.post("/generate", json={"prompt": "hello"})

    assert response.status_code == 503
```

`side_effect` (rather than `return_value`) makes the mock *raise* that
exception when called, standing in for a real network failure — assuming
`generate` itself catches `ConnectionError` and translates it into a
proper `503 Service Unavailable` response, exactly the kind of
error-path behavior [Concept 5's discipline](→ this lesson, testing error paths and status codes systematically concept) says deserves its own explicit test.

---

## This is what keeps a test a *unit* test

Recall [the unit-vs-integration distinction from earlier in this lesson](→ this lesson, testing endpoints with testclient concept, the this is an integration test explanation): mocking is the specific tool that keeps a test from silently becoming something else. Without mocking `call_llm_api`, `test_generate_returns_llm_result` would actually be an integration test against a real external service — slow, costly, and non-deterministic, exactly the three problems named at the top of this section. Mocking cuts out the one genuinely external dependency, leaving a test that still exercises the *route's own logic* (does it call the LLM function correctly, does it shape the response correctly, does it handle a failure correctly) without depending on anything outside your own code actually running.

---

## Quiz cards

> **Q1.** What are the three concrete problems with a test that makes a
> real LLM API call on every run?
> - A) It's always wrong, always crashes, and always times out
> - B) It's slow, costs real money on every run, and isn't deterministic — a real response can vary or the network can simply fail ✅
> - C) There are no real problems — this is the correct way to test it
> - D) It only works if the API key is hardcoded into the test

> **Q2.** What does `@patch("main.call_llm_api", ...)` actually do during
> the decorated test?
> - A) It permanently changes `call_llm_api`'s behavior everywhere
> - B) It temporarily replaces `call_llm_api`, as referenced inside `main.py`, with a mock for the duration of the test, then restores the real function afterward ✅
> - C) It deletes `call_llm_api` from the codebase
> - D) It only works on synchronous functions, never `async def` ones

> **Q3.** What's the difference between setting a mock's `return_value`
> versus its `side_effect`?
> - A) They're interchangeable
> - B) `return_value` makes the mock return that value when called; `side_effect` set to an exception makes the mock raise it instead, standing in for a failure ✅
> - C) `side_effect` only works with synchronous mocks
> - D) `return_value` can only be used once per test

> **Q4.** What does `mock_call_llm_api.assert_called_once_with("hello")`
> check, that just asserting the response's status code wouldn't?
> - A) Nothing extra — it's redundant with checking the status code
> - B) That the route actually called the mocked function with the correct argument, exactly once — confirming the route's own logic behaved correctly, not just that some response came back ✅
> - C) That the real `call_llm_api` was called, bypassing the mock
> - D) That the response took less than one second

> **Q5.** Why does mocking `call_llm_api` matter specifically for keeping
> `test_generate_returns_llm_result` a *unit* test?
> - A) It doesn't relate to that distinction at all
> - B) Without mocking, the test would depend on a real external service actually running correctly — making it an integration test in practice, with all the slowness and non-determinism that implies ✅
> - C) Unit tests are defined by using `TestClient`, regardless of mocking
> - D) Mocking always converts an integration test into multiple unit tests automatically

---

## Applied sandbox exercise 2

*(mocking an external call, testing both its success and its failure
path)*

*Task shown to learner:* Given a route:
```python
async def call_llm_api(prompt: str) -> str:
    ...  # real implementation, not shown — assume it makes a real network call

@app.post("/generate")
async def generate(prompt: str):
    try:
        result = await call_llm_api(prompt)
    except ConnectionError:
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    return {"result": result}
```
write two tests: `test_generate_success`, mocking `call_llm_api` to
return `"mocked response"` and asserting a `200` with the correct body;
and `test_generate_llm_failure`, mocking `call_llm_api` to raise a
`ConnectionError` and asserting a `503`.

*Grading:* both tests are run for real against the actual route, with
`call_llm_api` mocked in each — confirming no real network call ever
occurs, and that the route's `try`/`except` genuinely produces the
correct status code in both cases.

*Hint (shown on request):* Both tests need `@patch("main.call_llm_api", new_callable=AsyncMock)`,
since `call_llm_api` is declared `async def`. Set `.return_value` for
the success case, `.side_effect = ConnectionError(...)` for the failure
case.

*Correct answer + explanation (shown on failure, if requested):*
```python
from unittest.mock import patch, AsyncMock

@patch("main.call_llm_api", new_callable=AsyncMock)
def test_generate_success(mock_call_llm_api, client):
    mock_call_llm_api.return_value = "mocked response"
    response = client.post("/generate", json={"prompt": "hello"})
    assert response.status_code == 200
    assert response.json() == {"result": "mocked response"}

@patch("main.call_llm_api", new_callable=AsyncMock)
def test_generate_llm_failure(mock_call_llm_api, client):
    mock_call_llm_api.side_effect = ConnectionError("unreachable")
    response = client.post("/generate", json={"prompt": "hello"})
    assert response.status_code == 503
```
Both tests exercise `generate`'s actual logic — the `try`/`except`
around `call_llm_api` — without either one ever making a real network
call, proving the route handles both outcomes correctly using nothing
but a controlled, fake version of the one genuinely external dependency.

---

*(End of Concept 6. This lesson continues with Concept 7 — testing async
routes — drafted separately.)*
