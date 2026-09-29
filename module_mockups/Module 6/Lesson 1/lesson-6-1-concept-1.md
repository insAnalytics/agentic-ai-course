# Module 6, Lesson 1 — Concept 1: Small errors compound over many steps

---

## Every step has to go right

A single model call that's right 95% of the time sounds dependable. An
agent isn't a single call, though. It plans, calls a tool, reads the
result, calls another tool, and so on, and the task only succeeds if every
one of those steps goes right. If each step succeeds independently with
probability *p*, a task of *n* steps succeeds with probability *p*ⁿ:

```python
for per_step in (0.99, 0.95, 0.90):
    row = "  ".join(f"{steps:>2} steps: {per_step ** steps:4.0%}" for steps in (1, 5, 10, 20, 50))
    print(f"{per_step:.0%} per step -> {row}")
```
```
99% per step ->  1 steps:  99%   5 steps:  95%  10 steps:  90%  20 steps:  82%  50 steps:  61%
95% per step ->  1 steps:  95%   5 steps:  77%  10 steps:  60%  20 steps:  36%  50 steps:   8%
90% per step ->  1 steps:  90%   5 steps:  59%  10 steps:  35%  20 steps:  12%  50 steps:   1%
```
*(runs live, shows output — read-only demo snippet, not graded)*

At 95% per step, a 20-step task succeeds about a third of the time. At
50 steps it almost never does. Agents run for 20 or 50 steps routinely:
every tool call, every reading of a result and every decision about what
to do next is a step.

You've seen this arithmetic before, from the other side.
[Module 3's attacker calculation](→ Module 3, the tool threat model lesson, why the model can't be the security boundary concept, the "mitigations help, but aren't boundaries" subsection)
showed that a filter blocking 95% of injection attempts lets at least one
through 64% of the time after 20 tries. That's 1 − 0.95²⁰: the defender has
to win every attempt, so the attacker only needs one. Here the agent has to
get every step right, so a single wrong step is enough to sink the task.
It's the same curve.

---

## How good each step has to be

Turn the question around. To finish a task 90% of the time, how reliable
does each step need to be?

```python
target = 0.90
for steps in (5, 20, 50, 100):
    needed = target ** (1 / steps)
    print(f"to finish {steps:>3} steps {target:.0%} of the time, each step must succeed {needed:.2%} of the time")
```
```
to finish   5 steps 90% of the time, each step must succeed 97.91% of the time
to finish  20 steps 90% of the time, each step must succeed 99.47% of the time
to finish  50 steps 90% of the time, each step must succeed 99.79% of the time
to finish 100 steps 90% of the time, each step must succeed 99.89% of the time
```
*(runs live, shows output — read-only demo snippet, not graded)*

A 20-step task that should work nine times in ten needs each step right
more than 99.4% of the time. A 100-step task needs 99.9%. This is why an
agent that looks fine in a demo, where you try a short task once, can fail
most of the time on real, longer work. Nothing about any single step got
worse. There were just more of them.

---

## Is it true? Roughly, on one well-studied benchmark

The *p*ⁿ formula is a model: it assumes every step fails independently and
that any failure is fatal. Real agents are messier, so it's fair to ask
whether it describes them at all.

