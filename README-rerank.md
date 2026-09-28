# Module 5 reranker scores: notes for the site build

## Run once

    pip install sentence-transformers numpy
    python scripts/generate-rag-rerank-scores.py

Needs internet the first time (about 90 MB). Scores about 110,000
question-chunk pairs: roughly 5 to 20 minutes on a laptop CPU. Commit
`public/data/rag/rerank/ms-marco-MiniLM-L6-v2/structured-200.json`
(about 600 KB), and paste the two summary lines it prints back to the
content chat. `--dry-run` checks the plumbing only; don't commit its output.

`scripts/rag_chunking.py` is unchanged from Lesson 4's zip; it's included so
this zip is complete on its own.

## Loading in the browser

Same rule as the embeddings: fetched on the first Run that needs it, cached,
written to the same relative path under `/data/rag/`, never bundled.
