# Module 2, Lesson 3 — Concept 4: Phase-aware prompting

---

## One static prompt, trying to cover every stage at once

Every system prompt covered so far in this lesson has been a single,
fixed block of text, applied the same way throughout an entire
interaction. Different *stages* of a task often genuinely call for
different behavior, though: early on, an agent might need to be
exploratory — gathering information broadly via tools; later, once it
has enough, it needs to shift toward producing a precise final answer;
a distinct verification stage might call for a more skeptical,
double-checking posture entirely. A single static prompt trying to
cover all of these at once tends to produce muddled guidance for any
one specific stage — instructions written to somewhat fit every phase,
genuinely well-suited to none of them.

---

## The weaker approach: asking the model to track its own phase

```
System prompt: "First, gather information using available tools. Once
you have enough, move to answering. Before finalizing, double-check
your answer against the information you've gathered."
```

This puts the burden of recognizing *which phase it's currently in* on
the model's own reasoning, within one static prompt — workable, but
genuinely less reliable than being told explicitly, since it depends on
the model correctly self-assessing something the prompt itself never
tracks as actual state.

---

## The stronger approach: the code tracks phase as real state

```python
research_phase_instructions = "You are in the RESEARCH phase. Use available tools to gather relevant information. Do not attempt to answer yet -- focus on collecting facts."

write_phase_instructions = "You are in the WRITE phase. You have gathered sufficient information. Produce a concise, final answer based only on what you've already gathered -- do not call any more tools."

def get_phase_instructions(current_phase: str) -> str:
    if current_phase == "research":
        return research_phase_instructions
    elif current_phase == "write":
        return write_phase_instructions
    raise ValueError(f"unknown phase: {current_phase}")

current_phase = "research"
print(get_phase_instructions(current_phase))

current_phase = "write"   # the loop's own code decides to transition, not the model
print(get_phase_instructions(current_phase))
```
```
You are in the RESEARCH phase. Use available tools to gather relevant information. Do not attempt to answer yet -- focus on collecting facts.
You are in the WRITE phase. You have gathered sufficient information. Produce a concise, final answer based only on what you've already gathered -- do not call any more tools.
```
*(runs live, shows output — read-only demo snippet, not graded)*

`current_phase` is a real Python variable — deterministic program
state, not something inferred from the model's own reasoning. The
surrounding code decides when the transition from research to write
actually happens, and swaps which instructions get sent accordingly.
This is more robust precisely because the phase determination lives in
reliable, deterministic code rather than depending on the model
correctly recognizing its own stage every time.

---

## Where this actually gets implemented

Tracking `current_phase` and deciding *when* to transition between
phases is something the loop's own logic has to actually do — [covered directly in the next lesson](→ this module, writing the loop by hand lesson), where the loop itself is written for the first time. This concept's job was establishing *why* phase-specific instructions matter and *which* approach is more reliable; actually wiring that state into a real, running loop is where this goes next.

---

## Quiz cards

> **Q1.** Why might a single, static system prompt struggle to guide an
> agent well across every stage of a multi-phase task?
> - A) Static prompts are always more effective than any alternative
> - B) Instructions written to somewhat fit every phase at once tend to be well-suited to none of them individually ✅
> - C) This problem doesn't actually exist in practice
> - D) System prompts can only ever be one sentence long

> **Q2.** What's the actual difference between asking the model to
> self-assess its own phase versus having the code track phase as real
> state?
> - A) There's no real difference — both approaches are equally reliable
> - B) Self-assessment depends on the model correctly recognizing its own stage from reasoning alone; code-tracked state is deterministic and doesn't depend on the model getting that recognition right ✅
> - C) Self-assessment is always more reliable than code-tracked state
> - D) Code-tracked state requires retraining the model specifically

> **Q3.** In the live demo, what actually decides when the transition
> from `"research"` to `"write"` happens?
> - A) The model decides this entirely on its own, with no code involvement
> - B) `current_phase` is a variable the surrounding code controls — the code decides when the transition happens and which instructions get used accordingly ✅
> - C) The transition happens automatically after a fixed number of tokens
> - D) There is no actual transition; both phases run simultaneously

> **Q4.** Where does this concept say the actual implementation of phase
> tracking and transitions belongs?
> - A) Entirely within the system prompt's own text, with no code involved
> - B) In the loop's own logic, covered directly in the next lesson where the loop is actually written ✅
> - C) This concept claims phase tracking can never actually be implemented
> - D) In the tool's own JSON Schema definition

---

*(End of Concept 4 — final concept section of Lesson 3. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
