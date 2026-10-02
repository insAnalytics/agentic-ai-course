# Calibration

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only: Module 6's setup and signal functions, a `load_signals` built as concept 2 built them, and this lesson's calibration functions) and `calibrate.py` (the entry file). It reads Module 6's data from `/data/reliability`, mounted as for Module 6's signals page, for Run and the hidden tests.

> **You'll be able to**
> - Tell ranking from calibration, and measure calibration with a reliability table, ECE and the Brier score, reading each with the number of errors behind it
> - Explain where miscalibration comes from, fit a temperature or a binned map on development cases, and judge the result on test cases against a constant baseline
> - Use calibrated confidence to predict the errors a threshold lets through, and say where a confidence can't be calibrated and what to use instead

**Why it matters**
A confidence score is useful in two ways: to decide what to look at first, and to say how likely something is to be wrong. The first needs ranking; the second needs calibration, and it's the one thresholds, error budgets and reports depend on. Module 6 measured only the first. Measured here, its best signal predicts the errors a threshold lets through almost exactly, another can't be calibrated into anything more useful than a constant, and the judges grading this module are certain about every verdict, right or wrong.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** Squaring every answer-line probability left its AUROC at 0.525 and dropped its mean from 91% to 85%. What does that show?
> - Order and meaning differ ✅
> - A higher AUROC than before
> - A lower AUROC than before
> - Fewer wrong answers overall
>
> *Explanation: Ranking depends only on order, which squaring keeps; calibration depends on what the numbers claim, which it changes. A signal can be measured on either, and they don't move together.*

> **Q2.** What does the Brier score reward that ECE alone doesn't?
> - Sharp and honest scores ✅
> - Scores near 0.5 for every case
> - Bins of equal size in the table
> - Only scores above a threshold
>
> *Explanation: ECE asks only whether scores match frequencies, so a constant can score well. The Brier score also rewards scores that sit close to 0 or 1 when they're right, which is what separating cases needs.*

> **Q3.** Agreement in a vote of 5 ranked answers well but was miscalibrated. How?
> - Split votes are often right ✅
> - Unanimous votes are often wrong
> - Votes never split in practice
> - Five samples are always enough
>
> *Explanation: When only two or three samples agree, the winning answer is still right more than four times in five. A vote share isn't a probability of being right until it's mapped to one.*

> **Q4.** Why is a good system's calibration measured least well where thresholds are set?
> - Few cases sit in the middle ✅
> - Thresholds are always near 1
> - Labels are noisier at the top
> - Middle scores can't be binned
>
> *Explanation: Most of a good system's cases are confident and right. The uncertain middle, where a threshold decides, holds few cases and fewer errors, so its calibration rests on a handful of them.*

> **Q5.** What did the GPT-4 technical report show about calibration on MMLU?
> - Post-training hurt calibration ✅
> - Pre-training hurt calibration
> - Calibration fell with model size
> - The benchmark was contaminated
>
> *Explanation: The pre-trained model's ECE was 0.007; after post-training it was 0.074. The report says post-training hurt calibration significantly, while its exam scores suggest capability barely changed.*

> **Q6.** Giving every test case the development accuracy got the lowest ECE on Module 6's signals. Why is it still a poor calibration?
> - It can't tell cases apart ✅
> - It's fitted on the test half
> - Its Brier score is the lowest
> - It ranks cases perfectly
>
> *Explanation: A constant is right on average and useless for deciding which case to doubt. Report the Brier score with ECE, and compare against this constant: a score that can't beat it carries little information.*

> **Q7.** If accepted cases carry calibrated scores, how many errors should get through?
> - Sum of one minus each score ✅
> - Number accepted times threshold
> - Share of scores below 0.5
> - Number of cases reviewed
>
> *Explanation: Each accepted case with a calibrated score p contributes 1 − p expected errors. Module 6's support judges matched that prediction to within one or two at every threshold.*

> **Q8.** This module's judges gave every verdict a token probability of 1.000. Where does a calibrated confidence in their verdicts come from?
> - Its measured agreement rate ✅
> - The verdict token's probability
> - The share of runs it passes
> - Its temperature after fitting
>
> *Explanation: After reasoning, the verdict token is a formality and carries no information; no fitted map can recover any. The calibrated statement is the agreement rate with people on that judge question, measured in Lesson 7.*

---

## Comprehensive sandbox

*(graded — fit a calibration on development cases, judge it on test cases, and check its predicted errors)*

**Task shown to learner:**

