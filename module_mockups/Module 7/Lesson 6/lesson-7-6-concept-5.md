# Module 7, Lesson 6 — Concept 5: Grading set F's premise replies

> **Note for the site build:** both demos start from this lesson's `LOAD_JUDGES` setup. The first demo defines `premise`; carry it, without the printing, into the second demo's hidden setup.

---

## What Module 6 measured, and how

[Module 6's set F](→ Module 6, the verifying an answer against its sources lesson, the questions built on a false premise concept, when the question itself is wrong) asked Qwen3.5-4B questions built on an assumption, true for half of them and false for the other half ("Since standard-tier agents can use claude-opus, what do I need to do to move my agent onto claude-opus?"), ten times each under two prompts. Each prompt told the model to end with `PREMISE: FALSE` if the assumption was wrong, and with an answer line otherwise. A grader read the last marker in each reply.

Taken at face value, the marker said the model rejected only a small share of false premises. [Module 6 then read the replies](→ Module 6, the verifying an answer against its sources lesson, the questions built on a false premise concept, what the replies actually say) and found the marker had measured something else: most replies counted as "answered" had corrected the premise in their text and answered anyway, and many true-premise "rejections" used the marker to say "no" or "the sources don't cover this". It promised the replies would be graded properly here, by a validated judge or by reading.

The judge for this was given each question, whether its assumption is true or false (and, for a false one, what it assumes), the sources the model had, and the reply. Its rubric:

- **False assumption:** pass if the reply rejects or corrects it, outright or by answering from what the sources actually say; fail if it answers as though the assumption were true.
- **True assumption:** pass if the reply answers without rejecting it; fail if it wrongly says the assumption is false.

---

## The marker against the judge

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
premise = {judge: [r for r in run["results"] if r["kind"] == "premise"] for judge, run in judges.items()}
for kind in ("false", "true"):
    rows = [r for r in premise["gemma"] if r["premise"] == kind]
    print(f"{kind}-premise questions, {len(rows)} replies (Gemma's verdict by the marker's outcome):")
    for (marker, verdict), n in sorted(Counter((r["marker_outcome"], r["decision"]) for r in rows).items()):
        print(f"  marker {marker:<9} judge {verdict:<5} {n:>3}")
```
```
false-premise questions, 800 replies (Gemma's verdict by the marker's outcome):
  marker answered  judge fail    1
  marker answered  judge pass  501
  marker no_marker judge pass    1
  marker rejected  judge pass  297
true-premise questions, 800 replies (Gemma's verdict by the marker's outcome):
  marker answered  judge fail   46
  marker answered  judge pass  690
  marker no_marker judge fail    5
  marker rejected  judge fail   34
  marker rejected  judge pass   25
```
*(runs live, shows output — read-only demo snippet, not graded; Gemma 4 31B's verdicts on all 1,600 recorded replies)*

On false premises the two measures barely overlap. The marker counted 502 replies as going along with the false assumption; the judge passes all but one of them. Reading a sample shows why: the replies answer from what the sources actually say ("you have until 2026-10-31", not the date the question assumed), which corrects the premise without writing the marker line. That's what Module 6's own reading found.

On true premises they disagree in both directions:

- **25 marker "rejections" the judge passes.** Reading a sample, most use `PREMISE: FALSE` to say the sources don't answer the question, or to answer "no", without rejecting the assumption itself. One is the judge misreading which assumption the question made.
- **46 "answered" replies the judge fails.** Most reject the true assumption in words without the marker. Two treat an error code that means three failed polls as a single failure. A few are the judge drifting from its rubric, failing a reply for not answering rather than for rejecting the premise.

---

## Against Module 6's reading

Module 6 also left 30 replies read and labelled by hand: false-premise questions the marker counted as "answered", each labelled C (said the premise was wrong, answered correctly), I (answered correctly from the true fact without mentioning the premise) or W (answered wrongly). Here are both judges on the same 30:

```python
# Module 6's 30 hand-labelled replies: false-premise questions, "allowed" prompt, all counted "answered" by the marker.
# C = said the premise was wrong and answered correctly, I = answered correctly from the true fact without mentioning
# the premise, W = answered wrongly
SAMPLED = [("v19", 1), ("v08", 8), ("v24", 7), ("v40", 2), ("v03", 5), ("v04", 8), ("v32", 9), ("v05", 9),
           ("v21", 8), ("v36", 2), ("v04", 0), ("v31", 0), ("v12", 8), ("v03", 0), ("v05", 5), ("v26", 7),
           ("v25", 9), ("v04", 6), ("v14", 5), ("v05", 7), ("v34", 6), ("v26", 2), ("v04", 1), ("v35", 3),
           ("v07", 4), ("v13", 3), ("v39", 1), ("v39", 0), ("v04", 2), ("v35", 9)]
LABELS = "CWCCCCCCCWWCICIICCCICICCCCCCCC"

for judge, rows in premise.items():
    verdicts = {(r["question_id"], r["prompt"], r["sample"]): r["decision"] for r in rows}
    pairs = Counter((label, verdicts[(f"{item}-false", "allowed", n)]) for (item, n), label in zip(SAMPLED, LABELS))
    print(f"{judge:<7}", ", ".join(f"{label} judged {verdict}: {count}" for (label, verdict), count in sorted(pairs.items())))
```
```
gemma   C judged pass: 22, I judged pass: 5, W judged pass: 3
qwen9b  C judged pass: 22, I judged pass: 5, W judged pass: 3
```
*(runs live, shows output — read-only demo snippet, not graded; the labels are Module 6's reading of these replies)*

Both judges pass every C and I reply, which the reading also counts as handling the premise. They pass the three W replies too, and their reasoning says each corrected the false assumption. That's not necessarily a mistake: this rubric asks only about the premise, and W marks answers that went wrong somewhere, which is a question for a correctness judge. Two questions, two judges, as concept 2 argued. But it does mean these 30 replies can't show the premise judge failing anything, so they can't show how often it would wrongly pass a reply that really did accept a false premise.

That's the gap between this judge and a validated one. Module 6's labels measure a different question, and the judge's agreement with the marker is no test at all, because the marker is the measure that was wrong. Checking the judge needs people's labels on the same question the judge answers, on a sample that includes replies it fails as well as ones it passes. That's the first thing [Lesson 7](→ Module 7, the checking the graders lesson) does, and it's where the set F promise is finally kept.

---

## Quiz cards

> **Q1.** Why did Module 6's marker undercount the replies that handled a false premise?
> - They corrected it without the marker ✅
> - The marker was written in a different case each time
> - The grader read the first marker instead of the last
> - Most replies ran out of tokens before the marker
>
> *Explanation: Replies that answered from what the sources actually say corrected the premise without writing PREMISE: FALSE. The marker counted them as going along with it; reading, and the judge, don't.*

> **Q2.** On true premises, the judge passed 25 replies the marker counted as rejections. What were most of them doing?
> - Using the marker to mean "no" ✅
> - Rejecting the assumption, which the judge missed
> - Repeating the question without answering it
> - Writing the marker while answering correctly
>
> *Explanation: The marker was meant for a false assumption, but the model also used it to answer "no" or to say the sources didn't cover something. Neither rejects the assumption, so the judge passes them.*

> **Q3.** Both judges passed the three replies Module 6 labelled W, "answered wrongly". Why isn't that clearly a mistake?
> - The rubric asks about the premise, not the rest ✅
> - The W labels in Module 6 were wrong
> - Judges can't fail replies another reader labelled
> - Wrong answers always pass a premise rubric
>
> *Explanation: Each judge's reasoning says the reply corrected the false assumption, which is all this rubric asks. Whether the rest of the answer is right is a correctness question, for a separate judge.*

> **Q4.** Why doesn't agreement between the judge and the marker help validate the judge?
> - The marker is the measure that was wrong ✅
> - The marker and judge saw different replies
> - Agreement can only be measured on true premises
> - The judge was trained on the marker's output
>
> *Explanation: Module 6's reading showed the marker misses implicit corrections and misreads other uses of the line. Matching it would make the judge worse, not better. Only people's labels on the judge's own question can validate it.*

> **Q5.** What does a validated premise judge still need?
> - Labels on its own question ✅
> - A second judge from the agent's model family
> - A longer rubric with more examples of passes
> - The marker line added back into the prompt
>
> *Explanation: Module 6's labelled 30 were all passes for both judges, so they can't show how often the judge wrongly passes a reply. A sample labelled by people on the premise question, across passes and fails, can; that's Lesson 7.*
