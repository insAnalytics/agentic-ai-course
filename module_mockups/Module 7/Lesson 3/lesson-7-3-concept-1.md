# Module 7, Lesson 3 — Concept 1: From a fixed map to this agent's own failures

> **Note for the site build:**
> - Mount `public/data/eval/reading/` at `/data/eval/reading` in Pyodide. This lesson's demos read `sample.json`, `labels-simar.json`, `labels-simar-v2.json`, `labels-claude.json` and `categories.json` (all small) and, in later concepts, `traces.json` (2 MB).
> - Add the setup block below to `evalData.ts` as `LOAD_READING`, byte-identical; every demo in this lesson starts from it. The first demo reads `sample.json`, the second `labels-simar.json`.

---

## The map you already have

[Module 6 gave you a routine](→ Module 6, the why agents fail lesson, the where agents fail, and where each failure is handled concept, using the map on a failed run): read failed runs, find the first step that went wrong, name it from a map of thirteen common failures, count the names, and fix the most common. The map is drawn from research on how agents fail in general, such as τ-bench's analysis and the AgentErrorTaxonomy, and each row points to the part of the course that handles it.

That map is good at what it was built for: once you know what a failure is, it tells you where the fix lives. What it can't tell you is which failures *this* agent actually has. Sorting runs into a map means looking for the failures you already expected, and a failure that isn't on the map gets squeezed into the nearest row or missed. So this lesson runs the routine the other way round: read the runs first, write down what went wrong in plain words, and let the categories come out of the notes. Comparing those categories with Module 6's map comes at the end, and the differences are the finding.

---

## Notes first, categories after

Hamel Husain and Shreya Shankar, who teach a widely used course on evaluating LLM applications, call error analysis the most important activity in evals, because it's how you decide which evals to write. Their method has three steps, adapted from qualitative research:

- **Collect a dataset** of representative traces.
- **Open coding.** A person reads each trace and writes a free-form note about what went wrong, like keeping a journal. They recommend starting with the first failure in each trace, because an early mistake causes later ones, and they say this should be done by a domain expert: ideally one person, whom they call a "benevolent dictator", who has the final say on what counts as good.
- **Axial coding.** Group the notes into categories, a failure taxonomy of your own. They note that an LLM can help with this step.

You keep reading until new traces stop teaching you anything new. Qualitative researchers call that point **theoretical saturation**. Husain's evals guidance gives about 100 traces as a rough target for reaching it.

