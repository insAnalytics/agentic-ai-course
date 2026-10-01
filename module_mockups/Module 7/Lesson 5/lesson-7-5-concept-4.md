# Module 7, Lesson 5 — Concept 4: Testing the graders themselves

> **Note for the site build:**
> - The pytest demos are illustrative: pytest runs outside the browser sandbox here. They were run against `pytest` 9.1.1, with `matcher.py` holding the reference solution from this lesson's matcher exercise; the second run used the whole-word matcher instead. Show them as code and recorded output, as Module 0's pytest pages do.
> - The live demo needs the matcher exercise's reference `normalize` and `contains` loaded without showing them.

---

## A grader is code, and it has bugs

Every grader in this module so far has been wrong at least once:

- the matcher found "not" inside "notes_agent", then, once fixed, rejected "840ms"
- one check failed any email by default, a rule nobody wrote down
- one check failed a date written out in words
- a step limit failed runs for being slow rather than wrong
- the citation check missed lists of ids inside one pair of brackets

None of these was found by thinking about the grader. Each was found by a run the grader got wrong and a reader got right. [Lesson 1](→ Module 7, the why agents are hard to grade lesson, the loop: record, read, name the failures, write evals, change, rerun concept, where evaluation starts) quoted Anthropic's teams on this: they don't take an eval score at face value until someone has read transcripts behind it. The Agentic Benchmark Checklist makes the same point about published benchmarks: alongside whether each task is valid, it asks whether the evaluation actually identifies success, which is a property of the grader that has to be checked, not assumed.

Reading finds a grader's bugs. Tests keep them fixed.

---

## What a grader's tests check

A grader is a function from a run to a verdict, so it's tested like any function: with inputs whose right answers you know. For this module's graders, those inputs come in three kinds:

