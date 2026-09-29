# Module 6, Lesson 2 — Concept 3: Equal budgets need a stated unit

---

## "The same budget" isn't one thing

The most common question in this module is some version of "is it better
to spend on A or on B?": five samples and a vote, or one sample with more
thinking, or a stronger model once. The only fair way to answer is at an
equal budget, and that phrase hides a choice. A budget can be counted as:

- **calls or requests,** what a rate limit counts
- **tokens,** in and out, what most API prices are based on
- **compute,** in FLOPs or GPU-seconds, what running a model yourself costs
- **latency,** how long the user waits
- **money,** what you actually pay

These don't move together, so the choice of unit can change which option
wins. Kapoor et al.'s
[*AI Agents That Matter*](https://arxiv.org/abs/2407.01502) draws the line
by who is asking:

- **Comparing models, as a scientist,** it's reasonable to hold compute
  fixed, for example by comparing at equal FLOPs. That's how Snell et al.
  (2024) compared extra test-time compute on a smaller model against a
  model 14 times larger: at matched FLOPs, not matched price.
- **Choosing what to deploy, as a builder,** the cost you care about is the
  money you'll pay, and proxies such as a model's parameter count can
  mislead. They note that prices vary between providers and change over
  time, and recommend reporting input and output token counts alongside
  dollar costs, so anyone can recompute the cost at current prices.

For an agent that users wait on, latency is its own budget, and the
previous concept showed it doesn't follow token counts.

---

## Five options, three units

Here are five ways to answer a question from this module's runs, each costed
per question in three units:

- **tokens:** the average generated per question
- **GPU-seconds:** estimated from each run's overall throughput on its GPU
- **wait:** the median time one request took, from the timed probe

```python
from statistics import mean, median


def per_token_seconds(run: dict) -> float:
    """GPU-seconds per generated token, from the run's overall throughput (one GPU)."""
    return run["timing"]["wall_seconds"] * run["setup"]["gpus_used"] / run["timing"]["generated_tokens"]


def option(label: str, run_name: str, samples: int = 1, thinking: bool = False) -> dict:
    run = load_run(run_name)
    if thinking:
        replies = [s for r in run["results"] for s in r["samples"]]
        tokens = mean(s["thinking_tokens"] + s["by_budget"]["4096"]["tokens"] for s in replies)
        latency = median(t["seconds"] for t in run["timing"]["latency_probe"]["thinking_then_answer"])
    else:
        tokens = samples * mean(s["tokens"] for r in run["results"] for s in r["samples"])
        latency = median(t["seconds"] for t in run["timing"]["latency_probe"][f"samples_{samples}"])
    return {"option": label, "tokens": tokens, "gpu_seconds": tokens * per_token_seconds(run), "latency": latency}


options = [
    option("2B, one answer", "plain.smaller"),
    option("2B, five answers", "plain.smaller", samples=5),
    option("2B, thinking", "thinking.smaller", thinking=True),
    option("4B, one answer", "plain"),
    option("9B, one answer", "stronger"),
]
print(f"{'':<18}{'tokens':>8}{'GPU-s':>9}{'wait (s)':>10}")
for o in options:
    print(f"{o['option']:<18}{o['tokens']:>8.0f}{o['gpu_seconds']:>9.3f}{o['latency']:>10.2f}")
print()
for unit in ("tokens", "gpu_seconds", "latency"):
    ranked = sorted(options, key=lambda o: o[unit])
    print(f"cheapest first by {unit}: " + ", ".join(o["option"] for o in ranked))
```
```
                    tokens    GPU-s  wait (s)
2B, one answer          84    0.016      0.23
2B, five answers       422    0.081      0.38
2B, thinking          1994    0.167      8.09
4B, one answer         106    0.031      0.48
9B, one answer          82    0.061      0.84

cheapest first by tokens: 9B, one answer, 2B, one answer, 4B, one answer, 2B, five answers, 2B, thinking
cheapest first by gpu_seconds: 2B, one answer, 4B, one answer, 9B, one answer, 2B, five answers, 2B, thinking
cheapest first by latency: 2B, one answer, 2B, five answers, 4B, one answer, 9B, one answer, 2B, thinking
```
*(runs live, shows output — read-only demo snippet, not graded. Real
timings and token counts from the committed runs on one Colab G4 GPU. The
GPU-seconds are an estimate from each run's throughput with many requests
batched together; the waits are medians over ten questions sent one at a
time.)*

The three units give three different orders:

- **By tokens,** the 9B model answering once is the cheapest option, because
  its answers happen to be short.
- **By GPU-seconds,** it's third: each of its tokens takes far more compute
  than a 2B token.
- **By the user's wait,** five 2B answers in parallel come second, ahead of
  the 4B answering once, even though they cost four times the tokens.

This table deliberately leaves out accuracy. Which of these options gives
the most reliable answers is Lesson 5's question, answered there from the
research. The point here is narrower: before saying one option beats
another "at the same budget", say which budget, because the ranking can
flip with the unit.

---

## Comparing on two axes: the Pareto frontier

Once cost has a unit, options can be compared on accuracy and cost
together. An option is **dominated** if another option is at least as
accurate and at least as cheap, and strictly better on one of the two:
there's no reason to pick it. The options that aren't dominated form the
**Pareto frontier**, and choosing among them is a real trade: more accuracy
for more cost.

Kapoor et al. published their HumanEval results as accuracy and dollar cost
for each agent, averaged over five runs. Here's which ones are dominated:

```python
# Kapoor et al. (2024), Table A1: mean accuracy (%) and mean total cost (US$) over five runs on HumanEval
agents = [
    ("LATS (GPT-4)", 88.0, 134.50), ("LATS (GPT-3.5)", 80.4, 9.49),
    ("LDB (GPT-4, GPT-3.5)", 91.0, 2.19), ("LDB (Reflexion, GPT-4)", 92.9, 7.26),
    ("LDB (Reflexion, GPT-3.5)", 88.9, 4.19), ("LDB (GPT-4)", 93.3, 6.36),
    ("LDB (GPT-3.5)", 80.2, 0.63), ("GPT-4", 89.6, 1.93), ("GPT-3.5", 73.9, 0.05),
    ("Reflexion (GPT-4)", 87.8, 3.90), ("Warming (GPT-4)", 93.2, 2.45),
    ("Retry (GPT-4)", 92.0, 2.51), ("Escalation", 85.0, 0.27),
]


def dominates(a: tuple, b: tuple) -> bool:
    """a is at least as accurate and at least as cheap as b, and strictly better on one of the two."""
    _, acc_a, cost_a = a
    _, acc_b, cost_b = b
    return acc_a >= acc_b and cost_a <= cost_b and (acc_a > acc_b or cost_a < cost_b)


for agent in sorted(agents, key=lambda a: a[2]):
    beaten_by = [other[0] for other in agents if dominates(other, agent)]
    verdict = "on the frontier" if not beaten_by else "dominated by " + ", ".join(beaten_by)
    print(f"{agent[0]:<26}{agent[1]:>5.1f}%  ${agent[2]:>7.2f}  {verdict}")
```
```
GPT-3.5                    73.9%  $   0.05  on the frontier
Escalation                 85.0%  $   0.27  on the frontier
LDB (GPT-3.5)              80.2%  $   0.63  dominated by Escalation
GPT-4                      89.6%  $   1.93  on the frontier
LDB (GPT-4, GPT-3.5)       91.0%  $   2.19  on the frontier
Warming (GPT-4)            93.2%  $   2.45  on the frontier
Retry (GPT-4)              92.0%  $   2.51  dominated by Warming (GPT-4)
Reflexion (GPT-4)          87.8%  $   3.90  dominated by LDB (GPT-4, GPT-3.5), GPT-4, Warming (GPT-4), Retry (GPT-4)
LDB (Reflexion, GPT-3.5)   88.9%  $   4.19  dominated by LDB (GPT-4, GPT-3.5), GPT-4, Warming (GPT-4), Retry (GPT-4)
LDB (GPT-4)                93.3%  $   6.36  on the frontier
LDB (Reflexion, GPT-4)     92.9%  $   7.26  dominated by LDB (GPT-4), Warming (GPT-4)
LATS (GPT-3.5)             80.4%  $   9.49  dominated by LDB (GPT-4, GPT-3.5), LDB (Reflexion, GPT-4), LDB (Reflexion, GPT-3.5), LDB (GPT-4), GPT-4, Reflexion (GPT-4), Warming (GPT-4), Retry (GPT-4), Escalation
LATS (GPT-4)               88.0%  $ 134.50  dominated by LDB (GPT-4, GPT-3.5), LDB (Reflexion, GPT-4), LDB (Reflexion, GPT-3.5), LDB (GPT-4), GPT-4, Warming (GPT-4), Retry (GPT-4)
```
*(runs live, shows output — read-only demo snippet, not graded. The
numbers are Kapoor et al.'s, from their Table A1, measured with April 2024
prices.)*

The elaborate agents mostly fall off the frontier. LATS with GPT-4 is
dominated by seven other options, one of which, simply calling GPT-4 once,
is about 70 times cheaper and more accurate. The simple baselines, such as
escalating from cheap models to expensive ones only when a test fails, or
retrying with a rising temperature ("Warming"), sit on it.

Two cautions about reading a frontier:

- **Differences can be noise.** LDB with GPT-4 stays on this frontier
  because its mean accuracy is 0.1 points above Warming's, at more than
  twice the cost. Across their five runs, the two agents' accuracies
  overlapped (92.1–94.5% and 92.1–93.9%). Kapoor et al.'s own frontier only
  counts an option as better when the difference is significant, which is
  [the error-bar habit from the previous lesson](→ Module 6, why agents fail lesson, the same question, run twice concept, the "how sure can we be of these numbers?" section).
- **Their version is also convex.** Since you can run agent A some of the
  time and agent B the rest, any mix of two frontier points is achievable,
  and Kapoor et al. drop points that lie below that line. By that rule,
  calling GPT-4 once isn't on their frontier; by plain dominance, as here,
  it is.

---

## Applied sandbox exercise
*(graded — the Pareto frontier of options, under a chosen cost)*

**Task shown to learner:** Write `pareto_frontier(options, cost_key)`. Each
option is a dict with a `"name"`, an `"accuracy"` (higher is better) and one
or more costs (lower is better); `cost_key` names the cost to compare on.
An option is dominated if another is at least as accurate and at least as
cheap on that cost, and strictly better on one of the two. Return the names
of the options that aren't dominated, cheapest first, with ties in cost
ordered by name. Raise `ValueError` if there are no options.

**Starter code:**
```python
def pareto_frontier(options: list[dict], cost_key: str) -> list[str]:
    """The names of the options no other option beats: none is at least as accurate and at least
    as cheap on cost_key while strictly better on one of the two. Cheapest first, ties by name."""
    ...


options = [
    {"name": "small once", "accuracy": 0.80, "tokens": 100, "latency": 0.2},
    {"name": "small vote", "accuracy": 0.88, "tokens": 500, "latency": 0.4},
    {"name": "large once", "accuracy": 0.90, "tokens": 90, "latency": 0.9},
]
print(pareto_frontier(options, "tokens"))
print(pareto_frontier(options, "latency"))
```

**Hidden tests:**
```python
def raises(fn, *args):
    try:
        fn(*args)
    except ValueError:
        return True
    except Exception:
        return False
    return False


options = [
    {"name": "small once", "accuracy": 0.80, "tokens": 100, "latency": 0.2},
    {"name": "small vote", "accuracy": 0.88, "tokens": 500, "latency": 0.4},
    {"name": "small thinking", "accuracy": 0.90, "tokens": 2000, "latency": 8.0},
    {"name": "large once", "accuracy": 0.90, "tokens": 90, "latency": 0.9},
    {"name": "large vote", "accuracy": 0.91, "tokens": 450, "latency": 1.4},
]
got = pareto_frontier(options, "tokens")
assert isinstance(got, list), "return a list of option names"
assert got == ["large once", "large vote"], (
    f"by tokens got {got}: 'large once' is as accurate as 'small thinking' for far fewer tokens, and "
    "at least as accurate as 'small once' and 'small vote' for fewer; expected ['large once', 'large vote']")

got = pareto_frontier(options, "latency")
assert got == ["small once", "small vote", "large once", "large vote"], (
    f"by latency got {got}: use the cost named by cost_key, not a fixed field. Measured by the wait, "
    "only 'small thinking' is beaten; expected ['small once', 'small vote', 'large once', 'large vote']")

ties = [
    {"name": "b", "accuracy": 0.9, "cost": 1.0},
    {"name": "a", "accuracy": 0.9, "cost": 1.0},
    {"name": "c", "accuracy": 0.9, "cost": 2.0},
    {"name": "d", "accuracy": 0.8, "cost": 1.0},
]
got = pareto_frontier(ties, "cost")
assert got == ["a", "b"], (
    f"got {got}: identical options don't beat each other, so a and b both stay (sorted by name when "
    "the cost ties); c costs more for the same accuracy and d is less accurate for the same cost")

assert pareto_frontier([{"name": "only", "accuracy": 0.5, "cost": 3}], "cost") == ["only"], "a single option is its own frontier"
assert raises(pareto_frontier, [], "cost"), "no options: raise ValueError"
```

**Hint (shown on request):** Write `dominates(a, b)` first, using
`a[cost_key]`, not a fixed field. Note that identical options don't dominate
each other: "at least as good on both" isn't enough, one of the two has to
be strictly better. Then keep each option that no other option dominates,
and sort what's left by `(cost, name)`.

**Reference solution:**
```python
def pareto_frontier(options: list[dict], cost_key: str) -> list[str]:
    """The names of the options no other option beats: none is at least as accurate and at least
    as cheap on cost_key while strictly better on one of the two. Cheapest first, ties by name."""
    if not options:
        raise ValueError("no options to compare")

    def dominates(a: dict, b: dict) -> bool:
        at_least_as_good = a["accuracy"] >= b["accuracy"] and a[cost_key] <= b[cost_key]
        strictly_better = a["accuracy"] > b["accuracy"] or a[cost_key] < b[cost_key]
        return at_least_as_good and strictly_better

    frontier = [o for o in options if not any(dominates(other, o) for other in options)]
    return [o["name"] for o in sorted(frontier, key=lambda o: (o[cost_key], o["name"]))]
```
```
['large once']
['small once', 'small vote', 'large once']
```
*(the starter's printout, with the reference in place)*

**Explanation:** Dominance needs both parts: at least as good on accuracy
and cost, and strictly better on at least one, so an option never knocks
out an identical copy of itself, or itself. Requiring strict improvement on
both would let an option survive that costs more for exactly the same
accuracy. The cost comes from `cost_key` because the frontier depends on
the unit: in the test data, measured by tokens only the larger model's
options survive, while measured by latency four of the five do. A
single-pass version that sorts by cost and keeps each option more accurate
than everything cheaper is tempting and fast, but it drops the second of
two identical options.

---

## Quiz cards

> **Q1.** A colleague reports that "five samples beat thinking at the same
> budget". What should you ask first?
> - A) Which model they used for the thinking
> - B) Which budget: tokens, compute, latency or money, since the ranking can change with the unit ✅
> - C) Whether the samples were run at temperature 0
> - D) Nothing, since equal budget is a well-defined comparison
>
> *Explanation: five parallel samples and a long chain of thought can use
> similar numbers of tokens and very different amounts of the user's time.
> In this concept's runs, the options ranked differently under tokens,
> GPU-seconds and latency.*

