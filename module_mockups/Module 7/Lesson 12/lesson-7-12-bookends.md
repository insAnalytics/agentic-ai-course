# Putting It Together: An Evaluation Report

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only: the recorded results, `passes`, `rate_line`, Lesson 9's `paired_difference` and concept 2's `headline`) and `report.py` (the entry file). It reads `/data/eval/ablations/results.json` for Run and the hidden tests, and the hidden tests import from both files. Run takes well under a second.

> **You'll be able to**
> - Lay out an agent's evaluation report: what was evaluated, on what, with which graders and how well they were measured, the results, the decisions, the limits and what's next, with every statement marked as measured, read, or not measured
> - Give each pass rate with its counts and an interval clustered by task, keep dev and held-out results apart, and disclose every contact the held-out set has had
> - Trace each result to the graders that decided it, and recheck each decision on the right tasks before it's written down

**Why it matters**
Eleven lessons of measurement only matter if someone else can act on them. Writing the registry agent's report showed how much a number needs around it before it can be trusted: the planted-instruction group's 0% can't be told apart from a judge that fails everything, more than half of the headline rests on judges measured on a few dozen labels, and compaction's "look" turned out to rest on held-out tasks that should never have been in the comparison. A report that says so is worth more than one that doesn't.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** A report says "the baseline passes 73.6% of dev trials". What does it still need before a reader can use it?
> - Counts, an interval, and its graders ✅
> - A comparison with a public benchmark score
> - The same number computed on all 125 tasks
> - The pass rate of the latest change beside it
>
> *Explanation: A rate alone hides how many tasks it rests on, how much it could move on a rerun, and how far its graders can be trusted. Mixing in held-out tasks or other agents' scores answers different questions.*

> **Q2.** Why does the report compute the standard error over each task's pass rate rather than over all the trials?
> - A task's trials mostly agree, so aren't independent ✅
> - Trials vary in length, so they can't be compared fairly
> - Task-level errors are always smaller than trial-level ones
> - The trials of held-out tasks would otherwise be counted twice
>
> *Explanation: Seventy-five of the 97 dev tasks pass or fail all five trials. Treating the 485 trials as independent gives an interval half the honest width. Averaging each task first, as Miller recommends for clustered questions, counts the evidence correctly.*

> **Q3.** The held-out tasks score higher than the dev tasks. What does that rule out?
> - That tuning to dev tasks cost the agent on new ones ✅
> - That the held-out tasks are easier than the dev tasks
> - That the gap between the two scores is due to chance
> - That the held-out set was seen before the report
>
> *Explanation: Overfitting to the dev tasks would show as a lower held-out score. A higher one can still mean easier tasks or chance, and the held-out set was in fact seen in aggregate, which the report discloses.*

> **Q4.** Compaction's cost was 3.8 points over all tasks and 1.2 over dev tasks only. Why does the report give the dev number as the basis for the decision?
> - Its flagged tasks were held-out, which decisions shouldn't use ✅
> - The dev number is smaller, so it's more conservative to report
> - The all-task number was computed with a different judge
> - Dev tasks have more trials each, so their number is more precise
>
> *Explanation: All three tasks the gate flagged under compaction were held-out. Decisions belong on dev tasks, so held-out results stay independent; recomputed that way, compaction shows no clear cost. Both numbers stay in the report, with the explanation.*

> **Q5.** Which statement belongs in the report as "read" rather than "measured"?
> - "Grounding's sampled objections were false alarms" ✅
> - "The correctness judge passed 11 of 12 good test answers"
> - "Prompt v2 scores 4.9 points higher on the dev tasks"
> - "Four of 30 dev lost-write trials pass their graders"
>
> *Explanation: A reading is what a person saw in a sample of runs; it's evidence, stated with its sample and its reader. The other three are counts from graders or labels, which the report gives with their counts and intervals.*

> **Q6.** The planted-instruction judge failed all 30 baseline runs it graded. Why can't the report correct the planted group's rate?
> - Its TPR is unknown: no passed run was ever shown to it ✅
> - Thirty runs are too few for the correction to be applied at all
> - The correction only works for judges with high agreement rates
> - The planted group has no interval, so it can't be corrected
>
> *Explanation: The correction needs both error rates, and the TPR needs runs people passed. Without one, a 0% can't be told apart from a judge that fails everything. The report states the gap rather than a corrected number.*

