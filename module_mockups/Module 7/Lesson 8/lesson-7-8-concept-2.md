# Module 7, Lesson 8 — Concept 2: Module 6's signals, calibrated

> **Note for the site build:** both demos start from Module 6's `SIGNALS_SETUP` and data, as in concept 1, with concept 1's reference `calibration_table`, `ece` and `brier` loaded without showing them. The first demo defines `signals`; carry it, without the printing, into the second demo's hidden setup.

---

## Three signals, two questions each

[Module 6 compared three confidence signals](→ Module 6, the stop, ask, or escalate lesson, the signals that the agent isn't sure concept) by how well they rank right answers above wrong ones:

- **Answer-line probability:** the probability the model gave its whole answer line, from its token logprobs.
- **Agreement among samples:** the share of a vote of five that agreed with the winning answer.
- **Verdict probability:** how sure a support judge was of the first word of its verdict.

Here they are again, with the AUROC Module 6 reported beside the two calibration measures from the last concept, on the same recorded runs:

```python
from collections import Counter


def auroc(rows: list[tuple[float, bool]]) -> float:
    right = [score for score, correct in rows if correct]
    wrong = [score for score, correct in rows if not correct]
    return sum((r > w) + 0.5 * (r == w) for r in right for w in wrong) / (len(right) * len(wrong))


def answer_key(question: dict, answer: str | None):
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


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

for name, rows in signals.items():
    print(f"{name:<30} {len(rows):>5} cases, {sum(not c for _, c in rows):>3} wrong   AUROC {auroc(rows):.2f}   "
          f"ECE {ece(rows):.3f}   Brier {brier(rows):.3f}")
```
```
answer-line probability, 2B     1675 cases, 114 wrong   AUROC 0.53   ECE 0.102   Brier 0.084
agreement in a vote of 5, 2B     336 cases,   8 wrong   AUROC 0.86   ECE 0.044   Brier 0.031
verdict probability, judges      360 cases,  23 wrong   AUROC 0.95   ECE 0.021   Brier 0.043
```
*(runs live, shows output — read-only demo snippet, not graded; Module 6's recorded runs: the 2B's answers to set E, and three support judges on Module 6's labelled pairs)*

The three columns don't move together. Answer-line probability ranks like a coin toss and is the worst calibrated. Agreement ranks well and has a middling ECE. Verdict probability ranks best and is the best calibrated. And the counts in the second column decide how far any of it can be trusted: 8 wrong answers behind the agreement row, 23 behind the verdicts.

---

## Where each signal is wrong

A single ECE hides where the miscalibration is. With five bins, each signal's reliability table:

```python
for name in ("agreement in a vote of 5, 2B", "verdict probability, judges"):
    print(name)
    for b in calibration_table(signals[name], bins=5):
        print(f"  {b['low']:.1f}-{b['high']:.1f}  {b['count']:>4} cases   mean confidence {b['confidence']:.2f}   right {b['accuracy']:.2f}")
```
```
agreement in a vote of 5, 2B
  0.4-0.6     6 cases   mean confidence 0.40   right 0.83
  0.6-0.8    19 cases   mean confidence 0.60   right 0.84
  0.8-1.0   311 cases   mean confidence 0.97   right 0.99
verdict probability, judges
  0.4-0.6     8 cases   mean confidence 0.55   right 0.62
  0.6-0.8    29 cases   mean confidence 0.70   right 0.55
  0.8-1.0   323 cases   mean confidence 0.98   right 0.98
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **Agreement is underconfident when the vote splits.** When only two or three of the five samples agree, the winning answer is still right more than four times in five. A vote share isn't a probability of being right, and reading it as one would send far too many answers for review. It's a good ranking signal, and Module 6 used it as one; its numbers need converting before they can be read as chances.
- **Verdict probability is calibrated at the top and overconfident in the middle.** Verdicts given 0.98 are right 98% of the time. Verdicts around 0.7 are right only about half the time. Those middle verdicts are exactly the ones a threshold has to decide about, so a calibrated threshold here needs that middle band measured, not assumed.
- **Answer-line probability** is miscalibrated in both directions, as the last concept showed.

Every one of these tables rests on few errors where it matters: 25 cases below 0.8 for agreement, 37 for verdicts. That isn't a flaw in the method; it's what any well-performing system looks like. Most of its answers are confident and right, so its calibration in the uncertain middle, where decisions are made, is the part measured on the fewest cases. The next concept fixes miscalibration with a fitted correction, and fitting needs labelled cases in exactly that middle.

---

## Which signal for which use

- **To decide what to look at first,** ranking is what matters: verdict probability, then agreement. Their AUROCs say they separate right from wrong well.
- **To set a threshold that means something,** such as "review anything with more than a 10% chance of being wrong", the number itself has to be calibrated in the range where the threshold sits. None of the three is, as it stands; verdict probability comes closest.
- **To report an expected error rate,** calibration everywhere matters, and that needs a fitted correction checked on held-out cases.

---

## Quiz cards

> **Q1.** Sample agreement ranks right answers well (AUROC 0.86) but its ECE is 0.044. What does its reliability table show?
> - Split votes are right more often ✅
> - Unanimous votes are often wrong
> - The signal ranks answers in the wrong order
> - It's perfectly calibrated at every level
>
> *Explanation: When only two or three of five samples agree, the winning answer is still right over 80% of the time. The vote share understates its chance of being right, though it still ranks answers well.*

> **Q2.** Judge verdicts given about 0.7 were right only about half the time. Why does that matter more than the top bin?
> - Thresholds are decided in that middle band ✅
> - The top bin holds too few verdicts to matter
> - Verdicts near 0.7 are all from one judge
> - The middle band is where AUROC is measured
>
> *Explanation: Confident verdicts are right and need no decision. A threshold separates the uncertain ones, so the calibration of the middle band decides whether the threshold means what it says.*

> **Q3.** Why does a well-performing system have its calibration measured least well where it matters?
> - Most of its answers are confident and right ✅
> - Its confidence scores are rounded to one decimal
> - It produces fewer answers than a weak system
> - Its errors are removed before measurement
>
> *Explanation: Good systems put most answers near the top, right. The uncertain middle, where decisions are made, holds few cases, so its calibration rests on a handful of errors.*

> **Q4.** Which use of a signal depends only on its ranking, not its calibration?
> - Deciding which answers to review first ✅
> - Reporting an expected error rate
> - Setting a threshold at a 10% chance of error
> - Telling the user how likely an answer is right
>
> *Explanation: Reviewing in order of confidence needs only the order. The others read the number as a chance of being right, which needs calibration.*

> **Q5.** Verdict probability had the best AUROC and the best ECE. Why can't it be read straight off as a chance of being right?
> - It's overconfident in the middle band ✅
> - Verdicts can't be checked against labels
> - Its ECE is above zero, which rules it out
> - It ranks right verdicts below wrong ones
>
> *Explanation: It's calibrated where it's confident and overconfident around 0.7. A correction fitted on labelled cases, the next concept's subject, is needed before its numbers can be read as chances.*
