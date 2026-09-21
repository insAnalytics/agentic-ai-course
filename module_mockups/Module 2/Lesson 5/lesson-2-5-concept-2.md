# Module 2, Lesson 5 — Concept 2: Why reasoning before acting improves tool choice

> **A note on scope:** the fake client is fully deterministic and
> scripted — it can show the *structure* of reasoning preceding an
> action, but it can't genuinely demonstrate a model making a *better*
> decision because it reasoned first, since every response here is
> authored in advance, not actually decided by live judgment. What this
> concept can do is apply an already-proven mechanism — [Lesson 2's chain-of-thought scaffolding effect](→ this module, prompting fundamentals lesson, chain of thought prompting concept) — to a new situation, rather than re-proving it from scratch.

---

## The same mechanism, now shaping which tool gets chosen

[Lesson 2 demonstrated concretely](→ this module, prompting fundamentals lesson, chain of thought prompting concept) that writing out an intermediate reasoning step becomes part of the actual sequence the next prediction conditions on — not a documentation nicety, a real mechanical effect on generation. Concept 1's `"thinking"` block applies that exact same mechanism to *tool selection* specifically: reasoning explicitly about *which* tool fits, and *why*, before producing the `tool_use` block, means that reasoning text is genuinely present in the context the tool_use block itself gets generated from.

---

## Where this matters: genuinely ambiguous tool choices

Consider an agent with two available tools: `search_database` (an
internal company knowledge base) and `search_web` (general internet
search). A user asks: *"What's our current return policy for damaged
items?"* Nothing in the query alone makes the right tool choice
completely obvious without some actual judgment — this is internal,
company-specific information, so `search_database` is very likely the
better fit, but a model jumping straight to a tool call, with no
reasoning captured anywhere, has no visible trace of ever having
weighed that distinction at all.

```
Illustrative reasoning block: "The user is asking about our company's
own return policy — this is internal information, not something a
general web search would reliably have. I should use search_database
rather than search_web."
```

Writing this out *before* the resulting `tool_use` block means the
distinction between "internal knowledge" and "general web content" is
now explicitly present in the sequence — the same scaffolding effect
that helped arithmetic accuracy in Lesson 2, here applied to a genuinely
judgment-dependent tool selection instead of a calculation.

---

## Why this concept doesn't (and can't) prove the claim with the fake client

It's worth being honest about the limit here: a scripted demo showing
"reasoning present → correct tool chosen" doesn't actually *prove*
reasoning caused the correct choice, since the exercise author scripted
both together in advance. The actual evidence for this mechanism is
[what Lesson 2 already demonstrated with real numbers](→ this module, prompting fundamentals lesson, chain of thought prompting concept) — this concept's job is applying that already-established mechanism to a new, genuinely useful case, not manufacturing new proof the deterministic fake client structurally can't provide.

---

## Quiz cards

> **Q1.** What mechanism does this concept apply to tool selection,
> originally demonstrated in a different context?
> - A) Constrained decoding, from Module 1
> - B) Chain-of-thought's scaffolding effect from Lesson 2 — written-out reasoning becomes part of what the next prediction conditions on ✅
> - C) The KV cache mechanism from Module 1
> - D) Presence penalty, from Module 1

> **Q2.** Why can the search_database vs. search_web example be
> considered genuinely ambiguous, rather than an obvious choice?
> - A) Both tools always return identical results regardless of the query
> - B) Nothing in the query alone makes the right choice completely obvious without judgment about whether the information is internal company knowledge or general public content ✅
> - C) The two tools have literally identical names
> - D) This scenario never actually occurs in practice

> **Q3.** Why does this concept explicitly state that its fake-client
> demo can't fully prove reasoning improves tool choice?
> - A) The claim itself is actually false
> - B) The fake client is fully scripted in advance, so a demo showing reasoning alongside a correct choice doesn't demonstrate the reasoning genuinely caused that choice — the real evidence is Lesson 2's already-established mechanism ✅
> - C) Tool selection can never actually be improved by any technique
> - D) This concept secretly disagrees with Lesson 2's findings

---

*(End of Concept 2. This lesson continues with Concept 3 — the
historical text-parsed format vs. native tool calling, and why native
won — drafted separately.)*
