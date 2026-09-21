# Module 2, Lesson 9 — Concept 1: The evaluator-optimizer pattern, implemented

---

## The check that couldn't be deterministic

[Lesson 6's goal-state check](→ this module, termination failure and control lesson, goal state termination checks concept) was deliberately scoped to a *deterministic*, code-side condition — "does this agent name now exist in the registry," something a plain `if` statement can verify directly. Not every success condition is checkable that way — "does this summary actually read well and cover the key points" isn't something code can evaluate mechanically at all. That's exactly the gap this concept closes: the **evaluator-optimizer pattern**, where the *model itself* judges whether a candidate output satisfies explicit criteria.

---

## The pattern: generate, evaluate, revise, repeat

```python
class EvaluationBlock:
    def __init__(self, passed: bool, critique: str = ""):
        self.type = "evaluation"
        self.passed = passed
        self.critique = critique

generation_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="Our product helps businesses manage inventory.")],
    [TextBlock(text="Our cloud-based inventory management software helps small businesses track stock levels, automate reordering, and reduce waste in real time.")],
])

evaluation_client = FakeLLMClient(scripted_responses=[
    [EvaluationBlock(passed=False, critique="Too vague -- doesn't mention specific features or the target audience.")],
    [EvaluationBlock(passed=True)],
])

def run_evaluator_optimizer(generation_client, evaluation_client, prompt: str, max_attempts: int = 3) -> str:
    current_prompt = prompt
    for attempt in range(max_attempts):
        gen_response = generation_client.create(messages=[{"role": "user", "content": current_prompt}])
        candidate = gen_response.content[0].text

        eval_response = evaluation_client.create(messages=[{"role": "user", "content": f"Evaluate this: {candidate}"}])
        evaluation = eval_response.content[0]

        if evaluation.passed:
            return candidate
        print(f"attempt {attempt + 1} failed evaluation: {evaluation.critique}")
        current_prompt = f"{prompt}\n\nPrevious attempt: {candidate}\nCritique: {evaluation.critique}\nPlease revise."
    return f"Error: no passing candidate produced after {max_attempts} attempts"

result = run_evaluator_optimizer(generation_client, evaluation_client, "Write a one-sentence product description.")
print(result)
```
```
attempt 1 failed evaluation: Too vague -- doesn't mention specific features or the target audience.
Our cloud-based inventory management software helps small businesses track stock levels, automate reordering, and reduce waste in real time.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first candidate fails — the critique becomes part of the prompt for
the *next* attempt, exactly [the scaffolding-through-context effect from Lesson 2's chain-of-thought](→ this module, prompting fundamentals lesson, chain of thought prompting concept), now applied to feeding a critique forward rather than an intermediate reasoning step. The second, revised candidate passes, and the loop returns it — [`max_attempts`, the same backstop pattern from Lesson 6](→ this module, termination failure and control lesson, max steps the first simplest fix concept), catches the case where a passing candidate is never actually produced.

---

## Two genuinely different kinds of check

Worth holding side by side: Lesson 6's `if target_agent_name in
tools._registry` and this concept's `evaluation.passed` are answering
fundamentally different questions. One is a fact about real, external
state, checkable with certainty by ordinary code. The other is a
judgment call — genuinely requiring the kind of qualitative assessment
only a model (or a human) can make. Neither is a substitute for the
other; they fit different kinds of success conditions entirely.

---

## Quiz cards

> **Q1.** Why couldn't Lesson 6's deterministic goal-state check handle
> something like "does this summary read well"?
> - A) It actually could — this concept teaches nothing new
> - B) A deterministic code check can only verify facts about real, external state directly; "reads well" requires genuine qualitative judgment code can't perform mechanically ✅
> - C) Lesson 6's check was broken and never worked at all
> - D) Text quality can always be checked with a simple `if` statement

> **Q2.** In the demo, what actually changes about `current_prompt`
> between the first and second generation attempts?
> - A) Nothing changes — the exact same prompt is sent both times
> - B) The failed candidate and its specific critique get appended, so the second attempt has that feedback available as context ✅
> - C) The prompt is shortened on each subsequent attempt
> - D) `current_prompt` is reset to a completely unrelated topic

> **Q3.** What's the actual difference between a Lesson 6-style
> goal-state check and this concept's evaluation check?
> - A) They check exactly the same kind of thing, just with different syntax
> - B) One verifies a fact about real, external state deterministically; the other requires a genuine qualitative judgment call ✅
> - C) Goal-state checks are always more reliable in every situation
> - D) Evaluation checks never actually require calling a model

---

## Applied sandbox exercise 1

*(implementing the evaluator-optimizer loop — genuinely graded against
a scripted generate/fail/revise/pass sequence)*

*Task shown to learner:* Implement `run_evaluator_optimizer` exactly as
shown in this concept, with `max_attempts` acting as a real backstop if
no candidate ever passes.

*Hidden test cases:*
```python
generation_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="Agents are useful.")],
    [TextBlock(text="Agentic AI systems use LLMs to autonomously plan, act, and adapt across multi-step tasks.")],
])
evaluation_client = FakeLLMClient(scripted_responses=[
    [EvaluationBlock(passed=False, critique="Too generic, no real technical content.")],
    [EvaluationBlock(passed=True)],
])

result = run_evaluator_optimizer(generation_client, evaluation_client, "Explain agentic AI in one sentence.")
assert result == "Agentic AI systems use LLMs to autonomously plan, act, and adapt across multi-step tasks."
assert generation_client.call_count == 2
assert evaluation_client.call_count == 2

# a scenario that never passes, confirming the backstop
never_passes_gen = FakeLLMClient(scripted_responses=[[TextBlock(text="attempt")] for _ in range(3)])
never_passes_eval = FakeLLMClient(scripted_responses=[[EvaluationBlock(passed=False, critique="still not good enough")] for _ in range(3)])
result_2 = run_evaluator_optimizer(never_passes_gen, never_passes_eval, "...", max_attempts=3)
assert "Error" in result_2
```

*Hint (shown on request):* This is this concept's exact function,
unchanged — a `for attempt in range(max_attempts):` loop calling
`generation_client` then `evaluation_client` each pass, returning
immediately on `evaluation.passed`, and updating `current_prompt` with
the critique otherwise.

*Correct answer + explanation (shown on failure, if requested):*
```python
def run_evaluator_optimizer(generation_client, evaluation_client, prompt: str, max_attempts: int = 3) -> str:
    current_prompt = prompt
    for attempt in range(max_attempts):
        gen_response = generation_client.create(messages=[{"role": "user", "content": current_prompt}])
        candidate = gen_response.content[0].text

        eval_response = evaluation_client.create(messages=[{"role": "user", "content": f"Evaluate this: {candidate}"}])
        evaluation = eval_response.content[0]

        if evaluation.passed:
            return candidate
        current_prompt = f"{prompt}\n\nPrevious attempt: {candidate}\nCritique: {evaluation.critique}\nPlease revise."
    return f"Error: no passing candidate produced after {max_attempts} attempts"
```
The first scenario confirms the full revise-and-pass cycle works
correctly, using exactly the critique feedback to reach a passing
result. The second confirms `max_attempts` genuinely bounds the loop —
even a scenario that never produces a passing candidate stops cleanly
after exactly 3 attempts, never running forever.

---

*(End of Concept 1. This lesson continues with Concept 2 — when a
second pass genuinely helps — drafted separately.)*
