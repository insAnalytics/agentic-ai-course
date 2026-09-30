# Module 6, Lesson 6 — Bookends: Stop, ask, or escalate

---

## Intro

> **You'll be able to**
> - Tell a request that's missing a choice only the user can make from one missing a fact the agent can look up, and ask one question only when it's needed
> - Choose a confidence signal that fits the decision, knowing where logprobs help and where they don't, and measure it on your own data
> - Escalate to a stronger model or a person, and keep a correct answer when a user pushes back without evidence

**Why it matters**
An agent that's never unsure is an agent that guesses. The previous lessons
built ways to notice doubt: failed checks, split votes, unsupported claims.
This one decides what to do next: ask, look something up, hand the case to
something stronger, or stop. Done well, the agent's mistakes turn into
questions and hand-offs. Done badly, it either guesses when it shouldn't or
floods people with cases they can't review.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** "Move the agent to the new model." The agent can find the target
> model in the runbook but not which agent the user means. What should it do?
> - A) Ask which agent; look up the model itself ✅
> - B) Ask the user both which agent and which model
> - C) Pick the first agent the runbook happens to list
> - D) Refuse the request until it's fully specified
>
> *Explanation: ask only for a choice only the user can make. A fact the
> agent can look up shouldn't become the user's job.*

> **Q2.** Why was the probability of an answer written after reasoning such
> a weak signal in this module's runs?
> - A) It copies a finished decision; forms split the odds ✅
> - B) The runs didn't store logprobs for the answers
> - C) Logprobs are always misleading as a signal
> - D) The answers were far too long to score at all
>
> *Explanation: by the answer line, the reasoning has decided. A wrong
> conclusion is copied out with near-certainty, and a right one written two
> ways looks unsure.*

> **Q3.** Where did logprobs work well as a signal?
> - A) On one-word verdicts, where the token decides ✅
> - B) On long free-text answers written in full
> - C) On the reasoning text written before an answer
> - D) Nowhere at all in these runs
>
> *Explanation: the judges' wrong verdicts nearly all came with under 90%
> probability, against about one right verdict in six.*

> **Q4.** What decides whether FrugalGPT's cascade accepts an answer?
> - A) A small scoring model trained on labelled answers ✅
> - B) The answering model's own stated confidence
> - C) The length of the answer the model produced
> - D) Agreement among several samples of the answer
>
> *Explanation: a learned, validated check, separate from the model being
> checked.*

> **Q5.** A 2B-to-4B cascade beat the 4B alone on accuracy but cost about
> three times the GPU time. What does that show?
> - A) A cascade pays only when its target costs far more ✅
> - B) Cascades never pay for themselves at all
> - C) The 4B was simply the wrong escalation target
> - D) Voting is always cheaper than a larger model
>
> *Explanation: five 2B samples cost more than one 4B answer. A cascade saves
> only when most requests stop at a stage much cheaper than the target.*

> **Q6.** A user insists on a different value, the model switches to it, and
> no source states it. What should the answer be?
> - A) The user's value, since both now agree on it
> - B) The original, flagged for review ✅
> - C) "unknown", since the two answers disagree
> - D) The average of the two values, to split the difference
>
> *Explanation: a change needs evidence. Agreement without a source is the
> sycophancy Sharma et al. measured, not a correction.*

> **Q7.** Module 3's gate and this lesson's escalation both send cases to a
> person. What's the difference?
> - A) One asks what the action is; the other, how sure it is ✅
> - B) They're the same check under two different names
> - C) The gate only ever applies to read actions
> - D) Escalation only ever applies to stronger models
>
> *Explanation: a risky action needs approval however sure the agent is,
> and an unsure agent needs help whatever the action. They combine.*

---

## Comprehensive sandbox
*(graded — answer, ask, escalate or stop, multi-file)*

**Task shown to learner:** `lib.py` holds the lesson's data, grading and
voting code, read-only. In `policy.py` (the entry file), write
`next_step(case, min_agreement)`. It returns what the agent should do next,
given a `case` with:

- `"ask"` and `"look_up"`: lists of what's missing (from the first concept)
- `"agreement"`: how many votes the leading answer got
- `"verified"`: `True`, `False` if a source check failed, or `None` if no
  check ran
- `"risky"`: whether acting on the answer is risky
- `"tried_stronger"`: whether a stronger model has already answered

Decide in this order:

1. Anything to ask: `"ask"`. Otherwise anything to look up: `"look_up"`.
2. The agent is unsure if fewer than `min_agreement` votes agree, or a
   source check failed. If unsure and the action is risky:
   `"escalate_person"`. If unsure and not risky: `"escalate_model"`, or
   `"stop"` if a stronger model has already tried.
