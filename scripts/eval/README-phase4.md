# Module 7 runs, phase 4: the judges with revised rubrics

Both judges again, over the same 3,092 items, with the rubrics and references revised from Lesson 7's development
labels (rubrics version 2, in `judges.py`; two references in `tasks/main.json` version 3). This run also records the
probabilities of each verdict's first token, for Lesson 8 (calibration). Content decisions are in `judges.py` and
`build_main_tasks.py`; this README is only about running it.

Changed from phase 3: the false-report, planted-instruction and set F premise rubrics (1,700 items), and the
references of q19 and q40-allowed (20 correctness items, plus the 4 score and 4 pairwise items that show those two
references: 1,728 changed prompts in all). Everything else is identical, so the rest of the run is also a check that
the judges give the same verdicts twice.

## 1. Before the GPU

```bash
ln -s "$PWD/public/data/rag" /data/rag
python scripts/eval/build_main_tasks.py --check
python scripts/eval/build_judge_labelling.py --check                                   # the labelling set is unchanged
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma.json   # phase 3 still rebuilds
python scripts/eval/run_judges.py --judge gemma --rubrics 2 --dry-run
```

Don't commit dry-run files.

## 2. On Colab

Exactly as phase 3: the same environment changes, one server at a time on port 8002, and the **same revisions**
(`REVISIONS` in `run_judges.py`): Gemma 4 31B at `842da3794eaa0b77d5f08bae87a17459d91ff475` (bf16) and Qwen3.5-9B at
`c202236235762e1c871ad0ccb60c8ee5ba337b9a`.

```bash
python scripts/eval/run_judges.py --judge gemma --rubrics 2
python scripts/eval/run_judges.py --judge qwen9b --rubrics 2
```

Writes `public/data/eval/judges/gemma-v2.json` and `qwen9b-v2.json`. If the server refuses `logprobs`, say so rather
than dropping them.

## 3. After the runs

```bash
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma-v2.json
python scripts/eval/run_judges.py --judge qwen9b --check-items public/data/eval/judges/qwen9b-v2.json
```

Commit both run files and `scripts/`, and paste back each run's last line, the vLLM version, the GPU and every
environment change. Don't summarise the verdicts, and don't compare anything with the test-split labels: the test
measurement happens once, in the content chat.
