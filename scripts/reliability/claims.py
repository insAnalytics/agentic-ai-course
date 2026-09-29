"""
How Module 6 splits a cited answer into claims. The lesson's code is identical, so the claims a
judge saw when the data was generated are the claims the page builds.

An answer cites its sources as bracketed numbers, "[2]" or "[1, 3]", after the sentence they
support. Each sentence becomes one claim, with the numbers it cites. A citation written after the
full stop, at the start of what follows, belongs to the sentence before it.
"""

import re

CITATION = re.compile(r"\[(\d+(?:\s*,\s*\d+)*)\]")
LEADING_CITATIONS = re.compile(r"^(?:\s*\[\d+(?:\s*,\s*\d+)*\])+")
SENTENCE_BREAK = re.compile(r"(?<=[.!?])\s+")


def cited_numbers(text: str) -> set[int]:
    return {int(n) for group in CITATION.findall(text) for n in group.split(",")}


def split_claims(answer: str) -> list[dict]:
    """Each sentence of an answer, without its citation marks, and the source numbers it cites."""
    claims = []
    for sentence in SENTENCE_BREAK.split(answer.strip()):
        if claims and (leading := LEADING_CITATIONS.match(sentence)):
            claims[-1]["cites"] = sorted(set(claims[-1]["cites"]) | cited_numbers(leading.group()))
            sentence = sentence[leading.end():]
        text = " ".join(CITATION.sub("", sentence).split())
        text = re.sub(r"\s+([.,;:!?])", r"\1", text)
        if text.strip(".!? "):
            claims.append({"text": text, "cites": sorted(cited_numbers(sentence))})
    return claims
