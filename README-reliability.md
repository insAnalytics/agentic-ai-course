# Module 6 offline run: set E on Qwen3.5

Real model replies for Module 6's reliability lessons, sampled once and committed as data.

## Files

| Path | What it is |
|---|---|
| `scripts/reliability/set_e_source.py` | Set E, hand-written: 84 questions (62 lookup, 22 step), four wordings each, answers and evidence quotes |
| `scripts/build-reliability-sets.py` | Checks set E against the corpus and builds `public/data/reliability/set-e.json` (no model, no GPU) |
| `scripts/reliability/grading.py` | How an answer is read and graded. Lesson code that grades replies must match it |
| `scripts/generate-reliability-samples.py` | Samples the model and writes `public/data/reliability/runs/<condition>.json` |
| `scripts/rag_chunking.py`, `scripts/rag_context.py` | Already in the repo, unchanged; the builder imports them |

## Step 1: Claude Code, in the repo

1. Copy the files above into the repo at the same paths.
2. Run `python scripts/build-reliability-sets.py`. It should print
   `set E: 84 questions (62 lookup, 22 step), 336 wordings, pool of 1946 chunks`, and the file it
   writes should be identical to the `set-e.json` in this bundle.
3. Dry-run every condition with the stand-in model (no GPU), in this order:
   `plain`, `wordings`, `thinking`, `stronger`, each as
   `python scripts/generate-reliability-samples.py --condition <name> --dry-run`.
   Delete the `*.dry-run.json` files afterwards; don't commit them.
4. Commit the scripts and `set-e.json`, and push, so Kaggle can clone them.

## Colab G4 setup, and the v1 runs (2026-09-29)

**v1 runs (`runs/v1/`)** are the first sampling, kept rather than deleted: its answer instructions
didn't say how to give a non-number answer or forbid answering with a source's number, 400
answer tokens could cut replies short, and two questions (e47, e59) had ambiguous wordings, which makes the model look less consistent than it is. They're a real example of
an instruction bug showing up as inconsistency. **v2** (set E version 2, fixed instructions,
1,024 answer tokens) goes in `runs/` with the same setup, and is what the lessons use.

The v1 `runs/v1/*.json` were sampled on **Colab (Pro), G4 runtime** (NVIDIA RTX PRO 6000
Blackwell, 96 GB), not Kaggle: one GPU for all four conditions, `--dtype bfloat16`,
`--engine-args '{"language_model_only": true}'`, vLLM 0.30.0, torch 2.13.0+cu130. Two setup
fixes were needed (from v2 on, the `VLLM_` variables are saved in `setup.env`):

- `!pip uninstall -y torchaudio` after installing vLLM (Colab's preinstalled torchaudio is built
  for a different CUDA than the torch vLLM pulls in, and transformers imports it).
