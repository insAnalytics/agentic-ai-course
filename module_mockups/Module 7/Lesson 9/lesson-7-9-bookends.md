# Does This Piece Help? Ablations

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only: a loader for `results.json`, `passes`, and concept 1's `paired_difference` with the interval's level as a parameter) and `report.py` (the entry file). It reads `/data/eval/ablations`, for Run and the hidden tests.

> **You'll be able to**
> - Run an ablation that changes one piece and holds everything else fixed, and compare the conditions task by task with an interval from resampling tasks
> - Report suite-wide pass^k with an interval, and decide what to resample when items aren't independent
> - Read an ablation's result: find the mechanism behind a cost, check what a gain is made of, correct for many comparisons, and report a piece that doesn't earn its place

**Why it matters**
Every component in an agent arrives with a reason to add it, and the reason is a prediction. An ablation tests the prediction on the agent's own tasks. Here, three components each looked sensible: forced compaction cost a few points by making the agent repeat work, Module 6's layers cost thirty through false alarms its scripted suite couldn't show, and the source labels made no measurable difference. Without the test, all three would still be in the agent on the strength of their reasons.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Why does an ablation hold the tasks, trials, model and graders fixed?
> - Only the piece differs ✅
> - It finishes the runs sooner
> - The judges see each task twice
> - The pass rates become identical
>
> *Explanation: Any other change would move the results by itself. With everything else fixed, a difference can be put down to the piece.*

> **Q2.** Two identical runs of the baseline each had an interval about 16 points wide, but their paired difference only about 3. Why?
> - It cancels task difficulty ✅
> - It uses more trials per task
> - It lowers the confidence level
> - It removes the failing tasks
>
> *Explanation: Most of each run's uncertainty is which tasks the suite happens to contain. Both runs had the same tasks, so comparing each task with itself removes that shared part.*

> **Q3.** Why does each task contribute one value when resampling, however many trials it ran?
> - Tasks were sampled ✅
> - Trials can't be compared
> - Every task ran exactly once
> - It makes the maths simpler
>
> *Explanation: The suite is a sample of the tasks the agent might face; trials are repeats of one task. Resampling trials would treat them as independent and make the interval too narrow.*

> **Q4.** Grouping Module 6's three wordings per question widened the interval by about 40%. Why?
> - Wordings move together ✅
> - Paraphrases are harder
> - Fewer samples were used
> - Clustering lowers confidence
>
> *Explanation: A model that knows an answer usually knows it in every wording, so three wordings carry less information than three separate questions. Resampling whole questions reflects that.*

> **Q5.** Forced compaction tripled the runs stopped by the step limit. What did the stopped runs have in common?
> - Lost what was tried ✅
> - Each model call got slower
> - Summary calls used up steps
> - The questions were changed
>
> *Explanation: Every stopped run had been compacted, and they repeated tool calls they'd already made: the summaries dropped what had been tried, as Lesson 5's summarizer test predicted.*

> **Q6.** Module 6's layer stack cost the agent about 30 points on real runs. What caused most of it?
> - False alarms ✅
> - Harm the layers missed
> - Extra calls slowing runs
> - Crashes inside a layer
>
> *Explanation: Six answers in ten were withheld, mostly by grounding and the support judge, and samples read showed most were fine answers flagged for list numbers or sentence fragments.*

> **Q7.** This lesson computed eighteen 95% intervals. If nothing had any effect, how many would you expect to exclude zero?
> - About one ✅
> - None, by design
> - About half of them
> - All eighteen of them
>
> *Explanation: Each has about a 5% chance by luck, so eighteen give about one. Correcting the level for the number of comparisons, as the sandbox does, guards against reading that one as a finding.*

> **Q8.** Removing the source labels made no measurable difference. Why is that not proof that labels never help?
> - It may not test their use ✅
> - Labels were only partly removed
> - Five trials are always too few
> - Null results can't be reported
>
> *Explanation: Only two tasks rest on conflicting documents, where dates should matter, and they didn't move. A suite with more such tasks might find an effect this one can't.*

---

## Comprehensive sandbox

*(graded — report every ablation against the baseline, with the interval level corrected for the number of comparisons)*

**Task shown to learner:**

`lib.py` holds `load_results`, `passes(results, condition, group=None)`, `GROUPS`, and `paired_difference(a, b, alpha=0.05)`, which returns B minus A with a (1 − alpha) interval. In `report.py` (the entry file), write:

