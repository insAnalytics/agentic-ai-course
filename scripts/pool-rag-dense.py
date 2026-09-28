"""
Dense retrieval pool for checking the Module 5 query labels (not site data).

The labelled query set (scripts/rag_corpus/queries.json) was written before
any retrieval ran, so the public documentation may hold relevant passages
nobody labelled. The standard fix is pooling: take the top results of
several different retrievers, and have a person judge everything in the
pool. Keyword and BM25 pools are computed in the content chat; this script
adds the dense one, which needs a real embedding model.

What it does: splits every document in public/data/rag/documents.json at its
Markdown headings (the same split as Module 5 Lesson 1's `split_sections`),
embeds each section and every query (main and held-out) with
BAAI/bge-small-en-v1.5 (384 dimensions, normalized; queries get the model's
retrieval instruction, sections don't), and writes each query's top 20
sections by cosine similarity to scripts/rag_corpus/pool-dense.json.
Sections longer than the model's 512-token input are truncated by the model;
that's acceptable for building a pool.

Run: `python scripts/pool-rag-dense.py` -- needs
`pip install sentence-transformers numpy` and internet access the first time
(the model is about 130 MB and cached afterwards). A few minutes on a laptop CPU.
`--dry-run` swaps the model for a meaningless stand-in, to check the plumbing
without downloading anything.
"""

import json
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent.parent
DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"
QUERIES = ROOT / "scripts" / "rag_corpus" / "queries.json"
OUT = ROOT / "scripts" / "rag_corpus" / "pool-dense.json"
MODEL = "BAAI/bge-small-en-v1.5"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "
DEPTH = 20
FENCE = "`" * 3


def split_sections(document: dict) -> list[dict]:
    """Module 5 Lesson 1's split: at Markdown headings, ignoring '#' lines inside code blocks."""
    sections, lines, heading, in_code = [], [], document["title"], False

    def close():
        text = "\n".join(lines).strip()
        if text:
            sections.append({"doc_id": document["doc_id"], "section": heading, "text": text})

    for line in document["text"].splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        if not in_code and re.match(r"#{1,6} ", line):
            close()
            lines, heading = [], line.lstrip("#").strip()
        lines.append(line)
    close()
    return sections


class StandIn:
    """Dry-run embedder: deterministic, captures no meaning. For checking the plumbing only."""
    def encode(self, texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False):
        vectors = np.array([np.random.default_rng(abs(hash(t)) % 2**32).normal(size=384) for t in texts])
        return vectors / np.linalg.norm(vectors, axis=1, keepdims=True)


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        model = StandIn()
    else:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL)

    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    sections = [s for d in documents for s in split_sections(d)]
    labelled = json.loads(QUERIES.read_text(encoding="utf-8"))
    queries = labelled["main"] + labelled["held_out"]

    section_vectors = model.encode([s["text"] for s in sections], normalize_embeddings=True,
                                   batch_size=32, show_progress_bar=not dry_run)
    # a follow-up question is embedded with its history, as a person reading it would need
    query_texts = [" ".join([turn["content"] for turn in q.get("history", [])] + [q["query"]]) for q in queries]
    query_vectors = model.encode([QUERY_INSTRUCTION + t for t in query_texts], normalize_embeddings=True,
                                 batch_size=32, show_progress_bar=False)

    similarities = query_vectors @ section_vectors.T
    pool = {}
    for q, row in zip(queries, similarities):
        top = np.argsort(-row)[:DEPTH]
        pool[q["id"]] = [{"rank": rank, "doc_id": sections[i]["doc_id"], "section": sections[i]["section"],
                          "score": round(float(row[i]), 4)} for rank, i in enumerate(top, 1)]

    OUT.write_text(json.dumps({"model": "stand-in (dry run)" if dry_run else MODEL, "depth": DEPTH,
                               "sections": len(sections), "pool": pool}, indent=1), encoding="utf-8")
    print(f"{len(sections)} sections, {len(queries)} queries, top {DEPTH} each -> {OUT}")


if __name__ == "__main__":
    main()
