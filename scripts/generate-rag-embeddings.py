"""
Real embeddings for Module 5 (RAG Systems), for Lesson 4 onwards.

Models (both free, run locally):
- BAAI/bge-small-en-v1.5: the module's embedder. 384 dimensions, 512-token input
  limit, asymmetric: queries may be prefixed with its retrieval instruction,
  documents never are.
- sentence-transformers/all-MiniLM-L6-v2: Module 1's model, 384 dimensions,
  256-word-piece input limit. Embedded for one comparison only.

What gets embedded:
- Chunks of public/data/rag/documents.json from scripts/rag_chunking.py (the
  lessons' own chunkers): structured chunks at 100, 200 and 400 tokens, and
  fixed 200-token chunks, with bge-small; structured 200 only with MiniLM.
- Every labelled query (main and held-out), the query text alone: plain with
  both models, and with bge-small's instruction as well.

Output, under public/data/rag/embeddings/<model>/:
- <chunking>.json: {"model", "dim", "dtype": "float16", "normalized": true,
  "chunking", "keys", "vectors"}. keys[i] is the first 16 hex digits of the
  SHA-256 of chunk i's text (UTF-8); vectors is base64 of a row-major
  float16 array of shape (len(keys), dim). The browser looks a chunk's
  vector up by hashing the text it produced, so it never depends on order.
- queries.json: {"model", "dim", "dtype", "normalized", "keys" (query ids),
  "plain", and for bge-small also "instructed"}.
Vectors are L2-normalized before rounding to float16, so a dot product is the
cosine similarity to about three decimal places.

Also writes scripts/rag_corpus/embedding-report.json: each model's real token
count (its own tokenizer) for every chunking, and every chunk over the model's
input limit, which the model truncates.

Run: `python scripts/generate-rag-embeddings.py` -- needs
`pip install sentence-transformers numpy` and internet access the first time
(two models, about 220 MB, cached afterwards). About 5 to 15 minutes on a
laptop CPU. `--dry-run` swaps the models for a meaningless stand-in to check
the plumbing without downloading anything.
"""

import base64
import hashlib
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from rag_chunking import fixed_chunks, structured_chunks  # noqa: E402

ROOT = Path(__file__).parent.parent
DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"
QUERIES = ROOT / "scripts" / "rag_corpus" / "queries.json"
OUT = ROOT / "public" / "data" / "rag" / "embeddings"
REPORT = ROOT / "scripts" / "rag_corpus" / "embedding-report.json"

BGE = "BAAI/bge-small-en-v1.5"
MINILM = "sentence-transformers/all-MiniLM-L6-v2"
BGE_INSTRUCTION = "Represent this sentence for searching relevant passages: "

CHUNKINGS = {
    "structured-100": lambda d: structured_chunks(d, 100),
    "structured-200": lambda d: structured_chunks(d, 200),
    "structured-400": lambda d: structured_chunks(d, 400),
    "fixed-200": lambda d: fixed_chunks(d, 200),
}
PLAN = {BGE: list(CHUNKINGS), MINILM: ["structured-200"]}


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def pack(vectors: np.ndarray) -> str:
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    return base64.b64encode(vectors.astype("<f2").tobytes()).decode("ascii")


class StandIn:
    """Dry-run model: deterministic, captures no meaning. For checking the plumbing only."""
    max_seq_length = 512

    class tokenizer:
        @staticmethod
        def encode(text, add_special_tokens=True):
            return [0] * (len(text) // 4 + 2)

    def encode(self, texts, **_):
        return np.array([np.random.default_rng(int(text_key(t), 16) % 2**32).normal(size=384) for t in texts])


def main():
    dry_run = "--dry-run" in sys.argv
    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    labelled = json.loads(QUERIES.read_text(encoding="utf-8"))
    queries = labelled["main"] + labelled["held_out"]
    report = {}

    for model_name, chunkings in PLAN.items():
        if dry_run:
            model = StandIn()
        else:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(model_name)
        slug = model_name.split("/")[-1]
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        limit = model.max_seq_length
        report[slug] = {"input_limit": limit, "chunkings": {}}

        for name in chunkings:
            texts = [c["text"] for d in documents for c in CHUNKINGS[name](d)]
            vectors = model.encode(texts, batch_size=32, show_progress_bar=not dry_run)
            (folder / f"{name}.json").write_text(json.dumps({
                "model": model_name, "dim": int(vectors.shape[1]), "dtype": "float16", "normalized": True,
                "chunking": name, "keys": [text_key(t) for t in texts], "vectors": pack(np.asarray(vectors)),
            }), encoding="utf-8")
            lengths = [len(model.tokenizer.encode(t, add_special_tokens=True)) for t in texts]
            over = [{"key": text_key(t), "tokens": n, "start": t[:80]} for t, n in zip(texts, lengths) if n > limit]
            report[slug]["chunkings"][name] = {"chunks": len(texts), "max_tokens": max(lengths),
                                               "over_limit": len(over), "examples": over[:10]}
            print(f"{slug} {name}: {len(texts)} chunks, largest {max(lengths)} tokens, {len(over)} over {limit}")

        query_texts = [q["query"] for q in queries]
        record = {"model": model_name, "dim": 384, "dtype": "float16", "normalized": True,
                  "keys": [q["id"] for q in queries],
                  "plain": pack(np.asarray(model.encode(query_texts, batch_size=32)))}
        if model_name == BGE:
            record["instructed"] = pack(np.asarray(model.encode([BGE_INSTRUCTION + t for t in query_texts], batch_size=32)))
        (folder / "queries.json").write_text(json.dumps(record), encoding="utf-8")
        print(f"{slug} queries: {len(queries)}")

    REPORT.write_text(json.dumps({"dry_run": dry_run, **report}, indent=1), encoding="utf-8")
    print(f"report -> {REPORT}")


if __name__ == "__main__":
    main()