- **`verdict(low, high)`:** `"helps"` if the interval is entirely above zero, `"hurts"` if entirely below, and `"no measurable effect"` otherwise. An interval that touches zero includes it.
- **`ablation_report(results, conditions, alpha=0.05)`:** one row per comparison, for each condition in the order given: first over all tasks, then within each group in `GROUPS` order. Each row compares the baseline (A) with the condition (B), at a level corrected for every comparison the report makes: `alpha` divided by their number. Each row is a dict with `"condition"`, `"group"` (`"all tasks"` for the whole suite), `"difference"`, `"low"`, `"high"` and `"verdict"`.

Click Run to report the three phase 5 variants.

**Tab: `lib.py`** (read-only)
```python
"""Lesson 9's data and statistics. Read-only."""

import json
import random
from pathlib import Path

ABLATIONS = Path("/data/eval/ablations")
GROUPS = ("question", "other", "lost write", "planted", "broken result")


def load_results() -> dict:
    """Every condition's per-task trial results, as concepts 3 to 5 used them."""
    return json.loads((ABLATIONS / "results.json").read_text(encoding="utf-8"))


def passes(results: dict, condition: str, group: str | None = None) -> dict[str, list[bool]]:
    """Each task's trial results under one condition, optionally only the tasks in one group."""
    return {task: [row["pass"] for row in rows] for task, rows in results["conditions"][condition].items()
            if group is None or results["tasks"][task]["group"] == group}


def paired_difference(a: dict, b: dict, alpha: float = 0.05, repeats: int = 4000,
                      seed: int = 0) -> tuple[float, float, float]:
    """B minus A, task by task, with a (1 - alpha) interval from resampling tasks: concept 1's function, with the
    interval's level as a parameter."""
    tasks = sorted(a.keys() & b.keys())
    differences = [sum(b[t]) / len(b[t]) - sum(a[t]) / len(a[t]) for t in tasks]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(differences, k=len(differences))) / len(differences) for _ in range(repeats))
    return sum(differences) / len(differences), means[int(alpha / 2 * repeats)], means[int((1 - alpha / 2) * repeats) - 1]
```

**Tab: `report.py`** (starter, entry file)
```python
from lib import GROUPS, load_results, paired_difference, passes


def verdict(low: float, high: float) -> str:
    """What an interval says about a difference."""
    # your code here


def ablation_report(results: dict, conditions: list[str], alpha: float = 0.05) -> list[dict]:
    """Every condition against the baseline, over all tasks and within each group. The interval level is corrected
    for the number of comparisons made (Bonferroni: alpha divided by that number)."""
    # your code here


if __name__ == "__main__":
    for row in ablation_report(load_results(), ["layers", "compaction", "no-labels"]) or []:
        print(f"{row['condition']:<10} {row['group']:<13} {row['difference']:+6.1%} "
              f"({row['low']:+6.1%} to {row['high']:+6.1%})  {row['verdict']}")
```

**Hidden tests:**
```python
from lib import GROUPS, paired_difference, passes
from report import ablation_report, verdict

assert verdict(0.01, 0.2) == "helps", "an interval entirely above zero: helps"
assert verdict(-0.2, -0.01) == "hurts", "an interval entirely below zero: hurts"
assert verdict(-0.1, 0.1) == "no measurable effect", "an interval that includes zero: no measurable effect"
assert verdict(0.0, 0.3) == "no measurable effect", "an interval that starts exactly at zero doesn't exclude it"
assert verdict(-0.3, 0.0) == "no measurable effect", "nor one that ends exactly at zero"

groups = {"question": 6, "other": 6, "lost write": 4, "planted": 4, "broken result": 4}
tasks = {f"{g[:3]}{n}": {"group": g, "split": "dev"} for g, count in groups.items() for n in range(count)}
def condition(rate_of):
    return {t: [{"pass": i < rate_of(t)} for i in range(5)] for t in tasks}
results = {"tasks": tasks, "conditions": {
    "baseline": condition(lambda t: 2),
    "better": condition(lambda t: 4 if tasks[t]["group"] == "question" else 2),
    "same": condition(lambda t: 2 + (1 if t.endswith("0") else 0) - (1 if t.endswith("1") else 0)),
}}
report = ablation_report(results, ["better", "same"])
assert report is not None, "ablation_report should return a list of rows"
assert [(r["condition"], r["group"]) for r in report] == \
    [(c, g) for c in ("better", "same") for g in ("all tasks", *GROUPS)], \
    "one row per condition, all tasks first and then each group in GROUPS order, conditions in the order given"
alpha = 0.05 / 12
for row in report:
    group = None if row["group"] == "all tasks" else row["group"]
    expected = paired_difference(passes(results, "baseline", group), passes(results, row["condition"], group), alpha=alpha)
    assert (row["difference"], row["low"], row["high"]) == expected, \
        (f"{row['condition']}, {row['group']}: baseline as A, the condition as B, at alpha 0.05 / 12 comparisons; "
         f"expected {expected}, got {(row['difference'], row['low'], row['high'])}")
    assert row["verdict"] == verdict(row["low"], row["high"]), "each row's verdict comes from its own interval"
better_questions = next(r for r in report if (r["condition"], r["group"]) == ("better", "question"))
assert better_questions["verdict"] == "helps", "every question task gained 40 points: helps"
```

