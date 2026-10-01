# Module 7, Lesson 6 — Concept 1: From a check in the loop to a grader afterwards

> **Note for the site build:**
> - New script `scripts/eval/judge_digest.py` (in the zip with this file) writes `public/data/eval/judges/digest.json` (about 1 MB): every decision from both phase 3 judge runs, without their replies, plus whether each reply-failure run passed its task's code checks. Run it, check the output matches the copy in the zip, and commit both. Mount `public/data/eval/judges/` at `/data/eval/judges`.
> - Add the setup block below to `evalData.ts` as `LOAD_JUDGES`, byte-identical; this lesson's demos start from it.

---

## Module 6's judges, and this lesson's

[Module 6 used models as checks](→ Module 6, the verifying an answer against its sources lesson, the checking each claim against the source it cites concept, the support check): a model read one claim and the source it cited, and said whether the source supports it. Then [it measured them](→ Module 6, the verifying an answer against its sources lesson, the checking the checker concept, how the three judges did) against labelled pairs, and found [the habits judges have](→ Module 6, the verifying an answer against its sources lesson, the checking the checker concept, judges have habits): leniency, being swayed by order and length, and favouring their own model's work.

Those were checks inside the agent: their verdict decided what the agent did next, so they ran on every answer, under a time budget, with only what the agent had at that moment. A model grader in this module does a different job. It grades what the agent did, after the run, as part of an evaluation:

- **It sees more.** The whole conversation, the final reply, any emails, the end state, and, where there is one, the reference answer the task was written with.
- **It isn't in a hurry.** Nothing waits on its verdict, so it can be a larger, slower model than the agent could afford to call on every step.
- **Its mistakes cost something else.** A wrong check in the loop changes what the agent does; a wrong grader changes what you believe about the agent.

The habits Module 6 measured come along unchanged, and so does the need to measure a judge before trusting it. That's [Lesson 7](→ Module 7, the checking the graders lesson)'s subject. This lesson is about building judges worth measuring.

---

## What a model grader is for

Anthropic's guide to agent evals sets model-based graders beside code and human graders. A model can follow a rubric, compare an answer with a reference, judge between two answers, or check a statement in natural language. It's flexible, handles open-ended answers, and can follow nuance a regular expression can't; it also costs more than code, gives different answers on different runs unless it's run greedily, and has to be calibrated against people before its numbers mean much.

Lesson 5 ended with a list of what code can't check, and it's the list a judge is for:

- **Meaning.** Whether "they're unaffected by the standby" says the same as "no".
- **Advice versus warning.** Whether a reply that mentions "REGISTRY_AUTH=off" recommends it or warns against it.
- **What a reply claims.** Whether the agent told the user a change happened when it didn't.

Everything code can check exactly, it should keep checking: the end state, the ids, the numbers, the citations against the tool log. A judge adds the parts that need reading, and the two together grade a run.

---

## The three reply failures, graded

Lessons 4 and 5 left three kinds of task whose code checks can't see their failure: the planted instruction, the lost write reported as done, and the broken tool result stated as fact. Each now has a judge, run over every run of those tasks with two models: Gemma 4 31B, from a different family than the agent, and Qwen3.5-9B, from the agent's own family, for comparison. Here they are beside the code checks, on the development tasks:

```python
import json
from pathlib import Path

JUDGES = Path("/data/eval/judges")


def load_digest() -> dict:
    """Every phase 3 judge decision, by judge: gemma (Gemma 4 31B) and qwen9b (Qwen3.5-9B)."""
    return json.loads((JUDGES / "digest.json").read_text(encoding="utf-8"))["judges"]
```
*(defined once here and already loaded for every demo in this lesson)*

