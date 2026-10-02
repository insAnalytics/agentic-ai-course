# Module 7, Lesson 9 — Concept 4: Module 6's layers on real runs

> **Note for the site build:** both demos start from `LOAD_ABLATIONS`. The first also needs concept 1's reference `paired_difference` (with `pass_rate`) loaded without showing it.

---

## What Module 6 measured, and what it left

[Module 6 ended by stacking eight checks](→ Module 6, the putting it together: a reliable agent lesson, the what each layer earns concept) around one agent: an intent check, a session guard, a result check, a read-back, grounding, a report check, a missing-part check and a support judge. On its scripted suite of scenarios, the stack stopped every harm, at small and specific costs. Module 6 was clear about what that suite was: scenarios written to exercise each failure, with scripted model replies. It promised that suites like it would be run against real agent runs, and its checks calibrated against people's labels at scale.

Phase 5 did the first half. The same eight layers, ported to the live registry world with as few changes as possible, ran inside the real agent's loop on every task, with the same 5 trials as the baseline. The port's changes were all mechanical:

- reading the registry without logging
- treating everything the user has said as "the request"
- stripping this agent's citation ids before grounding compares numbers
- giving the support judge a real model, Gemma 4 26B-A4B, with Module 6's own prompt

Every layer's objection was logged, so each can be counted.

---

## The result

```python
for group in (None, "question", "other", "lost write", "planted", "broken result"):
    base, layered = passes("baseline", group), passes("layers", group)
    mean, low, high = paired_difference(base, layered)
    print(f"{group or 'all tasks':<14} {len(base):>3} tasks   layers minus baseline {mean:+.1%} ({low:+.1%} to {high:+.1%})")
```
```
all tasks      125 tasks   layers minus baseline -29.8% (-37.0% to -22.7%)
question        58 tasks   layers minus baseline -45.9% (-54.5% to -37.2%)
other           50 tasks   layers minus baseline -25.6% (-36.8% to -14.0%)
lost write       8 tasks   layers minus baseline -10.0% (-30.0% to +7.5%)
planted          6 tasks   layers minus baseline +33.3% (+6.7% to +66.7%)
broken result    3 tasks   layers minus baseline +33.3% (+20.0% to +60.0%)
```
*(runs live, shows output — read-only demo snippet, not graded; a trial passes if it reached an answer, passed its code checks, and passed every revised Gemma judge that graded it)*

The stack cost the agent about 30 points. On Module 5's questions it cost nearly half. It did help where Module 6 aimed it: a third of the planted-instruction runs became safe, and every broken-result run passed. But on the lost-write tasks, the failure the read-back was built for, it made things slightly worse.

---

## What the layers did

```python
from collections import Counter

rows = [row for trials in results["conditions"]["layers"].values() for row in trials]
withheld = Counter(row["withheld_by"] for row in rows if row["withheld"])
objected = Counter(layer for row in rows for layer in row["objections"])
print(f"{len(rows)} runs; {sum(withheld.values())} answers withheld, {sum(row['stopped'] for row in rows)} stopped by the step limit")
print("withheld by:", ", ".join(f"{layer} {n}" for layer, n in withheld.most_common()))
print("runs each layer objected in:", ", ".join(f"{layer} {n}" for layer, n in objected.most_common()))
```
```
625 runs; 376 answers withheld, 49 stopped by the step limit
withheld by: support judge 197, grounding 132, missing-part check 47
runs each layer objected in: support judge 197, grounding 132, missing-part check 54, intent check 44, read-back 30, result check 15, session guard 15
```
*(runs live, shows output — read-only demo snippet, not graded)*

Six answers in ten were withheld. The question is how many of those deserved it, and that needs reading. Here's what a reading of samples from the development tasks found. It's one reader, the course's content chat, and small samples, so treat the counts as a picture, not a measurement:

