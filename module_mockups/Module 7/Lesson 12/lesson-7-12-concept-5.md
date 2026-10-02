# Module 7, Lesson 12 — Concept 5: Decisions, limits, and what's next

> **Note for the site build:** no new data. The demo starts from `LOAD_SETTINGS` + `LOAD_ABLATIONS`, with Lesson 9's `PAIRED_DIFFERENCE` loaded hidden.

---

## The decisions, checked on the dev tasks

Lessons 9 and 10 made six decisions about changes to the agent. [The previous concepts](→ this lesson, the held-out results, and their history concept, every contact, disclosed) found that their comparisons ran over all 125 tasks, held-out ones included. The report can't rerun anything, but it can recompute each decision the way it should have been made, on the dev tasks only, from the same recorded results:

```python
decisions = {"fp8": "ship", "prompt-v2": "ship", "compaction": "look", "layers-v2": "stop", "layers": "stop",
             "no-labels": "not a change to make"}
baseline = passes("baseline")
dev = {task for task, info in results["tasks"].items() if info["split"] == "dev"}
print(f"{'change':<11}{'decided':<22}{'all 125 tasks':>24}{'dev tasks only':>26}")
for condition, decision in decisions.items():
    changed = passes(condition)
    every = paired_difference(baseline, changed)
    dev_only = paired_difference({t: baseline[t] for t in dev}, {t: changed[t] for t in dev})
    shown = [f"{mean:+.1%} ({low:+.1%} to {high:+.1%})" for mean, low, high in (every, dev_only)]
    print(f"{condition:<11}{decision:<22}{shown[0]:>24}{shown[1]:>26}")
```
```
change     decided                          all 125 tasks            dev tasks only
fp8        ship                    +2.2% (-1.0% to +5.3%)    +3.5% (-0.2% to +7.2%)
prompt-v2  ship                    +4.2% (+0.6% to +7.8%)    +4.9% (+0.6% to +9.7%)
compaction look                    -3.8% (-7.7% to +0.0%)    -1.2% (-4.7% to +2.3%)
layers-v2  stop                  -16.3% (-22.4% to -10.4%)  -16.9% (-24.3% to -9.9%)
layers     stop                  -29.8% (-37.0% to -22.7%) -31.5% (-39.8% to -22.7%)
no-labels  not a change to make    +3.0% (+0.5% to +5.9%)    +4.7% (+1.6% to +8.0%)
```
*(runs live, shows output — read-only demo snippet, not graded; each difference is the change minus the baseline, paired by task, with a 95% interval from resampling tasks; `paired_difference` is Lesson 9's)*

Four of the six decisions stand exactly as made. Two read differently on dev tasks only, and the report says so:

- **Module 6's layers, and the fixed layers v2: stop.** Both cost the agent heavily on either set of tasks, and [Lesson 9's reading](→ Module 7, the does this piece help? ablations lesson, the module 6's layers on real runs concept, what the layers did) and [Lesson 10's](→ Module 7, the regression testing lesson, the three real changes concept, reading a failure: the layer fix) explain why: false alarms, then a claim splitter with bugs.
- **Prompt v2: ship.** About five points better on dev tasks, with an interval above zero. Most of the gain is the lost-write tasks, which [Lesson 10 traced](→ Module 7, the regression testing lesson, the three real changes concept, reading a pass: the prompt change) to the new read-back line. Those tasks are graded by the false-report judge, whose pass rate on good replies has never been measured, so the gain rests on that judge and on one run read.
- **FP8 serving: ship.** No regression on either set.
- **Compaction: the "look" came from the held-out tasks.** Over all tasks it cost 3.8 points, with three tasks flagged, all three held-out. On dev tasks alone the cost is 1.2 points, with an interval well across zero. The verdict of "look" was decided on tasks that were supposed to be untouched; on the tasks it should have used, there's no clear cost. Lesson 10's next step, rerunning the three flagged tasks with 20 trials each, would have settled it, and it hasn't been run.
- **The source labels: no change to make, but the question is open.** On dev tasks, removing the labels scored higher, +4.7 points with an interval above zero, more clearly than over all tasks. [Lesson 9 traced the largest gain](→ Module 7, the does this piece help? ablations lesson, the a piece that doesn't earn its place concept, what a gain is made of) to the citation check passing answers that cite nothing. That's a weakness in a grader, not evidence the labels hurt, and it's one comparison of six. The report gives the number, the reading, and the grader fix it points to.

The broader lesson for the report: recomputing a decision on the right tasks is cheap, and it's worth doing before anything is written down.

---

## Limits

Every evaluation is of one agent, on one suite, in one setting. The report lists what this one can't speak to:

- **One configuration.** A 4-billion-parameter model at one revision, with one prompt, served one way. Nothing here transfers to another model, or to this model with different settings, without a rerun; [Lesson 10](→ Module 7, the regression testing lesson, the what changed, and the last known-good run concept) showed how much a single setting can change.
- **A simulated world and a simulated user.** The registry, its faults and its documents are a simulation built for the course, and multi-turn conversations used a model playing the user. [Lesson 4 audited the simulated user](→ Module 7, the building a task suite lesson, the conversations, and checking the simulated user concept), but real users and a real registry will do things neither does.
- **A small suite.** 125 tasks, with three groups of six tasks or fewer. Those groups are reported as counts because nothing more can be said about them.
- **Judges measured on few labels, by one person.** The correctness judge's error rates rest on 18 test labels, and two judges have never been shown a labelled pass. One person labelled them; how consistently is waiting on the relabelling of 30 items, due three weeks after the first pass, which [Lesson 7](→ Module 7, the checking the graders lesson, the labels from people concept) set up for exactly this.
- **Readings by one reader.** The reading behind Lessons 3, 9 and 10 was done by one reader, sometimes the course's content chat. Its conclusions are evidence of what happened in the runs read, not rates.
- **No latency claims.** Runs were made 48 at a time on a shared GPU, so their durations measure the GPU's load as much as the agent.
- **Five trials per task.** Pass^k beyond k = 5 can't be estimated, and single tasks can't be tested for small changes.
- **The held-out contact,** as disclosed.
- **No real users.** Everything in Lesson 11 was simulated from recorded runs.

---

## What's next

The report ends with what should happen next, ordered by what it would change:

1. **Label where the headline rests on least.** The correctness judge's runs, and passes for the false-report and planted-instruction judges. Until those exist, the question, lost-write and planted groups can't be corrected.
2. **Finish the relabel.** Agreement between the two passes sets how far any label in this module can be trusted.
3. **Fix the citation check.** It passes answers that cite nothing, which is what the source-label result turned on.
4. **Settle compaction.** Rerun its three flagged tasks with 20 trials each, now that the held-out set is spent, before deciding anything about compaction.
5. **Build layers v3, and measure it the same way.** [Lesson 10 described it](→ Module 7, the regression testing lesson, the three real changes concept): keep identifiers, skip empty claims, leave attribution sentences to the citation check. It hasn't been run.
6. **Rebuild the held-out set.** Fold the old one into dev, hold out a fresh set within each category, and compare changes on dev tasks only from now on, keeping a contact log as it happens.
7. **Watch it in use.** If the agent goes live, [Lesson 11's plan](→ Module 7, the monitoring in production lesson): a dashboard from traces, a two-window burn-rate alert on runs without an answer, the relevance judge on a sample sized for the interval needed, PSI on the request mix, and an A/A test before any A/B test.

---

## Quiz cards

> **Q1.** On dev tasks only, compaction's cost falls from 3.8 points to 1.2, with an interval across zero. What should the report do?
> - Say the "look" rested on held-out tasks; dev shows no clear cost ✅
> - Keep the original verdict, since it was decided before the report
> - Drop compaction from the report, since its result is now unclear
> - Report only the dev number, since the other was computed wrongly
>
> *Explanation: Recomputing a decision on the right tasks is the honest thing to do, and so is saying what changed and why. Both numbers belong in the report, with the explanation. Hiding either one, or the change of reading, would leave a reader trusting a verdict the evidence no longer supports.*

> **Q2.** Prompt v2's gain comes mostly from the lost-write tasks. What caveat belongs beside it?
> - A judge with an unmeasured pass rate on good replies grades them ✅
> - The gain is within the noise floor, so it may disappear on a rerun
> - The lost-write tasks are held-out tasks, so the gain can't be used
> - The new prompt was only run once, so it can't be compared at all
>
> *Explanation: The false-report judge decides the lost-write tasks, and its TPR is unknown, so some of the passes it gave might not hold up. The gain's interval does exclude zero on dev tasks, the lost-write tasks in question are dev tasks, and one run of each condition is how every comparison here was made.*

> **Q3.** Why does the report list "no latency claims" among its limits?
> - Runs shared one busy GPU, so durations reflect its load ✅
> - Latency isn't one of the metrics an agent's report covers
> - The traces didn't record how long the runs took to finish
> - Latency depends on the model, which the report already names
>
> *Explanation: The runs were made 48 at a time on one GPU, so a slow run often meant a busy GPU, not a slow agent. The traces did record durations, and latency is a normal part of an agent's report; it just can't be measured fairly from these runs.*

> **Q4.** Removing the source labels scored 4.7 points higher on dev tasks, with an interval above zero. Why doesn't the report recommend removing them?
> - The biggest gain came from a grader passing uncited answers ✅
> - The interval above zero is too narrow to be trusted for a decision
> - Removing labels would change the configuration hash the report uses
> - The labels were added in an earlier module, so they must be kept
>
> *Explanation: Lesson 9's reading found the largest gain on a task where the citation check rewards citing nothing, so the number partly measures the grader. With six comparisons, one clear interval also isn't strong evidence. The fix points at the grader first.*

> **Q5.** Which next step comes first, and why?
> - Labelling where the headline rests on the fewest labels ✅
> - Building layers v3, since the layers were the largest regression found
> - Rebuilding the held-out set, since every later result depends on it
> - Setting up monitoring, since the agent's real users matter most
>
> *Explanation: Over half the headline rests on judges, and the judges behind the question, lost-write and planted results are barely measured. Labels there change how far every one of those numbers can be trusted. The other steps matter, but each builds on graders that can be trusted.*
