# Module 7, Lesson 11 — Concept 3: Judges on a sample

> **Note for the site build:**
> - `scripts/eval/monitoring_traffic.py` now also writes `public/data/eval/monitoring/relevance-judged.json` (52 KB): every development question run of the baseline's two batches, with whether it ended with an answer (from its trace) and the revised Gemma relevance judge's verdict and tokens on it. Concept 4 extends it again, so use concept 4's zip, `m7-l11-c4-site-build.zip`, which replaces the earlier ones.
> - This page reads only `relevance-judged.json`, no traffic files. Its setup is `LOAD_TRAFFIC` + the setup block shown below (`judged`, `wilson`); add the shown block to `evalData.ts` as `JUDGED_SAMPLE`, byte-identical to the page. The demos run independently on that setup.
> - The exercise's setup is the same. Add its reference `runs_to_judge`, without the example printout, as `RUNS_TO_JUDGE` for later pages. The hidden tests take well under a second.

---

## A grader for traffic with no answer key

[The previous concept's alert](→ this lesson, the is this a real change? concept) only sees what a trace can count. An agent that starts answering badly, with every run still ending in an answer, trips nothing. Seeing that takes a grader, and on live traffic the grader has a constraint the suite's graders didn't: there's no reference answer to compare against. That rules out correctness. What's left are graders that judge a run against itself:

- **Relevance:** does the answer address the question that was asked, right or wrong. [Lesson 6 noted](→ Module 7, the model graders lesson, the is the answer right? correctness and relevance concept, relevance, separately) that this is the judge that can still run on real traffic.
- **Support:** is each claim in the answer backed by the sources the run retrieved. Module 6's support judge asks exactly this.
- **Checks against the trace:** does the reply say something the tool results contradict, such as reporting a change that failed.
- **Classifications:** what kind of reply this was. The decline rate [Module 5 asked to watch](→ Module 5, the a retrieval system for a new corpus lesson, the where the module leaves off concept, a system that keeps running) needs one, because nothing in a trace marks a reply as a refusal.

These run after the fact, as evaluators, not inside the loop as checks: [the difference Lesson 6 started from](→ Module 7, the model graders lesson, the from a check in the loop to a grader afterwards concept). Nothing waits for their verdict, so they can run on a schedule, on a sample.

Sampling is how the tracing platforms set them up. [LangSmith's online evaluators](https://docs.langchain.com/langsmith/online-evaluations-llm-as-judge) run a judge on production traces, with a filter for which runs qualify and a sampling rate, with 0.1 given as the example for controlling cost. [Langfuse's](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge) target live traffic the same way, with a filter and a sampling percentage, 5% in its example, to manage cost and throughput. And Anthropic's guide recommends that people read a sample of transcripts every week. The questions this concept answers are how big that sample needs to be, and what its numbers mean.

---

## Code first, then the judge

This module already has a relevance judge's verdict on every development question run of the baseline, from [Lesson 7's revised rubric](→ Module 7, the checking the graders lesson, the development and test sets, for a judge concept). The setup loads them, with whether each run ended with an answer, and defines the interval this concept uses:

