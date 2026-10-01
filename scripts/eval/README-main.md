# Module 7 main runs, phase 1: the baseline

The registry agent (Qwen3.5-4B, thinking on, the pilot's pinned revision) on the full task pool, traced as it
runs with the code Lesson 2 teaches. Two batches with identical settings and different seeds, 5 trials per task
each. Lesson 3 reads these traces; later lessons grade them. Content decisions (tasks, prompt, checks) are made
in the content chat; this README is only about running it.

Later phases (a changed prompt, FP8 serving, Module 6's layers, the compaction and memory suites, the
single-call sets and the judges) come with later lessons.

## What changed since the pilot

| File | Change |
|---|---|
| `registry_world.py` | `set_model`'s description now says the record changes immediately (the pilot's wording supplied the excuse for p08). The pilot's tool definitions are kept as `TOOL_SPECS_PILOT`. `fresh_world` passes a task's reader groups to search. |
| `harness.py` | `Task` gains `history`, `groups`, `split`, `expect` and `reference`, all optional; `checks` is optional. `run_trial` starts from a task's earlier turns and takes an optional `wrap` for tracing. The loop is unchanged. |
| `eval_client.py` | The simulated user's instructions add one rule: answer what you're asked plainly, with exact names (one pilot conversation never named its agent). |
| `grading.py` | Two more check kinds, `must_not_call` and `answer_excludes`. The pilot's grades are unchanged. |
| `replay_check.py` | Works for any run: it reads the tasks file from the run, and checks the run's prompt and tools against the known sets. |
| `tracing.py` (new) | Lesson 2's tracer and instrumentation, byte-identical to the lesson's `TRACER` and `INSTRUMENT` (add a check). |
| `build_main_tasks.py` (new) | Builds `tasks/main.json`: Module 5's 57 questions (59 tasks, as each restricted question becomes a denied and an allowed reader) and 37 registry tasks and conversations, 96 in all. |
| `main_selftest.py` (new) | Every registry task's hand-written reference run passes its checks through the real world; 10 wrong runs fail; every question's sources are readable by its reader (or, for denied readers, not). |
| `run_main.py`, `main_report.py` (new) | The runner and its report. |

All of the pilot's 90 recordings still replay exactly with the changed code, and Lesson 2's replay demos and
sandbox give the same output.

## 1. Before the GPU

```bash
pip install jinja2 pydantic numpy networkx
ln -s "$PWD/public/data/rag" /data/rag
python scripts/eval/build_course_libs.py --check
python scripts/eval/build_main_tasks.py --check
python scripts/eval/main_selftest.py                        # "all checks pass"
python scripts/eval/grader_selftest.py                      # every line "ok"
python scripts/eval/replay_check.py public/data/eval/pilot/4b-think.json public/data/eval/pilot/4b-nothink.json public/data/eval/pilot/9b-think.json
python scripts/eval/run_main.py --dry-run --batch all --trials 2
python scripts/eval/replay_check.py public/data/eval/main/baseline-a.dry-run.json public/data/eval/main/baseline-b.dry-run.json
```

The last check replays traced runs without tracing: it passing means the tracing changes nothing the model
sees. Don't commit the `*.dry-run.json` files.

## 2. On Colab

The same two servers as the pilot (see `README-eval.md`): the simulated user on port 8001, and the 4B on
port 8000 at revision `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`, with no reasoning or tool-call parser. Then:

```bash
python scripts/eval/run_main.py --batch a
python scripts/eval/run_main.py --batch b
```

Each batch is 96 tasks x 5 trials = 480 trials, with 48 running at once. From the pilot's cost (about 0.8
GPU-seconds per trial) expect roughly 15-30 GPU-minutes for both batches, plus loading the models. Each file
should be around 10 MB.

## 3. After the runs

```bash
python scripts/eval/replay_check.py public/data/eval/main/baseline-a.json public/data/eval/main/baseline-b.json
python scripts/eval/main_report.py public/data/eval/main/baseline-a.json public/data/eval/main/baseline-b.json
```

Commit `public/data/eval/main/baseline-a.json`, `baseline-b.json`, `scripts/eval/` and `tasks/main.json`, and
paste back to the content chat:

- the replay check's output (all trials must replay exactly)
- the whole report
- the vLLM version, the GPU, and any setting or flag you had to change

Notes:

- A call to a tool that doesn't exist comes back to the model as an error result, as in the pilot. It has a
  check span in the trace but no tool span, and isn't in the world's tool log.
- The report's "never passed" list is a first look for broken tasks, as Anthropic's guide suggests (a task no
  run passes is more often broken than hard). The content chat reads those runs before trusting it.