3. Sure: `"confirm"` if risky, otherwise `"answer"`.

`run_policy`, already written below it, runs `next_step` on the committed
runs: Qwen3.5-2B votes first, and Qwen3.5-4B votes when escalated. When you
click Run, it reports how each case ended at two thresholds.

**Tab: `lib.py`** (read-only)
```python
"""This lesson's data, grading and voting code, for the sandbox. Read-only."""
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


def is_correct(question: dict, reply: str) -> bool:
    answer = extract_answer(reply)
    if answer is None:
        return False
    if question["type"] == "number":
        value = as_number(answer)
        return value is not None and abs(value - question["answer"]) < 1e-9
    accepted = {normalize(str(question["answer"])), *(normalize(a) for a in question["accept"])}
    return normalize(answer) in accepted


def majority_answer(replies: list[str], answer_type: str) -> dict:
    """From the previous lesson: the most common usable answer, its votes, and how many replies voted."""
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

**Tab: `policy.py`** (starter, entry file)
```python
from collections import Counter

from lib import is_correct, load_run, load_set, majority_answer


def next_step(case: dict, min_agreement: int) -> str:
    """What the agent should do next. case holds "ask" and "look_up" (lists of what's missing), "agreement"
    (how many votes the leading answer got), "verified" (True, False, or None if not checked), "risky"
    (whether acting on the answer is risky) and "tried_stronger" (whether a stronger model already answered)."""
    ...



def run_policy(small: list[dict], large: list[dict], questions: dict, k: int, min_agreement: int) -> tuple:
    """Run next_step on groups of k votes: the small model first, the large model if escalated.
    Returns how each group ended, and how many of the answered groups were right."""
    large_samples = {record["id"]: record["samples"] for record in large}
    endings, right, answered = Counter(), 0, 0
    for record in small:
        question = questions[record["id"]]
        for number, start in enumerate(range(0, len(record["samples"]) - k + 1, k)):
            groups = [record["samples"][start:start + k], large_samples[record["id"]][start:start + k]]
            for tried_stronger, group in enumerate(groups):
                vote = majority_answer([s["text"] for s in group], question["type"])
                case = {"ask": [], "look_up": [], "agreement": vote["votes"], "verified": None,
                        "risky": False, "tried_stronger": bool(tried_stronger)}
                step = next_step(case, min_agreement)
                if step != "escalate_model":
                    break
            ending = f"{step} ({'large' if tried_stronger else 'small'} model)" if step == "answer" else step
            endings[ending] += 1
            if step == "answer":
                answered += 1
                right += is_correct(question, f"ANSWER: {vote['answer']}")
    return endings, right, answered


if __name__ == "__main__":
    questions = {q["id"]: q for q in load_set("set-e")["questions"]}
    small, large = load_run("plain.smaller")["results"], load_run("plain")["results"]
    for min_agreement in (4, 5):
        endings, right, answered = run_policy(small, large, questions, 5, min_agreement)
        print(f"at least {min_agreement} of 5 agreeing: {dict(endings)}; answered right {right} of {answered}")
```

**Hidden tests:**
```python
from policy import next_step, run_policy


def case(**changes):
    base = {"ask": [], "look_up": [], "agreement": 5, "verified": None, "risky": False, "tried_stronger": False}
    base.update(changes)
    return base


def expect(step, why, min_agreement=4, **changes):
    got = next_step(case(**changes), min_agreement)
    assert got == step, f"{changes}: got {got!r}, expected {step!r}: {why}"


expect("answer", "enough agreement, nothing missing, not risky: answer")
expect("answer", "verified None means no check ran, not a failed one", verified=None)
expect("answer", "exactly min_agreement agreeing is enough", agreement=4)
expect("ask", "a choice only the user can make is missing: ask first", ask=["agent_name"], look_up=["model"])
expect("look_up", "a fact is missing: look it up before judging the answer", look_up=["model"], agreement=1)
expect("escalate_model", "too little agreement, not risky, no stronger model tried yet", agreement=3)
expect("escalate_model", "a failed source check makes the agent unsure however many votes agree", verified=False)
expect("stop", "still unsure after the stronger model, and not risky: stop rather than guess",
       agreement=2, tried_stronger=True)
expect("escalate_person", "unsure and risky: a person, straight away", agreement=2, risky=True)
expect("escalate_person", "unsure and risky, even after a stronger model", verified=False, risky=True, tried_stronger=True)
expect("confirm", "sure but risky: Module 3's gate still asks for approval", risky=True)
expect("confirm", "sure but risky, whatever model answered", risky=True, tried_stronger=True)


