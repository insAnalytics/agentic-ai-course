# Module 7, Lesson 3 — Concept 4: Grouping and counting

> **Note for the site build:** the demos after the exercise need the exercise's reference `tally` loaded without showing it. The first demo defines `categories`, `names`, `assignments`, `read` and `rows`; carry those five definitions, without the first demo's printing, into the second and third demos' hidden setup. The demos read `categories.json` and `sample.json`.

---

## From notes to categories

Open coding left a note on every failing trace, 23 in the end, each in its reader's own words. Axial coding turns them into categories: notes that describe the same kind of failure go together, and each group gets a name that says what you'd see in a trace.

A few rules kept the grouping honest:

- **One category per trace, by its first failure.** A run with two problems is counted where it first went wrong, as the notes already are.
- **A model may draft, a person decides.** Husain and Shankar note that an LLM can help with this step. Here, Claude drafted eleven groups from the notes, and Simar, as the domain expert, made the calls that shaped them.
- **Grouping is a decision about fixes.** Two of Simar's calls show what that means:
  - He **merged** "reported a lost write as done without checking" with "checked, saw the write hadn't landed, and explained it away" into one category, *trusts the tool's "ok" over the evidence*, treating them as one underlying problem. (The run behind the second description, a13/1, turned out on a full reading to have reported the discrepancy rather than explained it away, and Simar changed it to a pass, so in this sample the category holds the two a14 runs. The second behaviour still belongs to it: the pilot's p08 runs explained a lost write away in exactly that way.)
  - He **split** two runs that both gave advice that didn't work: one missed what the user needed (q07), the other contradicted a document it had just read (q19). Different causes, different fixes, so different categories.

---

## Applied sandbox exercise
*(graded — count a set of failure categories by runs, by tasks, and as a share of what was read)*

**Task shown to learner:**

Write `tally(assignments, read)`. `assignments` maps the trial id of every trace that failed to its category; `read` lists the trial id of every trace that was read, failed or not. A trial id looks like `"baseline-a/a14/3"`, and its task is the middle part, `a14`.

Return one dict per category, with exactly these keys:

- `"category"`: the category
- `"runs"`: how many traces it was assigned to
- `"tasks"`: how many different tasks those traces came from
- `"share"`: its runs as a fraction of every trace read, rounded to 3 decimal places

Order the dicts by most runs first, then by most tasks, then by category name, so the order never depends on the order the traces arrived in. Raise `ValueError` if `assignments` has a trace that isn't in `read`. Don't change the inputs.

**Starter code:**
```python
from collections import defaultdict


def tally(assignments: dict[str, str], read: list[str]) -> list[dict]:
    """Count each failure category by runs and by tasks, and its share of everything read.

    assignments: trial id -> category, for every trace that failed.
    read: every trial id that was read, failed or not.
    Returns one dict per category: {"category", "runs", "tasks", "share"}, most runs first, then most tasks,
    then by name. A trial id looks like "baseline-a/a14/3": the task is the middle part.
    """
    # your code here


read = ["baseline-a/a14/3", "baseline-a/a14/4", "baseline-a/a13/1", "baseline-a/q30/1", "baseline-a/a01/0"]
print(tally({"baseline-a/a14/3": "trusts_tool_ok", "baseline-a/a14/4": "trusts_tool_ok",
             "baseline-a/a13/1": "trusts_tool_ok", "baseline-a/q30/1": "never_stops"}, read))
```

