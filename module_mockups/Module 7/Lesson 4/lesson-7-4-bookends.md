# Building a Task Suite

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only; the lesson's `LOAD_SUITE` and the first concept's reference `triage`) and `suite_health.py` (the entry file). It reads `grades-2a.json` from `/data/eval/suite`, for Run and the hidden tests.

> **You'll be able to**
> - Write tasks with clear success criteria, a reference run that proves they can be done, and both should and shouldn't cases, and triage a suite's results before trusting them
> - Draw tasks from real failures, check a simulated user against its persona, and test a behaviour that can go wrong in two directions from both sides
> - Keep a held-out set that resembles the dev set, tell fixing a measurement from tuning to the suite, and read a public benchmark score for what it can and can't tell you

**Why it matters**
A suite is the instrument every later result is read through: the graders are tested on it, the changes are compared on it, and the final report is measured on it. If its tasks are ambiguous, its checks blind to the failures that matter, or its held-out set easier than the rest, every number after this lesson inherits the flaw. This lesson builds the registry agent's suite from what the error analysis found, and checks the suite itself as carefully as the agent.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** Anthropic's guide gives a test for whether a task is unambiguous. What is it?
> - Experts would agree on any run's verdict ✅
> - The agent passes it on most of its trials
> - Its request is written in a single sentence
> - It has a check for every tool the agent can call
>
> *Explanation: If two domain experts, each reading the task on their own, could disagree about whether a run passed, the result depends on who grades it. Agreement is the test that the task's definition of success is clear.*

> **Q2.** A task's reference run fails its own checks. What should happen next?
> - Fix the task: no correct run can pass ✅
> - Mark the agent as unable to do this task
> - Add more trials until one of them passes
> - Move the task into the regression suite now
>
> *Explanation: A reference run exists to show a correct run can pass. If it fails, the task or its checks are broken, and the agent's failures on it say nothing about the agent.*

> **Q3.** Where did the suite's tasks about citing vendor documentation come from?
> - The agent citing vendor pages as D07 ✅
> - Questions from Module 5's labelled set
> - Rules the registry enforces on every write
> - A public benchmark of citation accuracy
>
> *Explanation: Error analysis found the agent citing vendor pages with migration-runbook ids, and the suite added tasks to measure it. On those tasks, the agent invented a citation in every run of two of them.*

> **Q4.** Seven of the eight problems with the simulated user came from one persona. What was different about it?
> - It scripted conditional steps ✅
> - It was the only persona written by hand
> - It gave the simulated user too little to say
> - It used a different model from the others
>
> *Explanation: m02's persona told the user what to do if refused and what to say if offered a move. The simulated user skipped and reordered those steps, and improvised where the persona was silent. The others only said what the user wanted and knew.*

> **Q5.** Why does a pushback suite need tasks where the user is right, as well as tasks where the user is wrong?
> - Each alone rewards one extreme ✅
> - Users are right more often than they are wrong
> - The model only gives way when the user is right
> - Module 6's runs used a different model and prompt
>
> *Explanation: Tasks with only wrong users reward never changing an answer, which is how Module 6's rule looked perfect. The control, with right users, showed the same rule throwing away every self-correction prompted by doubt.*

> **Q6.** All eight held-out registry tasks passed every trial. What does that say about the agent on tasks like these?
> - It could still fail up to about 3 in 8 ✅
> - It never fails on tasks like these, with certainty
> - It fails less often than on the dev tasks
> - Its failure rate can't be bounded at all
>
> *Explanation: With no failures in n independent tasks, the rule of three bounds the true rate at about 3 in n. Those eight were also hand-picked and lean easy, so they don't show the agent does better than on dev tasks.*

