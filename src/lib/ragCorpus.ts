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
