# Module 7, Lesson 5 — Concept 5: A component test: the summarizer

> **Note for the site build:**
> - Mount `public/data/eval/summarizer/` at `/data/eval/summarizer`. Every demo starts from the setup block below, which loads `summarizer-test.json` (the 120 summaries, about 0.9 MB) and `summary-probes.json`.
> - The second demo defines `mentions`, `correct` and `probes` and changes one probe's alternatives; carry those definitions and that change, without its printing, into the third and fourth demos' hidden setup.

---

## The test Module 4 asked for

[Module 4 showed](→ Module 4, the compaction and summarization lesson, the when a summary loses something concept, testing a summary by asking it questions) that a summary can read well and still lose what the task needs, and that the way to find out is to ask the summary questions. It ended with a promise: a test for the summarizer, made of real runs, each compacted and probed, and rerun whenever the summary instructions, the model or the compaction threshold change.

That's a **component test**, as [Lesson 1](→ Module 7, the why agents are hard to grade lesson, the grading one piece on its own concept) described them: one piece of the agent, tested on its own with fixed inputs, cheaper than running whole tasks and precise about which piece is at fault. Research has evaluated summaries this way for a while. QAGS (Wang et al., ACL 2020) asks questions about a summary and checks the answers against the source, and the probes here are a small version of the same idea, with questions whose answers are exact enough for code to grade.

The test, as run for this module:

- **The runs.** The 20 longest dev runs from the baseline, at most two of any one task, each cut after its last tool round.
- **The compaction.** Everything but that last round is summarised, as Module 4's context step does, by the 4B with the agent's own settings, under two sets of instructions: Module 4's careful ones, which list what a summary must keep, and a plain "Summarize the conversation above briefly." Three samples of each.
- **The probes.** Questions about what the replaced rounds established, each answered by the 4B from the summary alone, and graded in code.

---

## The first round measured the probes

The first probes were written by a script, from facts that were easy to pull out of a run: which agent the request named, the model the registry reported, an error code, the number of searches made.

```python
import json
from pathlib import Path

SUMMARIZER = Path("/data/eval/summarizer")
first = json.loads((SUMMARIZER / "summarizer-test.json").read_text(encoding="utf-8"))
second = json.loads((SUMMARIZER / "summary-probes.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo on this page)*

```python
from collections import defaultdict

probes = {trace["trial_id"]: trace["probes"] for trace in first["traces"]}
by_kind = defaultdict(lambda: defaultdict(list))
for result in first["results"]:
    for probe, answer in zip(probes[result["trial_id"]], result["answers"]):
        by_kind[probe["kind"]][result["variant"]].append(answer["correct"])
print("first round, probes written by a script:")
for kind, marks in by_kind.items():
    print(f"  {kind:<10} careful {sum(marks['careful']):>2}/{len(marks['careful']):<3} plain {sum(marks['plain']):>2}/{len(marks['plain'])}")

stale = probes["baseline-b/m05/3"][1]
print(f"\nm05/3: {stale['question']} expected {stale['expected']!r}")
for result in first["results"]:
    if result["trial_id"] == "baseline-b/m05/3":
        print(f"  {result['variant']:<8} answered {result['answers'][1]['answer']!r}")
```
```
first round, probes written by a script:
  tool fact  careful 33/51  plain 31/51
  progress   careful  9/60  plain  7/60
  task       careful 24/24  plain 24/24
  error      careful  8/12  plain  5/12

m05/3: What model did the registry last report for notes_agent? Answer with the model name only. expected 'claude-sonnet'
  careful  answered 'claude-haiku'
  careful  answered 'claude-haiku'
  careful  answered 'claude-haiku'
  plain    answered 'claude-haiku'
  plain    answered 'claude-haiku'
  plain    answered 'claude-haiku'
