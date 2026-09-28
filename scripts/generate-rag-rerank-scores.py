"""
Real reranker scores for Module 5 (RAG Systems), Lesson 7 onwards.

Model: cross-encoder/ms-marco-MiniLM-L6-v2, a cross-encoder trained on the
MS MARCO passage-ranking task (22.7M parameters, free, runs locally). A
cross-encoder reads a question and a passage together and outputs one
relevance score (a logit: higher means more relevant; not a probability).

What gets scored: every labelled query (main and held-out, the query text
alone) against every chunk of the module's chosen chunking, structured chunks
of up to 200 tokens from scripts/rag_chunking.py. Scoring every pair, not
just some first stage's candidates, lets the lessons rerank the output of any
first-stage search with real scores.

Output: public/data/rag/rerank/ms-marco-MiniLM-L6-v2/structured-200.json:
{"model", "chunking", "query_keys" (query ids), "chunk_keys" (first 16 hex
digits of the SHA-256 of each chunk's text, as for the embeddings), "dtype":
"float32", "scores": base64 of a row-major float32 array of shape
(len(query_keys), len(chunk_keys))}, plus "timing": seconds per pair and
the time to score 30 candidates for one question, measured on the machine
that ran this script (illustrative only; it depends on the hardware).

Run: `python scripts/generate-rag-rerank-scores.py` -- needs
`pip install sentence-transformers numpy` and internet access the first time
(about 90 MB, cached afterwards). About 110,000 pairs: roughly 5 to 20
minutes on a laptop CPU. `--dry-run` uses a meaningless stand-in model to
check the plumbing without downloading anything.
"""

import base64
import hashlib
import json
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from rag_chunking import structured_chunks  # noqa: E402

ROOT = Path(__file__).parent.parent
DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"
QUERIES = ROOT / "scripts" / "rag_corpus" / "queries.json"
MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
OUT = ROOT / "public" / "data" / "rag" / "rerank" / MODEL.split("/")[-1] / "structured-200.json"


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


class StandIn:
    """Dry-run model: deterministic, captures no meaning. For checking the plumbing only."""
    def predict(self, pairs, **_):
        return np.array([(int(text_key(q + "|" + p), 16) % 2000) / 100 - 10 for q, p in pairs], dtype=np.float32)


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        model = StandIn()
    else:
        from sentence_transformers import CrossEncoder
        model = CrossEncoder(MODEL)

    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    labelled = json.loads(QUERIES.read_text(encoding="utf-8"))
    queries = labelled["main"] + labelled["held_out"]
    texts = [c["text"] for d in documents for c in structured_chunks(d, 200)]

    scores = np.zeros((len(queries), len(texts)), dtype=np.float32)
    started = time.perf_counter()
    for row, query in enumerate(queries):
        scores[row] = model.predict([(query["query"], text) for text in texts], batch_size=64,
                                    show_progress_bar=False)
        print(f"{row + 1}/{len(queries)} {query['id']}", end="\r")
    per_pair = (time.perf_counter() - started) / scores.size

    # one question against 30 candidates, the size of a typical rerank, timed on its own
    started = time.perf_counter()
    model.predict([(queries[0]["query"], text) for text in texts[:30]], batch_size=64, show_progress_bar=False)
    thirty = time.perf_counter() - started

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "model": "stand-in (dry run)" if dry_run else MODEL, "chunking": "structured-200",
        "query_keys": [q["id"] for q in queries], "chunk_keys": [text_key(t) for t in texts],
        "dtype": "float32", "scores": base64.b64encode(scores.astype("<f4").tobytes()).decode("ascii"),
        "timing": {"seconds_per_pair": per_pair, "seconds_for_30_candidates": thirty},
    }), encoding="utf-8")
    print(f"\n{scores.shape[0]} queries x {scores.shape[1]} chunks -> {OUT}")
    print(f"{per_pair * 1000:.2f} ms per pair; 30 candidates for one question: {thirty * 1000:.0f} ms")


if __name__ == "__main__":
    main()