`lib.py` holds Module 6's setup, `load_signals()` (Module 6's three confidence signals as `(confidence, correct)` rows), and this lesson's `ece`, `brier`, `scale` and `fit_temperature`, read-only. In `calibrate.py` (the entry file), write `calibration_report(rows, threshold)`. Split the rows: even positions (`rows[0::2]`) are development, odd positions (`rows[1::2]`) are test. Return a dict with:

- `"temperature"`: fitted on the development rows over `GRID`
- `"raw"`, `"scaled"` and `"constant"`: `(ECE, Brier)` on the test rows as they are, after scaling with the fitted temperature, and with every test case given the development rows' accuracy
- `"accepted"`: how many test cases have a scaled score at or above `threshold`
- `"predicted_errors"`: the sum of 1 − (scaled score) over those accepted cases, and `"actual_errors"`: how many of them were wrong

Don't change the rows. Click Run to report on all three signals.

**Tab: `lib.py`** (read-only)
```python
"""Module 6's setup, and this lesson's calibration code. Read-only."""

import json
import math
import re
from collections import Counter
from pathlib import Path


DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_set(name: str) -> dict:
    """One of the built sets, such as "set-e"."""
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


# how set E replies were graded: the same code as scripts/reliability/grading.py
MARKER = "ANSWER:"
NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def extract_answer(reply: str) -> str | None:
    """The text after the last ANSWER: marker, or None if there isn't one."""
    head, marker, tail = reply.rpartition(MARKER)
    if not marker:
        return None
    return tail.strip().splitlines()[0].strip() if tail.strip() else ""


def normalize(text: str) -> str:
    text = text.strip().strip("*_`\"'").strip().rstrip(".").strip().strip("*_`\"'")
    return " ".join(text.lower().split())


def as_number(text: str) -> float | None:
    match = NUMBER.search(text)
    return float(match.group().replace(",", "")) if match else None


def is_correct(question: dict, reply: str) -> bool:
    answer = extract_answer(reply)
    if answer is None:
        return False
    if question["type"] == "number":
        value = as_number(answer)
        return value is not None and abs(value - question["answer"]) < 1e-9
    accepted = {normalize(str(question["answer"])), *(normalize(a) for a in question["accept"])}
    return normalize(answer) in accepted


def answer_probability(sample: dict) -> float | None:
    """The probability the model gave its whole answer line: the product of its tokens' probabilities."""
    steps = sample.get("answer_logprobs")
    return math.exp(sum(step["logprob"] for step in steps)) if steps else None


def verdict_probability(steps: list[dict], marker: str = "VERDICT:") -> float | None:
    """The probability of the first word after the marker: the moment the judge commits to a verdict."""
    text = ""
    for i, step in enumerate(steps):
        text += step["token"]
        if marker in text:
            following = [s for s in steps[i + 1:] if s["token"].strip()]
            return math.exp(following[0]["logprob"]) if following else None
    return None


def auroc(rows: list[tuple[float, bool]]) -> float:
    right = [score for score, correct in rows if correct]
    wrong = [score for score, correct in rows if not correct]
    return sum((r > w) + 0.5 * (r == w) for r in right for w in wrong) / (len(right) * len(wrong))


def answer_key(question: dict, answer: str | None):
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


def load_signals() -> dict[str, list[tuple[float, bool]]]:
    """Module 6's three confidence signals as (confidence, correct) rows, built as concept 2 built them."""
    questions = {q["id"]: q for q in load_set("set-e")["questions"]}
    signals = {}
    pairs = [(answer_probability(s), s["correct"]) for r in load_run("plain.smaller")["results"] for s in r["samples"]]
    signals["answer-line probability, 2B"] = [(p, c) for p, c in pairs if p is not None]
    # Module 6's vote: each question's 20 samples as four votes of 5; confidence is the winner's share of the vote
    agreement = []
    for record in load_run("plain.smaller")["results"]:
        question = questions[record["id"]]
        for start in range(0, 20, 5):
            votes = record["samples"][start:start + 5]
            keys = [answer_key(question, s["answer"]) for s in votes]
            counts = Counter(key for key in keys if key is not None)
            if not counts:
                agreement.append((0.0, False))
                continue
            winner, n = counts.most_common(1)[0]
            agreement.append((n / 5, next(s["correct"] for s, key in zip(votes, keys) if key == winner)))
    signals["agreement in a vote of 5, 2B"] = agreement
    WANTED = {"supported": "SUPPORTED", "not_supported": "NOT SUPPORTED", "contradict": "CONTRADICT", "consistent": "CONSISTENT"}
    built = load_set("set-v")
    verdicts = []
    for run_name, key in (("support.small", "support_pairs"), ("statements.small", "statement_pairs"),
                          ("statements.large", "statement_pairs")):
        labels = {p["id"]: p["label"] for p in built[key]}
        verdicts += [(verdict_probability(r["logprobs"]), r["verdict"] == WANTED[labels[r["id"]]])
                     for r in load_run(run_name)["results"]]
    signals["verdict probability, judges"] = [(p, c) for p, c in verdicts if p is not None]
    return signals


