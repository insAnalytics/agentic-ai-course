# Module 0, Lesson 10 — Concept 8: Organizing a growing test suite

---

## The problem: fixtures duplicated across files

[The `client` fixture from earlier in this lesson](→ this lesson, fixtures concept, the pytest fixture declare it once explanation) has been living at the top of one test file. As a test suite grows past one file — `test_agents.py`, `test_generate.py`, more to come — redefining the same fixture in every file duplicates it exactly the way this course has flagged repeatedly:

```python
# test_agents.py
@pytest.fixture
def client():
    return TestClient(app)

def test_create_agent(client):
    ...
```

```python
# test_generate.py
@pytest.fixture
def client():   # the exact same fixture, copied
    return TestClient(app)

def test_generate_success(client):
    ...
```

---

## `conftest.py` — fixtures shared automatically, no import needed

A file named exactly `conftest.py` is special to pytest: any fixture
defined there is automatically available to every test file in the same
directory (and subdirectories), with **no import required** — pytest
discovers it by filename alone, the same convention-based discovery
[covered back in Concept 1](→ this lesson, pytest basics and unit tests concept, the test discovery and a first test explanation), just applied to fixtures instead of tests themselves.

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    app.state.registry = {}
    app.state.next_id = 1
    return TestClient(app)
```

```python
# test_agents.py — no import of `client` needed at all
def test_create_agent(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == 201
```

```python
# test_generate.py — same fixture, same file, still no import
def test_generate_success(mock_call_llm_api, client):
    ...
```

Both test files use `client` as if it were already in scope — because,
as far as pytest's fixture resolution is concerned, it is. Moving a
fixture into `conftest.py` is purely an organizational change; nothing
about how a test *uses* the fixture is any different from before.

---

## A typical directory shape

As a suite genuinely grows, the usual structure mirrors the app itself:

```
myapp/
    main.py
    agents.py
tests/
    conftest.py
    test_agents.py
    test_generate.py
```

One `conftest.py` at the top of `tests/` covers every file inside it.
(pytest also supports a `conftest.py` per subdirectory, scoping fixtures
more narrowly to just that subdirectory's tests — worth knowing exists
for a genuinely large suite, though a single top-level `conftest.py` is
enough for anything this course's exercises have built so far.)

---

## Quiz cards

> **Q1.** What's special about a file named exactly `conftest.py`?
> - A) Nothing — it's just a naming convention with no functional effect
> - B) Fixtures defined in it are automatically available to every test file in the same directory (and subdirectories), with no import required ✅
> - C) It must contain every test in the project
> - D) It replaces the need for `pytest.ini` or any other configuration

> **Q2.** After moving the `client` fixture into `conftest.py`, does
> `test_generate.py` need to import it to use it?
> - A) Yes, exactly like importing any other function
> - B) No — pytest resolves fixtures from `conftest.py` automatically, without any import statement ✅
> - C) Only if `test_generate.py` is in a different directory
> - D) Only for fixtures with `session` scope

> **Q3.** Does moving a fixture into `conftest.py` change how a test
> function uses it?
> - A) Yes — tests need a special decorator to use a `conftest.py` fixture
> - B) No — a test still just declares the fixture's name as a parameter, exactly as before; only where the fixture is *defined* changes ✅
> - C) Yes — the fixture must be called manually instead of injected
> - D) Yes — `conftest.py` fixtures can only be used once per test file

---

*(End of Concept 8. This lesson continues with Concept 9 — test reports
and coverage — drafted separately.)*