```python
from math import sqrt

judged = json.loads((MONITORING / "relevance-judged.json").read_text(encoding="utf-8"))["runs"]


def wilson(failures: float, n: int, z: float = 1.96) -> tuple[float, float]:
    """The Wilson score interval for a failure rate seen as `failures` out of `n`. Unlike the rate plus or minus
    z standard errors, it stays between 0 and 1, and it still gives an upper bound when nothing failed."""
    p = failures / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z / (1 + z * z / n) * sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return max(0.0, centre - half), min(1.0, centre + half)
```
*(defined once here and already loaded for every demo and the exercise in this concept, with this lesson's `MONITORING` path)*

The Wilson interval is the usual choice for a rate when failures are rare. The simpler interval, the rate plus or minus 1.96 standard errors, collapses to zero width when no failures were seen, which would claim certainty from exactly the samples that have the least to say.

```python
from statistics import mean

answered = [run for run in judged if run["answered"]]
unanswered = [run for run in judged if not run["answered"]]
judge_fails = sum(run["judge"] == "fail" for run in answered)
print(f"{len(judged)} question runs; {len(unanswered)} ended without an answer")
print(f"  the judge passed {sum(run['judge'] == 'pass' for run in unanswered)} of those {len(unanswered)}, so code fails them instead")
print(f"  of the {len(answered)} answered runs, the judge failed {judge_fails}")
print(f"relevance failures, code first: {len(unanswered) + judge_fails} of {len(judged)} "
      f"({(len(unanswered) + judge_fails) / len(judged):.1%})")
print(f"the judge read {mean(run['judge_tokens'] for run in answered):.0f} tokens for each run it judged")
```
```
480 question runs; 26 ended without an answer
  the judge passed 25 of those 26, so code fails them instead
  of the 454 answered runs, the judge failed 1
relevance failures, code first: 27 of 480 (5.6%)
the judge read 426 tokens for each run it judged
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the revised Gemma relevance judge's verdicts on the baseline's development question runs, both batches)*

Two things come out of this before any sampling:

- **Code decides what code can.** The judge passed 25 of the 26 runs that ended without an answer, the same weakness [Lesson 6 found](→ Module 7, the model graders lesson, the is the answer right? correctness and relevance concept, relevance, separately). Those runs are known from the trace on every run, so code fails them, and the judge is only asked about runs that answered.
- **What's left for the judge is rare.** Of the 454 answered runs, it failed one: q16, where the question asked how long the old and new registry keys can both stay valid, and the answer gave each key's 90-day lifetime instead. Reading that run and a random five of the judge's passes agreed with its verdicts in all six. (The reading was done for this page by the course's content chat, so treat it as a check, not a measurement.)

The judge read about 426 tokens per run, against about 9,400 tokens per agent run in [the first concept's traffic](→ this lesson, the what to watch on every run concept, a day of traffic), so here judging every run would add about 4.5% in tokens. That share depends heavily on the judge. This one reads only the question and the answer; a judge that reads a whole trace reads about as much as the agent's last call did, and a judge is often a larger model than the agent, with each token costing more. That's why the platforms default to a sample.

---

## How many runs to judge

Here's what samples of different sizes see, drawn from the 454 answered runs:

```python
import random
from statistics import median

answered = [run for run in judged if run["answered"]]
print(f"judging a random sample of the {len(answered)} answered runs, 1,000 times at each size\n")
print(f"{'judged':>7}  {'saw the failure':>15}  {'typical 95% interval for the answered runs':>44}")
rng = random.Random(0)
for n in (25, 50, 100, 200, len(answered)):
    saw, lows, highs = 0, [], []
    for _ in range(1000):
        fails = sum(run["judge"] == "fail" for run in rng.sample(answered, n))
        saw += fails > 0
        low, high = wilson(fails, n)
        lows.append(low)
        highs.append(high)
    print(f"{n:>7}  {saw / 1000:>15.0%}  {median(lows):>33.2%} to {median(highs):.2%}")
```
```
judging a random sample of the 454 answered runs, 1,000 times at each size

 judged  saw the failure    typical 95% interval for the answered runs
     25               5%                              0.00% to 13.32%
     50              10%                              0.00% to 7.14%
    100              22%                              0.00% to 3.70%
    200              43%                              0.00% to 1.88%
    454             100%                              0.04% to 1.24%
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the revised Gemma relevance judge's verdicts on the baseline's development question runs, both batches; each row draws 1,000 random samples)*

With one failure in 454, a sample of 50 sees it only one time in ten. The other nine times, it sees no failures and reports an interval from 0% to 7.1%. That isn't "no relevance problems". It's "fewer than about 1 in 14 answers", which is a much weaker statement. A common shortcut for this case is the **rule of three**: if none of n runs failed, the true rate could plausibly be as high as about 3 in n. Even judging all 454 runs only narrows the answered runs' rate to somewhere under 1.24%.

Two practical points follow:

- **Choose a number of runs, not a percentage.** The interval depends on how many runs were judged, not on what share of traffic they were. Judging 5% of a 500-run day gives 25 verdicts; 5% of a 50,000-run day gives 2,500. Decide the interval you need, work out the runs that takes, and set the rate from the day's traffic.
- **Rare failures cost the most to measure.** Near 50%, a few hundred verdicts give a tight interval. Near 0%, the same precision takes far more, and the simple formula for sample size gets this badly wrong, as the exercise shows.

---

## Applied sandbox exercise
*(graded — how many runs to judge for the interval you need)*

**Task shown to learner:**

Write `runs_to_judge(expected_rate, half_width, z=1.96)`: the fewest judged runs `n` for which the Wilson interval at the expected failure rate is no wider than `half_width` on either side of its middle. Use `wilson(expected_rate * n, n, z)`, which is loaded, and measure the half-width as `(high - low) / 2`. Search upwards from `n = 1`. `half_width` will always be positive.

