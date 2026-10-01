# Module 7, Lesson 1 — Concept 3: Grading one piece on its own

> **Note for the site build:** the demo on this page reads all three pilot files (`4b-think.json`, `4b-nothink.json`, `9b-think.json`).

---

## A step, tested by itself

The last two concepts graded whole runs: run the agent from the request to the reply, then check what it produced. There's a third kind of evaluation, and you've already used it more than once in this course without the name: testing **one piece of the agent on its own**.

LangSmith calls this a **single-step** evaluation, next to final-response and trajectory evaluations: evaluate one step in isolation, such as the call where the model decides which tool to use, with that step's own input fixed. The idea applies to any piece of an agent:

- **Deterministic code**, such as a tool, the parser that turns a model's raw reply into tool calls, or a permission filter. These get ordinary [unit tests](→ Module 0, the testing FastAPI applications lesson, the why testing matters, pytest basics, and unit tests concept): fixed input, expected output, run on every change.
- **A model step with a fixed input.** Three you've seen:
  - [Module 5 measured retrieval on its own](→ Module 5, the measuring retrieval lesson, the metrics concept): a labelled set of queries, the sections each should find, and recall over the results. No agent was involved.
  - [Module 4 tested a summary by asking it questions](→ Module 4, the compaction and summarization lesson, the when a summary loses something concept, testing a summary by asking it questions): compact a conversation, then check the summary still answers the probes.
  - **One decision in the loop.** Freeze the conversation at a chosen point, run only the model's next call, many times, and grade that one decision. Anthropic's guide describes evals of this kind for its browser agent, built to check that it picks the right tool for the situation, such as whether to read a page's text or take a screenshot of it.

What a piece-by-piece eval buys you:

- **It's cheap.** One step costs a fraction of a whole run, so you can afford many more cases.
- **It points at the cause.** When a component eval fails, you know which piece to fix. When an end-to-end eval fails, you know only that something went wrong somewhere in the run.

---

## The parts can pass while the whole fails

Task p01 in the pilot is Module 5's q29: "What does the alert that fired first in INC-2041 actually measure?" Module 5 showed that it [takes two searches](→ Module 5, the retrieval as a tool lesson, the multi-hop questions concept, measured): the incident report names the alert, and only the monitoring guide's section `D08:1` says what it measures (more than 5% of sessions ending in an error over 15 minutes). The demo lists every search the agent made on this task, across all three pilot setups, and whether each one returned `D08:1`:

```python
for name in ("4b-think", "4b-nothink", "9b-think"):
    for trial in load_pilot(name)["trials"]:
        if trial["task_id"] != "p01":
            continue
        searches = [call for call in trial["tool_log"] if call["tool"] == "search_docs"]
        answer = trial["answers"][-1]
        print(f"{trial['trial_id']}: threshold in the answer: {'yes' if '5%' in answer else 'NO'}")
        for call in searches:
            found = 'id="D08:1"' in call["output"]
            print(f"    search {call['input']['query']!r} -> {'found' if found else 'missed'} D08:1")
```
```
4b-think/p01/0: threshold in the answer: NO
    search 'INC-2041' -> missed D08:1
4b-think/p01/1: threshold in the answer: yes
    search 'INC-2041 alert fired first measure' -> missed D08:1
    search 'AgentErrorRateHigh measure error rate definition' -> found D08:1
4b-think/p01/2: threshold in the answer: yes
    search 'INC-2041' -> missed D08:1
    search 'AgentErrorRateHigh alert' -> found D08:1
4b-nothink/p01/0: threshold in the answer: NO
    search 'INC-2041 alert fired first measure' -> missed D08:1
4b-nothink/p01/1: threshold in the answer: NO
    search 'INC-2041 alert fired first' -> missed D08:1
4b-nothink/p01/2: threshold in the answer: NO
    search 'INC-2041 alert fired first measure' -> missed D08:1
9b-think/p01/0: threshold in the answer: yes
    search 'INC-2041 alert' -> missed D08:1
    search 'AgentErrorRateHigh alert measure' -> found D08:1
9b-think/p01/1: threshold in the answer: NO
    search 'INC-2041 alert' -> missed D08:1
9b-think/p01/2: threshold in the answer: yes
    search 'INC-2041 billing_agent invoice alert' -> missed D08:1
    search 'AgentErrorRateHigh alert measure error rate sessions' -> found D08:1
```
*(runs live, shows output — read-only demo snippet, not graded; whether each answer gave the threshold was also confirmed by reading it)*

