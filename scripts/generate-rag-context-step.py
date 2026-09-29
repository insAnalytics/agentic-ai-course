"""
Module 5 (RAG Systems), Lesson 14: labelled data and embeddings for upgrading Module 4's context step.

Writes public/data/rag/context-step.json from scripts/rag_corpus/context_step_src.py (Module 4's tool
catalog as text, one user's memories, tool-finding and recall tasks, and labelled memory pairs), and embeds
with bge-small, in the same format as the other embedding files:

- embeddings/bge-small-en-v1.5/context-step-texts.json: every tool text, memory and pair text, embedded as
  a document, keyed by the hash of its exact text;
- embeddings/bge-small-en-v1.5/context-step-queries.json: every tool-finding and recall task, embedded with
  bge's retrieval instruction, keyed by task id.

Run: `pip install sentence-transformers numpy`, then `python scripts/generate-rag-context-step.py`. A few
hundred short texts: seconds on a GPU, a minute or two on a CPU. `--dry-run` uses a stand-in embedder.
"""

import base64
import hashlib
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "rag_corpus"))
import context_step_src as source  # noqa: E402

ROOT = HERE.parent
OUT = ROOT / "public" / "data" / "rag"
EMBED = OUT / "embeddings" / "bge-small-en-v1.5"
BGE_INSTRUCTION = "Represent this sentence for searching relevant passages: "


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def pack(vectors: np.ndarray) -> str:
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    return base64.b64encode(vectors.astype("<f2").tobytes()).decode("ascii")


class StandIn:
    def encode(self, texts, **_):
        return np.array([np.random.default_rng(int(text_key(t), 16) % 2**32).normal(size=384) for t in texts])


def main():
    dry_run = "--dry-run" in sys.argv
    tools = {f"{server}__{action}": source.tool_text(server, action)
             for server in source.SERVERS for action in source.ACTIONS}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "context-step.json").write_text(json.dumps({
        "written_by": "Written for the course; tasks and pairs are labelled by hand",
        "tools": tools, "tool_tasks": source.TOOL_TASKS, "memories": source.MEMORIES,
        "recall_tasks": source.RECALL_TASKS, "pairs": source.PAIRS,
    }, indent=1, ensure_ascii=False), encoding="utf-8")

    if dry_run:
        embedder = StandIn()
    else:
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    texts = list(dict.fromkeys([*tools.values(), *(m["content"] for m in source.MEMORIES),
                                *(p[side] for p in source.PAIRS for side in ("a", "b"))]))
    tasks = source.TOOL_TASKS + source.RECALL_TASKS
    model = "stand-in (dry run)" if dry_run else "BAAI/bge-small-en-v1.5"
    EMBED.mkdir(parents=True, exist_ok=True)
    (EMBED / "context-step-texts.json").write_text(json.dumps({
        "model": model, "dim": 384, "dtype": "float16", "normalized": True, "chunking": "context-step",
        "keys": [text_key(t) for t in texts], "vectors": pack(np.asarray(embedder.encode(texts, batch_size=32))),
    }), encoding="utf-8")
    (EMBED / "context-step-queries.json").write_text(json.dumps({
        "model": model, "dim": 384, "dtype": "float16", "normalized": True, "keys": [t["id"] for t in tasks],
        "instructed": pack(np.asarray(embedder.encode([BGE_INSTRUCTION + t["task"] for t in tasks], batch_size=32))),
    }), encoding="utf-8")
    print(f"{len(texts)} texts and {len(tasks)} tasks embedded")


if __name__ == "__main__":
    main()
