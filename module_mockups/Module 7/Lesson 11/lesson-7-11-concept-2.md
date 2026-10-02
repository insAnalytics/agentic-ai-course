# Module 7, Lesson 11 — Concept 2: Is this a real change?

> **Note for the site build:**
> - `scripts/eval/monitoring_traffic.py` now writes four files: concept 1's two, plus `traffic-baseline-b.json` (2.4 MB) and `traffic-compaction-a.json` (2.7 MB). Later concepts extend it, so use concept 4's zip, `m7-l11-c4-site-build.zip`, which replaces the earlier ones.
> - Each page should load only the traffic files it reads, so make concept 1's `TRAFFIC_DATA` a function, `trafficData(...conditions)`, like `pilotData` (concept 1's pages: `"baseline-a", "layers-a"`; this page: `"baseline-a", "baseline-b", "compaction-a"`).
> - This page's setup is `LOAD_TRAFFIC` + `DASHBOARD` + the setup block shown below (`run_facts`, `before`, `after`, `deploy`, `stream`); add the shown block to `evalData.ts` as `DEPLOY_STREAM`, byte-identical to the page. The three demos run independently on that setup. The last takes about a second in CPython.

---

## A number that moves every hour

A dashboard is only useful if someone acts on it, and nobody can act on every wiggle. Every number in [the dashboard from the previous concept](→ this lesson, the what to watch on every run concept) moves from one hour to the next even when nothing about the agent has changed, because each hour brings different requests and the agent's own sampling makes each run different. The question every alert has to answer is whether a move is bigger than that.

To see it, this concept builds a simulated stream of traffic with a change in the middle:

