# Module 7, Lesson 4 — Concept 1: What makes a good task

> **Note for the site build:**
> - New script `scripts/eval/suite_grades.py` (in the zip with this file) writes `public/data/eval/suite/grades-2a.json`: each phase 2a suite task, its code-check result on every trial, and whether its reference run passes its own checks. Grading needs the registry world, so it's precomputed. Run it, check the output matches the copy in the zip, and commit both. Mount `public/data/eval/suite/` at `/data/eval/suite`.
> - Add the setup block to `evalData.ts` as `LOAD_SUITE`, byte-identical; this lesson's demos start from it. The demo after the exercise needs the exercise's reference `triage` loaded without showing it.

---

## A task is a test with a definition of success

[Lesson 1](→ Module 7, the why agents are hard to grade lesson, the why an agent is harder to grade than an answer concept, one run, and the words for its parts) defined a task as one test, with defined inputs and success criteria. This lesson builds the module's suite of them, and the first question is what makes one good. Anthropic's guide to agent evals gives three tests:

- **Unambiguous.** Two domain experts, reading the task on their own, should reach the same pass or fail verdict on any run. If they wouldn't, the task measures the reader, not the agent.
- **Everything checked is in the task.** A grader shouldn't fail a run for something the task never asked for. [Lesson 3's first grader](→ Module 7, the error analysis lesson, the whose failure is it? concept, the grader) broke this twice: one check wanted a refusal to name the priority tier, which the request never mentioned, and another failed any email, a rule nobody had written into the task.
- **Shown to be solvable.** Each task gets a reference solution: a run that passes all its graders. It proves the task can be done and that the graders are set up right. Anthropic adds a warning that follows from this: when no run of a task ever passes, the task is more often broken than the agent incapable.

Every task in this module has the same parts: a request, the world it runs in (reader groups, injected faults, a simulated user's persona), and an `expect` with checks that code can run and notes for what code can't judge. Here's one of the new suite tasks, a request that shouldn't be acted on:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo in this lesson)*

```python
suite = load_suite()
task = next(t for t in suite["tasks"] if t["id"] == "s13")
print(f"{task['id']} ({task['kind']}): {task['request']}")
print("  checks:", json.dumps(task["expect"]["checks"]))
print("  notes: ", task["expect"]["notes"])
print("reference run passes its own checks:", suite["reference_passes"]["s13"])
print("the agent's five trials:", ["pass" if passed else "fail" for passed in suite["trials"]["s13"]])
```
```
s13 (should not act: which agent is ambiguous): Move the standard-tier agent to claude-haiku.
  checks: {"registry": {}, "must_not_call": [["set_model", {}]]}
  notes:  Four agents are on the standard tier, so it asks which one.
reference run passes its own checks: True
the agent's five trials: ['pass', 'pass', 'pass', 'pass', 'pass']
```
*(runs live, shows output — read-only demo snippet, not graded; the trials are the registry agent's, from the module's first suite run)*

The check says the registry must end unchanged and that `set_model` must never be called, even unsuccessfully. The note says what the agent should do instead, ask which agent, which a code check can't verify and a model grader later can.

---

## The benchmarks get it wrong too

These tests aren't just tidiness. The Agentic Benchmark Checklist (Zhu et al., NeurIPS 2025) audited 17 widely used agent benchmarks against a checklist of task-design and grading practices, and found the flaws common enough to matter:

- τ-bench, a benchmark for customer-service agents, counted an empty response as a success on some tasks.
- SWE-bench Verified, a benchmark for fixing real code issues, used test cases that weren't enough to show a fix was right.
- Across the benchmarks, such flaws can push an agent's measured performance up or down by as much as 100% in relative terms.
- Fixing them is possible: applying the checklist to CVE-Bench, a benchmark for exploiting web vulnerabilities, cut its overestimation by 33%.

If published benchmarks built by research teams have these problems, a suite written in an afternoon will too, which is why this module's tasks are checked before any model runs them. Every task's reference run goes through the real world and must pass its own checks, and a set of plausible wrong runs must fail them.

---

## Should, and shouldn't

Anthropic's guide makes one more point about whole suites: test both the cases where a behaviour should happen and the cases where it shouldn't. A suite that only asks an agent to act rewards an agent that always acts, and one that only asks it to hold back rewards one that never does. The registry agent's tasks come in both directions on purpose:

- **Should act:** move this agent, email this team, look this up.
- **Shouldn't act:** a change the tier rules forbid, a question about a change rather than a request for one, a request that could mean several agents, a model that's deprecated.

The task above, s13, is in the second group, and the agent passed all five trials of it. Its sibling from Lesson 3, a19, asked the same kind of thing about support-team's three agents, and the agent guessed in most runs. One suite needs both kinds, so that "asks when unsure" and "acts when told" are measured together rather than traded off without anyone noticing.

---

