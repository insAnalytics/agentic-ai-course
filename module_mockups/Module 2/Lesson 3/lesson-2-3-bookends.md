# The System Prompt as Agent Design

> **You'll be able to**
> - Explain why a system prompt carries behavioral weight, grounded in
>   Module 1's actual training mechanism, not treated as an unexplained
>   given
> - Write a system prompt combining a defined role and explicit
>   always/never behavioral constraints
> - Write tool guidance that's genuinely distinct from a tool's schema —
>   strategic behavior, not mechanical format
> - Design phase-aware instructions, and explain why tracking phase as
>   real code state is more reliable than asking a model to self-assess

**Why it matters**
The system prompt is the single highest-leverage piece of an agent's
design — get it vague, and every downstream lesson in this module
(control flow, planning, reflection) inherits that ambiguity as
unpredictable behavior. Everything in this lesson is really Lesson 2's
prompting technique, applied deliberately to the one piece of prompt
text that shapes an agent's behavior across its entire run, not just
one response.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** Why does a model generally treat system-role content as
> higher-priority instruction, mechanically?
> - A) System-role content is processed through a separate, privileged channel
> - B) It's a strong, learned behavioral pattern from preference training, not a hardcoded guarantee ✅
> - C) There's no actual difference in how roles are treated
> - D) System-role content is validated by a separate security mechanism

> **Q2.** What's the structural difference between a system prompt and a
> user message?
> - A) There's no real structural difference
> - B) A system prompt holds standing instructions across an entire interaction; a user message carries the specific, per-turn task, which changes each time ✅
> - C) User messages are always longer
> - D) System prompts can only contain one sentence

> **Q3.** Why does a vague, role-less system prompt increase the risk of
> ungrounded, confidently-stated claims?
> - A) Vague prompts always cause outright refusal
> - B) With no instruction constraining it, the model has no particular reason not to produce a plausible-sounding but ungrounded answer — the default behavior of an unconstrained system ✅
> - C) This risk is unrelated to system prompt wording
> - D) Vague prompts only affect response length

> **Q4.** What does a tool's JSON Schema actually guarantee, and what
> does it leave unspecified?
> - A) It guarantees both format and timing
> - B) It guarantees the format of a call via constrained decoding, but says nothing about when the model should call it or how to use the result ✅
> - C) It only specifies timing
> - D) It guarantees nothing at all

> **Q5.** Is tool guidance in a system prompt a mechanical guarantee or
> a behavioral request?
> - A) A mechanical guarantee, exactly like constrained decoding
> - B) A behavioral request — a strong nudge, not something structurally enforced ✅
> - C) Tool guidance has no actual effect on behavior
> - D) It's enforced by a separate, dedicated mechanism

> **Q6.** Why might a single, static system prompt struggle to guide an
> agent well across every stage of a multi-phase task?
> - A) Static prompts are always more effective than any alternative
> - B) Instructions written to somewhat fit every phase at once tend to be well-suited to none of them individually ✅
> - C) This problem doesn't actually exist in practice
> - D) System prompts can only be one sentence long

> **Q7.** What's the actual difference between asking the model to
> self-assess its own phase versus having code track phase as state?
> - A) No real difference — both are equally reliable
> - B) Self-assessment depends on the model correctly recognizing its stage; code-tracked state is deterministic and doesn't depend on that ✅
> - C) Self-assessment is always more reliable
> - D) Code-tracked state requires retraining the model

---

## Comprehensive sandbox

*(end of lesson, applied — a full system prompt for the continuity
thread's agent registry app, combining role, constraints, tool
guidance, and phase-awareness; grades the learner's submitted prompt
text directly, since no live LLM is available)*

*Context provided:* an agent has two tools available:
`check_agent_exists(name: str) -> bool` and
`create_agent_entry(name: str, model: str)` — working against
[the same agent registry app introduced back in Module 0](→ Module 0, the FastAPI lesson).

*Task shown to learner:* Write a complete system prompt for an agent
that helps a user register new agents in the registry. It must include:
a defined role; at least one explicit always/never constraint (e.g.,
against creating a duplicate entry); tool guidance for *both* tools,
including when each should be called and how to use its result; and a
phase structure — the agent should always **check** whether an agent
with the given name already exists *before* attempting to **create**
one, never the reverse.

*Grading (checks the learner's submitted prompt text directly):*
confirms a role-defining sentence; at least one explicit constraint;
guidance for `check_agent_exists` (when to call it, how to use a
`True`/`False` result) and separately for `create_agent_entry` (when to
call it); and explicit sequencing language establishing that checking
must happen before creating, not the reverse.

*Hint (shown on request):* This is every piece from this lesson,
composed: role and constraint first, exactly as in Concept 2; tool
guidance for each tool separately, exactly as in Concept 3; and a
phase-ordering instruction — check first, create second, only if the
check came back negative — applying [Concept 4's phase-awareness](→ this lesson, phase aware prompting concept) at the prompt level, since a single tool call round trip doesn't need the code-driven version that concept also covered.

*Correct answer + explanation (shown on failure, if requested):*
```
You are a registration assistant for the agent registry. Never create
a duplicate entry for an agent name that already exists.

Before attempting to register a new agent, always call
check_agent_exists with the requested name first. Only if it returns
False should you proceed to call create_agent_entry with the name and
model. If check_agent_exists returns True, inform the user that an
agent with that name already exists instead of attempting to create
one.
```
Every piece here does distinct, necessary work: the role and
constraint frame the agent's purpose and its one hard rule; the tool
guidance covers both tools' calling conditions and result handling
separately, since neither tool's own schema could specify any of this;
and the explicit check-then-create ordering is phase-awareness
expressed directly in the prompt — the simplest version of [Concept 4's idea](→ this lesson, phase aware prompting concept), appropriate here since this flow is only two steps, not something needing the loop's own code-tracked state the way a longer, more complex task would.
