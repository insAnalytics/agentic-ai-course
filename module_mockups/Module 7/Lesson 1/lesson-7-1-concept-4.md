# Module 7, Lesson 1 — Concept 4: Offline and online

---

## Two times to evaluate

Everything so far in this lesson has been **offline** evaluation: a fixed set of tasks, run before anything ships, in a world built for the purpose, with no real user involved. The pilot is an offline evaluation. Once an agent is in use there's a second kind, **online** evaluation: watching what the agent does with real requests, as they happen.

Google's agent platform names three ways of evaluating an agent, and they map onto this split:

- **Rapid evaluation**, run often during development, to try new agent logic or a model change. Offline.
- **Test case evaluation**, run on a schedule or in CI/CD against a fixed dataset, as regression testing. Offline.
- **Online monitoring**, run continuously, to track the quality of an agent that's deployed. Online.

The tools Anthropic's guide lists for teams building evals, among them LangSmith, Langfuse, Arize Phoenix and Braintrust, support both: offline evaluation on datasets, and evaluation of a live agent's traces.

---

## What each method sees, and what it misses

Anthropic's guide compares the ways a team can learn how its agent performs. Here they are, with the guide's main strength and weakness for each:

- **Automated evals**, the offline suite. Fast to iterate on, fully reproducible, no effect on users, and cheap enough to run on every change. It takes work up front and ongoing maintenance, and it can give false confidence when the tasks don't match how the agent is really used.
- **Production monitoring**: tracking errors and metrics on the live system. It shows real behaviour at scale and catches problems no one thought to test. It's reactive, since users meet the problem first, the signals are noisy, and it has no ground truth to grade against: nobody has written down the right answer to a live request.
- **A/B testing**: running two versions on real traffic and comparing outcomes. It measures what actually matters to users, such as whether tasks get completed. It's slow, needing days or weeks and enough traffic, it only tests changes you've already deployed, and on its own it says little about why a number moved.
- **User feedback**, such as a thumbs-down or a bug report. It surfaces problems nobody anticipated, with real examples attached. It's sparse, skews towards severe problems, and users rarely say why something failed.
- **Manual transcript review**: people reading conversations. It builds intuition for how the agent fails and catches subtle problems automated checks miss. It's slow, its coverage is uneven, and it mostly gives impressions rather than numbers.
- **Systematic human studies**: trained raters grading outputs against a set procedure. They're the gold standard for subjective quality and for calibrating model graders. They're expensive and slow to run often.

No single method catches everything. The guide compares the methods to the Swiss cheese model from safety engineering: each layer has holes, and failures that slip through one get caught by another. It's the same reasoning as [Module 6's layered checks](→ Module 6, the putting it together lesson, the layering the checks concept), applied to evaluation. The guide's conclusion is that the most effective teams combine automated evals for fast iteration, production monitoring for ground truth about real use, and periodic human review for calibration.

---

## Capability suites and regression suites

Offline suites come in two kinds, which Anthropic's guide distinguishes by the question each asks:

- **A capability suite** asks what the agent can do well. It should start with a low pass rate: it's made of tasks the agent struggles with, so it gives a team something to climb.
- **A regression suite** asks whether the agent still handles everything it used to. It should pass nearly 100% of the time, so that any drop means something broke.

The two are connected. Once the agent reliably passes a capability task, the task can graduate into the regression suite, where it guards against losing what was gained. A task that once asked "can the agent do this at all?" ends up asking "can it still do this reliably?"

The pilot's pass rates, 70–87% across the three setups, put its ten tasks somewhere between the two. Neither number was the point of the pilot, which was to see what failures look like before building a real suite. Lesson 4 builds the module's suites, and Lesson 10 runs one as a regression check when something changes.

---

## How the two feed each other

Online and offline evaluation aren't alternatives, they're a cycle:

- **Failures found online become offline tasks.** Anthropic's guide recommends building the first suite from the checks you already do by hand and, once there are users, from the bug tracker and support queue, so that the suite reflects how the agent is really used.
- **Offline suites gate what goes online.** A change that fails the regression suite doesn't ship.
- **Online samples get read.** The guide recommends sampling transcripts to read every week. What turns up becomes the next round of offline tasks.

This course has no users, so it can't run the online half for real. There's no live traffic to A/B test and no thumbs-down to collect. Lesson 11 covers monitoring by treating the module's recorded runs as if they were arriving live, and says exactly which parts of real monitoring that can and can't show.

---

## Quiz cards

> **Q1.** A team reruns a fixed set of 40 tasks against its agent in CI before every release. What kind of evaluation is this?
> - Offline: fixed tasks, run before release, without users ✅
> - Online: it runs automatically every time the code changes
> - Production monitoring: it tracks the agent's quality over time
> - An A/B test: each release is compared against the one before
>
> *Explanation: What makes it offline is that the tasks are fixed and no real user is involved, however automated or frequent the runs are. Online evaluation watches real requests to a deployed agent; running in CI doesn't make a suite online.*

> **Q2.** An offline suite passes 98% of the time, run after run. What is it most useful for?
> - Catching regressions: any drop means something broke ✅
> - Showing where the agent most needs to improve next time
> - Proving the agent is ready for every kind of real request
> - Nothing much; a suite this easy should be thrown away
>
> *Explanation: A suite near 100% has graduated into a regression suite: its value is that a drop is a clear alarm. It gives little signal about what to improve, which is a capability suite's job, and a high score on fixed tasks says nothing about requests the suite doesn't cover.*

> **Q3.** Why can't production monitoring by itself tell you how often a live agent's answers are correct?
> - Nobody has written down the right answer to a live request ✅
> - Live traffic is too varied to be summed up in a single number
> - Monitoring tools can't read the replies an agent gives to users
> - Requests arrive too fast for each one to be recorded in full
>
> *Explanation: Monitoring can count errors, latency and cost, which need no answer key. Correctness needs something to compare against, and live requests don't come with one. That's why Anthropic's guide lists the lack of ground truth as one of monitoring's main weaknesses, and why the methods are combined.*

> **Q4.** A user reports that the agent moved the wrong agent's model. What should happen to that report?
> - It becomes a task in the offline suite, so the fix stays fixed ✅
> - It's counted in a dashboard and compared with last week's count
> - It waits until enough similar reports arrive to justify a test
> - It's resolved by an A/B test of the old and new versions
>
> *Explanation: Turning real failures into offline tasks is how a suite comes to reflect real use, and keeping the task in the suite means a later change can't quietly bring the failure back. Counting reports doesn't stop a regression, and an A/B test needs traffic and time that one failure doesn't call for.*

> **Q5.** This course has no users. Which of these can't it run for real?
> - An A/B test of two versions of the agent ✅
> - A regression suite rerun after a change
> - A capability suite of tasks the agent fails
> - A review of recorded transcripts by a person
>
> *Explanation: An A/B test compares versions on real traffic, so without users there's nothing to split. The other three are offline, or use recordings, and the course runs all of them in this module.*
