# Module 2, Lesson 11 — Concept 1: What a framework actually provides

---

## Four things, two already built by hand

A framework packages the same core pieces this module built from
scratch, plus two new ones:

- **The loop** — [Lesson 4's `while`/dispatch structure](→ this module, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept), now hidden behind a method call.
- **State handling** — [Lesson 7's scratchpad and serialization](→ this module, agent state and the scratchpad lesson), managed internally rather than a `messages` list you build yourself.
- **Tracing hooks** — new: structured visibility into what the loop actually did at each step, without hand-adding `print()` statements everywhere the way this module's demos have throughout.
- **A deployment path** — new: a defined way to actually run this agent as a real, reachable service, beyond a local script. Kept as a forward-pointer here — full deployment technique belongs to a much later module.

None of this is new capability the hand-rolled version couldn't do —
it's the same mechanisms, packaged and given a stable, reusable API.

---

## Quiz cards

> **Q1.** Which two things a framework provides has this module already
> built by hand?
> - A) Tracing hooks and a deployment path
> - B) The loop (Lesson 4) and state handling (Lesson 7) ✅
> - C) Nothing — frameworks provide entirely new capabilities
> - D) Only the loop, nothing else

> **Q2.** What do tracing hooks add that this module's demos relied on
> instead?
> - A) Nothing — tracing and printing are identical
> - B) Structured visibility into the loop's behavior, without hand-adding `print()` statements at every step ✅
> - C) A way to avoid ever needing to debug an agent
> - D) A replacement for `max_steps`

---

*(End of Concept 1. This lesson continues with Concept 2 — rebuilding
the Lesson 4–6 agent in a framework — drafted separately.)*
