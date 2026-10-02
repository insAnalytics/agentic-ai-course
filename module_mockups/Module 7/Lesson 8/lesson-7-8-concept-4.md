# Module 7, Lesson 8 — Concept 4: Calibration across a system

> **Note for the site build:**
> - `scripts/eval/judge_measure_data.py` (updated, in the zip with this file) now also writes each revised judge's verdict-token probability (`gemma_v2_p`, `qwen9b_v2_p`) into `measure.json`'s rows. Run it, check the output matches the copy in the zip, and commit both; Lesson 7's demos give the same output with the new file.
> - The first demo needs Module 6's setup and concept 2's `signals`, loaded hidden. The second needs concept 1's reference `ece` and `brier`, loaded hidden, and reads `/data/eval/judge-labels`.

---

## What a calibrated score buys

[Module 6 ended its signals concept](→ Module 6, the stop, ask, or escalate lesson, the signals that the agent isn't sure concept) by saying no confidence signal can be trusted until it's been measured on labelled cases from your own task, and that measuring how well confidence matches accuracy across a whole system is this module's subject. This concept keeps that promise.

A calibrated score turns a threshold from a guess into a prediction. If every accepted case carries a calibrated probability p of being right, the number of errors among the accepted cases should be about the sum of (1 − p) over them. That's a number you can state before anyone checks, and then check. Here it is for Module 6's support judges, with a threshold that sends low-confidence verdicts for review:

```python
verdicts = signals["verdict probability, judges"]
print("accept verdicts at or above a threshold; send the rest for review")
for threshold in (0.7, 0.8, 0.9, 0.95):
    accepted = [(p, correct) for p, correct in verdicts if p >= threshold]
    expected = sum(1 - p for p, _ in accepted)
    actual = sum(not correct for _, correct in accepted)
    print(f"  {threshold:.2f}: {len(accepted)} accepted, {len(verdicts) - len(accepted)} reviewed; "
          f"errors among the accepted, expected from the scores {expected:.1f}, actual {actual}")
```
```
accept verdicts at or above a threshold; send the rest for review
  0.70: 338 accepted, 22 reviewed; errors among the accepted, expected from the scores 11.6, actual 11
  0.80: 323 accepted, 37 reviewed; errors among the accepted, expected from the scores 7.7, actual 7
  0.90: 294 accepted, 66 reviewed; errors among the accepted, expected from the scores 3.7, actual 2
  0.95: 267 accepted, 93 reviewed; errors among the accepted, expected from the scores 1.8, actual 0
```
*(runs live, shows output — read-only demo snippet, not graded; Module 6's three support judges on its labelled pairs)*

At every threshold, the scores predict the errors that get through to within one or two. That's what calibration across a system means in practice: the operator can choose a threshold by its predicted error count and review cost, and the prediction holds. It holds here because these verdict probabilities are close to calibrated where the thresholds sit, which [concept 2](→ Module 7, the calibration lesson, the module 6's signals, calibrated concept) found; for the 2B's answer-line probability, the same arithmetic would mislead.

---

## The judges that grade this module

The phase 4 judges also recorded the probability of each verdict's first token, and Simar's labels say which verdicts were right, so the same check can be made on the module's own graders:

```python
import json
from pathlib import Path

rows = json.loads(Path("/data/eval/judge-labels/measure.json").read_text(encoding="utf-8"))["rows"]
for judge in ("gemma", "qwen9b"):
    pairs = [(r[f"{judge}_v2_p"], r[f"{judge}_v2"] == r["label"]) for r in rows
             if r["label"] in ("pass", "fail") and r[f"{judge}_v2"] in ("pass", "fail") and f"{judge}_v2_p" in r]
    wrong = [p for p, correct in pairs if not correct]
    print(f"{judge}: {len(pairs)} labelled verdicts, {len(wrong)} disagree with Simar")
    print(f"  mean probability of the verdict token: {sum(p for p, _ in pairs) / len(pairs):.3f}; "
          f"lowest on a disagreement: {min(wrong):.3f}")
    print(f"  ECE {ece(pairs):.3f}  Brier {brier(pairs):.3f}")
```
```
gemma: 99 labelled verdicts, 19 disagree with Simar
  mean probability of the verdict token: 1.000; lowest on a disagreement: 1.000
  ECE 0.192  Brier 0.192
qwen9b: 97 labelled verdicts, 21 disagree with Simar
  mean probability of the verdict token: 0.994; lowest on a disagreement: 0.946
  ECE 0.218  Brier 0.215
```
*(runs live, shows output — read-only demo snippet, not graded; all 100 labelled items, both splits, since nothing is being fitted; the revised rubrics)*

Gemma gave every one of its verdicts a probability of 1.000, including the 19 Simar disagrees with. Qwen is barely different. Their ECE is almost exactly their disagreement rate, which is what a signal that always says "certain" scores.

The difference from Module 6's judges is in how they were asked. Module 6's support judges answered with one line, the verdict and nothing else. This module's judges write their reasoning first and the verdict last, as Lesson 6 recommended. By the time a judge writes "Verdict:", it has argued itself to an answer, and the next token is a formality, exactly the effect [concept 3](→ Module 7, the calibration lesson, the why models are miscalibrated, and fixing it concept, where miscalibration comes from) described for answer lines after reasoning. The two sets of judges differ in more than this, so the course's data can't separate the causes, but the pattern is consistent with everything else measured here.

So for these judges, the token probability carries no information, and no fitted map can create some: every verdict would map to the same number. The confidence that exists is the one Lesson 7 measured. For a judge whose verdicts agree with a person 80% of the time on its own question, "this verdict is right with about 80% probability" is the calibrated statement, and it's per judge question, not per verdict.

---

## Calibrating a system, not a score

Put together, calibration across a system comes down to a short list:

- **Measure confidence against the outcome you care about,** at the level decisions are made. A judge's verdict probability is about the judge's verdict; what an operator needs is the chance the agent's run is right, which is the judge's error rates applied to its verdicts, the [Rogan–Gladen correction](→ Module 7, the checking the graders lesson, the correcting a pass rate for the judge's errors concept) in a single case.
- **Prefer signals that can vary.** A score written after reasoning, or a judge that's certain every time, can't be calibrated into anything useful. A verdict asked for directly, agreement across several samples or several judges, or a measured per-question error rate can.
- **Check the predicted error count against the actual one** whenever a threshold is set, as the first demo did, and keep checking: a new model, a new prompt or new kinds of traffic can each break a calibration that held. Watching that over time is part of [Lesson 11](→ Module 7, the monitoring in production lesson).
- **Report calibration with its error counts.** A calibration that rests on a handful of errors in the range where the threshold sits is a hypothesis, not a measurement.

---

## Quiz cards

> **Q1.** Why does a calibrated confidence let you predict how many errors a threshold lets through?
> - Errors add up to Σ(1 − p) ✅
> - Calibrated scores never let any error through
> - A threshold removes every score below 0.5
> - The number of errors equals the number reviewed
>
> *Explanation: If a score of p means a p chance of being right, each accepted case contributes 1 − p expected errors. Summing them gives a prediction that can be checked, as the support judges' did at every threshold.*

> **Q2.** Gemma gave every verdict a probability of 1.000, including those Simar disagreed with. Why is its ECE about its disagreement rate?
> - "Certain" is off by its error rate ✅
> - ECE is defined as the disagreement rate
> - Gemma's verdicts were all wrong
> - The labels were given with the same probability
>
> *Explanation: With every score at 1, the only bin has a confidence of 1 and an accuracy of the agreement rate, so the gap is the disagreement rate. The score says nothing about which verdicts to doubt.*

> **Q3.** Module 6's judges answered with one line, and this module's reason first. Why might that change their verdict probabilities?
> - After reasoning, it's a formality ✅
> - Reasoning makes judges agree less with people
> - One-line judges use a different tokenizer
> - Longer prompts lower every token's probability
>
> *Explanation: Once a judge has argued its way to an answer, writing it is nearly certain, whatever the reasoning was worth. A verdict asked for directly keeps some uncertainty in its probability.*

> **Q4.** For a judge whose verdict tokens are always 1.000, what's the calibrated confidence in one of its verdicts?
> - Its measured agreement rate ✅
> - The probability of its verdict token
> - The share of runs it passes
> - One minus its TPR on the test labels
>
> *Explanation: The token carries no information, so the confidence has to come from validation: how often the judge agrees with a person on that judge question, measured as in Lesson 7.*

> **Q5.** A threshold was chosen when its predicted error count matched the actual one. What should happen after that?
> - Keep checking, as models and traffic change ✅
> - Nothing, since the threshold is now calibrated
> - Lower the threshold until no errors get through
> - Replace the scores with the overall accuracy
>
> *Explanation: Calibration holds for the model, prompt and traffic it was measured on. Each can change, so the predicted and actual error counts need watching over time.*
