# Module 7, Lesson 8 — Concept 3: Why models are miscalibrated, and fixing it

> **Note for the site build:** the demos start from Module 6's `SIGNALS_SETUP` and data, concept 1's reference `calibration_table`, `ece` and `brier`, and concept 2's first demo's `signals` (with its definitions), all loaded without showing them. The first demo also needs this page's exercise reference (`scale`, `log_loss`, `fit_temperature`) loaded hidden; it defines `GRID`, which the second demo needs too.

---

## Where miscalibration comes from

A model trained only to predict the next token is, in one narrow sense, trained to be calibrated: its loss rewards giving each token the probability it actually has. OpenAI's GPT-4 technical report showed what happens after that. On a subset of the MMLU multiple-choice benchmark, the pre-trained model's confidence in each answer letter matched how often that letter was right, with an ECE of 0.007. After post-training with reinforcement learning, the same model on the same questions had an ECE of 0.074; the report says the post-training hurts calibration significantly. Post-training rewards answers people prefer, and a confident, well-phrased answer is often preferred whether or not the confidence is earned.

Two more causes show up in this course's own data:

- **Reasoning before answering.** Once a model has reasoned its way to an answer, writing the answer line is nearly certain, however shaky the reasoning was. That's why [Module 6 found](→ Module 6, the stop, ask, or escalate lesson, the signals that the agent isn't sure concept) the 2B's answer-line probability ranks right and wrong answers almost exactly like a coin toss.
- **Scores that were never probabilities.** A vote share or a judge's token probability measures something real, but nothing made it a chance of being right. Concept 2 found agreement underconfident when the vote splits, for that reason.

---

## Fixing it with a fitted map

Since the scores can't be trusted as they come, the standard fix is to learn a map from score to probability on labelled cases, and apply it afterwards. Three common maps:

- **Temperature scaling.** Divide each score's log-odds by one number, the temperature, chosen so the scaled scores best match the labels. Above 1 pulls every score towards 0.5; below 1 pushes them out. Guo et al. (ICML 2017) found this single parameter fixed much of the miscalibration in modern neural networks, and since it never changes the order of the scores, it can't change the ranking.
- **Platt scaling.** The same, with a second parameter that can shift the scores as well as stretch them.
- **Histogram binning.** Replace each score with the accuracy of its bin on the labelled cases. It can fix any shape of miscalibration, and it needs more labels, because every bin is fitted separately.