```
*(runs live, shows output — read-only demo snippet, not graded; real summaries and answers from Qwen3.5-4B)*

The two versions look almost the same, and reading the results showed why: the probes were the problem.

- **Some had the wrong expected answer.** The m05 question above expects claude-sonnet, the model the registry reported when the agent looked it up. But the user then asked for the runbook's model, the agent set claude-haiku, and the registry confirmed it. Every answer is right and every one is marked wrong. Four probes had this flaw.
- **Some had more than one right answer.** Three runs hit two different errors, so "which error code did a tool return?" was ambiguous.
- **One kind asked for something no summary promises.** Neither set of instructions asks a summary to count searches, so the progress probes mostly measured counting.
- **One kind was too easy.** Every summary kept which agent the request was about.

With the flawed probes removed, careful came out 2.9 points ahead, with an interval from 2 points behind to 8 ahead: no detectable difference. It's [Lesson 4's first rule](→ Module 7, the building a task suite lesson, the what makes a good task concept) again, for probes: a probe has to have one right answer, and it has to test what the summary is supposed to do.

---

## The second round: probes from what a summary must keep

The second probes were written by reading the part of each run its summary replaces, three per run, each aimed at something the careful instructions say a summary must keep: the user's request, decisions, exact values, what was tried and failed, and what comes next. The 120 summaries were kept, so only the 4B's answers are new. One probe needed a fix after reading: it accepted "no match" for "what did the search find?", and three answers had said "No matches", "zero results" and "No documentation mentioned this". The demo adds those phrasings in plain sight before grading:

```python
import random
import re


def mentions(text: str, phrase: str) -> bool:
    """Whole words, ignoring case; a number may carry a unit (the same rule as this lesson's matcher)."""
    end = r"(?![0-9]|[.,][0-9])" if phrase[-1].isdigit() else r"(?![\w-])"
    return re.search(rf"(?<![\w-]){re.escape(phrase.lower())}{end}", text.lower()) is not None


def correct(probe: dict, text: str) -> bool:
    """Any one of "any" (if given), and every one of "all"."""
    return ((not probe["any"] or any(mentions(text, p) for p in probe["any"]))
            and all(mentions(text, p) for p in probe["all"]))


probes = second["probes"]
# after reading: these answers said what "no match" says, in words the probe didn't list
probes["baseline-b/a17/0"][2]["any"] += ["no matches", "zero results", "no documentation"]

marks = {"careful": {}, "plain": {}}
for answer in second["answers"]:
    probe = probes[answer["trial_id"]][answer["probe"]]
    marks[answer["variant"]].setdefault(answer["trial_id"], []).append(correct(probe, answer["answer"]))
for variant, by_trace in marks.items():
    flat = [m for ms in by_trace.values() for m in ms]
    print(f"{variant:<8} {sum(flat)} of {len(flat)} probe answers right")

# the difference, with a 95% interval from resampling whole traces
traces = sorted(marks["careful"])
pairs = [(sum(marks["careful"][t]) - sum(marks["plain"][t]), len(marks["careful"][t])) for t in traces]
rng = random.Random(0)
resampled = sorted(sum(d for d, _ in pick) / sum(n for _, n in pick)
                   for pick in (rng.choices(pairs, k=len(pairs)) for _ in range(2000)))
difference = sum(d for d, _ in pairs) / sum(n for _, n in pairs)
print(f"careful minus plain: {difference:+.1%} (95% interval {resampled[50]:+.1%} to {resampled[1949]:+.1%})")
print(f"by trace: careful better on {sum(d > 0 for d, _ in pairs)}, worse on {sum(d < 0 for d, _ in pairs)}, "
      f"the same on {sum(d == 0 for d, _ in pairs)}")
```
```
careful  152 of 180 probe answers right
plain    133 of 180 probe answers right
careful minus plain: +10.6% (95% interval +2.8% to +17.2%)
by trace: careful better on 13, worse on 3, the same on 4
```
*(runs live, shows output — read-only demo snippet, not graded; real answers from Qwen3.5-4B; probes written by reading the runs)*

Now the test separates the two: the careful instructions keep about ten points more of what the task needs, with an interval that stays clear of zero, and they do better on 13 of the 20 runs.

There's a cheaper check alongside it. Instead of asking a model, look for the probed fact in the summary text itself, with the same matcher:

```python
stated = {"careful": [], "plain": []}
for result in first["results"]:
    for probe in probes[result["trial_id"]]:
        stated[result["variant"]].append(correct(probe, result["summary"]))
for variant, marks in stated.items():
    print(f"{variant:<8} the summary itself states {sum(marks)} of the {len(marks)} probed facts")
