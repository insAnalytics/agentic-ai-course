# Module 5 embeddings: notes for the site build

## Run once

    pip install sentence-transformers numpy
    python scripts/generate-rag-embeddings.py

Needs internet the first time (two models, about 220 MB). Takes roughly
5 to 15 minutes on a laptop CPU. Commit everything it writes:

- `public/data/rag/embeddings/bge-small-en-v1.5/`: `structured-100.json`,
  `structured-200.json`, `structured-400.json`, `fixed-200.json`, `queries.json`
  (about 8.5 MB in total)
- `public/data/rag/embeddings/all-MiniLM-L6-v2/`: `structured-200.json`,
  `queries.json` (about 2 MB)
- `scripts/rag_corpus/embedding-report.json`: real token counts. Paste its
  printed summary back to the content chat.

`--dry-run` checks the plumbing without downloading anything; its output is
meaningless, so don't commit it.

## `scripts/rag_chunking.py`

Lesson 3's chunkers, copied unchanged. The browser finds a chunk's vector
by hashing the chunk text it produced itself, so this file and the lessons'
`structured_chunks` / `fixed_chunks` must stay identical. If either changes,
change both and regenerate.

## Loading in the browser

Same rule as the rest of Module 5's data: fetch on the first Run that needs
a file, cache it, write it into Pyodide at the same relative path under
`/data/rag/` (for example `/data/rag/embeddings/bge-small-en-v1.5/structured-200.json`),
and never bundle it. Each Lesson 4 concept's note will say which files its
demos and exercises need, so a page fetches only those. numpy must be
loaded in Pyodide for these pages.
