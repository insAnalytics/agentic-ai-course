# Module 7, Lesson 6 — Concept 4: Is the answer right? Correctness and relevance

> **Note for the site build:**
> - `scripts/eval/judge_digest.py` (updated, in the zip with this file) now adds each question run's kind and whether it ended without an answer to `digest.json`. Run it, check both outputs match the copies in the zip, and commit them. Earlier pages' demos give the same output with the new file.
> - The first demo defines `judges`; carry it into the second demo's hidden setup.

---

## Measuring the answer itself

Module 5 measured retrieval in detail: whether the right sections came back, and in what order. It left the answers themselves unmeasured, and [said where that would happen](→ Module 5, the a retrieval system for a new corpus lesson, the where the module leaves off concept): whether an answer is correct, faithful to its sources, and answers what was asked, judged by a model and checked against people. When Module 5 [reported an agent with keyword tools](→ Module 5, the retrieval as a tool lesson, the keyword tools against the full pipeline concept, what two recent papers found) reaching 91.5% of a pipeline's "answer correctness", that was a RAGAS score, a number this course hadn't defined. This concept defines it, and then grades the registry agent's answers a different way.

Faithfulness to the sources is covered already, in two places: [Module 6's support check](→ Module 6, the verifying an answer against its sources lesson, the checking each claim against the source it cites concept) judges whether a source supports a claim, and Lesson 5's citation check confirms that every cited source was actually returned. This concept is about the other two: is the answer right, and does it answer the question?

---

## RAGAS answer correctness

RAGAS is an open-source library for evaluating retrieval-augmented answers. Its documentation defines answer correctness in two parts:

- **The factual part.** A model breaks both the answer and the reference answer into short statements and sorts them: statements in both are true positives (TP), statements only in the answer are false positives (FP), and statements only in the reference are false negatives (FN). The score is TP / (TP + ½ × (FP + FN)).
- **The similarity part.** How close the two answers are in meaning, measured with embeddings.

The final score weights the two, 0.75 for the factual part and 0.25 for the similarity by default. The result is a number between 0 and 1, and the two model steps behind it, splitting text into statements and judging which match, each add their own errors.

---

## Applied sandbox exercise
*(graded — RAGAS's answer correctness, from the statements a model would extract)*

**Task shown to learner:**

Suppose a model has already split the answer and the reference into statements, and matching statements are written identically, so each side is a set of strings. Write:

- `factual_correctness(answer_facts, reference_facts)`: TP / (TP + 0.5 × (FP + FN)), where TP is the statements in both sets, FP those only in the answer and FN those only in the reference. If both sets are empty, return `1.0`: there was nothing to state, and nothing was stated wrongly.
- `answer_correctness(answer_facts, reference_facts, similarity, weight=0.75)`: `weight` times the factual part, plus `1 - weight` times `similarity`.

**Starter code:**
```python
def factual_correctness(answer_facts: set[str], reference_facts: set[str]) -> float:
    """RAGAS's factual part: true positives over true positives plus half the false positives and false negatives."""
    # your code here


def answer_correctness(answer_facts: set[str], reference_facts: set[str], similarity: float, weight: float = 0.75) -> float:
    """RAGAS's answer correctness: the factual part and the answers' similarity, weighted (0.75 and 0.25 by default)."""
    # your code here


reference = {"error rate above 5%", "for 15 minutes", "pages on-call"}
answer = {"error rate above 5%", "for 15 minutes", "opens a ticket"}
print(answer_correctness(answer, reference, similarity=0.9))
```

**Hidden tests:**
```python
reference = {"error rate above 5%", "for 15 minutes", "pages on-call"}
got = factual_correctness(reference, reference)
assert got is not None, "factual_correctness should return a number"
assert got == 1.0, f"an answer with exactly the reference's facts scores 1.0, got {got}"
assert factual_correctness({"opens a ticket"}, reference) == 0.0, "no shared facts: 0.0"
got = factual_correctness({"error rate above 5%", "for 15 minutes"}, reference)
assert abs(got - 2 / 2.5) < 1e-9, f"2 shared, 0 extra, 1 missing: 2 / (2 + 0.5 * 1) = 0.8, got {got}"
got = factual_correctness({"error rate above 5%", "for 15 minutes", "pages on-call", "opens a ticket"}, reference)
assert abs(got - 3 / 3.5) < 1e-9, f"an extra fact counts against the answer as much as a missing one: 3 / 3.5, got {got}"
got = factual_correctness({"error rate above 5%", "for 15 minutes", "opens a ticket"}, reference)
assert abs(got - 2 / 3) < 1e-9, f"2 shared, 1 extra, 1 missing: 2 / (2 + 0.5 * 2), got {got}"
assert factual_correctness(set(), set()) == 1.0, "nothing to state and nothing stated: nothing is wrong, so 1.0, not an error"

got = answer_correctness({"error rate above 5%", "for 15 minutes", "opens a ticket"}, reference, similarity=0.9)
assert abs(got - (0.75 * 2 / 3 + 0.25 * 0.9)) < 1e-9, f"0.75 x factual + 0.25 x similarity by default, got {got}"
got = answer_correctness({"error rate above 5%"}, reference, similarity=0.2, weight=0.5)
assert abs(got - (0.5 * 0.5 + 0.5 * 0.2)) < 1e-9, f"the weight is a parameter: 0.5 x 0.5 + 0.5 x 0.2, got {got}"
```

**Hint (shown on request):** Set operations give the three counts directly: `&` for the statements in both, and `-` for each side's extras. Guard the division for the case where all three counts are zero.

**Reference solution:**
```python
def factual_correctness(answer_facts: set[str], reference_facts: set[str]) -> float:
    """RAGAS's factual part: true positives over true positives plus half the false positives and false negatives."""
    tp = len(answer_facts & reference_facts)
    fp = len(answer_facts - reference_facts)
    fn = len(reference_facts - answer_facts)
    return tp / (tp + 0.5 * (fp + fn)) if tp + fp + fn else 1.0


def answer_correctness(answer_facts: set[str], reference_facts: set[str], similarity: float, weight: float = 0.75) -> float:
    """RAGAS's answer correctness: the factual part and the answers' similarity, weighted (0.75 and 0.25 by default)."""
    return weight * factual_correctness(answer_facts, reference_facts) + (1 - weight) * similarity


reference = {"error rate above 5%", "for 15 minutes", "pages on-call"}
answer = {"error rate above 5%", "for 15 minutes", "opens a ticket"}
print(answer_correctness(answer, reference, similarity=0.9))
```
```
0.725
```

**Explanation:** The factual part is the F1 score in another form: TP / (TP + ½(FP + FN)) equals 2TP / (2TP + FP + FN). So an extra statement costs exactly as much as a missing one, which suits a definition of "correct" that means "the same facts, no more and no fewer". In the example, the answer has two of the reference's three facts and one of its own, so the factual part is 2 / 3, and the similarity lifts the total to 0.725. That's the weakness of a continuous score for a question with one right answer: an answer that sends the alert to the wrong place still scores 0.725, and a threshold has to be chosen somewhere to call it wrong.

---

## The answers, judged

This module grades correctness with a pass/fail judge instead, comparing each answer with Module 5's reference answer:

- **One decision, one model step.** No statement splitting and no embeddings, so there's one judge to check against people instead of two.
- **The threshold is in the rubric, in words.** An answer passes if it gives the reference's essential facts and contradicts nothing. Extra correct detail is fine, which differs from RAGAS, where it counts against the answer.
- **Unanswerable questions have a right answer too.** When the reference says the documents don't answer the question, the answer passes only if it says so.

Here are both judges on every dev run of Module 5's questions:

```python
import json
from pathlib import Path

JUDGES = Path("/data/eval/judges")


def load_digest() -> dict:
    """Every phase 3 judge decision, by judge: gemma (Gemma 4 31B) and qwen9b (Qwen3.5-9B)."""
    return json.loads((JUDGES / "digest.json").read_text(encoding="utf-8"))["judges"]
```
*(defined once at the start of this lesson and already loaded)*

```python
from collections import Counter

judges = load_digest()
verdicts = {judge: {r["trial_id"]: r["decision"] for r in run["results"] if r["kind"] == "correctness" and r["split"] == "dev"}
            for judge, run in judges.items()}
for judge, by_run in verdicts.items():
    print(f"{judge:<7} correct on {sum(v == 'pass' for v in by_run.values())} of {len(by_run)} dev runs")
both = Counter((verdicts["gemma"][t], verdicts["qwen9b"][t]) for t in verdicts["gemma"])
print("Gemma, Qwen:", dict(both))
```
```
gemma   correct on 394 of 480 dev runs
qwen9b  correct on 376 of 480 dev runs
Gemma, Qwen: {('pass', 'pass'): 366, ('fail', 'fail'): 76, ('pass', 'fail'): 27, ('fail', 'pass'): 10, ('pass', None): 1}
```
*(runs live, shows output — read-only demo snippet, not graded; one of Qwen's replies was cut off before its verdict)*

The judges agree on 442 of the 480 runs. Where they differ, it's mostly Qwen failing what Gemma passed. Which of them is right on those runs, and how either compares with a person reading the same answers, is what [Lesson 7](→ Module 7, the checking the graders lesson) measures, using the labels from Lesson 3's reading and new ones for this purpose.

---

## Relevance, separately

Relevance asks a narrower question, whether the answer addresses the question that was asked, right or wrong. It needs no reference answer, which makes it the judge that can still run where there isn't one, such as on real traffic in [Lesson 11](→ Module 7, the monitoring in production lesson). It's graded separately from correctness, as Anthropic's guide recommends for each dimension, so an answer that's wrong but on topic and one that's off topic don't look the same.

```python
relevance = {judge: [r for r in run["results"] if r["kind"] == "relevance" and r["split"] == "dev"]
             for judge, run in judges.items()}
for judge, rows in relevance.items():
    no_answer = [r for r in rows if r["no_answer"]]
    answered = [r for r in rows if not r["no_answer"]]
    print(f"{judge:<7} runs with no answer: {sum(r['decision'] == 'pass' for r in no_answer)} of {len(no_answer)} passed as relevant; "
          f"runs with an answer: {sum(r['decision'] == 'fail' for r in answered)} of {len(answered)} failed")
```
```
gemma   runs with no answer: 25 of 26 passed as relevant; runs with an answer: 1 of 454 failed
qwen9b  runs with no answer: 0 of 26 passed as relevant; runs with an answer: 7 of 454 failed
```
*(runs live, shows output — read-only demo snippet, not graded)*

On runs with an answer, both judges pass almost everything, as they should: the agent rarely answers a different question. The difference is the runs with no answer, which the step limit stopped before the agent said anything. Their final reply is the harness's own note, "stopped after 10 steps without an answer". Qwen fails all of them, which is right: nothing was said to the user. Gemma passes all but one, and its reasoning shows why: it reads the note as the assistant saying it couldn't find the answer, which the rubric allows. The rubric wasn't written with that case in mind, and a strong judge followed it to a wrong verdict.

The correctness judges don't make the same mistake: both fail every run with no answer. For relevance, the fix doesn't need a better judge. A run with no answer can be detected in code, exactly, and failed before any judge sees it. That's the general shape of grading in this module: code decides what it can decide exactly, and the judge is asked only what needs reading.

---

## Quiz cards

> **Q1.** In RAGAS's answer correctness, what counts as a false positive?
> - A statement in the answer but not the reference ✅
> - A statement in the reference the answer left out
> - A statement both the answer and the reference make
> - A statement that the sources don't support
>
> *Explanation: True positives are in both, false positives only in the answer, false negatives only in the reference. Whether the sources support a statement is a different measure, faithfulness.*

> **Q2.** RAGAS's factual part is TP / (TP + ½ × (FP + FN)). What is that the same as?
> - The F1 score ✅
> - Precision alone
> - Recall alone
> - The share of statements matched
>
> *Explanation: Multiplying top and bottom by 2 gives 2TP / (2TP + FP + FN), the F1 score. An extra statement and a missing one cost the same.*

> **Q3.** Why does this module grade correctness with a pass/fail judge instead of RAGAS's score?
> - One step to check; a threshold in words ✅
> - RAGAS can't compare an answer with a reference
> - A pass/fail judge never disagrees with people
> - RAGAS scores can't be computed for short answers
>
> *Explanation: RAGAS needs a model to split statements and embeddings for similarity, and still needs a threshold to call an answer wrong. A pass/fail judge makes one decision, against a rubric that says in words what passing means, and that one decision is what gets checked against people.*

> **Q4.** Gemma passed 25 of the 26 runs with no answer as relevant. Why?
> - It read the stop note as a reply ✅
> - It was shown a different reply from Qwen
> - The no-answer runs had answered a different question
> - Its correctness verdicts were copied into relevance
>
> *Explanation: The rubric passes a reply that says it can't find the answer, and the stop note looks like one. A judge following its rubric can still reach a wrong verdict when a case wasn't anticipated.*

> **Q5.** What's the best fix for the relevance judge's no-answer problem?
> - Fail runs with no answer in code first ✅
> - Replace Gemma with Qwen as the main judge
> - Average the two judges' relevance verdicts
> - Remove the step limit from the agent's loop
>
> *Explanation: Whether a run ended without an answer is something code can tell exactly. Deciding it in code, and asking the judge only about runs that answered, removes the error without depending on any judge's reading.*
