"""
Build Module 6's second set of offline data from hand-written sources, checked against the corpus.

    python scripts/build-verification-sets.py

No model and no GPU: it only checks and assembles. It writes three files to public/data/reliability/:

- set-v.json   Lesson 4. Claim-source pairs for the support check, statement pairs for the
               contradiction check, and Module 5's questions for cited drafts.
- set-f.json   Lessons 4 and 6. Questions built on a false premise, each with its true-premise twin.
- set-u.json   Lesson 6. Set E questions with a correct first answer from the plain run, and the
               pushback that follows it.

Every label comes from how the item was made (see scripts/reliability/set_v_source.py):
- support pairs: the reworded claim with its own chunk is supported; the altered claim with the
  same chunk is contradicted, so not supported; the reworded claim with a chunk from another
  document that doesn't state it (chosen by hand, OTHER_SOURCE) is not supported
- statement pairs: the fact as the document states it (the quote, or its self-contained
  `statement`) with the altered claim contradict; with the reworded claim, and with another claim
  from the same document, it's consistent

Chunks and the pool are set E's: Module 5's structure-aware chunker (200 tokens) with its section
header, all-staff documents only, and D15 left out.
"""

import importlib.util
import json
import random
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "scripts" / "reliability"))

from rag_chunking import structured_chunks
from rag_context import with_header
from set_v_source import ITEMS, OTHER_SOURCE

spec = importlib.util.spec_from_file_location("set_e_builder", ROOT / "scripts" / "build-reliability-sets.py")
set_e_builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(set_e_builder)
BM25, squash, EXCLUDED_DOCS = set_e_builder.BM25, set_e_builder.squash, set_e_builder.EXCLUDED_DOCS

DATA = ROOT / "public" / "data"
DOCUMENTS = DATA / "rag" / "documents.json"
QUERIES = DATA / "rag" / "queries.json"
SET_E = DATA / "reliability" / "set-e.json"
PLAIN_RUN = DATA / "reliability" / "runs" / "plain.json"
OUT = DATA / "reliability"

PREMISE_DISTRACTORS = 3
DRAFT_CONTEXT = 5

# Plausible wrong answers for the pushback turns: the same kind of thing as the right answer.
WRONG_TEXT = {
    "X-Registry-Key": "Authorization", "REG-1001": "REG-1002", "REG-1002": "REG-1003",
    "REG-1004": "REG-1003", "REG-1005": "REG-1002", "REG-1006": "REG-1008", "REG-1007": "REG-1010",
    "REG-1011": "REG-1009", "MON-2002": "MON-2001", "v2.6": "v2.5", "v2.5": "v2.4",
    "/agents/me": "/agents/self", "2026-10-31": "2026-12-31", "2026-03-10": "2026-04-01",
    "priority": "standard", "paused": "retired", "KEY_REVOKED": "INVALID_KEY", "offset": "page",
    "Identity": "Platform", "Search": "Identity", "Postgres": "MySQL", "claude-haiku": "claude-sonnet",
    "research-team": "support-team", "RegistryUnreachable": "AgentErrorRateHigh", "06:00": "08:00",
    "kb-search": "auth-service", "INC-2093": "INC-2067",
}
WRONG_STATUS = {429: 503, 422: 400, 503: 500}


def wrong_number(value: float) -> float:
    if value in WRONG_STATUS:
        return WRONG_STATUS[value]
    if isinstance(value, float) and not value.is_integer():
        return value * 2
    value = int(value)
    if value == 0:
        return 1
    if value <= 3:
        return value + 1
    return value * 2 if value < 50 else round(value * 1.5)


def build_pool(documents: list[dict]) -> list[dict]:
    return [
        with_header(chunk)
        for doc in documents
        if doc["access"] == ["all-staff"] and doc["doc_id"] not in EXCLUDED_DOCS and doc["text"].strip()
        for chunk in structured_chunks(doc)
    ]


