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