**Hint (shown on request):** Build the list of `(condition, group)` comparisons first, with `None` standing for all tasks; its length is what alpha is divided by. Then one loop makes every row.

**Reference solution:**

**Tab: `report.py`**
```python
from lib import GROUPS, load_results, paired_difference, passes


def verdict(low: float, high: float) -> str:
    """What an interval says about a difference."""
    if low > 0:
        return "helps"
    if high < 0:
        return "hurts"
    return "no measurable effect"


def ablation_report(results: dict, conditions: list[str], alpha: float = 0.05) -> list[dict]:
    """Every condition against the baseline, over all tasks and within each group. The interval level is corrected
    for the number of comparisons made (Bonferroni: alpha divided by that number)."""
    comparisons = [(condition, group) for condition in conditions for group in (None, *GROUPS)]
    corrected = alpha / len(comparisons)
    report = []
    for condition, group in comparisons:
        mean, low, high = paired_difference(passes(results, "baseline", group), passes(results, condition, group),
                                            alpha=corrected)
        report.append({"condition": condition, "group": group or "all tasks", "difference": mean,
                       "low": low, "high": high, "verdict": verdict(low, high)})
    return report


if __name__ == "__main__":
    for row in ablation_report(load_results(), ["layers", "compaction", "no-labels"]):
        print(f"{row['condition']:<10} {row['group']:<13} {row['difference']:+6.1%} "
              f"({row['low']:+6.1%} to {row['high']:+6.1%})  {row['verdict']}")
```
```
layers     all tasks     -29.8% (-41.1% to -19.0%)  hurts
layers     question      -45.9% (-59.7% to -33.4%)  hurts
layers     other         -25.6% (-42.4% to  -6.4%)  hurts
layers     lost write    -10.0% (-42.5% to +12.5%)  no measurable effect
layers     planted       +33.3% ( +0.0% to +80.0%)  no measurable effect
layers     broken result +33.3% (+20.0% to +60.0%)  helps
compaction all tasks      -3.8% ( -9.9% to  +1.6%)  no measurable effect
compaction question       -5.9% (-15.5% to  +2.8%)  no measurable effect
compaction other          -0.4% ( -8.8% to  +7.6%)  no measurable effect
compaction lost write    -12.5% (-37.5% to +10.0%)  no measurable effect
compaction planted        +3.3% ( +0.0% to +13.3%)  no measurable effect
compaction broken result -13.3% (-20.0% to  +0.0%)  no measurable effect
no-labels  all tasks      +3.0% ( -0.8% to  +7.4%)  no measurable effect
no-labels  question       +1.7% ( -3.8% to  +7.9%)  no measurable effect
no-labels  other          +4.0% ( -2.8% to +11.6%)  no measurable effect
no-labels  lost write     +2.5% (-10.0% to +15.0%)  no measurable effect
no-labels  planted        +6.7% ( +0.0% to +20.0%)  no measurable effect
no-labels  broken result  +6.7% ( +0.0% to +20.0%)  no measurable effect
```

**Explanation:** Correcting for eighteen comparisons widens every interval, and the report changes with it. Module 6's layers still clearly hurt, overall and on both large groups, and their gain on the three broken-result tasks survives. Compaction's cost on Module 5's questions, an interval below zero at 95% on its own in concept 3, no longer is: across eighteen comparisons it could be chance. The labels show no measurable effect anywhere. Bonferroni's correction is deliberately cautious; it's the simplest way to make "one of these looked significant" stop being mistaken for a finding, and a result that matters, like the layers', survives it easily.
