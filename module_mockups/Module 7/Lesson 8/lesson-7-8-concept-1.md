# Module 7, Lesson 8 — Concept 1: Ranking isn't calibration

> **Note for the site build:** every demo on this page and the next two starts from Module 6's `SIGNALS_SETUP` (its `LOAD_UNSURE` plus `answer_probability` and `verdict_probability`), loaded without showing it, with the reliability data Module 6's signals page mounts (`SIGNALS_DATA`). The demo after the exercise defines `answer_line`; carry it, without the printing, into the next demo's hidden setup, with the exercise's reference functions.

---

## Two questions about a confidence score

[Module 6 measured its confidence signals](→ Module 6, the stop, ask, or escalate lesson, the signals that the agent isn't sure concept) by asking one question of each: does it rank right answers above wrong ones? That's what AUROC measures, and it's the right question when the only use of a signal is to pick which answers to look at first. It isn't the only question. When an agent says it's 90% sure, is it right 90% of the time?

That second property is **calibration**. A calibrated score means what it says: of all the answers given 0.8, about 80% are right. Ranking and calibration are independent. A signal can rank perfectly and be badly miscalibrated, or be calibrated on average and rank no better than chance. Here's the first half of that on real data, the 2B's answer-line probability from Module 6's runs, beside the same scores squared:

```python
def auroc(rows: list[tuple[float, bool]]) -> float:
    """Module 6's ranking measure: the chance a right answer scores higher than a wrong one."""
    right = [score for score, correct in rows if correct]
    wrong = [score for score, correct in rows if not correct]
    return sum((r > w) + 0.5 * (r == w) for r in right for w in wrong) / (len(right) * len(wrong))


pairs = [(answer_probability(s), s["correct"]) for r in load_run("plain.smaller")["results"] for s in r["samples"]]
rows = [(p, correct) for p, correct in pairs if p is not None]
# the same scores, squared: every answer keeps its place in the order, but the numbers shrink
squared = [(p ** 2, correct) for p, correct in rows]
accuracy = sum(correct for _, correct in rows) / len(rows)
for label, signal in (("answer-line probability", rows), ("the same, squared", squared)):
    mean = sum(p for p, _ in signal) / len(signal)
    print(f"{label:<24} AUROC {auroc(signal):.3f}   mean confidence {mean:.1%}   actual accuracy {accuracy:.1%}")
```
```
answer-line probability  AUROC 0.525   mean confidence 90.7%   actual accuracy 93.2%
the same, squared        AUROC 0.525   mean confidence 85.2%   actual accuracy 93.2%
```
*(runs live, shows output — read-only demo snippet, not graded; Qwen3.5-2B's answers to set E, from Module 6's recorded runs)*

Squaring keeps every answer in the same order, so AUROC can't change; it only changes what the numbers claim. The original scores say the 2B is about 91% sure on average, when it's right 93% of the time; the squared ones say 85%. Any decision that uses the number itself, not just the order, is affected: a threshold, an expected error rate, a cost.

---

## Measuring calibration

The standard picture is a **reliability diagram**: sort answers into bins by their confidence, and for each bin compare the average confidence with the share that were right. A calibrated signal puts every bin on the diagonal. Two numbers summarize it:

- **Expected calibration error (ECE).** Each bin's gap between accuracy and average confidence, weighted by the share of answers in the bin, added up. It's what Guo et al.'s influential study of calibration in neural networks (ICML 2017) reported, and it's 0 for a perfectly calibrated signal.
- **Brier score.** The average of (confidence − outcome)², where the outcome is 1 for a right answer and 0 for a wrong one. It rewards both calibration and sharpness, scores that sit close to 0 or 1, so a signal can lower it by being both honest and decisive.

ECE depends on the bins chosen, and with few wrong answers it's noisy; the Brier score needs no bins. Reporting both, with the number of answers and errors behind them, is the safe habit.

---

## Applied sandbox exercise
*(graded — a reliability table, ECE and the Brier score)*

**Task shown to learner:**

Each row is `(confidence, correct)`, with confidence between 0 and 1. Write:

- `calibration_table(rows, bins=10)`: split 0 to 1 into `bins` equal ranges; put each row in its range, with a confidence of exactly 1.0 in the top one. For each non-empty range, in order, return a dict with `"low"`, `"high"`, `"count"`, `"confidence"` (the mean confidence) and `"accuracy"` (the share correct).
- `ece(rows, bins=10)`: the sum over bins of (count / total) × |accuracy − confidence|.
- `brier(rows)`: the mean of (confidence − outcome)², with outcome 1 if correct and 0 if not.

**Starter code:**
```python
def calibration_table(rows: list[tuple[float, bool]], bins: int = 10) -> list[dict]:
    """Group (confidence, correct) pairs into equal-width confidence bins; for each non-empty bin, its range, count,
    mean confidence and accuracy. A confidence of exactly 1.0 goes in the top bin."""
    # your code here


def ece(rows: list[tuple[float, bool]], bins: int = 10) -> float:
    """Expected calibration error: each bin's gap between accuracy and mean confidence, weighted by its share of rows."""
    # your code here


def brier(rows: list[tuple[float, bool]]) -> float:
    """The mean squared gap between each confidence and what happened (1 if right, 0 if wrong)."""
    # your code here


rows = [(0.95, True), (0.92, False), (0.55, True), (0.15, False)]
print(calibration_table(rows, bins=2))
```

**Hidden tests:**
```python
rows = [(0.95, True), (0.92, False), (0.55, True), (0.15, False), (1.0, True), (0.05, True)]
table = calibration_table(rows, bins=2)
assert table is not None, "calibration_table should return a list of bins"
assert [(b["low"], b["high"], b["count"]) for b in table] == [(0.0, 0.5, 2), (0.5, 1.0, 4)], \
    f"two bins, 0-0.5 and 0.5-1.0, with a confidence of exactly 1.0 in the top bin: got {[(b['low'], b['high'], b['count']) for b in table]}"
top = table[1]
assert abs(top["confidence"] - (0.95 + 0.92 + 0.55 + 1.0) / 4) < 1e-9 and abs(top["accuracy"] - 0.75) < 1e-9, \
    f"the top bin's mean confidence and accuracy: got {top}"
assert [b["low"] for b in calibration_table([(0.31, True), (0.97, False)], bins=10)] == [0.3, 0.9], \
    "only non-empty bins are listed, in order"

expected_ece = 2 / 6 * abs(0.5 - 0.10) + 4 / 6 * abs(0.75 - 0.855)
assert abs(ece(rows, bins=2) - expected_ece) < 1e-9, \
    f"ECE weights each bin's |accuracy - confidence| by its share of rows: expected {expected_ece:.4f}, got {ece(rows, bins=2)}"
perfect = [(0.8, True)] * 8 + [(0.8, False)] * 2
assert abs(ece(perfect)) < 1e-9, "answers given 0.8 that are right 80% of the time are perfectly calibrated: ECE 0"
assert abs(ece([(0.9, True), (0.1, True)], bins=2) - (0.5 * 0.1 + 0.5 * 0.9)) < 1e-9, \
    "the gap counts in both directions: overconfidence and underconfidence"

expected_brier = ((0.95 - 1) ** 2 + 0.92 ** 2 + (0.55 - 1) ** 2 + 0.15 ** 2 + 0 + (0.05 - 1) ** 2) / 6
assert abs(brier(rows) - expected_brier) < 1e-9, f"Brier: the mean of (confidence - outcome) squared, got {brier(rows)}"
assert abs(brier([(1.0, True), (0.0, False)])) < 1e-9, "certain and right every time: Brier 0"
```

**Hint (shown on request):** `int(confidence * bins)` gives a row's bin, except for 1.0, which it puts one past the end: cap it with `min(..., bins - 1)`. In Python, `True - 0.9` is `0.1`, so a boolean outcome can be used directly in the Brier score.

**Reference solution:**
```python
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


rows = [(0.95, True), (0.92, False), (0.55, True), (0.15, False)]
print(calibration_table(rows, bins=2))
```
```
[{'low': 0.0, 'high': 0.5, 'count': 1, 'confidence': 0.15, 'accuracy': 0.0}, {'low': 0.5, 'high': 1.0, 'count': 3, 'confidence': 0.8066666666666666, 'accuracy': 0.6666666666666666}]
```

**Explanation:** Weighting each bin by its share of the rows is what makes ECE an *expected* error: a gap in a bin of six answers matters less than the same gap in a bin of a thousand. The absolute value means overconfidence and underconfidence both count; a signed sum would let one cancel the other, which is why the tests include a case that's wrong in both directions at once. The Brier score is the same idea without bins: every answer contributes its own squared gap.

---

## Module 6's answer-line probability, calibrated

```python
from collections import Counter

answer_line = {}
for label, run_name in (("2B", "plain.smaller"), ("4B", "plain")):
    pairs = [(answer_probability(s), s["correct"]) for r in load_run(run_name)["results"] for s in r["samples"]]
    answer_line[label] = [(p, correct) for p, correct in pairs if p is not None]
for label, rows in answer_line.items():
    print(f"answer-line probability, {label}: {len(rows)} answers, {sum(not c for _, c in rows)} wrong, "
          f"ECE {ece(rows):.3f}, Brier {brier(rows):.3f}")
```
```
answer-line probability, 2B: 1675 answers, 114 wrong, ECE 0.102, Brier 0.084
answer-line probability, 4B: 1677 answers, 15 wrong, ECE 0.020, Brier 0.017
```
*(runs live, shows output — read-only demo snippet, not graded; `ece` and `brier` are the exercise's reference versions)*

The 4B looks far better calibrated than the 2B, but look at what's behind each number: the 4B got 15 answers wrong out of nearly 1,700. With so few errors, its low ECE says mainly that it's confident and usually right, which says little about what its confidence means when it's lower. The 2B, with 114 errors, gives the more informative picture:

```python
print("Qwen3.5-2B, answer-line probability:")
for b in calibration_table(answer_line["2B"]):
    print(f"  {b['low']:.1f}-{b['high']:.1f}  {b['count']:>4} answers   mean confidence {b['confidence']:.2f}   right {b['accuracy']:.2f}")
```
```
Qwen3.5-2B, answer-line probability:
  0.0-0.1     6 answers   mean confidence 0.06   right 0.33
  0.1-0.2    13 answers   mean confidence 0.16   right 0.46
  0.2-0.3    13 answers   mean confidence 0.26   right 0.85
  0.3-0.4    20 answers   mean confidence 0.35   right 0.80
  0.4-0.5    33 answers   mean confidence 0.45   right 0.94
  0.5-0.6    25 answers   mean confidence 0.56   right 1.00
  0.6-0.7    65 answers   mean confidence 0.64   right 0.97
  0.7-0.8   109 answers   mean confidence 0.76   right 0.97
  0.8-0.9   111 answers   mean confidence 0.86   right 0.98
  0.9-1.0  1280 answers   mean confidence 0.98   right 0.93
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two different miscalibrations sit in one table. Below 0.5, the 2B is underconfident: answers it gave a probability of 0.2 to 0.5 were right most of the time. At the top, where 1,280 of its answers sit, it's overconfident: an average probability of 0.98, right 93% of the time. Answer-line probability measures how sure the model is of its wording, which is only loosely what the user cares about. Module 6 found it ranked right and wrong answers almost exactly like a coin toss; the table shows the same weakness from the other side: the numbers can't be read as chances of being right.

---

## Quiz cards

> **Q1.** Squaring a confidence score keeps its AUROC the same. Why?
> - Every answer keeps its place in the order ✅
> - Squaring doesn't change scores near 1
> - AUROC ignores scores below 0.5
> - The right and wrong answers change together
>
> *Explanation: AUROC depends only on whether right answers score above wrong ones. Squaring a number between 0 and 1 never changes which of two is larger, so the order, and the AUROC, stay the same, while the numbers drop.*

> **Q2.** What does it mean for a confidence score to be calibrated?
> - Answers given 0.8 are right 80% ✅
> - Right answers always score above wrong ones
> - The average score is close to 0.5
> - Every answer gets a score above 0.9
>
> *Explanation: Calibration is about what the numbers mean, not their order. The second option is perfect ranking, which a miscalibrated signal can still have.*

> **Q3.** Why does ECE weight each bin by its share of the answers?
> - A gap in a big bin affects more answers ✅
> - Small bins are always better calibrated
> - The weights make ECE fall between 0 and 1
> - Bins near 0.5 matter more than the ends
>
> *Explanation: ECE is the expected gap for an answer picked at random, so a bin holding a thousand answers counts for more than one holding six.*

> **Q4.** The 4B's answer-line ECE is 0.020, from about 1,700 answers with 15 wrong. Why doesn't that show its confidence is trustworthy?
> - Too few errors to show much ✅
> - ECE can't be computed on more than 1,000 answers
> - The 4B's answers were graded more leniently
> - A low ECE always means the signal ranks badly
>
> *Explanation: Almost every answer is confident and right, which makes ECE small. How well the score works when it's lower, where it would matter for a decision, rests on a handful of errors.*

> **Q5.** Below 0.5 the 2B was mostly right; at the top it was right less often than its score said. What is that?
> - Underconfident low, overconfident high ✅
> - Overconfident throughout the range
> - Calibrated, within the noise of the bins
> - Underconfident throughout the range
>
> *Explanation: Low-scored answers were right more often than their scores claimed, and the top bin, where most answers sit, was right less often. One signal can be miscalibrated in both directions.*
