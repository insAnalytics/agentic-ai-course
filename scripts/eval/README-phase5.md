# Module 7 runs, phase 5: Lesson 9's ablations

Three variants of the registry agent, each run on every task in the main pool and the suite, with the same 5 trials
per task as the baseline's batch a and the suite's first run, which they're compared with. Content decisions (what
each variant changes, and how Module 6's layers were ported) are in `ablations.py`'s docstring; this README is only
about running it.

| Variant | What changes |
|---|---|
| `layers` | Module 6's eight layered checks run in the loop; the support judge calls the simulated user's model on :8001 |
| `compaction` | once a run passes 3 rounds, older rounds are replaced with a summary written by the agent's model |
| `no-labels` | search results reach the model without their date and type labels |

## 1. Before the GPU

```bash
ln -s "$PWD/public/data/rag" /data/rag
python scripts/eval/main_selftest.py                       # "all checks pass" (run_trial gained checks_factory)
python scripts/eval/ablation_selftest.py                   # "12 cases checked", "all checks pass"
python scripts/eval/replay_check.py public/data/eval/main/suite-2a-a.json   # 145 of 145: the change replays the old runs
for v in layers compaction no-labels; do
  python scripts/eval/run_main.py --dry-run --batch a --trials 2 --variant $v --name $v
  python scripts/eval/replay_check.py public/data/eval/main/$v-a.dry-run.json
done
```

Don't commit dry-run files.

## 2. On Colab

The same two servers as the baseline (`README-main.md`): the 4B on :8000 and Gemma 4 26B-A4B on :8001, the same
revisions, settings and environment changes. Then, for each variant:

```bash
for v in layers compaction no-labels; do
  python scripts/eval/run_main.py --batch a --variant $v --name $v
  python scripts/eval/run_main.py --batch a --variant $v --name $v-suite --tasks-file tasks/suite-2a.json
done
```

Six run files, 1,875 trials, in `public/data/eval/main/`. Then stop both servers, start Gemma 4 31B on :8002 exactly as
in phase 4 (same revision, bf16), and judge the six runs with the revised rubrics:

```bash
python scripts/eval/run_judges.py --judge gemma --rubrics 2 \
  --runs layers-a,layers-suite-a,compaction-a,compaction-suite-a,no-labels-a,no-labels-suite-a
```

## 3. After the runs

```bash
for f in layers-a layers-suite-a compaction-a compaction-suite-a no-labels-a no-labels-suite-a; do
  python scripts/eval/replay_check.py public/data/eval/main/$f.json
  python scripts/eval/main_report.py public/data/eval/main/$f.json | head -4
done
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma-v2-<the runs>.json
```

Commit the run files, the judge file and `scripts/`, and paste back each run's line, the replay checks, the first
lines of each report, the judge run's line, and the environment. Don't compare variants with the baseline: that's
the lesson's job, after the runs are read.