> **Q2.** Kapoor et al. distinguish comparing models from choosing what to
> deploy. Which cost do they say a builder choosing what to deploy should
> use?
> - A) The number of parameters, since it's stable over time
> - B) FLOPs, since they don't depend on the provider
> - C) The dollar cost, with input and output token counts reported so it can be recomputed as prices change ✅
> - D) Latency only, since users care about nothing else
>
> *Explanation: for a scientific comparison of models, holding compute
> fixed is reasonable. For deployment, what you pay is the construct of
> interest, and proxies like active parameters can mislead. Recording token
> counts keeps the comparison useful after prices move.*

> **Q3.** In the runs, the 9B model answering once used the fewest tokens of
> the five options, but ranked third by GPU-seconds. Why?
> - A) Its answers were cut off
> - B) Each of its tokens takes more compute than a smaller model's, so fewer tokens can still cost more ✅
> - C) It ran on a slower GPU than the other models
> - D) GPU-seconds include the time to download the model
>
> *Explanation: a token from a larger model needs more arithmetic. Counting
> tokens treats every model's tokens as equal, which is why a comparison
> across model sizes needs compute, money or time rather than tokens alone.*

> **Q4.** Agent X is 0.1 points more accurate than agent Y at twice the cost,
> and their accuracy ranges across repeated runs overlap. Plain dominance
> keeps both on the frontier. What's the careful reading?
> - A) X is the better agent, since it's on the frontier with higher accuracy
> - B) The difference may be noise, so X hasn't shown it's worth twice the cost ✅
> - C) Y should be dropped, since it's less accurate
> - D) Both should be dropped, since neither dominates the other
>
> *Explanation: a frontier built from averages treats a 0.1-point gap as
> real. Kapoor et al. only count an option as better when the difference is
> significant, which is the same per-question uncertainty the previous
> lesson measured with a bootstrap.*

> **Q5.** Why doesn't an option dominate an identical copy of itself?
> - A) Because dominance requires being strictly better on at least one of accuracy or cost ✅
> - B) Because identical options are merged before comparing
> - C) Because only the cheaper option can dominate
> - D) Because dominance only compares options with different names
>
> *Explanation: "at least as good on both" alone would let two identical
> options knock each other out, leaving neither on the frontier. Adding
> "strictly better on one" keeps both, which is what the exercise's tests
> check.*

---

*(End of this concept. The next concept is about where to spend: which
steps of an agent deserve reliability spending, and which don't.)*
