"""
Query variants for Module 5 (RAG Systems), Lesson 7: rewrites, sub-queries and
hypothetical documents (HyDE), embedded and scored by the module's models.

The texts are in scripts/rag_corpus/query_variants_src.py, written for the course
by Claude following the prompts stored alongside them (see that file's
docstring for how they were written). This script:

1. writes them, with the prompts, to public/data/rag/query-variants.json, where
   the lessons serve them as scripted model replies;
2. embeds them with BAAI/bge-small-en-v1.5 into
   public/data/rag/embeddings/bge-small-en-v1.5/query-variants.json. Rewrites
   and sub-queries are queries, so they get bge-small's retrieval instruction;
   hypothetical documents stand in for documents, so, as HyDE specifies, they
   are embedded as documents, without it. Keys are "<query id>:rewrite",
   "<query id>:sub1", "<query id>:sub2" and "<query id>:hyde". Same format as
   the other embedding files (float16, L2-normalized, base64).
3. scores every rewrite and sub-query against every structured-200 chunk with
   cross-encoder/ms-marco-MiniLM-L6-v2 into
   public/data/rag/rerank/ms-marco-MiniLM-L6-v2/query-variants.json, same format
   as structured-200.json, with the variant keys as "query_keys".
   (Hypothetical documents aren't reranked: a reranker scores the question.)

Run: `python scripts/generate-rag-query-variants.py` -- needs
`pip install sentence-transformers numpy`, and a CUDA build of PyTorch to use a
GPU (about 130,000 cross-encoder pairs; a few minutes on a laptop GPU with the
batch size below, much longer on a CPU). `--dry-run` uses meaningless stand-in
models to check the plumbing without downloading anything.
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
import query_variants_src as source  # noqa: E402

ROOT = HERE.parent
DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"
TEXTS_OUT = ROOT / "public" / "data" / "rag" / "query-variants.json"
EMBED_OUT = ROOT / "public" / "data" / "rag" / "embeddings" / "bge-small-en-v1.5" / "query-variants.json"
RERANK_OUT = ROOT / "public" / "data" / "rag" / "rerank" / "ms-marco-MiniLM-L6-v2" / "query-variants.json"
BGE_INSTRUCTION = "Represent this sentence for searching relevant passages: "
# the cross-encoder scores are the slow part; large batches keep a GPU busy
BATCH = 512


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def pack(vectors: np.ndarray, dtype: str) -> str:
    return base64.b64encode(np.asarray(vectors).astype(dtype).tobytes()).decode("ascii")


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

    queries = {}
    for query_id, text in source.REWRITES.items():
        queries[f"{query_id}:rewrite"] = text
    for query_id, parts in source.SUB_QUERIES.items():
        for number, text in enumerate(parts, 1):
            queries[f"{query_id}:sub{number}"] = text
    documents_side = {f"{query_id}:hyde": text for query_id, text in source.HYDE.items()}

    TEXTS_OUT.write_text(json.dumps({
        "written_by": "Claude, for the course; served in the lessons as scripted model replies",
        "prompts": {"rewrite": source.REWRITE_PROMPT, "split": source.SPLIT_PROMPT, "hyde": source.HYDE_PROMPT},
        "rewrites": source.REWRITES, "sub_queries": source.SUB_QUERIES, "hyde": source.HYDE,
    }, indent=1), encoding="utf-8")

    query_vectors = np.asarray(embedder.encode([BGE_INSTRUCTION + t for t in queries.values()], batch_size=64))
    hyde_vectors = np.asarray(embedder.encode(list(documents_side.values()), batch_size=64))
    vectors = np.vstack([query_vectors, hyde_vectors])
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    EMBED_OUT.parent.mkdir(parents=True, exist_ok=True)
    EMBED_OUT.write_text(json.dumps({
        "model": "stand-in (dry run)" if dry_run else "BAAI/bge-small-en-v1.5", "dim": 384, "dtype": "float16",
        "normalized": True, "keys": [*queries, *documents_side], "vectors": pack(vectors, "<f2"),
    }), encoding="utf-8")

    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    chunk_texts = [c["text"] for d in documents for c in structured_chunks(d, 200)]
    started = time.perf_counter()
    scores = np.zeros((len(queries), len(chunk_texts)), dtype=np.float32)
    for row, text in enumerate(queries.values()):
        scores[row] = reranker.predict([(text, chunk) for chunk in chunk_texts], batch_size=BATCH,
                                       show_progress_bar=False)
        print(f"{row + 1}/{len(queries)}", end="\r")
    RERANK_OUT.parent.mkdir(parents=True, exist_ok=True)
    RERANK_OUT.write_text(json.dumps({
        "model": "stand-in (dry run)" if dry_run else "cross-encoder/ms-marco-MiniLM-L6-v2",
        "chunking": "structured-200", "query_keys": list(queries), "chunk_keys": [text_key(t) for t in chunk_texts],
        "dtype": "float32", "scores": pack(scores, "<f4"),
    }), encoding="utf-8")
    print(f"\n{len(queries)} query variants and {len(documents_side)} hypothetical documents embedded; "
          f"{scores.size:,} cross-encoder pairs in {time.perf_counter() - started:.0f} s")


if __name__ == "__main__":
    main()
