# Module 7, Lesson 12 — Concept 4: How far to trust each number

> **Note for the site build:**
> - New script `scripts/eval/report_grades.py`, in `m7-l12-c4-site-build.zip` with the file it wrote here. Rerun it, check the output is identical to the copy in the zip, run it again with `--check`, and commit both: `public/data/eval/report/baseline-grades.json` (84 KB). For each of the baseline's 625 trials it records whether the run answered, its code-check result and each revised Gemma judge's verdict. The script asserts that this breakdown reproduces every baseline pass in `ablations/results.json`.
> - This page's setup is `LOAD_SETTINGS` + `LOAD_ABLATIONS` + the setup block shown below; add the block to `evalData.ts` as `REPORT_GRADES`, byte-identical to the page. Mount `/data/eval/report/baseline-grades.json` and `/data/eval/judge-labels/measure.json`. The two demos run independently on that setup.

---

## Every number has graders behind it

"73.6% of dev trials pass" sounds like one measurement. It's several, stacked. A trial passes if the run reached an answer, passed its task's code checks, and passed every judge that graded it. Each of those graders has its own blind spots and error rates, so how far to trust the headline depends on how much of it each one decided.

The setup loads, for each baseline trial, what each grader said:

```python
REPORT = Path("/data/eval/report")
grades = json.loads((REPORT / "baseline-grades.json").read_text(encoding="utf-8"))["trials"]
measured = json.loads(Path("/data/eval/judge-labels/measure.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for both demos in this concept, with Lesson 9's `results` and its `json` and `Path` imports)*

Here's which grader settled each trial, applying them in the order the pass rule does:

```python
from collections import Counter


def decided_by(trial: dict) -> str:
    """Which grader settled this trial: the first one, in the order the pass rule applies them, that failed it."""
    if not trial["answered"]:
        return "failed: no answer"
    if trial["code"] is False:
        return "failed: code checks"
    if any(verdict != "pass" for verdict in trial["judges"].values()):
        return "failed: a judge"
    if trial["judges"]:
        return "passed: code checks and judges" if trial["code"] else "passed: judges only"
    return "passed: code checks only" if trial["code"] else "passed: reached an answer"


for split in ("dev", "held_out"):
    counts = Counter(decided_by(trial) for trial in grades if trial["split"] == split)
    print(f"{split}: {counts.total()} trials")
    for outcome, count in sorted(counts.items()):
        print(f"  {outcome:<32} {count:>3}  ({count / counts.total():.0%})")
```
```
dev: 485 trials
  failed: a judge                   69  (14%)
  failed: code checks               41  (8%)
  failed: no answer                 18  (4%)
  passed: code checks and judges    12  (2%)
  passed: code checks only         155  (32%)
  passed: judges only              190  (39%)
held_out: 140 trials
  failed: a judge                   14  (10%)
  failed: code checks                5  (4%)
  failed: no answer                  1  (1%)
  passed: code checks and judges     6  (4%)
  passed: code checks only          62  (44%)
  passed: judges only               52  (37%)
```
*(runs live, shows output — read-only demo snippet, not graded; the breakdown reproduces every baseline pass and fail in Lesson 9's results)*

On the dev tasks, 190 of the 357 passes rest on judges alone: they're Module 5's questions, which have no code check, so the correctness judge decides them. Another 12 passed both. And 69 of the 128 failures were a judge's verdict. More than half of the headline number, in both directions, is a model's opinion.

None of this makes the number wrong. It says where its trust comes from: the code checks, which [Lesson 5 tested against real answers](→ Module 7, the code graders lesson, the testing the graders themselves concept), and the judges, which [Lesson 7 measured against people](→ Module 7, the checking the graders lesson, the a judge is a measurement concept). The report should say how well each was measured.

---

## Each judge, as measured

Here are the four judges in the pass rule: what each said about the baseline, and its error rates on Lesson 7's test labels, the labels kept apart from the rubric's development:

```python
def test_labels(kind: str) -> tuple[list[str], list[str]]:
    """The revised Gemma judge's verdicts on Lesson 7's test labels for one kind: on runs people passed, and failed."""
    rows = [row for row in measured["rows"] if row["kind"] == kind and row["split"] == "test" and not row["excluded"]]
    return ([row["gemma_v2"] for row in rows if row["label"] == "pass"],
            [row["gemma_v2"] for row in rows if row["label"] == "fail"])


print(f"{'judge':<15}{'its verdicts on the baseline':>29}{'TPR':>8}{'TNR':>8}")
for kind in ("correctness", "false_report", "planted", "broken_result"):
    verdicts = [trial["judges"][kind] for trial in grades if kind in trial["judges"]]
    on_passes, on_fails = test_labels(kind)
    tpr = f"{on_passes.count('pass')}/{len(on_passes)}" if on_passes else "unknown"
    tnr = f"{on_fails.count('fail')}/{len(on_fails)}" if on_fails else "unknown"
    others = len(verdicts) - verdicts.count("pass") - verdicts.count("fail")
    shown = f"{verdicts.count('pass')} pass, {verdicts.count('fail')} fail" + (f", {others} unclear" if others else "")
    print(f"{kind:<15}{shown:>29}{tpr:>8}{tnr:>8}")
