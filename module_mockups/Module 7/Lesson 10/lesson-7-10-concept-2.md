# Module 7, Lesson 10 — Concept 2: A gate that doesn't flake

> **Note for the site build:**
> - `scripts/eval/ablation_results.py` (updated, in the zip with this file) adds a `baseline-b` condition to `results.json`: the baseline's second batch, main tasks only, scored the same way. Run it, check the output matches the copy in the zip, and commit both; Lesson 9's demos give the same output with the new file.
> - Both demos start from `LOAD_ABLATIONS` with Lesson 9 concept 1's reference `pass_rate` and `paired_difference`, loaded without showing them; the second also needs this page's reference `gate`.

---

## What a gate is for

A regression test ends in a decision: ship the change, or stop and look. Written as code, that decision is a **gate**, the same idea as [Module 0's tests](→ Module 0, the testing fastapi applications lesson) failing a build, applied to a suite of agent runs. A gate has two ways to be wrong:

- **It misses a regression.** The change made the agent worse and the gate passed it.
- **It flakes.** Nothing got worse and the gate failed anyway, because the agent's results vary from run to run.

The second sounds harmless and isn't. A gate that fails on noise gets rerun until it passes, and then ignored, and an ignored gate catches nothing. The way to keep it honest is to set its thresholds from the noise you've measured, not from round numbers.

---

## Measuring the noise first

The baseline was run twice with nothing changed. Scored with every grader, here's how much each task moved between the two runs, and how much the suite did:

```python
from collections import Counter

a, b = passes("baseline"), passes("baseline-b")
drops = Counter(sum(a[t]) - sum(b[t]) for t in b)
print(f"{len(b)} tasks run twice with nothing changed; how many fewer of 5 trials passed the second time:")
print("  " + ", ".join(f"{drop:+d}: {n}" for drop, n in sorted(drops.items())))
mean, low, high = paired_difference(a, b)
print(f"suite: {mean:+.1%} ({low:+.1%} to {high:+.1%})")
```
```
96 tasks run twice with nothing changed; how many fewer of 5 trials passed the second time:
  -5: 1, -3: 1, -2: 1, -1: 6, +0: 76, +1: 10, +3: 1
suite: +0.6% (-2.5% to +4.0%)
```
*(runs live, shows output — read-only demo snippet, not graded; the 96 main-pool tasks, the ones run twice)*

Most tasks didn't move at all, and the suite as a whole moved less than a point, inside an interval that includes zero. A suite-level rule built on Lesson 9's paired interval would pass this pair, as it should.

The tasks are a different story. One task, q25, failed all five trials in the first run and passed all five in the second. Reading them, the two runs answered in two different ways: the first listed the models the agent could move to, the second recommended one, which is what the question asked. Nothing changed between them but the sampling seeds. Why all five trials in each run went the same way is something this module's data can't settle, but it means a single run's trials of one task aren't always independent, and a task-level rule has to allow for swings this large.

So the thresholds follow from the noise:

- **For the suite,** fail only if the paired interval lies wholly below zero *and* the drop is bigger than a small tolerance, here 2 points. The interval keeps chance out; the tolerance keeps a real but trivial drop from blocking a change.
- **For single tasks,** flag only a fall in pass rate of 0.8 or more, four trials in five. In the no-change pair, no task fell by more than three.

---

## Applied sandbox exercise
*(graded — a regression gate with thresholds that allow for noise)*

**Task shown to learner:**

Write `gate(known_good, new, tolerance=0.02, task_drop=0.8)`. Both arguments map task ids to trial results. `pass_rate` and `paired_difference` are Lesson 9's. Return a dict with:

- **`"difference"`:** `paired_difference(known_good, new)`.
- **`"suite_regressed"`:** true if the interval's upper end is below zero and the mean is at or below `-tolerance`.
- **`"flagged"`:** the shared tasks, sorted, whose pass rate fell by `task_drop` or more.
- **`"passed"`:** true only if the suite didn't regress and no task was flagged.

**Starter code:**
```python
def gate(known_good: dict, new: dict, tolerance: float = 0.02, task_drop: float = 0.8) -> dict:
    """Pass or fail a new run against the last known-good one. The suite regresses if its paired difference is
    clearly below zero (the whole interval under 0) and by more than `tolerance`; a task is flagged if its pass rate
    fell by `task_drop` or more. The run passes only if neither happens."""
    # your code here


known_good = {"t1": [True] * 5, "t2": [True] * 5, "t3": [False] * 5}
new = {"t1": [True] * 5, "t2": [False] * 5, "t3": [False] * 5}
print(gate(known_good, new))
```

**Hidden tests:**
```python
same = {f"t{n}": [True, n % 2 == 0, True, True, False] for n in range(30)}
result = gate(same, same)
assert result is not None, "gate should return a dict"
assert result["passed"] and not result["flagged"] and not result["suite_regressed"], f"a run against itself passes: {result}"
assert result["difference"] == paired_difference(same, same), "the difference is paired_difference(known_good, new)"

one_task = dict(same, t3=[False] * 5)
known = dict(same, t3=[True] * 5)
result = gate(known, one_task)
assert result["flagged"] == ["t3"] and not result["passed"], f"a task falling from 5/5 to 0/5 is flagged: {result}"
assert not result["suite_regressed"], "one task among thirty doesn't move the whole suite clearly below zero"

result = gate(known, dict(known, t3=[True, False, True, False, True]))
assert result["flagged"] == [] and result["passed"], f"a drop from 5/5 to 3/5 is under the default 0.8: {result}"
assert gate(known, dict(known, t3=[True, False, True, False, True]), task_drop=0.4)["flagged"] == ["t3"], \
    "task_drop is a parameter: a drop of 0.4 is flagged when task_drop is 0.4"

worse = {t: [False] + r[1:] for t, r in same.items()}
result = gate(same, worse)
assert result["suite_regressed"] and not result["passed"] and not result["flagged"], \
    f"every task losing one trial in five: the suite clearly regresses, though no single task is flagged: {result}"
assert not gate(same, worse, tolerance=0.5)["suite_regressed"], \
    "a drop smaller than the tolerance doesn't fail the suite, however certain"

better = {t: [True] * 5 for t in same}
assert gate(same, better)["passed"], "a clear improvement passes"
assert gate(same, {"t0": [False] * 5, "extra": [False] * 5})["flagged"] == ["t0"], \
    "only tasks both runs share are compared"
flags = gate({"b": [True] * 5, "a": [True] * 5}, {"b": [False] * 5, "a": [False] * 5})["flagged"]
assert flags == ["a", "b"], f"flagged tasks in sorted order: got {flags}"
```

**Hint (shown on request):** The suite rule needs both conditions: the interval rules out chance, the tolerance rules out the trivial. Compare rates, not counts, so tasks with different numbers of trials are treated alike.

**Reference solution:**
```python
def gate(known_good: dict, new: dict, tolerance: float = 0.02, task_drop: float = 0.8) -> dict:
    """Pass or fail a new run against the last known-good one. The suite regresses if its paired difference is
    clearly below zero (the whole interval under 0) and by more than `tolerance`; a task is flagged if its pass rate
    fell by `task_drop` or more. The run passes only if neither happens."""
    mean, low, high = paired_difference(known_good, new)
    shared = sorted(known_good.keys() & new.keys())
    flagged = [t for t in shared if pass_rate(known_good[t]) - pass_rate(new[t]) >= task_drop]
    suite_regressed = high < 0 and mean <= -tolerance
    return {"passed": not suite_regressed and not flagged, "difference": (mean, low, high),
            "suite_regressed": suite_regressed, "flagged": flagged}


known_good = {"t1": [True] * 5, "t2": [True] * 5, "t3": [False] * 5}
new = {"t1": [True] * 5, "t2": [False] * 5, "t3": [False] * 5}
print(gate(known_good, new))
```
```
{'passed': False, 'difference': (-0.3333333333333333, -1.0, 0.0), 'suite_regressed': False, 'flagged': ['t2']}
```

**Explanation:** The two rules catch different regressions, which the tests show. A change that costs every task one trial in five fails the suite rule, though no single task falls far enough to be flagged. A change that breaks one task completely gets that task flagged, though the suite barely moves. In the example, the suite can't be called regressed from three tasks, but t2's collapse is flagged, and that alone fails the gate.

---

## The gate on this module's changes

```python
known_good = passes("baseline")
checks = [("baseline-b", "the same agent, run again"), ("layers", "Module 6's layers"),
          ("compaction", "forced compaction"), ("no-labels", "source labels removed")]
for condition, label in checks:
    result = gate(known_good, passes(condition))
    mean, low, high = result["difference"]
    print(f"{label:<26} {'PASS' if result['passed'] else 'FAIL'}   suite {mean:+.1%} ({low:+.1%} to {high:+.1%})   "
          f"{len(result['flagged'])} tasks flagged{': ' + ', '.join(result['flagged'][:6]) if result['flagged'] else ''}")
```
```
the same agent, run again  PASS   suite +0.6% (-2.5% to +4.0%)   0 tasks flagged
Module 6's layers          FAIL   suite -29.8% (-37.0% to -22.7%)   24 tasks flagged: a06, a09, a21, a22, h04, h10
forced compaction          FAIL   suite -3.8% (-7.7% to +0.0%)   3 tasks flagged: h07, h09, s25
source labels removed      PASS   suite +3.0% (+0.5% to +5.9%)   0 tasks flagged
```
*(runs live, shows output — read-only demo snippet, not graded; the known-good run is the baseline, and the no-change pair compares its two batches on the main pool)*

The gate does what it should on the two clear cases. The baseline run again passes, with nothing flagged. Module 6's layers fail on both rules, with 24 tasks flagged. Removing the labels passes: a small gain is not a regression.

Forced compaction is the instructive one. The suite rule passes it, since its interval just reaches zero, but three tasks are flagged, so the gate fails it. One of the three, h09, swung by three trials in the no-change pair as well. That's the gate's weak point: a per-task rule run on 125 tasks will, now and then, flag a task that's merely flaky. A flag should send a person to read the task's runs, not block a release on its own, and how many flags to expect by chance is the next concept's question.

---

## Quiz cards

> **Q1.** Why is a gate that fails on noise dangerous, not just annoying?
> - People learn to rerun or ignore it ✅
> - It uses more compute than a stable gate
> - It hides real regressions in the noise
> - It can only be fixed by adding tasks
>
> *Explanation: A gate that fails when nothing changed gets rerun until it passes, and eventually ignored. An ignored gate catches nothing, including the regressions it was built for.*

> **Q2.** Why does the suite rule need both the interval below zero and a tolerance?
> - Chance and triviality, one each ✅
> - The interval is too wide to use on its own
> - The tolerance makes the gate stricter
> - Both are needed to compute the mean
>
> *Explanation: An interval wholly below zero says the drop probably isn't chance. The tolerance says it's big enough to matter. A gate needs both to avoid blocking changes for noise or for tiny, real drops.*

> **Q3.** With nothing changed, q25 failed all five trials in one run and passed all five in the other. What does that imply?
> - A run's trials can move together ✅
> - The judge graded the two runs differently
> - The second run had a newer model
> - q25's check was broken in the first run
>
> *Explanation: The runs answered in two different ways, and each run's five trials all went one way. Whatever the cause, a task's trials in one run can move together, so a task-level rule has to allow for large swings.*

> **Q4.** A change costs every task one trial in five. Which rule catches it?
> - The suite rule ✅
> - Only the task rule
> - Both of the rules
> - Neither of the two rules
>
> *Explanation: Every task falls by 0.2, far below the 0.8 task threshold, but across all tasks the paired difference is clearly below zero and beyond the tolerance.*

> **Q5.** Forced compaction failed the gate on three flagged tasks, one of which also swung in the no-change pair. What should a flag lead to?
> - Someone reading its runs ✅
> - An automatic block on the release
> - Removing the task from the suite
> - Rerunning until the flag clears
>
> *Explanation: Per-task rules over many tasks will sometimes flag one that's only flaky. A flag is a reason to read the runs; whether it's a real regression is a judgement the gate can't make alone.*
