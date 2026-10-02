# Module 7, Lesson 7: labelling the judges' items

Simar labels about 100 items the judges graded, blind, so Lesson 7 can measure each judge against a person. Content
decisions (which items, the strata, the dev/test split, the relabel sample, the instructions) are in
`build_judge_labelling.py`; this README is the spec for the labelling page's new mode, and the steps.

## 1. Build and check the item file

```bash
python scripts/eval/build_judge_labelling.py --check    # "items.json" must be up to date
```

`public/data/eval/judge-labels/items.json` holds 100 items (correctness 45, premise 20, relevance 10, false report 9,
broken result 9, planted 7), each with `item_id`, `kind`, `stratum`, `split`, `rubric` and `shown`, plus
`instructions` and a `relabel` list of 30 ids.

## 2. A judge mode for the labelling page

Add a mode to `scripts/eval/labeller/index.html` (opened with `?mode=judges`), alongside the existing trace mode:

- **One item at a time, in the file's order.** Show a plain-language name for the kind (for example "Did the reply
  claim a change that didn't happen?" for `false_report`; take the names from the table below), the `rubric` text,
  then the `shown` text in a scrollable, pre-wrapped box. Show the file's `instructions` once, at the top.
- **Blind.** Never show `stratum`, `split`, the judges' verdicts, or any other labels. Don't load any judge file.
- **Three buttons, PASS, FAIL and UNCLEAR, and a note box.** Keyboard: `p`, `f`, `u`, and arrow keys to move. Show
  progress ("37 of 100").
- **For `correctness` items only, a checkbox: "I think the reference answer is wrong".** It's separate from the verdict:
  the verdict still says whether the answer matches the reference as written. When it's ticked, the note box is
  required (what's wrong with the reference, and what the right answer is).
- **Save as you go** in the browser (this is a local tool, not a published page), and **export** a file
  `labels-judges-simar.json`: `{"labeller": "simar", "started": ..., "finished": ..., "labels": [{"item_id",
  "verdict", "reference_disputed", "note", "labelled_at"}]}`, verdicts lower-case, `reference_disputed` true or
  false (always false for other kinds).
- **Relabel mode** (`?mode=judges-relabel`): only the 30 ids in `relabel`, in a fresh shuffled order (seed the
  shuffle with the string "relabel"), with nothing from the first labelling shown or loaded. Export
  `labels-judges-simar-relabel.json` in the same shape. If a first-labelling file's `finished` date is present in the
  browser's storage and is less than three weeks ago, show a warning (don't block).

| kind | plain-language name |
|---|---|
| `false_report` | Did the reply claim a change that didn't happen? |
| `planted` | Did the reply pass on the planted instruction? |
| `broken_result` | Did the reply state something from the empty record as fact? |
| `correctness` | Does the answer match the reference answer? |
| `relevance` | Does the answer address the question asked? |
| `premise` | Did the reply handle the question's assumption correctly? |

## 3. Labelling

Simar opens the page locally (`python -m http.server` in the repo root), labels all 100 items, exports
`labels-judges-simar.json`, and commits it to `public/data/eval/judge-labels/`. About 2-3 hours, in as many sittings as
suits; the page keeps progress.

**After at least three weeks:** the relabel mode, 30 items, about 45 minutes; commit
`labels-judges-simar-relabel.json`.

Nothing about the judges' verdicts should be looked at before labelling is finished.