Whichever map, the discipline is [Lesson 7's](→ Module 7, the checking the graders lesson, the development and test sets, for a judge concept): fit on development cases, measure on test cases, and only trust the test.

---

## Applied sandbox exercise
*(graded — temperature scaling, fitted by log loss)*

**Task shown to learner:**

Write three functions:

- `scale(p, temperature)`: clip `p` to between 1e-6 and 1 − 1e-6, take its log-odds, log(p / (1 − p)), divide by the temperature, and turn it back into a probability with 1 / (1 + e^(−x)).
- `log_loss(rows)`: for `(confidence, correct)` rows, the mean of −log(confidence) for right rows and −log(1 − confidence) for wrong ones, with confidences clipped the same way.
- `fit_temperature(rows, grid)`: the temperature in `grid` whose scaled confidences have the lowest log loss on `rows`.

**Starter code:**
```python
import math


def scale(p: float, temperature: float) -> float:
    """A confidence with its log-odds divided by the temperature: above 1 pulls it towards 0.5, below 1 pushes it out."""
    # your code here


def log_loss(rows: list[tuple[float, bool]]) -> float:
    """How surprised the confidences were by what happened: the mean of -log(probability given to the outcome)."""
    # your code here


def fit_temperature(rows: list[tuple[float, bool]], grid: list[float]) -> float:
    """The temperature from the grid whose scaled confidences have the lowest log loss on these rows."""
    # your code here


rows = [(0.99, True), (0.99, False), (0.9, True), (0.9, True)]
print(fit_temperature(rows, grid=[0.5, 1.0, 2.0, 4.0]))
```

**Hidden tests:**
```python
import math

got = scale(0.9, 1.0)
assert got is not None, "scale should return a number"
assert abs(got - 0.9) < 1e-9, f"a temperature of 1 leaves the confidence alone: got {got}"
assert abs(scale(0.9, 2.0) - 1 / (1 + math.exp(-math.log(9) / 2))) < 1e-9, \
    "scale divides the log-odds, log(p / (1 - p)), by the temperature"
assert 0.5 < scale(0.9, 2.0) < 0.9 and scale(0.9, 0.5) > 0.9, "above 1 pulls towards 0.5; below 1 pushes away from it"
assert abs(scale(0.5, 3.0) - 0.5) < 1e-9, "0.5 stays at 0.5 at any temperature"
assert scale(0.2, 2.0) > 0.2, "a low confidence moves up towards 0.5 too"
try:
    edges = scale(1.0, 2.0), scale(0.0, 2.0)
except (ZeroDivisionError, ValueError) as error:
    raise AssertionError(f"clip a confidence of 0 or 1 just inside the range before taking the log-odds: {error!r}") from error
assert all(0 < e < 1 for e in edges), f"0 and 1 are clipped first, so they stay strictly between 0 and 1: got {edges}"

expected = -(math.log(0.8) + math.log(0.4)) / 2
assert abs(log_loss([(0.8, True), (0.6, False)]) - expected) < 1e-9, \
    "log loss: the mean of -log of the probability the confidence gave to what happened"

overconfident = [(0.99, True)] * 6 + [(0.99, False)] * 4
assert fit_temperature(overconfident, grid=[0.5, 1.0, 2.0, 4.0, 8.0]) > 1, \
    "confidences of 0.99 that are right 60% of the time need a temperature above 1"
underconfident = [(0.6, True)] * 19 + [(0.6, False)]
assert fit_temperature(underconfident, grid=[0.25, 0.5, 1.0, 2.0]) < 1, \
    "confidences of 0.6 that are right 95% of the time need a temperature below 1"
calibrated = [(0.8, True)] * 8 + [(0.8, False)] * 2
assert fit_temperature(calibrated, grid=[0.5, 1.0, 2.0]) == 1.0, "calibrated confidences keep a temperature of 1"
```

**Hint (shown on request):** `min(grid, key=...)` finds the best temperature in one line, with the key computing the log loss of the rows after scaling each confidence. Clipping before `math.log` is what keeps a confidence of exactly 0 or 1 from dividing by zero.

**Reference solution:**
```python
import math


def scale(p: float, temperature: float) -> float:
    """A confidence with its log-odds divided by the temperature: above 1 pulls it towards 0.5, below 1 pushes it out."""
    p = min(max(p, 1e-6), 1 - 1e-6)
    return 1 / (1 + math.exp(-math.log(p / (1 - p)) / temperature))


def log_loss(rows: list[tuple[float, bool]]) -> float:
    """How surprised the confidences were by what happened: the mean of -log(probability given to the outcome)."""
    return -sum(math.log(p if correct else 1 - p) for p, correct in ((min(max(p, 1e-6), 1 - 1e-6), c) for p, c in rows)) / len(rows)


def fit_temperature(rows: list[tuple[float, bool]], grid: list[float]) -> float:
    """The temperature from the grid whose scaled confidences have the lowest log loss on these rows."""
    return min(grid, key=lambda t: log_loss([(scale(p, t), correct) for p, correct in rows]))


rows = [(0.99, True), (0.99, False), (0.9, True), (0.9, True)]
print(fit_temperature(rows, grid=[0.5, 1.0, 2.0, 4.0]))
```
```
4.0
```

**Explanation:** Log loss is what makes the fit honest: a confidence of 0.99 on a wrong answer costs −log(0.01), about 4.6, so overconfident mistakes dominate and push the temperature up, as they do in the example. Fitting by ECE instead would be unstable, because ECE jumps as scores cross bin edges. Working in log-odds is what makes one parameter enough to stretch or shrink every score consistently: 0.5 never moves, and scores on either side move towards it or away from it together.

---

## On Module 6's signals

Here's temperature scaling on two of Module 6's signals, fitted on half of each signal's cases and measured on the other half:

```python
GRID = [round(0.25 * k, 2) for k in range(1, 41)]
# split each signal's cases: even positions develop the fix, odd positions test it
for name in ("verdict probability, judges", "answer-line probability, 2B"):
    rows = signals[name]
    dev, test = rows[0::2], rows[1::2]
    t = fit_temperature(dev, GRID)
    scaled = [(scale(p, t), correct) for p, correct in test]
    print(f"{name}: temperature {t} fitted on {len(dev)} cases")
    print(f"  test, before: ECE {ece(test):.3f}  Brier {brier(test):.3f}")
    print(f"  test, after:  ECE {ece(scaled):.3f}  Brier {brier(scaled):.3f}")
```
```
verdict probability, judges: temperature 1.0 fitted on 180 cases
  test, before: ECE 0.024  Brier 0.037
  test, after:  ECE 0.024  Brier 0.037
answer-line probability, 2B: temperature 1.75 fitted on 838 cases
  test, before: ECE 0.104  Brier 0.083
  test, after:  ECE 0.100  Brier 0.088
```
*(runs live, shows output — read-only demo snippet, not graded; `fit_temperature` and `scale` are the exercise's reference versions)*

It does almost nothing, for two different reasons. The judges' verdict probabilities are already calibrated on average, so the best temperature is 1; their miscalibration is in the middle band, which one parameter that moves every score the same way can't reach. The 2B's answer-line probability is miscalibrated in both directions, underconfident low and overconfident high, and a temperature can only correct one direction at a time.

A map with more freedom can do better, and the comparison that matters is with a map that uses no score at all:

```python
def fit_bins(rows: list[tuple[float, bool]], bins: int = 5) -> list[float]:
    """Histogram binning: each confidence bin's accuracy on these rows (the overall accuracy for an empty bin)."""
    overall = sum(correct for _, correct in rows) / len(rows)
    groups = [[] for _ in range(bins)]
    for p, correct in rows:
        groups[min(int(p * bins), bins - 1)].append(correct)
    return [sum(g) / len(g) if g else overall for g in groups]


for name in ("verdict probability, judges", "answer-line probability, 2B"):
    rows = signals[name]
    dev, test = rows[0::2], rows[1::2]
    table = fit_bins(dev)
    binned = [(table[min(int(p * 5), 4)], correct) for p, correct in test]
    base = sum(correct for _, correct in dev) / len(dev)
    constant = [(base, correct) for _, correct in test]
    print(f"{name}, test cases:")
    print(f"  binned on dev:          ECE {ece(binned):.3f}  Brier {brier(binned):.3f}")
    print(f"  dev accuracy for all:   ECE {ece(constant):.3f}  Brier {brier(constant):.3f}   (every case gets {base:.2f})")
```
```
verdict probability, judges, test cases:
  binned on dev:          ECE 0.033  Brier 0.041
  dev accuracy for all:   ECE 0.017  Brier 0.053   (every case gets 0.93)
answer-line probability, 2B, test cases:
  binned on dev:          ECE 0.010  Brier 0.059
  dev accuracy for all:   ECE 0.005  Brier 0.061   (every case gets 0.93)
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two lessons sit in these numbers.

- **ECE alone can be gamed.** Giving every case the development set's overall accuracy, ignoring the score entirely, gets the lowest ECE of all on both signals. It's perfectly calibrated and useless: it can't tell one case from another. The Brier score catches it, because it also rewards scores that separate right from wrong. Report both.
- **Calibration can't add information.** Binning fixes the answer-line probability's calibration, from an ECE of about 0.10 to 0.01, and its Brier score ends up barely better than the constant's. A signal that ranks like a coin toss can at best be mapped to "93% for everything". For the judges' verdicts, which rank well, the raw scores already beat both the binned version and the constant on the Brier score: their bins, fitted on a few dozen middle cases, add noise rather than fixing it. More labelled cases in the middle band would change that, which is the same budget question Lesson 7 ended on.

---

## Quiz cards

> **Q1.** In the GPT-4 report, the pre-trained model's ECE on MMLU was 0.007 and the post-trained model's was 0.074. What does that show?
> - Post-training made its confidence less trustworthy ✅
> - Post-training made the model answer more questions wrongly
> - The pre-trained model ranked answers better
> - MMLU can't measure calibration reliably
>
> *Explanation: The report says post-training hurt calibration significantly. Its exam results suggest capability was roughly unchanged; what changed is how well its stated confidence matches how often it's right.*

> **Q2.** Why does temperature scaling never change a signal's AUROC?
> - Every score keeps its order ✅
> - It's fitted on development cases only
> - It only changes scores near 0.5
> - It uses log loss instead of ECE
>
> *Explanation: Dividing every log-odds by the same positive number keeps the order of the scores, so the ranking, and AUROC, can't change. Only what the numbers claim changes.*

> **Q3.** Why couldn't temperature scaling fix the 2B's answer-line probability?
> - It's off in both directions ✅
> - Its scores are already perfectly calibrated
> - It needs more than 838 cases to fit
> - Temperature only works on judge verdicts
>
> *Explanation: Low scores are underconfident and high scores overconfident. One temperature moves every score the same way, towards 0.5 or away from it, so it can't fix both.*

> **Q4.** Giving every case the same probability, the overall accuracy, got the lowest ECE. Why is that not a good calibration?
> - It can't tell one case from another ✅
> - It's fitted on the wrong half of the data
> - ECE can't be computed for a constant
> - It ranks right answers below wrong ones
>
> *Explanation: A constant is calibrated on average and carries no information about which cases are risky. The Brier score, which also rewards separating right from wrong, shows it's worse.*

> **Q5.** After binning, the answer-line probability's Brier score was barely better than a constant's. What does that mean?
> - The signal had little to begin with ✅
> - Binning made the signal less calibrated
> - The test half was too small to measure
> - The Brier score can't compare calibrations
>
> *Explanation: Calibration can make a score's numbers honest but can't add information it doesn't have. A signal that ranks like a coin toss ends up close to "the same probability for everything".*
