"""
How Module 6 reads and grades a model's answer to a set E question.

The model ends its reply with a line "ANSWER: <answer>". A number is compared as a number
(the first number on that line, so "15 days" and "15" both read as 15); anything else is
compared after dropping case, surrounding quotes and Markdown marks, and a final full stop.
A reply with no ANSWER line counts as no answer, which is graded wrong.
"""

import re

MARKER = "ANSWER:"
NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def extract_answer(reply: str) -> str | None:
    """The text after the last ANSWER: marker, or None if there isn't one."""
    head, marker, tail = reply.rpartition(MARKER)
    if not marker:
        return None
    return tail.strip().splitlines()[0].strip() if tail.strip() else ""


def normalize(text: str) -> str:
    text = text.strip().strip("*_`\"'").strip().rstrip(".").strip().strip("*_`\"'")
    return " ".join(text.lower().split())


def as_number(text: str) -> float | None:
    match = NUMBER.search(text)
    return float(match.group().replace(",", "")) if match else None


def is_correct(question: dict, reply: str) -> bool:
    answer = extract_answer(reply)
    if answer is None:
        return False
    if question["type"] == "number":
        value = as_number(answer)
        return value is not None and abs(value - question["answer"]) < 1e-9
    accepted = {normalize(str(question["answer"])), *(normalize(a) for a in question["accept"])}
    return normalize(answer) in accepted
