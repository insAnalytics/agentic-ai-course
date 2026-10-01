# Module 7, Lesson 4 — Concept 5: Holding tasks out, and tuning to the suite

> **Note for the site build:** new script `scripts/eval/baseline_grades.py` (in the zip with this file) writes `public/data/eval/suite/baseline-grades.json`: every registry task and conversation in the main pool, with its split and its current checks' result on every trial of both baseline batches. Run it, check the output matches the copy in the zip, and commit both. The demo reads that file.

---

## Two kinds of task in one suite

Every task in this module's pool is marked as one of two kinds:

- **Dev tasks** are the ones the module works on. Their runs are read, their failures named, their checks fixed, and any change to the agent will be judged on them first.
- **Held-out tasks** are kept back. Nobody reads their runs or tunes anything against them, so that at the end of the module there's a set of tasks no decision was made on. The registry agent's final report, in Lesson 12, measures on them.

The reason is an old one in machine learning, and it applies to agents for the same reason. Every decision made by looking at a set of examples fits that set a little better: a prompt reworded after reading dev runs, a check corrected after reading dev failures, a category named from dev traces. Each is legitimate. But after enough of them, a score on those same tasks measures how well the decisions fit the tasks, as well as how good the agent is. A score on tasks nobody looked at doesn't have that problem.

So far, everything this module has decided was decided on dev tasks:

- the reading sample in Lesson 3 was drawn from dev tasks only
- the reading standard came from disagreements on dev traces
- the checks fixed after reading (m02's email, s29's date) are dev tasks
- the simulator audit left out the two held-out conversations

---

## A held-out set has to look like the dev set

Holding tasks back only helps if they're the same kind of tasks. The demo compares the two halves of the registry tasks and conversations on the baseline, with an interval from resampling whole tasks, as in [Lesson 3's counting](→ Module 7, the error analysis lesson, the grouping and counting concept, how sure can we be?):

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of this lesson and already loaded)*

