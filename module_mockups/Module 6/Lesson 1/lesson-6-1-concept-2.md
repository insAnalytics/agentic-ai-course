# Module 6, Lesson 1 — Concept 2: The same question, run twice

> **Note for the site build:** this lesson's data demos read Module 6's
> committed run files. Serve `public/data/reliability/` at
> `/data/reliability/` and fetch it on a learner's first Run, the same way
> as Module 5's `public/data/rag/` (not bundled). The setup below is shared
> by every data demo in this lesson (this concept, the pass^k concept and
> the wordings concept). New shared setup; nothing existing changes.

---

## The data behind this lesson

The demos from here on use real replies from real models, not scripted
ones. The course asked 84 questions about the agent registry's
documentation and the Prometheus docs from Module 5. Each has an exact
answer: a number, a code or a name. Each came with a fixed context: the
chunk that holds its answer, plus four others that look related but don't.
Two open models answered every question 20 times:

- **Qwen3.5-4B**, the main model in this module
- **Qwen3.5-2B**, a smaller model from the same family

Both ran with Qwen's recommended settings for answering without extended
thinking (temperature 0.7), and a reply counts as right only if its final
`ANSWER:` line matches. The replies were generated once, offline, and are
loaded from the course's data files, because models this size can't run in
your browser.

**What this data can and can't show.** It's one run of 84 questions, one
prompt, and two small models from one family. That's enough to see what the
effects the research describes look like up close, in replies you can read,
and it's what the exercises compute on. It isn't enough to establish those
effects in general. So each claim in this lesson rests on published
research, cited where it's made, and our runs come after it as an
illustration. Every number from our runs describes these two models on
these 84 questions and nothing more: a frontier model would make fewer
mistakes, and a harder set of questions would produce more.

```python
import json
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_questions() -> dict[str, dict]:
    """Set E's questions by id: wordings, answer, and the fixed context each one is asked with."""
    data = json.loads((DATA / "set-e.json").read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}
```
*(defined once here and already loaded for every demo in this lesson)*

---

## One question, twenty answers

Here's one question, asked twenty times with the same wording, the same
context and the same settings:

```python
from collections import Counter

questions = load_questions()
run = load_run("plain")
replies = next(r for r in run["results"] if r["id"] == "e41")["samples"]

print(questions["e41"]["wordings"][0])
print(f"model: {run['model']}, temperature {run['sampling']['temperature']}, {len(replies)} runs")
print(Counter(reply["answer"] for reply in replies))
```
```
Which model is notes_agent being migrated to?
model: Qwen/Qwen3.5-4B, temperature 0.7, 20 runs
Counter({'claude-haiku': 13, 'unknown': 7})
```
*(runs live, shows output — read-only demo snippet, not graded. Real
replies from Qwen3.5-4B, loaded from the course's data.)*

The answer is in the context, in a table from the migration runbook with a
column headed "Target model". Thirteen runs found it. Seven said the
sources don't say. Nothing about the question changed between them.

Looking at how the replies begin shows where they split:

```python
run = load_run("plain")
replies = next(r for r in run["results"] if r["id"] == "e41")["samples"]

for number, reply in enumerate(replies[:8], start=1):
    opening = reply["text"].splitlines()[0].split(". ")[0]
    print(f"run {number}: {'right' if reply['correct'] else 'WRONG'} ({reply['answer']})")
    print(f"   {opening[:150]}")
```
```
run 1: WRONG (unknown)
   Based on Source [1], the `notes_agent` is currently listed as being on `claude-haiku`
run 2: WRONG (unknown)
   Based on the provided sources, there is no information about a migration plan for the `notes_agent`.
run 3: right (claude-haiku)
   Based on Source [1], the `notes_agent` is currently listed as being on `claude-legacy`
run 4: WRONG (unknown)
   Based on the provided sources:
run 5: right (claude-haiku)
   Based on Source [1], the `notes_agent` is currently listed as being on `claude-haiku`
run 6: WRONG (unknown)
   Based on the provided sources:
run 7: right (claude-haiku)
   Based on the provided sources:
run 8: right (claude-haiku)
   Based on the provided sources, specifically Source [1] "Runbook: migrating agents off claude-legacy", there is a table listing affected agents and the
```
*(runs live, shows output — read-only demo snippet, not graded. Real
replies from Qwen3.5-4B.)*

Runs 1 and 5 open with the same sentence, and it's the same mistake: they
read the "Target model" column as the model the agent is on now. Run 1
carries that reading to the end and concludes the runbook never names a
target. Run 5 goes on to reread the table, notices the column header, and
recovers. Two runs that start identically end in opposite answers.

This is sampling doing what
[Module 1 said it does](→ Module 1, how LLMs generate text lesson, "the model predicts, it doesn't know" concept):
at every token, the model has a distribution over what comes next, and a
different draw early on sends the rest of the reply down a different path.
The model is genuinely unsure how to read that table, and the uncertainty
shows up as disagreement between runs rather than as anything visible in a
single reply. Each wrong reply reads just as confidently as the right ones.

---

## Failures cluster on particular questions

One unsure question isn't a pattern. The research shows that it is one.
Tasks in a benchmark differ widely in how often a model gets them right:
τ-bench's authors ran each of their retail tasks more than 40 times with
one model and found success rates spread across a wide range, including
tasks it never solved. Evan Miller's
[*Adding Error Bars to Evals*](https://arxiv.org/abs/2411.00640) (2024)
draws the statistical consequence: runs of the same question aren't
independent evidence, because they share that question's difficulty, and
treating them as independent can make results look up to three times more
certain than they are. His recommendation is the one this lesson follows:
run each question several times, keep the results per question, and
measure uncertainty by question.

Here's what that looks like in our runs, for every question and both
models:

```python
def successes(run: dict) -> dict[str, int]:
    """How many of each question's runs were right."""
    return {r["id"]: sum(reply["correct"] for reply in r["samples"]) for r in run["results"]}


for name in ("plain", "plain.smaller"):
    run = load_run(name)
    counts = successes(run)
    runs = run["samples_per_wording"]
    accuracy = sum(counts.values()) / (runs * len(counts))
    always = sum(c == runs for c in counts.values())
    never = sum(c == 0 for c in counts.values())
    print(f"{run['model']}: {accuracy:.1%} of all runs right")
    print(f"  right every time: {always} questions, never right: {never}, sometimes: {len(counts) - always - never}")
    shaky = {q: c for q, c in counts.items() if 0 < c < runs}
    print(f"  the 'sometimes' questions, as runs right out of {runs}:", dict(sorted(shaky.items(), key=lambda item: item[1])))
    print()
```
```
Qwen/Qwen3.5-4B: 98.9% of all runs right
  right every time: 76 questions, never right: 0, sometimes: 8
  the 'sometimes' questions, as runs right out of 20: {'e41': 13, 'e24': 17, 'e69': 17, 'e09': 19, 'e15': 19, 'e31': 19, 'e68': 19, 'e70': 19}

Qwen/Qwen3.5-2B: 92.9% of all runs right
  right every time: 51 questions, never right: 0, sometimes: 33
  the 'sometimes' questions, as runs right out of 20: {'e68': 3, 'e21': 5, 'e83': 12, 'e26': 13, 'e69': 13, 'e20': 14, 'e64': 14, 'e24': 15, 'e58': 15, 'e05': 16, 'e31': 16, 'e25': 17, 'e32': 17, 'e52': 17, 'e77': 17, 'e78': 17, 'e27': 18, 'e71': 18, 'e73': 18, 'e06': 19, 'e15': 19, 'e18': 19, 'e22': 19, 'e48': 19, 'e49': 19, 'e60': 19, 'e61': 19, 'e66': 19, 'e67': 19, 'e70': 19, 'e75': 19, 'e76': 19, 'e80': 19}

```
*(runs live, shows output — read-only demo snippet, not graded. Real
replies from both models.)*

In these runs:

- **Every failure is on a question the model sometimes gets right.**
  Neither model has a question it always gets wrong, so on this set the
  mistakes are inconsistency rather than questions beyond the model.
- **The failures cluster.** For the 4B model, 76 questions never fail and
  all of its mistakes fall on the other 8. The average, 98.9%, describes
  none of them: most questions are at 100%, and e41 is at 65%.
- **The smaller model's failures are spread over more questions.** The 2B
  is shaky on 33 questions, and wrong more often than right on two (e68 and
  e21).

This is the easy/hard split from
[the compounding concept](→ this lesson, the small errors compound concept, the "where the model breaks" section),
now seen in real replies. It's why a single run per question, or a single
accuracy figure, can't tell you whether an agent is reliable.

---

## How sure can we be of these numbers?

Miller's point applies to our own figures, so here they are with 95%
intervals computed both ways: once treating all 1,680 runs as independent,
and once resampling whole questions, keeping each question's 20 runs
together:

```python
import math
import random


def successes(run: dict) -> dict[str, int]:
    """How many of each question's runs were right."""
    return {r["id"]: sum(reply["correct"] for reply in r["samples"]) for r in run["results"]}


def question_bootstrap(rates: list[float], repeats: int = 2000, seed: int = 0) -> tuple[float, float]:
    """A 95% interval for the average, resampling whole questions: each question's runs stay together."""
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(rates, k=len(rates))) / len(rates) for _ in range(repeats))
    return means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


for name in ("plain", "plain.smaller"):
    run = load_run(name)
    runs = run["samples_per_wording"]
    rates = [c / runs for c in successes(run).values()]
    accuracy = sum(rates) / len(rates)
    # the naive interval treats all 1,680 runs as independent draws
    naive = 1.96 * math.sqrt(accuracy * (1 - accuracy) / (runs * len(rates)))
    low, high = question_bootstrap(rates)
    print(f"{run['model']}: {accuracy:.1%}")
    print(f"  treating every run as independent: {accuracy - naive:.1%} to {accuracy + naive:.1%}")
    print(f"  resampling whole questions:        {low:.1%} to {high:.1%}")
```
```
Qwen/Qwen3.5-4B: 98.9%
  treating every run as independent: 98.4% to 99.4%
  resampling whole questions:        97.9% to 99.7%
Qwen/Qwen3.5-2B: 92.9%
  treating every run as independent: 91.7% to 94.1%
  resampling whole questions:        89.4% to 95.8%
```
*(runs live, shows output — read-only demo snippet, not graded. Real runs
from both models.)*

Resampling whole questions gives intervals about twice as wide for the 4B
and nearly three times as wide for the 2B, in line with Miller's "up to three
times". The naive interval is too narrow because it counts twenty runs of
e41 as twenty separate pieces of evidence, when they're twenty looks at one
question.

Comparing the two models is a different question from measuring either
one, and the fair way to do it pairs them question by question, with
[Module 5's sign test](→ Module 5, measuring retrieval before improving it lesson, reading the numbers honestly concept):

```python
import math


def sign_test(gains: int, losses: int) -> float:
    """If a change made no real difference, the chance of a split at least this lopsided, either way."""
    n = gains + losses
    tail = sum(math.comb(n, i) for i in range(max(gains, losses), n + 1)) / 2 ** n
    return min(1.0, 2 * tail)


larger, smaller = successes(load_run("plain")), successes(load_run("plain.smaller"))
better = sum(larger[q] > smaller[q] for q in larger)
worse = sum(larger[q] < smaller[q] for q in larger)
print(f"4B right more often on {better} questions, 2B on {worse}, tied on {len(larger) - better - worse}")
print(f"chance of a split this lopsided if the models were equally good: {sign_test(better, worse):.1e}")
```
```
4B right more often on 31 questions, 2B on 2, tied on 51
chance of a split this lopsided if the models were equally good: 1.3e-07
```
*(runs live, shows output — read-only demo snippet, not graded. It uses
`successes` from the demo above.)*

On these 84 questions, the 4B is clearly the more reliable model. That's
as far as this data goes: it says nothing about other questions, other
prompts, or other models. Measuring reliability across a whole suite, with
this kind of care, is Module 7's subject.

---

## Why not just set the temperature to 0?

If sampling causes the variation, it's tempting to switch it off. With
[greedy decoding](→ Module 1, decoding strategies and generation controls lesson, the "greedy decoding vs. sampling" concept),
the model always takes its most likely token, and the same prompt tends to
produce the same reply. That doesn't make the agent reliable, for three
reasons:

- **Consistent isn't correct.** Greedy decoding picks one path through the
  model's uncertainty. On e41 that path might be run 1's misreading, and
  then the agent would answer "unknown" every time, reliably wrong. The
  uncertainty is still there; you've just stopped seeing it.
- **Temperature 0 isn't fully deterministic in practice.**
  [Module 1 covered why](→ Module 1, decoding strategies and generation controls lesson, the "stop sequences, and nondeterminism even at temperature 0" concept),
  and Thinking Machines Lab measured it:
  [1,000 completions of one prompt at temperature 0](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/)
  from Qwen3-235B produced 80 different outputs, because the server's
  arithmetic changes with how many requests are batched together. Special
  kernels made all 1,000 identical, at a cost in speed.
- **The inputs vary anyway.** A real agent never sees exactly the same
  prompt twice: users phrase things differently, and tool results change.
  τ-bench's agent ran at temperature 0 and was still inconsistent, because
  its simulated users varied. The wordings concept later in this lesson
  measures that source of variation directly.

Model providers also tune their recommended settings for quality, and
Qwen's recommendations for these models include sampling. The honest move
is to measure the variation, not to hide it.

---

## Quiz cards

> **Q1.** Qwen3.5-4B answered e41 correctly in 13 of 20 runs, with the same
> prompt and settings each time. What best explains the other 7?
> - A) A bug in the sampling code that occasionally corrupts replies
> - B) The model is unsure how to read the table, and each run samples a different path through that uncertainty ✅
> - C) The context was different in those 7 runs
> - D) The model ran out of tokens before reaching the answer
>
> *Explanation: the prompt, context and settings were identical. Runs 1 and
> 5 even open with the same misreading and end with opposite answers, which
> is what sampling from an uncertain model looks like. None of these replies
> were cut off; they ended with a confident "unknown".*

