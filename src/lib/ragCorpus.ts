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
