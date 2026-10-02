# Model Graders

> **Note for the site build:** the comprehensive sandbox has two files: `lib.py` (read-only: this lesson's `parse_verdict`, the last lesson's `unsupported_citations`, and a loader) and `question_grader.py` (the entry file). It reads `question-runs.json` from `/data/eval/judges` (new script `scripts/eval/question_runs.py`, in the zip with this file: run it, check the output matches the copy in the zip, and commit both), for Run and the hidden tests.

> **You'll be able to**
> - Decide which parts of a run need a model grader, and write a rubric for one failure: pass/fail, with reasoning first, examples from real runs and a way out
> - Choose between pass/fail, a score and a pairwise comparison, and run pairs in both orders to measure position bias
> - Grade answers for correctness and relevance, define RAGAS answer correctness, and combine code checks with judges so each decides only what it can

**Why it matters**
Some of the failures that matter most can't be seen by code: advice to turn authentication off, a report of a change that never happened, a right answer worded differently. A model can read for those, and on this module's runs it found them where every code check had passed. But a judge is a measurement with its own errors: it follows its rubric into wrong verdicts, favours a position, and agrees with confidence it hasn't earned. This lesson builds judges worth trusting, and the next one checks whether they are.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Module 6's model checks decided what the agent did next. When a model grades a run afterwards, what does a wrong verdict change?
> - What you believe of the agent ✅
> - What the agent does next
> - How fast the agent responds
> - Which tools the agent can call
>
> *Explanation: A grader runs after the run, so its mistakes don't change the agent's behaviour. They change the evaluation: a pass rate, a comparison, a decision based on them. That's why a judge is measured against people before its numbers are trusted.*

> **Q2.** Every planted-instruction run with a code check passed it; both judges failed nearly all of them. Why couldn't the code checks see the failure?
> - The advice was in the reply, unseen ✅
> - The registry rejected the change
> - The judges were shown the wrong runs
> - The tasks had no reference answers
>
> *Explanation: The code checks confirmed the registry didn't change, which was true. The failure was the agent telling users to set REGISTRY_AUTH=off, which only a grader that reads the reply could see.*

> **Q3.** Neither judge answered UNCLEAR on any of the reply-failure runs. What can't you conclude from that?
> - That every verdict was sure ✅
> - That the rubric offered a way out
> - That the judge read every reply
> - That the format was followed
>
> *Explanation: The way out was in every rubric, and the judges still never used it. A judge that always commits isn't thereby always right: on the broken-result rubric the two judges split on 9 of 20 runs while sounding equally sure.*

> **Q4.** On b/a13/1, one judge failed the reply and the other passed it, describing it the same way. What hadn't the standard decided?
> - An honest report, explained away ✅
> - Whether the change was really lost
> - What the registry showed at the end
> - Which judge saw the email it sent
>
> *Explanation: The reply told the user the record still showed the old model, then said the change would apply at the next session. Whether that passes is a decision for the standard; until it's made, judges and people will split on it.*

> **Q5.** Shown each pair in both orders, Qwen chose different answers for the same pair a third of the time. What does that show about those choices?
> - Its choice followed the slot ✅
> - It preferred the longer answer
> - It saw different answers
> - It tied most comparisons
>
> *Explanation: In a flipped pair the judge picked whichever answer came first, or whichever came second, both times. Its preference was about position, not content, which is why pairs are always shown both ways.*

> **Q6.** Both judges also scored 96 answers from 1 to 5. What did that show?
> - It rarely used the middle ✅
> - It used every score evenly
> - It disagreed with pass/fail
> - It gave every answer a 3
>
> *Explanation: Every 4 and 5 was a pass and nearly every 1 and 2 a fail, so the scale mostly restated pass/fail. The few 3s were where the judges disagreed with each other.*

> **Q7.** The relevance judge passed runs the step limit had stopped before any answer. What's the best fix?
> - Decide it in code first ✅
> - Switch the main judge to Qwen
> - Lengthen the relevance rubric
> - Remove the step limit
>
> *Explanation: Whether a run ended without an answer is exact, and code can tell. Failing those runs before any judge sees them removes the error without relying on a judge's reading of a stop note.*

> **Q8.** What would it take to validate the premise judge on set F?
> - People's labels on its question ✅
> - Agreement with the marker line
> - A longer reasoning section first
> - A judge from the agent's family
>
> *Explanation: The marker was the measure that was wrong, and Module 6's labelled 30 contained nothing the judge failed. A sample labelled by people on the premise question, across passes and fails, is what Lesson 7 uses.*

---

## Comprehensive sandbox

*(graded — grade a question run with code checks first and two judges after, and report the results honestly)*

**Task shown to learner:**

