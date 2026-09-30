# Module 6, Lesson 5 — Concept 1: Voting on exact answers

> **Note for the site build:** this lesson's shared setup is the block below marked "defined once
> here". It reads `/data/reliability/` as Lessons 1 and 4 do. The three grading functions in it
> must stay identical to `scripts/reliability/grading.py`, which graded every stored reply.

---

## Ask several times, take the most common answer

[Lesson 1](→ this module, why agents fail lesson, the same question run twice concept)
showed that the same question, asked twice, can get different answers. If
that variation is the problem, one fix is to lean into it: ask several
times, and take the answer that comes up most often.

That's self-consistency, from Wang et al.,
[*Self-Consistency Improves Chain of Thought Reasoning in Language Models*](https://arxiv.org/abs/2203.11171)
(ICLR 2023). They sampled several reasoning paths for each question instead
of one, and took the most common final answer. The intuition is that a hard
problem can be reasoned through in many ways that reach the same correct
answer, while mistakes tend to scatter. On arithmetic and commonsense
reasoning benchmarks it improved accuracy by wide margins, including 17.9
points on GSM8K, a set of grade-school maths problems. Voting over several
calls has since become a common way to spend extra compute: Chen et al.
open their [study of it](https://arxiv.org/abs/2403.02419) (NeurIPS 2024)
by noting that many state-of-the-art results came from systems that make
several model calls and aggregate the answers.

This lesson uses the runs behind Lesson 1: Qwen3.5-2B and Qwen3.5-4B, each
answering set E's 84 questions 20 times.

```python
import json
import re
from collections import Counter
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_set(name: str) -> dict:
    """One of the built sets, such as "set-e"."""
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


# how set E replies were graded: the same code as scripts/reliability/grading.py
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
```
*(defined once here and already loaded for every demo in this lesson)*

---

## First, decide what counts as the same answer

Counting votes means deciding when two answers are the same, and the
answers don't arrive in one form:

```python
questions = {q["id"]: q for q in load_set("set-e")["questions"]}
replies = {r["id"]: r["samples"] for r in load_run("plain.smaller")["results"]}

question = questions["e73"]
print(question["wordings"][0], "| expected:", question["answer"])
print("as written:", dict(Counter(s["answer"] for s in replies["e73"])))
print("as numbers:", dict(Counter(as_number(s["answer"]) for s in replies["e73"])))
```
```
How many hours of samples does each of Prometheus's initial blocks cover? | expected: 2
as written: {'two hours': 1, '2': 17, 'two-hour blocks': 1, '2 hours': 1}
as numbers: {None: 2, 2.0: 18}
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-2B replies from the committed run.)*

"2" and "2 hours" are the same answer, and comparing them as strings would
split the vote. So votes are counted on the same rules the replies were
graded by: numbers by value, and text after `normalize` removes case,
quotes, Markdown marks and a final full stop. "Two hours" and "two-hour
blocks" have no digits, so they don't read as numbers at all; they don't
vote, just as the grader marked them wrong.

Getting this step wrong is the easiest way to make voting look worse than it
is. Whatever rule decides what counts as the same answer decides the vote.

---

## Voting on the real runs

Here's the most common answer among 3, 5 or 9 samples, compared with a
single sample:

```python
import random


def answer_key(question: dict, answer: str | None):
    """What counts as the same answer: the value for a number, the normalized text otherwise."""
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


def vote_is_correct(question: dict, samples: list[dict]) -> bool:
    """Whether the most common answer among these samples is right; ties go to the answer seen first."""
    keys = [answer_key(question, s["answer"]) for s in samples]
    counts = Counter(key for key in keys if key is not None)
    if not counts:
        return False
    winner = counts.most_common(1)[0][0]
    return next(s["correct"] for s, key in zip(samples, keys) if key == winner)


def vote_accuracy(run_name: str, k: int, draws: int = 200) -> float:
    """Accuracy of a vote over k of each question's 20 samples, averaged over random choices of the k."""
    rng = random.Random(0)
    scores = []
    for record in load_run(run_name)["results"]:
        question = questions[record["id"]]
        wins = sum(vote_is_correct(question, rng.sample(record["samples"], k)) for _ in range(draws))
        scores.append(wins / draws)
    return sum(scores) / len(scores)


for label, run_name in [("Qwen3.5-2B", "plain.smaller"), ("Qwen3.5-4B", "plain")]:
    samples = [s for record in load_run(run_name)["results"] for s in record["samples"]]
    single = sum(s["correct"] for s in samples) / len(samples)
    votes = "  ".join(f"vote of {k}: {vote_accuracy(run_name, k):.1%}" for k in (3, 5, 9))
    print(f"{label}  one sample: {single:.1%}  {votes}")
```
```
Qwen3.5-2B  one sample: 92.9%  vote of 3: 96.1%  vote of 5: 97.1%  vote of 9: 97.5%
Qwen3.5-4B  one sample: 98.9%  vote of 3: 99.5%  vote of 5: 99.7%  vote of 9: 99.9%
```
*(runs live, shows output — read-only demo snippet, not graded. The votes
are estimates, averaged over 200 random choices of k samples from each
question's 20.)*

For the 2B, a vote of five lifts accuracy from 92.9% to 97.1%. The 4B was
already right 98.9% of the time, so there was less to gain, but voting still
closed most of the gap. Each extra sample adds less than the one before.

The gain comes from the questions a model gets right most of the time but
not always. The next concept looks at them one by one, including the ones
where voting makes things worse.

---

## Applied sandbox exercise
*(graded — the majority answer among several replies)*

**Task shown to learner:** Write `majority_answer(replies, answer_type)`.
`replies` are full replies to one question, each meant to end with an
`ANSWER:` line, and `answer_type` is `"number"` or `"text"`. Use the lesson's
grading functions:

- **Read** each reply's answer with `extract_answer`. A reply with no answer
  line doesn't vote.
- **Compare** numbers by `as_number` and text by `normalize`. A number that
  can't be read, or text that normalizes to nothing, doesn't vote.
- **Pick** the answer with the most votes. If two tie, the one seen first
  wins.

Return `{"answer": ..., "votes": ..., "counted": ...}`: the winning answer as
it was first written, its number of votes, and how many replies voted. With
no votes at all, return `{"answer": None, "votes": 0, "counted": 0}`.

**Starter code:**
```python
def majority_answer(replies: list[str], answer_type: str) -> dict:
    """The most common answer across replies to one question. Numbers are compared by value, text
    after normalize(); replies with no usable answer don't vote; ties go to the answer seen first."""
    ...


samples = load_run("plain.smaller")["results"]
e73 = next(record for record in samples if record["id"] == "e73")
print(majority_answer([s["text"] for s in e73["samples"]], "number"))
```

**Hidden tests:**
```python
def reply(answer: str) -> str:
    return f"Some reasoning first.\nANSWER: {answer}"


r = majority_answer([reply("20"), reply("20.0"), reply("twenty"), reply("21"), "no answer line"], "number")
assert isinstance(r, dict) and set(r) == {"answer", "votes", "counted"}, "return {'answer': ..., 'votes': ..., 'counted': ...}"
assert r["votes"] == 2 and r["answer"] == "20", (
    f"got {r}: 20 and 20.0 are the same number, so they're one answer with 2 votes; report it as first written, '20'")
assert r["counted"] == 3, (
    f"counted {r['counted']}: 'twenty' has no digits to read and the last reply has no ANSWER line, so only 3 replies vote")

r = majority_answer([reply("`REG-1007`"), reply("reg-1007."), reply("REG-1003"), reply("**REG-1007**")], "text")
assert r == {"answer": "`REG-1007`", "votes": 3, "counted": 4}, (
    f"got {r}: text answers are compared after normalize(), so all three forms of REG-1007 are one answer")

r = majority_answer([reply("priority"), reply("standard"), reply("standard"), reply("priority")], "text")
assert r["answer"] == "priority" and r["votes"] == 2, (
    f"got {r}: a 2-2 tie goes to the answer seen first, 'priority', not to the alphabetical or last one")

r = majority_answer([reply("b"), reply("a"), reply("a"), reply("b")], "text")
assert r["answer"] == "b", f"got {r}: ties go to the answer seen first, here 'b'"

r = majority_answer([reply(""), reply("   "), "nothing here"], "text")
assert r == {"answer": None, "votes": 0, "counted": 0}, (
    f"got {r}: empty answers and replies with no ANSWER line don't vote; with no votes, return None, 0, 0")

assert majority_answer([], "number") == {"answer": None, "votes": 0, "counted": 0}, "no replies: None, 0, 0"
```

**Hint (shown on request):** A `Counter` keyed by the normalized form counts
the votes, and a dict filled with `setdefault` remembers how each form was
first written. `Counter.most_common(1)` breaks ties by the order keys were
first counted, which is exactly the rule you need.

**Reference solution:**
```python
def majority_answer(replies: list[str], answer_type: str) -> dict:
    """The most common answer across replies to one question. Numbers are compared by value, text
    after normalize(); replies with no usable answer don't vote; ties go to the answer seen first."""
    counts, first_written = Counter(), {}
    for reply in replies:
        answer = extract_answer(reply)
        if answer is None:
            continue
        key = as_number(answer) if answer_type == "number" else normalize(answer)
        if key is None or key == "":
            continue
        counts[key] += 1
        first_written.setdefault(key, answer)
    if not counts:
        return {"answer": None, "votes": 0, "counted": 0}
    winner, votes = counts.most_common(1)[0]
    return {"answer": first_written[winner], "votes": votes, "counted": sum(counts.values())}
```
```
{'answer': '2', 'votes': 18, 'counted': 18}
```
*(the starter's printout, with the reference in place)*

**Explanation:** The vote is only as good as the rule for what counts as the
same answer. Comparing raw strings would split "20" and "20.0" into two
answers, and could hand the win to a wrong answer that happened to be
written consistently. Counting only replies that give a usable answer keeps
a reply the grader couldn't read from voting for anything. A fixed tie rule
makes the vote repeatable: given the same replies, it always picks the same
answer. `Counter.most_common` keeps keys with equal counts in the order they
were first seen, so it gives that rule for free.

---

## Quiz cards

> **Q1.** What does self-consistency do differently from asking once?
> - A) It asks a larger model to check the answer
> - B) It samples several answers and takes the most common one ✅
> - C) It asks the model how confident it is
> - D) It reuses the previous answer as context
>
> *Explanation: Wang et al. sampled several reasoning paths and took the
> majority final answer. Right answers tend to agree, and mistakes tend to
> scatter, so the most common answer is right more often than a single one.*

> **Q2.** Five replies answer "2", "2 hours", "2", "two hours" and "3". What's
> the majority, counted the way this lesson counts?
> - A) "2", with 2 votes, since strings must match exactly
> - B) The number 2, with 3 votes; "two hours" doesn't vote ✅
> - C) The number 2, with 4 votes
> - D) No majority, since every reply is different
>
> *Explanation: numbers are compared by value, so "2", "2 hours" and "2" are
> one answer. "Two hours" has no digits, so it can't be read as a number and
> doesn't vote, just as the grader marked it wrong.*

> **Q3.** Why does voting help the 2B more than the 4B in these runs?
> - A) The 2B is wrong more often, so there's more to outvote ✅
> - B) Because the 4B's votes are counted by different rules
> - C) Because the 4B was run with far fewer samples per question
> - D) Because voting only ever works on smaller models
>
> *Explanation: the 4B was already right 98.9% of the time, so there was
> little left to fix. The 2B's occasional wrong answers on questions it
> usually gets right are exactly what a majority outvotes.*

> **Q4.** Why fix a tie rule, such as "the answer seen first wins"?
> - A) Because ties are the most common outcome of a vote
> - B) So the same replies always produce the same answer ✅
> - C) Because the first answer is more likely to be right
> - D) Because Python can't compare two tied counts
>
> *Explanation: without a rule, a tie could be broken differently each time,
> and the same replies could give different answers. The first-seen rule
> isn't more accurate, just repeatable.*

---

*(End of this concept. The next concept looks at voting question by
question: where it makes answers more reliable, and where it makes a wrong
answer more consistent.)*
