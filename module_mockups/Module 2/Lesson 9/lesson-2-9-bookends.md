# Reflection and Self-Critique

> **You'll be able to**
> - Implement the evaluator-optimizer pattern — generate, evaluate,
>   revise, repeat — for success conditions no deterministic check can
>   verify
> - Explain the mechanistic reason a second pass can catch what
>   generation missed: checking against criteria is often more
>   tractable than open-ended generation
> - Explain reflection's real limit — a shared blind spot with the
>   original generation — without concluding reflection is worthless

**Why it matters**
This lesson closes the gap [Lesson 6 deliberately left open](→ this module, termination failure and control lesson, goal state termination checks concept): not every success condition is a fact code can check. Real agent work — writing, summarizing, judgment calls — needs exactly this pattern. And knowing its honest limit matters just as much as knowing how to use it: reflection is a real tool for a real category of problem, not a general correctness guarantee.

---

## Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Why couldn't Lesson 6's deterministic goal-state check handle
> something like "does this summary read well"?
> - A) It actually could
> - B) A deterministic check can only verify facts about real state directly; "reads well" requires genuine qualitative judgment ✅
> - C) Lesson 6's check never worked
> - D) Text quality can always be checked with `if`

> **Q2.** What actually changes about the prompt between a failed and a
> revised generation attempt?
> - A) Nothing changes
> - B) The failed candidate and its specific critique get appended as new context for the next attempt ✅
> - C) The prompt shortens each time
> - D) The prompt resets to an unrelated topic

> **Q3.** What's the core mechanistic reason reflection can catch what
> generation missed?
> - A) Evaluation always uses a more powerful model
> - B) Checking against explicit criteria is a more constrained task than open-ended generation ✅
> - C) Reflection always guarantees a perfect second result
> - D) There's no real mechanistic explanation

> **Q4.** Why is a format violation a clean example of the
> generation/checking asymmetry?
> - A) Format violations can never be detected
> - B) Counting sentences in a finished candidate is trivial; reliably self-constraining to that length during generation is harder ✅
> - C) Format requirements are always impossible
> - D) This has nothing to do with the asymmetry

> **Q5.** Why can't the evaluation step reliably catch a mistake caused
> by a genuine gap in the model's own understanding?
> - A) Evaluation always uses a different model
> - B) The evaluator is the same model with the same knowledge — a gap causing the original mistake is likely present during the check too ✅
> - C) This kind of mistake is impossible
> - D) Evaluation always catches every error

> **Q6.** Does this lesson conclude reflection should be avoided?
> - A) Yes — it provides no real value
> - B) No — it genuinely helps with omissions, format, and checkable inconsistencies; the limit is specifically about over-trusting it against systematic knowledge gaps ✅
> - C) Only for factual questions
> - D) It contradicts Concepts 1–2

---

## Comprehensive sandbox

*(applied — the evaluator-optimizer pattern, extended to a new
scenario, with `max_attempts` enforced correctly; the correct-answer
explanation closes with Concept 3's honest limit)*

*Task shown to learner:* Reuse `run_evaluator_optimizer` from Concept 1
to generate and validate a one-sentence description of the registry
app's purpose, revising on failure, giving up cleanly after
`max_attempts`.

*Hidden test cases:*
```python
gen_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="It's a system.")],
    [TextBlock(text="A lightweight registry for tracking agent configurations by name and model.")],
])
eval_client = FakeLLMClient(scripted_responses=[
    [EvaluationBlock(passed=False, critique="Too vague -- no mention of what's actually stored.")],
    [EvaluationBlock(passed=True)],
])

result = run_evaluator_optimizer(gen_client, eval_client, "Describe the registry app in one sentence.")
assert result == "A lightweight registry for tracking agent configurations by name and model."
assert gen_client.call_count == 2
```

*Hint (shown on request):* Identical structure to Concept 1's function
— nothing new to implement, only a new scenario to apply it to.

*Correct answer + explanation:* Same `run_evaluator_optimizer` as
Concept 1. Worth remembering [Concept 3's limit](→ this lesson, the limits shared blind spots concept) even here: this test's evaluator correctly caught a checkable omission — exactly the category reflection is good at — but nothing about this pattern would catch the evaluator being *wrong* about what "vague" means, if that judgment itself reflected a shared gap with the generator. Reflection closes one real gap; it doesn't replace grounding for the other kind.