> **Q2.** The 4B model is right on 98.9% of all runs. Why is that a poor
> summary of how reliable it is?
> - A) Because 98.9% is too low for any agent
> - B) Because the failures aren't spread evenly: 76 questions never fail, and all the mistakes fall on 8 questions, one of them right only 65% of the time ✅
> - C) Because accuracy can only be measured with temperature 0
> - D) Because the 2B model is more reliable
>
> *Explanation: an average over questions hides how failures are
> distributed. The same 98.9% could mean every question fails occasionally,
> or a few questions fail often, and those need different fixes. Keeping
> results per question shows which it is.*

> **Q3.** Twenty runs of each of 84 questions give 1,680 runs. Why is a
> confidence interval that treats them as 1,680 independent results too
> narrow?
> - A) Because 1,680 is too few runs for any interval to be meaningful
> - B) Because runs of the same question share its difficulty, so twenty runs of one question are twenty looks at one thing, not twenty independent pieces of evidence ✅
> - C) Because the model's temperature makes every run unpredictable
> - D) Because intervals only apply when the accuracy is below 90%
>
> *Explanation: the runs are clustered by question. Resampling whole
> questions gave intervals about two to three times wider than the naive
> ones here, which matches Miller's finding that ignoring the clustering can
> overstate certainty by up to three times.*

