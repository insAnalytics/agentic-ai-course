# Module 7, Lesson 1 — Concept 5: The loop: record, read, name the failures, write evals, change, rerun

> **Note for the site build:**
> - New script `scripts/eval/pilot_grades.py`, in `m7-l1-c5-site-build.zip` with the `grades.json` it wrote here: rerun it, check its output is identical to the one in the zip, and commit both (`public/data/eval/pilot/grades.json`). It holds each pilot trial's provisional code grade and its grade after reading. The 19 changes by reading are written in the script, and each was confirmed by Simar reading the trial.
> - The demo on this page reads only `grades.json` (13 KB).

---

## Where evaluation starts

It's tempting to begin evaluating an agent by writing graders: decide what good looks like, encode it, run it, and read off a number. The people who do this work for a living recommend the opposite order.

- **Hamel Husain and Shreya Shankar**, whose evals course has been taught to over 2,000 engineers and product managers, organise the work as an **Analyze, Measure, Improve** cycle. Their FAQ calls error analysis "the most important activity in evals", because it's how you decide which evals to write in the first place. Their advice is to start with error analysis, not infrastructure.
- **OpenAI's agent evaluation guide** says to start with traces while you're still debugging behaviour, and to move to datasets and repeatable eval runs once you know what "good" looks like.
- **Anthropic's guide** recommends a first suite of 20 to 50 tasks drawn from real failures, and says its teams don't take an eval score at face value until someone has read some of the transcripts behind it.

All three say the same thing: look at what the agent actually does before deciding how to measure it, and keep looking afterwards.

---

## The loop

Put together, the work is a loop:

1. **Record.** Run the agent and keep everything: every request, reply, tool call and result, with the versions that produced them.
2. **Read.** Look at runs one at a time, passes as well as failures.
3. **Name the failures.** Note what went wrong in each run, group the notes into categories, and count them, so you know which failures are common and which are rare.
4. **Write evals** for the failures that matter: tasks that provoke them, and graders that catch them.
5. **Change** the agent: a prompt, a tool, a model, a check.
6. **Rerun** the suite, and compare with the last run you trusted.

Then the loop goes round again, because a change makes new runs to read. Once an agent is in use, step 1 also happens in production, and the failures found there feed step 4.

---

## The pilot went round once

The pilot was step 1. Each run was graded by a quick code check written before any run happened. Then every run of the four tasks whose grades needed a closer look was read, along with a random sample of runs that had passed. The demo puts the code's grades next to the grades after reading:

```python
from collections import Counter

grades = json.loads((PILOT / "grades.json").read_text(encoding="utf-8"))
trials = grades["trials"]

for setup in ("4b-think", "4b-nothink", "9b-think"):
    mine = {trial_id: g for trial_id, g in trials.items() if trial_id.startswith(f"{setup}/")}
    code = sum(g["code"] for g in mine.values())
    final = sum(g["final"] for g in mine.values())
    print(f"{setup}: code grade {code}/{len(mine)}, after reading {final}/{len(mine)}")

changes = Counter((g["changed_by_reading"], g["code"]) for g in trials.values() if g["changed_by_reading"])
print(f"\n{sum(changes.values())} grades changed by reading:")
for (reason, code_said), count in changes.most_common():
    print(f"  {count:>2} the code said {'pass' if code_said else 'fail'}: {grades['why'][reason]}")
```
```
4b-think: code grade 25/30, after reading 24/30
4b-nothink: code grade 21/30, after reading 21/30
9b-think: code grade 24/30, after reading 26/30

19 grades changed by reading:
   9 the code said pass: fail: read back the unchanged record and told the user the change was queued for the next session
   7 the code said fail: pass: refused correctly and said why; the check also wanted the priority tier named, which the request never asked for
   3 the code said fail: pass: a correct decline, in wording the check's phrase list didn't include
```
*(runs live, shows output — read-only demo snippet, not graded; each change by reading was confirmed by a person reading the run)*

Reading changed 19 of the 90 grades, and each change is a different lesson about graders:

- **9 false passes: p08's explained-away writes.** The check looked for words like "still" in the reply, and every reply had them, in an explanation of why the change was "queued". This is the reply-versus-outcome problem from earlier in this lesson, caught only by reading. These runs were found because passing runs were sampled for reading too, not just the failures.
- **7 false failures: p07's correct refusals.** The check wanted the reply to name the priority tier, but the request was just "Move research_agent to claude-opus". Every one of these runs refused and said why. The check encoded an expectation the task never stated, which Anthropic's guide warns against: everything a grader checks should be clear from the task.
- **3 false failures: p02's correct declines.** The check looked for phrases like "doesn't say". These runs wrote "is not documented" or "cannot identify" instead. As [Module 6 found with its false-premise questions](→ Module 6, the verifying an answer against its sources lesson, the questions built on a false premise concept), a check built on wording measures the wording.

Look at the second line of the output. The 4B with thinking off scores 21 out of 30 either way, yet 6 of its 30 grades were wrong: three false passes and three false failures that happen to cancel out. A total can look right while the grades under it aren't, which is why the number alone isn't enough.

None of this means the code check was badly made by the standards of a first attempt. It was written before any run existed, and each of its mistakes is the kind that only shows up once real output arrives. That's the case for reading first: the graders worth building come out of what the runs actually do.

---

## How this module follows the loop

Each lesson after this one takes a step of the loop, using the registry agent:

- **Record:** Lesson 2, tracing. A trace records a run as a tree of steps, with what went in and out of each, in a format that observability tools share.
- **Read and name the failures:** Lesson 3, error analysis on the registry agent's runs.
- **Write evals:** Lesson 4 builds the task suites. Lessons 5 and 6 write graders in code and with a model. Lessons 7 and 8 check those graders against people's labels and test whether their confidence means anything.
- **Change and rerun:** Lesson 9 switches pieces of the agent on and off to see what each one earns. Lesson 10 reruns the suites after a change and separates real regressions from run-to-run noise.
- **In use:** Lesson 11, monitoring and learning from use.
- **All of it together:** Lesson 12, the registry agent's evaluation report.

---

## Quiz cards

> **Q1.** A team wants to start evaluating its new agent. Following the practice in this concept, what should it do first?
> - Run the agent on real tasks and read what it does ✅
> - Write a grader for each quality the agent should have
> - Pick a public benchmark and measure the agent on it
> - Build a dashboard to track the agent's pass rate
>
> *Explanation: Husain and Shankar, OpenAI and Anthropic all put looking at real runs before writing graders, because the runs show which failures actually happen. Graders written first measure what you expected to go wrong, as the pilot's code check did.*

> **Q2.** The pilot's code check passed all nine p08 runs. How were these false passes found?
> - Passing runs were read too, not only the failures ✅
> - The total pass rate was lower than anyone had expected
> - A second code check disagreed with the first one on p08
> - The agent reported an error that someone looked into
>
> *Explanation: Nothing in the numbers pointed at p08: the runs passed, and the replies sounded like successes. Reading a sample of passes turned up the first two, and then every p08 run was read. Reading only failures would never have found them.*

> **Q3.** The 4B with thinking off scored 21 out of 30 under the code check and 21 out of 30 after reading. What does that show?
> - A right total can hide wrong grades that cancel out ✅
> - Reading made no difference for this version of the agent
> - The code check was accurate for this version of the agent
> - Thinking off makes the agent easier to grade correctly
>
> *Explanation: Six of its 30 grades changed: three false passes on p08 and three false failures on p07. They cancel in the total, so the total looks confirmed, but the code check got a fifth of the individual verdicts wrong. A total checked against nothing but itself can't show that.*

> **Q4.** The p07 check failed correct refusals because they didn't name the priority tier. What principle did it break?
> - What a grader checks should be clear from the task ✅
> - A grader should check the end state, never the reply
> - A grader should accept any reply that contains no error
> - A grader should be written only after reading many runs
>
> *Explanation: The request was just "Move research_agent to claude-opus". Wanting the reply to name the way forward may be a fair quality preference, but it wasn't part of the task, so failing the run on it measures an unstated expectation. Anthropic's guide states the principle directly: agents shouldn't fail because of what the task didn't say.*

> **Q5.** In the loop, what does the "rerun" step compare against?
> - The last run of the suite that was trusted ✅
> - The pass rate the team set as its target
> - The scores of the same model on public benchmarks
> - The first run of the suite, from when it was built
>
> *Explanation: A rerun answers "did this change make things better or worse?", so it's compared with the most recent run known to be good, not with a goal or someone else's scores. Lesson 10 shows how to tell a real difference from run-to-run noise when making that comparison.*
