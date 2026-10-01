# Module 7, Lesson 3: the reading sample and the labelling page

Lesson 3 is error analysis: people reading the registry agent's runs and noting what went wrong. This folder's
`reading_sample.py` has already drawn the sample; Claude Code builds the page Simar reads it in. Content
decisions (the sample, the label fields, the guide text) are made in the content chat.

## The sample (already drawn)

`python scripts/eval/reading_sample.py --check` must pass. It wrote:

- `public/data/eval/reading/sample.json`: 100 trials from `baseline-a.json`, dev tasks only (50 questions, 35
  registry tasks, 15 conversations), every dev task at least once, chosen without looking at any grade. Each
  entry lists its readers. `order` gives each reader's traces in a shuffled order: 40 for `simar`, 75 for
  `claude` (its 60 plus 15 of Simar's, read independently so agreement can be measured).
- `public/data/eval/reading/traces.json` (2 MB): what the page shows for each of the 100 trials, keyed by trial
  id: the task (request, earlier turns, reader groups, injected faults, the simulated user's persona, and a
  reference to reveal on request), the messages with every reasoning block, tool call and result, the answers,
  the world's changes (registry fields that changed, and emails sent), and the trace.

## The labelling page

A static page, `scripts/eval/labeller/index.html`, run locally (`python -m http.server` from the repo root,
then open the page); it makes no network calls beyond loading those two files.

**Choosing a reader.** A selector for `simar` or `claude`; the page then steps through that reader's `order`,
with a progress count ("12 of 40") and previous/next buttons.

**What it shows for each trace, top to bottom:**

1. The task id and kind (for example `a14 · action and email, fault: the write is lost`), the injected faults
   if any, and the reader groups if not the default.
2. The conversation so far, if the task has earlier turns, then the request.
3. For conversations, the simulated user's persona, in a collapsed box labelled "What the simulated user was told".
4. The run, in order: each model turn's reasoning (collapsed by default, one click to expand; it's often long),
   its text, and its tool calls with their arguments; each tool result, with an `error` badge on results the
   loop marked as errors; each simulated-user reply.
5. The final answer.
6. What changed in the world: each registry field that changed (old → new), each email (to, body). If nothing
   changed, say so.
7. A "Show reference" button that reveals the task's reference answer and notes, and records that it was used.

**What it must not show:** the code grade, the batch, the trial number (show `a14`, not `baseline-a/a14/2`),
or the task's `expect.checks`. A reader who sees a grade reads to confirm it.

**The label for each trace:**

| Field | Values | Required |
|---|---|---|
| `verdict` | `pass`, `fail`, `unsure` | always |
| `first_failure` | free text: the first thing that went wrong | for `fail` and `unsure` |
| `fault` | `agent`, `task`, `simulated_user`, `environment`, `unclear` | for `fail` and `unsure` |
| `how` | free text: anything about how the agent got there, from its reasoning or its steps, including a pass that got there by luck or for the wrong reason | optional |
| `reference_viewed` | true/false, set by the page | automatic |
| `seconds` | time the trace was on screen, set by the page | automatic |

The page saves every change to `localStorage` as it goes, and has **Export** (downloads
`labels-<reader>.json`) and **Import** (to resume on another machine). The file:

```json
{"reader": "simar", "sample_version": 1,
 "labels": [{"trial_id": "baseline-a/a14/2", "verdict": "fail", "first_failure": "...", "fault": "agent",
             "how": "...", "reference_viewed": false, "seconds": 143}]}
```

Add `scripts/eval/check_labels.py` that validates a labels file against `sample.json` (every trial in the
reader's order labelled once, required fields present, values from the lists above) and prints counts.

**The guide**, shown above the first trace and behind a "How to read" link on every trace:

> Read each run as the person who asked would, and note the first thing that went wrong.
>
> - **Pass or fail?** Would the person who asked be satisfied, and is the world (the registry, the emails) as it
>   should be? A run that ends right but told the user something false fails. Read passes as carefully as
>   failures: a pass can hide a wrong step.
> - **The first failure.** Write down the earliest point where the run went wrong, in your own words, specific
>   enough that someone else could find it: "moved support_agent without asking which of support-team's three
>   agents was meant", not "bad action". Later problems usually follow from the first; one note per run is
>   enough.
> - **Don't sort yet.** Don't try to fit notes into categories while reading. Grouping comes afterwards, from
>   all the notes together.
> - **Whose fault?** Usually the agent's. It's the task's if the request was ambiguous or its expected outcome
>   was wrong; the simulated user's if it broke its instructions (invented facts, forgot to answer, started
>   acting as the assistant); the environment's if a tool or the world misbehaved in a way the task didn't
>   intend. Pick "unclear" rather than guess.
> - **How it got there.** If the reasoning shows why the agent did something, or that a pass was luck, say so
>   in "how". Reasoning is evidence, not proof: check it against what the agent actually did.
> - **The reference** is there if you need it, but form your own view first.

## One more small change (from the baseline report)

Add an `environment` field to the top level of `public/data/eval/main/baseline-a.json` and `baseline-b.json`,
recording the changes made on Colab, without touching any trial:

```json
"environment": {"vllm": "0.30.0", "env_vars": {"VLLM_USE_FLASHINFER_SAMPLER": "0"},
                "packages_removed": ["torchaudio"],
                "notes": "torchaudio (CUDA 12.8 build) broke vLLM's import with the CUDA 13.0 PyTorch; FlashInfer's sampler failed its GPU check on compute capability 12.0, so vLLM's PyTorch sampler was used; the two servers were started one after the other because starting both at once failed vLLM's memory profiling."}
```

Then rerun `replay_check.py` on both files (it must still be 480 of 480) and `reading_sample.py --check`, and
add the same field to `run_main.py`'s output (from command-line options or a small config) so future runs
record it themselves.