- **Before the change:** the baseline's runs on the development tasks, from both of its batches, 770 runs of the same agent with the same settings.
- **The change:** the agent ships with [Lesson 9's forced compaction](→ Module 7, the does this piece help? ablations lesson, the compaction on and off concept) switched on, which summarizes a run's older rounds once it passes three.
- **After the change:** the compacting agent's 385 runs on the same tasks.

The recorded runs started in task order, all five trials of q01 first, then q02. Real traffic arrives mixed, so the stream shuffles each part with a fixed seed: each seed is one simulated stream with the same mix of requests throughout. That's an assumption, and a later concept in this lesson drops it.

```python
import random


def run_facts(spans: list[Span]) -> tuple[bool, int]:
    """What this concept watches in one run: whether it ended without an answer, and its tokens."""
    facts = summarize(spans)
    chats = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"]
    return bool(chats[-1].attributes.get("registry_agent.tool_calls")), facts["input_tokens"] + facts["output_tokens"]


before = [run_facts(spans) for spans in load_traffic("baseline-a") + load_traffic("baseline-b")]
after = [run_facts(spans) for spans in load_traffic("compaction-a")]
deploy = len(before)


def stream(seed: int) -> list[tuple[bool, int]]:
    """The baseline's 770 runs in a random order, then, once the change ships, the compacting agent's 385."""
    rng = random.Random(seed)
    return rng.sample(before, len(before)) + rng.sample(after, len(after))
```
*(defined once here and already loaded for every demo in this concept, with this lesson's `load_traffic` and Lesson 2's `summarize`; whether a run ended without an answer is the same test as `dashboard`'s `no_answer_rate`)*

Here is one stream, in windows of 55 runs:

```python
from statistics import mean

day = stream(0)
for start in range(0, len(day), 55):
    window = day[start:start + 55]
    no_answer = sum(ended for ended, _ in window)
    shipped = "   <- the change ships" if start == deploy else ""
    print(f"runs {start + 1:>4} to {start + len(window):<4}  {no_answer} without an answer ({no_answer / len(window):>3.0%})"
          f"   {mean(tokens for _, tokens in window):>6,.0f} tokens per run{shipped}")
```
```
runs    1 to 55    2 without an answer ( 4%)    9,020 tokens per run
runs   56 to 110   3 without an answer ( 5%)   10,334 tokens per run
runs  111 to 165   1 without an answer ( 2%)    9,009 tokens per run
runs  166 to 220   3 without an answer ( 5%)    9,033 tokens per run
runs  221 to 275   3 without an answer ( 5%)   10,847 tokens per run
runs  276 to 330   1 without an answer ( 2%)    7,177 tokens per run
runs  331 to 385   6 without an answer (11%)   10,136 tokens per run
runs  386 to 440   1 without an answer ( 2%)    8,988 tokens per run
runs  441 to 495   1 without an answer ( 2%)   10,044 tokens per run
runs  496 to 550   3 without an answer ( 5%)    9,726 tokens per run
runs  551 to 605   1 without an answer ( 2%)   10,905 tokens per run
runs  606 to 660   2 without an answer ( 4%)    8,922 tokens per run
runs  661 to 715   0 without an answer ( 0%)    9,092 tokens per run
runs  716 to 770   2 without an answer ( 4%)    8,173 tokens per run
runs  771 to 825   6 without an answer (11%)   10,978 tokens per run   <- the change ships
runs  826 to 880   6 without an answer (11%)   12,267 tokens per run
runs  881 to 935   7 without an answer (13%)   12,272 tokens per run
runs  936 to 990   7 without an answer (13%)   11,286 tokens per run
runs  991 to 1045  4 without an answer ( 7%)    9,789 tokens per run
runs 1046 to 1100  5 without an answer ( 9%)    8,649 tokens per run
runs 1101 to 1155  2 without an answer ( 4%)   10,393 tokens per run
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the baseline's development-task runs from both batches in a random order, then the compacting agent's, as described above)*

The change is there: four of the seven windows after it show six or seven runs without an answer. But a window before it, runs 331 to 385, showed six too, and the change's last window shows two. A rule that judged each window alone would have to choose: a threshold low enough to catch the change's windows also catches runs 331 to 385. Tokens per run are no help window by window either: with nothing changed they range from about 7,200 to 10,900, and the compacting agent's windows, from about 8,600 to 12,300, overlap most of that range.

---

## How much a rate moves by chance

[Lesson 10 measured the noise first](→ Module 7, the regression testing lesson, the a gate that doesn't flake concept, measuring the noise first) before deciding what counted as a regression. The same applies to a live rate, and for a rate the noise can be worked out. If each run fails with chance p, the number of failures in a window of n runs follows a binomial distribution, which says how many failures windows will show with nothing wrong:

```python
from math import comb
from statistics import mean


def likely_counts(n: int, p: float) -> tuple[int, int]:
    """The range of failures that 95% of windows of n runs fall in, when each run fails with chance p."""
    total, low = 0.0, None
    for k in range(n + 1):
        total += comb(n, k) * p**k * (1 - p) ** (n - k)
        if low is None and total > 0.025:
            low = k
        if total >= 0.975:
            return low, k


batches = {"baseline, batch a": before[:385], "baseline, batch b": before[385:], "compacting agent": after}
for name, runs in batches.items():
    no_answer = sum(ended for ended, _ in runs)
    print(f"{name:<18} {no_answer:>2} of {len(runs)} without an answer ({no_answer / len(runs):.1%}), "
          f"{mean(tokens for _, tokens in runs):,.0f} tokens per run")

p = sum(ended for ended, _ in before) / len(before)
print(f"\nboth baseline batches together: {p:.1%}. With nothing changed, 95% of windows of")
for n in (55, 200, 800):
    low, high = likely_counts(n, p)
    print(f"  {n:>3} runs show {low} to {high} without an answer ({low / n:.1%} to {high / n:.1%})")
```
```
baseline, batch a  12 of 385 without an answer (3.1%), 9,384 tokens per run
baseline, batch b  17 of 385 without an answer (4.4%), 9,388 tokens per run
compacting agent   37 of 385 without an answer (9.6%), 10,805 tokens per run

both baseline batches together: 3.8%. With nothing changed, 95% of windows of
   55 runs show 0 to 5 without an answer (0.0% to 9.1%)
  200 runs show 3 to 13 without an answer (1.5% to 6.5%)
  800 runs show 20 to 41 without an answer (2.5% to 5.1%)
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the baseline's development-task runs from both batches in a random order, then the compacting agent's, as described above)*

Three things in that output:

- **The two baseline batches differ by more than a point** in runs without an answer, 3.1% against 4.4%, with the same agent and settings. That's the noise, measured.
- **A 55-run window can show anything from 0% to 9% by chance.** The compacting agent's true rate, 9.6%, sits just past that range, so a single window can't separate it from bad luck. At 800 runs the range narrows to 2.5% to 5.1%, and 9.6% stands well clear.
- **Tokens per run behave differently over long and short spans.** Over a whole batch, the two baseline batches differ by 4 tokens per run, and the compacting agent's 10,805 is 15% higher. Over 55 runs, a few long runs swing the mean by thousands.

The binomial treats every run as independent. Runs of the same question aren't quite, as the module's noise floor showed, so real windows wobble at least this much. The lesson for alerting is the trade at the heart of it: a short window reacts fast but can't tell a change from chance; a long window can tell, but only after many runs have gone wrong.

---

## Alert on what users feel, against a budget

Google's SRE practice has a worked-out answer to that trade, and its starting point is what to alert on. The SRE book's monitoring chapter says to page a person on **symptoms**, what users actually experience, rather than causes, and only when the alert is urgent, actionable and a real problem: pages that turn out to be noise teach people to ignore pages. For this agent, a run that ends without an answer is a symptom. A rise in tokens per run is a cost, which matters, but nobody needs waking for it.

[The SRE Workbook's chapter on alerting](https://sre.google/workbook/alerting-on-slos/) builds the alert from three pieces:

- **A service level indicator (SLI):** the share of events that are good. Here, the share of runs that end with an answer.
- **A service level objective (SLO):** the target for the SLI, such as 95% of runs. Choosing it is a product decision: how much failure users will accept.
- **An error budget:** what the SLO allows to fail, here 5% of runs. The **burn rate** is how fast the budget is being spent: the observed failure rate divided by the budget. A burn rate of 1 spends the budget exactly as fast as the SLO allows; 2 spends it twice as fast.

The chapter judges any alerting rule on four things: **precision** (how many alerts were real), **recall** (how many real problems raised an alert), **detection time**, and **reset time** (how long an alert keeps firing after the problem stops). It walks through six designs. Alerting whenever a short window's error rate passes the SLO, its first design and the one the windows above show, has good recall and poor precision. Its recommended design checks two windows at once: a long window, to show the budget is really being spent, and a short one, about a twelfth of its length, to show it's still being spent now, so the alert stops soon after the problem does. It also uses several burn-rate thresholds: a high burn rate over an hour pages someone, and a burn rate of 1 sustained over days opens a ticket.

The chapter's examples measure windows in minutes and hours, for services with steady, heavy traffic. It also warns about **low-traffic services**: at 10 requests an hour, one failed request is a 10% error rate. An agent that serves a few hundred runs a day is a low-traffic service in exactly that sense, so the windows below are counted in runs, not minutes.

---

## The rule on simulated streams

Here is the two-window rule at the workbook's ticket threshold, a burn rate above 1, on 300 shuffled streams. A false alarm is any firing before the change ships, in the 770 runs where nothing changed. The change counts as caught at the first firing whose short window holds only runs from after it:

```python
from itertools import accumulate
from statistics import median


def burn_alert(failed: list[bool], slo: float, long: int, short: int) -> list[int]:
    """Where a two-window burn-rate rule fires: after each run i, both the last `long` runs and the last `short`
    runs fail more often than the SLO allows, that is, they spend the error budget at a burn rate above 1."""
    budget = 1 - slo
    seen = [0, *accumulate(failed)]
    return [i for i in range(long, len(failed) + 1)
            if (seen[i] - seen[i - long]) / long > budget and (seen[i] - seen[i - short]) / short > budget]


print(f"{'SLO':>4}{'long':>6}{'short':>6}   {'false alarm':>11}   {'caught the change':>17}   {'runs until caught (median, 90th)':>32}")
for slo, long, short in ((0.95, 120, 10), (0.95, 240, 20), (0.95, 480, 40), (0.90, 480, 40)):
    false_alarms, delays = 0, []
    for seed in range(300):
        fired = burn_alert([ended for ended, _ in stream(seed)], slo, long, short)
        false_alarms += any(i <= deploy for i in fired)
        # the first firing whose short window holds only runs from after the change
        delay = next((i - deploy for i in fired if i >= deploy + short), None)
        if delay is not None:
            delays.append(delay)
    delays.sort()
    timing = f"{median(delays):.0f}, {delays[int(0.9 * len(delays))]}" if delays else "-"
    print(f"{slo:>4.0%}{long:>6}{short:>6}   {false_alarms:>4} of 300   {len(delays):>10} of 300   {timing:>32}")
```
```
 SLO  long short   false alarm   caught the change   runs until caught (median, 90th)
 95%   120    10    295 of 300          300 of 300                             30, 89
 95%   240    20    181 of 300          300 of 300                            52, 120
 95%   480    40      9 of 300          300 of 300                           100, 176
 90%   480    40      0 of 300            0 of 300                                  -
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the baseline's development-task runs from both batches in a random order, then the compacting agent's, as described above, 300 times with different seeds)*

The rows show the trade:

- **Short windows are fast and wrong.** With 120 and 10 runs, the rule caught the change about 30 runs after it shipped, but it had already fired with nothing changed in 295 of 300 streams. A rule that fires every day gets ignored, which is the SRE book's point about pages.
- **Long windows are trustworthy and slow.** With 480 and 40 runs, it raised a false alarm in 9 streams of 300 and still caught the change every time, typically 100 runs after it shipped. At the compacting agent's rate, that's about 10 runs without an answer before anyone hears, where the baseline would have had about 4.
- **The SLO decides what counts as broken.** At 90%, the compacting agent's 9.6% is inside the budget, and the rule never fired. That isn't the rule failing: by the objective the team agreed, the change isn't an incident. If it should be one, the SLO is wrong, and that's a product conversation, not an alerting fix.

Part of why the 95% rows struggle is how little headroom there is. The baseline already spends three-quarters of the budget (3.8% against 5%), so chance alone pushes a window over a burn rate of 1 often. An SLO set just above an agent's normal failure rate makes every alert noisy; one set far above it hides real regressions. Measuring the normal rate first, as above, is how to choose.

---

## What an alert doesn't tell you

The alert says runs are failing to finish more often since the change. It doesn't say why. [Lesson 9's reading of the compacted runs](→ Module 7, the does this piece help? ablations lesson, the compaction on and off concept, why it cost that) did that, from the runs behind the number. An alert is the start of the investigation, and the runs it points at are the ones to read.

Three more limits:

- **Cost is a slower signal, and needs longer spans.** The 15% rise in tokens per run is clear across whole batches and invisible in single windows. It belongs on a daily report or a weekly ticket, not a page.
- **Latency can't be compared across these runs.** Each recorded batch ran on a shared GPU at different times, so a difference in duration between them may be the GPU's load, not the agent.
- **The alert only sees what the trace can count.** An agent that starts answering wrongly, with every run still ending in an answer, trips nothing here. That needs a grader on a sample of runs, the next concept's subject. And a change in what people ask can move every number on the dashboard without the agent changing at all, which is why the stream above kept its mix fixed, and why a later concept watches the mix itself.

The first defence is still the one before release: a change that fails [Lesson 10's regression gate](→ Module 7, the regression testing lesson, the a gate that doesn't flake concept) doesn't ship. Monitoring catches what gets past it.

---

## Quiz cards

> **Q1.** The agent normally ends 3.8% of runs without an answer. One window of 55 runs shows 6 (11%). What should happen?
> - Nothing yet: windows like that turn up with nothing changed ✅
> - Page someone, since the rate has nearly tripled in one window
> - Roll back the latest change to the agent before more runs fail
> - Raise the step limit, so that fewer of the runs end without an answer
>
> *Explanation: At the baseline's rate, 95% of 55-run windows show between 0 and 5 failures, and the baseline itself produced a window of 6 with nothing changed. One window can't separate a change from chance; a longer window, or a rule that needs a sustained burn, can.*

> **Q2.** The SLO is 95% of runs ending with an answer. Over the last 480 runs, 7.5% ended without one. What's the burn rate?
> - 1.5: the budget is going one and a half times as fast as allowed ✅
> - 0.075: the share of the window's runs that ended without an answer
> - 2.5: the difference between the observed rate and the error budget
> - 0.5: the share of the error budget that this window has already spent
>
> *Explanation: The error budget is 1 − 0.95 = 5% of runs. The burn rate is the observed failure rate divided by the budget: 7.5% / 5% = 1.5. A burn rate of 1 would spend the budget exactly as fast as the SLO allows.*

> **Q3.** Why does the workbook's recommended rule check a long window and a short window together?
> - The long one shows real spending; the short one, that it hasn't stopped ✅
> - The long one catches small problems and the short one catches the large ones
> - Using two windows halves the number of runs the rule has to look at each time
> - The short window watches latency, while the long one watches the error rate
>
> *Explanation: A long window gives precision, since a high rate over many runs is unlikely to be chance. On its own it keeps firing long after a problem stops, because old failures stay in it. Requiring the short window too means the alert stops soon after the failures do.*

> **Q4.** With an SLO of 90%, the two-window rule never fired after the compacting agent shipped. What does that mean?
> - By the agreed objective, the change stays within its budget ✅
> - The rule is broken, because the change did make more runs fail
> - Compaction didn't change how often runs end without an answer
> - A 90% SLO needs shorter windows before it can catch anything
>
> *Explanation: The compacting agent fails 9.6% of runs, under the 10% budget a 90% SLO allows. The rule did what the objective asked. If a rise from 3.8% to 9.6% should count as an incident, the SLO is set too loosely, and changing it is a product decision.*

> **Q5.** Tokens per run swing between about 7,200 and 10,900 across 55-run windows with nothing changed, yet the two baseline batches differ by 4. How should cost be watched?
> - Over whole days or weeks, where a few long runs can't swing it ✅
> - In short windows, since cost is the signal that users notice first
> - By the median alone, since the mean of tokens can't be trusted
> - Not at all, since cost only changes when the model's prices do
>
> *Explanation: A handful of long runs moves a short window's mean by thousands of tokens, but averages out over hundreds of runs, which is why the compacting agent's 15% rise is clear across a batch and invisible window by window. Cost isn't a symptom users feel, so it suits a daily report, and the bill comes from the mean, not the median.*

> **Q6.** Why does this concept count alert windows in runs rather than in minutes?
> - Agent traffic is low: a minute may hold too few runs to mean much ✅
> - Runs are easier than minutes for a tracing system to count reliably
> - The SRE Workbook rules out time-based windows for agents in general
> - A run's length varies, so minutes would give long runs extra weight
>
> *Explanation: The workbook warns that at low traffic one failure makes a large error rate: at 10 requests an hour, one failure is 10%. A few hundred runs a day is low traffic, so a window defined by a number of runs keeps the noise under control whatever the hour.*
