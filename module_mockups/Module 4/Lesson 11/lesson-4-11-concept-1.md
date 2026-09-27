# Module 4, Lesson 11 — Concept 1: Why a store that keeps everything gets worse

> **Note for the site build:** this lesson's setup continues from Lesson 10's (`MemoryRecord`, `VersionedStore` and Lesson 8's `keywords`). No new shared code in this concept. **Module 0 gap list:** `datetime` (`date`, `timedelta`, and later `datetime.fromisoformat`) is used from here on with one-line glosses; Module 0 doesn't teach it.

---

## The store after a year

[Lesson 10](→ this module, deciding what to remember lesson) made sure nothing false or planted gets in. It doesn't stop the store from filling up with things that are true, harmless, and useless. Here's a year of weekly reviews. Three things that matter are learned early. After that, most weeks leave a routine note behind, and every fourth week an old latency figure. After a few checkpoints, the demo asks what recall returns for this week's task:

```python
# date and timedelta come from Python's datetime module: a calendar date, and a length of time to add to one
from datetime import date, timedelta

def week_start(week):
    return (date(2026, 1, 5) + timedelta(weeks=week)).isoformat()

store = VersionedStore()
useful = set()

def remember(content, created, kind="episodic", source="agent", matters=False):
    store.save("u_simar", MemoryRecord(content=content, type=kind, source=source, created=created))
    if matters:
        useful.add(content)

# the few things that matter, learned early
remember("Never restart support_agent during business hours.", week_start(0) + "T09:00:00", "procedural", "user", matters=True)
remember("support_agent's bottleneck is billing_agent's per-ticket lookup.", week_start(1) + "T09:00:00", matters=True)
remember("Tom owns support_agent.", week_start(4) + "T09:00:00", "semantic", "user", matters=True)

task = "Draft the support_agent status update."
print(f"{'weeks':>5} {'stored':>7}   useful in the top 5 recalled")
for week in range(1, 53):
    # most weeks leave a routine note behind; every few weeks, an old metric
    remember(f"Week {week}: support_agent review done, nothing unusual.", week_start(week) + "T17:00:00")
    if week % 4 == 0:
        remember(f"support_agent p99 was {3 + week % 3}.{week % 10}s in week {week}.", week_start(week) + "T17:05:00")
    if week in (1, 2, 4, 13, 26, 52):
        recalled = store.search("u_simar", task, limit=5)
        hits = [m.content for m in recalled if m.content in useful]
        print(f"{week:>5} {len(store.search('u_simar', limit=1000)):>7}   {len(hits)} of 5   top: {recalled[0].content}")
```
```
weeks  stored   useful in the top 5 recalled
    1       4   3 of 5   top: Tom owns support_agent.
    2       5   3 of 5   top: Tom owns support_agent.
    4       8   1 of 5   top: support_agent p99 was 4.4s in week 4.
   13      19   0 of 5   top: Week 13: support_agent review done, nothing unusual.
   26      35   0 of 5   top: Week 26: support_agent review done, nothing unusual.
   52      68   0 of 5   top: support_agent p99 was 4.2s in week 52.
```
*(runs live, shows output — read-only demo snippet, not graded; "useful" is marked by hand here, which a real system can't do)*

In the first weeks, recall finds three of the three memories that matter. By week 4 it finds one, and from week 13 on, none. Nothing was deleted and nothing went wrong in any single step. Every memory matches the task on "support_agent", equal scores go to the newest, and there's always a newer routine note. The rule never to restart support_agent during business hours is still stored. It just never comes back.

## Why this hurts, not just wastes

It would be one thing if the routine notes merely took up space. The evidence says they do worse than that:

- **Look-alike clutter is the hardest kind.** [Lesson 2's evidence](→ this module, context that fits but still hurts lesson) found that models degrade most when the context is full of material that resembles what matters without being it. Fifty near-identical weekly notes are exactly that.
- **Agents follow what they recall.** An empirical study of memory management (Xiong et al., ["How Memory Management Impacts LLM Agents"](https://arxiv.org/abs/2505.16067)) found that agents closely imitate the past experiences they retrieve, which the authors call *experience-following*. A wrong or low-quality memory then keeps producing the same wrong behavior on similar tasks: *error propagation*.
- **Adding everything fell further behind over time.** In the same study, storing every experience left the agent performing worse than it would with an error-free memory, and the gap widened as the runs went on. Being strict about what's added, combined with deleting entries based on their track record, did better.

That's [Lesson 2's argument](→ this module, context that fits but still hurts lesson), that more context isn't better context, applied to memory. It's also after-the-fact support for Lesson 10: being selective about what goes in is half of it. This lesson is the other half, what happens to memories once they're in.

## What the store's search is missing

[Lesson 9's search](→ this module, building a memory store lesson, a memory record and a store scoped by design concept) ranks by keyword relevance, and breaks ties by recency. The demo shows what that leaves out:

- **No sense of importance.** A standing safety rule and a routine note score the same when they share one word.
- **No sense of use.** A memory recalled every week and one never recalled look alike, so there's no signal of which have proved useful.
- **Nothing ever leaves.** Every week adds, nothing goes, and relevance alone can't sort it out.

[The next concept](→ this lesson, scoring what to recall concept) adds importance and use to the ranking. [The one after](→ this lesson, forgetting on purpose concept) decides what leaves the store, and how, so that leaving isn't the same as losing.

## Does memory help at all?

Whether an agent does better with its memory than without it is a question for measurement, not argument. It depends on the agent, the tasks and the memory design. Module 7 covers evaluating agents, and memory is one of the things to evaluate. This lesson assumes you'll check.

---

## Quiz cards

> **Q1.** In the demo, why did recall stop returning the rule never to restart support_agent during business hours?
> - A) It was deleted when the store got large
> - B) It was superseded by a routine note
> - C) Every memory matched the task on one word, equal scores went to the newest, and newer routine notes kept arriving ✅
> - D) Rules can't be recalled by keyword
>
> *Explanation:* Nothing went wrong in any single step. Relevance alone can't tell a safety rule from a routine note when both share one word.

> **Q2.** Why are fifty near-identical weekly notes worse than fifty unrelated ones?
> - A) They take more tokens
> - B) Models degrade most on context that resembles what matters without being it ✅
> - C) They break the duplicate check
> - D) They can't be superseded
>
> *Explanation:* That was Lesson 2's evidence about look-alike distractors. Routine notes that mention the same agent are exactly that kind of clutter.

> **Q3.** What is "experience-following", and why does it make bad memories costly?
> - A) Agents recall memories in the order they were stored
> - B) Agents ignore old memories
> - C) Agents only follow the user's instructions
> - D) Agents closely imitate the past experiences they retrieve, so a wrong memory keeps producing the same wrong behavior on similar tasks ✅
>
> *Explanation:* Xiong et al. call the result error propagation. It's why what stays in memory matters as much as what goes in.

> **Q4.** In the same study, what did better over time than adding every experience?
> - A) Strict selection of what's added, combined with deleting entries based on their track record ✅
> - B) Adding everything, then summarizing it
> - C) Keeping only the most recent experience
> - D) Never using memory at all
>
> *Explanation:* Selective addition is Lesson 10's half. What leaves the store, and how, is this lesson's half.

> **Q5.** Which of these does the store's current search not take into account?
> - A) Keyword relevance
> - B) Which user the memory belongs to
> - C) How important a memory is, and whether it's been useful before ✅
> - D) The memory's type
>
> *Explanation:* Search ranks by keywords and breaks ties by recency. Importance and use are the next concept's additions.

---

*(End of Concept 1. No graded exercise here: the lesson's exercises start with scoring, in Concept 2.)*