```
```
judge           its verdicts on the baseline     TPR     TNR
correctness                247 pass, 48 fail   11/12     4/6
false_report      9 pass, 29 fail, 2 unclear unknown     2/4
planted                      0 pass, 30 fail unknown     3/3
broken_result                10 pass, 5 fail     2/2     1/2
```
*(runs live, shows output — read-only demo snippet, not graded; TPR is the share of runs people passed that the judge passed, TNR the share people failed that it failed; "unclear" verdicts count as failures in the pass rule)*

Each row says something different about the number it supports:

- **Correctness decides the question group, and is the best measured.** On 18 test labels it passed 11 of 12 good answers and failed 4 of 6 bad ones. Missing a third of the wrong answers pushes the question group's rate up, and failing an occasional good one pushes it down; [Lesson 7's correction](→ Module 7, the checking the graders lesson, the correcting a pass rate for the judge's errors concept, the correctness judge, corrected) found the two nearly cancel, 82.5% becoming 84.3%, but with an interval from 47.5% to 100% on so few labels. The question group's rate is plausible and not pinned down.
- **The false-report judge decides the lost-write group, and only half of it is measured.** All four of its test labels were failures, so how often it passes a reply that deserved to pass is unknown. Its TNR, 2 of 4, says it misses failures too. The lost-write group's 13.3% could be off in either direction.
- **The planted-instruction judge failed all 30 baseline runs it saw, and its TPR is unknown.** Every test label was a failure, so nothing shows it can pass a reply at all. The planted group's 0% can't be told apart from a judge that fails everything. As [Lesson 7 said](→ Module 7, the checking the graders lesson, the correcting a pass rate for the judge's errors concept, when the correction can't be made), the report gives the number with that gap stated, not corrected.
- **The broken-result judge rests on four labels.** It got 3 of them right. Four labels measure almost nothing.

---

## What the report says

For each result, the report names the graders that produced it and how far they were measured. In practice, three kinds of sentence:

- **Measured, and correctable:** "Questions: 80.9% of dev trials pass (71.9% to 89.8%), graded by a correctness judge whose error rates, measured on 18 labels, roughly cancel; the correction's own interval is wide."
- **Measured on one side only:** "Lost writes: 4 of 30 dev trials pass, graded by a false-report judge whose pass rate on good replies has never been measured."
- **Not checkable:** "Planted instructions: no dev trial passes. The judge failed every reply it saw, and was never shown one a person passed, so this may be the agent or the judge."

The same table says where labelling effort would pay most. Not where the judges are worst, but where the most of the headline rests on the least measurement: the correctness judge, which decides 190 dev passes on 18 labels, and the two judges with no labelled passes at all. A labelled sample of live runs, as [Lesson 11 recommended](→ Module 7, the monitoring in production lesson, the learning from use concept, labels from live traffic), is how those numbers get filled in.

---

## Quiz cards

> **Q1.** 190 of the baseline's 357 dev passes were decided by judges alone. What does that tell the report's reader?
> - How far the headline rests on how well those judges were measured ✅
> - That the headline is wrong by the number of passes the judges gave
> - That the question tasks are easier than the tasks code checks grade
> - Nothing much, since the judges and the code checks were both tested
>
> *Explanation: A pass decided by a judge is only as good as the judge, and the judges' error rates were measured on few labels. The headline isn't wrong for that, but its trust depends on those measurements, which the report has to state.*

> **Q2.** The planted-instruction judge failed all 30 baseline runs, and every test label it saw was a failure. What can the report say about the planted group?
> - That 0% may reflect the agent or a judge that fails everything ✅
> - That the agent follows planted instructions in every run it makes
> - That the judge is perfect, since it agreed with all of its labels
> - That the group's 0% can be corrected with Rogan–Gladen
>
> *Explanation: Agreeing with three failure labels says nothing about whether the judge can pass a good reply: its TPR is unknown. Without it, the correction can't be made, and 0% can't be put down to the agent alone.*

> **Q3.** The correctness judge misses a third of wrong answers but fails a few good ones too. Why did Lesson 7's correction barely move its rate?
> - Its two errors pull opposite ways and nearly cancel ✅
> - The judge's errors were too rare to change anything at all
> - The correction only applies when the TNR is above 0.9
> - The question group is too small for a correction to matter
>
> *Explanation: Passing wrong answers inflates the rate and failing good ones deflates it. Here they nearly balance, so 82.5% became 84.3%. The correction's interval, 47.5% to 100%, is the real message: 18 labels don't pin it down.*

> **Q4.** Where would the next labelling effort improve the report most?
> - Where most of the headline rests on the fewest labels ✅
> - On the judge with the lowest measured TNR, whatever it decides
> - On the code checks, since they grade more trials than judges
> - Evenly across all four judges, to keep their measurements fair
>
> *Explanation: The correctness judge decides 190 dev passes on 18 labels, and two judges have never been shown a labelled pass. Labels there tighten the most important numbers. The code checks were already tested against real answers in Lesson 5.*

> **Q5.** Why does the report apply the graders in the pass rule's order when saying which one decided a trial?
> - So each trial counts once, by the first grader to fail it ✅
> - Because judges are only run after code checks have passed a trial
> - Because the order changes whether the trial passes or fails
> - So the code checks get credit for as many trials as possible
>
> *Explanation: A trial can fail several graders at once; attributing it to the first one in the rule's order gives every trial exactly one cause. The order doesn't change the outcome, since a trial passes only if all of them pass, and each judge graded its runs whether or not the code checks passed them.*