```python
import random

baseline = load_suite("baseline-grades")
split_of = {t["id"]: t["split"] for t in baseline["tasks"]}


def task_interval(task_ids: list[str], repeats: int = 2000, seed: int = 0) -> tuple[float, float, float]:
    """The pass rate over these tasks' trials, and a 95% interval from resampling whole tasks."""
    groups = [baseline["trials"][t] for t in task_ids]
    rate = sum(map(sum, groups)) / sum(map(len, groups))
    rng = random.Random(seed)
    shares = sorted(sum(map(sum, picked)) / sum(map(len, picked))
                    for picked in (rng.choices(groups, k=len(groups)) for _ in range(repeats)))
    return rate, shares[int(0.025 * repeats)], shares[int(0.975 * repeats) - 1]


for split in ("dev", "held_out"):
    ids = [t for t, s in split_of.items() if s == split]
    rate, low, high = task_interval(ids)
    trials = sum(len(baseline["trials"][t]) for t in ids)
    print(f"{split:<9} {len(ids):>2} tasks, {trials} trials: {rate:.0%} pass (95% interval {low:.0%} to {high:.0%})")

print("\nheld-out tasks:")
for task in baseline["tasks"]:
    if task["split"] == "held_out":
        print(f"  {task['id']}  {task['kind']}")
```
```
dev       29 tasks, 290 trials: 89% pass (95% interval 77% to 98%)
held_out   8 tasks, 80 trials: 100% pass (95% interval 100% to 100%)

held-out tasks:
  a24  action
  a25  lookup and rule
  a26  action, fault: the write is lost
  a27  email after checking
  a28  action and email
  a29  action with an unknown model
  m07  conversation: the user pushes for a forbidden change
  m08  conversation: a mistyped agent name
```
*(runs live, shows output — read-only demo snippet, not graded; pass rates are the current code checks')*

At first sight the held-out tasks look better than the dev tasks, and with no uncertainty at all. Neither is true:

- **The interval is empty because nothing failed.** Resampling tasks that all passed can only ever give 100%. That doesn't mean the failure rate is zero. [Module 6's rule of three](→ Module 6, the verifying an answer against its sources lesson, the checking the checker concept, zero errors isn't a zero error rate) says that with zero failures in n independent tries, the true rate could still be as high as about 3 in n, and the independent unit here is the task: with 8 tasks, up to about 3 in 8 could fail.
- **The held-out tasks are easier.** These eight were picked by hand when the tasks were written, and they lean towards things the agent does well: plain moves, a lookup, a rule it can quote. They include only one of the kinds of request the agent struggles with most, and none that asks it to choose between several agents.
- **One of the passes is probably not a pass.** a26 is a lost write, whose check, like s01 to s05's, can't see what the user was told. Its runs haven't been read, by design, so its 100% is unknown, not good.

The fix is how held-out tasks are chosen. The newer suite tasks were held out a third at a time within each failure category, so the held-out set covers every category. The registry tasks' held-out set wasn't, and the honest thing is to say so: its score will be reported in Lesson 12 alongside how it was chosen, and judged with graders that can see the reply.

---

## Tuning to the suite

Fixing things after reading dev runs is the point of the dev tasks. The question is what kind of fix it is. Two kinds look alike and aren't:

- **Fixing a task that fails good behaviour.** m02's check failed an email the user had agreed to; the matcher failed "840ms" for "840". By the written standard, those runs were right, and the checks were wrong. A fix like this corrects the measurement, and it applies everywhere: the corrected matcher grades held-out tasks too, without anyone reading their runs.
- **Changing things until the dev score goes up.** Rewording the prompt, the tools or the checks while watching the dev pass rate, and keeping whatever raised it. Some of those changes help the agent; some only fit the agent's habits on these particular tasks. Watching dev alone can't tell which.

The held-out set is what tells them apart. A change that helps the agent raises the held-out score too, run on tasks it was never tuned on. A change that only fits the dev tasks raises dev and leaves held-out where it was. That comparison, and how to tell a real difference from run-to-run noise, is Lesson 10.

One more sign of a suite that's been tuned to: it stops failing. A dev task the agent passes every time tells you nothing new about what to fix, which is why a capability suite should start with a low pass rate, and why tasks that saturate are moved to the regression suite and replaced with harder ones.

---

## Quiz cards

> **Q1.** Why keep some tasks back that nobody reads or tunes against?
> - Each decision made on dev tasks fits them ✅
> - Held-out tasks run faster because they're never read
> - Reading every task would cost too much GPU time
> - The agent would learn the held-out tasks if it saw them
>
> *Explanation: Reading dev runs and fixing what they show is right, but each decision fits those tasks a bit better, so their score drifts towards measuring the decisions. Tasks no decision was made on give a score without that drift.*

> **Q2.** All 8 held-out tasks passed every trial, and the resampled interval is 100% to 100%. What can you conclude about the failure rate?
> - With 8 tasks, it could still be up to about 3 in 8 ✅
> - It's zero, because nothing failed in 80 trials
> - It's lower than the dev tasks' rate, with certainty
> - Nothing, because the interval is meaningless here
>
> *Explanation: Resampling tasks that all passed can only give 100%, so the interval hides the uncertainty rather than measuring it. The rule of three gives the honest bound: with no failures in n independent tasks, the true rate could be as high as about 3 in n.*

> **Q3.** The held-out registry tasks pass at 100% against the dev tasks' 89%. What's the main reason?
> - They were hand-picked and lean easier ✅
> - The agent improved between the dev and held-out runs
> - Held-out tasks are graded with a more lenient matcher
> - Tasks nobody reads are always easier for the agent
>
> *Explanation: Both halves came from the same runs and checks. These eight held-out tasks were chosen when written and include few of the kinds the agent struggles with. A held-out set drawn at random within each category, as the suite's was, looks like the dev set.*

> **Q4.** Which of these is fixing the measurement rather than tuning to the suite?
> - Fixing a check that fails a correct run ✅
> - Rewording the prompt until the dev pass rate goes up
> - Dropping the dev tasks the agent keeps failing
> - Loosening a check because its task is hard to pass
>
> *Explanation: A check that fails good behaviour, by the written standard, is a broken measurement, and fixing it applies everywhere. The other three change what's measured to raise the score, which a held-out set would expose.*

> **Q5.** A prompt change raises the dev pass rate but not the held-out pass rate. What's the likeliest explanation?
> - It fits the dev tasks without making the agent better ✅
> - The held-out tasks are broken and need their checks fixed
> - The dev tasks are too easy and should be replaced
> - The held-out set is too large to show the improvement
>
> *Explanation: A change that helps the agent should help on tasks it was never tuned on. One that lifts only the dev score fits those tasks' quirks. Lesson 10 shows how to check the gap is bigger than run-to-run noise before concluding either way.*
