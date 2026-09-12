# Module 0, Lesson 10 — Concept 1: Why testing matters, pytest basics, and unit tests

---

## The `assert` statements you've already been using

Every hidden test case in this entire course, all the way back to
Lesson 1, has been a plain `assert` statement checking a function's
behavior against known inputs and expected outputs. That's not a
simplification for teaching purposes — it's genuinely what a test *is*
at its core. What's been missing is a framework around those
assertions: a way to discover, run, and report on many of them at once,
consistently, instead of manually running a script and eyeballing
whether it crashed.

**pytest** is that framework — the standard tool for writing and running
tests in Python.

---

## Test discovery and a first test

pytest finds tests by convention, not configuration: a file named
`test_*.py` (or `*_test.py`), containing functions named `test_*`, is
automatically discovered and run — no registration step, no import list
to maintain.

```python
# validators.py
def is_valid_tool_name(name) -> bool:
    return isinstance(name, str) and len(name) > 0
```

```python
# test_validators.py
from validators import is_valid_tool_name

def test_valid_name_returns_true():
    assert is_valid_tool_name("search") == True

def test_empty_string_returns_false():
    assert is_valid_tool_name("") == False

def test_non_string_returns_false():
    assert is_valid_tool_name(42) == False
```

Running `pytest` from the command line finds and runs every `test_*`
function in every `test_*.py` file it can locate:

```bash
pytest
```
```
============================= test session starts ==============================
collected 3 items

test_validators.py ...                                                     [100%]

============================== 3 passed in 0.01s ==============================
```

Each `.` represents one passing test. This is exactly the same
`is_valid_tool_name` function [from the OOP lesson's decorators concept](→ Module 0, the OOP lesson, decorators concept, the applied sandbox exercise 3 explanation) — pytest isn't asking you to write tests differently than the `assert`-based checks you've already been reading all course; it's giving you a real tool to *run* them.

---

## What a failing test actually shows you

```python
def test_broken_example():
    assert is_valid_tool_name("search") == False   # deliberately wrong
```
```
============================= test session starts ==============================
collected 4 items

test_validators.py ...F                                                    [100%]

=================================== FAILURES ===================================
______________________________ test_broken_example ______________________________

    def test_broken_example():
>       assert is_valid_tool_name("search") == False
E       assert True == False
E        +  where True = is_valid_tool_name('search')

test_validators.py:11: AssertionError
========================= 1 failed, 3 passed in 0.02s =========================
```

pytest shows exactly which assertion failed, what the actual value was
versus what was expected, and the specific line — considerably more
information than a bare `AssertionError` with no context would give you
on its own.

---

## What makes this specifically a *unit* test

`test_valid_name_returns_true` and its neighbors are **unit tests** —
each one tests a single, small unit of code (here, one function) in
complete isolation: no file I/O, no network call, no database, nothing
external to the function itself. This matters because it's what makes
unit tests fast (thousands can run in seconds) and deterministic (the
same input always produces the same result, with nothing external able
to make a run flaky). Not every test in this lesson will look like
this — [testing a full FastAPI endpoint, covered next](→ this lesson, testing endpoints with testclient concept), involves considerably more moving parts working together, which is a meaningfully different kind of test, not just a bigger unit test.

---

## Quiz cards

> **Q1.** What convention does pytest use to discover which functions
> are tests?
> - A) Every function in every file is treated as a test
> - B) Functions named `test_*`, inside files named `test_*.py` (or `*_test.py`), are automatically discovered — no manual registration needed ✅
> - C) Tests must be listed explicitly in a config file
> - D) Only functions decorated with `@test` are run

> **Q2.** What's the relationship between a plain `assert` statement and
> a pytest test?
> - A) They're unrelated — pytest requires a completely different syntax
> - B) A pytest test function is built from the same `assert` statements already used throughout this course — pytest adds discovery, running, and reporting around them ✅
> - C) pytest replaces `assert` with its own custom comparison functions
> - D) `assert` only works inside a `try`/`except` block

> **Q3.** What does pytest's failure output show, beyond a bare
> `AssertionError`?
> - A) Nothing extra — the output is identical either way
> - B) The specific failing assertion, the actual value versus what was compared against, and the exact file and line ✅
> - C) Only whether the test passed or failed, with no further detail
> - D) The entire test file's source code, every time

> **Q4.** What makes a test specifically a *unit* test, rather than some
> other kind of test?
> - A) It must test more than one function at once
> - B) It tests a single, small unit of code in complete isolation — no file I/O, network calls, or other external dependencies ✅
> - C) It must always be the first test written for a project
> - D) It requires a running server to execute

> **Q5.** Why does isolation (no external dependencies) matter for a
> unit test specifically?
> - A) It doesn't matter — isolation is just a stylistic preference
> - B) It's what makes unit tests fast and deterministic — the same input always produces the same result, with nothing external able to make a run flaky ✅
> - C) Isolated tests can't check return values
> - D) Isolation is required for pytest to discover the test at all

---

*(End of Concept 1. This lesson continues with Concept 2 — testing
endpoints with `TestClient` — drafted separately.)*
