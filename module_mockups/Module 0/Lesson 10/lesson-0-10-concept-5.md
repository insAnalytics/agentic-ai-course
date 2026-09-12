# Module 0, Lesson 10 — Concept 5: Testing error paths and status codes systematically

> **What this concept actually teaches:** no new pytest mechanism —
> everything below uses `TestClient` and fixtures exactly as already
> covered. What's new is a *discipline*: before writing any tests for an
> endpoint, deliberately write down every distinct way it can fail,
> then write one test per failure mode — instead of writing tests
> reactively, for whichever cases happen to come to mind first.

---

## The happy path is the easy half

Every example so far has tested a success case, plus one or two error
cases almost incidentally. Real test suites deliberately flip that
emphasis: the success path is usually the *smaller* set of tests, and
systematically covering every distinct way an endpoint can fail is where
most of the actual coverage should go — precisely because [each different failure mode in this course's FastAPI lesson maps to a different, deliberate mechanism](→ Module 0, the FastAPI lesson, response models and exception handling concept) that deserves its own verification, not just a passing assumption that it works.

---

## A systematic checklist, applied to one endpoint

The discipline itself is simple to state: before writing a single test,
list out every distinct way the endpoint can fail — don't start typing
`def test_...` until that list exists. For `POST /agents`, that list
looks like:

- **Missing auth** — no `X-Api-Key` header → `401`.
- **Invalid auth** — wrong `X-Api-Key` value → `401`.
- **Validation failures** — [`422` from Pydantic](→ Module 0, the FastAPI lesson, request bodies with pydantic concept) — missing required fields, wrong types, one case per field worth checking.
- **Business-logic failure** — a duplicate name → `409`, [via the global exception handler](→ Module 0, the FastAPI lesson, response models and exception handling concept, the global exception handlers explanation).
- **The success case itself** — `201`, with the correct response body.

Only once that list exists does writing the actual tests become close to
mechanical — each bullet becomes one test function, and it's immediately
obvious if something's missing, because the list said so before any code
was written:

```python
def test_create_agent_missing_auth(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"})
    assert response.status_code == 401

def test_create_agent_invalid_auth(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers={"X-Api-Key": "wrong-key"})
    assert response.status_code == 401

def test_create_agent_duplicate_name(client):
    payload = {"name": "research_agent", "model": "claude-sonnet"}
    headers = {"X-Api-Key": "secret-key-123"}
    client.post("/agents", json=payload, headers=headers)   # first one succeeds
    response = client.post("/agents", json=payload, headers=headers)   # second is a duplicate
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_create_agent_success(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == 201
    assert response.json() == {"name": "research_agent", "model": "claude-sonnet"}
```

`test_create_agent_duplicate_name` is worth noticing specifically: it
makes *two* requests inside one test, since triggering the duplicate
condition genuinely requires an agent to already exist — this is a
normal, reasonable thing for a test to do, not a shortcut or a hack.

---

## Checking the error response's *content*, not just its status code

A status code alone can pass while the actual response is still wrong —
testing the detail message too catches mistakes a status-code-only check
would miss:

```python
def test_create_agent_missing_name_error_detail(client):
    response = client.post("/agents", json={"model": "claude-sonnet"}, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"] == ["body", "name"] for error in errors)
```

This confirms the `422` is actually about the missing `name` field
specifically, not some other unrelated validation problem that happens
to also produce a `422` — a status-code-only assertion couldn't tell
those two situations apart.

---

## Quiz cards

> **Q1.** What's the actual discipline this concept is teaching?
> - A) A new pytest decorator for marking error-path tests
> - B) Enumerating every distinct way an endpoint can fail *before* writing any test functions, then writing one test per failure mode, rather than testing whichever cases come to mind first ✅
> - C) A rule that error tests must always outnumber success tests exactly 4 to 1
> - D) A special assertion syntax only valid for testing status codes

> **Q2.** Why does `test_create_agent_duplicate_name` make two requests
> inside one test function?
> - A) This is a mistake — a test should only ever make one request
> - B) Triggering the duplicate-name condition genuinely requires an agent to already exist, so the first request sets up that precondition before the second one is actually tested ✅
> - C) `TestClient` requires every test to make at least two requests
> - D) The first request is only for logging purposes

> **Q3.** Why check an error response's actual detail message, not just
> its status code?
> - A) Status codes alone are never reliable
> - B) A status code alone can pass even if the response is wrong in some other way — checking content confirms the failure is actually about the specific thing being tested, not some other unrelated problem that happens to share the same status code ✅
> - C) `TestClient` doesn't let you check status codes independently
> - D) Detail messages are required for a `422` response to be valid

---

*(End of Concept 5. This lesson continues with Concept 6 — mocking
external calls — drafted separately.)*
