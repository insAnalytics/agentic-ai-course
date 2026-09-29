# Module 6, Lesson 1 — Bookends: Why agents fail, and what "reliable" means

---

## Intro

> **You'll be able to**
> - Work out how a per-step success rate compounds over a multi-step task, and say where that model breaks down
> - Measure reliability as pass^k from repeated runs, per question, across runs and across wordings, with an interval that treats each question's runs as one piece of evidence
> - Classify a failed run by its first wrong step, and say where in the course that kind of failure is handled

**Why it matters**
Modules 2–5 built an agent that loops, calls tools, manages its context
and retrieves. Working once isn't the same as working every time, and an
agent serves every user with a fresh run. This module is about the gap
between the two: doing the same task correctly run after run, making claims
that hold up against their sources, and not taking actions that can't be
undone. This lesson sets up the yardstick the rest of the module measures
itself with.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** A task has 30 steps, each independently right 98% of the time.
> About how often does the whole task succeed?
> - A) About 98%, since each step is that reliable
> - B) About 55%, since 0.98³⁰ ≈ 0.55 ✅
> - C) About 40%, since 30 × 2% is 60% failure
> - D) About 2%, since one failed step in 30 is enough to fail
>
> *Explanation: every step has to go right, so the probabilities multiply.
> Adding the failure rates is only close when they're tiny, and it breaks
> down entirely for longer tasks.*

> **Q2.** A question was run 10 times and answered correctly 7 times. What
> is its estimated pass^5?
> - A) 0.7⁵ ≈ 0.168
> - B) C(7,5)/C(10,5) = 21/252 ≈ 0.083 ✅
> - C) 0.7, since pass^k starts at the success rate
> - D) 1 − C(3,5)/C(10,5) = 1
>
> *Explanation: the estimator counts the picks of 5 runs, out of the 10
> observed, that are all successes. Raising the observed rate to the fifth
> power treats an estimate from 10 runs as the true rate and overstates
> pass^k. The last option is pass@5, the chance that at least one of five
> succeeds.*

> **Q3.** Twenty runs of each of 84 questions gave 1,680 runs. Why did
> resampling whole questions give a wider interval than treating the runs as
> independent?
> - A) Because resampling always adds random noise to the estimate
> - B) Because runs of the same question share its difficulty, so the real evidence is closer to 84 questions than 1,680 runs ✅
> - C) Because 1,680 runs is too many for a bootstrap
> - D) Because the model's temperature changes between runs
>
> *Explanation: runs are clustered by question. Miller (2024) found that
> ignoring that clustering can make results look up to three times more
> certain than they are; in this lesson's runs the question-level intervals
> were about two to three times wider.*

> **Q4.** An agent refunds the wrong amount at step 11. At step 2 it picked
> the wrong customer record. Where do you start fixing?
> - A) Step 11, since that's where the harm happened
> - B) Step 2, since later steps built on it ✅
> - C) Both at once, as separate failures
> - D) Neither: add a retry around the refund tool
>
> *Explanation: error propagation, an early mistake cascading into the
> steps that build on it, is the main bottleneck Zhu et al. identified.
> Fixing the refund leaves the agent refunding the wrong customer.*

> **Q5.** Two agents both succeed on 70% of runs. Agent X solves some tasks
> every time and never solves the rest; agent Y solves every task about 7
> times in 10. Which has the higher pass^10?
> - A) Y, because its successes are spread across every task
> - B) They're equal, because pass^k depends only on the success rate
> - C) X, because the tasks it solves keep being solved, while every one of Y's tasks will fail somewhere in ten runs ✅
> - D) Neither: pass^10 is 0.7¹⁰ for both
>
> *Explanation: pass^k is computed per task. X keeps its 70% at any k; Y's
> pass^10 is close to zero. The same success rate can hide opposite kinds of
> reliability.*

