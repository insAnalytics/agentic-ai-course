# Module 6 offline run 2: verification, false premises and pushback

Real model output for Module 6's Lesson 4 (verifying claims) and Lesson 6 (false premises and
pushback), generated once and committed as data. Same setup as run 1 (`README-reliability.md`).

## Files

| Path | What it is |
|---|---|
| `scripts/reliability/set_v_source.py` | 40 hand-written facts from all-staff documents: each with a reworded claim, an altered claim, a true and a false premise, and a question; plus the hand-chosen "other source" chunk for each |
| `scripts/reliability/claims.py` | How a cited answer is split into claims. Lesson code that splits answers must match it |
| `scripts/build-verification-sets.py` | Checks the facts against the corpus and builds `set-v.json`, `set-f.json` and `set-u.json` (no model, no GPU) |
| `scripts/generate-verification-runs.py` | Runs the models and writes `public/data/reliability/runs/<condition>[.<model>].json` |
| `public/data/reliability/set-v.json`, `set-f.json`, `set-u.json` | The built sets, as the builder should reproduce them |

The builder imports `scripts/build-reliability-sets.py`, `scripts/rag_chunking.py` and
`scripts/rag_context.py`; the runner imports `scripts/generate-reliability-samples.py` and
`scripts/reliability/grading.py`. All are already in the repo and unchanged.

## Step 1: Claude Code, in the repo

1. Copy the files above into the repo at the same paths.
2. Run `python scripts/build-verification-sets.py`. It should print:
   ```
   set V: 120 support pairs {'supported': 40, 'not_supported': 80}, 120 statement pairs {'contradict': 40, 'consistent': 80}, 29 draft questions
   set F: 80 questions (40 false-premise, 40 true-premise)
   set U: 84 pushback questions (of 84 in set E)
   ```
   and the three files it writes should be identical to the ones in this bundle.
3. Dry-run every condition with the stand-in (no GPU), in this order, each as
   `python scripts/generate-verification-runs.py --condition <name> --dry-run`:
   `support --model large`, `support --model small`, `statements --model large`,
   `statements --model small`, `nli`, `drafts`, `draft-support --model large`,
   `draft-support --model small`, `premises`, `pushback`. Delete the `*.dry-run.json` files
   afterwards; don't commit them.
4. Commit the scripts and the three set files, and push, so Colab can clone them.

## Step 2: Simar, on Colab (G4 runtime, as for run 1)

```bash
!git clone https://github.com/insAnalytics/agentic-ai-course
%cd agentic-ai-course
!pip install -U vllm
!pip uninstall -y torchaudio
!pip install -U sentence-transformers
%env VLLM_USE_FLASHINFER_SAMPLER=0
!python -c "import vllm, torch, sentence_transformers; print(vllm.__version__, torch.__version__, sentence_transformers.__version__, torch.cuda.get_device_name(0))"
```

**Smoke test** (a few items per condition; check the output reads sensibly before the full runs):

```bash
!python scripts/generate-verification-runs.py --condition support --model large --limit 6 --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition premises --limit 2 --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition nli --limit 6
```

What to look for:
- **support:** `verdicts` should be mostly `SUPPORTED` or `NOT SUPPORTED`. Many `None` verdicts mean
  the model isn't following the one-line format: stop and send a few `text` fields.
- **premises:** outcomes should be `answered` or `rejected`, rarely `no_marker`.
- **nli:** it checks its own label order on the model card's example first and stops if it's wrong.

**The runs.** Each is its own command, so a session limit never loses finished work. Run `drafts`
before either `draft-support`.

```bash
!python scripts/generate-verification-runs.py --condition support --model large --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition support --model small --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition statements --model large --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition statements --model small --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition nli
!python scripts/generate-verification-runs.py --condition drafts --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition draft-support --model large --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition draft-support --model small --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition premises --dtype bfloat16 --engine-args '{"language_model_only": true}'
!python scripts/generate-verification-runs.py --condition pushback --dtype bfloat16 --engine-args '{"language_model_only": true}'
```

Sizes, roughly: the judge runs are a few hundred short replies each; `premises` is 1,600 replies
and `pushback` 840, a few hundred thousand generated tokens between them. At run 1's throughput
the whole set should take well under half an hour of generation, plus model loading.

**Download:**

```bash
!cd public/data/reliability && zip -r /content/verification-runs.zip runs -x "*.limit*" -x "*.dry-run*"
```

## Step 3: Claude Code, commit

Unzip into `public/data/reliability/runs/` (the run 1 files are unchanged), check that every new
file's `"dry_run"` is `false`, and commit. Paste back the summary lines each run printed, and each
file's `setup` and `timing` blocks.

## Notes

- **Labels come from how each item was built**, not from a person or a model judging it. The one
  hand judgment is `OTHER_SOURCE` in the source file: for each claim, a chunk from another document
  that doesn't state it, chosen by reading candidates in full, because the best keyword match often
  states the same fact (the corpus repeats facts across documents).
- **The judges run greedy** (temperature 0), one reply per pair, with top-5 logprobs, so Lesson 6
  can read a verdict's probability. The drafts, premises and pushback runs sample with the same
  non-thinking settings as run 1.
- **`nli` runs on whatever device sentence-transformers picks** (the GPU on Colab) and records it,
  with its time, for the cost comparison with the model judges.
- **Every file is written as UTF-8** explicitly.
