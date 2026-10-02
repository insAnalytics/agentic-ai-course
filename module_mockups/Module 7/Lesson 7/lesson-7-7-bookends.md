# Checking the Graders

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only: a loader, this lesson's `rogan_gladen`, and `corrected_interval`) and `judge_report.py` (the entry file). It reads `measure.json` from `/data/eval/judge-labels` (concept 5's version), for Run and the hidden tests.

> **You'll be able to**
> - Measure a judge against people's labels with TPR, TNR and kappa, and get labels that measure the judge's own question: blind, on the same material, chosen to include its hard cases
> - Revise a judge's rubric on development labels and measure it once on test labels, and read a test result that doesn't confirm the development one
> - Correct a judge's pass rate for its errors with an honest interval, estimate rates from labels drawn within strata, and say what a claim would need to be tighter

**Why it matters**
A judge's numbers are only as good as its agreement with people, and that agreement has to be measured, not assumed. Measured here, the judges were better than the marker they replaced, worse than their development numbers suggested, and uncertain in ways a single pass rate hides. This lesson turns a judge's verdicts into numbers that can be reported with their error bars, and shows how many labels a tighter claim would cost.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Why does this lesson report a judge's TPR and TNR instead of its accuracy?
> - It hides missed failures ✅
> - It can't be computed on small sets
> - It counts unclear labels as passes
> - It needs a reference answer to work
>
> *Explanation: Accuracy rises with the share of runs that pass, so a judge that passes everything scores 70% on a set where 70% pass. TNR, the share of real failures caught, shows it catches none.*

> **Q2.** Two readers' kappa went from 0.19 to 0.70 once a standard was written. What does kappa measure?
> - Agreement beyond what chance gives ✅
> - How often the first reader is right
> - The share of labels that are passes
> - How fast two readers label items
>
> *Explanation: Kappa subtracts the agreement two readers would reach just by saying pass as often as they each do. At 0.19 they barely beat that; once they answered the same question, they agreed far more than chance.*

> **Q3.** Why was the labelling done blind, without the judges' verdicts?
> - A verdict could bias the label ✅
> - The material was too long to show
> - People label faster without the rubric
> - The items were drawn at random anyway
>
> *Explanation: A label given after seeing the judge's verdict can lean towards it, and then measures agreement with the judge, not the judge's accuracy.*

> **Q4.** One label was re-reviewed because it judged whether the reply helped the user, not how it treated the assumption. What is that?
> - Judging by other criteria ✅
> - Labelling the same item twice by mistake
> - Copying the judge's verdict into a label
> - Disagreeing with a second labeller
>
> *Explanation: Criteria drift: a person's working criteria shift as they grade. Here the label answered a reasonable question that wasn't the rubric's, which would have measured the judge against the wrong thing.*

> **Q5.** The revised rubrics did better on the development set and slightly worse on the test set. Why?
> - The changes fit dev cases only ✅
> - The test labels must be wrong
> - The judge forgot the new rubric
> - The test set was too easy to improve
>
> *Explanation: The rubrics were changed after reading the development disagreements, so those numbers improve whether or not the judge did. The test set, untouched by the changes, showed they didn't help in general, and a loosened rubric let two failures through.*

> **Q6.** Why not reword the rubric to fix the test-set misses and measure again?
> - Nothing would measure it honestly ✅
> - Test items can't be read by people
> - Rubrics can only change once a month
> - The judge would run more slowly
>
> *Explanation: Tuning on the test set turns it into a second development set. The test result is what gets reported, and fixes go into the next version, measured on new labels.*

> **Q7.** The correctness judge's corrected pass rate was 84.3%, with an interval from about 47% to 100%. What does the interval show?
> - How uncertain the rate still is ✅
> - How often the judge changes its verdict
> - How many runs the agent got right
> - How long the judge takes per verdict
>
> *Explanation: The correction depends on TPR and TNR measured on 18 labelled runs, 6 of them failures. Resampling those runs shows how far the corrected rate could move; about 180 labels would narrow it to roughly eight points either way.*