> **Q6.** Four wordings of a question score 100%, 80%, 65% and 20%. Before
> counting the 20% against the model, what should you check?
> - A) Whether the model does better at a lower temperature
> - B) Whether that wording asks the same thing given the context, can't be read two ways, and has its correct answers accepted by the grader ✅
> - C) Whether the average over the four wordings is above 50%
> - D) Nothing: any failing wording counts against the model
>
> *Explanation: a wording that relies on something missing from the
> context, or that has two fair readings, measures the test, not the model.
> This lesson's own data had a wording that went from 1 in 10 to 10 in 10
> once it was fixed.*

> **Q7.** Why doesn't setting temperature to 0 make an agent reliable?
> - A) Because temperature 0 makes the model slower
> - B) Because greedy decoding can be consistently wrong, isn't fully deterministic on real servers, and real users vary their inputs anyway ✅
> - C) Because open models don't support temperature 0
> - D) Because pass^k can't be computed at temperature 0
>
> *Explanation: greedy decoding hides the model's uncertainty rather than
> removing it. Thinking Machines measured 80 different outputs from 1,000
> temperature-0 runs of one prompt, and τ-bench's temperature-0 agent was
> still inconsistent because its simulated users varied.*

> **Q8.** METR found an agent's 80% time horizon to be about a quarter of
> its 50% horizon. What does the constant-failure-rate model predict?
> - A) About 80% of the 50% horizon, since the percentages scale linearly
> - B) About a third, since 0.8³ ≈ 0.5 ✅
> - C) About twice as long, since higher reliability needs longer tasks
> - D) Nothing: the model only applies to single steps
>
> *Explanation: with a constant chance of failing per unit of work, success
> falls exponentially with length, so the 80% horizon is ln 0.8 / ln 0.5 ≈
> 0.32 of the 50% one. METR's measurement of about a quarter was close, and
> within its noise.*

---

## Comprehensive sandbox
*(graded — a reliability report from a log of runs, multi-file)*

**Task shown to learner:** `lib.py` holds this lesson's code: `load_run`,
`task_pass_hat_k`, `pass_hat_k` and `question_bootstrap`. It's read-only.
In `report.py` (the entry file), write `reliability_report(log, k)`. `log`
is a list of runs, each `{"question": id, "wording": int, "correct": bool}`;
a question can have several wordings, and each wording can have a
different number of runs. Return a dict:

- `"questions"`: the number of distinct questions.
- `"accuracy"`: each question's success rate over all its runs (every
  wording together), averaged over questions so each question counts once.
- `"pass_hat_k"`: for each question, the product of `task_pass_hat_k` over
  its wordings (every wording must succeed *k* times), averaged over
  questions.
- `"unreliable"`: the sorted ids of questions whose value in
  `"pass_hat_k"`'s calculation is below 0.5.
- `"interval"`: `question_bootstrap` called on the per-question success
  rates, one per question, in order of question id.

Raise `ValueError` if `k` is less than 1, if the log is empty, or if any
wording of any question has fewer than `k` runs. When you click Run, the
code at the bottom builds a log from the lesson's real runs and prints a
report for both models.

**Tab: `lib.py`** (read-only)
```python
"""Code from this lesson's concepts. Read-only."""

import json
import random
from math import comb
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "wordings.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def task_pass_hat_k(outcomes: list[bool], k: int) -> float:
    """For one task's runs: the chance that k of them, picked without replacement, all succeeded."""
    return comb(sum(outcomes), k) / comb(len(outcomes), k)


def pass_hat_k(results: dict[str, list[bool]], k: int) -> float:
    """pass^k over a set of tasks: each task's estimate, averaged so every task counts once."""
    if k < 1:
        raise ValueError("k must be at least 1")
    if not results:
        raise ValueError("no tasks")
    estimates = []
    for task, runs in results.items():
        if len(runs) < k:
            raise ValueError(f"{task} has {len(runs)} runs, fewer than k={k}")
        estimates.append(task_pass_hat_k(runs, k))
    return sum(estimates) / len(estimates)


def question_bootstrap(rates: list[float], repeats: int = 2000, seed: int = 0) -> tuple[float, float]:
    """A 95% interval for the average, resampling whole questions: each question's runs stay together."""
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(rates, k=len(rates))) / len(rates) for _ in range(repeats))
    return means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]
```

