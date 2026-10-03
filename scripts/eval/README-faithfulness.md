# Module 7: the faithfulness judge (Lesson 6) and its labels (Lesson 7)

Content decisions live in the code: the rubric and the items in `judges.py` (`RUBRIC_FAITHFULNESS`,
`faithfulness_items`), the labelling set in `build_faithfulness_labelling.py`, and the citation rule in
`ablation_results.py` (`cites_required`). This README is only about running it.

## 0. Already done: the citation rule (no GPU)

`ablation_results.py` now marks each task `cites_required`. That's a question whose reference answer comes from the
documents, so an answer to it has to cite a source.
- Rebuild `public/data/eval/ablations/results.json`, check the output is identical to the copy in the zip, and run
  `--check`.
- The only change is the new key, so every page reading `results.json` must still build, with its demos unchanged.
  Confirm that, and run `report_grades.py`, `report_costs.py` and `monitoring_traffic.py` with `--check`.

## 1. Before the GPU

```bash
python scripts/eval/run_judges.py --judge gemma --dry-run --faithfulness --runs baseline-a,baseline-b,no-labels-a,prompt-v2-a
```
- This should report 1118 items.
- Don't commit the dry-run file.

## 2. On Colab

Start Gemma 4 31B on :8002 exactly as in phase 4: the same repo id, the pinned revision in `run_judges.py`'s
`REVISIONS`, the same vLLM version and settings. Then:

```bash
python scripts/eval/run_judges.py --judge gemma --faithfulness --runs baseline-a,baseline-b,no-labels-a,prompt-v2-a
```

This writes `public/data/eval/judges/gemma-faithfulness.json`, with verdict-token probabilities as in phase 4.
- Prompts run up to about 29,000 characters (about 7,000 tokens). If any item is cut off (`finish_reason`
  "length") or the server rejects a prompt for its length, stop and report rather than truncating anything.
- Report the wall time, the number of items without a decision, and the decision counts.

## 3. After the run

```bash
python scripts/eval/build_faithfulness_labelling.py
python scripts/eval/build_faithfulness_labelling.py --check
```

This writes `public/data/eval/faithfulness/items.json`:
- about 40 items, in four strata (the judge's verdict × whether the answer cites a source)
- `strata`, the pool size of each stratum, for weighting
- `instructions`

If a stratum's pool is smaller than its quota, the builder takes the whole pool. Report the counts it prints.

## 4. The labelling page

Extend the labeller's judge mode (`scripts/eval/labeller/index.html`, `?mode=judges`) to accept an items file:
- `?mode=judges&items=faithfulness`
- Load `public/data/eval/faithfulness/items.json` and export `labels-faithfulness-simar.json`, in the same shape as
  `labels-judges-simar.json`.
- The plain-language name for kind `faithfulness` is "Is every claim in the answer supported by what the tools
  returned?".
- Everything else stays as the judge mode already works:
  - blind: never show `stratum`, `split` or any judge verdict
  - keyboard shortcuts, progress, saving as you go
  - no reference-answer checkbox for this kind

Simar labels the items, then commits `public/data/eval/faithfulness/labels-faithfulness-simar.json`. The content
chat takes it from there.

## Commit

- `judges.py`, `run_judges.py`, `ablation_results.py`, `build_faithfulness_labelling.py` and this README
- the rebuilt `results.json`
- after step 2: `gemma-faithfulness.json`
- after step 3: `faithfulness/items.json`
- the labeller change
