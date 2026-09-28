/**
 * Module 5 (RAG) shared setup. Every Module 5 demo that reads the corpus
 * passes `dataFiles={RAG_DATA}` (fetched on first Run, see courseData.ts)
 * and appends LOAD_DOCUMENTS after COUNT_TOKENS in its setup code.
 */
export const RAG_DATA = ["rag/documents.json"];

/** Introduced in Module 5 Lesson 1 concept 1; shown there verbatim. */
export const LOAD_DOCUMENTS = String.raw`
import json
from pathlib import Path

def load_documents() -> list[dict]:
    """Every document in the corpus, with its metadata and its text as Markdown."""
    return json.loads(Path("/data/rag/documents.json").read_text(encoding="utf-8"))
`;

/**
 * Introduced in Module 5 Lesson 1 concept 4 and shown there verbatim as a
 * static block (keep the two byte-identical): heading-based sections and
 * Module 4's keyword matching, with backticks added to PUNCTUATION. Append
 * after COUNT_TOKENS + LOAD_DOCUMENTS. In graded exercises pass it (with
 * them) as `namespaceSetup`, since learner functions call `keywords` as a
 * global. `${"`"}` below is a literal backtick inside String.raw.
 */
export const SECTION_SEARCH = String.raw`
import re

# three backticks, built rather than typed, so this code can sit inside a Markdown code block
FENCE = "${"`"}" * 3

def split_sections(document: dict) -> list[dict]:
    """Split a document at its Markdown headings, ignoring '#' lines inside code blocks.
    Each section keeps the document's metadata and records the heading it sits under."""
    sections, lines, heading, in_code = [], [], document["title"], False

    def close():
        text = "\n".join(lines).strip()
        if text:
            meta = {key: value for key, value in document.items() if key != "text"}
            sections.append({**meta, "section": heading, "text": text})

    for line in document["text"].splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        if not in_code and re.match(r"#{1,6} ", line):
            close()
            lines, heading = [], line.lstrip("#").strip()
        lines.append(line)
    close()
    return sections

def load_sections() -> list[dict]:
    return [section for document in load_documents() for section in split_sections(document)]

STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "was", "it", "this", "that",
             "with", "as", "at", "by", "be", "i", "you", "my", "me", "we", "our", "please", "about", "from", "last"}