**Tab: `report.py`** (starter, entry file)
```python
from collections import defaultdict
from math import prod

from lib import load_run, question_bootstrap, task_pass_hat_k


def reliability_report(log: list[dict], k: int) -> dict:
    """Reliability of a set of questions from a log of runs, each {"question", "wording", "correct"}."""
    ...


def log_from_runs(*names: str) -> list[dict]:
    """Turn committed run files into a flat log, one entry per run."""
    return [
        {"question": r["id"], "wording": r["wording"], "correct": reply["correct"]}
        for name in names
        for r in load_run(name)["results"]
        for reply in r["samples"]
    ]


if __name__ == "__main__":
    for label, suffix in (("Qwen3.5-4B", ""), ("Qwen3.5-2B", ".smaller")):
        report = reliability_report(log_from_runs(f"plain{suffix}", f"wordings{suffix}"), k=5)
        low, high = report["interval"]
        print(f"{label}: {report['questions']} questions, accuracy {report['accuracy']:.1%} "
              f"(95% interval {low:.1%} to {high:.1%})")
        print(f"  pass^5 across wordings {report['pass_hat_k']:.3f}, "
              f"{len(report['unreliable'])} unreliable: {', '.join(report['unreliable'])}")
```

**Hidden tests:**
```python
import math

from lib import question_bootstrap
from report import reliability_report

T, F = True, False


def runs(question, wording, outcomes):
    return [{"question": question, "wording": wording, "correct": o} for o in outcomes]


def close(a, b):
    return math.isclose(a, b, abs_tol=1e-9)


def raises(fn, *args):
    try:
        fn(*args)
    except ValueError:
        return True
    except Exception:
        return False
    return False


log = (runs("b", 0, [T, T, T, T]) + runs("b", 1, [T, F])
       + runs("a", 0, [T, F, T, F, T, F]) + runs("a", 1, [T, T])
       + runs("c", 0, [T, T, F]) + runs("c", 1, [T, T, F])
       + runs("d", 0, [T, T, T, F]))
report = reliability_report(log, 2)
assert isinstance(report, dict), "reliability_report should return a dict with the five keys listed in the task"

assert report["questions"] == 4, f"expected 4 questions, got {report['questions']}"

rates = {"a": 5 / 8, "b": 5 / 6, "c": 4 / 6, "d": 3 / 4}
got = report["accuracy"]
assert close(got, sum(rates.values()) / 4), (
    f"accuracy {got:.4f}: take each question's success rate over all its runs, then average over "
    f"questions so each counts once; expected {sum(rates.values()) / 4:.4f}")

expected = (0.2 + 0.0 + (1 / 3) * (1 / 3) + 0.5) / 4
got = report["pass_hat_k"]
assert close(got, expected), (
    f"pass_hat_k {got:.4f}: for each question, multiply the pass^k of each of its wordings (every "
    f"wording must succeed k times), then average over questions; expected {expected:.4f}")

assert report["unreliable"] == ["a", "b", "c"], (
    f"unreliable {report['unreliable']}: list, sorted, the questions whose pass^k across wordings is "
    "below 0.5; d is exactly 0.5, which isn't below")

assert tuple(report["interval"]) == question_bootstrap([rates[q] for q in sorted(rates)]), (
    "interval: call question_bootstrap on the per-question success rates, one per question, "
    "in order of question id")

assert raises(reliability_report, log, 3), (
    "b's second wording has only 2 runs, so pass^3 can't be estimated for it: raise ValueError "
    "(check every wording, not a question's total runs)")
assert raises(reliability_report, [], 1), "an empty log: raise ValueError"
assert raises(reliability_report, log, 0), "k must be at least 1: raise ValueError"
```

**Hint (shown on request):** Group the log first, question → wording →
list of outcomes; a `defaultdict(lambda: defaultdict(list))` does it in one
pass. Then, for each question: check every wording has at least `k` runs,
compute its success rate from all its runs together, and multiply
`task_pass_hat_k(outcomes, k)` over its wordings. Keep both per-question
values in dicts keyed by question id, so the averages count each question
once and `sorted(...)` gives you the order `question_bootstrap` needs.