```python
from collections import defaultdict

judges = load_digest()
rows = defaultdict(lambda: defaultdict(list))
for judge, run in judges.items():
    for r in run["results"]:
        if "code_pass" in r and r["split"] == "dev":
            rows[r["kind"]][judge].append(r["decision"] == "pass")
            if judge == "gemma":
                rows[r["kind"]]["code"].append(r["code_pass"])

for kind in ("planted", "false_report", "broken_result"):
    code = [c for c in rows[kind]["code"] if c is not None]
    gemma, qwen = rows[kind]["gemma"], rows[kind]["qwen9b"]
    print(f"{kind:<14} {len(gemma)} runs | code checks pass {sum(code)}/{len(code)} "
          f"| Gemma passes {sum(gemma)} | Qwen passes {sum(qwen)}")
```
```
planted        40 runs | code checks pass 30/30 | Gemma passes 1 | Qwen passes 1
false_report   40 runs | code checks pass 19/40 | Gemma passes 7 | Qwen passes 9
broken_result  15 runs | code checks pass 15/15 | Gemma passes 11 | Qwen passes 5
```
*(runs live, shows output — read-only demo snippet, not graded; real verdicts from the committed judge runs, both judges greedy; q13's ten runs have no code check)*

- **The planted instruction.** Every run with a code check passed it; both judges fail all but one run. Reading the answers confirms the judges: almost every one tells the user to set `REGISTRY_AUTH=off`, usually as an "alternative workaround" with a citation to the wiki page, and one run puts it in the email it sends to support-team. The code checks were right that nothing in the registry changed. They had no way to see the advice.
- **The lost write.** The code checks pass about half these runs: they look at the registry, the read-back call or the email count, and many runs get those right. Both judges fail most of them, and that matches [Lesson 4's reading](→ Module 7, the building a task suite lesson, the where tasks come from concept, a failure becomes tasks): runs that read the record back and still told the user the change was done.
- **The broken result.** The code checks pass every run, because the registry is unchanged. The judges disagree with each other here, 11 passes against 5, and reading the runs they split on shows why: each gave the right answer, found another way, and the rubric says that passes. Gemma follows the rubric; Qwen fails right answers.

Two judges reading the same runs with the same rubric disagree that much, which says a judge's verdict isn't a fact about the run. It's a measurement, with its own error, and the next concepts are about making that error small: a clear rubric, the right format, and a check against people.

---

## Quiz cards

> **Q1.** What changes when a model check from inside the loop becomes a grader afterwards?
> - It sees the whole run, and decides nothing ✅
> - It stops needing a rubric, because it sees more
> - It no longer has the habits Module 6 measured
> - It runs on every step of the agent's loop
>
> *Explanation: A grader runs after the run, with the whole conversation, end state and reference in view, and nothing waits on its verdict. Its habits come with it, which is why it still has to be measured against people.*

> **Q2.** Every planted-instruction run with a code check passed it, and the judges failed nearly all of them. What explains the gap?
> - The advice is in the reply ✅
> - The code checks were broken and need fixing
> - The judges are too strict about security advice
> - The planted tasks were graded with the wrong rubric
>
> *Explanation: The code checks were right that the registry didn't change. The failure, telling the user to turn authentication off, is in what the agent said, and only a grader that reads the reply can see it.*

> **Q3.** Which part of a run should stay with code rather than move to a judge?
> - The end state, ids and citations ✅
> - Whether a reply recommends or warns against something
> - Whether two differently worded answers mean the same
> - Whether the agent told the user something false
>
> *Explanation: Code checks exact things exactly, cheaply and the same way every time. A judge adds what needs reading for meaning, and the two together grade a run.*

> **Q4.** On the broken-result runs, Gemma passed 11 and Qwen 5, with the same rubric. What did the runs they split on contain?
> - Right answers found another way ✅
> - Most stated the empty record's fields as fact
> - The rubric asks the judges two different questions
> - Gemma passed runs that never answered the question
>
> *Explanation: The rubric passes a run that doesn't take anything from the empty record as fact. The runs the judges split on found the right answer elsewhere; Gemma followed the rubric and Qwen failed correct answers.*

> **Q5.** Why is Gemma 4 31B, not Qwen3.5-9B, the main judge?
> - Qwen is the agent's family ✅
> - Gemma is the only model that can follow a rubric
> - Qwen can't run greedily on the course's server
> - Gemma was trained on the registry's documents
>
> *Explanation: Module 6 measured judges favouring their own model's work. Gemma, from another family, is the main judge; Qwen3.5-9B, from the agent's family, is kept for comparison, with that risk named.*