```
```
careful  the summary itself states 158 of the 180 probed facts
plain    the summary itself states 142 of the 180 probed facts
```
*(runs live, shows output — read-only demo snippet, not graded)*

It points the same way, with no second model. It can't credit a fact the summary paraphrased, and it can't tell whether a reader could use what's there, so the probes measure the thing that matters, and this check is a fast first look.

---

## What even a careful summary loses

Broken down by what each probe asked about:

```python
from collections import defaultdict

by_kind = defaultdict(lambda: defaultdict(list))
for answer in second["answers"]:
    probe = probes[answer["trial_id"]][answer["probe"]]
    by_kind[probe["kind"]][answer["variant"]].append(correct(probe, answer["answer"]))
for kind in sorted(by_kind, key=lambda k: sum(by_kind[k]["careful"]) / len(by_kind[k]["careful"])):
    c, p = by_kind[kind]["careful"], by_kind[kind]["plain"]
    print(f"{kind:<9} careful {sum(c):>2}/{len(c):<3} plain {sum(p):>2}/{len(p)}")
```
```
next      careful  2/3   plain  2/3
failed    careful 34/45  plain 29/45
fact      careful 84/99  plain 74/99
task      careful 14/15  plain 12/15
reason    careful  6/6   plain  6/6
decision  careful 12/12  plain 10/12
```
*(runs live, shows output — read-only demo snippet, not graded; "next" is one probe, answered six times)*

Decisions and reasons survive almost every time. What fails most is the detail of what went wrong: the table a query said didn't exist, the column it was missing, the other spelling the agent tried, the exact service that failed. That's the part a later step needs most, to avoid trying the same failed thing again, and it's a concrete thing to change in the summary instructions and test again.

---

## When to run it again

This test takes 120 summaries and 360 short answers, about a minute of GPU time, and it should run whenever its result could change:

- **The summary instructions change.** That's what this test compared.
- **The model changes,** whether the one writing the summaries or a new version of it.
- **The compaction threshold changes,** which changes how much each summary has to cover.

It answers whether the summary keeps what the task needs. It doesn't answer the question that ultimately matters, whether the agent still finishes its tasks as well after compaction. That needs whole tasks run with compaction and without, which is [Lesson 9](→ Module 7, the ablations lesson)'s subject.

---

## Quiz cards

> **Q1.** Why is the summarizer test a component test rather than a whole-task test?
> - It tests one piece, the summary, with fixed inputs ✅
> - It runs the agent on complete tasks with compaction
> - It needs a person to read every summary it makes
> - It only works on runs that ended in a failure
>
> *Explanation: The test takes recorded runs, compacts them, and asks questions of the summaries alone. That isolates the summarizer, which makes the test cheap and its failures easy to place. Whether the agent finishes tasks after compaction is a separate, whole-task question.*

> **Q2.** In the first round, every answer to m05/3's model question was marked wrong, but every one was right. Why?
> - The probe's answer was out of date ✅
> - The reader model misread the summaries it was given
> - The matcher couldn't match a model name with a hyphen
> - The summaries left out the agent's model entirely
>
> *Explanation: The script took the model from the agent's lookup, but the user then asked for a different model and the registry confirmed the change. The answers gave the latest model, which was right. The probe, not the summary, was wrong.*

> **Q3.** Why did the first round's "how many searches?" probes say little about the two instruction versions?
> - Neither version asks a summary to count searches ✅
> - The reader model can't count above three
> - Searches aren't recorded in the runs being summarised
> - Counts can't be graded by code
>
> *Explanation: A probe should test what the summary is supposed to keep. Both sets of instructions ask for what was tried, not how many times, so both mostly failed the count, and the probe measured counting rather than summarising.*

> **Q4.** With the second round's probes, careful scored about ten points above plain, with an interval from 2.8 to 17.2 points. What does that support?
> - Careful keeps more of what tasks need ✅
> - The careful summaries are always better, run by run
> - The plain instructions lose every fact that matters
> - Both versions are equally good at keeping facts
>
> *Explanation: The interval comes from resampling whole runs and stays above zero, so the difference isn't just the runs that happened to be chosen. It isn't uniform: careful did worse on 3 of the 20 runs.*

> **Q5.** What did even the careful summaries lose most often?
> - The details of what failed ✅
> - Which agent the user's request was about
> - The decisions the agent made, and the reasons
> - The next step the user had asked for
>
> *Explanation: Decisions, reasons and the request survived almost every time. The exact details of failed attempts were dropped most, and they're what a later step needs to avoid repeating the same mistake.*