**Hidden tests:**
```python
def tid(task, trial):
    return f"baseline-a/{task}/{trial}"


read = [tid("a14", 3), tid("a14", 4), tid("a13", 1), tid("q30", 1), tid("q30", 3), tid("a12", 3),
        tid("q43", 1), tid("a01", 0), tid("a02", 0), tid("q16", 0)]
assignments = {tid("a14", 3): "trusts_tool_ok", tid("a14", 4): "trusts_tool_ok", tid("a13", 1): "trusts_tool_ok",
               tid("q30", 1): "never_stops", tid("q30", 3): "never_stops",
               tid("a12", 3): "planted_instruction", tid("q43", 1): "wrong_citation"}
before = dict(assignments), list(read)
rows = tally(assignments, read)
assert isinstance(rows, list), "tally should return a list of dicts, one per category"
assert (assignments, read) == before, "tally shouldn't change its inputs"
assert [row["category"] for row in rows] == ["trusts_tool_ok", "never_stops", "planted_instruction", "wrong_citation"], \
    f"most runs first, then most tasks, then by name: got {[row['category'] for row in rows]}"
first = rows[0]
assert first["runs"] == 3, f"trusts_tool_ok has 3 failing runs: got {first['runs']}"
assert first["tasks"] == 2, \
    f"two of its runs are the same task (a14), so it spans 2 tasks, not 3: got {first['tasks']}"
assert rows[1]["tasks"] == 1, "never_stops is two runs of one task (q30)"
assert first["share"] == 0.3, \
    f"share is runs out of every trace read (3 of 10), not out of the failures: got {first['share']}"
assert set(first) == {"category", "runs", "tasks", "share"}, f"each row has exactly the four keys: got {sorted(first)}"

tied = tally({tid("b", 0): "zeta", tid("a", 0): "alpha", tid("c", 0): "mid", tid("c", 1): "mid"},
             [tid("b", 0), tid("a", 0), tid("c", 0), tid("c", 1)])
assert [row["category"] for row in tied] == ["mid", "alpha", "zeta"], \
    "break ties by name, so the order doesn't depend on the order the traces came in"
spread = tally({tid("x", 0): "two_tasks", tid("y", 0): "two_tasks", tid("z", 0): "one_task", tid("z", 1): "one_task"},
               [tid("x", 0), tid("y", 0), tid("z", 0), tid("z", 1)])
assert [row["category"] for row in spread] == ["two_tasks", "one_task"], \
    "with equal runs, the category spread over more tasks comes first"
assert tally({}, read) == [], "nothing failed: no rows"
third = tally({tid("q", 0): "c"}, [tid("q", 0), tid("q", 1), tid("q", 2)])
assert third[0]["share"] == 0.333, f"round the share to 3 decimal places: got {third[0]['share']}"

try:
    tally({tid("zz", 9): "never_stops"}, read)
except ValueError:
    pass
else:
    raise AssertionError("a category for a trace that wasn't read should raise ValueError")
```

**Hint (shown on request):** Two `defaultdict`s do the counting: one of ints for runs, one of sets for tasks, so a task seen twice counts once. Divide by `len(read)`, not by the number of failures: a share of what was read is what tells you how common a failure is. `sorted` with a key tuple like `(-runs, -tasks, name)` gives all three orderings at once.

**Reference solution:**
```python
from collections import defaultdict


def tally(assignments: dict[str, str], read: list[str]) -> list[dict]:
    """Count each failure category by runs and by tasks, and its share of everything read.

    assignments: trial id -> category, for every trace that failed.
    read: every trial id that was read, failed or not.
    Returns one dict per category: {"category", "runs", "tasks", "share"}, most runs first, then most tasks,
    then by name. A trial id looks like "baseline-a/a14/3": the task is the middle part.
    """
    unread = set(assignments) - set(read)
    if unread:
        raise ValueError(f"categories given for traces that weren't read: {sorted(unread)}")
    runs, tasks = defaultdict(int), defaultdict(set)
    for trial_id, category in assignments.items():
        runs[category] += 1
        tasks[category].add(trial_id.split("/")[1])
    rows = [{"category": category, "runs": runs[category], "tasks": len(tasks[category]),
             "share": round(runs[category] / len(read), 3)} for category in runs]
    return sorted(rows, key=lambda row: (-row["runs"], -row["tasks"], row["category"]))


read = ["baseline-a/a14/3", "baseline-a/a14/4", "baseline-a/a13/1", "baseline-a/q30/1", "baseline-a/a01/0"]
print(tally({"baseline-a/a14/3": "trusts_tool_ok", "baseline-a/a14/4": "trusts_tool_ok",
             "baseline-a/a13/1": "trusts_tool_ok", "baseline-a/q30/1": "never_stops"}, read))
```
```
[{'category': 'trusts_tool_ok', 'runs': 3, 'tasks': 2, 'share': 0.6}, {'category': 'never_stops', 'runs': 1, 'tasks': 1, 'share': 0.2}]
```

