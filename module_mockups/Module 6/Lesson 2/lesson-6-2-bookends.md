# Module 6, Lesson 2 — Bookends: Accuracy, latency, cost, and false refusals

---

## Intro

> **You'll be able to**
> - Judge any reliability technique on four quantities, accuracy, latency, cost and false refusals, and report a check as what it catches and what it wrongly blocks
> - Compare options fairly by stating the budget's unit and finding the Pareto frontier under it
> - Decide which steps of an agent deserve reliability spending, and pick a configuration for each within latency and false-refusal limits

**Why it matters**
Every technique in the rest of this module makes an agent more dependable
by spending something: calls, tokens, time, or the chance of blocking
something that was fine. Without a way to weigh those, "more reliable"
quietly turns into "slower, costlier and more likely to refuse". This
lesson sets up the accounting that every later lesson reports against.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** An injection classifier cut successful attacks on an agent from
> 57.7% to 8.0%. Why wasn't that enough to recommend it?
> - A) Because 8.0% is still too high for any defence
> - B) Because it also cut completed tasks from 69.0% to 41.5%, and a defence has to be judged on both ✅
> - C) Because classifiers can't run inside an agent loop
> - D) Because the attacks it was tested on were too easy
>
> *Explanation: in AgentDojo, the classifier's false positives aborted many
> legitimate tasks. A tool filter cut attacks about as much with no loss of
> completed tasks. Only the pair of numbers tells them apart.*

> **Q2.** Five samples in one request took under twice as long as one
> sample in the course's runs, while thinking took about thirteen times as
> long as the five samples. What does that show?
> - A) Thinking is always a worse choice than sampling several answers
> - B) Parallel tokens cost the user far less time than sequential ones ✅
> - C) The GPU happened to be busier during the thinking run
> - D) Five samples always cost less than thinking, in every unit
>
> *Explanation: separate samples run side by side; a chain of thought is
> produced one token at a time. So token counts don't predict the wait. The
> exact ratios belong to that GPU and engine.*

> **Q3.** Why did Kapoor et al. argue that agents must be evaluated with
> their cost, not just their accuracy?
> - A) Because accuracy is too noisy to measure on agent benchmarks
> - B) Because costly agents looked like progress when cheap ones matched them ✅
> - C) Because cost is easier to measure than accuracy for any agent
> - D) Because every agent scores about the same accuracy on HumanEval
>
> *Explanation: on HumanEval, retrying or escalating between models sat on
> the cost-accuracy frontier, and several elaborate agents were dominated
> by cheaper options. Without cost, those comparisons are invisible.*

> **Q4.** Option A is 0.2 points more accurate than option B and costs three
> times as much, with overlapping results across repeated runs. Neither is
> dominated. What's the sound conclusion?
> - A) A is better, since its measured accuracy is higher
> - B) B is better, since cheaper is always the safer choice
> - C) A's lead may be noise, so it hasn't earned three times the cost ✅
> - D) Both should be discarded, since neither dominates the other
>
> *Explanation: a frontier built from averages treats small gaps as real.
> Kapoor et al.'s frontier counts an option as better only when the
> difference is significant, which is the error-bar habit from Lesson 1.*

> **Q5.** Where does a single check buy the most reliability in an agent
> that reads, drafts, then sends an email to a customer?
> - A) On the first read, to stop errors as early as possible
> - B) Just before sending, the first step that can't be undone ✅
> - C) Spread thinly across every step
> - D) After sending, to see whether it worked
>
> *Explanation: earlier mistakes do their damage at the first irreversible,
> external step, so a check there catches their effects. Reading back after
> sending is useful too, but can't prevent the harm.*

> **Q6.** Why did Module 2's evaluator-optimizer loop need at least two calls
> even when the first draft was fine?
> - A) Because the judge always runs to decide whether the draft is acceptable ✅
> - B) Because the draft is always generated twice
> - C) Because the loop retries once by default
> - D) Because the critique is appended to every prompt
>
> *Explanation: reflection's cost is certain: a judge call per draft, and
> longer prompts after each rejection. Its benefit isn't: Huang et al. found
> models struggled to correct their own reasoning without outside feedback.*

