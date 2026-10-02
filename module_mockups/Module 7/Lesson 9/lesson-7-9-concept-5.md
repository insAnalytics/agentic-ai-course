# Module 7, Lesson 9 — Concept 5: A piece that doesn't earn its place

> **Note for the site build:** both demos start from `LOAD_ABLATIONS`. The first also needs concept 1's reference `paired_difference` (with `pass_rate`) loaded without showing it.

---

## Module 4's question

[Module 4 assembled the agent's context](→ Module 4, the assembling the context step lesson, the what to leave out concept) piece by piece, and ended with the question every choice depended on: whether any of it makes the agent better at its task. It left [recall weights and decay rates](→ Module 4, the forgetting, aging, and retrieval quality lesson, the scoring what to recall concept) as tuning choices to be set by measurement. This registry agent has no memory to tune, so memory itself can't be tested here; the method can, on a piece of context the agent really uses.

Every source `search_docs` returns carries two labels the course added: the document's date and its type, such as `date="2026-08-18" type="official"`. They were meant to help the agent prefer current, official sources over old or unofficial ones, which is what several of its failures came down to. Phase 5 ran every task with those two labels removed, and nothing else changed.

---

## The result

```python
for group in (None, "question", "other", "lost write", "planted", "broken result"):
    base, unlabelled = passes("baseline", group), passes("no-labels", group)
    mean, low, high = paired_difference(base, unlabelled)
    print(f"{group or 'all tasks':<14} {len(base):>3} tasks   no labels minus baseline {mean:+.1%} ({low:+.1%} to {high:+.1%})")
```
```
all tasks      125 tasks   no labels minus baseline +3.0% (+0.5% to +5.9%)
question        58 tasks   no labels minus baseline +1.7% (-1.7% to +5.5%)
other           50 tasks   no labels minus baseline +4.0% (-0.8% to +8.8%)
lost write       8 tasks   no labels minus baseline +2.5% (-5.0% to +10.0%)
planted          6 tasks   no labels minus baseline +6.7% (+0.0% to +13.3%)
broken result    3 tasks   no labels minus baseline +6.7% (+0.0% to +20.0%)
```
*(runs live, shows output — read-only demo snippet, not graded; `paired_difference` is concept 1's reference version)*

Without the labels the agent did slightly better, by about three points, with an interval that just stays above zero. Read as it stands, that would say the labels hurt. Two things argue against reading it that way.

- **It's at the edge of the noise.** Two runs of the identical agent differed by an interval of about −2 to +1 points ([concept 1](→ Module 7, the does this piece help? ablations lesson, the one piece on and off concept, the same two batches, paired)). This one is +0.5 to +5.9.
- **It's one comparison of many.** This lesson compared three variants with the baseline, each broken into six groups: eighteen intervals. At 95% each, about one would exclude zero by chance alone even if nothing had any effect. A single borderline interval among eighteen is the kind of result that disappears on a rerun.

---

## What a gain is made of

Before believing a difference, look at the tasks that produced it:

```python
def cited_and_passed(condition: str, task: str) -> str:
    rows = results["conditions"][condition][task]
    return f"{sum(r['pass'] for r in rows)} of {len(rows)} passed, {sum(r['cited'] for r in rows)} cited a source"


dev = [t for t, info in results["tasks"].items() if info["split"] == "dev"]
moves = sorted(dev, key=lambda t: sum(passes("no-labels")[t]) - sum(passes("baseline")[t]))
for task in moves[-3:][::-1] + moves[:2]:
    print(f"{task:<4} baseline: {cited_and_passed('baseline', task):<30} no labels: {cited_and_passed('no-labels', task)}")
```
```
s06  baseline: 0 of 5 passed, 4 cited a source no labels: 4 of 5 passed, 2 cited a source
a19  baseline: 1 of 5 passed, 1 cited a source no labels: 4 of 5 passed, 0 cited a source
q07  baseline: 1 of 5 passed, 1 cited a source no labels: 4 of 5 passed, 2 cited a source
q37  baseline: 5 of 5 passed, 1 cited a source no labels: 2 of 5 passed, 0 cited a source
q27  baseline: 5 of 5 passed, 5 cited a source no labels: 4 of 5 passed, 5 cited a source
```
*(runs live, shows output — read-only demo snippet, not graded; the three development tasks that gained most without labels, and the two that lost most)*

The biggest mover, s06, is Lesson 4's vendor-citation task, which fails when the agent cites a vendor document as company policy. Without the labels it passed four times instead of none. But at least two of those four passes cited nothing at all, and the citation check passes an answer with no citations: there's nothing wrong to catch. Part of the gain is the agent citing less, which this grader happens to reward. Across all answers, the share that cited a source barely moved, so it isn't a general change in behaviour either. The other movers go both ways, by amounts the task-level noise can produce.

So the honest conclusion is narrow: **on this suite, the date and type labels make no measurable difference to task success.** It isn't "the labels hurt", and it isn't "the labels help".

---

## Reporting a piece that doesn't earn its place

A null result is a result, and it's worth writing up as carefully as a win:

- **State the effect with its interval and the noise floor beside it,** so a reader can see the difference is within what two identical runs produce.
- **Say what the piece costs.** Each label adds about 35 characters to every source, roughly ten tokens, and searches return several sources, so a few dozen tokens per search, in every run. A piece with no measurable benefit is paying that for nothing on this suite.
- **Say what the suite can't see.** Only two tasks are built on documents that conflict, where a date should matter most, and both came out the same with and without the labels: 5 of 5 and 2 of 5 each time. Two tasks can't show the labels never matter; a suite with more conflicts might. "No effect here" is about this suite, not about labels in general.
- **Decide, and record why.** Removing the labels, keeping them for the cases a future suite might cover, or adding tasks that would test them are all defensible. What isn't defensible is keeping a component on the assumption that it helps, once a fair test has failed to show it.

The same discipline applies to every result in this lesson. Compaction cost this agent a few points for a clear reason; Module 6's layers cost it thirty, mostly through false alarms. Each of those is a finding about these pieces on this agent, measured the same way, and each is the starting point for a better version, not a verdict on the idea.

---

## Quiz cards

> **Q1.** Removing the labels gained about three points, with an interval of +0.5 to +5.9. Why isn't that convincing evidence the labels hurt?
> - It's near the noise, among many comparisons ✅
> - The interval includes zero
> - The labels were removed from only some tasks
> - The judges graded the variant more leniently
>
> *Explanation: Two identical runs differed by up to a couple of points, and eighteen intervals were computed in this lesson, so one borderline result is expected by chance. The interval doesn't quite include zero, which is exactly why the context matters.*

> **Q2.** At least two of s06's four passes without labels cited nothing. Why did those pass?
> - There was nothing to catch ✅
> - The judges rewarded shorter answers
> - Uncited answers were always correct
> - The labels were in the citations
>
> *Explanation: The check fails answers that cite the wrong source. An answer with no citations gives it nothing to fail, so citing less looks like an improvement to this grader.*

> **Q3.** With eighteen 95% intervals and no real effects anywhere, how many would you expect to exclude zero?
> - About one ✅
> - None at all
> - About nine
> - All eighteen
>
> *Explanation: Each interval has about a 5% chance of excluding zero when nothing changed. Eighteen of them make about one such interval expected by chance.*

> **Q4.** What should a write-up of "no measurable effect" include?
> - Interval, noise floor and cost ✅
> - Only the point estimate, to keep it short
> - The tasks where the piece helped most
> - A recommendation to remove the piece
>
> *Explanation: The interval beside the noise floor shows the result is null; the cost shows what the piece spends for it. The decision comes after, with reasons, and may still be to keep it.*

> **Q5.** Why is "no effect here" not the same as "labels don't help"?
> - The suite may not test what they're for ✅
> - The labels were only removed from searches
> - Five trials per task is always too few
> - A null result can't be reported
>
> *Explanation: Only two tasks rest on conflicting documents, where dates should matter most, and they didn't change. Two tasks can't rule out an effect a suite with more conflicts might find.*