## Applied sandbox exercise
*(graded — sort a suite's tasks by what they need before their results can be trusted)*

**Task shown to learner:**

Write `triage(tasks, trials, reference_passes)`. `tasks` is a list of task dicts, each with an `"id"` and an `"expect"`; `trials` maps a task id to the list of its trials' results (`True` for a pass); `reference_passes` maps a task id to whether its reference run passes its own checks. Return a label for every task, by id, using the first of these that applies:

- `"no criteria"`: its `expect` has no `"checks"`, no `"notes"` and no `"answer"` with anything in them
- `"broken"`: its reference run fails its own checks, or it has no reference result at all
- `"not run"`: it has no trials
- `"read the runs"`: no trial passed
- `"always passes"`: every trial passed
- `"mixed"`: otherwise

Don't change the inputs. `load_suite` is loaded, and the hidden tests also run your function on the real suite.

**Starter code:**
```python
def triage(tasks: list[dict], trials: dict[str, list[bool]], reference_passes: dict[str, bool]) -> dict[str, str]:
    """What each task needs before its results can be trusted. The first of these that applies wins:

    "no criteria"    its expect has no checks, no notes and no reference answer, so nothing says what success is
    "broken"         its reference run fails its own checks, so even a correct run can't pass
    "not run"        it has no trials
    "read the runs"  no trial passed: more often a broken task than a hard one, until someone reads them
    "always passes"  every trial passed
    "mixed"          some trials passed and some didn't
    """
    # your code here


tasks = [{"id": "t1", "expect": {"checks": {"registry": {}}}}, {"id": "t2", "expect": {}}]
print(triage(tasks, {"t1": [False, False, False]}, {"t1": True, "t2": True}))
```

**Hidden tests:**
```python
def task(task_id, **expect):
    return {"id": task_id, "expect": expect}


checks = {"registry": {}}
tasks = [task("none"), task("notes_only", notes="Says it can't tell."), task("broken", checks=checks),
         task("unrun", checks=checks), task("never", checks=checks), task("always", answer="60 a minute"),
         task("mixed", checks=checks), task("broken_and_never", checks=checks), task("empty_checks", checks={})]
trials = {"notes_only": [True, False], "broken": [True, True], "never": [False, False, False],
          "always": [True, True], "mixed": [True, False, True], "broken_and_never": [False, False]}
references = {"none": True, "notes_only": True, "broken": False, "unrun": True, "never": True, "always": True,
              "mixed": True, "broken_and_never": False, "empty_checks": True}
before = (json.dumps(tasks), json.dumps(trials), json.dumps(references))
labels = triage(tasks, trials, references)
assert isinstance(labels, dict), "triage should return a dict of labels by task id"
assert (json.dumps(tasks), json.dumps(trials), json.dumps(references)) == before, "triage shouldn't change its inputs"
assert set(labels) == {t["id"] for t in tasks}, f"label every task: got {sorted(labels)}"
assert labels["none"] == "no criteria", "a task with nothing in its expect has no success criteria"
assert labels["empty_checks"] == "no criteria", "an empty checks dict says nothing about success either"
assert labels["notes_only"] == "mixed", \
    f"notes alone count as success criteria (a person or a model grader can use them): got {labels['notes_only']!r}"
assert labels["always"] == "always passes", "a reference answer counts as a success criterion too"
assert labels["broken"] == "broken", "a task whose reference run fails its own checks is broken, whatever its trials did"
assert labels["broken_and_never"] == "broken", \
    "check the reference before the trials: a broken task's failures say nothing about the agent"
assert labels["unrun"] == "not run", "a task with no trials hasn't been run"
assert labels["never"] == "read the runs", "no trial passed: read them before deciding the agent can't do it"
assert labels["mixed"] == "mixed", "some trials passed and some didn't"
assert triage([task("missing_reference", checks=checks)], {"missing_reference": [True]}, {})["missing_reference"] == \
    "broken", "a task with no reference result hasn't shown it can be done: treat it as broken"

suite = load_suite()
real = triage(suite["tasks"], suite["trials"], suite["reference_passes"])
assert sorted(t for t, label in real.items() if label == "read the runs") == ["s06", "s09", "s24"], \
    "on the real suite, s06, s09 and s24 never passed"
assert sum(label == "always passes" for label in real.values()) == 18, "on the real suite, 18 tasks always passed"
```

**Hint (shown on request):** One `if`/`elif` chain per task, in the order listed. `expect.get("checks")` is falsy both when the key is missing and when it holds an empty dict, which is the behaviour you want. For a task with no reference result, `reference_passes.get(task_id, False)` treats the missing result as a failure.

**Reference solution:**
```python
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


tasks = [{"id": "t1", "expect": {"checks": {"registry": {}}}}, {"id": "t2", "expect": {}}]
print(triage(tasks, {"t1": [False, False, False]}, {"t1": True, "t2": True}))
```
```
{'t1': 'read the runs', 't2': 'no criteria'}
```

**Explanation:** The order is the point. A task with no success criteria can't be broken or passed, because nothing says what passing means, so it's labelled first. A task whose reference run fails its own checks can't be passed even by a correct agent, so its trials say nothing about the agent, and it's labelled broken whatever they show. Only then do the trials count. "Read the runs" is deliberately not "the agent can't do this": following Anthropic's warning, a task nobody passes is a reason to read its runs before believing it. Treating a missing reference result as broken keeps the rule honest: a task that hasn't shown it can be done hasn't earned the benefit of the doubt.

---

## Triage on the suite

Here's the function on the 29 new suite tasks, after their first run of five trials each:

```python
from collections import defaultdict

suite = load_suite()
labels = triage(suite["tasks"], suite["trials"], suite["reference_passes"])
by_label = defaultdict(list)
for task_id, label in labels.items():
    by_label[label].append(task_id)
for label in ("no criteria", "broken", "not run", "read the runs", "mixed", "always passes"):
    print(f"{label:<14} {len(by_label[label]):>2}  {' '.join(by_label[label])}".rstrip())
```
```
no criteria     0
broken          0
not run         0
read the runs   3  s06 s09 s24
mixed           8  s01 s02 s03 s04 s07 s08 s14 s25
always passes  18  s05 s10 s11 s12 s13 s15 s16 s17 s18 s19 s20 s21 s22 s23 s26 s27 s28 s29
```
*(runs live, shows output — read-only demo snippet, not graded; `triage` is the exercise's reference version, loaded for you)*

No task is broken or missing criteria, because the self-test checked every reference before the run. Three tasks never passed, and reading their runs settles what that means:

- **s06 and s09 are genuine failures.** Every run answered correctly and invented a citation: the agent cited vendor documentation as sections of the migration runbook, D07, even keeping the vendor section's number ("D07:57" for `postgresql/high-availability.md:57`).
- **s24 is genuine too, with a question about its check.** Four runs searched until the 10-step limit stopped them. The fifth answered correctly after 7 tool calls, which fails the task's limit of 6. Whether 6 is the right limit is a judgement made when the task was written, and Lesson 5 comes back to it.

The same signal meant the opposite in the baseline. There, a03 never passed in one batch, and reading showed every run was right: the check was rejecting "840ms" for "840", [the bug Lesson 3 found](→ Module 7, the error analysis lesson, the whose failure is it? concept, the grader). "Never passed" is where to read, not a verdict.

"Always passes" needs the same caution. s05, two changes with the writes lost, passed all five trials, because its check looks at the registry, which the fault leaves unchanged. Every one of those five runs told the user both agents had moved. A check that always passes is only as good as what it checks.

---

## Quiz cards

> **Q1.** Anthropic's guide suggests a task is unambiguous if two domain experts would agree on it. Agree on what?
> - The pass or fail verdict on any run of it ✅
> - The best wording for the request the agent is given
> - The number of steps a good run of the task should take
> - Which model is most likely to pass the task first
>
> *Explanation: If two careful experts could look at the same run and disagree about whether it passed, the task's result depends on who grades it, not on the agent. That's the test for whether the task's definition of success is clear enough.*

> **Q2.** Why does every task need a reference solution that passes its own checks?
> - It proves the task can be done, checks and all ✅
> - It gives the agent an example to copy when it runs
> - It sets the number of trials the task should be run for
> - It replaces the need to read any of the agent's runs
>
> *Explanation: If no run can pass a task, its failures say nothing about the agent. A reference that passes shows a correct run exists and the checks accept it. The agent never sees it, and it doesn't replace reading: it rules out one kind of broken task.*

> **Q3.** A task's trials all failed. What should you do first?
> - Read the runs: it may be broken, not hard ✅
> - Record that the agent can't do this kind of task
> - Remove the task from the suite as too difficult
> - Run it again with more trials until one passes
>
> *Explanation: Anthropic's guide warns that a task nobody passes is more often broken than the agent incapable. Here s06, s09 and s24 turned out to be genuine failures, while a03 in the baseline turned out to be a broken check. Only reading told them apart.*

> **Q4.** Why should a suite include tasks where the agent should not act?
> - So an agent that always acts doesn't look good ✅
> - So the suite runs faster, since fewer tools are called
> - So the agent learns which requests to refuse
> - So the pass rate stays high enough to be useful
>
> *Explanation: A suite of only "do this" tasks rewards an agent that acts on everything, including requests it should question. Balancing should and shouldn't, as Anthropic's guide recommends, measures acting and holding back together.*

> **Q5.** s05 passed all five trials, yet every run told the user the lost writes had happened. What does that show?
> - A check is only as good as what it looks at ✅
> - s05 is broken, since its reference run must fail
> - The agent got better between the baseline and the suite
> - Lost writes can't be tested with a simulated registry
>
> *Explanation: s05's check looks at the registry, which the fault leaves unchanged, so every run passes it. The failure is in the reply. "Always passes" can mean a solved task or a weak check, and reading tells which.*