The pattern is clean:

- **Every search that named the alert found `D08:1`.** None that didn't, did. As a component, the search tool does its job: give it the right query and the right section comes back. A retrieval eval in Module 5's style, with this query and this section as a labelled pair, would pass it.
- **Every run that searched a second time gave the threshold. Every run that stopped after one search didn't.** Five of the nine runs failed, and all five failed the same way.

So the failure isn't in retrieval. It's in one decision: after reading the incident report, the agent had the alert's name and answered from what it had, instead of searching for what the alert measures. An end-to-end eval catches that the answer is wrong. A retrieval eval would never see it. A single-step eval of that exact moment, the model's next call after the first search result, would measure it directly, and would let you test a fix to the prompt without paying for whole runs.

---

## Using the two together

Neither kind replaces the other:

- **End-to-end evals say whether the agent succeeds.** They're the only check on how the pieces work together, which is where p01 failed. They cost the most and say the least about where a failure is.
- **Component evals say which piece is broken, cheaply.** They guard pieces that are known to matter and run on every change. They can't see a failure that lives between the pieces.

A single-step eval also has a blind spot of its own. It starts from a fixed conversation, so it tells you what the agent does once it reaches that point, not whether it would get there in a real run. The registry agent's recordings are a natural source of those fixed points: every call in a transcript is a request the model answered, and Lesson 2 replays them exactly.

Which pieces deserve their own evals isn't something to decide up front. In this module, that comes from reading the failures first, in Lesson 3: a piece earns a component eval when the failures keep pointing at it.

---

## Quiz cards

> **Q1.** What makes a single-step evaluation different from an end-to-end one?
> - It fixes the input to one step and grades only that step's output ✅
> - It runs the whole agent but grades only the first tool call it makes
> - It grades only the final reply and ignores the steps before it
> - It runs the agent once on each task instead of several times
>
> *Explanation: A single-step eval feeds one step a fixed input, such as a frozen conversation or a labelled query, and checks that step alone. Grading only part of a whole run is still an end-to-end run, with all of its cost and none of the isolation.*

> **Q2.** In p01, every search that named the alert returned section D08:1. What would a retrieval-only eval on that query have reported?
> - That retrieval works, though five of the nine runs failed ✅
> - That retrieval is the reason five of the nine runs failed
> - Nothing, since search can't be tested apart from the agent
> - That the agent should use shorter queries to find D08:1
>
> *Explanation: Given the right query, the search tool returned the right section every time, so a retrieval eval passes it. The five failures came from runs that never made that search. A component can pass its own eval while the agent fails at a step the component eval doesn't cover.*

> **Q3.** Where did the five failing p01 runs go wrong?
> - They answered after one search instead of searching again ✅
> - Their searches returned the wrong sections for their queries
> - They retrieved D08:1 but quoted the wrong threshold from it
> - They searched for the alert's name but misread what came back
>
> *Explanation: Each failing run made one search, which found the incident report, and then answered. The first search did its job, returning the report that names the alert. None of the failing runs ever retrieved D08:1, so they had nothing to misread.*

> **Q4.** Component evals are cheaper and point straight at the broken piece. Why not test only components?
> - The pieces can each pass while the agent as a whole fails ✅
> - Component evals can only be run once for each change you make
> - Steps that use a model can't be tested in isolation from the agent
> - End-to-end evals become cheaper once an agent has many components
>
> *Explanation: p01 is the example: retrieval works, and the failure lives in a decision between steps. Model steps can be tested in isolation, as Module 4's summary probes and Module 5's retrieval metrics were; the limit is that no single piece's test covers how the pieces work together.*

> **Q5.** A single-step eval freezes the conversation just after p01's first search result and runs the next model call 50 times. What can't it tell you?
> - Whether a real run would ever reach that point ✅
> - How often the agent searches again from that point
> - How much the agent's choice there varies from run to run
> - Which tool the agent calls next from that point
>
> *Explanation: The eval starts from a conversation you chose, so it measures what the agent does once it's there: whether it searches again, how often, and with which tool. Whether the agent would reach that point on its own depends on the earlier steps, which only an end-to-end run exercises.*
