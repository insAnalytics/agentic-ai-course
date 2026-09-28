# Module 5 query variants (Lesson 8): notes for the site build

## Run once

    pip install sentence-transformers numpy      # plus a CUDA build of PyTorch for the GPU
    python scripts/generate-rag-query-variants.py

It writes three files; commit all of them:

- `public/data/rag/query-variants.json` (the texts and prompts, about 16 KB)
- `public/data/rag/embeddings/bge-small-en-v1.5/query-variants.json` (about 130 KB)
- `public/data/rag/rerank/ms-marco-MiniLM-L6-v2/query-variants.json` (about 720 KB)

About 128,000 cross-encoder pairs. The batch size is 512, following the note from
the reranker run; paste the final summary line back to the content chat, and say
which device it ran on.

`scripts/rag_corpus/query_variants_src.py` holds the texts; edit it, not the
JSON, if a text changes, then rerun. `scripts/rag_chunking.py` is unchanged.

## Loading in the browser

Same rule as the rest of Module 5's data: fetched on the first Run that needs a
file, cached, written to the same relative path under `/data/rag/`, never bundled.
