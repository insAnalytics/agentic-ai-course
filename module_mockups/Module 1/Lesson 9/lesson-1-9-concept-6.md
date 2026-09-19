# Module 1, Lesson 9 — Concept 6: Reasoning output in responses

> **Note:** same caveat as this lesson's earlier concepts — the response
> shown is illustrative, not fetched from a live call.

---

## Where the "thinking" from Lesson 8 actually shows up

[Lesson 8 established that reasoning models generate substantial extra reasoning tokens before their final answer, and that those tokens are billed](→ this module, scaling laws and emergent behavior lesson, test time compute and reasoning models concept). This concept covers the actual API mechanics: a reasoning-capable model's response typically includes a **separate content block** for that reasoning — distinct from the final answer text — rather than mixing the two together as one undifferentiated block:

```json
{
  "content": [
    {"type": "thinking", "thinking": "The user is asking about the capital of France. This is a well-established, unambiguous fact..."},
    {"type": "text", "text": "The capital of France is Paris."}
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 24,
    "output_tokens": 187
  }
}
```
*(illustrative — not fetched from a live call)*

```python
response_data = {
    "content": [
        {"type": "thinking", "thinking": "The user is asking about the capital of France. This is well-established..."},
        {"type": "text", "text": "The capital of France is Paris."},
    ],
    "usage": {"input_tokens": 24, "output_tokens": 187},
}

for block in response_data["content"]:
    if block["type"] == "thinking":
        print(f"[reasoning]: {block['thinking'][:50]}...")
    elif block["type"] == "text":
        print(f"[final answer]: {block['text']}")

print(f"total output tokens billed: {response_data['usage']['output_tokens']}")
```
```
[reasoning]: The user is asking about the capital of Fran...
[final answer]: The capital of France is Paris.
total output tokens billed: 187
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice `output_tokens: 187` here, compared to `output_tokens: 9` for
[the exact same simple question, answered without reasoning, back in Concept 2](→ this lesson, the response shape concept) — a concrete illustration of [Lesson 8's point](→ this module, scaling laws and emergent behavior lesson, test time compute and reasoning models concept) that a reasoning model can spend meaningfully more tokens (and cost) even on something that plainly didn't need extended reasoning at all.

---

## This varies by provider

Worth noting: not every provider necessarily exposes the raw reasoning
content in the same way, or at all — some keep the actual reasoning
text internal, showing only a summary or nothing beyond the final
answer, even though the reasoning tokens were still generated and still
billed regardless of whether you can actually read them. The specific
structure a real API returns is worth checking against that provider's
own documentation; the concept worth carrying forward from this lesson
is simply that reasoning content, when present, generally sits separate
from the final answer, and always contributes to the token count you're
actually billed for.

---

## Quiz cards

> **Q1.** How does a reasoning model's "thinking" content typically show
> up in a response, structurally?
> - A) Mixed directly into the same text as the final answer, with no distinction
> - B) As a separate content block, distinct from the final answer's text block ✅
> - C) It never appears anywhere in the response at all, under any circumstances
> - D) As a separate HTTP request entirely

> **Q2.** In the demo, why is `output_tokens` (187) so much higher than
> the non-reasoning example's `output_tokens` (9) from Concept 2, for
> essentially the same question?
> - A) This is an error — they should be identical
> - B) The reasoning tokens generated before the final answer count toward the total output token count, even for a question that didn't really need extended reasoning ✅
> - C) `output_tokens` only counts the final answer, so this comparison is meaningless
> - D) The question itself was phrased completely differently

> **Q3.** Do all providers expose a reasoning model's raw thinking
> content in the same way?
> - A) Yes, every provider always returns it identically
> - B) No — this varies by provider; some may show only a summary or nothing at all, even though the reasoning tokens are still generated and billed regardless ✅
> - C) No provider has ever exposed any reasoning content
> - D) Reasoning content is never billed, regardless of whether it's shown

---

*(End of Concept 6 — final concept section of Lesson 9. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
