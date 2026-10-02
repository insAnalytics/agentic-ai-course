# Module 7, Lesson 7 — Concept 1: A judge is a measurement

> **Note for the site build:**
> - New script `scripts/eval/judge_vs_reading.py` (in the zip with this file) writes `public/data/eval/judge-labels/vs-reading.json`: the 50 question runs Lesson 3's reading labelled, with the reading's verdict, both judges' correctness verdicts, and whether every citation pointed at a source a tool returned. Run it, check the output matches the copy in the zip, and commit both. Mount `public/data/eval/judge-labels/` at `/data/eval/judge-labels`.
> - Add the setup block to `evalData.ts` as `LOAD_JUDGE_LABELS`, byte-identical. The second demo needs the first demo's `rows` and the exercise's reference `agreement_stats`, loaded without showing them; the third needs `agreement_stats` and `/data/eval/reading` (already mounted).

---

## Measured against what?

Lesson 6 ended with judges whose verdicts disagree with each other, follow their rubrics into wrong answers, and never say they're unsure. Anthropic's guide is direct about what that means: model graders need calibrating against human graders before their numbers are trusted, and that calibration is the main thing to spend systematic human grading on. A judge is a measuring instrument, and an instrument is checked against a reference it's meant to reproduce. For a grader, the reference is a careful person answering the same question.

This lesson does that check. Its main material is labelling done for the purpose, which comes in the next concepts. This concept sets out how to compare a grader with a person, using labels the module already has: Lesson 3's reading of 50 runs of Module 5's questions, each given a pass or fail verdict, set beside the correctness judges' verdicts on the same runs.

That comparison isn't quite fair to the judges, and it's worth saying why before using it. The reading judged each run as a whole, by the written standard, which fails a wrong citation; the correctness judge was asked only whether the answer matches the reference. Where they differ, the judge may simply have answered its own question correctly. The labels in the rest of the lesson are given on the judge's own question, blind, which removes that problem.

---

## Why accuracy isn't enough

The obvious summary is accuracy, the share of runs where the grader and the person agree. It hides the failure that matters most:

```python
import json
from pathlib import Path

JUDGE_LABELS = Path("/data/eval/judge-labels")


def load_vs_reading() -> list[dict]:
    """The 50 question runs Lesson 3's reading labelled, with the reading's verdict, both judges' correctness
    verdicts, and whether every citation was to a source a tool returned."""
    return json.loads((JUDGE_LABELS / "vs-reading.json").read_text(encoding="utf-8"))["rows"]
```
*(defined once here and already loaded for every demo in this lesson)*

```python
rows = load_vs_reading()
passed = sum(r["reading"] == "pass" for r in rows)
print(f"{len(rows)} runs; the reading passed {passed} and failed {len(rows) - passed}")
print(f"a 'judge' that passes every run agrees with the reading on {passed / len(rows):.0%} of them, "
      f"and catches none of the {len(rows) - passed} failures")
```
```
50 runs; the reading passed 35 and failed 15
a 'judge' that passes every run agrees with the reading on 70% of them, and catches none of the 15 failures
```
*(runs live, shows output — read-only demo snippet, not graded; the reading's verdicts are Lesson 3's labels, Simar's where he read the run and Claude's otherwise)*

A grader that does nothing scores 70%, because most runs pass. The higher the pass rate, the better doing nothing looks, and an agent improving makes a useless grader look better. Husain and Shankar's method for validating a judge reports two numbers instead:

- **TPR (true positive rate):** of the runs the person passed, the share the grader passed too.
- **TNR (true negative rate):** of the runs the person failed, the share the grader failed too.

The do-nothing grader has a TPR of 100% and a TNR of 0%, which says exactly what it is. A third number, **Cohen's kappa**, compares agreement with what two raters would reach by chance, given how often each says pass: 1 is perfect agreement, 0 is no better than chance. It's the usual way to compare two people's labels, where neither is the reference.

---

## Applied sandbox exercise
*(graded — compare a grader's verdicts with a person's)*

**Task shown to learner:**

Write `agreement_stats(pairs)`. Each pair is `(person, grader)`. Use only pairs where both are `"pass"` or `"fail"`; count the rest as skipped. Return a dict with:

- `"n"`: the number of usable pairs, and `"skipped"`: the number left out
- `"tpr"`: of the pairs the person passed, the share the grader passed
- `"tnr"`: of the pairs the person failed, the share the grader failed
- `"accuracy"`: the share of usable pairs where they agree
- `"kappa"`: (accuracy − chance) / (1 − chance), where chance = (person's pass share × grader's pass share) + (person's fail share × grader's fail share)

Any rate with nothing to divide by is `None`, and so is kappa when chance agreement is 1.

**Starter code:**
```python
def agreement_stats(pairs: list[tuple[str, str]]) -> dict:
    """How a grader's verdicts compare with a person's. pairs are (person, grader), each "pass" or "fail"; pairs with
    anything else are skipped and counted."""
    # your code here


print(agreement_stats([("pass", "pass"), ("pass", "pass"), ("fail", "pass"), ("fail", "fail"), ("pass", "unclear")]))
```

