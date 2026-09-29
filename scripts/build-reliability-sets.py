"""
Build Module 6's question sets from their hand-written sources, checked against the corpus.

    python scripts/build-reliability-sets.py

Reads public/data/rag/documents.json (Module 5's corpus) and scripts/reliability/set_e_source.py,
and writes public/data/reliability/set-e.json. No model and no GPU: it only checks and assembles.

For every question it checks that:
- each evidence quote appears in its document (whitespace-insensitive) and inside exactly one chunk
- a "step" question's `check` expression evaluates to the stated answer
- there are four distinct wordings

Each question's context is fixed: its gold chunks (the chunks holding its evidence) plus four
distractors, the chunks that score highest with BM25 against the question's original wording.
The order is shuffled with a seed taken from the question id, so the gold chunk isn't always
first. The same context is used for every wording, so only the wording varies between them.

Chunks come from Module 5's structure-aware chunker (200 tokens) with their section header, the
same text Module 5's lessons build. The pool leaves out restricted documents and D15 (the wiki
page holding Module 5's planted instruction), so that no context in this set carries it.
"""

import json
import math
import random
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "scripts" / "reliability"))

from rag_chunking import structured_chunks
from rag_context import with_header
from set_e_source import QUESTIONS

DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"
OUT = ROOT / "public" / "data" / "reliability" / "set-e.json"
DISTRACTORS = 4
EXCLUDED_DOCS = {"D15"}


def squash(text: str) -> str:
    return " ".join(text.split())


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


class BM25:
    def __init__(self, texts: list[str], k1: float = 1.5, b: float = 0.75):
        self.docs = [Counter(words(text)) for text in texts]
        self.lengths = [sum(doc.values()) for doc in self.docs]
        self.average = sum(self.lengths) / len(self.lengths)
        frequency = Counter(term for doc in self.docs for term in doc)
        n = len(self.docs)
        self.idf = {term: math.log(1 + (n - df + 0.5) / (df + 0.5)) for term, df in frequency.items()}
        self.k1, self.b = k1, b

    def scores(self, query: str) -> list[float]:
        terms = set(words(query))
        out = []
        for doc, length in zip(self.docs, self.lengths):
            norm = self.k1 * (1 - self.b + self.b * length / self.average)
            out.append(sum(self.idf[t] * doc[t] * (self.k1 + 1) / (doc[t] + norm) for t in terms if t in doc))
        return out


def main() -> None:
    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    by_id = {doc["doc_id"]: doc for doc in documents}
    pool = [
        with_header(chunk)
        for doc in documents
        if doc["access"] == ["all-staff"] and doc["doc_id"] not in EXCLUDED_DOCS and doc["text"].strip()
        for chunk in structured_chunks(doc)
    ]
    keys = [f"{chunk['doc_id']}:{chunk['chunk']}" for chunk in pool]
    index = BM25([chunk["text"] for chunk in pool])

    problems, built, seen_ids = [], [], set()
    for q in QUESTIONS:
        qid = q["id"]
        if qid in seen_ids:
            problems.append(f"{qid}: duplicate id")
        seen_ids.add(qid)
        if len(q["wordings"]) != 4 or len(set(q["wordings"])) != 4:
            problems.append(f"{qid}: needs four distinct wordings")
        if q["kind"] == "step":
            value = eval(q["check"], {"date": date, "len": len, "min": min})
            if value != q["answer"]:
                problems.append(f"{qid}: check gives {value!r}, answer is {q['answer']!r}")
        gold = []
        for doc_id, quote in q["evidence"]:
            if doc_id not in by_id or squash(quote) not in squash(by_id[doc_id]["text"]):
                problems.append(f"{qid}: quote not in {doc_id}: {quote!r}")
                continue
            holders = [i for i, chunk in enumerate(pool) if chunk["doc_id"] == doc_id and squash(quote) in squash(chunk["text"])]
            if len(holders) != 1:
                problems.append(f"{qid}: quote in {len(holders)} chunks of {doc_id}: {quote!r}")
                continue
            if holders[0] not in gold:
                gold.append(holders[0])
        scores = index.scores(q["wordings"][0])
        ranked = sorted((i for i in range(len(pool)) if i not in gold), key=lambda i: -scores[i])
        chosen = gold + ranked[:DISTRACTORS]
        random.Random(qid).shuffle(chosen)
        built.append({
            "id": qid,
            "kind": q["kind"],
            "type": q["type"],
            "answer": q["answer"],
            "accept": q.get("accept", []),
            "evidence": [{"doc_id": d, "quote": quote} for d, quote in q["evidence"]],
            "wordings": q["wordings"],
            "context": [{"key": keys[i], "gold": i in gold, "text": pool[i]["text"]} for i in chosen],
        })

    if problems:
        print("\n".join(problems))
        sys.exit(1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 2,
        "written_by": "Questions, wordings and answers written by hand in the course's content chat, checked against the corpus by this script",
        "pool": {"chunker": "structured_chunks(max_tokens=200) + with_header", "distractors": DISTRACTORS,
                 "excluded_docs": sorted(EXCLUDED_DOCS), "access": "all-staff"},
        "questions": built,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    kinds = Counter(q["kind"] for q in built)
    print(f"set E: {len(built)} questions ({kinds['lookup']} lookup, {kinds['step']} step), "
          f"{sum(len(q['wordings']) for q in built)} wordings, pool of {len(pool)} chunks -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