> **Q7.** A 9B model uses fewer tokens per answer than a 2B model voting
> five times, but more GPU-seconds than the 2B answering once. Which option
> is "cheaper"?
> - A) The 9B, since it generates the fewest tokens per answer
> - B) The 2B voting, since its five samples run in parallel
> - C) It depends on the unit the budget is counted in ✅
> - D) Neither, since cost can't be compared across model sizes
>
> *Explanation: that's why "equal budget" needs a stated unit. Kapoor et al.
> suggest dollars for deployment decisions, with token counts recorded so
> the costs can be recomputed.*

---

## Comprehensive sandbox
*(graded — a configuration for each step of an agent, multi-file)*

**Task shown to learner:** `lib.py` holds `pareto_frontier` from this
lesson. It's read-only. In `plan.py` (the entry file), write
`plan_agent(steps, max_latency, max_false_blocks)`. Each step is
`{"name", "risky", "options"}`, and each option is a measured configuration
`{"name", "accuracy", "cost", "latency", "false_blocks"}`. For each step:

1. Keep only the options with `latency` at most `max_latency` and
   `false_blocks` at most `max_false_blocks`. If none are left, raise
   `ValueError` with the step's name in the message.
2. Find the Pareto frontier of those options on `"cost"` with
   `pareto_frontier`.
3. From the frontier, choose the most accurate option for a risky step and
   the cheapest for any other. Between options that are otherwise equal,
   take the first by name.

Return `{"choices": {step: option name}, "frontiers": {step: frontier names},
"cost": total cost, "latency": total latency}`, the totals being sums over
the chosen options. When you click Run, the code at the bottom plans a
four-step migration agent from made-up measurements.

**Tab: `lib.py`** (read-only)
```python
"""Code from this lesson's concepts. Read-only."""


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

**Tab: `plan.py`** (starter, entry file)
```python
from lib import pareto_frontier


def plan_agent(steps: list[dict], max_latency: float, max_false_blocks: float) -> dict:
    """Pick one measured configuration per step: within the limits, on the cost-accuracy frontier,
    the most accurate for a risky step and the cheapest for any other."""
    ...


def option(name: str, accuracy: float, cost: float, latency: float, false_blocks: float) -> dict:
    return {"name": name, "accuracy": accuracy, "cost": cost, "latency": latency, "false_blocks": false_blocks}


if __name__ == "__main__":
    # made-up measurements for a four-step migration agent; cost in token-units, latency in seconds
    answer_options = [
        option("small, once", 0.93, 1.0, 0.2, 0.00),
        option("small, five and vote", 0.95, 5.0, 0.4, 0.00),
        option("large, once", 0.97, 4.0, 0.8, 0.00),
        option("small, thinking", 0.96, 20.0, 8.0, 0.00),
    ]
    check_options = [
        option("no check", 0.95, 0.0, 0.0, 0.00),
        option("rule check", 0.98, 0.2, 0.1, 0.01),
        option("model check", 0.99, 3.0, 1.0, 0.08),
        option("model check, tuned", 0.99, 3.5, 1.2, 0.03),
    ]
    steps = [
        {"name": "look up the agent", "risky": False, "options": answer_options},
        {"name": "draft the plan", "risky": False, "options": answer_options},
        {"name": "check before the update", "risky": True, "options": check_options},
        {"name": "check before posting", "risky": True, "options": check_options},
    ]
    plan = plan_agent(steps, max_latency=2.0, max_false_blocks=0.05)
    for step, choice in plan["choices"].items():
        print(f"{step:<25} {choice:<22} frontier: {' | '.join(plan['frontiers'][step])}")
    print(f"total cost {plan['cost']:.1f} token-units, total latency {plan['latency']:.1f} s")
