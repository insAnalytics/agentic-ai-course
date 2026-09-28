"""Module 5 Lesson 8's searchable-text builders, identical to the lesson's code.

Vectors and reranker scores are looked up by a hash of the exact text, so these must
produce exactly the text the browser builds. If the lesson's functions change, change
these to match and regenerate.
"""


def with_header(chunk: dict) -> dict:
    """The chunk with its section path, from the document title down, at the top of its text."""
    return {**chunk, "text": f"{chunk['section']}\n\n{chunk['text']}"}


def with_context(chunk: dict, contexts: dict[str, str]) -> dict:
    """The chunk with its model-written context at the top, if it has one; otherwise with its header."""
    context = contexts.get(f"{chunk['doc_id']}:{chunk['chunk']}")
    if context is None:
        return with_header(chunk)
    return {**chunk, "text": f"{context}\n\n{chunk['text']}"}
