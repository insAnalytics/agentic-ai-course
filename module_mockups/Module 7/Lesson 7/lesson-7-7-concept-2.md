# Module 7, Lesson 7 — Concept 2: Labels from people

> **Note for the site build:**
> - Commit `public/data/eval/judge-labels/labels-judges-simar-v2.json` (in the zip with this file): Simar's labels with two development-split labels re-reviewed, the first labels kept in its `revisions` list. The first-pass file stays as it is.
> - Both demos start from `LOAD_JUDGE_LABELS`. The second demo needs nothing from the first.
> - This page has one section to be completed later, marked below: the result of Simar's relabelling, due three weeks after the first pass. Leave its placeholder paragraph in until then.

---

## What the judges are measured against

[The first concept](→ Module 7, the checking the graders lesson, the a judge is a measurement concept) measured the correctness judges against Lesson 3's reading, and had to admit the reading asked a different question. A judge has to be measured against labels on its own question. This module's are 100 labels by Simar, the course's author, given for that purpose:

- **Blind.** The labelling page showed the rubric and exactly what the judge had been shown, and nothing else: no judge verdicts, no hint of how the item was chosen.
- **The judge's question.** Each item asked what its judge was asked, with the same rubric. Correctness items had one extra control, a box to say the reference answer itself looked wrong, kept separate from the verdict.
- **Chosen to include disagreements.** Within each judge question, items were drawn in proportion to how the two judges had decided, so the set holds runs both judges passed, both failed, and the ones they split on. That's right for measuring error rates, and it means the 100 aren't a sample of how often runs pass.
- **Not seen before.** Runs Lesson 3's reading had already labelled were left out, so earlier verdicts couldn't be remembered.
- **Split before anyone looked.** Each item was assigned to development or test when the set was built, alternating within each kind of item.

```python
import json
from pathlib import Path

JUDGE_LABELS = Path("/data/eval/judge-labels")


def load_vs_reading() -> list[dict]:
    """The 50 question runs Lesson 3's reading labelled, with the reading's verdict, both judges' correctness
    verdicts, and whether every citation was to a source a tool returned."""
    return json.loads((JUDGE_LABELS / "vs-reading.json").read_text(encoding="utf-8"))["rows"]
```
*(defined once at the start of this lesson and already loaded)*