- **Grounding, 10 of 10 sampled objections were false alarms.** Every flagged figure was something no tool returns but no one would call a claim: numbered list items ("1."), a count the agent worked out ("5 registered agents"), a unit conversion ("1,750ms, about 1.75 seconds"). Module 6's scripted answers were short sentences with a figure or two; real answers are formatted.
- **The support judge, about 8 of 10 sampled objections were false alarms.** It was handed sentence fragments from markdown answers as "claims", such as "According to the registry information:" followed by a list, and correctly said no source supports them. It also rejected sentences that add a reasonable inference to a sourced fact ("so the move should succeed"). About two in ten looked like real unsupported details.
- **The intent check blocked legitimate actions far more often than wrong ones.** In the development runs it objected in 41, but only on two tasks, an ambiguous request and a conversation, was asking the user the right move. In the rest, the agent named in the change had been found by lookup ("the research agent", "both agents still on claude-legacy") or the person to email was the owner it had just read. Module 6's rule, that the name must appear in the request, is right for scripted requests and wrong for real ones.
- **The read-back did its job, and the stack undid it.** It caught the lost writes it was built for. In one run read, it turned a silent lost write into an error, and then grounding withheld the agent's answer over a list number, so the user never heard that the change had failed. In others, the intent check blocked the move before the write was even tried, on requests that named the agent indirectly. A correct catch was lost to false alarms on either side of it.

---

## What this says about checks

- **A suite of scripted scenarios measures catches, not false alarms.** Module 6's scenarios were built so that most contain a harm, and the agent's replies were short and clean. Real runs are mostly fine, and their answers are long, formatted and full of numbers. A check's false-alarm rate is decided by the fine runs, which the scripted suite barely had.
- **False alarms compound.** Eight layers each with a modest false-alarm rate, checked in sequence, block most answers. The first objection wins, so the weakest layer decides.
- **The fix is calibration, as Module 6 promised.** Label a sample of each layer's objections as right or wrong, estimate its precision, fix the layer, and run the ablation again. Grounding needs to ignore list numbering and derived figures, and the support judge needs claims, not fragments. Each fix is a new version of the layer, measured the way this concept measured the first one. That's the version-to-version comparison [Lesson 10](→ Module 7, the comparing versions lesson) sets up.

This run kept the stack exactly as Module 6 built it, rather than fixing it first, because that's what the promise asked: what Module 6's layers do on real runs. The answer is that they catch what they were built to catch, and on real runs that matters less than what they wrongly stop.

---

## Quiz cards

> **Q1.** On real runs, Module 6's full stack cost about 30 points. What made most of that cost?
> - Good answers withheld ✅
> - Harmful answers the layers let through
> - Extra model calls slowing every run down
> - Runs that crashed inside a layer
>
> *Explanation: Six answers in ten were withheld, mostly by grounding and the support judge, and reading samples found most of those objections were false alarms on answers that were fine.*

> **Q2.** Why did grounding object to "1" so often?
> - Real answers number their lists ✅
> - Tool results never contain digits
> - Citation ids weren't stripped first
> - The agent invented step counts
>
> *Explanation: Grounding requires every figure in the answer to appear in a tool result. List numbers, counts and conversions aren't claims from a tool, but the check can't tell; Module 6's short scripted answers never had them.*

> **Q3.** Why didn't the scripted suite reveal these false alarms?
> - Most scenarios contained a harm ✅
> - It used a different support judge prompt
> - It ran every layer one at a time
> - Its scenarios had no numbers at all
>
> *Explanation: A suite built to exercise failures measures catches. False alarms are decided by fine runs with realistic answers, which the scripted suite barely had.*

> **Q4.** The read-back caught lost writes, yet the lost-write tasks got slightly worse. How?
> - Other layers withheld or blocked ✅
> - The read-back made the write fail
> - The agent ignored the read-back's error
> - The judges failed every withheld answer
>
> *Explanation: In runs read, grounding withheld the agent's honest report after the read-back's catch, or the intent check blocked the move before it was tried. The read-back's correct catch didn't reach the user.*

> **Q5.** What's the right next step for the layer stack?
> - Label each layer's objections ✅
> - Remove every layer that ever objects
> - Add more layers to catch what's left
> - Keep it and accept the lower pass rate
>
> *Explanation: Labelling a sample of each layer's objections gives its false-alarm rate. Fixing the worst layers and re-running the ablation shows whether each fix earns its place, which is Module 6's promise of calibrating checks at scale.*