```

**Hidden tests:**
```python
import math

from plan import plan_agent


def option(name, accuracy, cost, latency=0.1, false_blocks=0.0):
    return {"name": name, "accuracy": accuracy, "cost": cost, "latency": latency, "false_blocks": false_blocks}


def raises_naming(name, fn, *args):
    try:
        fn(*args)
    except ValueError as error:
        return name in str(error)
    except Exception:
        return False
    return False


def plan_or_none(*args):
    try:
        return plan_agent(*args)
    except ValueError:
        return None


options = [
    option("cheap", 0.80, 1.0),
    option("a cheaper-looking twin", 0.70, 1.0),
    option("mid", 0.90, 3.0),
    option("best but slow", 0.99, 5.0, latency=9.0),
    option("best but blocks", 0.98, 4.0, false_blocks=0.20),
    option("dominated", 0.85, 3.5),
]
steps = [
    {"name": "read", "risky": False, "options": options},
    {"name": "write", "risky": True, "options": options},
]
plan = plan_agent(steps, 2.0, 0.05)
assert isinstance(plan, dict), "return a dict with choices, frontiers, cost and latency"

assert plan["frontiers"]["read"] == ["cheap", "mid"], (
    f"frontier {plan['frontiers']['read']}: drop options over the latency or false-block limits first, then "
    "take pareto_frontier(allowed, 'cost'); expected ['cheap', 'mid']")
assert plan["choices"]["read"] == "cheap", (
    f"read chose {plan['choices']['read']!r}: a step that isn't risky gets the cheapest option on the frontier. "
    "'a cheaper-looking twin' costs the same but is dominated, so it isn't on the frontier")
assert plan["choices"]["write"] == "mid", (
    f"write chose {plan['choices']['write']!r}: a risky step gets the most accurate option on the frontier, "
    "and the frontier only holds options within the limits")
assert math.isclose(plan["cost"], 4.0) and math.isclose(plan["latency"], 0.2), (
    f"cost {plan['cost']}, latency {plan['latency']}: add up the chosen options' cost and latency; expected 4.0 and 0.2")

# an option dominated only by one that breaks a limit is back on the frontier
shadowed = [option("fast", 0.90, 2.0), option("slow, better, cheaper", 0.95, 1.0, latency=5.0)]
plan = plan_or_none([{"name": "s", "risky": True, "options": shadowed}], 2.0, 0.05)
assert plan and plan["choices"]["s"] == "fast", (
    "'fast' is only dominated by an option over the latency limit; filter by the limits before "
    "computing the frontier, so an option you can't use doesn't knock out one you can")

# limits are inclusive
edge = [option("at the limit", 0.9, 1.0, latency=2.0, false_blocks=0.05)]
plan = plan_or_none([{"name": "e", "risky": False, "options": edge}], 2.0, 0.05)
assert plan and plan["choices"]["e"] == "at the limit", "an option exactly at a limit is allowed (<=, not <)"

# identical options both stay on the frontier; take the first by name
twins = [option("twin b", 0.9, 2.0), option("twin a", 0.9, 2.0)]
plan = plan_agent([{"name": "t", "risky": True, "options": twins}], 2.0, 0.05)
assert plan["choices"]["t"] == "twin a", "between identical options, choose the first by name"

assert raises_naming("nothing fits", plan_agent, [{"name": "nothing fits", "risky": False, "options": [option("x", 0.9, 1.0, latency=5.0)]}], 2.0, 0.05), (
    "no option meets the limits: raise ValueError naming the step")
```

**Hint (shown on request):** Filter first, then call
`pareto_frontier(allowed, "cost")`, which gives you names; keep the allowed
options whose names are on it. For the cheapest, `min` over those with the
key `(cost, name)`; for the most accurate, `(-accuracy, cost, name)`. Keep
running totals of the chosen options' cost and latency.

**Reference solution:**

**Tab: `plan.py`**
```python
from lib import pareto_frontier