- `%env VLLM_USE_FLASHINFER_SAMPLER=0` before the runs (FlashInfer's arch check rejects this
  Blackwell GPU; vLLM's own sampler draws from the same distribution).

Throughput was about 5,000 tokens/s; all four runs took under 10 minutes of generation. The
Kaggle T4 instructions below also work (the smoke test passed there) but are several times slower.

## Step 2: Simar, on Kaggle

Create a notebook with **Accelerator: GPU T4 x2** and **Internet: on** (Internet needs a
phone-verified account). Each cell below is one notebook cell.

```bash
!git clone https://github.com/insAnalytics/agentic-ai-course
%cd agentic-ai-course
!pip install -U vllm
!python -c "import vllm, torch; print(vllm.__version__, torch.__version__, torch.cuda.get_device_name(0))"
```

**Before the first run, check the sampling settings.** Open the Qwen3.5-4B model card on Hugging
Face, find its recommended sampling settings for thinking and non-thinking mode, and compare them
with `SAMPLING` at the top of `scripts/generate-reliability-samples.py`. If they differ, edit the
script. Whatever is used is saved with the run.

**Smoke test.** On a fresh session, startup takes about 10 minutes (compiling kernels and
capturing CUDA graphs); the GPU shows 0% use during it, which is normal. The engine args below are
what fits a T4: `language_model_only` skips the vision encoder, `max_num_batched_tokens` shrinks the
startup memory profile, and `max_num_seqs` stays under the model's per-sequence state budget
(the default 256 fails with "exceeds available Mamba cache blocks").

```bash
!python scripts/generate-reliability-samples.py --condition plain --limit 5 --engine-args '{"language_model_only": true, "max_num_batched_tokens": 2048, "max_num_seqs": 128}'
!python -c "import json; d=json.load(open('public/data/reliability/runs/plain.limit5.json')); [print(s['text'][-300:], '->', s['correct'], chr(10)) for s in d['results'][0]['samples'][:3]]"
```

The replies should be readable text ending in `ANSWER: ...`. Things that can go wrong here:
- **Garbled or empty replies:** the T4 has no bfloat16, so the model runs in float16, which a few
  models don't tolerate. Stop and send the output.
- **Out of memory while loading:** Qwen3.5 checkpoints include a vision encoder. The vLLM recipe for
  Qwen3.5 skips it with `--language-model-only` when serving; pass the equivalent `LLM(...)`
  argument through `--engine-args '{...}'`, or lower `--max-model-len`.
- **"The thinking-on prompt doesn't end with '<think>\n'"** (in the `thinking` run): the chat
  template differs from what the script expects. Send the rendered prompt's last lines.

**The runs.** Each condition is its own command, so a session limit never loses finished work:

```bash
!python scripts/generate-reliability-samples.py --condition plain --engine-args '{"language_model_only": true, "max_num_batched_tokens": 2048, "max_num_seqs": 128}'
!python scripts/generate-reliability-samples.py --condition wordings --engine-args '{"language_model_only": true, "max_num_batched_tokens": 2048, "max_num_seqs": 128}'
!python scripts/generate-reliability-samples.py --condition thinking --engine-args '{"language_model_only": true, "max_num_batched_tokens": 2048, "max_num_seqs": 128}'
!python scripts/generate-reliability-samples.py --condition stronger --engine-args '{"language_model_only": true, "max_num_batched_tokens": 2048, "max_num_seqs": 128, "tensor_parallel_size": 2}'
```

- `stronger` uses Qwen3.5-9B, which needs both T4s in float16 (the flag splits it across them).
- `thinking` is the long one: about 2 million generated tokens, most of it the 4,096-token thinking
  ceiling. The other three together are under half a million. How long each takes on Kaggle isn't
  known until the smoke test; each run prints its tokens per second.
- If a later run needs a fresh session, the earlier outputs are in
  `public/data/reliability/runs/`; download them first (Kaggle's working directory isn't kept).

**Download:**

```bash
!cd public/data/reliability && zip -r /kaggle/working/reliability-runs.zip runs -x "*.limit*"
```

Then download `reliability-runs.zip` from the notebook's Output panel.

## Step 3: Claude Code, commit

Unzip into `public/data/reliability/runs/`, check that each file's `"dry_run"` is `false`, and
commit. Paste back the summary lines the runs printed, and each file's `setup` and `timing` blocks.

## Notes

- **Every file is written as UTF-8** explicitly.
- **Seeds** come from the question id, wording and condition, so a rerun requests the same seeds.
  The same seed on different hardware or engine versions can still give different samples; the
  pages report the setup each number came from.
- **Budgets:** the thinking budgets are 1x, 3x, 5x and 9x the mean length of a `plain` reply, plus
  the 4,096-token ceiling. Each sample thinks once; smaller budgets reuse the start of that thought
  (see the script's docstring for why that is exact, not an approximation).
- **Not in this run yet:** sets C, P and D (contradictions, false premises and pushback, drafts and
  support judgments). They'll come as a second bundle for the same notebook.