**Reference solution:**

**Tab: `report.py`**
```python
from collections import defaultdict
from math import prod

from lib import load_run, question_bootstrap, task_pass_hat_k


def reliability_report(log: list[dict], k: int) -> dict:
    """Reliability of a set of questions from a log of runs, each {"question", "wording", "correct"}."""
    if k < 1:
        raise ValueError("k must be at least 1")
    if not log:
        raise ValueError("the log is empty")
    runs = defaultdict(lambda: defaultdict(list))
    for entry in log:
        runs[entry["question"]][entry["wording"]].append(entry["correct"])

    rates, across = {}, {}
    for question, wordings in runs.items():
        for wording, outcomes in wordings.items():
            if len(outcomes) < k:
                raise ValueError(f"{question}, wording {wording}: {len(outcomes)} runs, fewer than k={k}")
        every_run = [outcome for outcomes in wordings.values() for outcome in outcomes]
        rates[question] = sum(every_run) / len(every_run)
        across[question] = prod(task_pass_hat_k(outcomes, k) for outcomes in wordings.values())

    return {
        "questions": len(runs),
        "accuracy": sum(rates.values()) / len(rates),
        "pass_hat_k": sum(across.values()) / len(across),
        "unreliable": sorted(q for q, value in across.items() if value < 0.5),
        "interval": question_bootstrap([rates[q] for q in sorted(rates)]),
    }


def log_from_runs(*names: str) -> list[dict]:
    """Turn committed run files into a flat log, one entry per run."""
    return [
        {"question": r["id"], "wording": r["wording"], "correct": reply["correct"]}
        for name in names
        for r in load_run(name)["results"]
        for reply in r["samples"]
    ]


if __name__ == "__main__":
    for label, suffix in (("Qwen3.5-4B", ""), ("Qwen3.5-2B", ".smaller")):
        report = reliability_report(log_from_runs(f"plain{suffix}", f"wordings{suffix}"), k=5)
        low, high = report["interval"]
        print(f"{label}: {report['questions']} questions, accuracy {report['accuracy']:.1%} "
              f"(95% interval {low:.1%} to {high:.1%})")
        print(f"  pass^5 across wordings {report['pass_hat_k']:.3f}, "
              f"{len(report['unreliable'])} unreliable: {', '.join(report['unreliable'])}")
```
```
Qwen3.5-4B: 84 questions, accuracy 98.6% (95% interval 97.4% to 99.5%)
  pass^5 across wordings 0.904, 7 unreliable: e15, e24, e31, e41, e68, e69, e78
Qwen3.5-2B: 84 questions, accuracy 92.0% (95% interval 88.8% to 94.7%)
  pass^5 across wordings 0.564, 37 unreliable: e05, e06, e15, e18, e20, e21, e22, e24, e25, e26, e27, e29, e31, e32, e37, e39, e41, e49, e51, e52, e54, e58, e60, e63, e64, e65, e66, e68, e69, e70, e71, e73, e75, e76, e77, e78, e83
```
*(the Run output, from the lesson's real runs on both models)*

**Explanation:** Everything in the report is per question first, then
averaged, because runs of the same question aren't independent. Accuracy
takes each question's rate over all its runs, so a question run 30 times
counts the same as one run 10 times; pooling every run in the log would
weight questions by how often they happened to be run. pass^k across
wordings multiplies each wording's estimate, since the question only counts
as reliable if every way of asking it succeeds *k* times; using only the
original wording, pooling the wordings' runs together, or taking the worst
wording each give a different number. The run-count check has to be per
wording: a question can have plenty of runs in total and still have a
wording too short to estimate. The interval resamples questions, not runs,
and passes the rates in a fixed order, because the bootstrap's result
depends on the order of its input. On the real runs, accuracy here (98.6%
for the 4B) is slightly lower than the 98.9% in the concept on repeated
runs, because it includes every wording, not just the original.