def plan_agent(steps: list[dict], max_latency: float, max_false_blocks: float) -> dict:
    """Pick one measured configuration per step: within the limits, on the cost-accuracy frontier,
    the most accurate for a risky step and the cheapest for any other."""
    choices, frontiers = {}, {}
    total_cost = total_latency = 0.0
    for step in steps:
        allowed = [o for o in step["options"]
                   if o["latency"] <= max_latency and o["false_blocks"] <= max_false_blocks]
        if not allowed:
            raise ValueError(f"no option for {step['name']} meets the limits")
        names = pareto_frontier(allowed, "cost")
        on_frontier = [o for o in allowed if o["name"] in names]
        if step["risky"]:
            chosen = min(on_frontier, key=lambda o: (-o["accuracy"], o["cost"], o["name"]))
        else:
            chosen = min(on_frontier, key=lambda o: (o["cost"], o["name"]))
        frontiers[step["name"]] = names
        choices[step["name"]] = chosen["name"]
        total_cost += chosen["cost"]
        total_latency += chosen["latency"]
    return {"choices": choices, "frontiers": frontiers, "cost": total_cost, "latency": total_latency}


def option(name: str, accuracy: float, cost: float, latency: float, false_blocks: float) -> dict:
    return {"name": name, "accuracy": accuracy, "cost": cost, "latency": latency, "false_blocks": false_blocks}


if __name__ == "__main__":
    # made-up measurements for a four-step migration agent; cost in token-units, latency in seconds
    answer_options = [
        option("small, once", 0.93, 1.0, 0.2, 0.00),
        option("small, five and vote", 0.95, 5.0, 0.4, 0.00),
        option("large, once", 0.97, 4.0, 0.8, 0.00),
        option("small, thinking", 0.96, 20.0, 8.0, 0.00),
    ]
    check_options = [
        option("no check", 0.95, 0.0, 0.0, 0.00),
        option("rule check", 0.98, 0.2, 0.1, 0.01),
        option("model check", 0.99, 3.0, 1.0, 0.08),
        option("model check, tuned", 0.99, 3.5, 1.2, 0.03),
    ]
    steps = [
        {"name": "look up the agent", "risky": False, "options": answer_options},
        {"name": "draft the plan", "risky": False, "options": answer_options},
        {"name": "check before the update", "risky": True, "options": check_options},
        {"name": "check before posting", "risky": True, "options": check_options},
    ]
    plan = plan_agent(steps, max_latency=2.0, max_false_blocks=0.05)
    for step, choice in plan["choices"].items():
        print(f"{step:<25} {choice:<22} frontier: {' | '.join(plan['frontiers'][step])}")
    print(f"total cost {plan['cost']:.1f} token-units, total latency {plan['latency']:.1f} s")
```
```
look up the agent         small, once            frontier: small, once | large, once
draft the plan            small, once            frontier: small, once | large, once
check before the update   model check, tuned     frontier: no check | rule check | model check, tuned
check before posting      model check, tuned     frontier: no check | rule check | model check, tuned
total cost 9.0 token-units, total latency 2.8 s
```
*(the Run output, from made-up measurements)*

**Explanation:** The order of the steps matters. Filtering by the limits
comes before the frontier, because an option that's only dominated by one
you're not allowed to use is still a good choice: in the tests, "fast" is
beaten only by an option over the latency limit. Choosing from the frontier,
not from every allowed option, stops a dominated option winning a tie on
cost, like "a cheaper-looking twin" in the tests. Risky steps take the most
accurate option on the frontier and the rest take the cheapest, which is
this lesson's rule of spending where the risk is. In the Run output, the
thinking option is ruled out by the latency limit, the untuned model check
by the false-block limit, and five votes of the small model by the large
model answering once, which is more accurate for less. The limits here
apply to each step; a real agent would also set a limit on the whole run's
latency, which in this example comes to 2.8 seconds.
