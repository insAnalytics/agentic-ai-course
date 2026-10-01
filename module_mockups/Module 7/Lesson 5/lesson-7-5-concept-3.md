# Module 7, Lesson 5 — Concept 3: Checking the path in code

> **Note for the site build:**
> - New script `scripts/eval/path_facts.py` (in the zip with this file) writes `public/data/eval/suite/path-facts.json`: the vendor-citation runs (s06, s07, s09) with their answers and the source ids their tools returned, and the tool-call counts of every dev run of a question no document answers. Run it, check the output matches the copy in the zip, and commit both.
> - The zip also has the changes this page describes: `grading.py`'s citation check now uses the same `cited_ids` as the exercise (no grade changed on any of the 1,105 recorded runs), and `tasks/suite-2a.json` version 3 raises s24's and s25's step limit from 6 to 9 (first checks kept). `suite_grades.py` keeps Lesson 4's grades on the version 2 checks, so Lesson 4's pages don't change.
> - The demo after the exercise needs the exercise's reference `cited_ids` and `unsupported_citations` loaded without showing them.

---

## What a path check can check

[Lesson 1](→ Module 7, the why agents are hard to grade lesson, the grading the outcome and grading the path concept, when the path is the right thing to check) found that matching a whole path against a reference fails good runs and passes bad ones, and that path checks earn their place for a few specific things. The registry agent's checks use exactly those:

- **A step that's a rule in its own right.** "Read the record back after changing it" (`must_call_after`), for tasks that ask for the change to be confirmed.
- **An action that mustn't happen.** `must_not_call` fails a run that so much as attempts a forbidden call, such as changing an agent on a request that could mean three of them. An attempt counts, even if the registry refuses it.
- **A limit.** `max_tool_calls` fails a run that takes more steps than a task should need.
- **Valid arguments.** Each tool's input schema says what a call may contain, as [Module 3](→ Module 3, the tool schemas and argument validation lesson) set out, and the registry refuses a call that breaks it. A check can do the same on the recorded log.

Each is a rule, not a reference path, so none of them cares about the order of everything else the agent did. Two path checks in this module still went wrong, in opposite directions: one failed a run that was right, and one shows a failure no reply check could see.

---

## A limit nobody measured

The suite's s24 asks for the root cause of INC-2100, an incident that doesn't exist. Its check allowed at most 6 tool calls, a number chosen when the task was written. Four of its five runs searched until the agent's 10-step limit stopped them, and failed rightly. The fifth said, correctly, that there's no such incident, after 7 calls, and failed the limit.

Whether 6 was a sensible limit is a question the runs can answer. Here are all the dev runs of questions no document answers, across the baseline and the suite:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of the module's suite lessons and already loaded)*

```python
from collections import Counter

facts = load_suite("path-facts")
steps = facts["steps"]
answered = [s["tool_calls"] for s in steps if not s["stopped"]]
print(f"{len(steps)} runs of questions no document answers; {len(steps) - len(answered)} stopped by the step limit")
print("tool calls in the runs that answered:", dict(sorted(Counter(answered).items())))
for limit in (6, 9):
    print(f"  a limit of {limit} fails {sum(n > limit for n in answered)} of the {len(answered)} runs that answered")
print("s24's runs:", [("stopped" if s["stopped"] else s["tool_calls"]) for s in steps if s["task_id"] == "s24"])
```
```
55 runs of questions no document answers; 16 stopped by the step limit
tool calls in the runs that answered: {1: 3, 3: 6, 4: 5, 5: 4, 6: 4, 7: 8, 8: 5, 9: 4}
  a limit of 6 fails 17 of the 39 runs that answered
  a limit of 9 fails 0 of the 39 runs that answered
s24's runs: ['stopped', 'stopped', 'stopped', 'stopped', 7]
```
*(runs live, shows output — read-only demo snippet, not graded)*

Runs that eventually answered took anywhere from 1 to 9 calls, and 17 of the 39 took more than 6. A limit of 6 would fail almost half of them, whatever they answered, so it was measuring cost and calling it correctness.

The fix separates the two:

- **Did it stop?** That's the failure s24 exists to test, and the agent's loop already defines it: a run that hits the 10-step limit never answers. A check that allows up to 9 tool calls fails exactly those runs.
- **How long did it take?** That's cost, and it's better reported as a number, such as the median and the spread of tool calls, than turned into a pass or fail.

s24 and its held-out twin s25 now allow up to 9 calls, with their first checks kept beside the new ones. The fix applies to s25 without anyone reading its runs, which is what [Lesson 4](→ Module 7, the building a task suite lesson, the holding tasks out, and tuning to the suite concept, tuning to the suite) said a fix to the measurement should do. s24's fifth run now passes; the other four still fail.

---

## A check across the path and the reply

Some checks need both the reply and the path. A citation is a claim about the path: it says "this came from that source". Checking it means reading the ids in the reply and comparing them with the ids the tools actually returned in that run. That's what found the agent's most common failure on vendor documentation.