> **Q7.** Some models scored up to 8% lower on GSM1k's new problems than on GSM8k, whose style they copied. What's the likeliest reason?
> - The models may have seen the original problems ✅
> - The new problems were written to be much harder
> - Maths is a poor test of language models
> - The original benchmark had broken scoring
>
> *Explanation: The new problems matched the original's style and difficulty, so a drop points to contamination: some of the original score came from test problems in the training data.*

> **Q8.** A suite task passes every trial, but its only check is that the registry ended unchanged. Why isn't it ready for the regression suite?
> - Its checks can't see a reply failure ✅
> - Tasks that always pass belong in capability
> - It needs more trials before it can graduate
> - Regression suites only hold failing tasks
>
> *Explanation: A regression suite raises an alarm when a task starts failing, and this check can't fail on what the agent tells the user, which is where tasks like s05 and the planted-instruction tasks fail. It needs a reply grader first.*

---

## Comprehensive sandbox

*(graded — check the health of a suite: where each task belongs next, and whether the held-out set covers every category)*

**Task shown to learner:**

`lib.py` holds `load_suite` and the first concept's `triage`, read-only. In `suite_health.py` (the entry file), write three functions:

- **`can_catch(checks)`**: `True` if a task's checks can catch more than "the world didn't change". That means any of:
  - a non-empty `answer_includes`, `answer_excludes` or `cites_only_retrieved`
  - a non-empty `must_not_call` (a forbidden call)
  - a non-empty `registry` (a change that has to happen)
  - a `max_tool_calls` limit, whatever its value
  - an `outbox` with a non-empty `body_includes`
  
  Otherwise `False`, including for `{"registry": {}}` and an outbox check that only counts emails.
- **`placement(tasks, trials, reference_passes)`**: where each task belongs next, by id, using `triage`:
  - `"fix the task"` for no criteria, broken, or not run
  - `"read the runs"` when no trial passed
  - `"capability"` for a mixed record
  - for a task that always passes, `"regression"` if `can_catch` its checks, otherwise `"needs a reply grader"`
- **`uncovered_categories(tasks)`**: the sorted list of categories that have no held-out task.

Don't change the inputs. Click Run to place the real suite's 29 tasks.

**Tab: `lib.py`** (read-only)
```python
"""Code from this lesson's concepts. Read-only."""

import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
def triage(tasks: list[dict], trials: dict[str, list[bool]], reference_passes: dict[str, bool]) -> dict[str, str]:
    """What each task needs before its results can be trusted. The first of these that applies wins:

    "no criteria"    its expect has no checks, no notes and no reference answer, so nothing says what success is
    "broken"         its reference run fails its own checks, so even a correct run can't pass
    "not run"        it has no trials
    "read the runs"  no trial passed: more often a broken task than a hard one, until someone reads them
    "always passes"  every trial passed
    "mixed"          some trials passed and some didn't
    """
    labels = {}
    for task in tasks:
        expect, results = task["expect"], trials.get(task["id"], [])
        if not (expect.get("checks") or expect.get("notes") or expect.get("answer")):
            labels[task["id"]] = "no criteria"
        elif not reference_passes.get(task["id"], False):
            labels[task["id"]] = "broken"
        elif not results:
            labels[task["id"]] = "not run"
        elif not any(results):
            labels[task["id"]] = "read the runs"
        elif all(results):
            labels[task["id"]] = "always passes"
        else:
            labels[task["id"]] = "mixed"
    return labels
```

**Tab: `suite_health.py`** (starter, entry file)
```python
from collections import defaultdict

from lib import load_suite, triage


def can_catch(checks: dict) -> bool:
    """Whether a task's checks can catch more than "the world didn't change": something in the reply or an
    email's body, a forbidden call, a change that had to happen, or a step limit."""
    # your code here


def placement(tasks: list[dict], trials: dict[str, list[bool]], reference_passes: dict[str, bool]) -> dict[str, str]:
    """Where each task belongs next: "fix the task", "read the runs", "capability", "regression",
    or "needs a reply grader"."""
    # your code here


def uncovered_categories(tasks: list[dict]) -> list[str]:
    """The categories with no held-out task, sorted."""
    # your code here


if __name__ == "__main__":
    suite = load_suite()
    places = placement(suite["tasks"], suite["trials"], suite["reference_passes"]) or {}
    for place in ("fix the task", "read the runs", "capability", "regression", "needs a reply grader"):
        ids = sorted(t for t, p in places.items() if p == place)
        print(f"{place:<21} {len(ids):>2}  {' '.join(ids)}".rstrip())
    print("categories with no held-out task:", uncovered_categories(suite["tasks"]))
```

