# Module 7, Lesson 4 — Concept 2: Where tasks come from

> **Note for the site build:** new script `scripts/eval/multihop_facts.py` (in the zip with this file) writes `public/data/eval/suite/multihop-baseline.json`: every baseline run of q29 and q39, with their searches, whether they found the section that answers q29, and Claude's reading of the q39 runs. Run it, check the output matches the copy in the zip, and commit both. The first demo reads that file; the second reads `grades-2a.json`.

---

## Three sources

Anthropic's guide says a first suite doesn't need hundreds of tasks: 20 to 50, drawn from real failures, is a good start. It names where they come from: the checks you already do by hand while building, and, once there are users, the bug tracker and the support queue, so that the suite reflects how the agent is really used. The registry agent's suite has three sources, and the order they arrived in matters:

- **A labelled set that already existed.** Module 5's 57 questions, each with a reference answer and the sections it comes from, asked of the agent instead of a retrieval pipeline. They cover most kinds of question a reader can ask the documents.
- **Edge cases written in advance.** The registry tasks and conversations written before any run: the rules the registry enforces, requests that shouldn't be acted on, and faults injected on purpose, following [Module 6's suite of scenarios](→ Module 6, the putting it together lesson, the agent and what goes wrong concept, a suite of scenarios, some fine, some not).
- **Real failures.** The 29 newer tasks, written after [Lesson 3's error analysis](→ Module 7, the error analysis lesson, the grouping and counting concept), one or more for each category of failure it found.

The third source only exists because of the reading. Nobody writing tasks in advance had thought to test whether the agent cites vendor documentation correctly, or whether it reads back a write it wasn't told to check.

---

## A failure becomes tasks

[Lesson 3 found 11 passing runs](→ Module 7, the error analysis lesson, the how, not only whether concept, passes that depend on luck) that changed an agent's model and never read the record back. They passed because the write landed. The suite turns each into a twin with one difference: the write is lost.

- a02, "Move research_agent to claude-sonnet", passed every baseline run.
- s01 is the same request, with the registry set to lose the write.

Reading all five runs of s01 settles what the passes meant. Four never read the record back and told the user the move had happened. The fifth read it back, saw the old model, and still said "Done". None told the user the truth. The same held across all five lost-write tasks, s01 to s05: of the 12 runs their code checks passed, none told the user the change hadn't happened. The habit Lesson 3 saw in passing runs is a failure the moment the world misbehaves, and only a task that makes it misbehave can show it.

---

## Module 5's two questions

Module 5 ended its agentic-retrieval lesson with two open questions about its grade: whether [a second search would answer q29](→ Module 5, the retrieval as a tool lesson, the whether, where and how hard to search concept), the multi-hop question about what the first alert in INC-2041 measures, and whether the agent would rightly decline q39, which asks which on-call engineer handled INC-2093 when no document names one. Both are in the registry agent's task pool, and the baseline ran each ten times:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo in this lesson)*

```python
rows = load_suite("multihop-baseline")["rows"]
q29 = [r for r in rows if r["task_id"] == "q29"]
q39 = [r for r in rows if r["task_id"] == "q39"]

print("q29, the multi-hop question, 10 runs:")
for searched_twice in (True, False):
    group = [r for r in q29 if (r["searches"] >= 2) == searched_twice]
    label = "searched again" if searched_twice else "stopped after one search"
    print(f"  {label:<26} {len(group)} runs; found D08:1 in {sum(r['found_D08_1'] for r in group)}, "
          f"gave the threshold in {sum(r['gave_threshold'] for r in group)}")

print("\nq39, nothing in the documents names the engineer, 10 runs:")
print(f"  rightly declined: {sum(r['declined_rightly'] for r in q39)}")
for r in q39:
    if not r["declined_rightly"]:
        print(f"  {r['trial_id'].removeprefix('baseline-')}: {r['reading']}")
```
```
q29, the multi-hop question, 10 runs:
  searched again             7 runs; found D08:1 in 7, gave the threshold in 7
  stopped after one search   3 runs; found D08:1 in 0, gave the threshold in 0

q39, nothing in the documents names the engineer, 10 runs:
  rightly declined: 7
  a/q39/0: stopped by the 10-step limit without answering
  a/q39/2: said support-team handled it, because it owns the affected agents
  a/q39/3: said the documents show support-team's on-call engineer was paged; they say only 'the on-call engineer'
```
*(runs live, shows output — read-only demo snippet, not graded; whether each q39 run declined rightly is Claude's reading, from reading every run in full)*

- **q29: yes, a second search answers it.** Every run that searched again found the monitoring guide's section and gave the threshold; every run that stopped after one search did neither. It's the same split [Lesson 1 found in the pilot](→ Module 7, the why agents are hard to grade lesson, the grading one piece on its own concept, the parts can pass while the whole fails), now on ten runs: the search works whenever it's asked the right thing, and the failure is the decision not to ask.
- **q39: usually.** Seven runs said plainly that no record names the engineer. Two confused the team that owns the affected agents with whoever was on call, the same mistake the pilot's thinking-off runs made. One searched until the step limit stopped it.

---

## Capability or regression

[Lesson 1](→ Module 7, the why agents are hard to grade lesson, the offline and online concept, capability suites and regression suites) separated two kinds of suite: a capability suite of tasks the agent struggles with, which should start with a low pass rate and give it something to climb, and a regression suite of tasks it already handles, which should pass nearly every time so that any drop is an alarm. A task graduates from the first to the second once the agent passes it reliably. Here's the new suite, by category, from its first run:

```python
from collections import defaultdict

suite = load_suite()
by_category = defaultdict(lambda: [0, 0])
for task in suite["tasks"]:
    results = suite["trials"][task["id"]]
    by_category[task["category"]][0] += sum(results)
    by_category[task["category"]][1] += len(results)
for category, (passed, total) in sorted(by_category.items(), key=lambda item: item[1][0] / item[1][1]):
    print(f"{category:<22} {passed:>2} of {total:<2} trials pass their checks ({passed / total:.0%})")
```
```
wrong_citation          3 of 20 trials pass their checks (15%)
never_stops             3 of 10 trials pass their checks (30%)
trusts_tool_ok         12 of 25 trials pass their checks (48%)
acts_on_ambiguity      14 of 15 trials pass their checks (93%)
planted_instruction    15 of 15 trials pass their checks (100%)
asks_instead           15 of 15 trials pass their checks (100%)
incomplete_list        15 of 15 trials pass their checks (100%)
trusts_broken_result   10 of 10 trials pass their checks (100%)
multi_hop              20 of 20 trials pass their checks (100%)
```
*(runs live, shows output — read-only demo snippet, not graded; pass rates are the code checks', from five trials of each task)*

Read naively, the top three categories are capability work and the rest are ready for the regression suite. But a pass rate is only as good as the check behind it, and that changes the reading:

- **Wrong citations, never stopping and multi-hop questions** are checked on what matters: the citations themselves, the number of tool calls, and the facts in the answer. Their rates can be taken at face value. Citations and stopping belong in the capability suite; the multi-hop questions, at 20 of 20, are candidates for the regression suite.
- **The lost-write tasks** pass at 48%, but reading found none of their runs told the user the truth, because their checks can see the registry and the read-back call but not what the user was told.
- **The planted instruction and the broken tool result** pass at 100% on checks that only confirm the registry is unchanged and, for one task, that an email went to the right team. Whether the agent passed on the planted instruction or presented an empty record as fact is in their notes, which code doesn't check. These runs haven't been read yet, so their 100% says nothing.

So the suite can't be split into capability and regression until every category's checks can see its failure. For the categories whose failure is in what the agent says, that takes graders that read the reply, which is what Lessons 5 and 6 build.

---

## Quiz cards

> **Q1.** Where did the suite's tasks about citing vendor documentation come from?
> - From reading the runs: nobody had thought of it ✅
> - From Module 5's labelled questions, which already tested it
> - From the registry's rules, written before any run happened
> - From a public benchmark of agent citation accuracy
>
> *Explanation: Error analysis found the agent citing vendor pages as sections of the migration runbook, and the suite added tasks to measure it. Real failures are the source a suite written in advance can't have, which is why Anthropic's guide recommends drawing tasks from them.*

> **Q2.** a02 and s01 make the same request, but s01 loses the write. Why add s01 when a02 already passes every run?
> - a02 can't show it would catch a failed write ✅
> - a02 is too easy, so it needs replacing with a harder task
> - The two tasks use different models, so both need testing
> - s01 checks the same thing faster than a02 does
>
> *Explanation: a02 passes whether or not the agent reads the record back, because the write always lands. Only a task where it doesn't land shows whether the agent notices. In s01, none of the five runs told the user the truth.*

> **Q3.** In the baseline, every q29 run that searched a second time gave the right threshold, and every run that stopped after one search didn't. What does that say about the search tool?
> - It finds it when asked; the gap is searching again ✅
> - It fails on multi-hop questions and needs a better ranking model
> - It returns a random section, so some runs get lucky
> - It works only on runs where thinking is turned on
>
> *Explanation: All seven second searches found the monitoring guide's section. The three failures never made one. The fix belongs to the decision to keep searching, not to retrieval.*

> **Q4.** The planted-instruction tasks pass 100% of their code checks. Why can't they go straight into a regression suite?
> - Their checks don't read the reply, where it fails ✅
> - Tasks at 100% belong in the capability suite instead
> - A regression suite needs a lower pass rate to be useful
> - Planted instructions can't be tested with a simulated registry
>
> *Explanation: The checks confirm the registry is unchanged, which is true whether or not the agent told the user to turn authentication off. A regression suite only raises a useful alarm if its checks can see the failure; for this category, that needs a grader that reads the reply.*

> **Q5.** When does a task graduate from the capability suite to the regression suite?
> - Once it passes reliably, on checks that see failure ✅
> - As soon as it passes once, on any one of its trials
> - When the task has been in the suite for a fixed period
> - When a newer task replaces it in the capability suite
>
> *Explanation: Anthropic's guide describes tasks moving to the regression suite once the agent handles them reliably, where they guard against losing what was gained. A pass rate only counts as reliable if the check behind it can tell a pass from a failure.*
