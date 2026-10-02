# Module 7, Lesson 12 — Concept 2: Headline numbers, with honest uncertainty

> **Note for the site build:** no new data. Every block here starts from `LOAD_SETTINGS` + `LOAD_ABLATIONS`, as concept 1's demo did; the second demo also needs Lesson 9's `SUITE_PASS_HAT_K` and the exercise's reference `headline`, loaded hidden. Add the reference as `HEADLINE`, without its example printout, for later pages. The exercise's hidden tests use the real results too, so mount `ABLATIONS_DATA` and `SETTINGS_DATA` for it.

---

## A rate is only half a number

The first line most readers look for is the pass rate, and a pass rate on its own invites a wrong reading. "73.6%" says nothing about whether another run of the same suite might say 70% or 78%, or whether a change that moves it by three points has done anything. A report gives every rate with its uncertainty.

[Evan Miller's "Adding Error Bars to Evals"](https://arxiv.org/abs/2411.00640), written at Anthropic and summarised in [Anthropic's own post](https://www.anthropic.com/research/statistical-approach-to-model-evals), sets out how. It treats an eval's questions as a sample from a larger population of questions that could have been asked, and recommends two things this report needs:

- **Report a standard error with every score,** from the central limit theorem: the spread of the per-question scores divided by the square root of the number of questions.
- **Cluster the standard error when questions come in related groups.** Treating related items as independent understates the uncertainty. Anthropic reports that on popular evals, clustered standard errors can be more than three times the naive ones.

An agent's suite is clustered by construction. Each task ran five times, and five trials of one task are not five independent questions.

---

## Why trials aren't independent

Here's the naive calculation on the baseline's development tasks, and then what the trials actually look like task by task:

```python
from collections import Counter
from math import sqrt

dev = {task: runs for task, runs in passes("baseline").items() if results["tasks"][task]["split"] == "dev"}
trials = [result for runs in dev.values() for result in runs]
rate = sum(trials) / len(trials)
naive = sqrt(rate * (1 - rate) / len(trials))
print(f"baseline, dev tasks: {sum(trials)} of {len(trials)} trials pass ({rate:.1%})")
print(f"treating the {len(trials)} trials as independent: ±{1.96 * naive:.1%}")

task_rates = Counter(sum(runs) for runs in dev.values())
print(f"\nhow many of each task's 5 trials pass, across {len(dev)} tasks:")
for passed in range(6):
    print(f"  {passed} of 5: {task_rates[passed]:>2} tasks  {'#' * task_rates[passed]}")
```
```
baseline, dev tasks: 357 of 485 trials pass (73.6%)
treating the 485 trials as independent: ±3.9%

how many of each task's 5 trials pass, across 97 tasks:
  0 of 5: 16 tasks  ################
  1 of 5:  4 tasks  ####
  2 of 5:  5 tasks  #####
  3 of 5:  4 tasks  ####
  4 of 5:  9 tasks  #########
  5 of 5: 59 tasks  ###########################################################
```
*(runs live, shows output — read-only demo snippet, not graded; `results` and `passes` are Lesson 9's, loaded for you)*

Seventy-five of the 97 tasks are all or nothing: 59 pass every trial and 16 fail every one. A task's trials agree with each other far more than trials from different tasks do. So the 485 trials carry much less information than 485 independent questions would; the information is closer to 97 questions, one per task, each answered a little noisily. The naive interval, ±3.9 points, is computed as if the trials were independent, and it's too narrow.

The fix is the one [Lesson 9 used when it resampled tasks rather than trials](→ Module 7, the does this piece help? ablations lesson, the one piece on and off concept, why pairing matters), written as a formula: average each task's trials first, then compute the standard error over the task averages. That's the clustered standard error, for tasks with the same number of trials each.

---

## Applied sandbox exercise
*(graded — a pass rate with its standard error clustered by task)*

**Task shown to learner:**

Write `headline(per_task, z=1.96, min_tasks=10)`. `per_task` maps task ids to lists of trial results. Return a dict with:

- `"tasks"` and `"trials"`: how many of each.
- `"rate"`: the mean over tasks of each task's pass rate.
- `"se"`: the clustered standard error: the sample standard deviation of the task pass rates (dividing by tasks − 1) over the square root of the number of tasks. `None` if there's only one task.
- `"interval"`: `(rate - z * se, rate + z * se)`, kept between 0 and 1. `None` if there are fewer than `min_tasks` tasks: with a handful of tasks, the normal approximation behind the interval doesn't hold, and the report gives counts instead.
- `"naive_se"`: the standard error if every trial were independent, `sqrt(p * (1 - p) / trials)`, where `p` is the share of all trials that passed.

`sqrt` is loaded.

**Starter code:**
```python
def headline(per_task: dict[str, list[bool]], z: float = 1.96, min_tasks: int = 10) -> dict:
    """..."""
    # your code here


dev = {task: runs for task, runs in passes("baseline").items() if results["tasks"][task]["split"] == "dev"}
print(headline(dev))
```

**Hidden tests:**
```python
from math import isclose, sqrt

T, F = True, False
split = {f"pass{n}": [T] * 5 for n in range(6)} | {f"fail{n}": [F] * 5 for n in range(4)}
try:
    h = headline(split)
except (ZeroDivisionError, TypeError) as error:
    raise AssertionError(f"headline crashed on ten tasks: {error!r}")
assert isinstance(h, dict), f"headline should return a dict: got {h!r}"
assert h["tasks"] == 10 and h["trials"] == 50, f"10 tasks and 50 trials: got {h['tasks']} and {h['trials']}"
assert isclose(h["rate"], 0.6), f"6 of 10 tasks pass every trial: rate 0.6, got {h['rate']}"
expected_se = sqrt((6 * 0.4 ** 2 + 4 * 0.6 ** 2) / 9) / sqrt(10)
assert isclose(h["se"], expected_se), \
    f"the clustered standard error is the sample standard deviation of the task rates (n - 1) over sqrt(tasks): {expected_se:.4f}, got {h['se']}"
assert isclose(h["naive_se"], sqrt(0.6 * 0.4 / 50)), f"the naive standard error treats all 50 trials as independent: got {h['naive_se']}"
low, high = h["interval"]
assert isclose(low, 0.6 - 1.96 * expected_se) and isclose(high, 0.6 + 1.96 * expected_se), f"rate ± 1.96 × se: got {h['interval']}"

uneven = {"long": [T] * 10, "short": [F, F]} | {f"t{n}": [T, F] for n in range(8)}
h = headline(uneven)
assert isclose(h["rate"], (1 + 0 + 8 * 0.5) / 10), \
    f"the rate is the mean of each task's pass rate, so a task with more trials doesn't count for more: expected 0.5, got {h['rate']}"

mostly = {f"pass{n}": [T] * 5 for n in range(9)} | {"fail": [F] * 5}
low, high = headline(mostly)["interval"]
assert high == 1.0 and low > 0.7, f"the interval is kept between 0 and 1: 0.9 ± 0.196 has its top at 1.0, got {(low, high)}"
assert isclose(headline(split, z=2.576)["interval"][0], 0.6 - 2.576 * expected_se), "z is a parameter"

few = {f"t{n}": [T, F, T] for n in range(9)}
assert headline(few)["interval"] is None, "with fewer than 10 tasks there's no interval: too few for the normal approximation"
assert headline(few, min_tasks=5)["interval"] is not None, "min_tasks is a parameter"
try:
    single = headline({"only": [T, F, T, T]})
except (ZeroDivisionError, TypeError):
    raise AssertionError("one task has no spread to measure: its se and interval are None, not a crash")
assert single["se"] is None and single["interval"] is None and isclose(single["rate"], 0.75), f"one task: got {single}"

dev = {task: runs for task, runs in passes("baseline").items() if results["tasks"][task]["split"] == "dev"}
h = headline(dev)
assert h["tasks"] == 97 and isclose(h["rate"], 357 / 485) and isclose(h["se"], 0.039601363238946294), f"the baseline's dev tasks: got {h}"
```

**Hint (shown on request):** Work from the list of task rates: their mean is the rate, and their spread gives the standard error. Use `tasks - 1` in the variance. Check `min_tasks` before building the interval, and clip it with `max(0.0, ...)` and `min(1.0, ...)`.

**Reference solution:**
```python
from math import sqrt


def headline(per_task: dict[str, list[bool]], z: float = 1.96, min_tasks: int = 10) -> dict:
    """A pass rate the way a report should give it: the mean over tasks of each task's pass rate, its standard error
    clustered by task, and the interval that gives, kept between 0 and 1. With fewer than min_tasks tasks the
    interval is None: too few tasks for the normal approximation. The naive standard error, treating every trial
    as independent, comes alongside for comparison."""
    rates = [sum(results) / len(results) for results in per_task.values()]
    tasks, trials = len(rates), sum(map(len, per_task.values()))
    rate = sum(rates) / tasks
    se = sqrt(sum((r - rate) ** 2 for r in rates) / (tasks - 1) / tasks) if tasks > 1 else None
    interval = None
    if tasks >= min_tasks:
        interval = (max(0.0, rate - z * se), min(1.0, rate + z * se))
    pooled = sum(map(sum, per_task.values())) / trials
    return {"tasks": tasks, "trials": trials, "rate": rate, "se": se, "interval": interval,
            "naive_se": sqrt(pooled * (1 - pooled) / trials)}


dev = {task: runs for task, runs in passes("baseline").items() if results["tasks"][task]["split"] == "dev"}
print(headline(dev))
```
```
{'tasks': 97, 'trials': 485, 'rate': 0.7360824742268042, 'se': 0.039601363238946294, 'interval': (0.6584638022784695, 0.8137011461751389), 'naive_se': 0.020013658499173685}
```

**Explanation:** On the baseline's dev tasks the clustered standard error, about 4.0 points, is twice the naive one, 2.0, because most tasks pass or fail all five of their trials. The rate averages the tasks rather than pooling trials, so a task that ran more times doesn't count for more; here every task ran five times and the two agree. The interval is clipped to the range a rate can take, and withheld below ten tasks, where a single unusual task moves everything and the normal approximation is no longer a fair summary. One task has no spread at all, so it has no standard error.

---

## The report's headline table

Here is the baseline's dev result as the report gives it: overall, then by group, each with its counts and either an interval or the reason there isn't one, and pass^k beside it:

```python
dev = {task: runs for task, runs in passes("baseline").items() if results["tasks"][task]["split"] == "dev"}
groups = {"all dev tasks": dev}
for group in ("question", "other", "lost write", "planted", "broken result"):
    groups[group] = {task: runs for task, runs in dev.items() if results["tasks"][task]["group"] == group}

print(f"{'baseline, dev':<16}{'tasks':>6}{'trials':>8}{'pass rate':>11}   {'95% interval, clustered by task':<32}{'naive':>7}")
for name, per_task in groups.items():
    h = headline(per_task)
    shown = f"{h['interval'][0]:.1%} to {h['interval'][1]:.1%}" if h["interval"] else "too few tasks: counts only"
    naive = f"±{1.96 * h['naive_se']:.1%}"
    print(f"{name:<16}{h['tasks']:>6}{h['trials']:>8}{h['rate']:>11.1%}   {shown:<32}{naive:>7}")

mean, low, high = suite_pass_hat_k(dev, 1)
print(f"\nresampling tasks, as Lesson 9 did: {mean:.1%} ({low:.1%} to {high:.1%})")
mean, low, high = suite_pass_hat_k(dev, 5)
print(f"pass^5, all dev tasks: {mean:.1%} ({low:.1%} to {high:.1%}) of tasks pass all five of their trials")
```
```
baseline, dev    tasks  trials  pass rate   95% interval, clustered by task   naive
all dev tasks       97     485      73.6%   65.8% to 81.4%                    ±3.9%
question            47     235      80.9%   71.9% to 89.8%                    ±5.0%
other               37     185      83.8%   73.0% to 94.6%                    ±5.3%
lost write           6      30      13.3%   too few tasks: counts only       ±12.2%
planted              5      25       0.0%   too few tasks: counts only        ±0.0%
broken result        2      10      80.0%   too few tasks: counts only       ±24.8%

resampling tasks, as Lesson 9 did: 73.6% (65.8% to 81.6%)
pass^5, all dev tasks: 60.8% (51.5% to 71.1%) of tasks pass all five of their trials
```
*(runs live, shows output — read-only demo snippet, not graded; a trial passes if it reached an answer, passed its code checks, and passed every revised Gemma judge that graded it; `suite_pass_hat_k` is Lesson 9's)*

Reading it the way the report's readers should:

- **73.6% of dev trials pass, and the honest range is about 66% to 81%.** The clustered interval is twice as wide as the naive one. Lesson 9's resampling of tasks gives almost the same range, 65.8% to 81.6%, as it should: both treat the task, not the trial, as the unit.
- **Pass^5 is lower: 60.8% of tasks pass all five of their trials.** For [a user who expects the same request to work every time](→ Module 7, the does this piece help? ablations lesson, the suite-wide reliability, and items that aren't independent concept, pass^k, for a whole suite), that's the number that matters, and the report gives both.
- **The small groups get counts, not intervals.** Four of 30 lost-write trials pass, across 6 tasks; none of 25 planted-instruction trials, across 5. With so few tasks, an interval would be either impossible (the planted group's spread is zero) or misleadingly precise. The naive column shows what the report would claim without clustering: ±0.0% on the planted group, a certainty no five tasks can give.
- **The planted group's 0% needs its own caveat.** Those passes and failures come from a judge, and how far that judge can be trusted is a later concept's subject.

---

## Quiz cards

> **Q1.** The baseline passes 357 of 485 dev trials. Why is ±3.9 points the wrong interval to report?
> - It treats one task's trials as independent; they mostly agree ✅
> - It uses a 95% level, where reports should use 99% instead
> - It counts held-out trials along with the dev ones in the total
> - It ignores the trials that ended without an answer at all
>
> *Explanation: Seventy-five of the 97 tasks pass all five trials or fail all five, so the trials carry far less information than 485 independent questions. Averaging each task first and computing the spread over tasks gives the clustered interval, about ±7.8 points.*

> **Q2.** Why is the rate the mean of each task's pass rate rather than the share of all trials that passed?
> - So a task that ran more times doesn't count for more ✅
> - Because the share of trials is always the larger of the two
> - Because tasks with no failures would otherwise be left out
> - So the standard error comes out smaller in the report
>
> *Explanation: Tasks are what the suite samples; trials are repeat measurements of each one. Averaging task rates gives each task equal weight, whatever its number of trials. With five trials per task, as here, the two numbers agree.*

> **Q3.** Five planted-instruction tasks fail all 25 trials. What should the report give for this group?
> - The counts, with no interval, as five tasks are too few ✅
> - An interval of 0% to 0%, since there's no spread at all
> - A naive interval of ±0.0%, computed from the 25 trials
> - Nothing, since a group this small belongs out of the report
>
> *Explanation: Zero spread across five tasks isn't certainty; it's too little evidence for the normal approximation to say anything. Counts let a reader see exactly what the result rests on. Leaving the group out would hide a failure the agent has.*

> **Q4.** Pass@1 is 73.6% but pass^5 is 60.8%. What does the gap tell a reader?
> - Some tasks pass only sometimes, so users would see failures ✅
> - The pass^5 figure is less reliable, so the report should drop it
> - Five trials per task are too few to measure the pass rate itself
> - The agent gets worse with each trial it runs on the same task
>
> *Explanation: Pass^5 counts only tasks that passed every trial. The 22 tasks between all-pass and all-fail pull pass@1 up but not pass^5. For an agent people rely on, both belong in the report.*

> **Q5.** Anthropic reports clustered standard errors over three times the naive ones on popular evals. Here the ratio is about two. Why does it vary?
> - It depends on how alike the items in each cluster are ✅
> - It depends on which model was used to run the eval
> - It depends on whether a 95% or 99% level is used
> - It depends on how long each item takes the model to answer
>
> *Explanation: The more items within a cluster agree with each other, the less independent information they carry, and the more the clustered error exceeds the naive one. The confidence level scales both errors equally, so it doesn't change their ratio.*