**Hidden tests:**
```python
import json

from lib import load_suite
from suite_health import can_catch, placement, uncovered_categories

assert can_catch({"registry": {}}) is False, \
    "a check that only says the registry is unchanged can't catch a failure in the reply: can_catch should be False"
assert can_catch({"registry": {}, "outbox": {"count": 1, "to": "support-team", "body_includes": []}}) is False, \
    "an outbox check with no body_includes only counts emails; it can't see what they say"
for checks, what in (({"answer_includes": ["priority"]}, "a phrase the answer must contain"),
                     ({"answer_excludes": ["REGISTRY_AUTH=off"]}, "a phrase the answer mustn't contain"),
                     ({"cites_only_retrieved": True}, "a citation check"),
                     ({"must_not_call": [["set_model", {}]]}, "a forbidden call"),
                     ({"registry": {"notes_agent": {"model": "claude-haiku"}}}, "a change that has to happen"),
                     ({"max_tool_calls": 6}, "a step limit"),
                     ({"outbox": {"count": 1, "to": "research-team", "body_includes": ["2026-10-31"]}}, "an email body check")):
    assert can_catch(checks) is True, f"{what} can catch a failure: can_catch should be True for {checks}"
assert can_catch({"max_tool_calls": 0}) is True, "a step limit of 0 is still a step limit"


def task(task_id, category="c", split="dev", **checks):
    return {"id": task_id, "category": category, "split": split, "expect": {"checks": checks, "notes": "n"}}


tasks = [task("broken", answer_includes=["x"]), task("unrun", answer_includes=["x"]), task("never", answer_includes=["x"]),
         task("mixed", registry={}), task("solid", answer_includes=["x"]), task("blind", registry={})]
trials = {"broken": [True, True], "never": [False, False], "mixed": [True, False], "solid": [True, True],
          "blind": [True, True]}
references = {"broken": False, "unrun": True, "never": True, "mixed": True, "solid": True, "blind": True}
before = json.dumps([tasks, trials, references])
places = placement(tasks, trials, references)
assert isinstance(places, dict), "placement should return a dict of places by task id"
assert json.dumps([tasks, trials, references]) == before, "placement shouldn't change its inputs"
assert places == {"broken": "fix the task", "unrun": "fix the task", "never": "read the runs", "mixed": "capability",
                  "solid": "regression", "blind": "needs a reply grader"}, f"wrong places: {places}"

suite = load_suite()
real = placement(suite["tasks"], suite["trials"], suite["reference_passes"])
assert sorted(t for t, p in real.items() if p == "needs a reply grader") == ["s05", "s10", "s11", "s12", "s22", "s23"], \
    ("on the real suite, the tasks that always pass on checks that only see the world's state are s05, s10, s11, s12, s22 "
     f"and s23: got {sorted(t for t, p in real.items() if p == 'needs a reply grader')}")
assert sum(p == "regression" for p in real.values()) == 12, "on the real suite, 12 tasks are ready for the regression suite"

covered = [task("a1", "a", "dev"), task("a2", "a", "held_out"), task("b1", "b", "dev"), task("c1", "c", "dev"),
           task("c2", "c", "dev")]
assert uncovered_categories(covered) == ["b", "c"], \
    f"list each category with no held-out task once, sorted: got {uncovered_categories(covered)}"
assert uncovered_categories([task("z", "z", "held_out")]) == [], "a category whose only task is held out is covered"
assert uncovered_categories(suite["tasks"]) == [], "every category in the real suite has a held-out task"
```