def calibration_table(rows: list[tuple[float, bool]], bins: int = 10) -> list[dict]:
    """Group (confidence, correct) pairs into equal-width confidence bins; for each non-empty bin, its range, count,
    mean confidence and accuracy. A confidence of exactly 1.0 goes in the top bin."""
    groups = [[] for _ in range(bins)]
    for confidence, correct in rows:
        groups[min(int(confidence * bins), bins - 1)].append((confidence, correct))
    return [{"low": i / bins, "high": (i + 1) / bins, "count": len(group),
             "confidence": sum(c for c, _ in group) / len(group),
             "accuracy": sum(correct for _, correct in group) / len(group)}
            for i, group in enumerate(groups) if group]


def ece(rows: list[tuple[float, bool]], bins: int = 10) -> float:
    """Expected calibration error: each bin's gap between accuracy and mean confidence, weighted by its share of rows."""
    return sum(b["count"] / len(rows) * abs(b["accuracy"] - b["confidence"]) for b in calibration_table(rows, bins))


def brier(rows: list[tuple[float, bool]]) -> float:
    """The mean squared gap between each confidence and what happened (1 if right, 0 if wrong)."""
    return sum((confidence - correct) ** 2 for confidence, correct in rows) / len(rows)


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
```

**Tab: `calibrate.py`** (starter, entry file)
```python
from lib import brier, ece, fit_temperature, load_signals, scale

GRID = [round(0.25 * k, 2) for k in range(1, 41)]


def calibration_report(rows: list[tuple[float, bool]], threshold: float) -> dict:
    """Fit a temperature on the even-positioned rows, then on the odd-positioned ones compare the raw scores, the
    scaled scores and the development accuracy given to every case, and check the scaled scores' predicted errors
    among the cases at or above the threshold."""
    # your code here


if __name__ == "__main__":
    for name, rows in load_signals().items():
        r = calibration_report(rows, threshold=0.9)
        if r is None:
            print(f"{name}: not written yet")
            continue
        print(f"{name}: temperature {r['temperature']}")
        for label in ("raw", "scaled", "constant"):
            print(f"  {label:<9} ECE {r[label][0]:.3f}  Brier {r[label][1]:.3f}")
        print(f"  at 0.9: {r['accepted']} accepted, errors predicted {r['predicted_errors']:.1f}, actual {r['actual_errors']}")
```

**Hidden tests:**
```python
from lib import brier, ece, fit_temperature, load_signals, scale
from calibrate import GRID, calibration_report

# development rows (even positions) and test rows (odd positions) deliberately differ
dev_rows = [(0.99, n % 20 < 18) for n in range(20)] + [(0.7, n % 10 < 6) for n in range(10)]
test_rows = [(0.995, True), (0.98, True), (0.97, False), (0.99, True), (0.6, True), (0.96, True),
             (0.75, False), (0.999, True), (0.9, True), (0.5, False)] * 3
rows = [row for pair in zip(dev_rows, test_rows) for row in pair]
before = list(rows)
r = calibration_report(rows, threshold=0.9)
assert r is not None, "calibration_report should return a dict"
assert rows == before, "calibration_report shouldn't change the rows"
assert r["temperature"] == fit_temperature(dev_rows, GRID), \
    f"fit the temperature on the even-positioned rows only: expected {fit_temperature(dev_rows, GRID)}, got {r['temperature']}"
assert abs(r["raw"][0] - ece(test_rows)) < 1e-9 and abs(r["raw"][1] - brier(test_rows)) < 1e-9, \
    "raw: ECE and Brier of the odd-positioned rows, as they are"
scaled = [(scale(p, r["temperature"]), c) for p, c in test_rows]
assert abs(r["scaled"][0] - ece(scaled)) < 1e-9 and abs(r["scaled"][1] - brier(scaled)) < 1e-9, \
    "scaled: the odd-positioned rows after scaling with the fitted temperature"
dev_accuracy = sum(c for _, c in dev_rows) / len(dev_rows)
assert abs(r["constant"][1] - brier([(dev_accuracy, c) for _, c in test_rows])) < 1e-9, \
    "constant: every test case given the development rows' accuracy, not the test rows'"
