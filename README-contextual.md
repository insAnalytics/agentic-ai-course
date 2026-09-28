# Module 5 contextual chunks (Lesson 8): notes for the site build

## Run once

    pip install sentence-transformers numpy      # plus a CUDA build of PyTorch for the GPU
    python scripts/generate-rag-contextual.py

It writes five files; commit all of them:

- `public/data/rag/chunk-contexts.json` (the 75 contexts and the prompt, about 11 KB)
- `public/data/rag/embeddings/bge-small-en-v1.5/structured-200-headers.json` and
  `structured-200-contextual.json` (about 2 MB each)
- `public/data/rag/rerank/ms-marco-MiniLM-L6-v2/structured-200-headers.json` and
  `structured-200-contextual.json` (about 640 KB each)

About 225,000 cross-encoder pairs at batch size 512. Paste the two summary lines back
to the content chat, with the device it ran on.

`scripts/rag_context.py` builds the new chunk texts and must stay identical to the
lesson's `with_header` and `with_context`: vectors are found by hashing the text.
The contexts live in `scripts/rag_corpus/chunk_contexts_src.py`; edit that, not the
JSON, then rerun. `scripts/rag_chunking.py` is unchanged.

## Loading in the browser

Same rule as the rest of Module 5's data: fetched on the first Run that needs a file,
cached, written to the same relative path under `/data/rag/`, never bundled.
