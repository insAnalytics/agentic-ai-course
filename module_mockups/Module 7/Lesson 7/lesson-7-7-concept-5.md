# Module 7, Lesson 7 — Concept 5: Set F, kept

> **Note for the site build:**
> - `scripts/eval/judge_measure_data.py` (updated, in the zip with this file) now also writes `premise_strata` and `premise_judged` into `measure.json`. Run it, check the output matches the copy in the zip, and commit both; concepts 3 and 4's demos give the same output with the new file.
> - The first demo defines `data`, `strata` and `judged`; carry those, without the printing, into the other two demos' hidden setup. The second also needs the exercise's reference `stratified_rate`.

---

## The promise

[Module 6 asked the 4B questions built on a false assumption](→ Module 6, the verifying an answer against its sources lesson, the questions built on a false premise concept), and graded the replies by the `PREMISE: FALSE` line they ended with. Reading them showed the line measured something else, and Module 6 promised its set F replies would be graded properly here, by a validated judge or by reading. [Lesson 6](→ Module 7, the model graders lesson, the grading set f's premise replies concept) graded all 1,600 with a judge and showed where that judge couldn't yet be trusted. This concept finishes the job, with Simar's labels.

Here are the two automatic measures side by side, the marker and the revised judge:

```python
data = json.loads((JUDGE_LABELS / "measure.json").read_text(encoding="utf-8"))
strata, judged = data["premise_strata"], data["premise_judged"]["gemma_v2"]
for premise, good in (("false", "handled the false assumption"), ("true", "left the true assumption alone")):
    total = sum(n for s, n in strata.items() if s.startswith(premise))
    marker_good = sum(n for s, n in strata.items() if s.startswith(premise) and (" rejected " in s) == (premise == "false"))
    print(f"{premise}-premise replies ({total}), share that {good}:")
    print(f"  the marker line:   {marker_good / total:.1%}")
    print(f"  the revised judge: {judged[premise]['pass'] / total:.1%}")
```
```
false-premise replies (800), share that handled the false assumption:
  the marker line:   37.1%
  the revised judge: 100.0%
true-premise replies (800), share that left the true assumption alone:
  the marker line:   92.6%
  the revised judge: 94.6%
```
*(runs live, shows output — read-only demo snippet, not graded; Gemma 4 31B with the revised premise rubric)*

On false premises they couldn't disagree more: the marker says the model handled about a third, the judge says all of them. On true premises they're close. Either could be wrong, and the labels decide.

---

## From labels to a rate

Simar labelled 20 premise replies, and they weren't drawn at random: they were chosen within strata, by premise, by the marker's outcome and by the judge's first verdict, so that rare kinds of reply were labelled as well as common ones. That means the plain share of labels that passed would be wrong as an estimate for all 1,600. A stratum of 5 replies has as many labels as one of 501.

The fix is to weight: work out the pass share within each labelled stratum, multiply it by how many replies the stratum holds, and add up. That's a stratified estimate, the same idea surveys use when they sample some groups more heavily than others.

---

## Applied sandbox exercise
*(graded — estimate a population's pass rate from labels drawn within strata)*

**Task shown to learner:**

Write `stratified_rate(sizes, labels)`. `sizes` maps each stratum to how many items it holds; `labels` maps a stratum to the labels given to items drawn from it. Ignore labels other than `"pass"` and `"fail"`. Return a tuple:

- the estimate: each stratum's pass share among its usable labels, weighted by its size, summed, and divided by the total size of the strata that have usable labels; `None` if none do
- the covered share: the total size of those strata, as a share of all items (0.0 if there are none)

**Starter code:**
```python
def stratified_rate(sizes: dict[str, int], labels: dict[str, list[str]]) -> tuple[float | None, float]:
    """The pass rate over the whole population, from labels drawn within strata: each labelled stratum's pass share,
    weighted by its size. Returns the estimate over the strata that have usable labels, and the share of the
    population those strata cover. Labels other than "pass" and "fail" are ignored."""
    # your code here


print(stratified_rate({"common": 90, "rare": 10}, {"common": ["pass", "pass", "fail"], "rare": ["fail", "fail"]}))
```

**Hidden tests:**
```python
result = stratified_rate({"common": 90, "rare": 10}, {"common": ["pass", "pass", "fail"], "rare": ["fail", "fail"]})
assert result is not None, "stratified_rate should return (estimate, covered share)"
estimate, covered = result
assert abs(estimate - (90 * 2 / 3 + 10 * 0) / 100) < 1e-9, \
    f"weight each stratum's pass share by its size: (90 x 2/3 + 10 x 0) / 100 = 0.6, got {estimate}"
assert covered == 1.0, f"both strata have labels, so they cover everything: got {covered}"
naive = 2 / 5
assert abs(estimate - naive) > 0.1, "the weighted estimate differs from the plain share of labels that passed"

estimate, covered = stratified_rate({"a": 50, "b": 30, "c": 20}, {"a": ["pass"], "b": ["fail", "pass"]})
assert abs(estimate - (50 * 1 + 30 * 0.5) / 80) < 1e-9, f"strata without labels are left out of the estimate: got {estimate}"
assert abs(covered - 0.8) < 1e-9, f"and the covered share says how much they left out: 80 of 100, got {covered}"

estimate, covered = stratified_rate({"a": 10, "b": 10}, {"a": ["pass", "unclear"], "b": ["unclear"]})
assert estimate == 1.0 and covered == 0.5, \
    f"UNCLEAR labels are ignored, and a stratum with only UNCLEAR counts as unlabelled: got {(estimate, covered)}"
assert stratified_rate({"a": 10}, {}) == (None, 0.0), "with no usable labels at all, there's no estimate"
assert stratified_rate({}, {}) == (None, 0.0), "an empty population"
```

**Hint (shown on request):** Loop over `sizes`, not `labels`: every stratum counts towards the total, but only the ones with usable labels count towards the estimate and the covered share.

**Reference solution:**
```python
def stratified_rate(sizes: dict[str, int], labels: dict[str, list[str]]) -> tuple[float | None, float]:
    """The pass rate over the whole population, from labels drawn within strata: each labelled stratum's pass share,
    weighted by its size. Returns the estimate over the strata that have usable labels, and the share of the
    population those strata cover. Labels other than "pass" and "fail" are ignored."""
    weighted, covered = 0.0, 0
    for stratum, size in sizes.items():
        usable = [label for label in labels.get(stratum, []) if label in ("pass", "fail")]
        if usable:
            weighted += size * usable.count("pass") / len(usable)
            covered += size
    total = sum(sizes.values())
    return (weighted / covered if covered else None), (covered / total if total else 0.0)


print(stratified_rate({"common": 90, "rare": 10}, {"common": ["pass", "pass", "fail"], "rare": ["fail", "fail"]}))
```
```
(0.6, 1.0)
```

**Explanation:** In the example, 3 of 5 labels pass, but the common stratum is nine times the size of the rare one, so the population's pass rate is 60%, not 40%. Leaving unlabelled strata out of the estimate, and reporting how much of the population they are, is honest about what the labels can't speak for; filling them in with a guess would hide it.

---

## What the labels say

```python
labels = {}
for row in data["rows"]:
    if row["kind"] == "premise":
        labels.setdefault(row["stratum"], []).append(row["label"])
for premise in ("false", "true"):
    sizes = {s: n for s, n in strata.items() if s.startswith(premise)}
    estimate, covered = stratified_rate(sizes, labels)
    print(f"{premise}-premise: from Simar's labels, {estimate:.1%} handled correctly, over {covered:.1%} of the replies")
    for stratum, size in sorted(sizes.items(), key=lambda kv: -kv[1]):
        print(f"  {stratum:<22} {size:>4} replies, labels {labels.get(stratum, [])}")
```
```
false-premise: from Simar's labels, 100.0% handled correctly, over 99.9% of the replies
  false answered pass     501 replies, labels ['pass', 'pass', 'pass', 'pass', 'pass']
  false rejected pass     297 replies, labels ['pass', 'pass']
  false answered fail       1 replies, labels ['pass']
  false no_marker pass      1 replies, labels []
true-premise: from Simar's labels, 95.5% handled correctly, over 99.4% of the replies
  true answered pass      690 replies, labels ['pass']
  true answered fail       46 replies, labels ['fail', 'fail', 'pass', 'pass', 'pass']
  true rejected fail       34 replies, labels ['fail', 'pass']
  true rejected pass       25 replies, labels ['unclear', 'pass', 'pass', 'pass']
  true no_marker fail       5 replies, labels []
```
*(runs live, shows output — read-only demo snippet, not graded; Simar's labels after re-review; UNCLEAR labels are ignored)*

- **False premises: handled every time.** Every label, in every stratum, is a pass, including the 501 replies the marker counted as going along with the assumption. They correct it by answering from what the sources actually say. The marker's 37% was measuring whether the model wrote a line, not whether it was fooled.
- **True premises: left alone about 95% of the time.** The failures sit where you'd expect, among replies the marker or the judge had flagged, and the labels split there. Some replies do reject a true assumption; some only used the marker to say something else.
- **The biggest stratum has the fewest labels.** The 690 true-premise replies the marker and the judge both passed carry one label between them. The estimate leans on that stratum being as clean as it looks, which the judge agrees with but the labels can barely test.

---

## How far the judge can now be trusted

```python
rows = data["rows"]


def rates(rows: list[dict], key: str) -> str:
    usable = [r for r in rows if r["label"] in ("pass", "fail") and not r["excluded"]]
    passes = [r for r in usable if r["label"] == "pass"]
    fails = [r for r in usable if r["label"] == "fail"]
    return (f"TPR {sum(r[key] == 'pass' for r in passes)}/{len(passes)}  "
            f"TNR {sum(r[key] == 'fail' for r in fails)}/{len(fails)}")


for split in ("dev", "test"):
    premise_rows = [r for r in rows if r["kind"] == "premise" and r["split"] == split]
    print(f"{split:<5} phase 3 rubric {rates(premise_rows, 'gemma_v1')}   revised {rates(premise_rows, 'gemma_v2')}")
```
```
dev   phase 3 rubric TPR 7/12  TNR 0/0   revised TPR 11/12  TNR 0/0
test  phase 3 rubric TPR 4/4  TNR 3/3   revised TPR 4/4  TNR 2/3
```
*(runs live, shows output — read-only demo snippet, not graded)*

On the premise question, the judge agrees with Simar on every pass it was tested on, and on two of the three test failures. The development set had no failures left after re-review. That's enough to say the judge and the labels tell the same story about false premises, and not enough to put a tight number on how often the judge misses a wrongly rejected true premise: three test failures can't.

So the set F promise is kept this way:

- **By reading,** for the rates themselves: Simar's labels, weighted by stratum, put false-premise handling at essentially 100% and true-premise handling at about 95%.
- **By a judge validated as far as its labels go,** which agrees with that picture. Its remaining uncertainty is stated rather than hidden.
- **The marker's numbers are retired.** On false premises they understated the model by almost two-thirds. Module 6's own reading had pointed that way; the labels confirm it.

---

## Quiz cards

> **Q1.** On false-premise replies, the marker said 37% were handled and the judge said 100%. What did the labels show?
> - Every labelled reply was handled ✅
> - About a third were handled, as the marker said
> - Half were handled, between the two measures
> - None of the replies could be labelled
>
> *Explanation: Every one of Simar's labels on false-premise replies is a pass, in every stratum, including the replies the marker counted as accepting the assumption. The marker measured whether the line was written.*

> **Q2.** Why can't the plain share of passing labels stand for all 1,600 replies?
> - The labels were drawn unevenly across strata ✅
> - Some labels were UNCLEAR and had to be dropped
> - Labels are always stricter than the replies deserve
> - The replies were labelled in a random order
>
> *Explanation: A 5-reply stratum had as many labels as a 501-reply one. Weighting each stratum's pass share by its size corrects for that.*

> **Q3.** In stratified_rate's example, 3 of 5 labels pass. Why is the estimate 60%, not 40%?
> - The larger stratum passes more often ✅
> - UNCLEAR labels were counted as passes
> - The covered share was below 100%
> - Each stratum counts equally in the estimate
>
> *Explanation: The common stratum, 90 items, passes 2 of 3 labels; the rare one, 10 items, passes none. Weighted by size, that's 60% of the population.*

> **Q4.** The 690 true-premise replies both the marker and the judge passed have one label. What does that mean for the 95% estimate?
> - It leans on a barely tested stratum ✅
> - It's exact, since that stratum is the largest
> - It should leave that stratum out entirely
> - It's too low, since one label can't fail
>
> *Explanation: The estimate weights that stratum by its size, using a single label's verdict. The judge agrees it's clean, but the labels can hardly confirm it.*

> **Q5.** How is the set F promise kept in the end?
> - By reading, with a judge that agrees ✅
> - The marker's numbers, corrected for the judge's errors
> - The judge alone, now validated on all its strata
> - Module 6's reading of 30 replies, scaled up to 1,600
>
> *Explanation: The rates come from Simar's labels, weighted by stratum. The judge tells the same story where its labels can check it, and its remaining uncertainty is stated.*