PUNCTUATION = str.maketrans({mark: " " for mark in ".,;:!?()'\"${"`"}"})

def keywords(text: str) -> set:
    """The words in text worth matching on: lowercased, punctuation removed, common and one-letter words dropped."""
    words = text.lower().translate(PUNCTUATION).split()
    return {word for word in words if len(word) > 1} - STOPWORDS
`;

/**
 * The rest of Module 5 Lesson 1's lib.py (its recap sandbox's LIB_PY holds
 * the same code): the graded KeywordIndex and the pipeline demo's
 * build_prompt. Append after SECTION_SEARCH.
 */
export const KEYWORD_INDEX = String.raw`
class KeywordIndex:
    """Sections indexed by their keywords, worked out once, when each section is added."""

    def __init__(self):
        self._entries = []

    def __len__(self) -> int:
        return len(self._entries)

    def add(self, sections: list[dict]) -> None:
        for section in sections:
            if not section.get("doc_id") or not section.get("section"):
                raise ValueError("every section needs a doc_id and a section heading, so an answer can cite it")
            self._entries.append((keywords(section["text"]), section))

    def search(self, question: str, k: int = 3) -> list[dict]:
        wanted = keywords(question)
        scored = [(len(wanted & words), section) for words, section in self._entries]
        # sorting is stable, so sections with equal scores keep the order they were added in
        ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
        return [{**section, "score": score} for score, section in ranked[:k]]

def build_prompt(question: str, passages: list[dict]) -> str:
    sources = "\n\n".join(f'<source doc="{p["doc_id"]}" section="{p["section"]}">\n{p["text"]}\n</source>'
                          for p in passages)
    return f"Answer using only these sources, and name the source you used.\n\n{sources}\n\nQuestion: {question}"
`;

/** Module 5 Lesson 2 onwards: the corpus plus the labelled queries. */
export const RAG_EVAL_DATA = ["rag/documents.json", "rag/queries.json"];

/**
 * Module 5 Lesson 2's scoring helpers, shown verbatim in concept 2 (keep
 * the two byte-identical); concept 1 uses them before concept 2 explains
 * them. Append after KEYWORD_INDEX; pass dataFiles={RAG_EVAL_DATA}.
 */
export const EVALUATION = String.raw`
import math

def load_queries() -> dict:
    """The labelled query set: main and held-out queries, each with its evidence."""
    return json.loads(Path("/data/rag/queries.json").read_text(encoding="utf-8"))

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def is_relevant(chunk: dict, span: dict) -> bool:
    """True if the chunk comes from the span's document and holds at least half of the quote, unbroken."""
    if chunk["doc_id"] != span["doc_id"]:
        return False
    text, quote = normalize(chunk["text"]), normalize(span["quote"])
    half = math.ceil(len(quote) / 2)
    return any(quote[start:start + half] in text for start in range(len(quote) - half + 1))

def answerable(results: list[dict], query: dict) -> bool:
    """True if, for every evidence group, at least one result is relevant to one of its spans."""
    return all(any(is_relevant(chunk, span) for chunk in results for span in group)
               for group in query["evidence"])
`;

/**
 * Module 5 Lesson 2 concept 3's graded exercise, reference solution
 * verbatim. Joins the lesson's setup for every page AFTER concept 3
 * (append after EVALUATION) and must never load on concept 3 itself, or
 * the exercise would start already solved.
 */
export const METRICS = String.raw`
def is_relevant_to_query(chunk: dict, query: dict) -> bool:
    return any(is_relevant(chunk, span) for group in query["evidence"] for span in group)

def precision_at_k(results: list[dict], query: dict, k: int) -> float:
    """The share of the k result slots filled by relevant chunks."""
    return sum(is_relevant_to_query(chunk, query) for chunk in results[:k]) / k

def recall_at_k(results: list[dict], query: dict, k: int) -> float:
    """The share of the answer's parts (evidence groups) found in the top k."""
    top = results[:k]
    found = [any(is_relevant(chunk, span) for chunk in top for span in group) for group in query["evidence"]]
    return sum(found) / len(found)

def reciprocal_rank(results: list[dict], query: dict, k: int) -> float:
    """1 / the position of the first relevant chunk in the top k, or 0 if there's none."""
    for position, chunk in enumerate(results[:k], 1):
        if is_relevant_to_query(chunk, query):
            return 1 / position
    return 0.0

def evaluate(search, queries: list[dict], k: int) -> dict:
    """Average each metric over the queries that have evidence. search(question, k) returns ranked chunks."""
    scored = [q for q in queries if q["evidence"]]
    totals = {"recall": 0.0, "precision": 0.0, "mrr": 0.0, "answerable": 0.0}
    for query in scored:
        results = search(query["query"], k)
        totals["recall"] += recall_at_k(results, query, k)
        totals["precision"] += precision_at_k(results, query, k)
        totals["mrr"] += reciprocal_rank(results, query, k)
        totals["answerable"] += recall_at_k(results, query, k) == 1
    return {name: round(total / len(scored), 3) for name, total in totals.items()}
`;

/**
 * Module 5 Lesson 2 concept 4's sign_test, verbatim. With METRICS it
 * completes Lesson 2's recap lib.py, which is Lesson 3's shared setup:
 * COUNT_TOKENS + LOAD_DOCUMENTS + SECTION_SEARCH + KEYWORD_INDEX +
 * EVALUATION + METRICS + SIGN_TEST.
 */
export const SIGN_TEST = String.raw`
def sign_test(gains: int, losses: int) -> float:
    """If a change made no real difference, the chance of a split at least this lopsided, either way."""
    n = gains + losses
    tail = sum(math.comb(n, i) for i in range(max(gains, losses), n + 1)) / 2 ** n
    return min(1.0, 2 * tail)
`;

/**
 * Module 5 Lesson 3 concept 2's fixed-size chunker, shown verbatim on that
 * page (keep the two byte-identical). Joins the lesson's setup from
 * concept 2 onwards: append after SIGN_TEST.
 */
export const FIXED_CHUNKS = String.raw`
CHARS_PER_TOKEN = 4

def fixed_chunks(document: dict, size: int, overlap: int = 0) -> list[dict]:
    """Cut a document every ${"`"}size${"`"} tokens (by the course's estimate). Each chunk
    starts with the last ${"`"}overlap${"`"} tokens of the one before."""
    if not 0 <= overlap < size:
        raise ValueError("overlap must be at least 0 and smaller than size")
    text = document["text"]
    width, step = size * CHARS_PER_TOKEN, (size - overlap) * CHARS_PER_TOKEN
    metadata = {key: value for key, value in document.items() if key != "text"}
    chunks = []
    for start in range(0, len(text), step):
        piece = text[start:start + width]
        if piece.strip():
            chunks.append({**metadata, "section": f"characters {start}-{start + len(piece)}", "text": piece})
        # the last window reached the end; another would only repeat its tail
        if start + width >= len(text):
            break
    return chunks
`;

/**
 * Module 5 Lesson 3 concept 3 structure-aware helpers, shown verbatim on
 * that page (keep the two byte-identical). Joins the lesson setup from
 * concept 3 onwards: append after FIXED_CHUNKS. Uses FENCE and re from
 * SECTION_SEARCH.
 */
export const STRUCTURE_HELPERS = String.raw`
def split_blocks(text: str) -> list[str]:
    """Paragraphs and whole code blocks: split at blank lines, except inside a code block."""
    blocks, lines, in_code = [], [], False
    for line in text.splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        if not line.strip() and not in_code:
            if lines:
                blocks.append("\n".join(lines))
                lines = []
        else:
            lines.append(line)
    if lines:
        blocks.append("\n".join(lines))
    return blocks

def heading_sections(document: dict) -> list[dict]:
    """Split at Markdown headings (not inside code blocks), recording each section's heading path.
    A section with nothing under its heading is dropped: its heading lives on in the paths below it."""
    sections, stack, heading, body, in_code = [], [], "", [], False

    def close():
        text = "\n".join(body).strip()
        if text:
            path = " > ".join([document["title"], *(title for _, title in stack)])
            sections.append({"heading": heading, "path": path, "body": text})

    for line in document["text"].splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        match = None if in_code else re.match(r"(#{1,6}) (.+)", line)
        if match:
            close()
            level = len(match.group(1))
            # a heading replaces any heading at its level or deeper; level 1 is the document's title
            stack = [(lvl, title) for lvl, title in stack if lvl < level]
            if level > 1:
                stack.append((level, match.group(2).strip()))
            heading, body = line, []
        else:
            body.append(line)
    close()
    return sections

def pack_lines(lines: list[str], max_tokens: int) -> list[str]:
    """Group lines into parts of at most max_tokens; a line longer than that is cut into fixed-size pieces."""
    width = max_tokens * CHARS_PER_TOKEN
    lines = [line[start:start + width] for line in lines for start in range(0, max(len(line), 1), width)]
    parts, current = [], []
    for line in lines:
        if current and count_tokens("\n".join([*current, line])) > max_tokens:
            parts.append("\n".join(current))
            current = []
        current.append(line)
    if current:
        parts.append("\n".join(current))
    return parts
`;

/**
 * Module 5 Lesson 3 concept 3 graded exercise, reference solution
 * verbatim (pack_blocks, structured_chunks). Joins the setup for every
 * page AFTER concept 3 (append after STRUCTURE_HELPERS) and must never
 * load on concept 3 itself, or the exercise would start already solved.
 * Also becomes scripts/rag_chunking.py with Lesson 4 embeddings.
 */
export const STRUCTURED_CHUNKS = String.raw`
def pack_blocks(blocks: list[str], max_tokens: int) -> list[str]:
    """Group consecutive blocks into pieces of at most max_tokens, joined by blank lines.
    A block too big on its own is split at line breaks, and a line still too big is cut every max_tokens."""
    pieces, current = [], []
    for block in blocks:
        if count_tokens(block) > max_tokens:
            parts = pack_lines(block.splitlines(), max_tokens)
        else:
            parts = [block]
        for part in parts:
            if current and count_tokens("\n\n".join([*current, part])) > max_tokens:
                pieces.append("\n\n".join(current))
                current = []
            current.append(part)
    if current:
        pieces.append("\n\n".join(current))
    return pieces

def structured_chunks(document: dict, max_tokens: int = 200) -> list[dict]:
    """Chunks that follow the document's structure: headings, then paragraphs and whole code blocks,
    each chunk starting with its section's heading and carrying the document's metadata."""
    metadata = {key: value for key, value in document.items() if key != "text"}
    chunks = []
    for section in heading_sections(document):
        heading = section["heading"]
        # the heading line and the blank line after it come out of each chunk's budget
        room = max_tokens - count_tokens(heading + "\n\n") if heading else max_tokens
        for piece in pack_blocks(split_blocks(section["body"]), room):
            text = f"{heading}\n\n{piece}" if heading else piece
            chunks.append({**metadata, "section": section["path"], "chunk": len(chunks), "text": text})
    return chunks
`;

/**
 * Module 5 Lesson 3 concept 4 within_budget, verbatim (keep identical to
 * that page and to Lesson 3 recap lib.py). Completes Lesson 3 recap
 * lib.py, which is Lesson 4 shared setup: ... + STRUCTURED_CHUNKS +
 * WITHIN_BUDGET + VECTORS.
 */
export const WITHIN_BUDGET = String.raw`
def within_budget(search, budget: int):
    """A search that returns ranked chunks until the next one would take the total over budget tokens."""
    def budgeted(question: str, k: int) -> list[dict]:
        results, used = [], 0
        for chunk in search(question, 100):
            size = count_tokens(chunk["text"])
            if used + size > budget:
                break
            results.append(chunk)
            used += size
        return results
    return budgeted
`;

/**
 * Module 5 Lesson 4 concept 1 precomputed-vector helpers (text_key,
 * vectors_for, query_vectors), shown verbatim on that page (keep the two
 * byte-identical). Imports numpy, so Pyodide loads it from the setup.
 * Vectors are looked up by a hash of the chunk text: see
 * README-embeddings.md and scripts/rag_chunking.py.
 */
export const VECTORS = String.raw`
import base64
import hashlib

import numpy as np

EMBEDDINGS = Path("/data/rag/embeddings")

def text_key(text: str) -> str:
    """How a chunk's vector is filed: the first 16 hex digits of the SHA-256 of its text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def _unpack(encoded: str, dim: int) -> np.ndarray:
    return np.frombuffer(base64.b64decode(encoded), dtype="<f2").reshape(-1, dim).astype(np.float32)

def vectors_for(chunks: list[dict], model: str = "bge-small-en-v1.5", chunking: str = "structured-200") -> np.ndarray:
    """The precomputed embedding of each chunk, one row per chunk, in the chunks' order."""
    stored = json.loads((EMBEDDINGS / model / f"{chunking}.json").read_text())
    matrix = _unpack(stored["vectors"], stored["dim"])
    rows = {key: row for row, key in enumerate(stored["keys"])}
    missing = [c for c in chunks if text_key(c["text"]) not in rows]
    if missing:
        raise KeyError(f"{len(missing)} chunks have no precomputed vector in {model}/{chunking}; "
                       f"their text differs from the text that was embedded")
    return matrix[[rows[text_key(c["text"])] for c in chunks]]

def query_vectors(model: str = "bge-small-en-v1.5", kind: str = "instructed") -> dict[str, np.ndarray]:
    """The precomputed embedding of every labelled query, by query id. kind is "instructed" or "plain"."""
    stored = json.loads((EMBEDDINGS / model / "queries.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored[kind], stored["dim"])))
`;

/** Module 5 Lesson 4 onwards: documents, labels, and bge-small vectors for structured 200-token chunks and the queries. */
export const RAG_BGE_DATA = [
  ...RAG_EVAL_DATA,
  "rag/embeddings/bge-small-en-v1.5/structured-200.json",
  "rag/embeddings/bge-small-en-v1.5/queries.json",
];

/**
 * Module 5 Lesson 4 concept 1 graded exercise, reference solution
 * verbatim (VectorIndex). Joins the setup for every page AFTER concept 1
 * (append after VECTORS) and must never load on concept 1 itself, or the
 * exercise would start already solved.
 */
export const VECTOR_INDEX = String.raw`
class VectorIndex:
    """Chunks with their embeddings, searched by cosine similarity to a query vector."""

    def __init__(self, dim: int = 384):
        self._chunks = []
        self._matrix = np.empty((0, dim), dtype=np.float32)

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict], vectors: np.ndarray) -> None:
        vectors = np.asarray(vectors, dtype=np.float32)
        if vectors.ndim != 2 or len(vectors) != len(chunks):
            raise ValueError(f"need one vector per chunk: got {len(chunks)} chunks and vectors of shape {vectors.shape}")
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
        # stored at length 1, so a dot product with a length-1 query is the cosine
        unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        self._chunks.extend(chunks)
        self._matrix = np.vstack([self._matrix, unit])

    def search(self, query_vector: np.ndarray, k: int = 3) -> list[dict]:
        query = np.asarray(query_vector, dtype=np.float32)
        scores = self._matrix @ (query / np.linalg.norm(query))
        # a stable sort keeps equal scores in the order the chunks were added
        best = np.argsort(-scores, kind="stable")[:k]
        return [{**self._chunks[row], "score": float(scores[row])} for row in best]
`;

/**
 * Module 5 Lesson 4 concept 2 helpers (meaning_search, answered_ids),
 * shown verbatim on that page (keep the two byte-identical). Joins the
 * setup from concept 2 on: append after VECTOR_INDEX, which it uses.
 */
export const MEANING_SEARCH = String.raw`
def meaning_search(chunks: list[dict], queries: list[dict], model: str = "bge-small-en-v1.5", kind: str = "instructed"):
    """search(question, k) by meaning over precomputed vectors. Works only for the labelled questions."""
    index = VectorIndex()
    index.add(chunks, vectors_for(chunks, model=model))
    vectors = query_vectors(model, kind)
    by_question = {q["query"]: vectors[q["id"]] for q in queries}
    return lambda question, k: index.search(by_question[question], k)

def answered_ids(search, queries: list[dict], k: int = 5) -> set:
    """The ids of questions with evidence whose top k results hold every part of the answer."""
    return {q["id"] for q in queries if q["evidence"] and answerable(search(q["query"], k), q)}
`;

/** RAG_BGE_DATA plus all-MiniLM-L6-v2 vectors for structured 200-token chunks and the queries. */
export const RAG_MINILM_DATA = [
  ...RAG_BGE_DATA,
  "rag/embeddings/all-MiniLM-L6-v2/structured-200.json",
  "rag/embeddings/all-MiniLM-L6-v2/queries.json",
];

/** RAG_BGE_DATA plus bge-small vectors for structured 100 and 400 and fixed 200-token chunks (Lesson 4 concept 3's chunk-size comparison). */
export const RAG_BGE_ALL_DATA = [
  ...RAG_BGE_DATA,
  "rag/embeddings/bge-small-en-v1.5/structured-100.json",
  "rag/embeddings/bge-small-en-v1.5/structured-400.json",
  "rag/embeddings/bge-small-en-v1.5/fixed-200.json",
];

/**
 * Module 5 Lesson 5 concept 2 terms (keywords as a list that keeps
 * repeats), shown verbatim on that page (keep the two byte-identical).
 * Joins the Lesson 5 setup from concept 2 on: append after MEANING_SEARCH.
 */
export const TERMS = String.raw`
def terms(text: str) -> list[str]:
    """Like keywords, but a list that keeps repeats, so each word's count in the text is known."""
    words = text.lower().translate(PUNCTUATION).split()
    return [word for word in words if len(word) > 1 and word not in STOPWORDS]
`;

/**
 * Module 5 Lesson 5 concept 2 graded exercise, reference solution
 * verbatim (BM25Index). Joins the setup for every page AFTER concept 2
 * (append after TERMS) and must never load on concept 2 itself, or the
 * exercise would start already solved.
 */
export const BM25_INDEX = String.raw`
import math
from collections import Counter

class BM25Index:
    """Chunks scored by BM25: rarity-weighted matches, saturating with repeats, normalised for length."""

    def __init__(self, k1: float = 1.2, b: float = 0.75):
        self.k1, self.b = k1, b
        self._chunks, self._counts = [], []
        self._idf, self._average_length = {}, 0.0

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict]) -> None:
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
            self._chunks.append(chunk)
            self._counts.append(Counter(terms(chunk["text"])))
        # rarity and average length describe the whole collection, so recompute them after every batch
        n = len(self._counts)
        containing = Counter(word for counts in self._counts for word in counts)
        self._idf = {word: math.log((n - df + 0.5) / (df + 0.5)) for word, df in containing.items()}
        self._average_length = sum(sum(c.values()) for c in self._counts) / n

    def score(self, question: str, row: int) -> float:
        counts = self._counts[row]
        length = sum(counts.values())
        norm = self.k1 * ((1 - self.b) + self.b * length / self._average_length)
        return sum(self._idf[word] * counts[word] / (norm + counts[word])
                   for word in set(terms(question)) if word in counts)

    def search(self, question: str, k: int = 3) -> list[dict]:
        scored = [(self.score(question, row), row) for row in range(len(self._chunks))]
        # sorting is stable, so equal scores keep the order the chunks were added in
        ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
        return [{**self._chunks[row], "score": float(score)} for score, row in ranked[:k]]
`;

/**
 * Module 5 Lesson 6 concept 1 precomputed cross-encoder scores (RERANK,
 * CrossEncoderScores), shown verbatim on that page (keep the two
 * byte-identical). Lesson 6 setup is Lesson 5 recap lib.py (... +
 * TERMS + BM25_INDEX) followed by this. Uses text_key and base64 from
 * VECTORS.
 */
export const RERANK_SCORES = String.raw`
RERANK = Path("/data/rag/rerank")

class CrossEncoderScores:
    """Precomputed cross-encoder scores for every labelled question against every chunk."""

    def __init__(self, model: str = "ms-marco-MiniLM-L6-v2", chunking: str = "structured-200"):
        stored = json.loads((RERANK / model / f"{chunking}.json").read_text())
        self.timing = stored["timing"]
        shape = (len(stored["query_keys"]), len(stored["chunk_keys"]))
        self._matrix = np.frombuffer(base64.b64decode(stored["scores"]), dtype="<f4").reshape(shape)
        self._rows = {query_id: row for row, query_id in enumerate(stored["query_keys"])}
        # identical chunk texts share a key and a score, so any one of their columns will do
        self._columns = {key: column for column, key in enumerate(stored["chunk_keys"])}

    def score(self, query_id: str, chunk: dict) -> float:
        """The cross-encoder's score for this question and chunk, read together: higher is more relevant."""
        return float(self._matrix[self._rows[query_id], self._columns[text_key(chunk["text"])]])
`;

/** RAG_BGE_DATA plus the ms-marco-MiniLM-L6-v2 cross-encoder scores (Lesson 6 onwards). */
export const RAG_RERANK_DATA = [
  ...RAG_BGE_DATA,
  "rag/rerank/ms-marco-MiniLM-L6-v2/structured-200.json",
];