The usual formula, `z² × p × (1 − p) / half_width²`, is close near a rate of 50%, but it isn't this, and near 0% or 100% it asks for far too few runs.

**Starter code:**
```python
def runs_to_judge(expected_rate: float, half_width: float, z: float = 1.96) -> int:
    """..."""
    # your code here


print(runs_to_judge(0.056, 0.02))
```

**Hidden tests:**
```python
def half_width_at(rate, n, z=1.96):
    low, high = wilson(rate * n, n, z)
    return (high - low) / 2


try:
    n = runs_to_judge(0.2, 0.05)
except ZeroDivisionError:
    raise AssertionError("the search divides by the number of runs, so start it at 1, not 0")
assert isinstance(n, int), f"runs_to_judge should return a whole number of runs: got {n!r}"
assert half_width_at(0.2, n) <= 0.05, f"{n} judged runs at a 20% rate gives a half-width of {half_width_at(0.2, n):.4f}, over 0.05"
assert half_width_at(0.2, n - 1) > 0.05, f"{n} isn't the fewest: {n - 1} judged runs already give a half-width within 0.05"
assert n == 245, f"a 20% rate within 0.05 needs 245 judged runs by the Wilson interval: got {n}"

n = runs_to_judge(0.01, 0.01)
assert n == 454, \
    f"a 1% rate within 0.01 needs 454 judged runs: got {n} (the rate plus or minus z standard errors says 381, too few near 0)"
assert runs_to_judge(0.99, 0.01) == 454, "a 99% rate needs as many runs as a 1% rate: the interval is symmetric in the rate"
n = runs_to_judge(0.0, 0.01)
assert n == 189, f"even when no failures are expected, the interval has a width: 189 judged runs for a half-width of 0.01, got {n}"

n = runs_to_judge(0.2, 0.05, z=2.576)
assert n == 422, f"z sets the confidence: at z = 2.576 (99%), a 20% rate within 0.05 needs 422 runs, got {n}"
assert runs_to_judge(0.056, 0.01) > runs_to_judge(0.056, 0.02), "a narrower interval needs more judged runs"
```

**Hint (shown on request):** Start at `n = 1` and step up until the interval is narrow enough. The expected number of failures, `expected_rate * n`, doesn't need to be a whole number; rounding it makes the half-width jump about as `n` grows. Pass `z` on to `wilson`.

**Reference solution:**
```python
def runs_to_judge(expected_rate: float, half_width: float, z: float = 1.96) -> int:
    """The fewest judged runs whose Wilson interval, at the expected failure rate, is no wider than half_width on
    either side of its middle. half_width must be positive."""
    n = 1
    while True:
        low, high = wilson(expected_rate * n, n, z)
        if (high - low) / 2 <= half_width:
            return n
        n += 1


print(runs_to_judge(0.056, 0.02))
```
```
518
```

**Explanation:** At 20%, the Wilson interval needs 245 runs for a half-width of 0.05, one fewer than the usual formula says. At 1% and a half-width of 0.01 it needs 454, where the formula says 381: near 0, the formula's interval is too narrow, so it promises a precision 381 runs can't give. At 0% the formula says no runs are needed at all, and the Wilson interval says 189. The example asks for the relevance failure rate measured above, 5.6%, to within 2 points: 518 judged runs, more than the 480 question runs in both baseline batches together.

---

## Spending the sample where failures are

The platforms' filters let a judge run on chosen runs rather than a random share: runs where a check fired, runs a user marked down, runs that took many steps. That finds failures faster, which matters when the goal is to find runs to read. But a rate measured on filtered runs describes those runs, not the traffic. A judge that fails 30% of the runs where a check fired says nothing directly about the other runs.

To report a rate for the whole traffic from a sample that wasn't uniform, estimate each group separately and weight each by its share of traffic. That's **stratified sampling**, and the first demo already did it with two groups: the runs without an answer, 26 of 480, decided in code on every run; and the answered runs, 454 of 480, judged. The traffic's rate is

