# Module 7, Lesson 9 — Concept 3: Compaction on and off

> **Note for the site build:**
> - New script `scripts/eval/ablation_results.py` (in the zip with this file) writes `public/data/eval/ablations/results.json`: for the baseline and each phase 5 variant, every task's trial results (code checks plus the revised Gemma judges), and per trial what the variant did. Run it, check the output matches the copy in the zip, and commit both. Mount `public/data/eval/ablations/` at `/data/eval/ablations`.
> - Add the setup block below to `evalData.ts` as `LOAD_ABLATIONS`, byte-identical; concepts 3 to 5 start from it. The first demo also needs concept 1's reference `paired_difference` (with `pass_rate`) loaded without showing it.

---

## The question Module 4 left open

[Module 4 built compaction](→ Module 4, the compaction and summarization lesson, the compacting: a summary in, rounds out concept): once a conversation grows past a threshold, replace its older rounds with a summary and keep going. It promised two tests. The first, whether a summary keeps what the task needs, was [Lesson 5's summarizer test](→ Module 7, the code graders lesson, the a component test: the summarizer concept), which found even careful summaries dropping the details of what had failed. The second is the one only a whole-task run can answer: does the agent still finish its tasks as well after compaction as without it?

That's an ablation. The phase 5 runs gave the registry agent compaction and ran every task again, with the same model, settings, step limit and 5 trials per task as the baseline. One choice has to be stated up front: this agent's runs are short, averaging under four model calls, so a realistic threshold would almost never trigger. The test forces compaction instead, once a run passes three rounds, keeping the newest round and summarizing the rest with Module 4's instructions. It tests what compaction does to the runs it touches, not how often a production threshold would touch them.

```python
import json
from pathlib import Path

ABLATIONS = Path("/data/eval/ablations")
results = json.loads((ABLATIONS / "results.json").read_text(encoding="utf-8"))


def passes(condition: str, group: str | None = None) -> dict[str, list[bool]]:
    """Each task's trial results under one condition, optionally only the tasks in one group."""
    return {task: [row["pass"] for row in rows] for task, rows in results["conditions"][condition].items()
            if group is None or results["tasks"][task]["group"] == group}
```
*(defined once here and already loaded for every demo in this lesson's remaining concepts)*

---

## What it cost

```python
for group in (None, "question", "other", "lost write", "planted", "broken result"):
    base, compacted = passes("baseline", group), passes("compaction", group)
    mean, low, high = paired_difference(base, compacted)
    print(f"{group or 'all tasks':<14} {len(base):>3} tasks   compaction minus baseline {mean:+.1%} ({low:+.1%} to {high:+.1%})")
```
```
all tasks      125 tasks   compaction minus baseline -3.8% (-7.7% to +0.0%)
question        58 tasks   compaction minus baseline -5.9% (-12.1% to -0.3%)
other           50 tasks   compaction minus baseline -0.4% (-5.6% to +4.4%)
lost write       8 tasks   compaction minus baseline -12.5% (-30.0% to +2.5%)
planted          6 tasks   compaction minus baseline +3.3% (+0.0% to +10.0%)
broken result    3 tasks   compaction minus baseline -13.3% (-20.0% to +0.0%)
```
*(runs live, shows output — read-only demo snippet, not graded; a trial passes if it reached an answer, passed its code checks, and passed every revised Gemma judge that graded it; `paired_difference` is concept 1's reference version)*

Across the whole suite, compaction cost about four points, with an interval that just reaches zero. On Module 5's questions, the tasks most likely to need several searches, it cost about six, with an interval that stays below zero. The registry tasks barely moved; most of them finish within three rounds and were never compacted. The small groups at the bottom have intervals too wide to say anything.

---

## Why it cost that

```python
for condition in ("baseline", "compaction"):
    rows = [row for trials in results["conditions"][condition].values() for row in trials]
    stopped = [row for row in rows if row["stopped"]]
    line = (f"{condition:<10} {len(rows)} runs: {len(stopped)} stopped by the step limit, "
            f"{sum(row['repeated_calls'] for row in stopped)} repeated tool calls among them")
    if condition == "compaction":
        compacted = [row for row in rows if row["compacted"]]
        line += (f"; {len(compacted)} runs compacted, {sum(row['stopped'] for row in compacted)} of them stopped, "
                 f"{sum(row['pass'] for row in compacted) / len(compacted):.0%} of them passed")
    print(line)
```
```
baseline   625 runs: 19 stopped by the step limit, 14 repeated tool calls among them
compaction 625 runs: 60 stopped by the step limit, 35 repeated tool calls among them; 156 runs compacted, 60 of them stopped, 52% of them passed
```
*(runs live, shows output — read-only demo snippet, not graded)*

The step limit tells the story. Without compaction, 19 runs stopped at the limit; with it, 60, every one of them a compacted run. And those runs repeated tool calls they'd already made, 35 times between them. That's what [Lesson 5's summarizer test](→ Module 7, the code graders lesson, the a component test: the summarizer concept, what even a careful summary loses) predicted: summaries keep the decision and lose the detail of what was tried and failed, so after compaction the agent tries it again, and runs out of steps doing it.

The 52% pass rate among compacted runs isn't the effect of compaction on its own. The runs long enough to be compacted are the hard ones, which would pass less often anyway. That's exactly why an ablation compares each task with itself rather than compacted runs with the rest: the paired difference above is the effect.

---

## What it means for the agent

- **For this agent, compaction is a cost, not a help.** Its runs fit comfortably in the context window, so compaction buys nothing and loses some of what the agent knew. On an agent whose runs outgrow the window, the trade would be different: there, the choice is between a summary and failing outright.
- **The fix is in the summary, and the test says where.** The summarizer test found failure details dropped; this run shows the agent repeating work because of it. Instructions that keep a list of what was already tried, or [keeping that list in state outside the summary](→ Module 4, the compaction and summarization lesson, the when a summary loses something concept, don't make the summary carry what code can derive), are the candidates, and each would be a new variant for the same ablation.
- **Both of Module 4's tests are needed.** The summarizer test found what summaries lose; only the whole-task run showed what losing it costs.

---

## Quiz cards

> **Q1.** Why was compaction forced after three rounds instead of set at a realistic threshold?
> - This agent's runs are too short to reach one ✅
> - Realistic thresholds would make the runs too slow
> - Three rounds is the standard compaction threshold
> - Forced compaction removes the need for a baseline
>
> *Explanation: Runs average under four model calls, so a realistic threshold would almost never trigger and the ablation would measure nothing. Forcing it tests what compaction does to the runs it touches.*

> **Q2.** With compaction, runs stopped by the step limit went from 19 to 60, all of them compacted. What does that point to?
> - Summaries lost what had been tried ✅
> - Compaction makes each model call slower
> - The step limit counts summary calls as steps
> - Compacted runs answer different questions
>
> *Explanation: The stopped runs repeated tool calls they'd already made. Lesson 5 found summaries drop the details of failed attempts; without them, the agent tries again and runs out of steps.*

> **Q3.** Compacted runs passed 52% of the time. Why isn't that the effect of compaction?
> - Only the long, hard runs were compacted ✅
> - Compacted runs used a different model
> - The judges graded compacted runs more strictly
> - The baseline also compacted some runs
>
> *Explanation: Runs long enough to be compacted are the harder ones, which pass less often anyway. Comparing each task with itself, with and without compaction, separates the effect from that selection.*

> **Q4.** On this agent, compaction cost about four points across the suite. When might it help instead?
> - When runs outgrow the context window ✅
> - When the summary is written by a larger model
> - When the step limit is set higher
> - When tasks are mostly single questions
>
> *Explanation: Here runs fit easily, so compaction only loses information. For an agent whose runs would overflow the window, the alternative to a summary is failing, and the trade changes.*

> **Q5.** Why are both of Module 4's tests needed, the summarizer test and the whole-task run?
> - One finds what's lost; the other, what that costs ✅
> - The summarizer test is cheaper, so it replaces the other
> - The whole-task run can't detect missing details
> - They measure the same thing with different models
>
> *Explanation: The component test showed summaries dropping failure details. Only the whole-task ablation showed the consequence: repeated work and more runs stopped at the step limit.*