The best evidence comes from METR's
[time-horizon study](https://arxiv.org/abs/2503.14499) (Kwa et al., 2025).
METR gave AI agents software and research tasks whose lengths were measured
by how long skilled people took to do them, from seconds to hours, and
found that success falls steadily as tasks get longer. Toby Ord
[reanalysed their results](https://arxiv.org/abs/2505.05115) and found
they fit a very simple model: a constant chance of failing for each minute
of work a person would need. That is *p*ⁿ again, counted in minutes of work
rather than tool calls.

The model makes a testable prediction. If an agent succeeds half the time
on tasks of a certain length, then to succeed 80% of the time the task has
to be about a third as long, because 0.8³ ≈ 0.5. METR measured both for its
best model at the time: a 50% success rate on tasks up to 59 minutes long,
and an 80% success rate only on tasks up to 15 minutes. That's a quarter,
close to the predicted third, and within the measurement's noise.

Two caveats, both from Ord himself:

- **It's one task suite.** Whether the same pattern holds for other kinds
  of work is an open question.
- **An average over many tasks can hide the shape of each one.** If some
  tasks are much harder than others, the average curve looks different
  from any single task's curve. The next section shows why.

---

## Where the model breaks

Two assumptions sit inside *p*ⁿ, and real agents violate both.

**Not every mistake is fatal.** An agent that gets an error back from a
tool can read it and try again, which is exactly why
[tool errors come back as observations](→ Module 2, termination, failure and control lesson, tool errors as observations concept)
rather than crashing the loop. A wrong step that gets caught and fixed
doesn't sink the task. METR's authors found that improvements in longer
tasks came largely from models getting more reliable and from getting
better at adapting to mistakes.

**Steps don't fail independently.** A task that's hard for the model at
step 3 is usually hard at step 7 too: the same confusing document, the same
ambiguous request, the same gap in what the model knows. Some tasks fail
almost every time, and others almost never.

A small simulation shows both effects on a 20-step task. The first line is
the pure model. The second catches 60% of mistakes before they do damage.
The last three split the tasks into two kinds, easy and hard, whose
per-step success rates average 95%:

```python
import random


def run_task(rng: random.Random, step_success: float, steps: int, catch_rate: float = 0.0) -> bool:
    """One run of a task: every step must go right. A step that goes wrong is caught and fixed
    with probability catch_rate; otherwise it sinks the run."""
    for _ in range(steps):
        if rng.random() >= step_success and rng.random() >= catch_rate:
            return False
    return True


def success_rate(step_success: float, catch_rate: float = 0.0, runs: int = 20_000, steps: int = 20) -> float:
    rng = random.Random(0)
    return sum(run_task(rng, step_success, steps, catch_rate) for _ in range(runs)) / runs


print(f"independent, 95% per step:        {success_rate(0.95):.1%}   (0.95 ** 20 = {0.95 ** 20:.1%})")
print(f"same, 60% of mistakes caught:     {success_rate(0.95, catch_rate=0.6):.1%}   (0.98 ** 20 = {0.98 ** 20:.1%})")

easy, hard = success_rate(0.99), success_rate(0.91)
print(f"half easy tasks (99% per step):   {easy:.1%}")
print(f"half hard tasks (91% per step):   {hard:.1%}")
print(f"all tasks together (95% average): {(easy + hard) / 2:.1%}")
```
```
independent, 95% per step:        35.9%   (0.95 ** 20 = 35.8%)
same, 60% of mistakes caught:     66.6%   (0.98 ** 20 = 66.8%)
half easy tasks (99% per step):   81.8%
half hard tasks (91% per step):   14.6%
all tasks together (95% average): 48.2%
```
*(runs live, shows output — read-only demo snippet, not graded. The step
success rates are made up to show the shape of each effect; they aren't
measured from a model.)*

Catching 60% of mistakes turns a 5% chance of a fatal step into a 2%
chance (5% × 40% uncaught), and the task succeeds about twice as often.
Recovery is one of the strongest levers there is, and several lessons in
this module are about building it: checks that catch a bad step before it
does damage, and escalation when the agent can't tell.

The easy/hard split shows something subtler. The overall success rate,
48%, is *higher* than the 36% that 0.95²⁰ predicts. But no task actually
succeeds 48% of the time. Easy tasks succeed about four times in five, and
hard ones about once in seven. An average over all tasks describes none of
them.

---

## What to take from it

The *p*ⁿ model is worth keeping as a way of thinking, not as a formula to
predict with:

- **Length is a risk in itself.** Every extra step is another chance to
  fail, so shorter paths to the goal are more reliable paths.
- **"Right 95% of the time" isn't good enough for a step.** Agents need
  far higher per-step reliability than a single answer does, or recovery
  that makes up the difference.
- **Averages hide the tasks that fail.** Because difficulty clusters, the
  question to ask isn't only "how often does the agent succeed?" but "on
  which tasks, and how consistently?" The rest of this lesson measures
  exactly that, on a real model.

---

## Quiz cards

> **Q1.** An agent's task takes 25 steps, and each step independently
> succeeds 97% of the time. Roughly how often does the whole task succeed?
> - A) About 97%, since each step is that reliable
> - B) About 75%, since three failures in a hundred add up to 25 × 3%
> - C) About 47%, since 0.97²⁵ ≈ 0.47 ✅
> - D) About 3%, since only one step in 25 can fail
>
> *Explanation: every step has to succeed, so the probabilities multiply:
> 0.97²⁵ is about 0.47. Adding the failure rates (25 × 3% = 75% failure) is
> a tempting shortcut, and it only works when the rates are tiny; here it
> overstates the damage and would give nonsense (over 100%) for longer
> tasks.*

