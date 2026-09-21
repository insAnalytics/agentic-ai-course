# Module 2, Lesson 8 — Concept 3: Tree of Thought as a plan-search variant

> **A note on scope, same as Lesson 5's reasoning-quality concept:** the
> fake client can demonstrate ToT's *structure* — multiple candidates,
> evaluation, selection — concretely and correctly, but it can't
> genuinely prove a model's evaluation *judgment* is good, since every
> score here is scripted in advance, not actually decided.

---

## A fixed tree vs. a search over candidate trees

[Concept 2's tree representation](→ this lesson, plan representations linear tree and dependency graph concept) was a single, fixed plan — once decomposed, that's *the* plan, committed to. **Tree of Thought (ToT)** is different: instead of committing to one path, it generates *several* candidate next steps at a decision point, evaluates how promising each one looks, and explores the more promising branches further while abandoning the rest — genuinely backtracking away from an unpromising path, rather than being stuck with an early choice.

---

## The real contrast with plain chain-of-thought

[CoT, from Lesson 2](→ this module, prompting fundamentals lesson, chain of thought prompting concept), commits to *one* linear chain of reasoning, with no mechanism to reconsider an early step once made — if step two turns out to be a poor choice, CoT has no way to notice and back out; it just continues linearly regardless. ToT's actual addition is exactly that missing capability: multiple candidates, evaluation, and the ability to genuinely abandon a path that isn't working out.

```python
class CandidateBlock:
    def __init__(self, description: str, score: float):
        self.type = "candidate"
        self.description = description
        self.score = score

candidates_client = FakeLLMClient(scripted_responses=[
    [CandidateBlock(description="Create research_agent first, then support_agent", score=0.8),
     CandidateBlock(description="Create support_agent first, then research_agent", score=0.6),
     CandidateBlock(description="Create both agents with a single combined step", score=0.3)],
])

response = candidates_client.create(messages=[{"role": "user", "content": "..."}])
candidates = response.content

best_candidate = max(candidates, key=lambda c: c.score)
print(f"exploring {len(candidates)} candidates:")
for c in candidates:
    marker = " <- selected" if c is best_candidate else " (abandoned)"
    print(f"  score {c.score}: {c.description}{marker}")
```
```
exploring 3 candidates:
  score 0.8: Create research_agent first, then support_agent <- selected
  score 0.6: Create support_agent first, then research_agent (abandoned)
  score 0.3: Create both agents with a single combined step (abandoned)
```
*(runs live, shows output — read-only demo snippet, not graded; the
scores themselves are scripted, not genuinely evaluated)*

`max(candidates, key=lambda c: c.score)` — [the same `key`-based selection pattern already covered back in Module 0](→ Module 0, the data structures lesson) — picks the highest-scoring candidate to actually continue with; the other two are simply abandoned, never explored further. This is the structural shape of ToT, correctly demonstrated: three candidates generated *together*, at the same decision point, rather than committing to only one.

---

## The real cost tradeoff

ToT genuinely requires more model calls than plain CoT — generating
several candidates at each decision point, rather than one, [directly costs more real tokens](→ Module 1, quantization cost and operational concerns lesson), the same way [test-time compute did in Module 1](→ Module 1, scaling laws and emergent behavior lesson, test time compute and reasoning models concept). This is worth being direct about: ToT isn't free, and isn't automatically the better choice just because it's more sophisticated-sounding.

---

## When it's actually worth the cost

ToT earns its extra cost specifically on problems where an early
misstep is genuinely hard to recover from within a purely linear
chain — certain puzzles, planning with real, interacting constraints,
tasks with several simultaneous requirements pulling in different
directions. For anything plain CoT already handles fine — most
straightforward, single-path problems — ToT is real overkill, spending
several times the cost for no actual benefit over a single, linear
chain of reasoning.

---

## Quiz cards

> **Q1.** What's the key structural difference between ToT and plain
> chain-of-thought?
> - A) ToT is just a longer version of the same single reasoning chain
> - B) ToT generates multiple candidate next steps at a decision point, evaluates them, and can abandon unpromising ones, rather than committing to one linear chain with no way to reconsider ✅
> - C) Plain CoT can already backtrack from a bad early step
> - D) ToT and CoT are unrelated techniques with no real connection

> **Q2.** In the demo, what happens to the two lower-scoring candidates?
> - A) They're executed anyway, alongside the highest-scoring one
> - B) They're simply abandoned — never explored further, once the highest-scoring candidate is selected ✅
> - C) They're automatically merged into the selected candidate
> - D) They're saved for later use in a separate task

> **Q3.** Why does ToT genuinely cost more than plain CoT?
> - A) It doesn't actually cost more — both require the same number of model calls
> - B) Generating multiple candidates at each decision point requires real, additional tokens and calls, directly increasing cost compared to committing to one path ✅
> - C) ToT is only more expensive if the task fails
> - D) Cost is unrelated to how many candidates get generated

> **Q4.** When does ToT's extra cost actually earn its keep, according to
> this concept?
> - A) For every task, regardless of difficulty — ToT should always be preferred
> - B) Specifically for problems where an early misstep is genuinely hard to recover from in a purely linear chain — real overkill for anything plain CoT already handles fine ✅
> - C) Only for tasks involving exactly three candidates
> - D) ToT never actually provides any real benefit over CoT

---

*(End of Concept 3. This lesson continues with Concept 4 —
plan-and-execute vs. purely reactive — drafted separately.)*
