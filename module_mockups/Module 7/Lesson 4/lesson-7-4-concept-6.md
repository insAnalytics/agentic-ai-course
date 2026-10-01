# Module 7, Lesson 4 — Concept 6: Reading public benchmarks critically

> **Note for the site build:** the demo reads the pilot's `grades.json` from `/data/eval/pilot` (mounted since Lesson 1).

---

## A public score is someone else's suite

Everything in this lesson applies to the benchmarks behind model leaderboards and launch announcements. A public benchmark is a task suite someone else built: their tasks, their harness, their graders, their number of trials. Its score measures how a model did on that suite, run that way. Whether it says anything about your agent depends on how closely their suite resembles yours, and the questions to ask are the ones this lesson has asked of the registry agent's own suite.

[Module 1](→ Module 1, the how LLMs generate text lesson, the hallucination as a direct consequence concept, what this concept does and doesn't cover) left one such question for this module: how you'd measure how often a model hallucinates, and compare models on it. The answer runs through all five questions below.

---

## Five questions to ask of a benchmark score

**1. Does it test what your agent does?** "Hallucination" covers different failures, and benchmarks measure different ones:

- **OpenAI's SimpleQA** asks short factual questions the model must answer from what it learned in training, and grades each answer correct, incorrect, or not attempted. It measures closed-book factuality.
- **Google DeepMind's FACTS Grounding** gives the model a document of up to 32,000 tokens and a request, and checks whether the long answer is fully supported by that document, using three different models as judges. It measures grounded factuality.

The registry agent answers from documents it retrieves, so its hallucinations are the grounded kind: claims its sources don't support, and citations that point at the wrong section. A model's SimpleQA score says little about that; a grounding benchmark says more; this module's own suite, which checks the agent's actual citations against its actual sources, says the most.

**2. Could the model have seen the test?** Benchmarks are published, and models train on large slices of the web. GSM1k (Zhang et al., NeurIPS 2024) tested this for a well-known maths benchmark, GSM8k: the authors wrote 1,250 new problems in the same style and difficulty, and some models scored up to 8% lower on them than on the original. (The first preprint reported 13%; the published version reports 8%.) Benchmarks now often keep part of their tasks private for this reason: FACTS Grounding published 860 of its examples and held back 859.

**3. Is the scoring right?** [The first concept in this lesson](→ Module 7, the building a task suite lesson, the what makes a good task concept, the benchmarks get it wrong too) showed the Agentic Benchmark Checklist finding broken scoring in widely used agent benchmarks. Label errors happen too: SimpleQA Verified, a later version of SimpleQA by Google DeepMind, was built to fix noisy and incorrect labels, topical bias and redundant questions in the original.

**4. Same harness, same cost?** An agent's score depends on everything around the model, which [Lesson 1 called the harness](→ Module 7, the why agents are hard to grade lesson, the why an agent is harder to grade than an answer concept, one run, and the words for its parts). "AI Agents That Matter" (Kapoor et al., TMLR 2025), from Princeton, found that agent benchmarks rarely account for cost, and that simple baselines, such as retrying with a gradually raised temperature, matched complex state-of-the-art agents on a coding benchmark at a fraction of the cost. It also found many agent benchmarks have inadequate held-out sets, or none, and that evaluation practices vary enough to make results hard to reproduce. Two scores from two harnesses aren't a comparison of two models.

**5. How sure is the difference?** A leaderboard ranks models by a single number, and a few points between neighbours can be smaller than the noise from running the same model twice. A score worth comparing comes with how many tasks and trials it rests on, and an interval.

---

## The registry agent's own leaderboard

The pilot ran three setups on the same ten tasks, three trials each, so it can be read as a tiny leaderboard. Here it is, with the grades after reading and an interval from resampling whole tasks:

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of this lesson and already loaded)*

