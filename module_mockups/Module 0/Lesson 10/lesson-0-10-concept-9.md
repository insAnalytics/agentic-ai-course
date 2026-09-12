# Module 0, Lesson 10 — Concept 9: Test reports and coverage

---

## Beyond reading terminal output

Every test run so far has produced output meant for a human reading a
terminal — dots, `PASSED`/`FAILED`, a summary line. That's fine when
you're the one running `pytest` directly, but it doesn't scale to
situations where *something else* needs to know the results: a CI
system deciding whether to allow a deployment, a dashboard tracking
trends over time, or — increasingly relevant given [Lesson 12's focus on AI-assisted coding](→ Module 0, the coding assistance lesson) — an AI coding assistant that just generated some code and needs to check, programmatically, whether its own tests actually passed.

---

## Machine-readable output: JUnit XML

```bash
pytest --junitxml=report.xml
```

This produces a structured XML file (the format is called "JUnit XML"
for historical reasons — it originated with a Java testing tool, but
it's now the de facto standard nearly every testing framework and CI
system reads and writes, regardless of language):

```xml
<testsuite name="pytest" tests="12" failures="1" errors="0" time="0.42">
  <testcase classname="test_agents" name="test_create_agent_success" time="0.01" />
  <testcase classname="test_agents" name="test_create_agent_duplicate_name" time="0.02">
    <failure message="assert 200 == 409">...</failure>
  </testcase>
</testsuite>
```

Rather than a tool having to parse pass/fail out of terminal text
formatted for human eyes, it reads structured fields directly —
`tests="12"`, `failures="1"`, each `<testcase>` with its own name and
outcome. This is the same underlying idea as
[the OpenAPI schema from the FastAPI lesson](→ Module 0, the FastAPI lesson, automatic docs concept, the documentation you didnt write explanation): a machine-readable version of the same information a human-facing view already shows, generated automatically rather than hand-formatted for one specific consumer.

---

## Coverage: which lines actually ran

`pytest-cov` answers a different question: not "did tests pass," but
"how much of the actual code did running the tests even *execute*":

```bash
pytest --cov=myapp
```
```
---------- coverage: platform linux, python 3.12.1 -----------
Name             Stmts   Miss  Cover   Missing
-----------------------------------------------
myapp/agents.py     28      3    89%   45-47
myapp/main.py       15      0   100%
-----------------------------------------------
TOTAL               43      3    93%
```

`agents.py` is 89% covered — 3 statements (lines 45–47) never ran during
the entire test suite, meaning no test currently exercises whatever
that code does. This is a genuinely useful signal for finding gaps: a
0%-covered function is a function nobody's testing at all, worth
noticing before it breaks silently.

---

## What coverage doesn't tell you

Worth being precise about the limit here, directly connecting back to
[the discipline from earlier in this lesson](→ this lesson, testing error paths and status codes systematically concept): coverage measures whether a line *executed*, not whether it was *tested meaningfully*. A test that calls a function and asserts nothing about its result would still count that function's lines as "covered," despite verifying nothing at all. 100% coverage is a floor worth aiming for — every line at least reached once — not a ceiling proving the code is well-tested; it tells you what's definitely *not* tested (anything below 100%), never confirms that what *is* covered was actually tested well. The enumerate-failure-modes discipline from earlier in this lesson is what actually produces meaningful tests — coverage is just a tool for spotting where that discipline clearly wasn't applied at all.

---

## Quiz cards

> **Q1.** Why might a CI system or another tool need `pytest --junitxml=report.xml`
> instead of just reading pytest's normal terminal output?
> - A) JUnit XML runs tests faster
> - B) It produces structured, machine-readable output — a tool can read specific fields directly, rather than having to parse text formatted for a human reading a terminal ✅
> - C) Terminal output can't show whether a test passed or failed
> - D) JUnit XML is required for `pytest` to run at all

> **Q2.** What does `pytest --cov=myapp`'s report actually measure?
> - A) How fast the test suite ran
> - B) Which lines of the actual application code were executed at least once while running the test suite ✅
> - C) How many assertions each test function contains
> - D) Whether the tests are well-written

> **Q3.** Why doesn't 100% coverage guarantee a codebase is well-tested?
> - A) 100% coverage is impossible to actually achieve
> - B) Coverage only measures whether a line executed, not whether the test meaningfully checked its behavior — a test that runs a function but asserts nothing still counts as covering it ✅
> - C) Coverage tools are generally unreliable and produce incorrect numbers
> - D) 100% coverage means every possible input has been tested

> **Q4.** What's coverage actually useful for, given its limitations?
> - A) Nothing — it should be ignored entirely
> - B) Spotting code that's definitely *not* tested at all (anything below 100%) — a real, useful signal, even though high coverage alone doesn't prove the tests that exist are meaningful ✅
> - C) Automatically writing missing tests
> - D) Replacing the need to write assertions in tests

---

*(End of Concept 9 — final concept section of Lesson 10. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