> **Q8.** Set F's rates from the labels were weighted by stratum rather than taken as the plain share of passing labels. Why?
> - Labels were uneven by stratum ✅
> - Some labels were unclear and dropped
> - Strata with more replies are harder
> - The marker had already weighted them
>
> *Explanation: The labels were drawn within strata, so a 5-reply stratum had as many as a 501-reply one. Weighting each stratum's pass share by its size gives a rate for all 1,600 replies.*

---

## Comprehensive sandbox

*(graded — produce a judge's validation report: its test error rates, and its pass rate corrected for them, or why it can't be)*

**Task shown to learner:**

`lib.py` holds `load_measure`, `rogan_gladen` and `corrected_interval`, read-only. `load_measure()` returns `"rows"`, one per labelled item, with `"kind"`, `"split"`, `"label"` (Simar's), `"excluded"`, and each judge's verdict under keys such as `"gemma_v2"`; and `"population"`, where `population[judge][kind]` counts that judge's `"pass"`, `"fail"` and `"other"` verdicts on every dev run of that kind. In `judge_report.py` (the entry file), write `validate(rows, population, judge, kind)`, returning a dict with:

- `"kind"`, and `"labelled"`: the number of test items of that kind, not excluded, labelled pass or fail
- `"observed"`: the judge's passes over its passes and fails in the population
- `"tpr"` and `"tnr"` on those labelled items, `None` where there's nothing to divide by
- `"corrected"`: the Rogan–Gladen rate, and `"interval"`: `corrected_interval` on the labelled (label, verdict) pairs
- `"reason"`: `None` if the correction was made; otherwise `"no labelled passes"`, `"no labelled fails"` or `"no better than chance"`, with `"corrected"` and `"interval"` left as `None`

Don't change the inputs. Click Run to validate the revised Gemma on four judge questions.

**Tab: `lib.py`** (read-only)
```python
"""Code from this lesson. Read-only."""

import json
import random
from pathlib import Path

JUDGE_LABELS = Path("/data/eval/judge-labels")


def load_measure() -> dict:
    """Simar's labels and both judges' verdicts on the 100 labelled items ("rows"), and how each judge decided on
    every dev run of each kind ("population")."""
    return json.loads((JUDGE_LABELS / "measure.json").read_text(encoding="utf-8"))


def rogan_gladen(observed: float, tpr: float, tnr: float) -> float:
    """The pass rate corrected for a judge's errors: (observed + TNR - 1) / (TPR + TNR - 1), kept between 0 and 1.
    A judge with TPR + TNR at or below 1 is no better than chance, and nothing can be corrected with it."""
    if tpr + tnr <= 1:
        raise ValueError(f"TPR + TNR is {tpr + tnr:.2f}: the judge is no better than chance")
    return min(1.0, max(0.0, (observed + tnr - 1) / (tpr + tnr - 1)))


def corrected_interval(pairs: list[tuple[str, str]], observed: float, repeats: int = 2000) -> tuple[float, float] | None:
    """A 95% interval for the corrected pass rate, from resampling the labelled (person, judge) pairs. Resamples that
    lose all passes or all fails, or leave a judge no better than chance, are skipped; None if too few remain."""
    rng, values = random.Random(0), []
    for _ in range(repeats):
        sample = rng.choices(pairs, k=len(pairs))
        passes = [j for p, j in sample if p == "pass"]
        fails = [j for p, j in sample if p == "fail"]
        if not passes or not fails:
            continue
        try:
            values.append(rogan_gladen(observed, passes.count("pass") / len(passes), fails.count("fail") / len(fails)))
        except ValueError:
            continue
    if len(values) < repeats // 2:
        return None
    values.sort()
    return values[int(0.025 * len(values))], values[int(0.975 * len(values)) - 1]
```

**Tab: `judge_report.py`** (starter, entry file)
```python
from lib import corrected_interval, load_measure, rogan_gladen


def validate(rows: list[dict], population: dict, judge: str, kind: str) -> dict:
    """One judge question's test result: its labelled pairs, error rates, observed and corrected pass rates, and
    why a correction couldn't be made, if it couldn't."""
    # your code here


if __name__ == "__main__":
    data = load_measure()
    for kind in ("correctness", "false_report", "planted", "broken_result"):
        r = validate(data["rows"], data["population"], "gemma_v2", kind)
        if r is None:
            print(f"{kind}: not written yet")
            continue
        line = f"{kind:<14} labelled {r['labelled']:>2}  observed {r['observed']:.1%}  "
        if r["reason"]:
            print(line + f"can't correct: {r['reason']}")
        else:
            low, high = r["interval"] or (float("nan"), float("nan"))
            print(line + f"TPR {r['tpr']:.2f}  TNR {r['tnr']:.2f}  corrected {r['corrected']:.1%} ({low:.0%} to {high:.0%})")
```

**Hidden tests:**
```python
import json

from lib import load_measure
from judge_report import validate


def row(kind, split, label, verdict, excluded=False):
    return {"kind": kind, "split": split, "label": label, "j": verdict, "excluded": excluded}


rows = ([row("k", "test", "pass", "pass")] * 9 + [row("k", "test", "pass", "fail")] + [row("k", "test", "fail", "fail")] * 3
        + [row("k", "test", "fail", "pass")] + [row("k", "dev", "fail", "pass")] * 5 + [row("k", "test", "unclear", "pass")]
        + [row("k", "test", "fail", "pass", excluded=True)] * 4 + [row("other", "test", "pass", "fail")] * 3)
population = {"j": {"k": {"pass": 80, "fail": 20, "other": 3}}}
before = json.dumps([rows, population])
r = validate(rows, population, "j", "k")
assert r is not None, "validate should return a dict"
assert json.dumps([rows, population]) == before, "validate shouldn't change its inputs"
assert r["labelled"] == 14, ("only test items of this kind, not excluded, with a pass or fail label: 14, "
                             f"got {r['labelled']}")
assert abs(r["observed"] - 0.8) < 1e-9, f"observed: the judge's passes over its passes and fails, 80 of 100, got {r['observed']}"
assert abs(r["tpr"] - 0.9) < 1e-9 and abs(r["tnr"] - 0.75) < 1e-9, f"TPR 9/10 and TNR 3/4 on the test pairs: got {r}"
assert abs(r["corrected"] - (0.8 + 0.75 - 1) / (0.9 + 0.75 - 1)) < 1e-9, f"the Rogan-Gladen correction, got {r['corrected']}"
assert r["reason"] is None and r["interval"] is not None and r["interval"][0] <= r["corrected"] <= r["interval"][1], \
    f"a corrected rate comes with an interval around it, and no reason: got {r}"

only_fails = [row("k", "test", "fail", "fail")] * 4
r = validate(only_fails, population, "j", "k")
assert r["corrected"] is None and r["reason"] == "no labelled passes" and r["tpr"] is None, \
    f"with no labelled passes, TPR is unknown and nothing is corrected: got {r}"
assert abs(r["observed"] - 0.8) < 1e-9, "the observed rate is still reported"
r = validate([row("k", "test", "pass", "pass")] * 4, population, "j", "k")
assert r["reason"] == "no labelled fails" and r["tnr"] is None, f"with no labelled fails, TNR is unknown: got {r}"
chance = [row("k", "test", "pass", "pass"), row("k", "test", "pass", "fail"), row("k", "test", "fail", "pass"),
          row("k", "test", "fail", "fail")]
try:
    r = validate(chance, population, "j", "k")
except ValueError as error:
    raise AssertionError(f"a judge no better than chance should get a reason in the report, not an exception: {error}") from error
assert r["corrected"] is None and r["reason"] == "no better than chance", \
    f"a judge with TPR + TNR = 1 can't correct anything, and validate says why instead of raising: got {r}"

data = load_measure()
real = validate(data["rows"], data["population"], "gemma_v2", "correctness")
assert real["labelled"] == 18 and abs(real["corrected"] - 0.8428571428571429) < 1e-6, \
    f"on the real correctness labels: 18 labelled, corrected 84.3%, got {real}"
assert validate(data["rows"], data["population"], "gemma_v2", "planted")["reason"] == "no labelled passes", \
    "the real planted judge has no labelled passes"
```

**Hint (shown on request):** Build the (label, verdict) pairs first, then split them by the label to get TPR and TNR. Check for a missing side before calling `rogan_gladen`, and catch its `ValueError` to turn "no better than chance" into a reason rather than an error.

**Reference solution:**

**Tab: `judge_report.py`**
```python
from lib import corrected_interval, load_measure, rogan_gladen


def validate(rows: list[dict], population: dict, judge: str, kind: str) -> dict:
    """One judge question's test result: its labelled pairs, error rates, observed and corrected pass rates, and
    why a correction couldn't be made, if it couldn't."""
    pairs = [(r["label"], r[judge]) for r in rows
             if r["kind"] == kind and r["split"] == "test" and not r["excluded"] and r["label"] in ("pass", "fail")]
    passes = [verdict for label, verdict in pairs if label == "pass"]
    fails = [verdict for label, verdict in pairs if label == "fail"]
    counts = population[judge][kind]
    report = {"kind": kind, "labelled": len(pairs), "observed": counts["pass"] / (counts["pass"] + counts["fail"]),
              "tpr": passes.count("pass") / len(passes) if passes else None,
              "tnr": fails.count("fail") / len(fails) if fails else None,
              "corrected": None, "interval": None, "reason": None}
    if not passes or not fails:
        report["reason"] = "no labelled passes" if not passes else "no labelled fails"
        return report
    try:
        report["corrected"] = rogan_gladen(report["observed"], report["tpr"], report["tnr"])
    except ValueError:
        report["reason"] = "no better than chance"
        return report
    report["interval"] = corrected_interval(pairs, report["observed"])
    return report


if __name__ == "__main__":
    data = load_measure()
    for kind in ("correctness", "false_report", "planted", "broken_result"):
        r = validate(data["rows"], data["population"], "gemma_v2", kind)
        line = f"{kind:<14} labelled {r['labelled']:>2}  observed {r['observed']:.1%}  "
        if r["reason"]:
            print(line + f"can't correct: {r['reason']}")
        else:
            low, high = r["interval"] or (float("nan"), float("nan"))
            print(line + f"TPR {r['tpr']:.2f}  TNR {r['tnr']:.2f}  corrected {r['corrected']:.1%} ({low:.0%} to {high:.0%})")
```
```
correctness    labelled 18  observed 82.5%  TPR 0.92  TNR 0.67  corrected 84.3% (47% to 100%)
false_report   labelled  4  observed 23.7%  can't correct: no labelled passes
planted        labelled  3  observed 0.0%  can't correct: no labelled passes
broken_result  labelled  4  observed 73.3%  TPR 1.00  TNR 0.50  corrected 46.7% (20% to 73%)
```

**Explanation:** The report is the lesson's discipline in one function. It uses test labels only, because the development labels shaped the rubric. It reports the observed rate whatever happens, the correction only when both error rates exist, and the interval alongside it every time. On the real judges, two of the four questions can't be corrected at all, because the agent failed every labelled run of them: the false-report and planted-instruction judges have no labelled passes, so their TPR is unknown. The broken-result judge shows how much a correction can move a rate when the judge is lenient, from 73% to 47%, and how little four labels can say about it. Only the correctness judge has enough labels for a usable number, and even its interval spans half the scale. Saying which claims the labels support, and which they don't, is the report.
