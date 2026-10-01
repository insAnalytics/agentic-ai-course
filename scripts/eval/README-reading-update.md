# Lesson 3 reading: the standard, and a re-review pass

Content decisions are in this folder; Claude Code commits them and makes two small changes to the page.

## Commit

- `standard.md` -> `public/data/eval/reading/standard.md`: the reading standard, version 1, decided by Simar.
- `labels-simar.json` -> `public/data/eval/reading/labels-simar.json`: Simar's labels with the revisions he
  approved (see its `revisions` field). No verdict changed; original values are kept in `*_original` fields.
- `labels-claude.json` -> `public/data/eval/reading/labels-claude.json`: Claude's 15 overlap labels, made
  before Simar's existed, plus `labels_after_standard` for the same 15.

## Change the page and the validator

1. **A new fault value, `harness`**, between `agent` and `task`, described on the page as "the way the course
   built the agent: the system prompt, a tool's description, the checks, or a document planted in the corpus
   on purpose". `check_labels.py` accepts it, and still accepts the `*_original` fields and `revisions`.
2. **Show the standard.** Replace the page's guide with the contents of `standard.md` (rendered), still above
   the first trace and behind "How to read".
3. **A re-review pass.** A reader option `simar (re-review)` that steps through Simar's 40 in the same order,
   with each trace's label prefilled from `labels-simar.json`, and exports `labels-simar-v2.json`. Every
   label in v2 records `changed: true/false` against v1. v1 is never overwritten: the difference between the
   two is the lesson's evidence of how a grading standard forms.
