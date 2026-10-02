# Module 7, Lesson 11 — Concept 5: Learning from use

> **Note for the site build:** no new data or shared code. The demo's setup is `LOAD_TRAFFIC` + `QUESTION_MIX` (for each task's kind), with `trafficData("baseline-a", "baseline-b")` and `question-mix.json` mounted.

---

## What users tell you, and what they don't

Monitoring watches every run. People using the agent watch the runs that affect them, and they send signals of their own. [Anthropic's guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) lists user feedback as one of its six ways of understanding an agent, and is blunt about both sides:

- **What it's good for:** it surfaces problems nobody anticipated, it comes with real examples from real use, and it tends to track what the product is for.
- **What it isn't:** it's sparse and self-selected, it skews towards severe problems, and users rarely say why something failed. Relying on users to find problems also means users met them first.

The guide's advice is to triage feedback constantly. Feedback comes in three forms, and each needs reading differently:

- **Explicit feedback:** a thumbs-down, a bug report, a support ticket. Clear when it arrives, but it only arrives from the people who bothered. A 2% thumbs-down rate doesn't mean 2% of answers were bad; it means some unknown share of the bad answers' recipients said so.
- **Implicit feedback:** what users do next. Asking the same thing again in different words, retrying, abandoning the conversation, undoing a change the agent made. Every user produces it, and it doesn't depend on anyone choosing to complain. How well such a signal tracks real value is an empirical question: GitHub's study of its own Copilot ([Ziegler et al., 2022](https://arxiv.org/abs/2205.06537)) found that the share of suggestions developers accepted predicted how productive they felt better than more specific measures, such as how long the accepted code survived.
- **Escalations:** cases the agent handed to a person, [as Module 6 built](→ Module 6, the stop, ask, or escalate lesson, the escalating to a stronger model, or to a person concept, escalating to a person). Each one is a case the agent found hard, and the person's decision is a label for it, made by someone with the context to judge.

None of these is a quality rate. Each is a lead: it points at runs worth reading. Their rates also move with the traffic, as [the previous concept](→ this lesson, the when what people ask changes concept) showed for every other number.

---

## From a report to a task

A failure found in use is worth most once it's a task, because a task keeps it fixed: [Lesson 4](→ Module 7, the building a task suite lesson, the where tasks come from concept, three sources) named real failures as the third source of a suite, and Anthropic's guide recommends building from the bug tracker and the support queue so that the suite reflects how the agent is really used. The path from a report to a task reuses most of this module:

1. **Find and read the run.** The report gives a conversation; the trace gives everything that happened in it. Read it the way [Lesson 3 did](→ Module 7, the error analysis lesson, the one note per trace, at the first failure concept): one note, at the first thing that went wrong.
2. **Group the duplicates.** The same failure arrives many times, in different words. Group the reports, count each group, and write one task per group, not per report.
3. **Keep the request's shape, not the person's data.** A production trace holds what a user typed, which is why [Lesson 2's conventions leave content out by default](→ Module 7, the tracing an agent run lesson, the a shared format: OpenTelemetry's conventions for AI calls concept, what the conventions leave out: content). A task needs the structure of the request, not the user's names, accounts or text, so rewrite it with placeholders before it enters the suite. Keeping and deleting user data is Module 10's subject.
4. **Write the definition of success,** as [Lesson 4 did](→ Module 7, the building a task suite lesson, the what makes a good task concept, a task is a test with a definition of success), and the check that decides it. Write the mirror case too where there is one, as [Lesson 4's twins](→ Module 7, the building a task suite lesson, the where tasks come from concept, a failure becomes tasks) did: if the agent wrongly refused, add a case where refusing is right.
5. **Choose its split by a rule set in advance.** Some new tasks should go to the held-out set, so that it keeps [looking like the traffic](→ Module 7, the building a task suite lesson, the holding tasks out, and tuning to the suite concept, a held-out set has to look like the dev set). Which ones should be decided by a fixed rule, such as a hash of the task id, not by which look interesting; choosing by hand is a quiet way of tuning to the suite.
6. **Start it as a capability task.** It fails now. Once the agent passes it reliably, it graduates to the regression suite, as [Lesson 1 described](→ Module 7, the why agents are hard to grade lesson, the offline and online concept, capability suites and regression suites).

Then the usual loop takes over: a change is tried, [measured on and off](→ Module 7, the does this piece help? ablations lesson, the one piece on and off concept), and [gated against the last known-good run](→ Module 7, the regression testing lesson, the a gate that doesn't flake concept).

---

## Group, then count

Step 2 decides where the effort goes. Here are the runs from both baseline batches that ended without an answer, grouped by request. In this simulation every run comes from a suite task, so the task id stands in for "the same request"; in production, grouping has to work from the requests themselves:

```python
failed = Counter()
for condition in ("baseline-a", "baseline-b"):
    for spans in load_traffic(condition):
        chats = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"]
        if chats[-1].attributes.get("registry_agent.tool_calls"):
            root = next(span for span in spans if span.parent_id is None)
            failed[root.attributes["registry_agent.task"]] += 1

kind_of = {run["trial_id"].split("/")[1]: run["kind"] for run in mix_runs}
print(f"{failed.total()} runs ended without an answer, from {len(failed)} different requests\n")
so_far = 0
for task, count in failed.most_common():
    so_far += count
    print(f"{task:<12} {kind_of[task]:<37} {count:>2} run{"s" if count > 1 else " "}   {so_far / failed.total():>4.0%} of the failures so far")
```
```
29 runs ended without an answer, from 8 different requests

q40-denied   docs: restricted                      10 runs    34% of the failures so far
q30          docs: relationship                     7 runs    59% of the failures so far
q33          docs: global                           4 runs    72% of the failures so far
q34          docs: global                           3 runs    83% of the failures so far
a13          action, fault: the write is lost       2 runs    90% of the failures so far
q39          docs: unanswerable                     1 run     93% of the failures so far
q37          docs: unanswerable                     1 run     97% of the failures so far
m03          conversation: a loosely named agent    1 run    100% of the failures so far
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: the baseline's development runs from both batches, treated as live traffic; the task id stands in for a group of similar requests)*

Twenty-nine failures come from eight requests, and the top two account for 59% of them. Three things follow:

- **Count groups, not reports.** Twenty-nine tasks would make one request's ten failures look like ten problems. One task per group, with the count kept beside it, says what to fix first.
- **A failure that happens every time is the cheapest to fix and the easiest to keep fixed.** q40-denied, a question whose answer is in a document this user isn't allowed to read, failed in all ten of its runs. One task captures it completely.
- **Prioritise by impact, not just frequency.** Anthropic's guide says to prioritise by user impact. The lost write behind a13 failed only twice, but a change that silently didn't happen costs more than a question left unanswered.

Real reports don't share an id. Grouping them is the problem [Module 4 met with memories](→ Module 4, the deciding what to remember lesson, the duplicates and contradictions concept): requests that mean the same thing in different words. Matching by meaning, which Module 5 added, does most of it, and the clustering behind [the previous concept's categories](→ this lesson, the when what people ask changes concept, categories first) does it at scale. Either way, a person should check a group before it becomes one task, because two similar requests can fail for different reasons.

---

## Labels from live traffic

The reading that turns failures into tasks produces something else the module needs: labels on live runs. [The sampled judge earlier in this lesson](→ this lesson, the judges on a sample concept, the judge's own errors) could only be corrected with error rates measured on enough labelled runs, and the five it had came from the suite, not from traffic. Labelling a sample of the runs the judge saw, passes and failures both, gives the error rates [Lesson 7's correction](→ Module 7, the checking the graders lesson, the correcting a pass rate for the judge's errors concept) needs, measured on the traffic the judge actually grades.

It doesn't need a separate effort. Anthropic's guide recommends reading a sample of transcripts every week. If that sample is drawn from the judge's verdicts, with a share of its passes and a share of its failures, the same reading serves three purposes:

- it finds new failures to turn into tasks
- it labels the judge's verdicts, so its error rates stay measured as the traffic changes
- it keeps someone looking at what the agent actually does, which no dashboard replaces

---

## The loop, closed

[Lesson 1's loop](→ Module 7, the why agents are hard to grade lesson, the loop: record, read, name the failures, write evals, change, rerun concept, the loop) said that once an agent is in use, step 1 happens in production too, and the failures found there feed step 4. This lesson has built each part of that:

- **Record and watch:** the dashboard and its alerts, on every run.
- **Grade what code can't:** judges on a sample, with live labels to keep them honest.
- **Notice the traffic changing:** the mix of requests, and what it does to every other number.
- **Read and write tasks:** reports, escalations and sampled runs, grouped and turned into suite tasks.

What's left is the last step in the other direction: putting a change in front of real users without betting everything on it. That's the subject of the rest of this lesson.

---

## Quiz cards

> **Q1.** Users give a thumbs-down to 2% of the agent's answers. What does that tell you?
> - Where to start reading, not how often answers are bad ✅
> - That about 2% of the agent's answers are wrong or unhelpful
> - That 98% of answers satisfied the users who received them
> - Nothing useful, since feedback is too sparse to act on at all
>
> *Explanation: Explicit feedback is self-selected: only some users who get a bad answer say so, and the share who do is unknown. So the rate isn't a quality rate, and silence isn't satisfaction. The reports are still valuable, as leads to runs worth reading.*

> **Q2.** Which of these is an implicit signal that an answer didn't help?
> - The user asks the same thing again in different words ✅
> - The user clicks thumbs-down under the agent's answer
> - The run ends with a tool error recorded in its trace
> - A judge on a sample fails the answer for its relevance
>
> *Explanation: Implicit feedback is what users do next, without being asked. A thumbs-down is explicit feedback, a tool error is a monitoring signal from the trace, and a judge's verdict is a grader's. Only the rephrased question comes from the user's behaviour.*

> **Q3.** Twenty-nine failed runs come from eight distinct requests. How many tasks should the suite gain?
> - About one per group, worked through in order of impact ✅
> - Twenty-nine, so that every failed run is represented once
> - One, for the most common failure, since it's most of them
> - None, until each failure has been seen at least ten times
>
> *Explanation: A task per report would make one request's ten failures look like ten problems. A task per group, with its count, says what matters most. Fixing only the top group ignores a lost write that failed twice but costs more each time, and waiting for repeats lets known failures pile up.*

> **Q4.** Before a failure from production becomes a suite task, what should change?
> - The user's own details are removed, keeping the request's shape ✅
> - The agent's answer is replaced with the answer it should have given
> - The request is reworded so the agent can't recognise it later on
> - The trace is cut down to just the final model call and its reply
>
> *Explanation: A task needs the structure of the request, not the user's names, accounts or words, so they're replaced with placeholders. A task isn't a recorded answer to fix: it's a request with a definition of success, run fresh. Rewording to fool the agent and trimming the trace both throw away what made the failure happen.*

> **Q5.** New tasks from production are being added. Which should go to the held-out set?
> - A fixed share, picked by a rule decided in advance ✅
> - The hardest ones, so that the held-out set stays challenging
> - The ones the latest fix already passes, to confirm the fix
> - None of them, since the held-out set should never change
>
> *Explanation: The held-out set should keep looking like current traffic, so it needs new tasks too. Choosing them by a rule decided in advance keeps anyone's judgement about which tasks are interesting, or which the fix handles, out of it. Picking by hand is a quiet way of tuning to the suite.*

> **Q6.** Why are escalations to a person useful for evaluation, beyond helping the user?
> - The person's decision labels a case the agent found hard ✅
> - They remove the hard cases, so the agent's pass rate rises
> - They prove that the agent's sense of uncertainty is calibrated
> - They give the user an answer sooner than the agent would have
>
> *Explanation: An escalation is a hard case with a decision attached, made by someone with the context to judge, which is exactly what a task or a judge's label needs. Escalating doesn't show the uncertainty signal is calibrated; that needs the outcomes measured. And hiding hard cases from the pass rate is a reason for caution, not a benefit.*
