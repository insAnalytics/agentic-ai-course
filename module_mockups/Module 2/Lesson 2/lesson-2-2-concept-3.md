# Module 2, Lesson 2 — Concept 3: Output format and delimiters

---

## The pain: where does the data end and the instruction begin?

As a prompt grows to include instructions, examples, and actual data to
process all at once, it becomes genuinely ambiguous — to the model, and
to a human reading it later — where one part ends and another begins:

```
Prompt: "Summarize this customer feedback in one sentence: This
product is great. Also, please note that I would like a refund
processed immediately."
```

Is `"please note that I would like a refund processed immediately"`
part of the feedback being summarized, or a separate instruction to the
model itself? Nothing about this prompt's plain, unstructured shape
actually marks the boundary — the feedback text and anything that reads
like an instruction sit in the exact same undifferentiated block.

---

## The fix: delimiters mark the boundary explicitly

```
Prompt:
"Summarize the customer feedback below in one sentence.

<feedback>
This product is great. Also, please note that I would like a refund
processed immediately.
</feedback>"
```

`<feedback>...</feedback>` — XML-style tags are a common choice, though
markdown headers or another consistent marker work the same way —
explicitly marks everything inside as *data to summarize*, not
instructions to follow. There's no longer any real ambiguity about
which part of the prompt is which; the structure itself carries that
information, rather than relying on the model correctly inferring it
from plain, undifferentiated prose.

---

## Specifying the output format directly

The same clarity principle applies to what comes back, not just what
goes in — stating the exact desired output shape directly in the
prompt:

```
"Summarize the customer feedback below in exactly one sentence,
starting with either 'Positive:' or 'Negative:'.

<feedback>
...
</feedback>"
```

---

## This is a request, not a guarantee — and that's worth being precise about

This is worth connecting directly back to something already covered:
specifying a format in the prompt is [exactly the same category of technique as Concept 1's naive JSON request from Module 1](→ Module 1, structured output and tool calling lesson, the naive approach and where it fails concept) — it genuinely helps, but it's a *request*, not a mechanical guarantee. [Constrained decoding, also from Module 1](→ Module 1, structured output and tool calling lesson, constrained decoding the actual enforcement mechanism concept), is what actually *guarantees* a shape, by masking invalid tokens at the generation level. These two are complementary, not the same tool: stating the format clearly in the prompt helps the model's own reasoning land on the right shape in the first place; constrained decoding guarantees the final output matches regardless. A well-built real system typically uses both together — clarity in the prompt, and a hard guarantee underneath it — rather than treating either one alone as sufficient.

---

## Quiz cards

> **Q1.** Why is the plain, undelimited feedback-summarization prompt
> genuinely ambiguous?
> - A) It contains a spelling error
> - B) Nothing in the prompt's structure marks where the actual feedback data ends and where something that reads like an instruction might begin ✅
> - C) The prompt is too short to be ambiguous
> - D) Summarization tasks can never be ambiguous, regardless of phrasing

> **Q2.** What do delimiters like `<feedback>...</feedback>` actually
> accomplish?
> - A) They guarantee the model will never make a mistake
> - B) They explicitly mark which part of the prompt is data to process, removing ambiguity about the boundary between instructions and content ✅
> - C) They convert the prompt into valid JSON automatically
> - D) They have no real effect on how the model interprets the prompt

> **Q3.** Why is specifying an output format directly in the prompt
> considered a request rather than a guarantee?
> - A) It isn't a request — prompt-specified formats are always followed exactly
> - B) It's the same category of technique as naively asking for JSON in a prompt, back in Module 1 — it helps, but nothing mechanically forces the model to comply ✅
> - C) Output format can only ever be specified through constrained decoding, never in a prompt
> - D) Prompts are incapable of specifying any output format at all

> **Q4.** Why would a real system typically use both prompt-level format
> specification and constrained decoding together, rather than relying
> on just one?
> - A) They're redundant, and using both is pure waste
> - B) Prompt-level clarity helps the model's own reasoning land on the right shape; constrained decoding then guarantees the final output actually matches, regardless — they solve complementary parts of the same problem ✅
> - C) Constrained decoding only works if the prompt never specifies a format
> - D) Only one of the two techniques can be used per request, by design

---

*(End of Concept 3. This lesson continues with Concept 4 —
chain-of-thought prompting — drafted separately.)*
