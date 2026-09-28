"""
Contextual chunks for Module 5 (RAG Systems), Lesson 8.

Two new versions of every structured-200 chunk, built by scripts/rag_context.py:
- "structured-200-headers": each chunk's section path (document title down) prepended.
- "structured-200-contextual": the model-written context from
  scripts/rag_corpus/chunk_contexts_src.py prepended, for the 75 internal registry
  chunks; every other chunk gets its header, as above.

For each version this script writes, in the same formats as the existing files:
- public/data/rag/embeddings/bge-small-en-v1.5/<version>.json (bge-small, as documents);
- public/data/rag/rerank/ms-marco-MiniLM-L6-v2/<version>.json: every labelled question
  (main and held-out) scored against every chunk version by the cross-encoder.
It also writes public/data/rag/chunk-contexts.json (the contexts and the prompt), which
the lesson serves as scripted model replies.

Run: `python scripts/generate-rag-contextual.py` -- needs `pip install sentence-transformers
numpy`, and a CUDA build of PyTorch for the GPU: about 225,000 cross-encoder pairs, several
minutes on a laptop GPU. `--dry-run` uses meaningless stand-in models to check the plumbing.
"""

import base64
import hashlib
import json
import sys
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rag_corpus"))
from rag_chunking import structured_chunks  # noqa: E402
from rag_context import with_context, with_header  # noqa: E402
import chunk_contexts_src as source  # noqa: E402

ROOT = HERE.parent
DATA = ROOT / "public" / "data" / "rag"
QUERIES = ROOT / "scripts" / "rag_corpus" / "queries.json"
BGE_INSTRUCTION = "Represent this sentence for searching relevant passages: "
BATCH = 512


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def pack(array: np.ndarray, dtype: str) -> str:
    return base64.b64encode(np.asarray(array).astype(dtype).tobytes()).decode("ascii")


class StandIn:
    """Dry-run models: deterministic, capturing no meaning. For checking the plumbing only."""
    def encode(self, texts, **_):
        return np.array([np.random.default_rng(int(text_key(t), 16) % 2**32).normal(size=384) for t in texts])

    def predict(self, pairs, **_):
        return np.array([(int(text_key(q + "|" + p), 16) % 2000) / 100 - 10 for q, p in pairs], dtype=np.float32)


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        embedder = reranker = StandIn()
    else:
        from sentence_transformers import CrossEncoder, SentenceTransformer
        embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
        reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")

    documents = json.loads((DATA / "documents.json").read_text(encoding="utf-8"))
    labelled = json.loads(QUERIES.read_text(encoding="utf-8"))
    queries = labelled["main"] + labelled["held_out"]
    chunks = [c for d in documents for c in structured_chunks(d, 200)]
    versions = {
        "structured-200-headers": [with_header(c)["text"] for c in chunks],
        "structured-200-contextual": [with_context(c, source.CONTEXTS)["text"] for c in chunks],
    }
    missing = set(source.CONTEXTS) - {f"{c['doc_id']}:{c['chunk']}" for c in chunks}
    if missing:
        raise SystemExit(f"contexts for chunks that don't exist: {sorted(missing)}")

    (DATA / "chunk-contexts.json").write_text(json.dumps({
        "written_by": "Claude, for the course, with each whole document in view; served as scripted model replies",
        "prompt": source.CONTEXT_PROMPT, "contexts": source.CONTEXTS,
    }, indent=1), encoding="utf-8")

    for name, texts in versions.items():
        vectors = np.asarray(embedder.encode(texts, batch_size=64))
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        out = DATA / "embeddings" / "bge-small-en-v1.5" / f"{name}.json"
        out.write_text(json.dumps({
            "model": "stand-in (dry run)" if dry_run else "BAAI/bge-small-en-v1.5", "dim": 384, "dtype": "float16",
            "normalized": True, "chunking": name, "keys": [text_key(t) for t in texts], "vectors": pack(vectors, "<f2"),
        }), encoding="utf-8")

        started = time.perf_counter()
        scores = np.zeros((len(queries), len(texts)), dtype=np.float32)
        for row, query in enumerate(queries):
            scores[row] = reranker.predict([(query["query"], t) for t in texts], batch_size=BATCH,
                                           show_progress_bar=False)
            print(f"{name}: {row + 1}/{len(queries)}", end="\r")
        out = DATA / "rerank" / "ms-marco-MiniLM-L6-v2" / f"{name}.json"
        out.write_text(json.dumps({
            "model": "stand-in (dry run)" if dry_run else "cross-encoder/ms-marco-MiniLM-L6-v2", "chunking": name,
            "query_keys": [q["id"] for q in queries], "chunk_keys": [text_key(t) for t in texts],
            "dtype": "float32", "scores": pack(scores, "<f4"),
        }), encoding="utf-8")
        print(f"\n{name}: {len(texts)} chunks embedded, {scores.size:,} pairs scored in "
              f"{time.perf_counter() - started:.0f} s")


if __name__ == "__main__":
    main()
