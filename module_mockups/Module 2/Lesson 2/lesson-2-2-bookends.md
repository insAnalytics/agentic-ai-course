# Prompting Fundamentals

> **You'll be able to**
> - Write a specific, unambiguous instruction instead of a vague one,
>   and explain why vagueness has sharper consequences inside an agent's
>   own instructions
> - Write a genuinely few-shot prompt, choose a representative example
>   set, and know when more examples stop helping
> - Use delimiters to separate instructions, examples, and data, and
>   explain why prompt-specified format is a request, complementary to
>   — not a substitute for — constrained decoding
> - Write a chain-of-thought prompt, and explain precisely how it
>   differs from a trained reasoning model's native behavior
> - Iterate on a prompt systematically, against a representative set of
>   cases, rather than judging a change from a single example

**Why it matters**
Every technique in this lesson is the deferred payoff of something
Module 1 explained but didn't teach you to actually *use* — in-context
learning, message structure, chain-of-thought's underlying mechanism.
More directly: [the system prompt](→ this module, the system prompt as agent design lesson), [tool descriptions](→ this module, react and reasoning in the loop lesson), and every instruction an agent runs on for the rest of this module are themselves prompts — write them vaguely, and the agent's *behavior*, not just its writing style, becomes unpredictable in exactly the ways Lesson 1 warned about.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Why is `"Write something about our product"` considered a
> genuinely vague prompt?
> - A) It contains a grammatical error
> - B) It leaves what, tone, length, format, and audience entirely unspecified, so many genuinely different completions are all equally "valid" ✅
> - C) It's too short to ever be useful
> - D) The word "product" is inherently ambiguous

> **Q2.** Why does vagueness in an agent's own instructions carry
> sharper consequences than vagueness in a one-off content request?
> - A) It doesn't — the consequences are identical
> - B) Ambiguity about when to call a tool or what counts as "done" can produce structural failures, not just stylistic ones ✅
> - C) Agents are immune to vague instructions
> - D) This only matters for agents with many tools

> **Q3.** Why don't more few-shot examples always keep improving results
> indefinitely?
> - A) Additional examples are always strictly beneficial
> - B) Returns diminish past a small number of well-chosen examples, while token cost keeps growing, and too many can over-anchor the model ✅
> - C) Examples past the third are ignored entirely
> - D) Adding examples always makes output worse

> **Q4.** Why can a narrow, non-representative few-shot example set
> produce worse results than no examples at all?
> - A) This can never happen
> - B) It can mislead the model into a pattern too specific to those examples, hurting generalization to genuinely different valid inputs ✅
> - C) Similar examples always improve consistency
> - D) The model ignores similar-looking examples

> **Q5.** What do delimiters like `<feedback>...</feedback>` actually
> accomplish?
> - A) They guarantee the model will never make a mistake
> - B) They explicitly mark which part of a prompt is data, removing ambiguity about the boundary between instructions and content ✅
> - C) They convert a prompt into valid JSON automatically
> - D) They have no real effect on interpretation

> **Q6.** Why would a real system typically use both prompt-level format
> specification and constrained decoding together?
> - A) They're redundant, and using both is pure waste
> - B) Prompt-level clarity helps the model's reasoning land on the right shape; constrained decoding then guarantees the final output matches, regardless ✅
> - C) Constrained decoding only works with no format specified in the prompt
> - D) Only one of the two can ever be used per request

> **Q7.** Why does asking for step-by-step reasoning tend to improve
> accuracy on a multi-step problem?
> - A) It has no real effect on accuracy
> - B) Each written-out step becomes part of the sequence the model conditions on for the next prediction, scaffolding that's absent when jumping straight to a final answer ✅
> - C) It only helps by making the response longer
> - D) It only works for arithmetic specifically

> **Q8.** Is chain-of-thought prompting the same as using a dedicated
> reasoning model?
> - A) Yes, identical in every respect
> - B) No — CoT prompting works on any model through prompt wording alone; a reasoning model is specifically trained via RL to reason automatically ✅
> - C) CoT prompting only works on reasoning models
> - D) Reasoning models can't be asked to show reasoning

> **Q9.** Why is judging a prompt change from a single example output a
> weak signal?
> - A) A single example is always sufficient
> - B) Output can vary somewhat run to run for the same prompt, so one example looking better or worse might just be noise ✅
> - C) Single examples are always misleading in every case
> - D) This only matters for very long prompts

---

## Comprehensive sandbox

*(end of lesson, applied — one prompt combining specificity, few-shot
examples, delimiters, and chain-of-thought; grades the learner's
written prompt directly, since no live LLM is available)*

*Task shown to learner:* Write a prompt that, given receipt-style text
listing several items and prices, computes the total cost (summing only
item prices — ignoring any discount or tax lines) and outputs it in the
exact format `Total: $X.XX`. Your prompt must:
- clearly separate the instructions from the receipt data, using a
  delimiter
- include at least one worked few-shot example showing the exact
  computation and output format
- explicitly request step-by-step reasoning before the final total
- specify the exact output format (`Total: $X.XX`)
- end with a new, unanswered receipt for the model to actually process

*Grading (checks the learner's submitted prompt text directly):*
confirms a delimiter (e.g., `<receipt>...</receipt>`) separating
instructions from data; at least one complete worked example showing
both the step-by-step summation and the `Total: $X.XX` format; an
explicit phrase requesting step-by-step reasoning; and a final,
genuinely unanswered receipt with no computed total already filled in.

*Hint (shown on request):* This combines every piece from this lesson,
each doing its own job: the delimiter marks where the actual receipt
data starts and ends; the worked example pins down the exact summation
and format; the step-by-step request scaffolds the arithmetic itself,
[exactly as demonstrated in Concept 4](→ this lesson, chain of thought prompting concept); the format instruction narrows what a "correct" response even looks like.

*Correct answer + explanation (shown on failure, if requested):*
```
Compute the total cost of the items in the receipt below, ignoring any
discount or tax lines. Show your reasoning step by step, then give the
final answer in the format: Total: $X.XX

Example:
<receipt>
Coffee - $4.50
Sandwich - $8.25
Discount - -$2.00
</receipt>
Reasoning: Sum the item prices only, ignoring the discount line.
4.50 + 8.25 = 12.75.
Total: $12.75

<receipt>
Notebook - $3.75
Pen set - $6.20
Tax - $0.80
</receipt>
```
Every technique from this lesson does real, distinct work here: the
`<receipt>` delimiter removes any ambiguity about what's actual data;
the worked example pins down both the "ignore discount/tax lines"
constraint and the exact output format; the explicit step-by-step
request scaffolds the arithmetic itself; and the final, unanswered
receipt is what the model actually has to process — a genuine
composition of every piece from this lesson, not five separate
techniques applied in isolation.