---

## Applied sandbox exercise
*(graded — find the citations in an answer that point at sources no tool returned)*

**Task shown to learner:**

Write two functions:

- `cited_ids(answer)`: the set of source ids the answer cites. A source id matches `SOURCE_ID`, such as `D07:1` or `postgresql/high-availability.md:57`. An answer cites ids in two ways:
  - inside square brackets, one id or several separated by commas: `[D07:1]`, `[D01:7, D14:1]`
  - alone in parentheses, which includes the target of a markdown link: `(D07:1)`, `[silence](D07:2)`
  
  Anything else in brackets, such as `[1]` or `[get_agent]`, isn't a citation.
- `unsupported_citations(answer, retrieved)`: the sorted list of ids the answer cites that aren't in `retrieved`, the ids the run's tools returned.

**Starter code:**
```python
import re

SOURCE_ID = r"[\w./-]+:\d+"


def cited_ids(answer: str) -> set[str]:
    """Every source id the answer cites: inside square brackets, one or more separated by commas, or alone in
    parentheses, which includes the target of a markdown link, "[text](id)"."""
    # your code here


def unsupported_citations(answer: str, retrieved: list[str]) -> list[str]:
    """The ids the answer cites that no tool returned in the run, sorted."""
    # your code here


answer = "Use a silence [D07:5], configured with matchers [alertmanager/alertmanager.md:5]."
print(unsupported_citations(answer, ["alertmanager/alertmanager.md:5", "alertmanager/alertmanager.md:4"]))
```

**Hidden tests:**
```python
retrieved = ["D01:7", "D14:1", "alertmanager/alertmanager.md:5", "postgresql/high-availability.md:57"]

got = cited_ids("Silences mute alerts [alertmanager/alertmanager.md:5].")
assert got is not None, "cited_ids should return a set of ids"
assert got == {"alertmanager/alertmanager.md:5"}, f"one id in square brackets: got {got}"
assert cited_ids("It needs the priority tier [D01:7, D14:1].") == {"D01:7", "D14:1"}, \
    "several ids in one pair of brackets, separated by commas"
assert cited_ids("Use a [silence](D07:2) for maintenance.") == {"D07:2"}, \
    "the target of a markdown link is a citation too"
assert cited_ids("See [postgresql/high-availability.md:57](D07:57).") == {"postgresql/high-availability.md:57", "D07:57"}, \
    "a link whose text is itself an id cites both"
assert cited_ids("Checked the registry [get_agent] and the docs [database query].") == set(), \
    "brackets around words that aren't source ids aren't citations"
assert cited_ids("See step [1], then (D07:1).") == {"D07:1"}, \
    "a bare number in brackets isn't a citation, but an id alone in parentheses is"
assert cited_ids("Twice: [D01:7] and again [D01:7].") == {"D01:7"}, "an id cited twice is one id"
assert cited_ids("No citations at all.") == set(), "an answer with no citations cites nothing"

assert unsupported_citations("Use a silence [D07:5][alertmanager/alertmanager.md:5].", retrieved) == ["D07:5"], \
    "only the ids no tool returned"
assert unsupported_citations("Read-only transactions don't wait [D07:57][D07:1].", retrieved) == ["D07:1", "D07:57"], \
    "every unsupported id, sorted"
assert unsupported_citations("It needs the priority tier [D01:7, D14:1].", retrieved) == [], \
    "an answer that cites only what it retrieved has no unsupported citations"
assert unsupported_citations("The registry says so [A01:0].", retrieved) == ["A01:0"], \
    "an id that doesn't exist anywhere is unsupported too"
```

**Hint (shown on request):** `re.findall(r"\[([^\[\]]+)\]", answer)` gives the inside of every pair of square brackets. Split each on commas, strip the spaces, and keep the parts that `re.fullmatch(SOURCE_ID, part)` accepts. A second `re.findall` with the pattern `\((SOURCE_ID)\)` (built with an f-string) finds the ids alone in parentheses. Set difference does the rest.

**Reference solution:**
```python
import re

SOURCE_ID = r"[\w./-]+:\d+"


def cited_ids(answer: str) -> set[str]:
    """Every source id the answer cites: inside square brackets, one or more separated by commas, or alone in
    parentheses, which includes the target of a markdown link, "[text](id)"."""
    ids = set()
    for inside in re.findall(r"\[([^\[\]]+)\]", answer):
        for part in inside.split(","):
            if re.fullmatch(SOURCE_ID, part.strip()):
                ids.add(part.strip())
    ids |= set(re.findall(rf"\(({SOURCE_ID})\)", answer))
    return ids


def unsupported_citations(answer: str, retrieved: list[str]) -> list[str]:
    """The ids the answer cites that no tool returned in the run, sorted."""
    return sorted(cited_ids(answer) - set(retrieved))


answer = "Use a silence [D07:5], configured with matchers [alertmanager/alertmanager.md:5]."
print(unsupported_citations(answer, ["alertmanager/alertmanager.md:5", "alertmanager/alertmanager.md:4"]))
```
```
['D07:5']
```

