# Module 7, Lesson 11 — Concept 4: When what people ask changes

> **Note for the site build:**
> - `scripts/eval/monitoring_traffic.py` now also writes `public/data/eval/monitoring/question-mix.json` (80 KB): every development run of the baseline's two batches, with its task's kind, the kind's category and whether it passed (code checks and revised judges, from `ablations/results.json`). Use `m7-l11-c4-site-build.zip`, which replaces concept 3's: rerun the script, check all six outputs are identical to the copies in the zip, run `--check`, and commit.
> - This page reads only `question-mix.json`. Its setup is `LOAD_TRAFFIC` + the setup block shown below (`mix_runs`, `by_category`, `reference_mix`, `arrivals`); add it to `evalData.ts` as `QUESTION_MIX`, byte-identical to the page. The exercise uses the same setup.
> - Add the exercise's reference `psi` as `PSI`. The three demos come after the exercise and need `PSI` in their setup. The second and third continue from the first: put the first demo's code, minus its printing, into their hidden setup. The second takes about a second in CPython.

---

## The dashboard moves when the traffic does

[The previous concepts' stream](→ this lesson, the is this a real change? concept, a number that moves every hour) kept one thing fixed: the mix of requests. Every window drew from the same blend of questions, model changes and emails. Real traffic doesn't hold still. A team starts using the agent for something new, a product launch brings a wave of one kind of question, a change elsewhere makes some requests pointless. [Module 5 ended](→ Module 5, the a retrieval system for a new corpus lesson, the one honest number concept, reading it) on exactly this: real users ask things nobody wrote down, and what they ask drifts as the product changes. Anthropic's guide gives production monitoring the job of detecting that kind of drift.

The mix matters because every number on the dashboard is an average over it. An agent that answers documentation questions well and emails poorly will show a falling pass rate, and rising costs, the day emails become more common, without anything about the agent changing. Watching the mix itself separates "the agent got worse" from "the agent is being asked different things", and it can be done on every run, with no grading at all.

---

## Categories first

To watch a mix, each request needs a category. Live requests don't arrive labelled, so in production something assigns them:

- **A classifier:** a small model, or a cheap call to a larger one, that puts each request into one of a fixed list of categories. Simple and stable, but it only knows the categories someone listed.
- **Clustering:** grouping requests by meaning to find what people actually ask, including kinds nobody anticipated. Anthropic's [Clio](https://arxiv.org/abs/2412.13678) works this way: a model summarizes each conversation into short, privacy-preserving descriptions, the descriptions are clustered into topics, and analysts look only at the clusters. Anthropic reports using it to watch for unknown kinds of use around launches of new capabilities.

Either way, the categories are a model's output, with errors of their own, and a change to the classifier is itself a change to the mix. That's worth remembering when a shift appears the same week the classifier was updated.

This simulation sidesteps the problem: each recorded run's task has a kind written when the suite was built, and the setup groups the 41 kinds into 6 categories. A real classifier would be wrong some of the time; this one never is. Each simulated request draws a category from a mix, then a recorded run of that category:

```python
import random
from collections import Counter, defaultdict

mix_runs = json.loads((MONITORING / "question-mix.json").read_text(encoding="utf-8"))["runs"]
by_category = defaultdict(list)
for run in mix_runs:
    by_category[run["category"]].append(run)
# the baseline's own mix of requests, as shares
reference_mix = {name: len(runs) / len(mix_runs) for name, runs in sorted(by_category.items())}


def arrivals(mix: dict[str, float], n: int, rng: random.Random) -> list[dict]:
    """n simulated requests: each one's category drawn from `mix`, then one recorded run of that category."""
    names = list(mix)
    picked = rng.choices(names, weights=[mix[name] for name in names], k=n)
    return [rng.choice(by_category[name]) for name in picked]
```
*(defined once here and already loaded for every demo and the exercise in this concept, with this lesson's `MONITORING` path)*

---

## The population stability index

The standard measure for "how far has a mix moved" comes from credit scoring, where banks check whether today's applicants still look like the ones a model was built on. The **population stability index** (PSI) compares the share of each category in a reference period, e, with its share now, a:

> PSI = Σ (a − e) × ln(a / e), summed over the categories

Each category adds a positive amount whenever its share has moved in either direction, and a category that has grown or shrunk by a large factor adds the most. PSI is closely related to the Kullback–Leibler divergence: it's the divergence measured both ways and added together, which is why swapping the two mixes gives the same value. A category with no requests on one side has a share of 0 and an infinite logarithm, so implementations give it a small floor instead.

PSI is common in drift-monitoring tools. [Evidently](https://docs.evidentlyai.com/metrics/customize_data_drift), for instance, offers it for categorical and numerical data, with a default threshold of 0.1. In credit scoring, 0.1 and 0.25 are the usual thresholds: under 0.1 the population is stable, over 0.25 it has shifted. [Yurdakul and Naranjo (2020)](https://www.risk.net/journal-of-risk-model-validation/7725371/statistical-properties-of-the-population-stability-index) point out that these thresholds have no statistical basis, and that what PSI shows by chance alone depends on the number of categories and on the sizes of both samples. The demos below show how much.

---

## Applied sandbox exercise
*(graded — the population stability index between two counts of categories)*

**Task shown to learner:**

Write `psi(reference, current, floor=0.0001)`. Both arguments map category names to counts of requests. Turn each into shares of its own total, then sum `(a - e) * ln(a / e)` over every category that appears in either, where `e` is the category's share in `reference` and `a` its share in `current`. A category with a count of 0, or missing, on one side takes the share `floor` there. Return a float.

**Starter code:**
```python
def psi(reference: dict[str, int], current: dict[str, int], floor: float = 0.0001) -> float:
    """..."""
    # your code here


print(psi({"docs question": 49, "email": 4, "model change": 10}, {"docs question": 42, "email": 14, "model change": 7}))
```

**Hidden tests:**
```python
from math import isclose


def checked(reference, current, **options):
    try:
        return psi(reference, current, **options)
    except (ZeroDivisionError, ValueError, KeyError) as error:
        raise AssertionError(f"psi({reference}, {current}) crashed with {error!r}: a category with no runs on one side "
                             "takes the share `floor` there, so nothing divides by zero or takes the log of 0")

value = checked({"docs question": 60, "email": 40}, {"docs question": 60, "email": 40})
assert isinstance(value, float), f"psi should return a float: got {value!r}"
assert isclose(value, 0.0, abs_tol=1e-12), f"identical mixes have a PSI of 0: got {value}"
assert isclose(checked({"a": 50, "b": 50}, {"a": 10, "b": 10}), 0.0, abs_tol=1e-12), \
    "PSI compares shares, not counts: 50/50 and 10/10 are the same mix"

value = checked({"a": 80, "b": 20}, {"a": 50, "b": 50})
assert isclose(value, 0.4158883083359672, rel_tol=1e-9), \
    f"80/20 against 50/50: (0.5 - 0.8) ln(0.5 / 0.8) + (0.5 - 0.2) ln(0.5 / 0.2) = 0.4159, got {value}"
assert isclose(checked({"a": 50, "b": 50}, {"a": 80, "b": 20}), value, rel_tol=1e-9), \
    "PSI is symmetric: swapping the reference and the current mix gives the same value"
assert isclose(checked({"a": 30, "b": 70}, {"a": 30, "b": 70, "c": 0}), 0.0, abs_tol=1e-12), \
    "a category counted 0 on both sides adds nothing"

value = checked({"a": 90, "b": 10}, {"a": 100})
assert isclose(value, 0.7006208039360982, rel_tol=1e-9), \
    f"b missing from the current counts takes the share 0.0001: expected 0.7006, got {value}"
assert isclose(checked({"a": 90, "b": 10}, {"a": 100}, floor=0.001), 0.46644789997860364, rel_tol=1e-9), \
    "floor is a parameter: with floor=0.001 the missing share is 0.001"
value = checked({"a": 100}, {"a": 75, "new": 25})
assert isclose(value, 2.0271496162259326, rel_tol=1e-9), \
    f"a new category, 25% of current traffic, counts fully: expected 2.0271, got {value}"
```

**Hint (shown on request):** Collect the categories from both dicts, for example with `reference.keys() | current.keys()`, so a category that only appears now still counts. Divide each count by its own side's total. `x or floor` turns a share of 0 into the floor.

**Reference solution:**
```python
from math import log


def psi(reference: dict[str, int], current: dict[str, int], floor: float = 0.0001) -> float:
    """The population stability index between two counts of categories. Each count becomes a share of its own total;
    a category missing from either side gets the share `floor`, so the logarithm stays finite."""
    expected_total, actual_total = sum(reference.values()), sum(current.values())
    index = 0.0
    for name in reference.keys() | current.keys():
        expected = reference.get(name, 0) / expected_total or floor
        actual = current.get(name, 0) / actual_total or floor
        index += (actual - expected) * log(actual / expected)
    return index


print(psi({"docs question": 49, "email": 4, "model change": 10}, {"docs question": 42, "email": 14, "model change": 7}))
```
```
0.23296363929461408
```

**Explanation:** Shares, not counts, make two windows of different sizes comparable. Taking categories from both sides matters most in practice: a new kind of request that never appeared in the reference period is exactly the shift worth noticing, and a version that only loops over the reference's categories gives it no weight at all. The floor keeps the logarithm finite, and its size matters. A category that vanishes contributes about its old share times ln(old share / floor), so a smaller floor makes a missing category count for more. In the example, emails rising from 6% to 22% of a window gives a PSI of 0.23, close to the usual "shifted" threshold.

---

## A shift arrives

Here's a simulated stream, 200 requests per window. Halfway through, the team that runs the on-call channel starts asking the agent to email agent owners, and requests to email become four times as common:

```python
reference_counts = Counter(run["category"] for run in mix_runs)
# after the change: requests to email agent owners become four times as common
shifted = dict(reference_mix, email=reference_mix["email"] * 4)
shifted = {name: share / sum(shifted.values()) for name, share in shifted.items()}

rng = random.Random(1)
print(f"{'window':>8}  {'email share':>11}  {'PSI':>6}  {'pass rate (offline grades)':>26}")
for window in range(10):
    runs = arrivals(reference_mix if window < 5 else shifted, 200, rng)
    counts = Counter(run["category"] for run in runs)
    shift = "   <- the mix changes" if window == 5 else ""
    print(f"{window + 1:>8}  {counts['email'] / len(runs):>11.1%}  {psi(reference_counts, counts):>6.3f}  "
          f"{sum(run['passed'] for run in runs) / len(runs):>26.1%}{shift}")
```
```
  window  email share     PSI  pass rate (offline grades)
       1         4.0%   0.014                       78.0%
       2         6.0%   0.022                       82.0%
       3         6.5%   0.013                       77.5%
       4         7.5%   0.020                       80.5%
       5         6.5%   0.017                       78.5%
       6        22.5%   0.304                       72.5%   <- the mix changes
       7        15.0%   0.129                       78.5%
       8        19.5%   0.226                       72.5%
       9        15.5%   0.169                       80.0%
      10        18.5%   0.193                       79.5%
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: requests drawn by category from the baseline's recorded development runs, both batches; the pass rates are the recorded runs' offline grades, which live traffic wouldn't have)*

PSI jumps from around 0.02 to between 0.13 and 0.30 the moment the mix changes, and stays there. The pass rate, even with every run graded, which live traffic never is, wobbles between 77.5% and 82% before the change and between 72.5% and 80% after it. A reader of that column couldn't say when anything happened.

---

## How big a PSI means something

The 0.1 threshold assumes a PSI has the same meaning everywhere. Here's what PSI does with nothing changed, as the 95th percentile of 500 windows drawn from the baseline's own mix, for three window sizes and two ways of splitting the same requests: the 6 categories, or all 41 kinds. Each row also counts how often the shift above was caught, by PSI over that 95th percentile and by the window's pass rate falling clearly below the baseline's:

```python
from math import sqrt

kind_counts = Counter(run["kind"] for run in mix_runs)
baseline_pass = sum(run["passed"] for run in mix_runs) / len(mix_runs)

rng = random.Random(0)
print(f"{'window':>6}  {'bins':>8}  {'PSI, nothing changed (95th pct)':>32}  {'PSI caught the shift':>20}  {'pass rate caught it':>19}")
for n in (100, 200, 500):
    for label, field, reference in (("6", "category", reference_counts), ("41 kinds", "kind", kind_counts)):
        quiet = sorted(psi(reference, Counter(run[field] for run in arrivals(reference_mix, n, rng))) for _ in range(500))
        limit = quiet[474]
        caught = graded = 0
        for _ in range(500):
            runs = arrivals(shifted, n, rng)
            caught += psi(reference, Counter(run[field] for run in runs)) > limit
            # even with every run graded: is the window's pass rate clearly below the baseline's?
            rate = sum(run["passed"] for run in runs) / n
            graded += rate < baseline_pass - 1.96 * sqrt(baseline_pass * (1 - baseline_pass) / n)
        print(f"{n:>6}  {label:>8}  {limit:>32.3f}  {caught / 500:>20.0%}  {graded / 500:>19.0%}")
```
```
window      bins   PSI, nothing changed (95th pct)  PSI caught the shift  pass rate caught it
   100         6                             0.145                   80%                  18%
   100  41 kinds                             1.049                   29%                  20%
   200         6                             0.058                  100%                  28%
   200  41 kinds                             0.467                   58%                  32%
   500         6                             0.022                  100%                  64%
   500  41 kinds                             0.133                  100%                  60%
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: requests drawn by category from the baseline's recorded development runs, both batches; "pass rate caught it" assumes every run in the window was graded)*

- **The rule of thumb depends on the window.** With 6 categories, chance alone takes PSI past 0.1 in more than one window in twenty at 100 requests, and almost never at 500. A fixed threshold is too sensitive for small windows and too lax for large ones.
- **More categories, more noise.** Split the same requests 41 ways and one window of 100 in twenty reaches a PSI over 1 by chance, because most kinds get no requests at all and each empty kind adds its share times a large logarithm. That's Yurdakul and Naranjo's point in practice: the same threshold means different things with different numbers of categories. A useful rule is to measure the quiet-period distribution, as this demo does, and set the threshold from it.
- **The mix is easier to see than its effect.** With 6 categories, PSI caught the shift in every window of 200. The pass rate, graded on every run, caught it in under a third. The mix moved a lot; what it did to the pass rate, about 4 points, is small next to a window's own noise.

---

## What to do about a shift

A shift isn't a failure. It says the traffic is no longer the traffic the suite was built for, and the next steps follow from that. The suite's per-category results show what the new mix should do to the pass rate, without grading a single live run:

```python
from statistics import mean

suite_rate = {name: mean(run["passed"] for run in runs) for name, runs in by_category.items()}
print(f"{'category':<15}{'runs graded':>12}{'pass rate':>11}{'share before':>14}{'share after':>13}")
for name in reference_mix:
    print(f"{name:<15}{len(by_category[name]):>12}{suite_rate[name]:>11.0%}{reference_mix[name]:>14.1%}{shifted[name]:>13.1%}")
for label, mix in (("before", reference_mix), ("after", shifted)):
    print(f"pass rate expected for the traffic {label} the change: {sum(mix[name] * suite_rate[name] for name in mix):.1%}")
```
```
category        runs graded  pass rate  share before  share after
conversation             60        90%          7.8%         6.7%
docs question           490        79%         63.6%        55.1%
email                    40        50%          5.2%        18.0%
lookup                   50        94%          6.5%         5.6%
model change            100        89%         13.0%        11.2%
should not act           30        73%          3.9%         3.4%
pass rate expected for the traffic before the change: 80.4%
pass rate expected for the traffic after the change: 76.3%
```
*(runs live, shows output — read-only demo snippet, not graded; the pass rates are the baseline's offline grades for each category, weighted by each mix)*

That's [the previous concept's stratified weighting](→ this lesson, the judges on a sample concept, spending the sample where failures are), used to predict: each category's pass rate from the suite, weighted by its share of live traffic. The new mix should cost about 4 points, all of it because emails, the category the agent handles worst, grew from 5% of requests to 18%.

The table also shows where the suite is weakest. Its email pass rate rests on 40 runs of just 4 tasks, one of its smallest groups, and now emails are nearly a fifth of the traffic. So:

- **Report pass rates weighted by the live mix,** not the suite's own mix, so the number describes the traffic users actually send.
- **Add tasks where traffic grew.** Module 5 named a shift in what people ask as the cue to add questions to the labelled set; here, it's the cue to write more email tasks, from the real requests that caused the shift.
- **Read the new traffic.** A category that grew may contain kinds of request nobody wrote a task for, and the only way to know is to read some.

Turning those requests into tasks is the next concept's subject.

---

## Quiz cards

> **Q1.** Why can a dashboard's pass rate and cost move when nothing about the agent has changed?
> - Every number averages over a mix of requests, and the mix moves ✅
> - Traces record slightly different attributes from one day to the next
> - The model's sampling makes each day's agent a little different
> - Monitoring tools round their numbers differently on busy days
>
> *Explanation: An agent that handles some kinds of request better than others shows a different average when the blend changes. Sampling makes individual runs differ, but it doesn't move a day's average in one direction. Watching the mix separates a changed agent from changed traffic.*

> **Q2.** A window of 100 requests over 6 categories has a PSI of 0.13. What should you conclude?
> - Not much: windows that size often get that high by chance ✅
> - The mix has shifted, since anything above 0.1 counts as a real change
> - The mix is unchanged, since a real shift always shows above 0.25
> - The categories are badly chosen, since a PSI should stay under 0.1
>
> *Explanation: In the simulation, 1 window in 20 of 100 requests reached 0.145 with nothing changed. The 0.1 and 0.25 thresholds don't account for the window's size or the number of categories, so the honest threshold comes from measuring PSI in a quiet period.*

> **Q3.** PSI caught the email shift in every 200-request window, but the pass rate, graded on every run, caught it in under a third. Why?
> - The mix moved a lot; the pass rate moved only about four points ✅
> - PSI is computed by a judge, which is more sensitive than a code check
> - Pass rates can only be compared on windows of five hundred or more
> - PSI counts more runs than the pass rate does in each of the windows
>
> *Explanation: Emails went from about 5% to 18% of requests, a big change in shares. Its effect on the pass rate is diluted by every other category, and a window of 200 graded runs has a noise band wider than four points. Both use the same runs; no judge is involved in PSI.*

> **Q4.** The same requests are split into 41 kinds instead of 6 categories. What happens to PSI?
> - Chance alone gives larger values, so a fixed threshold misleads ✅
> - It becomes more sensitive, so 41 kinds always catch shifts sooner
> - It stays the same, because PSI compares shares and not counts
> - It can't be computed until every kind has at least one request
>
> *Explanation: With many small categories, most get few or no requests in a window, and each empty one adds a large term through the floor. In the simulation, windows of 100 reached a PSI above 1 with nothing changed. Finer categories need larger windows or thresholds measured from quiet periods.*

> **Q5.** In production, where do the categories for PSI come from?
> - A classifier or a clustering of requests, which can err too ✅
> - The tasks in the evaluation suite, which list each request's kind
> - The users, who pick a category from a list before they ask
> - The trace, which records a category on every agent's root span
>
> *Explanation: Live requests aren't labelled, so a model assigns categories, either from a fixed list or by clustering, as Clio does. Its errors and its updates both show up as changes in the mix. The simulation used the suite's kinds, which a real system doesn't have.*

> **Q6.** Emails grow from 5% to 18% of requests, and the suite's email pass rate rests on 40 runs. What should the team do?
> - Add email tasks, built from the real requests behind the shift ✅
> - Nothing, because the agent itself hasn't changed in any way
> - Drop the email tasks, since they pull the suite's pass rate down
> - Rerun the existing email tasks until their pass rate improves
>
> *Explanation: The category that grew is the one the suite knows least about and the agent handles worst. More tasks there make the suite match the traffic and give its weakest estimate more evidence. Dropping tasks hides the problem, and rerunning the same ones adds trials, not coverage.*
