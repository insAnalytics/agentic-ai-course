# Module 7, Lesson 9 — Concept 2: Suite-wide reliability, and items that aren't independent

> **Note for the site build:** the first demo uses Lesson 4's `LOAD_SUITE` setup and `baseline-grades.json`; the second reads Module 6's `wordings.smaller.json` from `/data/reliability/runs` (Module 6's mount). Both need the exercise's reference `task_pass_hat_k` and `suite_pass_hat_k` loaded without showing them, and the second needs `random` imported.

---

## pass^k, for a whole suite

[Module 6 defined pass^k](→ Module 6, the why agents fail, and what "reliable" means lesson, the reliability as pass^k concept, estimating pass^k from runs you already have) for one task: the chance that k attempts all succeed, estimated from n recorded runs with c successes as C(c, k) / C(n, k). It also set the rule for a suite: [average per task, never raise the average to the power k](→ Module 6, the why agents fail, and what "reliable" means lesson, the reliability as pass^k concept, average per task, never the average to the power k), because a suite where some tasks always pass and others always fail has a very different pass^k from one where every task passes 90% of the time. Module 6 promised that suite-wide reliability would be tracked here, as the agent changes.

Tracking needs an interval, for the reason the last concept gave: the tasks in a suite are a sample, and a different sample would give a different number. The interval comes from resampling tasks, exactly as for a pass rate, with each task's pass^k as its value.

---

## Applied sandbox exercise
*(graded — pass^k over a whole suite, with an interval from resampling tasks)*

**Task shown to learner:**

`task_pass_hat_k(successes, runs, k)` is Module 6's estimate for one task, provided. Write `suite_pass_hat_k(per_task, k, repeats=2000, seed=0)`. `per_task` maps task ids to lists of trial results. Raise `ValueError` if any task has fewer than `k` trials. Otherwise, compute each task's pass^k in sorted task order; the mean is the estimate; for the interval, use one `random.Random(seed)` to draw `len(values)` values with `rng.choices`, `repeats` times, take each draw's mean, sort the means, and return the ones at index `int(0.025 * repeats)` and `int(0.975 * repeats) - 1`. Return `(mean, low, high)`.

**Starter code:**
```python
import random
from math import comb


def task_pass_hat_k(successes: int, runs: int, k: int) -> float:
    """Module 6's estimate of one task's pass^k: the chance that k trials drawn from its runs all pass."""
    return comb(successes, k) / comb(runs, k)


def suite_pass_hat_k(per_task: dict[str, list[bool]], k: int, repeats: int = 2000,
                     seed: int = 0) -> tuple[float, float, float]:
    """pass^k averaged over tasks, with a 95% interval from resampling tasks (sorted, one seeded generator).
    Every task needs at least k trials."""
    # your code here


per_task = {"t1": [True, True, True, False], "t2": [True, True, True, True], "t3": [False, True, False, False]}
print(suite_pass_hat_k(per_task, k=2))
```

**Hidden tests:**
```python
from math import comb

per_task = {"t1": [True, True, True, False], "t2": [True, True, True, True], "t3": [False, True, False, False]}
result = suite_pass_hat_k(per_task, k=2)
assert result is not None, "suite_pass_hat_k should return (mean, low, high)"
mean, low, high = result
expected = (comb(3, 2) / comb(4, 2) + 1.0 + 0.0) / 3
assert abs(mean - expected) < 1e-9, f"the mean over tasks of comb(successes, k) / comb(runs, k): expected {expected:.4f}, got {mean}"
assert low <= mean <= high, "the interval contains the mean"
assert abs(suite_pass_hat_k(per_task, k=1)[0] - (0.75 + 1 + 0.25) / 3) < 1e-9, "pass^1 is the mean pass rate over tasks"
assert suite_pass_hat_k(per_task, k=4)[0] == 1 / 3, "pass^4 here: only t2 passed all four"
assert abs(suite_pass_hat_k({"x": [True] * 3 + [False]}, k=2)[0] - 0.5) < 1e-9, \
    "one task, 3 of 4 passing: pass^2 is 3/6, not (3/4)^2"

import random
varied = {f"t{n}": [i < (n % 7) for i in range(8)] for n in range(25)}
values = [comb(sum(varied[t]), 3) / comb(8, 3) for t in sorted(varied)]
rng = random.Random(5)
means = sorted(sum(rng.choices(values, k=25)) / 25 for _ in range(2000))
got = suite_pass_hat_k(varied, k=3, seed=5)
assert (got[1], got[2]) == (means[50], means[1949]), \
    ("resample the tasks' pass^k values, in sorted task order, with random.Random(seed).choices: "
     f"expected {(means[50], means[1949])}, got {got[1:]}")
try:
    suite_pass_hat_k(per_task, k=5)
except ValueError:
    pass
except Exception as error:
    raise AssertionError(f"k larger than a task's trials: raise ValueError, not {type(error).__name__}") from error
else:
    raise AssertionError("pass^5 with only 4 trials per task can't be estimated: raise ValueError")
```

**Hint (shown on request):** It's last concept's paired difference with a different value per task: one pass^k per task instead of one difference. Check the trial counts first, because `comb(runs, k)` is zero when k is larger than the runs.

**Reference solution:**
```python
import random
from math import comb


def task_pass_hat_k(successes: int, runs: int, k: int) -> float:
    """Module 6's estimate of one task's pass^k: the chance that k trials drawn from its runs all pass."""
    return comb(successes, k) / comb(runs, k)


def suite_pass_hat_k(per_task: dict[str, list[bool]], k: int, repeats: int = 2000,
                     seed: int = 0) -> tuple[float, float, float]:
    """pass^k averaged over tasks, with a 95% interval from resampling tasks (sorted, one seeded generator).
    Every task needs at least k trials."""
    if any(k > len(results) for results in per_task.values()):
        raise ValueError(f"pass^{k} needs at least {k} trials of every task")
    values = [task_pass_hat_k(sum(per_task[t]), len(per_task[t]), k) for t in sorted(per_task)]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(values, k=len(values))) / len(values) for _ in range(repeats))
    return sum(values) / len(values), means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


per_task = {"t1": [True, True, True, False], "t2": [True, True, True, True], "t3": [False, True, False, False]}
print(suite_pass_hat_k(per_task, k=2))
```
```
(0.5, 0.0, 1.0)
```

**Explanation:** Each task's pass^k is computed from its own runs before anything is averaged, which is Module 6's rule; raising the suite's pass rate to the power k, or pooling every trial, gives a different and wrong number, and the tests include one of each. The interval resamples tasks, so a suite of a few dozen tasks gives a wide one, and that width is part of the result: a pass^k reported without it can't be compared with the next version's.

---

## The baseline's pass^k

```python
grades = load_suite("baseline-grades")["trials"]
print(f"{len(grades)} tasks with code checks, 10 baseline trials each")
for k in (1, 2, 5, 10):
    mean, low, high = suite_pass_hat_k(grades, k)
    print(f"  pass^{k:<2} {mean:.1%}  (95% interval {low:.1%} to {high:.1%})")
```
```
37 tasks with code checks, 10 baseline trials each
  pass^1  91.1%  (95% interval 82.4% to 98.1%)
  pass^2  88.9%  (95% interval 79.6% to 97.0%)
  pass^5  86.0%  (95% interval 74.8% to 95.2%)
  pass^10 83.8%  (95% interval 70.3% to 94.6%)
```
*(runs live, shows output — read-only demo snippet, not graded; the current code checks on the baseline's two batches, 10 trials per task)*

The curve falls slowly from pass^1 to pass^10, from about 91% to 84%, because most of these tasks either always pass or always fail; only a few are flaky. The intervals widen as k grows, since pass^k at high k depends on whether a handful of tasks ever slip. And these are code checks, so the rates inherit their blind spots: the lost-write tasks pass them while misleading the user, as Lessons 4 to 6 found. A suite-wide pass^k is only as good as the graders behind each trial.

---

## When items aren't independent

Resampling tasks assumes the tasks are independent samples. Often they aren't. Miller's paper calls this the clustering problem: when questions come in related groups, such as several questions about one passage, their results move together, and treating them as independent makes the interval too narrow. He reports that on popular evals, clustered standard errors can be more than three times the naive ones.

Module 6's wordings runs are a clean case: each of 84 questions asked in three different wordings, ten samples each. A model that knows the answer usually knows it in every wording, so three wordings of one question are closer to one item than three. Here's the 2B's accuracy with each wording treated as its own item, and with wordings grouped by question:

```python
import json
from collections import defaultdict
from pathlib import Path

run = json.loads(Path("/data/reliability/runs/wordings.smaller.json").read_text(encoding="utf-8"))
# one item per (question, wording): its share of the 10 samples that were right
items = [(r["id"], sum(s["correct"] for s in r["samples"]) / len(r["samples"])) for r in run["results"]]
by_question = defaultdict(list)
for question, score in items:
    by_question[question].append(score)


def interval(groups: list[list[float]], repeats: int = 2000, seed: int = 0) -> tuple[float, float]:
    """95% interval for the mean item score, resampling whole groups."""
    rng = random.Random(seed)
    means = []
    for _ in range(repeats):
        picked = [score for group in rng.choices(groups, k=len(groups)) for score in group]
        means.append(sum(picked) / len(picked))
    means.sort()
    return means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


accuracy = sum(score for _, score in items) / len(items)
naive = interval([[score] for _, score in items])
clustered = interval(list(by_question.values()))
print(f"Qwen3.5-2B, {len(by_question)} questions x 3 wordings x 10 samples: accuracy {accuracy:.1%}")
print(f"  each wording as its own item: {naive[0]:.1%} to {naive[1]:.1%} (width {naive[1] - naive[0]:.1%})")
print(f"  clustered by question:        {clustered[0]:.1%} to {clustered[1]:.1%} (width {clustered[1] - clustered[0]:.1%})")
```
```
Qwen3.5-2B, 84 questions x 3 wordings x 10 samples: accuracy 91.3%
  each wording as its own item: 89.0% to 93.5% (width 4.5%)
  clustered by question:        88.0% to 94.3% (width 6.3%)
```
*(runs live, shows output — read-only demo snippet, not graded; Module 6's recorded runs of Qwen3.5-2B on set E)*

Grouping by question widens the interval by about 40%. That's smaller than Miller's worst cases, because these wordings are paraphrases of the same question rather than different questions sharing a document, but it's the same effect, and it would make a false difference look real.

This module's suite has clusters of its own, and they decide what the unit of resampling should be:

- **Trials of one task.** Already handled: a task's trials are summarized into one value before resampling.
- **Variants of one question.** The restricted questions run as an allowed and a denied task, and the lost-write tasks are twins of tasks that also run without the fault. Where variants are compared together, they belong in one cluster.
- **Tasks written from one failure category.** The suite tasks were written several to a category, and an agent change that fixes a category moves them together.

The rule is the same each time: resample whatever was sampled independently. When in doubt, cluster at the higher level; the wider interval is the honest one.

---

## Quiz cards

> **Q1.** Why is suite-wide pass^k the mean of each task's pass^k, rather than the suite's pass rate to the power k?
> - Tasks differ in how reliable they are ✅
> - The power of a mean can't be computed
> - Each task has a different number of trials
> - pass^k is only defined for single tasks
>
> *Explanation: A suite of always-pass and always-fail tasks has the same pass rate as one of uniformly 90% tasks, but very different pass^k. Averaging per-task pass^k keeps that difference, as Module 6 showed.*

> **Q2.** Why does suite_pass_hat_k raise an error when k is larger than a task's trials?
> - It can't draw k from fewer runs ✅
> - Large k always gives a pass^k of zero
> - The interval would be too wide to report
> - Tasks with few trials are always broken
>
> *Explanation: The estimate draws k runs from the n recorded, so it needs n ≥ k. With fewer runs there's nothing to estimate from, and the formula's denominator is zero.*

> **Q3.** The baseline's pass^k fell only from about 91% to 84% between k = 1 and k = 10. What does that say about its tasks?
> - Most always pass or always fail ✅
> - The agent improves with each attempt
> - Ten trials were too few to measure it
> - The code checks are too strict
>
> *Explanation: pass^k falls fast only for flaky tasks, ones that pass sometimes. A slow fall means most tasks are consistent, either way.*

> **Q4.** Grouping Module 6's three wordings by question widened the 2B's interval by about 40%. Why?
> - Wordings of a question move together ✅
> - The grouped version uses fewer samples
> - Paraphrases are harder for the model
> - Clustering lowers the confidence level
>
> *Explanation: Treating correlated items as independent overstates how much information they carry. Resampling whole questions reflects that three wordings of one question are closer to one item than three.*

> **Q5.** Several suite tasks were written from the same failure category. What should an interval do about that?
> - Cluster by category when unsure ✅
> - Count each task twice to make up for it
> - Drop all but one task from each category
> - Nothing, since tasks are always independent
>
> *Explanation: Tasks written for one failure move together when that failure is fixed or reintroduced. Resampling at the category level gives a wider, more honest interval when that dependence is plausible.*
