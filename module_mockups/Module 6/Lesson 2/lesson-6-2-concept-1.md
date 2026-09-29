# Module 6, Lesson 2 — Concept 1: Four things every technique trades

---

## Nothing in this module is free

Every technique in this module makes an agent more dependable by spending
something. Checking a tool result costs a step. Sampling five answers and
voting costs five calls. Asking a person costs their time and the user's
wait. Before any of the techniques, it helps to name what they spend, so
each one can be judged on all of it.

Four quantities cover it:

- **Accuracy:** how often the agent gets the task right. For reliability,
  measured as pass^k, as in [the previous lesson](→ Module 6, why agents fail lesson, reliability as pass^k concept).
- **Latency:** how long the user waits for the result.
- **Cost:** what the run consumes: model calls, tokens, GPU time, money.
- **False refusals:** how often the agent declines, blocks or escalates
  something it should have simply done: a correct answer withheld, a
  legitimate action stopped, a person paged for nothing.

The fourth is the one that's easiest to forget, and the next section is
about why it belongs on the list.

---

## Accuracy alone misleads

Kapoor et al.,
[*AI Agents That Matter*](https://arxiv.org/abs/2407.01502) (2024), looked
at how agents were being evaluated and found the field reporting accuracy
without cost. The result, in their words, was that state-of-the-art agents
had become needlessly complex and costly, and the community had reached
mistaken conclusions about where accuracy gains came from. When they plotted
accuracy against cost on HumanEval, a coding benchmark, simple baselines,
such as retrying a model a few times, matched or beat elaborate agent
designs at a fraction of the cost. Their
recommendation is the one this lesson follows: report cost alongside
accuracy, and compare options on both.

That's the argument for latency and cost. False refusals need their own.

---

## A refusal can be a reliability failure

A check that blocks a bad action is doing its job. The same check blocking
a good action is a failure, just a quieter one: nothing breaks, the task
simply doesn't get done. An agent that refuses too readily is unreliable in
exactly the sense of the previous lesson, since users can't count on it.

Two lines of research measure this:

- **Across models, safety and over-refusal rise together.** OR-Bench (Cui
  et al., 2024) tested models on thousands of prompts that look harmful but
  aren't, and on prompts that really are harmful. The models that refused
  the harmful prompts most reliably also refused the most harmless ones: the
  Spearman rank correlation between the two was 0.878. In most models,
  refusing more of the right things came with refusing more of the wrong
  ones. XSTest (Röttger et al., 2024) showed the same kind of failure on a
  small hand-written set of safe prompts that only look unsafe, such as
  questions using a word like "kill" in a harmless sense.
- **A defence can buy security with usefulness.**
  [AgentDojo](https://arxiv.org/abs/2406.13352) (Debenedetti et al., 2024)
  measured a GPT-4o agent on 97 tasks such as managing email and making
  bookings, with and without prompt-injection defences. With no defence,
  the agent completed 69.0% of tasks and attacks succeeded 57.7% of the
  time. Two defences cut attacks to a similar level with very different
  costs:

| Defence | Attacks that succeeded | Tasks completed with no attack |
|---|---|---|
| None | 57.7% | 69.0% |
| A classifier that scans each tool result for injected instructions | 8.0% | 41.5% |
| Letting the agent pick its tools before it reads any untrusted data | 6.8% | 73.1% |

The classifier stopped attacks, but it aborted the run whenever it flagged
anything, and the authors found it had too many false positives: task
completion without any attack fell from 69.0% to 41.5%. The tool filter stopped attacks
about as well without that cost, though the authors note it fails when an
agent can't choose its tools in advance. The point for this module isn't
which defence to use; Module 3 and Lesson 9 cover those. It's that judged
on attack success alone, the two look alike, and on both columns they
don't.

You met this trade on a small scale in
[Module 5's threshold for abstaining](→ Module 5, answering from retrieved context lesson, abstaining when retrieval is weak concept, the "choosing a threshold" subsection):
a higher threshold declined more bad answers and more good ones with them.
Every check, filter and escalation rule in this module has that dial. For
models declining to answer, Wen et al.'s
[survey of abstention in language models](https://aclanthology.org/2025.tacl-1.26/)
(TACL 2025) collects the methods, benchmarks and metrics for deciding when
declining is the right call.

The habit that follows: **report every check as a pair of numbers, what it
catches and what it wrongly blocks,** measured on cases where you know the
right outcome.

---

## The ways to spend on reliability

Each lesson in the rest of this module adds one way of spending these four
quantities. Here's where each one lands, roughly:

| Lever | What it buys | What it mostly spends | Where |
|---|---|---|---|
| Deterministic checks on inputs, tool calls and results | Catches malformed and out-of-range steps before they do damage | A little latency; false blocks if a rule is too strict | Lesson 3 |
| Verifying claims against sources | Catches answers the sources don't support | Extra calls and latency; false flags on claims that are fine | Lesson 4 |
| Several samples and a vote | Consistency on questions the model usually gets right | Calls and tokens, often in parallel | Lesson 5 |
| A larger thinking budget | Better answers on some questions | Tokens and latency, in sequence | Lesson 5 |
| A stronger model, for some or all requests | Accuracy the smaller model can't reach | Cost per call | Lesson 6 |
| Asking the user, or handing to a person | Avoids guessing when the agent can't tell | A person's time and the user's wait; false alarms | Lesson 6 |
| Dry runs and reading back what an action did | Catches actions that failed or did the wrong thing | Extra tool calls and latency | Lesson 7 |
| Fallbacks when a dependency fails | Keeps working, perhaps partly, through outages | Some accuracy on the fallback path | Lesson 8 |
| Restricting what the agent may do after reading untrusted text | Limits what an injected instruction can do | Tasks that legitimately needed the restricted tool | Lesson 9 |

None of these is right everywhere, and the rest of this lesson is about
choosing: measuring what each one actually costs, comparing options fairly,
and spending where the risk is.

---

## Quiz cards

> **Q1.** A new check stops 95% of the bad actions in your test set. What
> else do you need to know before adopting it?
> - A) Nothing: 95% is a strong catch rate by any standard
> - B) How often it blocks actions that were fine, and what it adds in latency and cost ✅
> - C) Whether it was written by the same team as the agent
> - D) Only how much it costs per call, since accuracy is already known
>
> *Explanation: a check is judged on what it catches and what it wrongly
> blocks. In AgentDojo, an injection classifier cut successful attacks from
> 57.7% to 8.0% and also cut completed tasks from 69.0% to 41.5%. Its catch
> rate alone would have made it look like a clear win.*