> 26/480 × 100% + 454/480 × (the answered runs' judged rate)

which with every answered run judged is 26/480 + 1/480 = 27/480, or 5.6%. A sample can take more runs from a group where failures are more likely, as long as each group's rate is weighted back by its share.

---

## The judge's own errors

A sampled judge's rate has two sources of error. One is which runs happened to be sampled, which the interval above measures. The other is that the judge's verdicts are wrong in some share of runs, which no amount of sampling fixes. [Lesson 7's correction](→ Module 7, the checking the graders lesson, the correcting a pass rate for the judge's errors concept) undoes the second, given the judge's true positive and true negative rates measured on people's labels.

For this judge, those rates rest on almost nothing. Lesson 7's test labels for relevance were five runs: it passed the one a person passed, and failed two of the four a person failed. On that evidence it misses about half of the irrelevant answers, so the true rate among answered runs may well be higher than the one failure in 454 it found, and five labels can't say by how much. Its rates were also measured on the suite's questions, and [Lesson 8 warned](→ Module 7, the calibration lesson, the calibration across a system concept) that new kinds of traffic can break a calibration that held.

The fix is the same as Lesson 7's, aimed at live traffic: have people label a sample of the runs the judge saw, with enough of its passes and its failures in it to measure both error rates. That labelled sample does a second job too. Each failure in it is a real run worth turning into a task, which is where a later concept in this lesson picks up.

---

## Quiz cards

> **Q1.** Which of these graders can run on live traffic, where no one has written the right answer?
> - Whether the answer addresses the question the user asked ✅
> - Whether the answer matches the reference answer for the question
> - Whether the agent's final registry state matches the expected one
> - Whether the agent cited the sections listed as the evidence
>
> *Explanation: Relevance judges an answer against its own question, so it needs nothing written in advance. A reference answer, an expected end state and a list of evidence sections are all written for a task in a suite; live requests don't come with them.*

> **Q2.** The relevance judge passed 25 of 26 runs that ended with no answer. What's the best way to handle those runs?
> - Fail them in code, from the trace, before any judge is asked ✅
> - Rewrite the rubric until the judge fails runs with no answer
> - Judge them with a second, larger model and take the stricter verdict
> - Leave them out of the relevance rate, since they have no answer
>
> *Explanation: Whether a run ended with an answer is in its trace, exactly and on every run, so code can decide it for free. The judge is then only asked what needs judgment. Leaving the runs out would hide failures users saw, and a better rubric or model spends money on a question code already answers.*

> **Q3.** A judge samples 50 runs a day and finds no failures. What does that support?
> - A failure rate of up to about 6% is still quite plausible ✅
> - The agent has no failures of this kind in its traffic
> - The failure rate is below 1%, since 50 runs is a fair sample
> - Nothing, since an interval can't be built from zero failures
>
> *Explanation: By the rule of three, no failures in n runs leaves rates up to about 3/n plausible: 6% at 50 runs. The Wilson interval gives 0% to 7.1%. Zero failures is evidence, but weak evidence, and the Wilson interval is built for exactly this case.*

> **Q4.** Why set the sample as a number of judged runs per day rather than a fixed percentage of traffic?
> - The count of judged runs sets the interval, not their share ✅
> - Percentages can't be set in most of the tracing platforms
> - A fixed number of runs costs the same however busy the day is
> - Judging a percentage would bias the sample towards busy hours
>
> *Explanation: Five percent of a quiet day may be 25 runs, too few for a useful interval, while five percent of a busy day may be far more than needed. The platforms do take a percentage, so the way to use one is to work out the runs needed and set the percentage from expected traffic. Cost is a side effect, not the reason.*

> **Q5.** A judge runs only on runs where a check fired, and fails 30% of them. What can you say about the whole traffic?
> - Nothing yet, until the other runs' rate is weighted in by their share ✅
> - About 30% of all runs fail, since the judge saw a real sample of them
> - Fewer than 30% fail, so the overall rate can be reported as under 30%
> - More than 30% fail, since checks miss many of the problems they target
>
> *Explanation: A filtered sample measures the filtered group. The traffic's rate is each group's rate weighted by its share of traffic, so the runs where no check fired need their own estimate. Without it, the overall rate could be far above or far below 30%.*

> **Q6.** The judge fails 1 of 454 answered runs, but missed two of the four failures in its test labels. What follows?
> - The true failure rate may be higher, and five labels can't say how much ✅
> - The true failure rate is 2 in 454, correcting for the misses it made
> - The judge should be dropped, since a judge that misses failures is useless
> - Nothing, since sampling error is the only error a sampled rate carries
>
> *Explanation: A judge that misses failures pulls its failure rate down, so the true rate is likely higher. Lesson 7's correction could undo that, but it needs error rates measured on enough labels; with five, the correction's interval would cover almost anything. Labelling a sample of live runs is the fix.*
