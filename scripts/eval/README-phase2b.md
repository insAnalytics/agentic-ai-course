# Module 7 runs, phase 2b: the summarizer test

One run for Lesson 5 (code graders): the test for the summarizer that Module 4 promised. Content decisions (which
runs, the two instruction versions, the probes and how they're graded) are made in the content chat and written
into `run_summarizer_test.py`'s docstring; this README is only about running it.

## 1. Before the GPU

```bash
python scripts/eval/build_course_libs.py --check
python scripts/eval/run_summarizer_test.py --dry-run     # 20 traces, 120 summaries, "0 of 147" (the stand-in answers "unknown")
```

Don't commit the dry-run file.

## 2. On Colab

Only the agent server is needed: the 4B on port 8000 at revision `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`, with
no reasoning or tool-call parser, and the same environment changes as before (`VLLM_USE_FLASHINFER_SAMPLER=0`,
`torchaudio` removed). The simulated user isn't used. Then:

```bash
python scripts/eval/run_summarizer_test.py
```

120 summaries and 588 probe answers; a few GPU-minutes. Writes `public/data/eval/summarizer/summarizer-test.json`.

## 3. After the run

Commit the run file and `scripts/`, and paste back the script's last three lines, the vLLM version, the GPU and
every environment change.