> **Q2.** Module 3 showed that a filter blocking 95% of injection attempts
> lets one through 64% of the time over 20 attempts. How does that relate
> to an agent succeeding 36% of the time on 20 steps at 95% each?
> - A) They're unrelated: one is about security and the other about accuracy
> - B) It's the same calculation, 0.95²⁰ ≈ 0.36, seen from opposite sides: the defender must win every attempt, and the agent must get every step right ✅
> - C) The security figure is higher because attackers learn from each attempt, which agents don't
> - D) The agent figure is lower because agent steps are harder than blocking an attack
>
> *Explanation: 0.95²⁰ ≈ 0.36 is the chance that all 20 attempts are
> blocked, so one gets through 64% of the time; for the agent, 0.36 is the
> chance all 20 steps succeed. The same independence assumption sits under
> both, which Module 3 also flagged as a simplification.*

> **Q3.** In the simulation, catching 60% of mistakes nearly doubled the
> success rate of a 20-step task. Why does recovery help so much?
> - A) It makes each step more likely to go right the first time
> - B) It shortens the task, so there are fewer steps to fail
> - C) It turns some fatal mistakes into harmless ones, cutting the chance that a step sinks the task from 5% to 2%, and that saving compounds over all 20 steps ✅
> - D) It only helps on the last step, which is the one that matters most
>
> *Explanation: the per-step chance of going right the first time is still
> 95%, but only uncaught mistakes are fatal: 5% × 40% = 2%. Because the
> per-step survival rate is raised to the 20th power, a small change per
> step becomes a large change per task (0.98²⁰ ≈ 67% against 0.95²⁰ ≈ 36%).*

> **Q4.** Half an agent's tasks are easy (99% per step) and half are hard
> (91% per step), 20 steps each. Overall, 48% of runs succeed. What does
> that 48% tell you about a typical task?
> - A) A typical task succeeds about half the time
> - B) Very little: easy tasks succeed about 80% of the time and hard ones about 15%, so no task behaves like the average ✅
> - C) That per-step reliability is really 95% for every task
> - D) That the p-to-the-n model is wrong, since it predicted 36%
>
> *Explanation: when difficulty clusters, the overall rate mixes very
> different tasks. It's higher than 0.95²⁰ predicts, but that doesn't make
> the model useless: it still describes each kind of task on its own. The
> practical lesson is to measure per task, which the rest of this lesson
> does.*

> **Q5.** On METR's tasks, an agent that succeeds half the time on tasks up
> to one hour long would, under a constant chance of failing per minute of
> work, succeed 80% of the time on tasks up to about how long?
> - A) About 20 minutes, since 0.8³ ≈ 0.5 means an 80%-reliable task is about a third as long ✅
> - B) About 48 minutes, since 80% of an hour is 48 minutes
> - C) About 2 hours, since higher reliability comes with longer tasks
> - D) There's no way to tell without running the agent again
>
> *Explanation: with a constant failure rate, success falls exponentially
> with length. Surviving three 20-minute stretches at 80% each gives about
> 0.8³ ≈ 51%, so the 80% horizon is about a third of the 50% one. METR's
> measurement for its best model at the time (59 minutes against 15) came
> out at about a quarter, close to that prediction. Scaling the time
> linearly with the percentage is the tempting mistake.*

---

*(End of this concept. The next concept runs real questions through a real
model many times and looks at which ones it gets right consistently.)*
