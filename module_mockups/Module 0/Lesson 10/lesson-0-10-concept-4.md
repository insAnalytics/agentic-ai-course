# Module 0, Lesson 10 — Concept 4: Parametrized tests

---

## The problem: near-identical tests, differing only in data

Testing several input/output cases for the same behavior tends to
produce nearly-duplicated test functions:

```python
def test_valid_name_search():
    assert is_valid_tool_name("search") == True

def test_valid_name_calculator():
    assert is_valid_tool_name("calculator") == True

def test_invalid_name_empty():
    assert is_valid_tool_name("") == False

def test_invalid_name_number():
    assert is_valid_tool_name(42) == False
```

Four functions, each just running the same single line against a
different input — exactly the kind of repetition [this course has pushed back on since comprehensions](→ Module 0, the data structures lesson, comprehensions concept, the problem comprehensions solve explanation), just showing up in test code instead of application code.

---

## `@pytest.mark.parametrize` — one test, many cases

```python
import pytest

@pytest.mark.parametrize("name, expected", [
    ("search", True),
    ("calculator", True),
    ("", False),
    (42, False),
])
def test_is_valid_tool_name(name, expected):
    assert is_valid_tool_name(name) == expected
```

`"name, expected"` names the parameters the test function will receive;
the list of tuples supplies one set of values per test *case* — pytest
runs `test_is_valid_tool_name` once per tuple, reporting each one as its
own separate pass or fail:

```bash
pytest -v
```
```
test_validators.py::test_is_valid_tool_name[search-True] PASSED
test_validators.py::test_is_valid_tool_name[calculator-True] PASSED
test_validators.py::test_is_valid_tool_name[-False] PASSED
test_validators.py::test_is_valid_tool_name[42-False] PASSED
```

One test function, four actual test runs, each individually reported —
adding a fifth case means adding one line to the list, not writing an
entire new function.

---

## Parametrizing a `TestClient`-based test

The same mechanism applies directly to [an integration test using `TestClient`](→ this lesson, testing endpoints with testclient concept):

```python
@pytest.mark.parametrize("payload, expected_status", [
    ({"name": "research_agent", "model": "claude-sonnet"}, 201),
    ({"name": "research_agent"}, 422),               # missing required "model"
    ({"model": "claude-sonnet"}, 422),                # missing required "name"
    ({"name": 123, "model": "claude-sonnet"}, 422),   # wrong type for "name"
])
def test_create_agent_validation(client, payload, expected_status):
    response = client.post("/agents", json=payload, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == expected_status
```

Notice `client` (a fixture) and `payload`/`expected_status`
(parametrized values) both appear as parameters on the same test
function at once — pytest handles injecting both kinds without any
conflict between them.

---

## Quiz cards

> **Q1.** What problem does `@pytest.mark.parametrize` solve?
> - A) It makes tests run faster
> - B) It replaces several near-identical test functions (differing only in input/expected output) with one test function run once per case ✅
> - C) It's required for any test involving more than one assertion
> - D) It only works with `TestClient`-based tests

> **Q2.** In `@pytest.mark.parametrize("name, expected", [...])`, what do
> the tuples in the list represent?
> - A) Separate, unrelated test files to run
> - B) One set of values per test case — pytest runs the decorated test function once for each tuple, injecting its values as the named parameters ✅
> - C) Fixture definitions
> - D) Expected error messages only

> **Q3.** Can a parametrized test also use a regular fixture (like
> `client`) in the same function signature?
> - A) No — a test can use either fixtures or parametrize, never both
> - B) Yes — fixture parameters and parametrized parameters can appear together on the same test function without conflict ✅
> - C) Only if the fixture is also parametrized
> - D) Only for unit tests, never integration tests

---

## Applied sandbox exercise 1

*(parametrized tests against a validated endpoint, combining fixtures
and parametrize)*

*Task shown to learner:* Given the `client` fixture from the previous
concept and the agent registry's `POST /agents` endpoint, write a single
parametrized test function `test_create_agent_cases` covering these
cases:
- A valid payload (`{"name": "research_agent", "model": "claude-sonnet"}`)
  → expect `201`.
- A payload missing `"name"` → expect `422`.
- A payload missing `"model"` → expect `422`.
- A payload with `"name"` as an integer instead of a string → expect
  `422`.
- The same valid payload sent with no `X-Api-Key` header at all → expect
  `401`.

*Grading:* the parametrized test is run and each case's actual status
code is checked against the expected value for that case — five distinct
pass/fail results from one test function.

*Hint (shown on request):* The last case needs its own tuple with a
third parametrized value (whether to include the header), or can be
written as a separate, non-parametrized test if that's clearer — both
are reasonable; the important part is that four of the five cases are
genuinely covered by one parametrized function, not four separate ones.

*Correct answer + explanation (shown on failure, if requested):*
```python
@pytest.mark.parametrize("payload, expected_status", [
    ({"name": "research_agent", "model": "claude-sonnet"}, 201),
    ({"model": "claude-sonnet"}, 422),
    ({"name": "research_agent"}, 422),
    ({"name": 123, "model": "claude-sonnet"}, 422),
])
def test_create_agent_cases(client, payload, expected_status):
    response = client.post("/agents", json=payload, headers={"X-Api-Key": "secret-key-123"})
    assert response.status_code == expected_status

def test_create_agent_without_api_key(client):
    response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"})
    assert response.status_code == 401
```
Four of the five cases collapse into one parametrized function — the
auth case is kept separate since it varies the *headers* rather than the
*payload*, which doesn't fit naturally into the same parameter shape;
recognizing when a case doesn't belong in the same `parametrize` list is
as much a part of using it well as recognizing when it does.

---

*(End of Concept 4. This lesson continues with Concept 5 — testing error
paths and status codes systematically — drafted separately.)*