> **Q7.** Once the report is written, why can't the held-out set be used again as held out?
> - Every later decision would be made knowing its results ✅
> - Its tasks would be graded by judges that have now changed
> - The agent will have been trained on its tasks by then
> - Its runs will have been deleted once they're reported
>
> *Explanation: A held-out set is independent only while nobody deciding anything has seen its results. After the report, it joins the dev set, and a fresh set is held out for the next round.*

> **Q8.** Which next step does the report put first?
> - More labels where the headline rests on the fewest ✅
> - A new version of the layered checks, built and measured
> - Monitoring the agent once it has real users
> - A larger suite with more tasks in every category
>
> *Explanation: More than half of the headline rests on judges whose error rates rest on few labels, and two judges have never seen a labelled pass. Labels there change how far the most numbers can be trusted; the other steps all depend on graders that can be.*

---

## Comprehensive sandbox

*(graded — the numbers of an evaluation report, from recorded results)*

**Task shown to learner:**

`lib.py` holds the recorded results and the functions the report needs, read-only. In `report.py` (the entry file), write `evaluation_report(results, baseline, changes)`. `results` has the shape of Lesson 9's results file: `results["tasks"]` gives each task's `"split"` (`"dev"` or `"held_out"`) and `"group"`, and `passes(results, condition)` gives each task's trial results. Return a dict with:

- **`"splits"`:** for `"dev"` and `"held_out"`, `headline()` over the baseline's tasks in that split only.
- **`"groups"`:** for each split, a dict of `headline()` per group, over that split's tasks in that group.
- **`"changes"`:** for each condition in `changes`, `paired_difference(baseline, change)` over the **dev** tasks that both conditions ran.
- **`"lines"`:** the report's lines, in this order:
  - `rate_line(name, ...)` for dev, then held-out, where the names come from `SPLIT_NAMES` (`"dev"`, `"held-out"`)
  - then one `rate_line` per group, labelled like `"dev, question"`: all of dev's groups, then all of held-out's, each split's groups in sorted order
  - then one line per change, in the order given: `f"{change} minus {baseline}, dev tasks: {mean:+.1%} ({low:+.1%} to {high:+.1%})"`

Click Run to see the registry agent's report.

**Tab: `lib.py`** (read-only)
```python
"""The recorded results, and the module's functions the report uses. Read-only."""

import json
import random
from math import sqrt
from pathlib import Path

results = json.loads(Path("/data/eval/ablations/results.json").read_text(encoding="utf-8"))


SPLIT_NAMES = {"dev": "dev", "held_out": "held-out"}


def rate_line(label: str, h: dict) -> str:
    """One line of the report for a pass rate from headline(): the rate, its counts, and its interval or why there isn't one."""
    shown = f"{h['interval'][0]:.1%} to {h['interval'][1]:.1%}" if h["interval"] else "too few tasks for an interval"
    tasks = f"{h['tasks']} task" + ("s" if h["tasks"] != 1 else "")
    return f"{label}: {h['rate']:.1%} over {tasks}, {h['trials']} trials ({shown})"


def passes(results: dict, condition: str) -> dict[str, list[bool]]:
    """Each task's trial results under one condition."""
    return {task: [row["pass"] for row in rows] for task, rows in results["conditions"][condition].items()}


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
```

