# Write and Execute Tests for REST Endpoints

> **You'll be able to**
> - Explain the difference between a unit test and an integration test,
>   and write both with pytest and `TestClient`
> - Use fixtures to share setup and guarantee test isolation, and
>   `@pytest.mark.parametrize` to cover many cases without duplicating
>   test functions
> - Systematically enumerate an endpoint's failure modes before writing
>   tests for it, rather than testing whichever cases come to mind first
> - Mock an external call to keep a test fast, free, and deterministic —
>   and know when a test genuinely needs `pytest-asyncio` versus when
>   `TestClient` already handles async transparently
> - Organize a growing test suite with `conftest.py`, and generate
>   machine-readable test reports and coverage data

**Why it matters**
Every exercise since Lesson 1 has used a bare `assert` as its grading
mechanism — this lesson makes that real: the actual framework, the
actual discipline of enumerating failure modes deliberately, and the
actual tools (mocking, fixtures, coverage) that make a test suite
trustworthy rather than just present. An agent backend that isn't
tested isn't safely changeable — and given where this course is headed
in Lesson 12, a test suite is also what lets an AI coding assistant
verify its own changes actually work, not just that they look right.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all nine concepts, mixed order)*

> **Q1.** What's the relationship between a plain `assert` statement and
> a pytest test?
> - A) They're unrelated — pytest requires different syntax entirely
> - B) A pytest test function is built from the same `assert` statements already used throughout this course — pytest adds discovery, running, and reporting around them ✅
> - C) pytest replaces `assert` with its own comparison functions
> - D) `assert` only works inside `try`/`except`

> **Q2.** Why is a test using `TestClient` against a full route
> considered an integration test rather than a unit test?
> - A) It isn't — it's still a unit test
> - B) It exercises multiple pieces working together (routing, parameter conversion, the route function), rather than one isolated unit of code ✅
> - C) Integration tests are defined purely by how long they take
> - D) `TestClient` can only be used for integration tests

> **Q3.** How is a pytest fixture similar to FastAPI's `Depends()`?
> - A) They're unrelated
> - B) Both let you declare what you need as a parameter, with something else calling a function and handing you the result automatically ✅
> - C) `Depends()` only works inside test files
> - D) Fixtures can only be used for authentication

> **Q4.** Why does resetting shared state inside a fixture matter for
> test isolation?
> - A) It doesn't — tests always run in a fixed order
> - B) Without it, one test's changes could leak into another, making the outcome depend on execution order ✅
> - C) Only integration tests need isolated state
> - D) Fixtures reset all global state automatically without being told to

> **Q5.** What problem does `@pytest.mark.parametrize` solve?
> - A) It makes tests run faster
> - B) It replaces several near-identical test functions, differing only in input/expected output, with one test function run once per case ✅
> - C) It's required for any test with more than one assertion
> - D) It only works with `TestClient`-based tests

> **Q6.** What's the actual discipline behind systematically testing
> error paths?
> - A) A rule that error tests must outnumber success tests 4 to 1
> - B) Enumerating every distinct way an endpoint can fail *before* writing any tests, then writing one test per failure mode ✅
> - C) A special pytest decorator for marking error tests
> - D) Always testing errors before testing the success case, in file order

> **Q7.** What are the three concrete problems with a test that makes a
> real external API call on every run?
> - A) It's always wrong, always crashes, always times out
> - B) It's slow, costs real money on every run, and isn't deterministic ✅
> - C) There are no real problems with this approach
> - D) It only works with a hardcoded API key

> **Q8.** Why can a test for an `async def` route be written as a plain,
> non-`async` test function?
> - A) FastAPI routes are never actually async
> - B) `TestClient` handles running the event loop internally, returning an already-resolved response with no `await` needed in the test ✅
> - C) This would actually fail to run
> - D) Only `GET` routes can be tested this way

> **Q9.** What's special about a file named exactly `conftest.py`?
> - A) Nothing — it's just a naming convention with no effect
> - B) Fixtures defined in it are automatically available to every test file in the same directory, with no import required ✅
> - C) It must contain every test in the project
> - D) It replaces `pytest.ini`

