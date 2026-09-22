# Module 2, Lesson 11 — Concept 3: What control was given up

---

## Explicit becomes implicit — not gone, just hidden

Everything [Concept 2's framework version](→ this lesson, rebuilding the lesson 4 6 agent in a framework concept) does, the hand-rolled version also did — but several things that were explicit and inspectable by hand are now internal to the framework:

- **Exactly when `max_steps` fires** — [Lesson 6's precise, hand-written check](→ this module, termination failure and control lesson, max steps the first simplest fix concept) is now a number you set, not logic you can read directly.
- **Exactly how state serializes** — [Lesson 7's `to_dict()`/`serialize_messages`](→ this module, agent state and the scratchpad lesson, serializing state from python objects to json concept) happens somewhere inside `agent.run()`, not in code you wrote or can trace line by line.
- **Exactly what the dispatch mechanism does** on an unexpected input — [Lesson 6's `execute_tool_safely`](→ this module, termination failure and control lesson) was fully yours to read; a framework's equivalent is a black box unless you go looking for its source.

This isn't a criticism of frameworks — it's the actual, honest trade [this course has named repeatedly](→ this module, planning and decomposition lesson, plan and and execute vs purely reactive concept): less code to write, at the cost of less direct visibility into exactly what's happening. Knowing this loop's real mechanics by having built it yourself is what makes that trade a genuine choice, not a leap of faith.

---

## Quiz cards

> **Q1.** What does this concept mean by "explicit becomes implicit"?
> - A) Frameworks remove capabilities the hand-rolled version had
> - B) Mechanisms like termination logic and serialization still happen, but internally, no longer as code you wrote and can read directly ✅
> - C) Frameworks are strictly worse than hand-rolled code
> - D) Nothing actually changes between the two versions

> **Q2.** Why does this concept frame understanding the hand-rolled
> mechanics as valuable, even once a framework is adopted?
> - A) It isn't valuable — the framework makes that knowledge obsolete
> - B) It's what makes adopting a framework a genuine, informed choice about trading code for convenience, rather than a leap of faith into something never actually understood ✅
> - C) Frameworks require rewriting the hand-rolled version every time
> - D) This concept doesn't actually make that argument

---

*(End of Concept 3 — final concept of Lesson 11 and Module 2. Continues
with bookends — drafted separately.)*