`lib.py` holds `parse_verdict` (this lesson's exercise), `unsupported_citations` (the last lesson's) and `load_question_runs`, which loads 96 real runs of Module 5's questions. Each run has `"answer"`, `"retrieved"` (the source ids its tools returned), `"no_answer"` (true if the step limit stopped it before any answer), and Gemma 4 31B's `"correctness_reply"` and `"relevance_reply"`. In `question_grader.py` (the entry file), write:

- **`grade_run(run)`**, returning `(grade, reason)`, with `grade` one of `"pass"`, `"fail"` or `"undecided"`. Check, in this order:
  1. **No answer:** fail, with a reason that mentions the answer.
  2. **Citations:** fail if `unsupported_citations` finds any, naming them in the reason.
  3. **The judges:** fail if either judge's verdict is fail; otherwise undecided if either didn't decide (UNCLEAR, or no verdict); otherwise pass.
- **`report(grades)`**: counts of `"pass"`, `"fail"` and `"undecided"`, and `"pass_rate"` over the decided runs only, or `None` if none were decided.

Click Run to grade the 96 runs.

**Tab: `lib.py`** (read-only)
```python
"""Code from this lesson and the last. Read-only."""

import json
import re
from pathlib import Path

JUDGES = Path("/data/eval/judges")


def load_question_runs() -> list[dict]:
    """96 runs of Module 5's dev questions, each with its answer, the source ids its tools returned, whether it
    ended without an answer, and Gemma 4 31B's correctness and relevance replies."""
    return json.loads((JUDGES / "question-runs.json").read_text(encoding="utf-8"))["runs"]


VERDICT = re.compile(r"^\W*verdict\W*:\W*(pass|fail|unclear)\b", re.IGNORECASE | re.MULTILINE)


def parse_verdict(reply: str) -> str | None:
    """The judge's verdict: the last "Verdict:" line's PASS, FAIL or UNCLEAR, lower-cased, or None if there isn't one."""
    found = VERDICT.findall(reply)
    return found[-1].lower() if found else None


def summarize(replies: list[str]) -> dict:
    """Counts of each verdict, replies with no verdict, and the pass rate among the runs the judge decided."""
    counts = {"pass": 0, "fail": 0, "unclear": 0, "unparsed": 0}
    for reply in replies:
        counts[parse_verdict(reply) or "unparsed"] += 1
    decided = counts["pass"] + counts["fail"]
    return {**counts, "pass_rate": counts["pass"] / decided if decided else None}


SOURCE_ID = r"[\w./-]+:\d+"


def cited_ids(answer: str) -> set[str]:
    """Every source id the answer cites: inside square brackets, one or more separated by commas, or alone in
    parentheses, which includes the target of a markdown link, "[text](id)"."""
    ids = set()
    for inside in re.findall(r"\[([^\[\]]+)\]", answer):
        for part in inside.split(","):
            if re.fullmatch(SOURCE_ID, part.strip()):
                ids.add(part.strip())
    ids |= set(re.findall(rf"\(({SOURCE_ID})\)", answer))
    return ids


def unsupported_citations(answer: str, retrieved: list[str]) -> list[str]:
    """The ids the answer cites that no tool returned in the run, sorted."""
    return sorted(cited_ids(answer) - set(retrieved))
```

**Tab: `question_grader.py`** (starter, entry file)
```python
from lib import load_question_runs, parse_verdict, unsupported_citations


def grade_run(run: dict) -> tuple[str, str]:
    """One run's grade, "pass", "fail" or "undecided", and the reason: code first, then the judges."""
    # your code here


def report(grades: list[tuple[str, str]]) -> dict:
    """How many runs passed, failed and were undecided, and the pass rate among the runs that were decided."""
    # your code here


if __name__ == "__main__":
    from collections import Counter
    grades = [grade_run(run) or ("undecided", "not written yet") for run in load_question_runs()]
    print(report(grades))
    reasons = Counter("cites a source no tool returned" if reason.startswith("cites") else reason
                      for grade, reason in grades if grade == "fail")
    for reason, n in reasons.most_common():
        print(f"  {n:>2}  {reason}")
```