> **Q10.** Why doesn't 100% coverage guarantee a codebase is well-tested?
> - A) 100% coverage is impossible to actually achieve
> - B) Coverage only measures whether a line executed, not whether the test meaningfully checked its behavior ✅
> - C) Coverage tools are generally unreliable
> - D) 100% coverage means every possible input has been tested

---

## Comprehensive sandbox

*(end of lesson, applied — a full, organized test suite for Lesson 9's
agent registry app, combining fixtures, `conftest.py`, parametrized
tests, systematic failure-mode coverage, and a coverage report)*

*Context provided:* the `main.py`/`agents.py` agent registry app from
[Lesson 9's comprehensive sandbox](→ Module 0, the FastAPI lesson, the comprehensive sandbox explanation) — `POST /agents` and `GET /agents/{agent_id}`, gated by API key auth, with a `DuplicateAgentError` global handler.

*Task shown to learner:* Build a `tests/` directory with:
- `conftest.py`, containing a `client` fixture that resets
  `app.state.registry`/`app.state.next_id` before each test.
- `test_agents.py`, containing:
  - A parametrized `test_create_agent_validation` covering: a valid
    payload (`201`), a payload missing `name` (`422`), a payload
    missing `model` (`422`), and a payload with `name` as an int
    (`422`).
  - `test_create_agent_missing_auth` (`401`, no header).
  - `test_create_agent_invalid_auth` (`401`, wrong key).
  - `test_create_agent_duplicate_name` (`409`, checking the detail
    message contains `"already exists"`).
  - `test_get_agent_not_found` (`404`).
  - `test_get_agent_invalid_id` (`422`, for a negative id).
  - `test_get_agent_success` (`200`, correct body).

*Grading:* the learner's test suite is run directly with `pytest`
against the real `main.py`/`agents.py`, confirming every named test
function exists and passes; `pytest --cov=agents` is then run and
checked for at or near 100% coverage of `agents.py`, given the
above list is deliberately designed to touch every branch in both
route functions.

*Hint (shown on request):* This is almost entirely a direct application
of every concept in this lesson to the one app this course has been
building since Lesson 9 — nothing here needs new syntax beyond what's
already been shown. The duplicate-name test needs two requests inside
one test function, [exactly as demonstrated earlier in this lesson](→ this lesson, testing error paths and status codes systematically concept).

*Correct answer + explanation (shown on failure, if requested):*

**`conftest.py`**
```python
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    app.state.registry = {}
    app.state.next_id = 1
    return TestClient(app)
```

**`test_agents.py`**
```python
import pytest

HEADERS = {"X-Api-Key": "secret-key-123"}

@pytest.mark.parametrize("payload, expected_status", [
    ({"name": "research_agent", "model": "claude-sonnet"}, 201),
    ({"model": "claude-sonnet"}, 422),
    ({"name": "research_agent"}, 422),
    ({"name": 123, "model": "claude-sonnet"}, 422),
])
def test_create_agent_validation(client, payload, expected_status):
    response = client.post("/agents", json=payload, headers=HEADERS)
    assert response.status_code == expected_status

def test_create_agent_missing_auth(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"})
    assert response.status_code == 401

def test_create_agent_invalid_auth(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers={"X-Api-Key": "wrong"})
    assert response.status_code == 401

def test_create_agent_duplicate_name(client):
    payload = {"name": "research_agent", "model": "claude-sonnet"}
    client.post("/agents", json=payload, headers=HEADERS)
    response = client.post("/agents", json=payload, headers=HEADERS)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_get_agent_not_found(client):
    response = client.get("/agents/999", headers=HEADERS)
    assert response.status_code == 404

def test_get_agent_invalid_id(client):
    response = client.get("/agents/-1", headers=HEADERS)
    assert response.status_code == 422

def test_get_agent_success(client):
    client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers=HEADERS)
    response = client.get("/agents/1", headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["name"] == "research_agent"
```
This is every concept from this lesson, applied to real, already-built
code rather than a toy example: `conftest.py` shares the `client`
fixture with guaranteed fresh state across every test; parametrize
collapses four validation cases into one function; every distinct
failure mode identified by [the enumerate-first discipline](→ this lesson, testing error paths and status codes systematically concept) gets its own explicit test; and the resulting suite, run with `--cov`, should show close to full coverage of `agents.py` — not because coverage was the goal, but because systematically testing every real failure mode naturally exercises nearly every line.