accepted = [(p, c) for p, c in scaled if p >= 0.9]
assert r["accepted"] == len(accepted), \
    f"accepted: test cases whose scaled score is at or above the threshold, {len(accepted)}; got {r['accepted']}"
assert abs(r["predicted_errors"] - sum(1 - p for p, _ in accepted)) < 1e-9, \
    "predicted errors: the sum of 1 - p over the accepted cases' scaled scores"
assert r["actual_errors"] == sum(not c for _, c in accepted), "actual errors: the accepted cases that were wrong"

edge = scale(0.96, r["temperature"])
at_edge = calibration_report(rows, threshold=edge)
assert at_edge["accepted"] == sum(p >= edge for p, _ in scaled), "a scaled score exactly at the threshold is accepted"

real = calibration_report(load_signals()["verdict probability, judges"], threshold=0.9)
assert real["temperature"] == 1.0 and real["accepted"] == 147 and real["actual_errors"] == 0, \
    f"on the judges' real verdicts: temperature 1.0, 147 accepted at 0.9, none wrong; got {real}"
```

**Hint (shown on request):** Split first and keep the two halves apart: the temperature and the constant come only from the development rows, and everything you report is measured on the test rows. Scale the test rows once and use the scaled list for both the `"scaled"` scores and the threshold check.

**Reference solution:**

**Tab: `calibrate.py`**
```python
from lib import brier, ece, fit_temperature, load_signals, scale

GRID = [round(0.25 * k, 2) for k in range(1, 41)]


def calibration_report(rows: list[tuple[float, bool]], threshold: float) -> dict:
    """Fit a temperature on the even-positioned rows, then on the odd-positioned ones compare the raw scores, the
    scaled scores and the development accuracy given to every case, and check the scaled scores' predicted errors
    among the cases at or above the threshold."""
    dev, test = rows[0::2], rows[1::2]
    temperature = fit_temperature(dev, GRID)
    scaled = [(scale(p, temperature), correct) for p, correct in test]
    base = sum(correct for _, correct in dev) / len(dev)
    constant = [(base, correct) for _, correct in test]
    accepted = [(p, correct) for p, correct in scaled if p >= threshold]
    return {"temperature": temperature,
            "raw": (ece(test), brier(test)), "scaled": (ece(scaled), brier(scaled)), "constant": (ece(constant), brier(constant)),
            "accepted": len(accepted),
            "predicted_errors": sum(1 - p for p, _ in accepted),
            "actual_errors": sum(not correct for _, correct in accepted)}


if __name__ == "__main__":
    for name, rows in load_signals().items():
        r = calibration_report(rows, threshold=0.9)
        print(f"{name}: temperature {r['temperature']}")
        for label in ("raw", "scaled", "constant"):
            print(f"  {label:<9} ECE {r[label][0]:.3f}  Brier {r[label][1]:.3f}")
        print(f"  at 0.9: {r['accepted']} accepted, errors predicted {r['predicted_errors']:.1f}, actual {r['actual_errors']}")
```
```
answer-line probability, 2B: temperature 1.75
  raw       ECE 0.104  Brier 0.083
  scaled    ECE 0.100  Brier 0.088
  constant  ECE 0.005  Brier 0.061
  at 0.9: 469 accepted, errors predicted 23.7, actual 29
agreement in a vote of 5, 2B: temperature 0.5
  raw       ECE 0.038  Brier 0.030
  scaled    ECE 0.028  Brier 0.030
  constant  ECE 0.000  Brier 0.023
  at 0.9: 155 accepted, errors predicted 1.2, actual 2
verdict probability, judges: temperature 1.0
  raw       ECE 0.024  Brier 0.037
  scaled    ECE 0.024  Brier 0.037
  constant  ECE 0.017  Brier 0.053
  at 0.9: 147 accepted, errors predicted 1.5, actual 0
```

**Explanation:** The report is the lesson's checklist. Everything fitted, the temperature and the constant, comes from development rows; everything reported comes from test rows. The constant is there to keep the calibration honest: on all three signals it gets the lowest ECE, and on two of them, answer-line probability and agreement, it also beats the scores on the Brier score, which says how little those scores add for telling cases apart in this data. The threshold check is the part a system depends on. For the judges' verdicts, the predicted errors among the accepted cases, 1.5, are close to the actual ones, none; for the answer-line probability, the prediction falls short by about a fifth, which is what an uncorrectable miscalibration looks like in practice.