**Tab: `report.py`** (starter, entry file)
```python
from lib import SPLIT_NAMES, headline, paired_difference, passes, rate_line, results


def evaluation_report(results: dict, baseline: str, changes: list[str]) -> dict:
    """The numbers of an evaluation report for one agent: its pass rate on each split and each group within a split,
    never combining dev and held-out tasks, and each change compared with it on dev tasks only; plus the report's
    lines, one per number, each with its counts and interval."""
    # your code here


if __name__ == "__main__":
    report = evaluation_report(results, "baseline", ["prompt-v2", "fp8", "compaction", "layers-v2", "layers", "no-labels"])
    if report is None:
        print("no report yet")
    else:
        print("\n".join(report["lines"]))
```
```
no report yet
```
*(the starter's output on Run)*

**Hidden tests:**
```python
from lib import headline, paired_difference, rate_line, results
from report import evaluation_report

T, F = True, False


def rows(*outcomes: bool) -> list[dict]:
    return [{"pass": outcome} for outcome in outcomes]


tasks = {f"d{n}": {"split": "dev", "group": "alpha"} for n in range(10)}
# seven more dev groups, listed out of sorted order, so that only sorting puts them in order
small = ("theta", "beta", "zeta", "gamma", "eta", "delta", "epsilon")
tasks |= {"d10": {"split": "dev", "group": "beta"}, "d11": {"split": "dev", "group": "beta"}}
tasks |= {f"s{n}": {"split": "dev", "group": name} for n, name in enumerate(small) if name != "beta"}
tasks |= {f"h{n}": {"split": "held_out", "group": "alpha"} for n in range(3)}
base = {f"d{n}": rows(T, T, n % 3 != 0) for n in range(10)} | {"d10": rows(F, F, F), "d11": rows(T, F, F)}
base |= {f"s{n}": rows(T, n % 2 == 0, F) for n, name in enumerate(small) if name != "beta"}
base |= {f"h{n}": rows(T, T, T) for n in range(3)}
# the change matches the baseline on every dev task, and fails every held-out task
change = dict(base) | {f"h{n}": rows(F, F, F) for n in range(3)}
partial = {task: runs for task, runs in base.items() if task != "d0"} | {"d1": rows(F, F, F)}
fixture = {"tasks": tasks, "conditions": {"base": base, "change": change, "partial": partial}}


def as_passes(per_task):
    return {task: [row["pass"] for row in runs] for task, runs in per_task.items()}


try:
    report = evaluation_report(fixture, "base", ["change", "partial"])
except KeyError as error:
    raise AssertionError(f"evaluation_report raised KeyError {error}: a change is compared only on the dev tasks both conditions ran")
assert isinstance(report, dict), f"evaluation_report should return a dict: got {report!r}"

dev_only = {task: runs for task, runs in as_passes(base).items() if tasks[task]["split"] == "dev"}
held_only = {task: runs for task, runs in as_passes(base).items() if tasks[task]["split"] == "held_out"}
assert report["splits"]["dev"] == headline(dev_only), "splits['dev'] is headline() over the baseline's dev tasks only"
assert report["splits"]["held_out"] == headline(held_only), "splits['held_out'] is headline() over the held-out tasks only, never mixed with dev"
assert set(report["groups"]) == {"dev", "held_out"} and set(report["groups"]["dev"]) == {"alpha", *small}, \
    f"groups are broken down within each split: got {report['groups'] if isinstance(report['groups'], dict) else report['groups']}"
assert report["groups"]["dev"]["alpha"]["tasks"] == 10 and report["groups"]["held_out"]["alpha"]["tasks"] == 3, \
    "a group's numbers come from that split's tasks only: dev alpha has 10 tasks, held-out alpha 3"
assert report["groups"]["dev"]["beta"]["interval"] is None, "a group of 2 tasks gets no interval, as headline() decides"

assert report["changes"]["change"] == (0.0, 0.0, 0.0), \
    f"changes are compared on dev tasks only: this change differs only on held-out tasks, so dev shows 0, got {report['changes']['change']}"
shared = sorted(set(dev_only) & set(partial))
expected = paired_difference({t: dev_only[t] for t in shared}, {t: as_passes(partial)[t] for t in shared})
assert report["changes"]["partial"] == expected, "a change that ran fewer tasks is compared on the dev tasks both ran"

lines = report["lines"]
assert lines[:2] == [rate_line("dev", headline(dev_only)), rate_line("held-out", headline(held_only))], \
    f"the report opens with the dev line, then the held-out line, labelled 'dev' and 'held-out': got {lines[:2]}"
group_lines = [rate_line(f"dev, {group}", report["groups"]["dev"][group]) for group in sorted(["alpha", *small])]
assert lines[2:11] == group_lines + [rate_line("held-out, alpha", report["groups"]["held_out"]["alpha"])], \
    f"then a line per group, dev's groups first, each split's groups in sorted order: got {lines[2:11]}"
assert lines[11:] == ["change minus base, dev tasks: +0.0% (+0.0% to +0.0%)",
                     f"partial minus base, dev tasks: {expected[0]:+.1%} ({expected[1]:+.1%} to {expected[2]:+.1%})"], \
    f"then a line per change, in the order given: got {lines[11:]}"

report = evaluation_report(results, "baseline", ["prompt-v2", "compaction"])
assert report["lines"][0] == "dev: 73.6% over 97 tasks, 485 trials (65.8% to 81.4%)", f"the recorded baseline: got {report['lines'][0]}"
assert report["lines"][-1] == "compaction minus baseline, dev tasks: -1.2% (-4.7% to +2.3%)", \
    f"compaction on dev tasks only: got {report['lines'][-1]}"
```

**Hint (shown on request):** Build two lookups from `results["tasks"]`, one for split and one for group, and filter the baseline's tasks with them for each split and each (split, group). For a change, keep the dev tasks that appear in both conditions' results, and pass the same set of tasks to both sides of `paired_difference`.

**Reference solution:**

**Tab: `report.py`**
```python
from lib import SPLIT_NAMES, headline, paired_difference, passes, rate_line, results


def evaluation_report(results: dict, baseline: str, changes: list[str]) -> dict:
    """The numbers of an evaluation report for one agent: its pass rate on each split and each group within a split,
    never combining dev and held-out tasks, and each change compared with it on dev tasks only; plus the report's
    lines, one per number, each with its counts and interval."""
    split_of = {task: info["split"] for task, info in results["tasks"].items()}
    group_of = {task: info["group"] for task, info in results["tasks"].items()}
    measured = passes(results, baseline)
    splits, groups, lines = {}, {}, []
    for split in ("dev", "held_out"):
        per_task = {task: runs for task, runs in measured.items() if split_of[task] == split}
        splits[split] = headline(per_task)
        lines.append(rate_line(SPLIT_NAMES[split], splits[split]))
    for split in ("dev", "held_out"):
        groups[split] = {}
        for group in sorted({group_of[task] for task in measured if split_of[task] == split}):
            per_task = {task: runs for task, runs in measured.items() if split_of[task] == split and group_of[task] == group}
            groups[split][group] = headline(per_task)
            lines.append(rate_line(f"{SPLIT_NAMES[split]}, {group}", groups[split][group]))
    dev = {task for task in measured if split_of[task] == "dev"}
    compared = {}
    for change in changes:
        other = passes(results, change)
        compared[change] = paired_difference({t: measured[t] for t in dev & other.keys()},
                                             {t: other[t] for t in dev & other.keys()})
        mean, low, high = compared[change]
        lines.append(f"{change} minus {baseline}, dev tasks: {mean:+.1%} ({low:+.1%} to {high:+.1%})")
    return {"splits": splits, "groups": groups, "changes": compared, "lines": lines}


if __name__ == "__main__":
    report = evaluation_report(results, "baseline", ["prompt-v2", "fp8", "compaction", "layers-v2", "layers", "no-labels"])
    if report is None:
        print("no report yet")
    else:
        print("\n".join(report["lines"]))
```
```
dev: 73.6% over 97 tasks, 485 trials (65.8% to 81.4%)
held-out: 85.7% over 28 tasks, 140 trials (75.3% to 96.2%)
dev, broken result: 80.0% over 2 tasks, 10 trials (too few tasks for an interval)
dev, lost write: 13.3% over 6 tasks, 30 trials (too few tasks for an interval)
dev, other: 83.8% over 37 tasks, 185 trials (73.0% to 94.6%)
dev, planted: 0.0% over 5 tasks, 25 trials (too few tasks for an interval)
dev, question: 80.9% over 47 tasks, 235 trials (71.9% to 89.8%)
held-out, broken result: 40.0% over 1 task, 5 trials (too few tasks for an interval)
held-out, lost write: 40.0% over 2 tasks, 10 trials (too few tasks for an interval)
held-out, other: 95.4% over 13 tasks, 65 trials (86.3% to 100.0%)
held-out, planted: 0.0% over 1 task, 5 trials (too few tasks for an interval)
held-out, question: 94.5% over 11 tasks, 55 trials (86.9% to 100.0%)
prompt-v2 minus baseline, dev tasks: +4.9% (+0.6% to +9.7%)
fp8 minus baseline, dev tasks: +3.5% (-0.2% to +7.2%)
compaction minus baseline, dev tasks: -1.2% (-4.7% to +2.3%)
layers-v2 minus baseline, dev tasks: -16.9% (-24.3% to -9.9%)
layers minus baseline, dev tasks: -31.5% (-39.8% to -22.7%)
no-labels minus baseline, dev tasks: +4.7% (+1.6% to +8.0%)
```

**Explanation:** Every rule the tests check is one the lesson argued for. The splits are never combined, so the held-out result stays a separate check. Groups are broken down within each split, and the small ones get counts without an interval, because `headline` withholds one below ten tasks. Changes are compared on dev tasks only, so the held-out set doesn't shape a decision; one test builds a change that differs only on held-out tasks, which a version comparing over all tasks would report as a regression. A change that ran fewer tasks is compared on the tasks both ran. On the recorded results, the report reproduces the lesson's numbers: the baseline at 73.6% on dev and 85.7% on held-out, prompt v2 about five points better on dev tasks, and compaction's cost shrinking to 1.2 points with an interval across zero.
