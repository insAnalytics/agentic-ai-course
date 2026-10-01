# Module 7, Lesson 3 — Concept 2: One note per trace, at the first failure

> **Note for the site build:** the demos read `traces.json` (2 MB), `labels-simar.json`, `labels-simar-v2.json` and `labels-claude.json`. The first demo defines `traces`, `labels` and `outline`; carry them into the second and third demos' hidden setup.

---

## What a useful note looks like

A note from open coding has one job: to let someone who wasn't there find the problem, and later, to sit next to other notes like it. That asks four things of it:

- **The first failure.** Husain and Shankar recommend noting the first thing that went wrong, because a mistake early in a run causes others later, and a note about a knock-on effect points at the wrong fix. One note per run is enough to start with.
- **Specific.** "Moved support_agent without asking which of support-team's three agents was meant" can be checked against the trace and grouped with other notes. "Bad action" can't.
- **Observable.** Write what the agent did, not what you think was going on inside it. "Took the empty record at face value" is something you can see; "was confused" isn't.
- **In your own words, not a category's.** The categories come later, from all the notes together. Naming a category while reading pulls each run towards the list you already have, which is the thing open coding is meant to avoid.

The reading standard adds one more rule that shapes the notes: judge the run as it ended, with all its turns, not as it might have gone if the conversation had continued.

---

## Why a person reads

Finding the first failure sounds like something a model could do. Research on exactly that task says not yet. The Who&When benchmark (Zhang et al., ICML 2025) collected failure logs from 127 multi-agent systems, annotated with which agent caused each failure and at which step, and tested automated methods, strong models among them, on finding both. The best method named the responsible agent 53.5% of the time but the decisive step only 14.2% of the time, and some methods did worse than random. Later work improves on those figures, but finding where a run first went wrong is still hard to automate reliably.

So the reading here was done by a person, with a model reading alongside, labelled as a model. How often the two agree is part of what this lesson measures.

---

## Notes from the reading

Here are two runs Simar read, outlined from their traces, with his notes:

```python
traces = json.loads((READING / "traces.json").read_text(encoding="utf-8"))
labels = {label["trial_id"]: label for label in load_reading("labels-simar-v2")["labels"]}


def outline(trial_id: str) -> None:
    """The request, each tool call with its main argument, and the start of the final answer."""
    trace = traces[trial_id]
    print(f"{trial_id.split('/')[1]}: {trace['task']['request']}")
    for call in trace["tool_log"]:
        argument = next(iter(call["input"].values()), "")
        print(f"    {call['tool']}({str(argument)[:50]!r}){'' if call['ok'] else '  -> error'}")
    print(f"    answer: {trace['answers'][-1].splitlines()[0][:110]}")


for trial_id in ("baseline-a/a19/0", "baseline-a/q30/1"):
    outline(trial_id)
    label = labels[trial_id]
    print(f"  Simar: {label['verdict']} ({label['fault']}): {label['first_failure']}")
```
```
a19: Move the support team's agent to claude-haiku.
    query_database('SELECT agent_id, owner FROM agents WHERE owner LIK')
    get_agent('support_agent')
    get_agent('triage_agent')
    get_agent('notes_agent')
    set_model('support_agent')
    answer: Done. I've successfully moved the support team's agent (support_agent) from claude-sonnet to claude-haiku. The
  Simar: fail (agent): Agent decided to change model even when it knew that the users request was ambiguous and there was no clear choice. It should have asked the user for more details.
q30: Which agents stop working if auth-service goes down?
    search_docs('auth-service agent dependencies')
    query_database('SELECT DISTINCT a.agent_id FROM incident_agents ia')  -> error
    query_database('SELECT ia.agent_id, i.title FROM incident_agents i')
    search_docs('registry key certificate auth service agent')
    query_database('SELECT DISTINCT agent_id FROM incident_agents WHER')
    search_docs('auth-service down outage fail registry-api')
    query_database('SELECT agent_id, model, tier, owner, status FROM a')
    search_docs('auth-service outage fail registry-agent connection')
    search_docs('INC-2041 triage_agent support_agent research_agent')
    query_database('SELECT DISTINCT agent_id FROM incident_agents WHER')
    answer: stopped after 10 steps without an answer
  Simar: fail (agent): It was not able to come up with a conclusive conclusion and ended up stopping after 10 steps
```
*(runs live, shows output — read-only demo snippet, not graded; the notes are Simar's, written while reading)*

The a19 note is a good first-failure note: it names the decision that went wrong (changing a model when the request could mean three agents) and what should have happened instead. The trace supports every word of it: the agent looked up all three agents, then picked one.

---

## A note that can be acted on

Notes get better with practice, and two pairs from the reading show how:

```python
label = next(l for l in load_reading("labels-simar")["labels"] if l["trial_id"] == "baseline-a/q07/0")
print("q07:", traces["baseline-a/q07/0"]["task"]["request"])
print("  first note:", label["first_failure_original"])
print("  rewritten: ", label["first_failure"])

claude = {l["trial_id"]: l for l in load_reading("labels-claude")["labels"]}
print("\nq30, two different runs:")
print("  Simar, run 1: ", labels["baseline-a/q30/1"]["first_failure"])
print("  Claude, run 3:", claude["baseline-a/q30/3"]["first_failure"])
```
```
q07: How do I get through the whole list of agents, not just the first screenful?
  first note: It failed to provide the correct algorithmic solution to the user's problem
  rewritten:  The user wanted to be able to traverse the entire list without running into issues like being limited by row limits which the agent has. Instead of providing a solution which can display the entire list in one go, it provided a SQL query which has a row limit, creating the same problem again.

q30, two different runs:
  Simar, run 1:  It was not able to come up with a conclusive conclusion and ended up stopping after 10 steps
  Claude, run 3: Searched and queried ten times without answering, stopped by the step limit; its first searches had already returned the architecture overview's dependency sections (D04), which answer the question.
```
*(runs live, shows output — read-only demo snippet, not graded; the q07 rewrite is Simar's own, after a second look; the q30/3 note is Claude's)*

- **q07.** The first note says the answer was wrong but not how, so it can't be grouped with anything. The rewrite says what the user needed (the whole list), what the agent gave (a query with a row limit) and why that fails (it recreates the problem). That's the version that later became its own category, *misses the user's real need*.
- **q30.** Both notes are true, for two different runs of the same task. The second also says where the answer was: the agent's first searches had already returned the section that answers the question. That changes what the failure looks like. It isn't "couldn't find the answer", it's "found it and kept searching", which points at a different fix.

---

## Passes worth a note

A run that passes can still be worth a sentence. The reading page had an optional "how" field for this: anything about how the agent got there, including a pass that got there by luck or by a route that won't hold up. Four runs Claude read, all passes:

```python
claude = {l["trial_id"]: l for l in load_reading("labels-claude")["labels"]}
for trial_id in ("baseline-a/a02/2", "baseline-a/a02/0", "baseline-a/m05/1", "baseline-a/m03/1"):
    label = claude[trial_id]
    tools = " > ".join(call["tool"] for call in traces[trial_id]["tool_log"])
    print(f"{trial_id.split('/', 1)[1]}: {label['verdict']}  [{tools}]")
    if label["how"]:
        print(f"    {label['how']}")
```
```
a02/2: pass  [get_agent > search_docs > set_model > get_agent]
    Read the record back after the change.
a02/0: pass  [get_agent > set_model]
m05/1: pass  [get_agent > set_model > search_docs > set_model]
    Its last line says the change 'takes effect from each agent's next session', contradicting its own correct note one turn earlier; harmless here.
m03/1: pass  [search_docs > search_docs > search_docs > query_database > get_agent > get_health]
    Found billing_agent through the database after three searches that returned unrelated vendor pages.
```
*(runs live, shows output — read-only demo snippet, not graded; the notes are Claude's)*

- **a02/2 and a02/0** both passed the same task. One read the record back after the change and one didn't. Here it made no difference, because the write landed; on the lost-write tasks, it made all the difference. A pass by the second route is a pass that wouldn't have caught the fault.
- **m05/1** passed but contradicted itself between turns.
- **m03/1** got there in the end, after three searches that found nothing relevant.

None of these change a verdict, but they're the material for checks and for the question of *how* the agent reached a result, which this lesson comes back to at the end.

---

## Quiz cards

> **Q1.** Why does open coding note the first failure in a run, rather than the most serious one?
> - Later problems usually follow from it, so it's the cause ✅
> - The first failure is always the most serious one in the run
> - Later failures are too hard for a reader to find reliably
> - Readers only have time to look at the start of each run
>
> *Explanation: An early mistake changes everything the agent does after it, so a note about a later problem often describes a symptom. Fixing the first failure can remove the ones that follow; fixing a symptom leaves the cause in place.*

> **Q2.** Which of these is the most useful open-coding note?
> - "Moved support_agent without asking which of three was meant" ✅
> - "Acting on ambiguity" (from the list of failure categories)
> - "The agent was confused about what the user actually wanted"
> - "Bad action, wrong outcome, the agent should have done better"
>
> *Explanation: A useful note is specific and observable: someone else can find it in the trace and group it with similar notes. A category name decides the grouping before all the notes are in; "confused" guesses at the model's state; a generic complaint can't be checked or grouped.*

> **Q3.** On the Who&When benchmark, how well did the best automated method find the step where a failure started?
> - About 14% of the time ✅
> - About 53% of the time
> - About 88% of the time, on average
> - About 95% of the time
>
> *Explanation: The best method named the responsible agent 53.5% of the time but the decisive step only 14.2% of the time, and some methods did worse than random. That's why the first failure is found here by a person reading, with a model's reading measured against it rather than trusted.*

> **Q4.** Two notes on runs of the same task: "Stopped after 10 steps without an answer" and "Its first searches had already returned the section that answers it, then it kept searching." What does the second add?
> - Where the answer was, pointing at another fix ✅
> - A more precise count of the steps the agent took
> - The reader's opinion of how hard the question was
> - Nothing: both notes describe the same failure exactly
>
> *Explanation: Both are true, but the second shows the agent had the answer and didn't recognise it. That's a failure to stop, not a failure to find, and it calls for a different fix, such as a check on whether the results already answer the question.*

> **Q5.** Two runs both pass a "move the agent" task. One read the record back after the change; the other didn't. Why is that worth a note?
> - Its route wouldn't have caught a lost write ✅
> - The second run took longer and cost more to complete
> - The first run broke a rule by calling get_agent twice
> - Only the first run's verdict counts as a real pass
>
> *Explanation: Both verdicts are right for these runs, because the write landed. But the run that didn't check would have reported success on the lost-write tasks too. A note on how a pass was reached shows which passes depend on luck.*
