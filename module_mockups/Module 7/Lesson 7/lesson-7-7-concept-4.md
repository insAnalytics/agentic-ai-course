# Module 7, Lesson 7 — Concept 4: Correcting a pass rate for the judge's errors

> **Note for the site build:**
> - `scripts/eval/judge_measure_data.py` (updated, in the zip with this file) now also writes a `population` section in `measure.json`: how each judge decided on every dev run of each kind. Run it, check the output matches the copy in the zip, and commit both; concept 3's demos give the same output with the new file.
> - The demo after the exercise defines `data`, `counts`, `observed`, `pairs` and `tpr_tnr`, and imports `random`; carry those, without the printing, into the second demo's hidden setup, with the exercise's reference `rogan_gladen`.

---

## A judge's pass rate is biased

Every number a judge produces about a suite is a count of its own verdicts, and its verdicts are wrong in known proportions. A judge with a TNR of 67% passes a third of the runs that should fail; one with a TPR below 100% fails some runs that should pass. The pass rate it reports is pulled up by the first and down by the second.

If the error rates are known, the bias can be undone. The standard way, from epidemiology, where it corrects disease prevalence for an imperfect test, is the Rogan–Gladen estimator, and Husain and Shankar's judge-validation method uses it for exactly this:

> corrected pass rate = (observed pass rate + TNR − 1) / (TPR + TNR − 1)

Where it comes from is short. If the true pass rate is θ, the judge passes TPR × θ of the runs that should pass and (1 − TNR) × (1 − θ) of the runs that should fail, so the observed rate is TPR × θ + (1 − TNR) × (1 − θ). Solving that for θ gives the formula. The denominator, TPR + TNR − 1, is zero for a judge no better than a coin, which can't be corrected at all.

---