```python
from collections import Counter
from datetime import datetime
from statistics import median

items = {i["item_id"]: i for i in json.loads((JUDGE_LABELS / "items.json").read_text(encoding="utf-8"))["items"]}
first = json.loads((JUDGE_LABELS / "labels-judges-simar.json").read_text(encoding="utf-8"))
labels = first["labels"]

print(f"{len(labels)} items labelled, {sum(bool(l['note']) for l in labels)} with a note, "
      f"{sum(l.get('reference_disputed', False) for l in labels)} disputing the reference")
for kind, verdicts in sorted(Counter((items[l["item_id"]]["kind"], l["verdict"]) for l in labels).items()):
    print(f"  {kind[0]:<14} {kind[1]:<8} {verdicts}")
times = sorted(datetime.fromisoformat(l["labelled_at"].replace("Z", "+00:00")) for l in labels)
gaps = [(b - a).total_seconds() for a, b in zip(times, times[1:]) if (b - a).total_seconds() < 15 * 60]
print(f"median time per item: {median(gaps) / 60:.1f} minutes (gaps over 15 minutes counted as breaks)")
```
```
100 items labelled, 11 with a note, 2 disputing the reference
  broken_result  fail     4
  broken_result  pass     5
  correctness    fail     14
  correctness    pass     31
  false_report   fail     6
  false_report   pass     3
  planted        fail     7
  premise        fail     5
  premise        pass     14
  premise        unclear  1
  relevance      fail     7
  relevance      pass     3
median time per item: 0.9 minutes (gaps over 15 minutes counted as breaks)
```
*(runs live, shows output — read-only demo snippet, not graded; Simar's first-pass labels)*

A median of under a minute an item covers a wide range: a relevance check takes seconds, and a set F item with four sources takes several minutes. The whole set took about three and three-quarter hours from first label to last. That's the cost Anthropic's guide has in mind when it says to spend systematic human grading mainly on calibrating the automated graders, rather than on grading runs one by one.

---

## Labels turn up problems with tasks too

The reference-dispute box was used twice, both on the same question, q19, which asks how to roll back a model migration. The reference answer said you can't roll back to claude-legacy. Simar's note pointed out that the question never mentions claude-legacy: a general answer, pausing the agent and telling its users, is what the documents give for any rollback. The documents bear that out, so q19's reference was changed to accept the documented procedure, with the first one kept, and its labelled items were left out of the test measurement because the judge had graded them against a reference that no longer stands.

It's Lesson 4's rule again, found by a different route: when a task fails good behaviour, fix the task. A person labelling with care is often the first to notice.

---

## People drift too

"Who Validates the Validators?" (Shankar et al., UIST 2024) studied people grading model outputs to build evaluation criteria, and found what they called criteria drift: people's criteria change as they grade, because seeing outputs is part of how they work out what they want. The criteria aren't fixed in advance and then applied; grading shapes them.

This module has seen it three times. Lesson 3's two readers agreed on 9 of 15 traces before the standard was written down. The same reader passed b/a13/1 in Lesson 3's re-review, then had to decide it again here, and now the false-report rubric says what he decided. And after the development check showed the judges disagreeing with two of his labels, Simar re-reviewed both:

```python
revised = json.loads((JUDGE_LABELS / "labels-judges-simar-v2.json").read_text(encoding="utf-8"))
for change in revised["revisions"]:
    print(f"{change['item_id']}: {change['first_verdict']} -> pass")
    print(f"  {change['reason']}")
```
```
premise:v33-true:check_first:6: fail -> pass
  Re-reviewed: a pass. The first label judged whether the reply answered the user's main question, not how it treated the assumption, which is what the rubric asks.
premise:v03-false:allowed:3: fail -> pass
  Re-reviewed: a pass. The reply rejects the false assumption outright; the first label was a slip.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second is drift in its plainest form. The rubric asks how a reply treats the question's assumption; the label answered whether the reply helped the user, which is a better question in general and the wrong one for this judge. The first is an ordinary slip. Both were caught only because the development check put them in front of him again.

That raises the obvious worry: re-reviewing labels after seeing where the judge disagrees could bend them towards the judge. Three things keep it honest here:

- **Only development labels were re-reviewed.** The test labels were never shown next to a judge verdict before the test was measured.
- **The first labels are kept.** Anyone can see what changed and why, and recompute anything with the first pass.
- **Each change had a reason that holds without the judge.** One was a slip anyone would correct, and the other applied the rubric as written.

---

## The same person, three weeks later

Criteria drift has a measurable cousin: how consistently one person labels the same items at different times. Thirty of the 100 items, spread across every judge question, are marked for Simar to label again at least three weeks after the first pass, blind, in a fresh order, with nothing from the first labelling shown. Agreement between the two passes, as kappa, says how much of the noise in the labels is the labeller's own. A judge can't be expected to agree with a person more than that person agrees with themselves.

*[To be completed when the relabelling is done: the two passes' agreement and kappa on the 30 items, and what the disagreements were.]*

---

## Quiz cards

> **Q1.** Why does each labelling item show the rubric and exactly what the judge saw, and nothing else?
> - So the person answers the judge's own question ✅
> - So the labelling goes faster than reading whole runs
> - So the person can check the judge's reasoning
> - So the labels can be used to train the judge
>
> *Explanation: A judge is measured against a person answering the same question from the same material. Showing the judge's verdict would bias the label; showing more of the run would change the question.*

> **Q2.** The labelling set was chosen to include many runs the two judges disagreed on. What can't it tell you?
> - How often runs pass in general ✅
> - How often each judge misses a failure
> - Where the judges disagree with a person
> - Which judge question needs a better rubric
>
> *Explanation: Choosing items by how the judges decided over-represents the hard cases. That's right for measuring each judge's error rates, but the set's pass rate says nothing about the suite's.*

> **Q3.** One label was re-reviewed because it judged whether the reply answered the user's main question. What was wrong with that?
> - It asked about the assumption only ✅
> - The reply had answered the main question
> - Labels can't be changed once they're given
> - The judge had already passed the reply
>
> *Explanation: Whether a reply helps the user is a good question, but not this judge's. Labelling it on different criteria from the rubric is criteria drift, and it would measure the judge against the wrong thing.*

> **Q4.** Which safeguard matters most when re-reviewing labels after seeing where a judge disagrees?
> - Only development labels are re-reviewed ✅
> - The re-review is done by the judge's author
> - Every disagreement leads to a changed label
> - The judge's verdict is shown during the re-review
>
> *Explanation: Re-reviewing after seeing disagreements can bend labels towards the judge. Keeping the test labels untouched until the test is measured, and keeping the first labels, keeps the final measurement honest.*

> **Q5.** Why relabel 30 items after three weeks?
> - To measure how consistent the labeller is ✅
> - To give the judges more examples to learn from
> - To replace the first labels with better ones
> - To check whether the runs have changed since
>
> *Explanation: A person's agreement with themselves sets a ceiling on how well any judge can agree with them. The relabel measures that, blind and in a fresh order.*
