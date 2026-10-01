# Module 7 runs, phase 2a: the first suite tasks and the pushback control

Two runs for Lesson 4 (building a task suite). Content decisions (the tasks, their checks, the control set's
design) are made in the content chat; this README is only about running them.

## What changed

| File | Change |
|---|---|
| `build_suite_tasks.py` (new) | Builds `tasks/suite-2a.json`: 29 tasks, one or more for each failure category Lesson 3 found, plus four multi-hop questions; 9 held out. Every task has a hand-written reference run. |
| `grading.py` | Two more check kinds: `cites_only_retrieved` (every source id the answer cites, in brackets or as a link target, was returned by a tool) and `max_tool_calls`. Earlier grades are unchanged. |
| `main_selftest.py` | Takes a task file (`tasks/suite-2a.json`), and has six wrong runs for the new tasks. |
| `run_main.py` | Takes `--tasks-file` and `--name`, so the same runner, agent and settings run the new tasks. |
| `scripts/generate-verification-runs.py` | A new condition, `pushback-control`: Module 6's pushback run with right and wrong swapped. Same questions (set U), prompt, model, sampling and 5 samples; the first reply is a constructed wrong one, and the user pushes back with the right value, or just asks "are you sure?". |

## 1. Before the GPU

```bash
python scripts/eval/build_course_libs.py --check
python scripts/eval/build_main_tasks.py --check
python scripts/eval/build_suite_tasks.py --check
python scripts/eval/main_selftest.py                          # "all checks pass"
python scripts/eval/main_selftest.py tasks/suite-2a.json      # "all checks pass"
python scripts/eval/grader_selftest.py
python scripts/eval/reading_code_grades.py --check
python scripts/eval/run_main.py --dry-run --batch a --trials 2 --tasks-file tasks/suite-2a.json --name suite-2a
python scripts/eval/replay_check.py public/data/eval/main/suite-2a-a.dry-run.json
python scripts/generate-verification-runs.py --condition pushback-control --dry-run
```

Don't commit any `*.dry-run.json` files.

## 2. On Colab

**The suite tasks.** The same two servers as the baseline (`README-main.md`), the same environment changes
(`VLLM_USE_FLASHINFER_SAMPLER=0`, `torchaudio` removed, servers started one after the other), then:

```bash
python scripts/eval/run_main.py --batch a --tasks-file tasks/suite-2a.json --name suite-2a
```

29 tasks x 5 trials = 145 trials, a few GPU-minutes. Writes `public/data/eval/main/suite-2a-a.json`.

**The pushback control.** Stop the servers first: this uses Module 6's offline vLLM script, exactly as Module 6's
`pushback` run did, with the model's commit pinned and the same length limit:

```bash
python scripts/generate-verification-runs.py --condition pushback-control \
  --revision 851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a --dtype bfloat16 --max-model-len 8192
```

84 questions x 2 styles x 5 samples = 840 replies, a couple of GPU-minutes. Writes
`public/data/reliability/runs/pushback-control.json`.

## 3. After the runs

```bash
python scripts/eval/replay_check.py public/data/eval/main/suite-2a-a.json
python scripts/eval/main_report.py public/data/eval/main/suite-2a-a.json
```

`main_report.py` reads the tasks file recorded in the run, so it grades the suite tasks with their own checks.
Commit both run files and `scripts/`, and paste back:

- the replay check (145 of 145) and the report
- the pushback control's summary lines (the script prints them at the end)
- the vLLM version, the GPU, and every environment change, as before
