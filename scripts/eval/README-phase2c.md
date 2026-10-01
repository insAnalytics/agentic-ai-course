# Module 7 runs, phase 2c: the summarizer test's second round of probes

New, hand-written probes for the 120 summaries phase 2b recorded. No summaries are written; the 4B only answers
360 short questions. Content decisions (the probes and their answers) are in `run_summary_probes.py`.

## 1. Before the GPU

```bash
ln -s "$PWD/public/data/rag" /data/rag            # Module 5's library loads its corpus on import
python scripts/eval/build_course_libs.py --check
python scripts/eval/run_summary_probes.py --dry-run   # "0 of 180" for each version (the stand-in answers "unknown")
```

Don't commit the dry-run file.

## 2. On Colab

The agent server only, exactly as for phase 2b (the 4B on port 8000 at `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`,
no reasoning or tool-call parser, `VLLM_USE_FLASHINFER_SAMPLER=0`, `torchaudio` removed). Then:

```bash
python scripts/eval/run_summary_probes.py
```

Under a minute of generation. Writes `public/data/eval/summarizer/summary-probes.json`.

## 3. After the run

Commit the run file and the script, and paste back the last three lines, the vLLM version, the GPU and every
environment change.