```python
import random
from collections import defaultdict

grades = json.loads(Path("/data/eval/pilot/grades.json").read_text(encoding="utf-8"))["trials"]
by_setup = defaultdict(lambda: defaultdict(list))
for trial_id, grade in grades.items():
    setup, task, _ = trial_id.split("/")
    by_setup[setup][task].append(grade["final"])


def with_interval(tasks: dict, repeats: int = 2000, seed: int = 0) -> tuple[float, float, float]:
    groups = list(tasks.values())
    rate = sum(map(sum, groups)) / sum(map(len, groups))
    rng = random.Random(seed)
    shares = sorted(sum(map(sum, picked)) / sum(map(len, picked))
                    for picked in (rng.choices(groups, k=len(groups)) for _ in range(repeats)))
    return rate, shares[int(0.025 * repeats)], shares[int(0.975 * repeats) - 1]


for setup, label in (("4b-nothink", "Qwen3.5-4B, thinking off"), ("4b-think", "Qwen3.5-4B, thinking on"),
                     ("9b-think", "Qwen3.5-9B, thinking on")):
    rate, low, high = with_interval(by_setup[setup])
    print(f"{label:<26} {rate:.0%}  (95% interval {low:.0%} to {high:.0%}, 10 tasks x 3 runs)")
```
```
Qwen3.5-4B, thinking off   70%  (95% interval 40% to 100%, 10 tasks x 3 runs)
Qwen3.5-4B, thinking on    80%  (95% interval 57% to 100%, 10 tasks x 3 runs)
Qwen3.5-9B, thinking on    87%  (95% interval 67% to 100%, 10 tasks x 3 runs)
```
*(runs live, shows output — read-only demo snippet, not graded; the course's own pilot: two Qwen3.5 models, 10 tasks, 3 trials each)*

Read like a leaderboard, the 9B wins. Read with the five questions:

- **The intervals overlap almost entirely.** Ten tasks can't separate these three; a different ten could reverse the order.
- **The harness moves the score about as much as the model does.** Switching thinking on moved the 4B's score by ten points; switching to the larger model then moved it by seven. A leaderboard that compared one model with thinking on against another with it off would be comparing harnesses.
- **The scores also depend on the grader.** These are the grades after reading. The pilot's first code grades put the 4B with thinking on at 83% and the 9B at 80%, the other way round.

None of that makes public benchmarks useless. A good one is a fast, cheap way to shortlist models, and the better it matches your agent's work, the better the shortlist. The decision belongs to your own suite: your tasks, your harness, your graders, enough trials, and a held-out set.

---

## Quiz cards

> **Q1.** Why does a model's SimpleQA score say little about how often the registry agent hallucinates?
> - It tests recall; the agent answers from documents ✅
> - SimpleQA only covers questions about maths and science
> - SimpleQA is too small to measure hallucination at all
> - SimpleQA grades answers with a model, which isn't reliable
>
> *Explanation: SimpleQA measures closed-book factuality: whether the model knows the answer from training. The registry agent's hallucinations are grounded ones: claims its retrieved sources don't support, and wrong citations. A benchmark built for grounding, or the agent's own suite, measures that.*

> **Q2.** GSM1k wrote new problems in the style of a published maths benchmark, and some models scored up to 8% lower on them. What does that suggest?
> - Some of the original score came from seeing it ✅
> - The new problems were harder than the original ones
> - Maths benchmarks are too small to rank models reliably
> - The models' maths ability got worse over time
>
> *Explanation: The new problems matched the original's style and difficulty, so a drop points to contamination: test material in the training data. It's why benchmarks increasingly keep some of their tasks private.*

> **Q3.** Two agents built on different models are compared using scores from different harnesses. What can you conclude about the models?
> - Very little: the harness alone can move the score ✅
> - The higher-scoring agent's model is the better one
> - Nothing, unless both scores are above 50%
> - The difference shows what the larger model adds
>
> *Explanation: An agent's score depends on its prompt, tools, loop and settings as well as its model. In the pilot, turning thinking on moved the 4B's score by ten points, more than moving to the 9B then added, so comparing across harnesses mixes the two effects.*

> **Q4.** In the pilot, the 9B scored 87%, the 4B with thinking on 80%, and the 4B with thinking off 70%, each with wide overlapping intervals. Which conclusion holds?
> - Ten tasks can't separate the three ✅
> - The 9B is the best of the three setups
> - Thinking adds about ten points to any model
> - The 4B with thinking off should be dropped
>
> *Explanation: Each interval spans about 40 points and they overlap almost entirely, so a different ten tasks could reorder them. The ranking is a guess until more tasks or trials narrow the intervals.*

> **Q5.** What is a good public benchmark most useful for, when you're building an agent?
> - Shortlisting models before your own suite ✅
> - Deciding which model your agent should use
> - Replacing your own suite once the scores are high
> - Proving to users that your agent is accurate
>
> *Explanation: A public benchmark is cheap to read and covers many models, so it's a sensible first filter, especially when its tasks resemble your agent's work. The decision needs your own tasks, harness and graders, run enough times, with a held-out set.*
