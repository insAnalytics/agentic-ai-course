# Module 7 pilot: the registry agent, live

The first live runs of the registry agent (Module 6 Lesson 10's agent, on Module 5's data): 10 tasks x 3
trials under three conditions. The pilot decides which model is the agent for Module 7's main runs, and
shows what its failures look like before the suite is built. Content decisions (tasks, prompt, checks) are
made in the content chat; this README is only about running it.

## What's here

| File | What it is |
|---|---|
| `build_course_libs.py` | Rebuilds `course/` (Module 4's and 5's libraries, Module 6's loop, the fake client's blocks) from the lesson pages. `--check` fails if they've drifted. |
| `build_pilot_traces.py` | Builds the trace viewer's data, `public/data/eval/pilot/traces/<setup>.json`, by running Lesson 2's own `TRACER` and `TRACE_FROM_RECORDING` (from `evalData.ts`) on every pilot trial with content captured; span ids are made deterministic. `--check` fails if the files have drifted. |
| `registry_world.py` | The tool world, fresh per trial: Lesson 10's five tools plus Module 5's SQL tool. |
| `eval_client.py` | The client interface: live model client, replay client, simulated user; the Qwen3.5 chat format and parser. |
| `backends.py` | vLLM over HTTP, and stand-ins for dry runs. |
| `harness.py` | System prompt v1, tasks, and `run_trial` (Module 6's `run_checked_agent`, unchanged). |
| `tasks/pilot.json` | The 10 pilot tasks. |
| `grading.py` | The provisional code grader. |
| `grader_selftest.py` | Reference trajectories that must pass and wrong ones that must fail, through the real parser, loop and world. |
| `run_pilot.py` | Runs a condition and records everything. |
| `replay_check.py` | Replays every recorded trial and confirms it reproduces exactly. |
| `pilot_report.py` | The summary and the pre-set decision rule. |
| `templates/qwen3.5-chat_template.jinja` | Qwen3.5's chat template as shipped at `Qwen/Qwen3.5-4B@851bf6e` (git blob `a585dec`), for dry runs. Live runs load each model's own template at its pinned revision and check our rendering against transformers'. |

## 1. Before the GPU: checks that must pass

```bash
pip install jinja2 pydantic numpy networkx
ln -s "$PWD/public/data/rag" /data/rag          # Module 5's lib reads its data where the browser mounts it
python scripts/eval/build_course_libs.py --check
python scripts/eval/grader_selftest.py          # every "ok", exit 0
python scripts/eval/run_pilot.py --dry-run --condition all
python scripts/eval/replay_check.py public/data/eval/pilot/*.dry-run.json   # 30 of 30, three times
```

Don't commit the `*.dry-run.json` files.

## 2. On Colab (the G4 GPU, one RTX PRO 6000, 96 GB)

Install vLLM (the Qwen3.5 model card asks for a recent build) and transformers, then start two servers on
the one GPU. The agent's server gets **no** `--reasoning-parser` or `--tool-call-parser`: the script renders
the chat template itself, sends token ids, and parses the raw text, so it can record exactly what the model
wrote.

```bash
# the simulated user, port 8001; FP8 on load keeps the 26B MoE at about 27 GB
vllm serve google/gemma-4-26B-A4B-it --port 8001 --quantization fp8 \
  --max-model-len 16384 --gpu-memory-utilization 0.45 &

# the agent, port 8000: the 4B at the revision Module 6 loaded
vllm serve Qwen/Qwen3.5-4B --revision 851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a --port 8000 \
  --max-model-len 32768 --gpu-memory-utilization 0.40 --language-model-only &
```

Then:

```bash
python scripts/eval/run_pilot.py --condition 4b-think
python scripts/eval/run_pilot.py --condition 4b-nothink
```

Stop the 4B server, start the 9B at Module 6's revision, and run the last condition:

```bash
vllm serve Qwen/Qwen3.5-9B --revision c202236235762e1c871ad0ccb60c8ee5ba337b9a --port 8000 \
  --max-model-len 32768 --gpu-memory-utilization 0.40 --language-model-only &
python scripts/eval/run_pilot.py --condition 9b-think
```

The script stops if our template rendering differs from transformers' for the loaded model. Don't pass
`--allow-template-mismatch` without telling the content chat.

## 3. Check on the day, and edit in `run_pilot.py` if they differ

The values actually used are saved in every run file, so the pages report whatever was used.

- **Qwen's sampling settings** (`SAMPLING`), from the Qwen3.5 model card's "Best Practices". Checked on
  2026-09-30: thinking on 1.0 / 0.95 / top-k 20 / min-p 0 / presence 1.5; thinking off 0.7 / 0.8 / 20 / 0 / 1.5.
- **Gemma 4's recommended sampling** (`USER_SAMPLING`) and **how to turn its thinking off** through the chat
  template (`USER_TEMPLATE_KWARGS`), from the Gemma 4 model card. If the server rejects the kwargs, remove
  them and note it in the summary.
- If a server flag above isn't supported by the installed vLLM, drop it and say which.

## 4. After the runs

```bash
python scripts/eval/replay_check.py public/data/eval/pilot/4b-think.json public/data/eval/pilot/4b-nothink.json public/data/eval/pilot/9b-think.json
python scripts/eval/pilot_report.py public/data/eval/pilot/4b-think.json public/data/eval/pilot/4b-nothink.json public/data/eval/pilot/9b-think.json
```

Commit the three run files and `scripts/eval/`, and paste back to the content chat:

- the replay check's output (it must be 30 of 30 for each condition)
- the whole report
- the vLLM version, the GPU, and any flag or setting you had to change

Expect a few GPU-minutes for all 90 trials.