**Hidden tests:**
```python
pairs = [("pass", "pass")] * 6 + [("pass", "fail")] * 2 + [("fail", "fail")] * 2 + [("fail", "pass")] * 2
result = agreement_stats(pairs)
assert result is not None, "agreement_stats should return a dict"
assert result["n"] == 12 and result["skipped"] == 0, f"12 usable pairs, none skipped: got {result}"
assert abs(result["tpr"] - 6 / 8) < 1e-9, f"TPR: of the 8 the person passed, the grader passed 6: got {result['tpr']}"
assert abs(result["tnr"] - 2 / 4) < 1e-9, f"TNR: of the 4 the person failed, the grader failed 2: got {result['tnr']}"
assert abs(result["accuracy"] - 8 / 12) < 1e-9, f"accuracy: 8 of 12 agree: got {result['accuracy']}"
# chance agreement: both pass (8/12 x 8/12) + both fail (4/12 x 4/12) = 80/144
expected_kappa = (8 / 12 - 80 / 144) / (1 - 80 / 144)
assert abs(result["kappa"] - expected_kappa) < 1e-9, \
    f"kappa: (agreement - chance) / (1 - chance), chance from each side's own pass rate: expected {expected_kappa:.4f}, got {result['kappa']}"

skipped = agreement_stats(pairs + [("pass", "unclear"), ("unsure", "fail"), ("fail", None)])
assert skipped["n"] == 12 and skipped["skipped"] == 3, f"pairs with anything but pass or fail are skipped and counted: got {skipped}"
assert abs(skipped["tpr"] - 6 / 8) < 1e-9, "skipped pairs don't change the rates"

everything = agreement_stats([("pass", "pass")] * 9 + [("fail", "pass")])
assert everything["tnr"] == 0 and abs(everything["accuracy"] - 0.9) < 1e-9, \
    "a grader that passes everything: 90% accuracy here, and a TNR of 0"
assert abs(everything["kappa"]) < 1e-9, f"and no agreement beyond chance: kappa 0, got {everything['kappa']}"
assert agreement_stats([("pass", "pass")] * 3)["tnr"] is None, "with no person-failed runs, TNR is None, not 0 or an error"
assert agreement_stats([("pass", "pass")] * 3)["kappa"] is None, "when chance agreement is certain, kappa is undefined: None"
assert agreement_stats([])["n"] == 0, "no pairs at all"
```

**Hint (shown on request):** Filter first, then split the usable pairs by the person's verdict: TPR comes from the person's passes, TNR from the person's fails. Chance agreement uses each side's own pass share, so compute the person's and the grader's separately.

**Reference solution:**
```python
def agreement_stats(pairs: list[tuple[str, str]]) -> dict:
    """How a grader's verdicts compare with a person's. pairs are (person, grader), each "pass" or "fail"; pairs with
    anything else are skipped and counted."""
    usable = [(p, g) for p, g in pairs if p in ("pass", "fail") and g in ("pass", "fail")]
    n = len(usable)
    if not n:
        return {"n": 0, "skipped": len(pairs), "tpr": None, "tnr": None, "accuracy": None, "kappa": None}
    passes = [g for p, g in usable if p == "pass"]
    fails = [g for p, g in usable if p == "fail"]
    agreed = sum(p == g for p, g in usable) / n
    person_pass = len(passes) / n
    grader_pass = sum(g == "pass" for _, g in usable) / n
    by_chance = person_pass * grader_pass + (1 - person_pass) * (1 - grader_pass)
    return {"n": n, "skipped": len(pairs) - n,
            "tpr": passes.count("pass") / len(passes) if passes else None,
            "tnr": fails.count("fail") / len(fails) if fails else None,
            "accuracy": agreed,
            "kappa": (agreed - by_chance) / (1 - by_chance) if by_chance < 1 else None}


print(agreement_stats([("pass", "pass"), ("pass", "pass"), ("fail", "pass"), ("fail", "fail"), ("pass", "unclear")]))
```
```
{'n': 4, 'skipped': 1, 'tpr': 1.0, 'tnr': 0.5, 'accuracy': 0.75, 'kappa': 0.5}
```

**Explanation:** TPR and TNR are each computed within one side of the person's labels, so neither moves when the share of passing runs changes, which is what makes them comparable across suites and across versions of an agent. Accuracy mixes the two in proportion to the pass rate. Kappa subtracts the agreement two raters would get just by saying pass as often as they each do; the do-nothing grader agrees 90% of the time in the tests and gets a kappa of 0. Skipping, and counting, the pairs where either side didn't decide keeps an UNCLEAR from being quietly read as a pass or a fail.

---

## The correctness judges, against the reading

