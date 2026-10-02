# Module 7, Lesson 9 — Concept 1: One piece on and off

> **Note for the site build:** the demos use Lesson 4's `LOAD_SUITE` setup and `baseline-grades.json` (already mounted at `/data/eval/suite`). The first demo defines `batch_a` and `batch_b`; carry them, without the printing, into the second demo's hidden setup, with the exercise's reference `pass_rate` and `paired_difference`.

---

## What an ablation asks

Every component in this course came with a reason to add it: compaction keeps long runs inside the context window, Module 6's layers catch failures the agent misses, a label on each search result tells the agent how old a document is. Whether each one actually helps this agent, on these tasks, is a separate question, and the way to answer it is an **ablation**: run the agent with the piece and without it, change nothing else, and compare.

"Change nothing else" is most of the method:

- **The same tasks.** Both conditions run every task, so a difference can't come from one getting easier tasks.
- **The same budget.** The same number of trials per task, the same model and settings, the same step limit. A condition that's allowed more tries looks better for that reason alone.
- **The same graders.** Code checks and judges, applied identically to both.

Then the comparison itself has to respect how the data was produced. Anthropic's Evan Miller, in "Adding Error Bars to Evals" (2024), sets out the statistics evaluations usually skip, and two of his recommendations shape this lesson: when two conditions ran on the same questions, analyze the **paired differences**, question by question, rather than comparing two separate scores; and when questions come in related groups, **cluster** the uncertainty by group, which is the next concept.

---

## Why pairing matters

The cleanest test of a comparison method is to compare a condition with itself. The baseline was run twice, as batches a and b, with the same agent, settings and tasks, so any difference between them is noise. Here are the two batches on the 37 tasks with code checks, each with its own interval:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of the module's suite lessons and already loaded)*

