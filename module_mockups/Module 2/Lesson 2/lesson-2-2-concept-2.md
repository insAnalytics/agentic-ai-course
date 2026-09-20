# Module 2, Lesson 2 — Concept 2: Examples in the prompt (few-shot)

---

## The deferred payoff from Module 1

[Module 1 established in-context learning as a real mechanism](→ Module 1, scaling laws and emergent behavior lesson, in context learning as a mechanism concept): a model can pick up a task purely from examples given in the prompt, with no weight updates at all — and explicitly deferred *how to actually write good examples* to this course's prompting coverage. This concept is that payoff.

---

## Zero-shot vs. few-shot

**Zero-shot** means an instruction alone, no examples — [exactly the specific prompt from Concept 1](→ this lesson, specificity and clear instructions concept). **Few-shot** means the instruction *plus* a small number of example input/output pairs demonstrating the exact pattern wanted (**one-shot** being the special case of exactly one example).

---

## Where a description alone genuinely falls short

Some tasks have a "shape" that's much easier to *show* than to fully
*describe* in words — a specific structured extraction format is a good
case:

```
Zero-shot prompt: "Extract the person's name and role from this text,
in the format Name (Role)."

Input: "Dr. Sarah Chen, who leads the research division, announced..."

Illustrative output: "The person is Sarah Chen, and she leads the
research division."
```

Even a reasonably specific instruction leaves room for the model to
drift from the *exact* format wanted — here producing a sentence
instead of the requested `Name (Role)` shape. Adding examples pins that
down directly:

```
Few-shot prompt:
"Extract the person's name and role, in the format Name (Role).

Text: 'Dr. Sarah Chen, who leads the research division, announced...'
Output: Sarah Chen (Research Division Lead)

Text: 'Marcus Webb, the company's CFO, confirmed...'
Output: Marcus Webb (CFO)

Text: 'The announcement was made by Elena Ruiz, VP of Engineering...'
Output:"

Illustrative output: "Elena Ruiz (VP of Engineering)"
```

The two worked examples show the exact desired format directly, rather
than relying on the model to correctly infer every detail of `Name
(Role)` from a one-line description alone — far more reliable adherence
to precisely the shape wanted.

---

## How many examples actually help

More examples aren't free, and don't help indefinitely: 2–5
well-chosen examples typically capture a pattern well; adding many more
past that point produces diminishing returns while adding real,
[unavoidable token cost](→ Module 1, quantization cost and operational concerns lesson) to every single request. Past a certain point, too many examples can even *over-anchor* the model to the specific examples given, making it less able to correctly generalize to a genuinely different but still valid new input.

---

## Representative examples, not just more examples

The examples chosen matter as much as how many there are. An example
set where every example looks very similar to every other one — all
short, all one particular sentence structure, all the same kind of
input — can genuinely *mislead* the model into a narrower pattern than
actually intended, producing worse results on real, varied input than
giving no examples at all would have. A good example set deliberately
covers the real range of variation expected — different lengths,
genuine edge cases, different input structures — not just several
near-identical restatements of the easiest case.

---

## Quiz cards

> **Q1.** What's the difference between zero-shot and few-shot
> prompting?
> - A) Zero-shot always produces worse results than few-shot, with no exceptions
> - B) Zero-shot gives an instruction alone; few-shot adds example input/output pairs demonstrating the exact desired pattern ✅
> - C) Few-shot means the model is retrained on the examples given
> - D) Zero-shot can only be used for very simple tasks

> **Q2.** Why can even a reasonably specific zero-shot instruction still
> fail to produce output in an exact desired format?
> - A) Zero-shot prompts can never specify a format at all
> - B) Some formatting details are easier to demonstrate directly than to fully and unambiguously describe in words alone ✅
> - C) This never actually happens with a well-written instruction
> - D) Only few-shot prompts can specify any format requirement

> **Q3.** Why don't more examples always keep improving results
> indefinitely?
> - A) Additional examples are always strictly beneficial with no downside
> - B) Returns diminish past a small number of well-chosen examples, while token cost keeps growing, and too many can even over-anchor the model to those specific examples ✅
> - C) Examples past the third one are simply ignored by the model
> - D) Adding examples always makes output worse, regardless of count

> **Q4.** Why can a set of examples that are all very similar to each
> other actually produce worse results than no examples at all?
> - A) This can never happen — more examples are always at least neutral
> - B) A narrow, non-representative example set can mislead the model into a pattern too specific to those examples, hurting generalization to genuinely different, valid inputs ✅
> - C) Similar examples always improve consistency with no real downside
> - D) The model ignores examples that resemble each other too closely

---

## Applied sandbox exercise 1

*(writing a genuinely few-shot prompt — since no live LLM is available,
this grades the learner's written prompt directly, not model output)*

*Task shown to learner:* Write a few-shot prompt for extracting a
product's name and price from a sentence, in the exact format
`Name — $Price`. Your prompt must include the instruction, at least two
worked examples in that exact format, and end with a new, unanswered
input for the model to complete.

*Grading (checks the learner's submitted prompt text directly, not
model output):* confirms the prompt contains an instruction sentence,
at least two `Name — $Price`-formatted worked examples with distinct
inputs (not two copies of the same example), and a final, genuinely
unanswered input at the end for the model to complete.

*Hint (shown on request):* Structure: one instruction sentence, then
two or more `Text: "..." \nOutput: Name — $Price` pairs using two
*different* example sentences, then a final new `Text: "..."` with no
`Output:` filled in.

*Correct answer + explanation (shown on failure, if requested):*
```
Extract the product name and price, in the format Name — $Price.

Text: "The UltraBrew coffee maker is available now for $89.99."
Output: UltraBrew — $89.99

Text: "Pick up the TrailRunner backpack today, priced at $54.50."
Output: TrailRunner — $54.50

Text: "The new NightGlow desk lamp retails for $32.00."
Output:
```
Two genuinely distinct worked examples pin down the exact format —
product name, an em dash, a dollar sign, the price — before the final
unanswered input, giving a model far more reliable footing than a
one-line format description alone would.

---

*(End of Concept 2. This lesson continues with Concept 3 — output
format and delimiters — drafted separately.)*