```python
for judge in ("gemma", "qwen9b"):
    alone = agreement_stats([(r["reading"], r[judge]) for r in rows])
    # the citation check from Lesson 5, applied first: a run citing a source no tool returned fails
    combined = agreement_stats([(r["reading"], r[judge] if r["citations_ok"] else "fail") for r in rows])
    for label, s in (("judge alone", alone), ("with the citation check", combined)):
        print(f"{judge:<7} {label:<24} TPR {s['tpr']:.0%}  TNR {s['tnr']:.0%}  accuracy {s['accuracy']:.0%}  kappa {s['kappa']:.2f}")
```
```
gemma   judge alone              TPR 97%  TNR 53%  accuracy 84%  kappa 0.57
gemma   with the citation check  TPR 97%  TNR 87%  accuracy 94%  kappa 0.85
qwen9b  judge alone              TPR 89%  TNR 60%  accuracy 80%  kappa 0.50
qwen9b  with the citation check  TPR 89%  TNR 87%  accuracy 88%  kappa 0.72
```
*(runs live, shows output — read-only demo snippet, not graded; `agreement_stats` is the exercise's reference version)*

On their own, both judges pass nearly everything the reading passed and catch only about half of what it failed. Most of those missed failures are runs the reading failed for a wrong citation, which the correctness judge was never asked about. Put Lesson 5's citation check in front of the judge, as Lesson 6's combined grader does, and Gemma's TNR rises from 53% to 87%, with its TPR unchanged. That's the code-and-judge split doing what it was meant to: each misses different failures.

These are 50 runs, so every figure is uncertain: 15 failures means a single run moves the TNR by almost seven points. The rates also measure the whole grader against the reading's whole-run verdict, not the judge against its own question, which is what the labels in the next concepts are for.

---

## Two readers, before and after a standard

Kappa's natural use is two people labelling the same things. Lesson 3 had exactly that: Simar and Claude both read 15 traces, first with no written standard and then after one was written.

```python
def verdicts(name: str, key: str = "labels") -> dict:
    data = json.loads(Path(f"/data/eval/reading/{name}.json").read_text(encoding="utf-8"))
    return {label["trial_id"]: label["verdict"] for label in data[key]}


simar_v1, simar_v2, claude = verdicts("labels-simar"), verdicts("labels-simar-v2"), verdicts("labels-claude")
for label, simar in (("before the written standard", simar_v1), ("after Simar's re-review", simar_v2)):
    s = agreement_stats([(simar[t], claude[t]) for t in sorted(simar.keys() & claude.keys())])
    print(f"{label:<28} {s['n']} traces both read ({s['skipped']} skipped): agreement {s['accuracy']:.0%}, kappa {s['kappa']:.2f}")
```
```
before the written standard  14 traces both read (1 skipped): agreement 64%, kappa 0.19
after Simar's re-review      14 traces both read (1 skipped): agreement 86%, kappa 0.70
```
*(runs live, shows output — read-only demo snippet, not graded; the skipped trace is one Claude marked "unsure")*

Before the standard, the readers agreed on 9 of 14 traces, and a kappa of 0.19 says that's barely better than chance once their different pass rates are accounted for. After Simar's re-review against the standard, they agree on 12 of 14, a kappa of 0.70. The two readers didn't get better at reading. They started answering the same question. A judge needs the same thing, and the labels it's measured against do too: a rubric and a labelling instruction that ask exactly what the judge is asked.

---

## Quiz cards

> **Q1.** A grader that passes every run agrees with the reading on 70% of these runs. Why is that misleading?
> - It catches none of the failures ✅
> - The reading itself is only 70% accurate
> - Agreement can't be computed on 50 runs
> - The grader was shown the wrong answers
>
> *Explanation: Accuracy rises with the share of runs that pass, so a grader that does nothing looks good on a suite that mostly passes. Its TNR, 0%, shows it never catches a failure.*

> **Q2.** What does a judge's TNR measure?
> - Of the runs a person failed, how many it failed ✅
> - Of the runs the judge failed, how many a person failed
> - Of all the runs, how many the judge failed
> - Of the runs a person passed, how many it failed
>
> *Explanation: TNR is computed within the runs the person failed, so it says how often the judge catches a real failure. The second option is a different measure, the judge's precision on fails.*

> **Q3.** Gemma's TNR against the reading rose from 53% to 87% once the citation check ran first. Why?
> - Most failures it missed were wrong citations ✅
> - The citation check made Gemma reread the answers
> - The reading changed its labels after the check
> - The check removed the hardest runs from the count
>
> *Explanation: The reading failed runs for citing a source no tool returned; the correctness judge was only asked whether the answer matches the reference. Code catches the citation failures, and the two together miss far fewer.*

> **Q4.** Two readers went from a kappa of 0.19 to 0.70 on the same traces. What changed?
> - They asked the same question ✅
> - They read the traces more slowly
> - They read fewer traces the second time
> - One reader copied the other's labels
>
> *Explanation: Before the written standard, each reader judged by their own idea of passing. The standard made the question the same for both, which is what agreement depends on.*

> **Q5.** Why is comparing the correctness judge with Lesson 3's reading not a fair test of the judge?
> - They answer different questions ✅
> - The reading was done by a model, not a person
> - The reading never failed any question runs
> - The judge saw a different version of each run
>
> *Explanation: The reading judged whole runs by the standard, including citations; the judge was asked only whether the answer matches the reference. The labels in the rest of this lesson ask the judge's own question.*
