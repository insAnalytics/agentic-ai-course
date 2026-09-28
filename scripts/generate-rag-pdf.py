"""
Module 5 (RAG Systems), Lesson 5: the PDF corpus, its stored extraction, and embeddings.

1. Builds four registry-themed PDFs (scripts/rag_corpus/pdf/make_pdfs.py) and runs two free extractors
   over them, pypdf for plain text and pdfplumber for positioned words, tables and image positions
   (scripts/rag_corpus/pdf/extract.py). Both are stored, so the lesson works on real extractor output
   in the browser, where the extractors may not run.
2. Builds every chunk the lesson compares, with scripts/rag_pdf.py (identical to the lesson's code):
   plain extracted text, cleaned Markdown, cleaned text with tables written as rows, table summaries and
   image descriptions (model-written, from scripts/rag_corpus/pdf_corpus_src.py).
3. Embeds every distinct chunk text with bge-small (as documents) and every PDF question (with the
   retrieval instruction).

Writes public/data/rag/pdf/: extracted.json, corpus.json, the four PDFs and two images under files/,
and public/data/rag/embeddings/bge-small-en-v1.5/pdf-chunks.json and pdf-queries.json, in the same
format as the other embedding files.

Run: `pip install pypdf pdfplumber reportlab matplotlib sentence-transformers numpy`, then
`python scripts/generate-rag-pdf.py`. A few minutes on a CPU; small enough that a GPU isn't needed.
`--dry-run` uses a meaningless stand-in embedder.
"""

import base64
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rag_corpus"))
from rag_chunking import structured_chunks  # noqa: E402
import pdf_corpus_src as source  # noqa: E402
import rag_pdf  # noqa: E402

ROOT = HERE.parent
PDF_SRC = HERE / "rag_corpus" / "pdf"
OUT = ROOT / "public" / "data" / "rag" / "pdf"
EMBED = ROOT / "public" / "data" / "rag" / "embeddings" / "bge-small-en-v1.5"
BGE_INSTRUCTION = "Represent this sentence for searching relevant passages: "


def text_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def pack(vectors: np.ndarray) -> str:
    vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    return base64.b64encode(vectors.astype("<f2").tobytes()).decode("ascii")


class StandIn:
    def encode(self, texts, **_):
        return np.array([np.random.default_rng(int(text_key(t), 16) % 2**32).normal(size=384) for t in texts])


def documents(extracted: dict) -> dict:
    return {doc_id: {"doc_id": doc_id, **meta, "access": ["all-staff"], "source_type": "official"}
            for doc_id, meta in source.DOCUMENTS.items()}


def all_chunks(extracted: dict) -> list[dict]:
    """Every chunk any of the lesson's versions uses."""
    chunks = []
    for doc_id, document in documents(extracted).items():
        pages = extracted[doc_id]
        versions = {"plain": rag_pdf.plain_text(pages), "markdown": rag_pdf.to_markdown(pages),
                    "rows": rag_pdf.to_markdown(pages, rag_pdf.table_as_rows)}
        made = {name: structured_chunks({**document, "text": text}, 200) for name, text in versions.items()}
        extra = [(label, text) for d, label, text in source.SUMMARIES + source.DESCRIPTIONS if d == doc_id]
        chunks += made["plain"] + made["markdown"] + made["rows"]
        chunks += rag_pdf.added_chunks({**document, "text": versions["markdown"]}, made["markdown"], extra)
    return chunks


def main():
    dry_run = "--dry-run" in sys.argv
    subprocess.run([sys.executable, str(PDF_SRC / "make_pdfs.py")], check=True)
    subprocess.run([sys.executable, str(PDF_SRC / "extract.py")], check=True)
    extracted = json.loads((PDF_SRC / "extracted.json").read_text(encoding="utf-8"))

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "files").mkdir(exist_ok=True)
    for path in (PDF_SRC / "pdfs").iterdir():
        shutil.copy(path, OUT / "files" / path.name)
    (OUT / "extracted.json").write_text(json.dumps(extracted))
    (OUT / "corpus.json").write_text(json.dumps({
        "written_by": "Summaries and descriptions: Claude, for the course, from the rendered tables and images; "
                      "served as scripted model replies",
        "documents": documents(extracted), "summary_prompt": source.SUMMARY_PROMPT,
        "description_prompt": source.DESCRIPTION_PROMPT, "summaries": source.SUMMARIES,
        "descriptions": source.DESCRIPTIONS, "queries": source.QUERIES,
    }, indent=1, ensure_ascii=False), encoding="utf-8")

    if dry_run:
        embedder = StandIn()
    else:
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    texts = list(dict.fromkeys(c["text"] for c in all_chunks(extracted)))
    EMBED.mkdir(parents=True, exist_ok=True)
    (EMBED / "pdf-chunks.json").write_text(json.dumps({
        "model": "stand-in (dry run)" if dry_run else "BAAI/bge-small-en-v1.5", "dim": 384, "dtype": "float16",
        "normalized": True, "chunking": "pdf", "keys": [text_key(t) for t in texts],
        "vectors": pack(np.asarray(embedder.encode(texts, batch_size=32))),
    }))
    questions = [BGE_INSTRUCTION + q["query"] for q in source.QUERIES]
    (EMBED / "pdf-queries.json").write_text(json.dumps({
        "model": "stand-in (dry run)" if dry_run else "BAAI/bge-small-en-v1.5", "dim": 384, "dtype": "float16",
        "normalized": True, "keys": [q["id"] for q in source.QUERIES],
        "instructed": pack(np.asarray(embedder.encode(questions, batch_size=32))),
    }))
    print(f"{len(texts)} distinct PDF chunk texts and {len(questions)} questions embedded")


if __name__ == "__main__":
    main()