## Applied sandbox exercise
*(graded — correct an observed pass rate for a judge's known error rates)*

**Task shown to learner:**

Write `rogan_gladen(observed, tpr, tnr)`, returning (observed + TNR − 1) / (TPR + TNR − 1). Keep the result between 0 and 1: sampling noise can push the formula outside that range, and a rate can't be. If TPR + TNR is 1 or less, raise `ValueError`: the judge is no better than chance.

**Starter code:**
```python
def rogan_gladen(observed: float, tpr: float, tnr: float) -> float:
    """The pass rate corrected for a judge's errors: (observed + TNR - 1) / (TPR + TNR - 1), kept between 0 and 1.
    A judge with TPR + TNR at or below 1 is no better than chance, and nothing can be corrected with it."""
    # your code here


print(rogan_gladen(0.80, tpr=0.95, tnr=0.70))
```

**Hidden tests:**
```python
got = rogan_gladen(0.80, tpr=0.95, tnr=0.70)
assert got is not None, "rogan_gladen should return a number"
assert abs(got - (0.80 + 0.70 - 1) / (0.95 + 0.70 - 1)) < 1e-9, f"(0.80 + 0.70 - 1) / (0.95 + 0.70 - 1) = 0.769..., got {got}"
assert abs(rogan_gladen(0.6, tpr=1.0, tnr=1.0) - 0.6) < 1e-9, "a perfect judge needs no correction"
assert rogan_gladen(0.99, tpr=0.8, tnr=0.9) == 1.0, "a correction above 1 is kept at 1"
assert rogan_gladen(0.02, tpr=0.9, tnr=0.9) == 0.0, "a correction below 0 is kept at 0"
# a judge that misses failures (low TNR) inflates the observed rate; the correction brings it down
assert rogan_gladen(0.85, tpr=0.97, tnr=0.55) < 0.85, "a lenient judge's observed rate is too high: the correction lowers it"
# a judge that fails good runs (low TPR) deflates it; the correction raises it
assert rogan_gladen(0.60, tpr=0.75, tnr=0.98) > 0.60, "a strict judge's observed rate is too low: the correction raises it"
try:
    weak = rogan_gladen(0.6, tpr=0.7, tnr=0.6)
except ValueError as error:
    raise AssertionError("a weak judge that's still better than chance (TPR + TNR = 1.3) can be corrected, "
                         f"not refused: {error}") from error
assert abs(weak - (0.6 + 0.6 - 1) / (0.7 + 0.6 - 1)) < 1e-9, f"the weak judge's correction: got {weak}"
for tpr, tnr in ((0.5, 0.5), (0.4, 0.3)):
    try:
        rogan_gladen(0.7, tpr=tpr, tnr=tnr)
    except ValueError:
        pass
    except Exception as error:
        raise AssertionError(f"TPR {tpr} + TNR {tnr}: raise ValueError, not {type(error).__name__}") from error
    else:
        raise AssertionError(f"TPR {tpr} + TNR {tnr} is no better than chance: rogan_gladen should raise ValueError")
```

**Hint (shown on request):** Check the denominator before dividing. `min(1.0, max(0.0, value))` keeps a number inside the range.

**Reference solution:**
```python
def rogan_gladen(observed: float, tpr: float, tnr: float) -> float:
    """The pass rate corrected for a judge's errors: (observed + TNR - 1) / (TPR + TNR - 1), kept between 0 and 1.
    A judge with TPR + TNR at or below 1 is no better than chance, and nothing can be corrected with it."""
    if tpr + tnr <= 1:
        raise ValueError(f"TPR + TNR is {tpr + tnr:.2f}: the judge is no better than chance")
    return min(1.0, max(0.0, (observed + tnr - 1) / (tpr + tnr - 1)))


print(rogan_gladen(0.80, tpr=0.95, tnr=0.70))
```
```
0.7692307692307694
```

**Explanation:** The two error rates pull in opposite directions, which the tests check: a lenient judge, with a low TNR, reports a pass rate that's too high, and the correction brings it down; a strict judge, with a low TPR, reports one that's too low. Clipping matters in practice because TPR and TNR come from a small labelled set, and with noisy estimates the formula can land below 0 or above 1. Refusing a judge with TPR + TNR at or below 1 is mathematically necessary, since the denominator vanishes or turns negative, and it's also the right call: a judge that agrees with people no better than chance carries no information to correct with.

---

## The correctness judge, corrected

Here's the correction on the revised Gemma's verdicts on every dev run of Module 5's questions, using its error rates from the test labels, with an interval from resampling the labelled runs:

```python
import random

data = json.loads((JUDGE_LABELS / "measure.json").read_text(encoding="utf-8"))
counts = data["population"]["gemma_v2"]["correctness"]
observed = counts["pass"] / (counts["pass"] + counts["fail"])
# the test labels for the correctness judge: (Simar's label, the revised Gemma's verdict)
pairs = [(r["label"], r["gemma_v2"]) for r in data["rows"]
         if r["kind"] == "correctness" and r["split"] == "test" and not r["excluded"] and r["label"] in ("pass", "fail")]


def tpr_tnr(pairs: list) -> tuple[float, float]:
    passes = [j for p, j in pairs if p == "pass"]
    fails = [j for p, j in pairs if p == "fail"]
    return passes.count("pass") / len(passes), fails.count("fail") / len(fails)


tpr, tnr = tpr_tnr(pairs)
print(f"Gemma passes {counts['pass']} of {counts['pass'] + counts['fail']} dev question runs: {observed:.1%}")
print(f"its test-set TPR {tpr:.2f} and TNR {tnr:.2f}, from {len(pairs)} labelled runs")
print(f"corrected pass rate: {rogan_gladen(observed, tpr, tnr):.1%}")

# resample the labelled runs to see how much the correction depends on which runs were labelled
rng = random.Random(0)
corrected, refused = [], 0
for _ in range(2000):
    sample = rng.choices(pairs, k=len(pairs))
    if {p for p, _ in sample} != {"pass", "fail"}:
        refused += 1
        continue
    try:
        corrected.append(rogan_gladen(observed, *tpr_tnr(sample)))
    except ValueError:
        refused += 1
corrected.sort()
low, high = corrected[int(0.025 * len(corrected))], corrected[int(0.975 * len(corrected)) - 1]
print(f"95% interval {low:.1%} to {high:.1%}; {refused} of 2000 resamples had no usable judge")
```
```
Gemma passes 396 of 480 dev question runs: 82.5%
its test-set TPR 0.92 and TNR 0.67, from 18 labelled runs
corrected pass rate: 84.3%
95% interval 47.5% to 100.0%; 24 of 2000 resamples had no usable judge
```
*(runs live, shows output — read-only demo snippet, not graded; the test labels exclude the three q19 items)*

The correction moves the rate a little, from 82.5% to 84.3%, because the judge's two errors nearly cancel: it fails some good answers and passes some bad ones. The interval is the real result. With 18 labelled runs, 6 of them failures, the corrected rate could be anywhere from about half to all of the runs. The point estimate looks precise, and the interval says it isn't.

Husain and Shankar's method reports exactly this, and warns that the interval is wide when the test set is small. How many labels it takes is a question the same resampling can answer, assuming the labels keep the same mix:

```python
def interval(pairs: list, size: int, repeats: int = 2000) -> tuple[float, float]:
    """A 95% interval for the corrected rate, resampling `size` labelled runs with the same mix as `pairs`."""
    rng, values = random.Random(1), []
    for _ in range(repeats):
        sample = rng.choices(pairs, k=size)
        try:
            values.append(rogan_gladen(observed, *tpr_tnr(sample)))
        except (ValueError, ZeroDivisionError):
            continue
    values.sort()
    return values[int(0.025 * len(values))], values[int(0.975 * len(values)) - 1]


for size in (18, 72, 180, 450):
    low, high = interval(pairs, size)
    print(f"{size:>3} labelled runs: corrected rate between {low:.1%} and {high:.1%}")
```
```
 18 labelled runs: corrected rate between 47.5% and 100.0%
 72 labelled runs: corrected rate between 72.1% and 99.4%
180 labelled runs: corrected rate between 76.6% and 92.6%
450 labelled runs: corrected rate between 79.2% and 89.6%
```
*(runs live, shows output — read-only demo snippet, not graded; illustrative: it resamples the 18 real labelled runs at larger sizes, so it assumes more labels would look like these)*

The width falls roughly with the square root of the number of labels: four times as many halve it, give or take. About 180 labelled runs of this judge question would pin the corrected rate within about eight points either way. That's the budget question this module has to answer for any number it wants to report: not "is the judge good?", but "how many labels does this claim need?"

---

## When the correction can't be made

The correction needs both error rates, and each comes from labels on one side:

- **TPR needs runs the person passed.** The planted-instruction judge's test set has none: every one of its labelled runs fails. Its TPR is unknown, so its pass rates can't be corrected, only reported with that gap stated.
- **TNR needs runs the person failed.** A judge whose labelled set held only passes could never show how often it misses a failure.

That's why the labelling set was chosen within each judge question by how the judges had decided: it guarantees passes and fails on both sides wherever they exist. Where the agent itself almost never passes, as with the planted instruction, there's no way round it but labelling more runs.

---

## Quiz cards

> **Q1.** A judge has a TNR of 67%. What does that do to the pass rate it reports?
> - Makes it too high ✅
> - Makes it too low
> - Leaves it unbiased on average
> - Makes it random from run to run
>
> *Explanation: TNR is the share of real failures the judge catches. At 67% it passes the other third, which adds to the observed pass rate. A low TPR does the opposite.*

> **Q2.** Why does rogan_gladen refuse a judge with TPR + TNR at or below 1?
> - It's no better than chance ✅
> - Its pass rate would be negative
> - Its verdicts would need reversing first
> - It hasn't been labelled by people yet
>
> *Explanation: A judge whose TPR and TNR add up to 1 says pass equally often for good and bad runs, so its verdicts carry no information. The formula's denominator is zero there, and negative below it.*

> **Q3.** The corrected pass rate was 84.3%, with an interval from about 48% to 100%. What does the interval show?
> - 18 labels can't pin the errors down ✅
> - The judge's verdicts change from run to run
> - The correction formula doesn't apply to agents
> - Most of the 480 runs were labelled wrongly
>
> *Explanation: The width comes from resampling the 18 labelled runs: with only 6 failures among them, TNR is very uncertain, and the correction inherits that. More labels narrow it.*

> **Q4.** Roughly how does the interval's width change as the number of labelled runs grows?
> - It halves for about four times the labels ✅
> - It halves for every doubling of the labels
> - It shrinks in proportion to the labels
> - It stays the same once there are 18
>
> *Explanation: Sampling uncertainty falls with the square root of the sample size, so quadrupling the labels roughly halves the width. In the demo, 18, 72, 180 and 450 labelled runs narrow it step by step.*

> **Q5.** Why can't the planted-instruction judge's pass rate be corrected?
> - No passes among its test labels ✅
> - Its verdicts were all failures, so it's broken
> - Planted runs can't be labelled by a person
> - Its rubric changed after the labels were given
>
> *Explanation: TPR is measured on runs the person passed, and every labelled planted run was a failure. Without TPR the formula can't be applied, and the gap has to be reported.*