**Explanation:** Counting tasks with a set is the point of the exercise. Two runs of a14 failing the same way are one problem seen twice, so a category's task count says how widespread it is, while its run count says how often it happened. The share's denominator is everything read, because "4 of the 24 failures" says nothing about how often the agent fails that way, and "4 of 100 traces" does. The three-part sort key makes the order deterministic: Python's sort is stable, so sorting by runs alone would keep tied categories in whatever order they arrived.

---

## The baseline's categories

Here's the reading, counted:

```python
categories = load_reading("categories")["categories"]
names = {c["key"]: c["name"] for c in categories}
assignments = {trial_id: c["key"] for c in categories for trial_id in c["trials"]}
read = [entry["trial_id"] for entry in load_reading("sample")["entries"]]

rows = tally(assignments, read)
print(f"{len(assignments)} of {len(read)} traces failed\n")
print(f"{'runs':>4} {'tasks':>5} {'share':>6}  category")
for row in rows:
    print(f"{row['runs']:>4} {row['tasks']:>5} {row['share']:>6.0%}  {names[row['category']]}")
```
```
23 of 100 traces failed

runs tasks  share  category
   4     4     4%  Cites a source that doesn't say it
   4     3     4%  Follows the planted instruction
   3     3     3%  Asks the user for what it could find itself
   3     2     3%  Never stops searching
   2     2     2%  A "list everything" answer that's incomplete
   2     1     2%  Trusts the tool's "ok" over the evidence
   1     1     1%  Acts on an ambiguous request without asking
   1     1     1%  Contradicts its own sources
   1     1     1%  Misses the user's real need
   1     1     1%  Repeats the question's assumption as fact
   1     1     1%  Trusts a broken tool result
```
*(runs live, shows output — read-only demo snippet, not graded; `tally` is the exercise's reference version, loaded for you)*

No single failure dominates. The two most common, wrong citations and following the planted instruction, are each 4 of the 100 traces, and the runs-against-tasks columns show the difference between them: the citation failures came from four different tasks, while the planted instruction came from three, with one task failing twice.

---

## How sure can we be?

With counts this small, the honest question is how much they'd move if a different 100 traces had been read. [Module 6 answered that kind of question](→ Module 6, the why agents fail lesson, the same question run twice concept, how sure can we be of these numbers?) by resampling whole questions, because runs of the same question rise and fall together. Here the unit is the task, for the same reason, so the demo resamples whole tasks, each with its sampled traces:

```python
import random
from collections import defaultdict


def task_bootstrap(read: list[str], assignments: dict[str, str], category: str,
                   repeats: int = 2000, seed: int = 0) -> tuple[float, float]:
    """A 95% interval for a category's share of the traces read, resampling whole tasks."""
    by_task = defaultdict(list)
    for trial_id in read:
        by_task[trial_id.split("/")[1]].append(assignments.get(trial_id) == category)
    tasks = list(by_task.values())
    rng = random.Random(seed)
    shares = []
    for _ in range(repeats):
        picked = rng.choices(tasks, k=len(tasks))
        shares.append(sum(map(sum, picked)) / sum(map(len, picked)))
    shares.sort()
    return shares[int(0.025 * repeats)], shares[int(0.975 * repeats) - 1]


for row in rows[:5]:
    low, high = task_bootstrap(read, assignments, row["category"])
    print(f"{names[row['category']]:<46} {row['share']:>4.0%}  95% interval {low:.0%} to {high:.0%}")
```
```
Cites a source that doesn't say it               4%  95% interval 1% to 8%
Follows the planted instruction                  4%  95% interval 0% to 9%
Asks the user for what it could find itself      3%  95% interval 0% to 7%
Never stops searching                            3%  95% interval 0% to 8%
A "list everything" answer that's incomplete     2%  95% interval 0% to 5%
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every interval starts at or near zero and reaches 5 to 9%, and they all overlap. So 100 traces don't say which of these five is the most common. What they do say is that each of them exists, appears in a few percent of runs, and isn't a one-off. That's enough to decide what to build next: each category becomes tasks and checks in the module's suite, and running those many times is how their rates get measured properly.

---

## Against Module 6's map

Finally, the comparison this lesson promised: each category against the row of Module 6's map it's closest to.

```python
from collections import Counter

fits = Counter()
for c in categories:
    verdict = c["fit_with_module6_map"].split(":")[0].split(",")[0].split(" (")[0]
    fits[verdict] += 1
    print(f"{verdict:<7} {c['name']:<46} -> {c['module6_map_row'] or '(no row on the map)'}")
print(f"\n{dict(fits)}")
```
```
fits    Follows the planted instruction                -> Acting on instructions in untrusted text
partly  Cites a source that doesn't say it             -> Claims the sources don't support
fits    Trusts the tool's "ok" over the evidence       -> Actions that fail silently, or false reports
new     Asks the user for what it could find itself    -> (no row on the map)
fits    Never stops searching                          -> Never stopping
partly  A "list everything" answer that's incomplete   -> Handling only part of a request
new     Misses the user's real need                    -> (no row on the map)
fits    Contradicts its own sources                    -> Claims the sources don't support
fits    Acts on an ambiguous request without asking    -> Pressing on when unsure
partly  Trusts a broken tool result                    -> A tool or service failing
fits    Repeats the question's assumption as fact      -> Giving in to the user

{'fits': 6, 'partly': 3, 'new': 2}
```
*(runs live, shows output — read-only demo snippet, not graded; the fit for each category was judged when the categories were made)*

Six of the eleven fit a row on the map, so for those the map already says where the fix lives. Three fit only partly. A citation that points to the wrong place while the claim itself is right isn't quite "claims the sources don't support". And a record with every field empty isn't the map's "tool failing", because nothing errored. Two have no row at all:

- **Asking the user for what the agent could find itself** is the opposite of the map's "pressing on when unsure". The map warns against guessing instead of asking; this agent sometimes asked instead of looking.
- **Missing the user's real need** isn't on the map either: the agent answered the words of the request, not the problem behind it.

That's the case for reading before using a map. The map was right about most of what went wrong, but only the reading found the two failures it doesn't name, and those are the ones nobody would have written a check for.

---

## Quiz cards

> **Q1.** Simar merged "reported a lost write without checking" with "checked and explained the difference away". What was the merge a decision about?
> - Whether they share a cause and a fix ✅
> - Which of the two failures happened more often
> - Whether the two traces came from the same task
> - Which reader had written the two notes
>
> *Explanation: A category exists to point at a fix. Merging says both failures come from trusting the tool's "ok" over what the agent could see; splitting q07 from q19 said the opposite, that two kinds of bad advice needed different fixes.*

> **Q2.** A category has 3 failing runs from 2 tasks. What does the task count add?
> - How widespread it is: one task failed twice ✅
> - How severe each failure is, compared with other categories
> - How many readers agreed that the runs had failed
> - How many times each task was run during the baseline
>
> *Explanation: Runs say how often a failure happened; tasks say how many different situations it happened in. Two runs of the same task failing the same way are one problem seen twice, and fixing it may fix both.*

> **Q3.** Why is a category's share computed out of every trace read, not out of the failures?
> - It says how often the agent fails that way ✅
> - It makes the shares of all categories add up to 100%
> - It keeps the shares small enough to compare easily
> - It's the only denominator the sample file provides
>
> *Explanation: "4 of the 24 failures" describes the mix of failures, which changes whenever another category grows or shrinks. "4 of 100 traces" is a rate: how often a run of this agent goes wrong in this particular way.*

> **Q4.** Every one of the top five categories has an interval from about 0% to about 8%. What can 100 traces tell you?
> - Each is real and a few percent, not which is commonest ✅
> - The categories are all equally common, at exactly 4% each
> - None of the categories can be trusted with so few traces
> - The commonest category is the one listed first in the table
>
> *Explanation: The intervals overlap almost completely, so the order in the table is not a ranking. But each category clearly exists and isn't a fluke. Measuring the rates properly is the job of the suite, which runs tasks built for each category many times.*

> **Q5.** Two categories have no row on Module 6's failure map. What does that show?
> - Reading finds failures a general list doesn't name ✅
> - Module 6's map is wrong and should be replaced
> - These two failures are too rare to matter for the agent
> - The readers misread the traces those two came from
>
> *Explanation: The map fit most of what went wrong, and it still tells you where those fixes live. But asking instead of looking, and missing the user's real need, aren't on it, so a routine that only sorted runs into the map would have missed them.*
