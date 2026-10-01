# Module 7 runs, phase 3: the judges

Two judges, one after the other, over the same 3,092 items for Lesson 6 (model graders): Gemma 4 31B, the main
judge, a different family from the agent; and Qwen3.5-9B, for comparison. Content decisions (the rubrics, what each
judge sees, which runs are judged) are in `judges.py`; this README is only about running them.

| Items | Kind |
|---|---|
| 55 / 45 / 20 | the three reply failures: false report, planted instruction, broken result |
| 590 + 590 | Module 5's questions: correctness against the reference answer, and relevance |
| 96 + 96 | the format comparison: 1-5 scores, and pairs in both orders |
| 1,600 | Module 6's set F premise replies |

## 1. Before the GPU

```bash
ln -s "$PWD/public/data/rag" /data/rag
python scripts/eval/run_judges.py --judge gemma --dry-run    # "3092 items ... 0 without a decision, 0 cut off"
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma.dry-run.json
```

Don't commit dry-run files.

## 2. On Colab

The same environment changes as before (`torchaudio` removed, `VLLM_USE_FLASHINFER_SAMPLER=0`). One server at a
time on port 8002.

**Gemma 4 31B.** Check the exact Hugging Face id (`JUDGES["gemma"]` in `run_judges.py` says
`google/gemma-4-31B-it`; correct it if the id differs) and pin its current revision. Then:

```bash
vllm serve google/gemma-4-31B-it --revision <commit> --port 8002 --dtype bfloat16 \
  --max-model-len 16384 --gpu-memory-utilization 0.85
python scripts/eval/run_judges.py --judge gemma
```

**Qwen3.5-9B,** at the revision the pilot used:

```bash
vllm serve Qwen/Qwen3.5-9B --revision c202236235762e1c871ad0ccb60c8ee5ba337b9a --port 8002 \
  --max-model-len 16384 --gpu-memory-utilization 0.85 --language-model-only
python scripts/eval/run_judges.py --judge qwen9b
```

Both judges run greedy (temperature 0) with thinking turned off through the chat template
(`enable_thinking: False`). If a server rejects that argument, say so rather than removing it: a judge with
thinking on is a different judge.

Each run should take roughly 5-15 minutes. Writes `public/data/eval/judges/gemma.json` and `qwen9b.json`.

## 3. After the runs

```bash
python scripts/eval/run_judges.py --judge gemma --check-items public/data/eval/judges/gemma.json
python scripts/eval/run_judges.py --judge qwen9b --check-items public/data/eval/judges/qwen9b.json
```

Commit both run files and `scripts/`, and paste back:

- each run's last line (items, how many without a decision, how many cut off)
- the Gemma repo id and revision you used, the vLLM version, the GPU, and every environment change
- nothing else: don't summarise the verdicts. Reading them comes first, in the content chat.