def main() -> None:
    documents = json.loads(DOCUMENTS.read_text(encoding="utf-8"))
    by_id = {doc["doc_id"]: doc for doc in documents}
    pool = build_pool(documents)
    keys = [f"{chunk['doc_id']}:{chunk['chunk']}" for chunk in pool]
    index = BM25([chunk["text"] for chunk in pool])
    problems = []

    def holder(doc_id: str, quote: str, where: str) -> int | None:
        if doc_id not in by_id or squash(quote) not in squash(by_id[doc_id]["text"]):
            problems.append(f"{where}: quote not in {doc_id}: {quote!r}")
            return None
        found = [i for i, chunk in enumerate(pool) if chunk["doc_id"] == doc_id and squash(quote) in squash(chunk["text"])]
        if len(found) != 1:
            problems.append(f"{where}: quote in {len(found)} pool chunks of {doc_id}: {quote!r}")
            return None
        return found[0]

    def source(i: int) -> dict:
        return {"key": keys[i], "text": pool[i]["text"]}

    # support pairs and statement pairs
    ids = [item["id"] for item in ITEMS]
    if len(ids) != len(set(ids)):
        problems.append("duplicate item ids")
    gold = {item["id"]: holder(item["doc_id"], item["quote"], item["id"]) for item in ITEMS}
    support, statements = [], []
    for position, item in enumerate(ITEMS):
        g = gold[item["id"]]
        if g is None:
            continue
        for field in ("claim", "altered", "true_premise", "false_premise", "ask"):
            if not item[field].strip():
                problems.append(f"{item['id']}: empty {field}")
        other_key = OTHER_SOURCE.get(item["id"])
        if other_key not in keys or other_key.rsplit(":", 1)[0] == item["doc_id"]:
            problems.append(f"{item['id']}: other source {other_key!r} isn't a pool chunk from another document")
            continue
        negative = keys.index(other_key)
        support += [
            {"id": f"{item['id']}-restated", "item": item["id"], "kind": "restated", "claim": item["claim"],
             "source": source(g), "label": "supported"},
            {"id": f"{item['id']}-altered", "item": item["id"], "kind": "altered", "claim": item["altered"],
             "source": source(g), "label": "not_supported"},
            {"id": f"{item['id']}-other-source", "item": item["id"], "kind": "other_source", "claim": item["claim"],
             "source": source(negative), "label": "not_supported"},
        ]
        same_doc = [other for other in ITEMS if other["doc_id"] == item["doc_id"] and other["id"] != item["id"]]
        if not same_doc:
            problems.append(f"{item['id']}: no other item from {item['doc_id']} for a compatible pair")
            continue
        later = [other for other in same_doc if ITEMS.index(other) > position]
        partner = (later or same_doc)[0]
        fact = item.get("statement") or squash(item["quote"])
        statements += [
            {"id": f"{item['id']}-altered", "item": item["id"], "kind": "altered",
             "a": fact, "b": item["altered"], "label": "contradict"},
            {"id": f"{item['id']}-reworded", "item": item["id"], "kind": "reworded",
             "a": fact, "b": item["claim"], "label": "consistent"},
            {"id": f"{item['id']}-compatible", "item": item["id"], "kind": "compatible", "partner": partner["id"],
             "a": fact, "b": partner["claim"], "label": "consistent"},
        ]

    # false-premise questions and their true-premise twins, sharing one context
    premises = []
    for item in ITEMS:
        g = gold[item["id"]]
        if g is None:
            continue
        true_q = f"Since {item['true_premise']}, {item['ask']}"
        false_q = f"Since {item['false_premise']}, {item['ask']}"
        scores = index.scores(true_q)
        ranked = sorted((i for i in range(len(pool)) if i != g), key=lambda i: -scores[i])
        chosen = [g] + ranked[:PREMISE_DISTRACTORS]
        random.Random(item["id"]).shuffle(chosen)
        context = [{**source(i), "gold": i == g} for i in chosen]
        premises += [
            {"id": f"{item['id']}-true", "item": item["id"], "premise": "true", "question": true_q, "context": context},
            {"id": f"{item['id']}-false", "item": item["id"], "premise": "false", "question": false_q,
             "context": context, "altered": item["altered"]},
        ]

    # Module 5's questions, for cited drafts
    queries = json.loads(QUERIES.read_text(encoding="utf-8"))
    drafts = []
    for q in queries["main"]:
        if not q.get("answer") or not q.get("evidence"):
            continue
        quotes = [e for group in q["evidence"] for e in group]
        if any(e["doc_id"] not in by_id or by_id[e["doc_id"]]["access"] != ["all-staff"] or e["doc_id"] in EXCLUDED_DOCS
               for e in quotes):
            continue
        golds = []
        for e in quotes:
            found = [i for i, chunk in enumerate(pool) if chunk["doc_id"] == e["doc_id"] and squash(e["quote"]) in squash(chunk["text"])]
            if len(found) != 1:
                problems.append(f"draft {q['id']}: quote in {len(found)} pool chunks: {e['quote']!r}")
                break
            if found[0] not in golds:
                golds.append(found[0])
        else:
            scores = index.scores(q["query"])
            ranked = sorted((i for i in range(len(pool)) if i not in golds), key=lambda i: -scores[i])
            chosen = golds + ranked[:max(0, DRAFT_CONTEXT - len(golds))]
            random.Random(q["id"]).shuffle(chosen)
            drafts.append({"id": q["id"], "type": q["type"], "question": q["query"], "reference": q["answer"],
                           "context": [{**source(i), "gold": i in golds} for i in chosen]})

    # pushback on set E, after a correct first answer from the plain run
    set_e = {q["id"]: q for q in json.loads(SET_E.read_text(encoding="utf-8"))["questions"]}
    plain = json.loads(PLAIN_RUN.read_text(encoding="utf-8"))
    pushback = []
    for result in plain["results"]:
        q = set_e[result["id"]]
        first = next((s for s in result["samples"] if s["correct"]), None)
        if first is None:
            continue
        if q["type"] == "number":
            wrong = wrong_number(q["answer"])
            wrong_text = str(int(wrong)) if float(wrong).is_integer() else str(wrong)
        elif q["answer"] in WRONG_TEXT:
            wrong_text = WRONG_TEXT[q["answer"]]
        else:
            problems.append(f"pushback {q['id']}: no wrong answer for {q['answer']!r}")
            continue
        pushback.append({"id": q["id"], "answer": q["answer"], "type": q["type"], "accept": q["accept"],
                         "wrong": wrong_text, "first_reply": first["text"], "first_seed": result["seed"]})

    if problems:
        print("\n".join(problems))
        sys.exit(1)

    written_by = ("Items written by hand in the course's content chat (scripts/reliability/set_v_source.py); "
                  "labels follow from how each pair was built, checked against the corpus by this script")
    pool_note = {"chunker": "structured_chunks(max_tokens=200) + with_header", "access": "all-staff",
                 "excluded_docs": sorted(EXCLUDED_DOCS)}
    files = {
        "set-v.json": {"version": 1, "written_by": written_by, "pool": pool_note,
                       "support_pairs": support, "statement_pairs": statements, "draft_questions": drafts},
        "set-f.json": {"version": 1, "written_by": written_by, "pool": pool_note,
                       "distractors": PREMISE_DISTRACTORS, "questions": premises},
        "set-u.json": {"version": 1,
                       "written_by": "Set E questions with the first correct reply from runs/plain.json; wrong answers chosen by this script's rules",
                       "questions": pushback},
    }
    for name, payload in files.items():
        (OUT / name).write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"set V: {len(support)} support pairs {dict(Counter(p['label'] for p in support))}, "
          f"{len(statements)} statement pairs {dict(Counter(p['label'] for p in statements))}, "
          f"{len(drafts)} draft questions")
    print(f"set F: {len(premises)} questions ({len(premises) // 2} false-premise, {len(premises) // 2} true-premise)")
    print(f"set U: {len(pushback)} pushback questions (of {len(plain['results'])} in set E)")


if __name__ == "__main__":
    main()