**Hint (shown on request):** For `can_catch`, `checks.get(kind)` is falsy for a missing key and for an empty list or dict, which is what you want everywhere except the step limit: `0` is a real limit, so test `"max_tool_calls" in checks`. `placement` is `triage` plus one decision for tasks that always pass. For `uncovered_categories`, count the held-out tasks in each category, including categories with none.

**Reference solution:**

**Tab: `suite_health.py`**
```python
from collections import defaultdict

from lib import load_suite, triage


def can_catch(checks: dict) -> bool:
    """Whether a task's checks can catch more than "the world didn't change": something in the reply or an
    email's body, a forbidden call, a change that had to happen, or a step limit."""
    outbox = checks.get("outbox", {})
    return bool(checks.get("answer_includes") or checks.get("answer_excludes") or checks.get("cites_only_retrieved")
                or checks.get("must_not_call") or checks.get("registry") or "max_tool_calls" in checks
                or outbox.get("body_includes"))


def placement(tasks: list[dict], trials: dict[str, list[bool]], reference_passes: dict[str, bool]) -> dict[str, str]:
    """Where each task belongs next: "fix the task", "read the runs", "capability", "regression",
    or "needs a reply grader"."""
    labels = triage(tasks, trials, reference_passes)
    places = {}
    for task in tasks:
        label = labels[task["id"]]
        if label in ("no criteria", "broken", "not run"):
            places[task["id"]] = "fix the task"
        elif label == "read the runs":
            places[task["id"]] = "read the runs"
        elif label == "mixed":
            places[task["id"]] = "capability"
        elif can_catch(task["expect"].get("checks", {})):
            places[task["id"]] = "regression"
        else:
            places[task["id"]] = "needs a reply grader"
    return places


def uncovered_categories(tasks: list[dict]) -> list[str]:
    """The categories with no held-out task, sorted."""
    held_out = defaultdict(int)
    for task in tasks:
        held_out[task["category"]] += task["split"] == "held_out"
    return sorted(category for category, count in held_out.items() if count == 0)


if __name__ == "__main__":
    suite = load_suite()
    places = placement(suite["tasks"], suite["trials"], suite["reference_passes"])
    for place in ("fix the task", "read the runs", "capability", "regression", "needs a reply grader"):
        ids = sorted(t for t, p in places.items() if p == place)
        print(f"{place:<21} {len(ids):>2}  {' '.join(ids)}".rstrip())
    print("categories with no held-out task:", uncovered_categories(suite["tasks"]))
```
```
fix the task           0
read the runs          3  s06 s09 s24
capability             8  s01 s02 s03 s04 s07 s08 s14 s25
regression            12  s13 s15 s16 s17 s18 s19 s20 s21 s26 s27 s28 s29
needs a reply grader   6  s05 s10 s11 s12 s22 s23
categories with no held-out task: []
```

**Explanation:** The three functions turn the lesson's judgements into a routine:

- **`can_catch` asks whether a check could fail for the reason the task exists.** An unchanged registry is necessary for a lost write or a planted instruction, but the failure in those tasks is what the agent says or sends. A check that only looks at state passes them whatever the reply. A forbidden call, a required change, a step limit or a reply check can all fail on the behaviour itself.
- **`placement` adds one rule to triage:** a task that always passes graduates to the regression suite only if its checks could catch a regression. On the real suite, that sends twelve tasks to regression and holds back six, the lost-write task with two agents, the three planted-instruction tasks and the two broken-result tasks. Those are the categories Lessons 5 and 6 build graders for.
- **`uncovered_categories`** is the held-out composition check: every category the suite tests should have at least one task nobody tunes against. On this suite, none is missing.
