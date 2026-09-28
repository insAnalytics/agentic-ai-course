"""Module 5 Lesson 5's PDF processing, identical to the lesson's code.

Vectors are looked up by a hash of the exact chunk text, so these functions must produce exactly
the text the browser builds. If the lesson's code changes, change this file to match and regenerate.
"""
from collections import Counter


def page_lines(page: dict) -> list[dict]:
    """Group a page's words into lines by vertical position, left to right."""
    lines = []
    for word in sorted(page["words"], key=lambda w: (round(w["top"]), w["x0"])):
        if lines and abs(lines[-1]["top"] - word["top"]) < 2:
            lines[-1]["words"].append(word)
        else:
            lines.append({"top": word["top"], "size": word["size"], "words": [word]})
    for line in lines:
        line["text"] = " ".join(w["text"] for w in line["words"])
    return lines


def inside(word: dict, bbox: list[float]) -> bool:
    x0, top, x1, bottom = bbox
    return x0 - 1 <= word["x0"] <= x1 and top - 1 <= word["top"] <= bottom


def table_as_markdown(rows: list[list[str]]) -> str:
    header, *body = rows
    lines = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    return "\n".join(lines + ["| " + " | ".join(row) + " |" for row in body])


def table_as_rows(rows: list[list[str]]) -> str:
    """Each row as its own line of 'header: value' pairs, so a row keeps its meaning on its own."""
    header, *body = rows
    return "\n\n".join("; ".join(f"{h}: {v}" for h, v in zip(header, row)) + "." for row in body)


def to_markdown(extracted: dict, render_table=table_as_markdown, margin: float = 45) -> str:
    """Rebuild a document from positioned words: drop page furniture, mark headings by size,
    rejoin wrapped lines into paragraphs, and put each table back where it was."""
    body = Counter(w["size"] for p in extracted["pages"] for w in p["words"]).most_common(1)[0][0]
    blocks = []
    for page in extracted["pages"]:
        tables = sorted(page["tables"], key=lambda t: t["bbox"][1])
        words = [w for w in page["words"] if margin < w["top"] < page["height"] - margin
                 and not any(inside(w, t["bbox"]) for t in tables)]
        items = [(line["top"], "line", line) for line in page_lines({**page, "words": words})]
        items += [(t["bbox"][1], "table", t) for t in tables]
        paragraph, last_top = [], None
        for top, kind, item in sorted(items, key=lambda i: i[0]):
            new_block = kind == "table" or item["size"] > body or (
                last_top is not None and top - last_top > 1.6 * body)
            if new_block and paragraph:
                blocks.append(" ".join(paragraph))
                paragraph = []
            if kind == "table":
                blocks.append(render_table(item["rows"]))
                last_top = item["bbox"][3]
            elif item["size"] > body:
                blocks.append(f"{'#' if item['size'] >= 1.6 * body else '##'} {item['text']}")
                last_top = top
            else:
                paragraph.append(item["text"])
                last_top = top
        if paragraph:
            blocks.append(" ".join(paragraph))
    return "\n\n".join(blocks)


def plain_text(extracted: dict) -> str:
    """What a plain extractor returns: every page's text, pages separated by a blank line."""
    return "\n\n".join(page["plain_text"] for page in extracted["pages"])


def added_chunks(document: dict, chunks: list[dict], texts: list[tuple[str, str]]) -> list[dict]:
    """Extra chunks for one document (table summaries or image descriptions), numbered after its chunks."""
    start = max((c["chunk"] for c in chunks), default=-1) + 1
    metadata = {k: v for k, v in document.items() if k != "text"}
    return [{**metadata, "section": f"{document['title']} > {label}", "chunk": start + n, "text": text}
            for n, (label, text) in enumerate(texts)]