- **Runs that must pass.** Every task's reference run, which proves a correct run exists and the grader accepts it. Where a check has no reference, a hand-written right run: m02's "one email to research-team" and a03's "840ms" are both tests now.
- **Runs that must fail.** Plausible wrong runs: moving the wrong agent, emailing another team, trusting a write without reading it back, citing a section no tool returned.
- **Every misgrade, once found.** The run the grader got wrong becomes a test case, so the same bug can't come back unnoticed. That's what [Module 0's lesson on testing](→ Module 0, the testing fastapi applications lesson, the parametrized tests concept) called a regression test, applied to the grader.

The module's self-tests do all three: the main pool's 29 reference runs, 13 wrong runs and 3 right runs, and the suite's 29 reference runs and 6 wrong runs, each put through the real loop and world, so a change to any grader or task that breaks a known verdict fails before any model runs.

For a piece of grader code on its own, such as the matcher, the same idea is an ordinary pytest file. Each case is a real answer a version of the matcher once graded wrong:

```python
import pytest

from matcher import contains

# every case here is a real answer a version of the matcher once graded wrong
MISGRADES = [
    ("notes_agent is on claude-legacy.", "not", False),        # substring matching: "not" inside notes_agent
    ("Errors above 15% for 15 minutes.", "5%", False),         # substring matching: "5%" inside 15%
    ("The p95 latency is 840ms.", "840", True),                # whole words: a unit after the number
    ("p95 is 1,750ms.", "1,750", True),                        # whole words, with a thousands separator
    ("The p95 latency is 8400ms.", "840", False),              # the number rule mustn't accept more digits
    ("The error rate is 203%.", "2.3%", False),                # an unescaped dot would match any character
]


@pytest.mark.parametrize("text, phrase, expected", MISGRADES)
def test_real_misgrades(text, phrase, expected):
    assert contains(text, phrase) is expected


def test_a_date_written_out_needs_an_alternative():
    # s29: no matcher should treat these as the same text; the task's check lists both forms instead
    assert not contains("It's switched off on October 31, 2026.", "2026-10-31")
```
```
$ pytest -q
.......                                                                  [100%]
7 passed in 0.02s
```
*(illustrative — pytest runs outside the browser sandbox here; run with pytest 9.1.1 against this lesson's matcher)*

Run the same file against the whole-word matcher, the version before the number rule, and it fails exactly where that matcher did:

```
$ pytest -q
..FF...                                                                  [100%]
=========================== short test summary info ============================
FAILED test_matcher.py::test_real_misgrades[The p95 latency is 840ms.-840-True]
FAILED test_matcher.py::test_real_misgrades[p95 is 1,750ms.-1,750-True] - Ass...
2 failed, 5 passed in 0.02s
```
*(illustrative — the same file, with `matcher.py` holding the whole-word matcher instead)*

---

## Testing the tests

A test suite can pass and still be too weak to catch a bug. The standard way to find out is **mutation testing**, an idea from the late 1970s (DeMillo, Lipton and Sayward) with tools for most languages today, such as mutmut for Python and PIT for Java. Make small deliberate changes to the code, called mutants, and run the tests on each. A test suite that's any good fails on every mutant; a mutant it doesn't catch shows a gap in the tests.

The wrong-answer matrices in this course's exercises are mutation testing done by hand. Here it is on the matcher, with each mutant switching off one of its rules, run against the six real misgrades:

```python
import re

# every case here is a real answer a version of the matcher once graded wrong
# (text, phrase, the right verdict, a short name for the case)
MISGRADES = [
    ("notes_agent is on claude-legacy.", "not", False, "not/notes_agent"),
    ("Errors above 15% for 15 minutes.", "5%", False, "5%/15%"),
    ("The p95 latency is 840ms.", "840", True, "840/840ms"),
    ("p95 is 1,750ms.", "1,750", True, "1,750/1,750ms"),
    ("The p95 latency is 8400ms.", "840", False, "840/8400ms"),
    ("The error rate is 203%.", "2.3%", False, "2.3%/203%"),
]


def make_matcher(start_rule=True, number_rule=True, decimal_guard=True, escape=True):
    """The exercise's matcher, with any one of its rules switched off."""
    def matcher(text: str, phrase: str) -> bool:
        text, phrase = normalize(text), normalize(phrase)
        start = r"(?<!\w)" if start_rule and re.match(r"\w", phrase[0]) else ""
        if number_rule and phrase[-1].isdigit():
            end = r"(?![0-9]|[.,][0-9])" if decimal_guard else r"(?![0-9])"
        else:
            end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
        return re.search(start + (re.escape(phrase) if escape else phrase) + end, text) is not None
    return matcher


MUTANTS = {
    "a plain substring test": lambda text, phrase: normalize(phrase) in normalize(text),
    "no rule at the start": make_matcher(start_rule=False),
    "no number rule": make_matcher(number_rule=False),
    "no decimal guard": make_matcher(decimal_guard=False),
    "the phrase not escaped": make_matcher(escape=False),
}


def mutation_report(cases: list) -> None:
    for name, mutant in MUTANTS.items():
        killed_by = [label for text, phrase, expected, label in cases if mutant(text, phrase) is not expected]
        print(f"  {name:<24} {'caught by ' + ', '.join(killed_by) if killed_by else 'NOT CAUGHT'}")


print("against the six real misgrades:")
mutation_report(MISGRADES)
print("with one case added for the mutant that wasn't caught:")
mutation_report(MISGRADES + [("The p95 latency is 840.5 ms.", "840", False, "840/840.5")])
```
```
against the six real misgrades:
  a plain substring test   caught by not/notes_agent, 5%/15%, 840/8400ms
  no rule at the start     caught by 5%/15%
  no number rule           caught by 840/840ms, 1,750/1,750ms
  no decimal guard         NOT CAUGHT
  the phrase not escaped   caught by 2.3%/203%
with one case added for the mutant that wasn't caught:
  a plain substring test   caught by not/notes_agent, 5%/15%, 840/8400ms, 840/840.5
  no rule at the start     caught by 5%/15%
  no number rule           caught by 840/840ms, 1,750/1,750ms, 840/840.5
  no decimal guard         caught by 840/840.5
  the phrase not escaped   caught by 2.3%/203%
```
*(runs live, shows output — read-only demo snippet, not graded; `normalize` is the matcher exercise's reference version, loaded for you)*

The six real misgrades catch every mutant but one. A matcher without the decimal guard would treat "840.5" as "840", and nothing in those six cases would notice, because no answer in the runs happened to give a latency with a decimal part. One extra case closes the gap. Real misgrades are the best tests you have, because they're failures that actually happened, but they only cover what happened. Mutants show what else could go wrong.

---

## Keeping old versions

Fixing a grader changes its verdicts, which raises a question every evaluation has to answer: what happens to the results it already produced? This module's answer is to keep each version runnable:

- **The matcher takes a version.** Version 1, whole words only, still exists, so the pilot's grades and Lesson 3's code grades can be recomputed exactly as they were published.
- **Each task keeps its first checks.** A check changed after reading, such as m02's email, s29's date or s24's step limit, keeps its earlier form beside the new one, with a note on why it changed.
- **Each data file can be rebuilt and compared.** Every script that writes one has a `--check` option that rebuilds it and fails if anything differs, so a grader change that would silently alter a published number is caught.

The rule underneath is the one [Module 6 applied to models and prompts](→ Module 6, the fallbacks and graceful degradation lesson, the pinning model and prompt versions concept): a result is only reproducible if everything that produced it is pinned, and the grader is part of what produced it.

---

## Quiz cards

> **Q1.** How were this module's grader bugs found?
> - By runs a reader passed and the grader failed ✅
> - By reviewing each grader's code before any runs
> - By comparing the graders with a public benchmark
> - By running each grader twice and comparing results
>
> *Explanation: Every bug, from "not" inside "notes_agent" to the citation lists, showed up as a disagreement between a grade and a reading. Thinking about the code in advance didn't find any of them.*

> **Q2.** Why does every misgrade, once found, become a test case?
> - So the same bug can't come back unnoticed ✅
> - So the grader's pass rate goes up over time
> - So the test file stays the same size as the suite
> - So the run can be removed from the suite
>
> *Explanation: A misgrade is a known input with a known right answer, which is exactly what a test needs. Keeping it means a later change that reintroduces the bug fails the tests at once.*

> **Q3.** The six real misgrades caught every mutant of the matcher except one without the decimal guard. What does that show?
> - The tests had a gap: no case had a decimal part ✅
> - The decimal guard isn't needed by the matcher
> - Mutation testing doesn't work on regular expressions
> - The six misgrades were chosen badly by the course
>
> *Explanation: A mutant that survives means the tests can't tell it from the real code. Here no recorded answer happened to give a number with a decimal part, so nothing tested that rule. One added case, "840.5", catches it.*

> **Q4.** In mutation testing, what is a mutant?
> - A small deliberate change to the code under test ✅
> - A test case written from a real failure
> - A run of the agent with an injected fault
> - A second version of the grader kept for comparison
>
> *Explanation: Each mutant changes one thing, such as dropping a rule, and the tests should fail on it. A mutant they don't catch is a change the tests can't see.*

> **Q5.** Why does this module keep version 1 of the matcher after fixing it?
> - So results published with it can be reproduced ✅
> - Because version 1 is better on some answers
> - So the agent can choose which matcher to use
> - Because removing old code breaks the self-tests
>
> *Explanation: The pilot's grades and Lesson 3's code grades were computed with version 1. Keeping it runnable means those numbers can be rebuilt exactly, and the --check options confirm they haven't changed.*
