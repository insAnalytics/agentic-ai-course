# Module 0, Lesson 10 — Concept 3: Fixtures

---

## The problem: repeated setup across tests

Every test in the previous concept needed the same `TestClient(app)`
instance. Writing that setup line, or anything more involved, into every
single test function duplicates it exactly the way [pagination logic duplicated across routes motivated `Depends()` back in the FastAPI lesson](→ Module 0, the FastAPI lesson, dependency injection concept, the problem repeated logic across routes explanation):

```python
def test_get_agent():
    client = TestClient(app)   # repeated in every test
    response = client.get("/agents/42")
    assert response.status_code == 200

def test_get_agent_not_found():
    client = TestClient(app)   # repeated again
    response = client.get("/agents/999")
    assert response.status_code == 404
```

---

## `@pytest.fixture` — declare it once, receive it as a parameter

A **fixture** is a function decorated with `@pytest.fixture` that
provides something a test needs — pytest calls it for you and passes
its return value into any test function that names it as a parameter:

```python
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_get_agent(client):
    response = client.get("/agents/42")
    assert response.status_code == 200

def test_get_agent_not_found(client):
    response = client.get("/agents/999")
    assert response.status_code == 404
```

Both test functions declare `client` as a parameter; pytest recognizes
the name matches a fixture, calls `client()` for each test, and injects
its return value automatically. This is [genuinely the same shape as `Depends()`](→ Module 0, the FastAPI lesson, dependency injection concept, the depends explanation): declare what you need as a parameter, and something else calls a function and hands you the result — `Depends()` does this for a route needing a shared resource; a fixture does it for a test needing shared setup.

---

## Fixtures for resetting state between tests

A fixture's real value goes beyond just avoiding repeated setup lines —
it's also the standard place to guarantee **test isolation**: each test
starting from a clean, known state, unaffected by whatever a previous
test did.

```python
@pytest.fixture
def client():
    app.state.registry = {}     # reset before every test uses this fixture
    app.state.next_id = 1
    return TestClient(app)

def test_create_agent(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == 201

def test_registry_starts_empty(client):
    response = client.get("/agents/1", headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == 404   # this test's registry is fresh, unaffected by the previous test
```

Without resetting `app.state.registry` inside the fixture, an agent
created in `test_create_agent` could still be sitting there when
`test_registry_starts_empty` runs — the second test's outcome would
depend on which order the tests happened to run in, exactly the kind of
flakiness [Concept 1 named as the actual point of test isolation](→ this lesson, pytest basics and unit tests concept, the what makes this a unit test explanation), now applying to a whole test's setup, not just a single function's inputs.

By default, a fixture runs fresh for *every* test that uses it —
this is called **function scope**, and it's the default for exactly this
reason: fresh state per test, unless you deliberately ask for something
shared. (A fixture can be given a broader `scope="session"` for
something genuinely expensive to set up once and safely reuse across an
entire test run — outside this lesson's depth, but worth knowing the
option exists.)

---

## Quiz cards

> **Q1.** What does declaring `client` as a parameter in a test function
> do, given a fixture named `client` exists?
> - A) Nothing — fixture names must match the test function's name exactly
> - B) pytest recognizes the parameter name matches a fixture, calls that fixture function, and passes its return value in automatically ✅
> - C) It requires manually calling `client()` inside the test body first
> - D) It only works if the fixture is defined in the same file

> **Q2.** How is a pytest fixture similar to FastAPI's `Depends()`?
> - A) They're unrelated mechanisms that happen to share no similarity
> - B) Both let you declare what you need as a parameter, with something else calling a function and handing you the result automatically ✅
> - C) `Depends()` only works inside test files
> - D) Fixtures can only be used for authentication, exactly like `Depends()`

> **Q3.** Why does resetting shared state (like `app.state.registry`)
> inside a fixture matter for test isolation?
> - A) It doesn't matter — tests always run in a guaranteed fixed order
> - B) Without resetting it, one test's changes could leak into another test, making the outcome depend on execution order — exactly the flakiness isolated unit tests are meant to avoid ✅
> - C) Resetting state is only necessary for integration tests, never unit tests
> - D) Fixtures automatically reset all global state without being told to

> **Q4.** What does "function scope" mean for a pytest fixture, and why
> is it the default?
> - A) The fixture can only be used inside functions, never classes
> - B) The fixture runs fresh for every single test that uses it, which is what guarantees each test starts from clean, isolated state unless something broader is deliberately requested ✅
> - C) Function-scoped fixtures can only return functions, not objects
> - D) It means the fixture runs exactly once for the entire test session

---

*(End of Concept 3. This lesson continues with Concept 4 — parametrized
tests — drafted separately.)*