The method isn't just practitioners' advice. MAST, a taxonomy of how multi-agent systems fail (Cemri et al., NeurIPS 2025), was built exactly this way: researchers read about 150 traces from several agent frameworks, wrote open codes, and grouped them using grounded theory, the research method open and axial coding come from. They then checked that the categories were usable by having three people label the same traces independently, and found high agreement (Cohen's κ of 0.88). The result was 14 failure modes in 3 groups, drawn from what the agents actually did rather than from a list written in advance.

---

## The sample

The registry agent's baseline produced 960 runs: 96 tasks, run five times in each of two batches. Reading all of them would take a full working week. The reading sample is 100, drawn by a script with a fixed seed so it can be checked:

- **From batch a only.** Batch b is left unread, so the categories can later be checked against runs nobody looked at while building them.
- **Dev tasks only.** The held-out tasks stay unread, so the module's final report has tasks no decision was tuned on.
- **Every dev task at least once.** Within each kind of task, the script takes one trial of every task before it takes a second trial of any, so no task is missed and none dominates.
- **Without looking at any grade.** Passes are read as well as failures.

That last point matters more than it looks. It's tempting to read only the runs that errored or failed a check, but a trace's status only becomes `ERROR` when a step fails, and a check only catches what it was written to catch. [The p08 run in Lesson 2](→ Module 7, the tracing an agent run lesson, the reading a trace concept, two runs, summarized) had a clean trace and passed its code check, and it still told the user something false. Sampling by status or grade would have skipped it.

The setup block loads the reading files. The first demo shows how the 100 were spread:

```python
import json
from pathlib import Path

READING = Path("/data/eval/reading")


def load_reading(name: str) -> dict:
    """One of the reading files: "sample", "labels-simar", "labels-simar-v2", "labels-claude", "categories"."""
    return json.loads((READING / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo in this lesson)*

```python
from collections import Counter

sample = load_reading("sample")
entries = sample["entries"]
print(f"{len(entries)} traces, all from {sample['run']}")
for group in ("question", "registry", "conversation"):
    chosen = [e for e in entries if e["group"] == group]
    tasks = Counter(e["task_id"] for e in chosen)
    print(f"  {group:<12} {len(chosen):>3} traces, {len(tasks)} tasks, at most {max(tasks.values())} traces of any one task")

readers = Counter(tuple(e["readers"]) for e in entries)
print("\nread by Simar only:", readers[("simar",)], "| Claude only:", readers[("claude",)],
      "| both:", readers[("simar", "claude")])
```
```
100 traces, all from public/data/eval/main/baseline-a.json
  question      50 traces, 48 tasks, at most 2 traces of any one task
  registry      35 traces, 23 tasks, at most 2 traces of any one task
  conversation  15 traces, 6 tasks, at most 3 traces of any one task

read by Simar only: 25 | Claude only: 60 | both: 15
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every one of the 77 dev tasks is in the sample. Two readers shared it:

- **Simar**, the course's author and the domain expert for this agent, read 40, as the benevolent dictator.
- **Claude** read the other 60, and also 15 of Simar's, labelled before any of Simar's notes existed, so the two readers can be compared fairly. The lesson labels Claude's notes as a model's, not a person's.

---

## What reading costs

Reading isn't free, and how long it takes is worth knowing before you plan it. The labelling page timed each trace while it was on screen:

```python
import statistics

labels = load_reading("labels-simar")["labels"]
seconds = [label["seconds"] for label in labels]
print(f"Simar read {len(labels)} traces in {sum(seconds) / 60:.0f} minutes")
print(f"median {statistics.median(seconds):.0f} seconds a trace; the longest took {max(seconds) / 60:.0f} minutes")
slowest = sorted(labels, key=lambda label: label["seconds"], reverse=True)[:3]
for label in slowest:
    print(f"  {label['trial_id'].split('/')[1]:<14} {label['seconds'] / 60:>4.1f} min  {label['verdict']}")
for verdict in ("pass", "fail"):
    times = [label["seconds"] for label in labels if label["verdict"] == verdict]
    print(f"{verdict}: {len(times)} traces, median {statistics.median(times):.0f} seconds")
```
```
Simar read 40 traces in 110 minutes
median 55 seconds a trace; the longest took 23 minutes
  a13            23.1 min  fail
  q07            11.2 min  fail
  a11            10.4 min  fail
pass: 31 traces, median 47 seconds
fail: 9 traces, median 279 seconds
```
*(runs live, shows output — read-only demo snippet, not graded; times from Simar's first reading, before the standard described in the next concepts)*

Most runs that worked took under a minute to confirm. The ones that failed took about five times as long, because finding the first failure means following the run step by step, and the hardest one, a write that silently didn't land and an agent that explained the evidence away, took 23 minutes. Two hours for 40 traces makes a sample of 100 about a day's work for one person. That's the cost of the first round; once the categories exist, later rounds only need to read enough new runs to see whether anything new has appeared.

---

## Quiz cards

> **Q1.** Why does this lesson read the runs before using Module 6's failure map, rather than sorting runs straight into it?
> - A map can only find the failures it already lists ✅
> - Module 6's map is out of date for agents built after it was written
> - Sorting runs into a map is slower than writing notes from scratch
> - The map only covers single-agent systems, not the registry agent
>
> *Explanation: Sorting into a fixed list means looking for failures you already expected, and anything new gets forced into the nearest row. Reading first and comparing with the map afterwards keeps the map's value, telling you where a fix lives, without letting it decide what you see.*

> **Q2.** In open coding, what does the reader write for each trace?
> - A free note on the first thing that went wrong ✅
> - The name of the matching row from a failure map
> - A score from 1 to 10 for the overall run quality
> - A list of every step in the run that looked odd
>
> *Explanation: Open coding is note-taking, not classifying: plain words, specific enough that someone else could find the problem in the trace. Categories come afterwards, in axial coding, from all the notes together. Starting with the first failure keeps each note on the cause rather than its knock-on effects.*

> **Q3.** Why was the reading sample drawn without looking at any grade or error status?
> - Many failures raise no error and pass a weak check ✅
> - Grades weren't available until the reading was finished
> - Reading only failures would make the sample too small to use
> - Passing runs are where most of a run's cost tends to sit
>
> *Explanation: A trace's status only marks exceptions, and a check only catches what it was written to catch. The p08 runs had clean traces and passed their code check while misleading the user. Sampling by status or grade would have skipped them, so the sample was drawn blind to both.*

> **Q4.** When should you stop reading traces in error analysis?
> - When new traces stop showing kinds of failure you haven't seen ✅
> - As soon as you have found at least one failure of each kind on the map
> - When every task in the suite has been read at least five times
> - After the first 20 traces, since later ones rarely add anything
>
> *Explanation: That point is theoretical saturation, from the qualitative research the method comes from: more data stops producing new categories. About 100 traces is Husain's rough target, but the signal is the data running out of surprises, not a fixed count.*

> **Q5.** Why were batch b and the held-out tasks left unread?
> - To keep runs that no category or decision was built on ✅
> - Because reading all of them would cost too much GPU time
> - Because their traces were recorded in a different format
> - Because the simulated user behaved differently in them
>
> *Explanation: Categories built by reading a sample fit that sample by construction. Runs nobody read are the fair test of whether the categories hold up, and held-out tasks give the final report results no decision was tuned on.*
