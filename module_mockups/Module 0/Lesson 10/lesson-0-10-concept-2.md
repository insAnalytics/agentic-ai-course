# Module 0, Lesson 10 — Concept 2: Testing endpoints with `TestClient`

---

## `TestClient` — calling routes without a real server

Every exercise in the previous lesson assumed something never actually
explained: how do you test a FastAPI route without starting `uvicorn`
and making real network requests to it? `TestClient` is the answer — it
calls your app's routes directly, in-process, with no real server or
network socket involved at all:

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/agents/{agent_id}")
def get_agent(agent_id: int):
    return {"agent_id": agent_id, "name": "research_agent"}
```

```python
# test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_agent_returns_expected_data():
    response = client.get("/agents/42")
    assert response.status_code == 200
    assert response.json() == {"agent_id": 42, "name": "research_agent"}
```

`client.get("/agents/42")` runs the *entire* request-handling path —
routing, path-parameter parsing, the route function itself — and returns
a real response object, with `.status_code` and `.json()` available
exactly as if a real HTTP request had actually happened, without a
server ever needing to be running on a port.

---

## This is an *integration* test, not a unit test

[Concept 1's `is_valid_tool_name` tests](→ this lesson, pytest basics and unit tests concept, the what makes this a unit test explanation) exercised one isolated function. `test_get_agent_returns_expected_data` is doing something different in kind, not just in size: it exercises FastAPI's routing, path-parameter type conversion, and `get_agent`'s own logic, all working *together* — this is an **integration test**, checking that multiple pieces integrate correctly, rather than checking one piece in isolation.

Neither kind is "better" — they answer different questions. A unit test
answers "does this one function behave correctly, on its own?" An
integration test answers "does the whole path — routing, validation, the
function, serialization — actually work together, the way a real caller
would experience it?" A healthy test suite generally has many unit tests
(fast, precise, easy to pinpoint a failure) and a smaller number of
integration tests (slower, but catching problems that only show up when
pieces interact — a route accidentally left off a router, a dependency
wired up incorrectly).

---

## Testing error responses the same way

`TestClient` handles error paths identically — [Lesson 9's `HTTPException`/validation-driven `422`s](→ Module 0, the FastAPI lesson, response models and exception handling concept, the HTTPException explanation) show up exactly as real HTTP responses:

```python
def test_get_agent_not_found_returns_404():
    response = client.get("/agents/999")
    assert response.status_code == 404
```

```python
def test_get_agent_invalid_id_returns_422():
    response = client.get("/agents/not-a-number")
    assert response.status_code == 422
```

Nothing new here beyond what's already been covered — `response.status_code`
and `response.json()` work uniformly whether the underlying route
succeeded or failed, which is exactly why systematically testing error
paths (covered properly [later in this lesson](→ this lesson, testing error paths and status codes concept)) doesn't require a different tool, just deliberately writing tests for the failure cases too, not only the success case.

---

## Quiz cards

> **Q1.** What does `TestClient` let you do that calling a route function
> directly, in plain Python, wouldn't?
> - A) Nothing different — they're equivalent
> - B) Exercise the entire request-handling path (routing, parameter parsing, dependencies) as a real request would, without needing an actual running server ✅
> - C) `TestClient` requires a real network connection to work
> - D) It only works for `GET` requests

> **Q2.** Why is a test using `TestClient` against a full route
> considered an integration test rather than a unit test?
> - A) It isn't — it's still a unit test, just calling a route instead of a plain function
> - B) It exercises multiple pieces working together (routing, parameter conversion, the route function itself), rather than checking one isolated unit of code ✅
> - C) Integration tests are defined by how long they take to run, nothing else
> - D) `TestClient` can only be used for integration tests, never anything else

> **Q3.** What question does a unit test answer that an integration test
> doesn't, and vice versa?
> - A) They answer the exact same question
> - B) A unit test asks "does this one function work correctly on its own?"; an integration test asks "does the whole path work together, the way a real caller would experience it?" ✅
> - C) Unit tests can only check return values; integration tests can only check status codes
> - D) Integration tests are always more valuable, so unit tests are unnecessary

> **Q4.** How does testing an error response (like a `404`) with
> `TestClient` differ mechanically from testing a success response?
> - A) It requires a completely separate tool
> - B) It doesn't differ — `response.status_code` and `response.json()` work identically whether the route succeeded or failed ✅
> - C) Error responses can't be tested with `TestClient` at all
> - D) Error responses require wrapping the test in `try`/`except`

---

*(End of Concept 2. This lesson continues with Concept 3 — fixtures —
drafted separately.)*