**Explanation:** `fullmatch` keeps the check honest in both directions: brackets around words, such as "[database query]", aren't counted, and a list in brackets is split so each id is checked on its own. The course's own grader first used one pattern for both forms, which missed lists like "[D01:7, D14:1]". On the module's recorded runs that changed no verdict, but a check that misses a citation can only ever pass it. The comparison is with what the tools returned in this run, not with every document that exists: a citation is a claim about where the answer came from, and the run's log is the record of that.

---

## The agent's vendor citations

Here's the check on every run of the three vendor-documentation tasks in the suite's dev set:

```python
for run in load_suite("path-facts")["citations"]:
    unsupported = unsupported_citations(run["answer"], run["retrieved"])
    status = "never answered" if run["answer"].startswith("stopped") else (", ".join(unsupported) or "all cited sources returned")
    print(f"{run['trial_id'].split('/', 1)[1]}: {status}")
```
```
s06/0: D07:4, D07:5
s06/1: D05:3
s06/2: D07:4, D07:5
s06/3: never answered
s06/4: D07:2, D07:21, D07:23, D07:5, D07:9
s07/0: D07:2, D07:3
s07/1: D05:3, D07:3
s07/2: D07:2, D07:4
s07/3: D04:1
s07/4: all cited sources returned
s09/0: D07:2
s09/1: D07:57, D07:65
s09/2: D07:1
s09/3: D07:57
s09/4: D07:1
```
*(runs live, shows output — read-only demo snippet, not graded; `unsupported_citations` is the exercise's reference version, loaded for you)*

Thirteen of the fourteen runs that answered cite a source their tools never returned, and nearly every unsupported id is a section of D07, the migration runbook. The agent read vendor pages, whose ids are long file paths, and cited them as if they were D07 sections, sometimes keeping the vendor section's number ("D07:57" for `postgresql/high-availability.md:57`). The same check across every dev run in the baseline and the suite finds 58 of the 475 runs that cite anything citing an id no tool returned, and 64 of those 91 ids are D07 sections. Why the model does this isn't something the runs can show; what they show is that it does it reliably, which makes it a capability-suite target with a check that can measure progress.

The check has a limit of its own. It confirms that a cited source was returned, not that it says what the answer claims. A run that cites the right document for the wrong claim passes. [Module 6's support check](→ Module 6, the verifying an answer against its sources lesson, the checking each claim against the source it cites concept) judges whether a source supports a claim, and Lesson 6's model graders can do the same afterwards.

---

## Quiz cards

> **Q1.** Why does must_not_call fail a run that attempted a forbidden call, even if the registry refused it?
> - The attempt is the failure the task tests for ✅
> - A refused call still changes the registry's state
> - The registry can't be trusted to refuse calls
> - Refused calls are counted twice in the tool log
>
> *Explanation: A task like "move the support team's agent" tests whether the agent asks instead of picking one. Trying to change an agent is that failure, whether or not something else stops it.*

> **Q2.** s24 allowed at most 6 tool calls. Across the dev runs of unanswerable questions, 17 of 39 runs that answered took more than 6. What was the limit measuring?
> - Cost, while calling it correctness ✅
> - Whether the agent searched the right documents
> - Whether the agent's answer was right
> - How often the agent hit the 10-step limit
>
> *Explanation: Runs that answered correctly took up to 9 calls. A limit of 6 failed many of them for being slow, not for being wrong. The failure s24 exists to catch is never stopping, which is a run hitting the loop's step limit.*

> **Q3.** Why does the citation check compare with the ids the run's tools returned, rather than every document id that exists?
> - A citation claims where the answer came from ✅
> - Checking every document would take too long
> - Some documents are restricted from the reader
> - Tools return ids in a different format
>
> *Explanation: Citing D07:4 says "this came from that section". If no tool returned D07:4 in this run, the answer didn't come from it, even though the section exists. The run's log is the record of what the agent actually read.*

> **Q4.** On the vendor-documentation tasks, what did the citation check find?
> - The agent cited vendor pages as D07 sections ✅
> - The agent cited no sources in most of its answers
> - The vendor pages were missing from search results
> - The agent's answers contradicted the vendor pages
>
> *Explanation: The answers were mostly right and the searches returned the vendor pages, but the citations pointed at sections of the migration runbook, D07, which no tool had returned. Across all dev runs, 64 of 91 unsupported ids were D07 sections.*

> **Q5.** A run cites a section its tools did return, for a claim that section doesn't make. What does the citation check say?
> - It passes: it only sees what was returned ✅
> - It fails, because the claim isn't in the section
> - It fails, because the citation is in brackets
> - It can't run on answers with only one citation
>
> *Explanation: The check compares ids, not content. Whether the section supports the claim needs a support check, like Module 6's, or a model grader reading both.*