```python
import random

grades = load_suite("baseline-grades")["trials"]
# each task's 10 baseline trials: batch a's 5, then batch b's 5, same agent and settings
batch_a = {task: results[:5] for task, results in grades.items()}
batch_b = {task: results[5:] for task, results in grades.items()}


def suite_rate(per_task: dict, repeats: int = 2000, seed: int = 0) -> tuple[float, float, float]:
    """The mean pass rate over tasks, with a 95% interval from resampling tasks."""
    rates = [sum(r) / len(r) for r in per_task.values()]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(rates, k=len(rates))) / len(rates) for _ in range(repeats))
    return sum(rates) / len(rates), means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


for name, per_task in (("batch a", batch_a), ("batch b", batch_b)):
    mean, low, high = suite_rate(per_task)
    print(f"{name}: {mean:.1%} of trials pass, averaged over {len(per_task)} tasks (95% interval {low:.1%} to {high:.1%})")
```
```
batch a: 91.4% of trials pass, averaged over 37 tasks (95% interval 82.7% to 98.4%)
batch b: 90.8% of trials pass, averaged over 37 tasks (95% interval 82.7% to 97.8%)
```
*(runs live, shows output — read-only demo snippet, not graded; the current code checks on the baseline's two batches)*

Each interval is about 16 points wide. Compared this way, a real improvement of 10 points could hide inside the overlap. But most of that width is the tasks themselves: some always pass, some never do, and resampling which tasks are in the suite moves the average a lot. Both batches ran the same tasks, so that part of the variation is shared, and comparing each task with itself cancels it. That's the paired difference.

---

## Applied sandbox exercise
*(graded — a paired difference between two conditions, with an interval from resampling tasks)*

**Task shown to learner:**

Write `paired_difference(a, b, repeats=2000, seed=0)`. `a` and `b` map task ids to lists of trial results (`True` for a pass). Using only the tasks both contain, in sorted order:

- compute each task's difference, B's pass rate minus A's
- the mean of those differences is the estimate
- for the interval, use one `random.Random(seed)`: `repeats` times, draw `len(differences)` of them with `rng.choices` and take their mean; sort the means and return the ones at index `int(0.025 * repeats)` and `int(0.975 * repeats) - 1`

Return `(mean, low, high)`. Raise `ValueError` if the two share no tasks. `pass_rate` is provided.

**Starter code:**
```python
import random


def pass_rate(results: list[bool]) -> float:
    return sum(results) / len(results)


def paired_difference(a: dict[str, list[bool]], b: dict[str, list[bool]], repeats: int = 2000,
                      seed: int = 0) -> tuple[float, float, float]:
    """B minus A: the mean over tasks of each task's pass-rate difference, with a 95% interval from resampling
    tasks. Only tasks both conditions ran are compared."""
    # your code here


a = {"t1": [True, True, False], "t2": [False, False, False], "t3": [True, True, True]}
b = {"t1": [True, True, True], "t2": [True, False, False], "t3": [True, True, True]}
print(paired_difference(a, b))
```

**Hidden tests:**
```python
a = {"t1": [True, True, False], "t2": [False, False, False], "t3": [True, True, True], "only_a": [False]}
b = {"t1": [True, True, True], "t2": [True, False, False], "t3": [True, True, True], "only_b": [True]}
result = paired_difference(a, b)
assert result is not None, "paired_difference should return (mean, low, high)"
mean, low, high = result
assert abs(mean - (1 / 3 + 1 / 3 + 0) / 3) < 1e-9, \
    f"the mean of each shared task's pass-rate difference, B minus A: (1/3 + 1/3 + 0) / 3, got {mean}"
assert low <= mean <= high, f"the interval contains the mean: got {(mean, low, high)}"
assert paired_difference(a, b) == result, "the same seed gives the same interval"
assert paired_difference(b, a)[0] == -mean, "swapping the conditions flips the sign"

uneven = {"x": [True] * 10, "y": [False]}
other = {"x": [False] * 10, "y": [True]}
assert paired_difference(uneven, other)[0] == 0.0, \
    "each task counts once, however many trials it has: (-1 + 1) / 2 = 0, not a pooled rate over all trials"

same = {f"t{n}": [n % 2 == 0, True] for n in range(20)}
mean, low, high = paired_difference(same, same)
assert (mean, low, high) == (0.0, 0.0, 0.0), "a condition compared with itself differs by exactly nothing"

spread = {f"t{n}": [True] for n in range(30)}
mixed = {f"t{n}": [n % 3 == 0] for n in range(30)}
mean, low, high = paired_difference(spread, mixed, seed=1)
assert low < mean < high and high - low > 0.1, \
    f"tasks that differ unevenly give an interval with real width: got {(mean, low, high)}"
import random
varied_a = {f"t{n}": [True] * (n % 5 + 1) + [False] * (n % 3 + 1) for n in range(30)}
varied_b = {f"t{n}": [True] * (n % 4 + 1) + [False] * (n % 6 + 1) for n in range(30)}
diffs = [pass_rate(varied_b[t]) - pass_rate(varied_a[t]) for t in sorted(varied_a)]
check = random.Random(7)
expected = sorted(sum(check.choices(diffs, k=30)) / 30 for _ in range(2000))
got = paired_difference(varied_a, varied_b, seed=7)
assert (got[1], got[2]) == (expected[50], expected[1949]), \
    ("resample with random.Random(seed).choices over the tasks' differences, in sorted task order, and take the "
     f"2.5th and 97.5th percentiles of 2000 means: expected {(expected[50], expected[1949])}, got {got[1:]}")
try:
    paired_difference({"a": [True]}, {"b": [True]})
except ValueError:
    pass
except Exception as error:
    raise AssertionError(f"conditions with no task in common: raise ValueError, not {type(error).__name__}") from error
else:
    raise AssertionError("conditions with no task in common can't be compared: raise ValueError")
```

**Hint (shown on request):** `a.keys() & b.keys()` gives the shared tasks; sort them so the result doesn't depend on dict order. The resampling is one line inside `sorted(...)`, a generator of means over `range(repeats)`.

**Reference solution:**
```python
import random


def pass_rate(results: list[bool]) -> float:
    return sum(results) / len(results)


def paired_difference(a: dict[str, list[bool]], b: dict[str, list[bool]], repeats: int = 2000,
                      seed: int = 0) -> tuple[float, float, float]:
    """B minus A: the mean over tasks of each task's pass-rate difference, with a 95% interval from resampling
    tasks. Only tasks both conditions ran are compared."""
    tasks = sorted(a.keys() & b.keys())
    if not tasks:
        raise ValueError("the two conditions share no tasks")
    differences = [pass_rate(b[t]) - pass_rate(a[t]) for t in tasks]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(differences, k=len(differences))) / len(differences) for _ in range(repeats))
    return sum(differences) / len(differences), means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


a = {"t1": [True, True, False], "t2": [False, False, False], "t3": [True, True, True]}
b = {"t1": [True, True, True], "t2": [True, False, False], "t3": [True, True, True]}
print(paired_difference(a, b))
```
```
(0.22222222222222224, 0.0, 0.3333333333333333)
```

**Explanation:** Each task contributes one difference, however many trials it ran, because the task is what was sampled from the space of tasks the agent might face; trials within a task are repeated measurements of the same thing. That's why resampling has to draw whole tasks, and why pooling all trials together, or resampling trials, would understate the uncertainty. A condition compared with itself gives exactly zero, which is the simplest check that the pairing is right.

---

## The same two batches, paired

```python
mean, low, high = paired_difference(batch_a, batch_b)
print(f"batch b minus batch a, task by task: {mean:+.1%} (95% interval {low:+.1%} to {high:+.1%})")
changed = sorted(t for t in batch_a if sum(batch_a[t]) != sum(batch_b[t]))
print(f"tasks whose pass count moved between the batches: {len(changed)} of {len(batch_a)}: {', '.join(changed)}")
```
```
batch b minus batch a, task by task: -0.5% (95% interval -2.2% to +1.1%)
tasks whose pass count moved between the batches: 3 of 37: a10, m03, m04
```
*(runs live, shows output — read-only demo snippet, not graded; `paired_difference` is the exercise's reference version)*

Paired, the interval shrinks from about 16 points per batch to about 3 points for the difference, and it sits around zero, as it should for two runs of the same agent. Only three tasks' pass counts moved at all between the batches. That's the precision an ablation has to work with: with this suite and 5 trials per task, a component that changes the pass rate by a point or two can't be told from noise, and one that changes it by five or more can.

That interval also measures something real: how much the agent's results vary from one run to the next with nothing changed. A comparison is only meaningful against the noise you measure when nothing changes, so running a condition against itself is worth doing whenever the setup changes.

---

## Quiz cards

> **Q1.** Why does an ablation run both conditions on the same tasks with the same number of trials?
> - So the piece is the only difference ✅
> - So the run finishes faster on a shared server
> - So the judges see each task twice
> - So the pass rates add up to 100%
>
> *Explanation: Different tasks or more tries would change the results on their own. Holding everything else fixed is what lets a difference be put down to the piece.*

> **Q2.** Batches a and b each had an interval about 16 points wide. Why was the paired difference's only about 3 points wide?
> - Pairing cancels task difficulty ✅
> - The paired method uses more trials per task
> - Paired intervals use a lower confidence level
> - The second batch had fewer failing tasks
>
> *Explanation: Most of each batch's uncertainty comes from which tasks happen to be in the suite. Both batches ran the same tasks, so differencing task by task removes that shared part.*

> **Q3.** Why does each task contribute one difference, however many trials it ran?
> - Tasks are what was sampled ✅
> - Trials can't be compared between conditions
> - Some tasks ran only one trial
> - It makes the mean easier to compute
>
> *Explanation: The suite is a sample of the tasks the agent might face; trials are repeat measurements of one task. Resampling whole tasks reflects that, and pooling trials would make the interval too narrow.*

> **Q4.** Two runs of the same agent differed by −0.5 points, with an interval from −2.2 to +1.1. What does that tell you about an ablation on this suite?
> - A point or two is within the noise ✅
> - The agent got slightly worse between the batches
> - Any change of half a point is significant
> - The second batch should be discarded
>
> *Explanation: With nothing changed, the paired difference still spans a few points. A component whose effect is smaller than that can't be distinguished with this suite and budget.*

> **Q5.** What does Miller's "Adding Error Bars to Evals" recommend when two models answer the same questions?
> - Analyze the paired differences ✅
> - Compare the two scores' intervals for overlap
> - Report the higher score without an interval
> - Run each model on different questions
>
> *Explanation: Pairing uses the fact that both answered the same questions, which removes question difficulty from the comparison. Overlapping separate intervals can hide a real difference.*