> **Q2.** Why do false refusals count as a reliability failure, not just an
> inconvenience?
> - A) Because refusals always cost more tokens than answers
> - B) Because they're rarer than wrong answers and so easy to overlook
> - C) Because a task the agent wrongly declines doesn't get done, so users can't count on the agent any more than if it had failed ✅
> - D) Because a refusal means the model has been attacked
>
> *Explanation: reliability is about whether the task gets done, run after
> run. A blocked legitimate action and a failed one leave the user in the
> same place; the refusal is just quieter about it.*

> **Q3.** OR-Bench found a rank correlation of 0.878 between how reliably
> models refused harmful prompts and how often they refused harmless ones.
> What does that suggest?
> - A) Safer models are simply better at understanding prompts
> - B) Over-refusal only happens in models with weak safety training
> - C) For most models tested, refusing more of the harmful prompts came with refusing more harmless ones ✅
> - D) The two measures are unrelated, since 0.878 is below 1
>
> *Explanation: a correlation that high means models ranked similarly on
> both: the ones that refused the most harmful prompts also refused the most
> harmless ones. It describes the models they tested, and it's the pattern
> any check has to beat: catching more without blocking more.*

> **Q4.** Kapoor et al. found that simple baselines matched elaborate agent
> designs on accuracy at a fraction of the cost. What practice were they
> arguing against?
> - A) Using more than one model call per task
> - B) Reporting and comparing agents on accuracy alone, without their cost ✅
> - C) Building agents on open-weight models
> - D) Measuring accuracy with repeated runs
>
> *Explanation: when only accuracy is reported, a costly design with no real
> advantage looks like progress. Plotting accuracy against cost shows which
> designs are actually better, which the next concepts in this lesson put
> into practice.*

> **Q5.** A lever "buys consistency on questions the model usually gets
> right, and spends calls and tokens, often in parallel". Which one is it?
> - A) A larger thinking budget
> - B) Verifying claims against sources
> - C) Several samples and a vote ✅
> - D) A fallback model
>
> *Explanation: voting over several samples makes the common answer more
> consistent, and the samples can run side by side. A larger thinking budget
> also spends tokens, but in sequence, so the user waits for all of them.
> Lesson 5 covers both, and when each helps.*

---

*(End of this concept. The next concept measures what reliability costs on
parts of the agent the course has already built.)*