**Hidden tests:**
```python
from lib import load_question_runs
from question_grader import grade_run, report

PASS, FAIL, UNCLEAR = "Reasoning: fine.\nVerdict: PASS", "Reasoning: wrong.\nVerdict: FAIL", "Reasoning: can't tell.\nVerdict: UNCLEAR"


def run(answer="The tier is priority [D01:7].", retrieved=("D01:7",), no_answer=False, correctness=PASS, relevance=PASS):
    return {"answer": answer, "retrieved": list(retrieved), "no_answer": no_answer,
            "correctness_reply": correctness, "relevance_reply": relevance}


got = grade_run(run())
assert got is not None, "grade_run should return a (grade, reason) tuple"
assert got[0] == "pass", f"a run every check passes is a pass, got {got}"
got = grade_run(run(answer="stopped after 10 steps without an answer", retrieved=(), no_answer=True))
assert got[0] == "fail" and "answer" in got[1], f"a run with no answer fails in code, whatever the judges said: got {got}"
got = grade_run(run(answer="The tier is priority [D07:4].", correctness=PASS))
assert got[0] == "fail" and "D07:4" in got[1], f"a citation no tool returned fails in code, and the reason names it: got {got}"
assert grade_run(run(correctness=FAIL))[0] == "fail", "a correctness fail is a fail"
assert grade_run(run(relevance=FAIL))[0] == "fail", "a relevance fail is a fail"
assert grade_run(run(correctness=UNCLEAR))[0] == "undecided", "an UNCLEAR verdict, with nothing failed, is undecided"
assert grade_run(run(relevance="Reasoning: cut off"))[0] == "undecided", "a reply with no verdict, with nothing failed, is undecided"
assert grade_run(run(correctness=FAIL, relevance=UNCLEAR))[0] == "fail", "a fail from one judge decides it even if the other didn't decide"
got = grade_run(run(answer="stopped after 10 steps without an answer", retrieved=(), no_answer=True, correctness=UNCLEAR))
assert got[0] == "fail", f"the code check for no answer comes before the judges: an undecided judge can't rescue it, got {got}"
got = grade_run(run(answer="stopped after 10 steps without an answer", retrieved=(), no_answer=True, correctness=FAIL))
assert "answer" in got[1], f"when code decides, the reason is code's, not a judge's: got {got}"

result = report([("pass", ""), ("fail", ""), ("fail", ""), ("undecided", "")])
assert result is not None, "report should return a dict"
assert {k: result.get(k) for k in ("pass", "fail", "undecided")} == {"pass": 1, "fail": 2, "undecided": 1}, f"the counts: got {result}"
assert abs(result["pass_rate"] - 1 / 3) < 1e-9, f"the pass rate is over the decided runs only, 1 of 3: got {result['pass_rate']}"
assert report([("undecided", "")])["pass_rate"] is None, "with nothing decided, the pass rate is None"

real = report([grade_run(r) for r in load_question_runs()])
assert (real["pass"], real["fail"], real["undecided"]) == (68, 28, 0), f"on the 96 real runs: 68 pass, 28 fail, got {real}"
```

**Hint (shown on request):** Return as soon as a check decides the grade, in the order given. For the judges, parse both replies first, then look for a fail before looking for anything undecided: a fail from one judge decides the run even if the other didn't commit.

**Reference solution:**

**Tab: `question_grader.py`**
```python
from lib import load_question_runs, parse_verdict, unsupported_citations


def grade_run(run: dict) -> tuple[str, str]:
    """One run's grade, "pass", "fail" or "undecided", and the reason: code first, then the judges."""
    if run["no_answer"]:
        return "fail", "no answer"
    unsupported = unsupported_citations(run["answer"], run["retrieved"])
    if unsupported:
        return "fail", f"cites {', '.join(unsupported)}, which no tool returned"
    verdicts = {name: parse_verdict(run[f"{name}_reply"]) for name in ("correctness", "relevance")}
    failed = [name for name, verdict in verdicts.items() if verdict == "fail"]
    if failed:
        return "fail", f"the {' and '.join(failed)} judge failed it"
    if any(verdict != "pass" for verdict in verdicts.values()):
        return "undecided", "a judge didn't decide"
    return "pass", "every check passed"


def report(grades: list[tuple[str, str]]) -> dict:
    """How many runs passed, failed and were undecided, and the pass rate among the runs that were decided."""
    counts = {"pass": 0, "fail": 0, "undecided": 0}
    for grade, _ in grades:
        counts[grade] += 1
    decided = counts["pass"] + counts["fail"]
    return {**counts, "pass_rate": counts["pass"] / decided if decided else None}


if __name__ == "__main__":
    from collections import Counter
    grades = [grade_run(run) for run in load_question_runs()]
    print(report(grades))
    reasons = Counter("cites a source no tool returned" if reason.startswith("cites") else reason
                      for grade, reason in grades if grade == "fail")
    for reason, n in reasons.most_common():
        print(f"  {n:>2}  {reason}")
```
```
{'pass': 68, 'fail': 28, 'undecided': 0, 'pass_rate': 0.7083333333333334}
  12  the correctness judge failed it
  12  cites a source no tool returned
   4  no answer
```

**Explanation:** The order is the lesson. Code decides first, because what it can decide it decides exactly: a run with no answer fails without asking a judge that has been seen to pass non-answers, and a citation no tool returned fails without asking anyone. The judges decide only what needs reading, and a fail from either is enough. A run is undecided only when nothing failed and some judge didn't commit, and it's reported, not folded into the rate. On the 96 real runs, the code checks fail 16 and the correctness judge 12 more, and no run is left undecided, which, as concept 2 found, is because Gemma never answered UNCLEAR, not because every verdict is right. Whether these 68 passes and 28 fails match what a person would say is Lesson 7's question.
