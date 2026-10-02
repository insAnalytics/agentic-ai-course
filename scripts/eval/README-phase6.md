# Module 7 runs, phase 6: Lesson 10's three changes

Three changes to the registry agent, each run on every task in the main pool and the suite with the same 5 trials
per task as the baseline's batch a and the suite's first run, which they're gated against. Content decisions (what
each change is) are in `harness.py` (`SYSTEM_V2`) and `ablations.py` (layers version 2); this README is only about
running it.

| Run | What changes | How |
|---|---|---|
| `fp8` | the agent's server quantizes the same pinned model to FP8 as it loads | `--quantization fp8` on the agent's vLLM server; `--quantization fp8` to `run_main.py` records it |
| `prompt-v2` | two added lines in the system prompt | `--system v2` |
| `layers-v2` | Module 6's layers with three fixes | `--variant layers-v2`; the support judge on :8001, as in phase 5 |

## 1. Before the GPU

```bash
ln -s "$PWD/public/data/rag" /data/rag
python scripts/eval/main_selftest.py          # "all checks pass"
python scripts/eval/ablation_selftest.py      # "19 cases checked", "all checks pass"
python scripts/eval/replay_check.py public/data/eval/main/layers-suite-a.json   # phase 5 still replays
python scripts/eval/run_main.py --dry-run --batch a --trials 2 --system v2 --name prompt-v2
python scripts/eval/run_main.py --dry-run --batch a --trials 2 --variant layers-v2 --name layers-v2
python scripts/eval/run_main.py --dry-run --batch a --trials 2 --quantization fp8 --name fp8
python scripts/eval/replay_check.py public/data/eval/main/{prompt-v2,layers-v2,fp8}-a.dry-run.json
```

Don't commit dry-run files.

## 2. On Colab

The same two servers as the baseline (`README-main.md`), the same revisions, settings and environment changes.

```bash
for spec in "--system v2 --name prompt-v2" "--variant layers-v2 --name layers-v2"; do
  python scripts/eval/run_main.py --batch a $spec
  python scripts/eval/run_main.py --batch a $spec-suite --tasks-file tasks/suite-2a.json
done
```

Then restart only the agent's server with `--quantization fp8` added and everything else unchanged, and confirm the
server still reports the same model id. If vLLM refuses FP8 for this model, stop and report the error rather than
switching to another checkpoint.

```bash
python scripts/eval/run_main.py --batch a --quantization fp8 --name fp8
python scripts/eval/run_main.py --batch a --quantization fp8 --name fp8-suite --tasks-file tasks/suite-2a.json
```

Then stop both servers, start Gemma 4 31B on :8002 as in phase 4, and judge the six runs:

```bash
python scripts/eval/run_judges.py --judge gemma --rubrics 2 \
  --runs prompt-v2-a,prompt-v2-suite-a,layers-v2-a,layers-v2-suite-a,fp8-a,fp8-suite-a
```

## 3. After the runs

```bash
for f in prompt-v2-a prompt-v2-suite-a layers-v2-a layers-v2-suite-a fp8-a fp8-suite-a; do
  python scripts/eval/replay_check.py public/data/eval/main/$f.json
done
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma-v2-<the runs>.json
```

Commit the six run files, the judge file and `scripts/`, and paste back each run's line, the replay checks, the
judge run's line, the FP8 server's startup line and the environment. Don't compare the runs with the baseline: that's
the lesson's job, after the runs are read.