def s(answer):
    return {"text": f"ANSWER: {answer}", "tokens": 1}


questions = {"q": {"type": "number", "answer": 7, "accept": []}}
small = [{"id": "q", "samples": [s(7), s(7), s(7), s(8), s(9), s(7)]}]
large = [{"id": "q", "samples": [s(7), s(7), s(7), s(7), s(7), s(8)]}]
endings, right, answered = run_policy(small, large, questions, 3, 3)
assert dict(endings) == {"answer (small model)": 1, "stop": 1} and (right, answered) == (1, 1), (
    f"got {dict(endings)}, {right} of {answered}: the first small group agrees 3 of 3 and is answered; the second "
    "(8, 9, 7) escalates, the large model's second group (7, 7, 8) agrees only 2 of 3, so the agent stops")
```

**Hint (shown on request):** Return as early as possible: the two lists
first, then work out `unsure` once. Compare `verified` with `is False`, not
with `not`, since `None` means no check ran, not that one failed.

**Reference solution:**

**Tab: `policy.py`**
```python
from collections import Counter

from lib import is_correct, load_run, load_set, majority_answer


def next_step(case: dict, min_agreement: int) -> str:
    """What the agent should do next. case holds "ask" and "look_up" (lists of what's missing), "agreement"
    (how many votes the leading answer got), "verified" (True, False, or None if not checked), "risky"
    (whether acting on the answer is risky) and "tried_stronger" (whether a stronger model already answered)."""
    if case["ask"]:
        return "ask"
    if case["look_up"]:
        return "look_up"
    unsure = case["agreement"] < min_agreement or case["verified"] is False
    if unsure:
        if case["risky"]:
            return "escalate_person"
        return "stop" if case["tried_stronger"] else "escalate_model"
    return "confirm" if case["risky"] else "answer"


def run_policy(small: list[dict], large: list[dict], questions: dict, k: int, min_agreement: int) -> tuple:
    """Run next_step on groups of k votes: the small model first, the large model if escalated.
    Returns how each group ended, and how many of the answered groups were right."""
    large_samples = {record["id"]: record["samples"] for record in large}
    endings, right, answered = Counter(), 0, 0
    for record in small:
        question = questions[record["id"]]
        for number, start in enumerate(range(0, len(record["samples"]) - k + 1, k)):
            groups = [record["samples"][start:start + k], large_samples[record["id"]][start:start + k]]
            for tried_stronger, group in enumerate(groups):
                vote = majority_answer([s["text"] for s in group], question["type"])
                case = {"ask": [], "look_up": [], "agreement": vote["votes"], "verified": None,
                        "risky": False, "tried_stronger": bool(tried_stronger)}
                step = next_step(case, min_agreement)
                if step != "escalate_model":
                    break
            ending = f"{step} ({'large' if tried_stronger else 'small'} model)" if step == "answer" else step
            endings[ending] += 1
            if step == "answer":
                answered += 1
                right += is_correct(question, f"ANSWER: {vote['answer']}")
    return endings, right, answered


if __name__ == "__main__":
    questions = {q["id"]: q for q in load_set("set-e")["questions"]}
    small, large = load_run("plain.smaller")["results"], load_run("plain")["results"]
    for min_agreement in (4, 5):
        endings, right, answered = run_policy(small, large, questions, 5, min_agreement)
        print(f"at least {min_agreement} of 5 agreeing: {dict(endings)}; answered right {right} of {answered}")
```
```
at least 4 of 5 agreeing: {'answer (small model)': 311, 'answer (large model)': 25}; answered right 332 of 336
at least 5 of 5 agreeing: {'answer (small model)': 263, 'answer (large model)': 67, 'stop': 6}; answered right 329 of 330
```
*(the Run output, from the committed runs)*

**Explanation:** The order encodes the lesson. Missing information comes
first, since no confidence signal can make up for a choice the user never
made or a fact nobody looked up. A failed source check counts as doubt
however many votes agree, because agreement can't see a consistent mistake.
A risky case goes to a person when the agent is unsure, and to confirmation
when it's sure: the two gates from Module 3 and this lesson, combined. And
"stop" is a real answer: once a stronger model is also unsure, telling the
user so is better than guessing.

On the committed runs, which contain no risky actions or missing
information, the policy is the cascade from earlier in this lesson, with a stopping rule.
Requiring all five votes to agree, the 2B answered 263 cases, the 4B 67,
and 6 stopped; 329 of the 330 answers were right. The one wrong answer that
got through is a consistent mistake: unanimous, and wrong.