> **Q4.** A colleague proposes setting temperature to 0 so the agent gives
> the same answer every time. What's the main problem?
> - A) Temperature 0 makes the model slower
> - B) The same answer every time can be the wrong answer every time: it hides the model's uncertainty rather than removing it ✅
> - C) Temperature 0 isn't supported by open models
> - D) It would make pass^k impossible to measure
>
> *Explanation: greedy decoding follows one path through the model's
> uncertainty; if that path is a misreading, the agent is consistently
> wrong. Temperature 0 also isn't perfectly deterministic in practice, as
> Thinking Machines measured, and real inputs vary anyway, as τ-bench's
> temperature-0 agent showed.*

> **Q5.** On our 84 questions, the 4B was right more often than the 2B on 31
> questions and less often on 2, a split with about a one-in-ten-million
> chance if the models were equally good. What does that establish?
> - A) That the 4B model is more reliable than the 2B on any task
> - B) That larger models are always more reliable
> - C) That the 4B is more reliable on these 84 questions, with this prompt ✅
> - D) Nothing, since one run can never show anything
>
> *Explanation: the paired test makes the difference on this set very
> unlikely to be chance, which is a real result. It's a result about this
> set, this prompt and these models. Generalising beyond them needs other
> questions and other conditions, which is why claims about models in
> general in this lesson come from published research, not from these runs.*

---

*(End of this concept. The next concept turns per-question runs into one
number that measures consistency: pass^k.)*
