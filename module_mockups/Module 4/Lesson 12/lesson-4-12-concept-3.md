# Module 4, Lesson 12 — Concept 3: What to leave out

> **Note for the site build:** no code in this concept. Every figure below comes from a demo earlier in this module, and is linked to it.

---

## Every piece has a price

This module built a lot of machinery, and [the previous concept](→ this lesson, measuring the before and after concept) measured what all of it costs together. On a short task, the full context step cost half as much again as a naive loop that simply fit. Each piece earns its place only when the problem it solves is actually present, and each has a price when it isn't:

- **Money:** rewrites break the cache, anchors are restated every turn, and summaries are extra calls.
- **Round trips:** offloaded results and tools loaded on demand have to be fetched.
- **Loss:** summaries and trimming are lossy by design.
- **Complexity:** every piece is more code to get wrong, and more places to look when the agent misbehaves.

Anthropic's advice for building agents applies to context management exactly: [find the simplest solution possible, and only increase complexity when needed](https://www.anthropic.com/news/building-effective-agents), and add complexity *only* when it demonstrably improves outcomes.

## Start by measuring

The module's first and last tools are the ones to reach for before anything else. [Lesson 1's `TurnTracker`](→ this module, context as a budget lesson, watching it grow across the loop concept) shows where a request's tokens go and how fast they grow. [`run_report`](→ this lesson, measuring the before and after concept) shows what a run cost and what went missing from it. The piece to add is the one that answers what they show.

## A guide to what to add

**Almost every agent:**

- **A stable prefix,** from [Lesson 3](→ this module, prompt caching lesson). The tools and the system prompt are fixed, with nothing changing near the start. It costs nothing but care, and pays on every request.
- **Keeping failed attempts visible, and restating the goal and rules at the end,** from [Lesson 2](→ this module, context that fits but still hurts lesson). The anchor [costs one message of cache reuse per turn](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept), and it's what keeps a long run on track.

**Long single tasks,** when the tracker shows the history heading for the window:

- **Fit in batches, clearing before cutting** ([Lesson 4](→ this module, when the history wont fit lesson)). Fitting in batches broke the prefix [3 times in 30 turns instead of 17](→ this module, when the history wont fit lesson, clear before you cut and cut in batches concept).
- **Offload large results when they arrive** ([Lesson 6](→ this module, offloading context to storage and note taking lesson)). One large log sent about [a tenth of the tokens](→ this module, offloading context to storage and note taking lesson, keep the reference not the result concept), at the price of two extra round trips.
- **Compact only after clearing** ([Lesson 5](→ this module, compaction and summarization lesson)). Clearing alone [matched summarization in the JetBrains study](→ this module, compaction and summarization lesson, what clearing cant do concept), and summaries are lossy. Compaction earns its place when clearing can no longer keep up. And on long enough runs, [fold the summaries](→ this lesson, measuring the before and after concept) too.

**Many tools, or long instructions,** when definitions or runbooks dominate the request:

- **Load them on demand** ([Lesson 7](→ this module, just in time context and dynamic tool exposure lesson)). The prefix shrank [26 times](→ this module, just in time context and dynamic tool exposure lesson), but cost fell only about 21% on that task, because searches are round trips. If a provider offers built-in tool search, prefer it, since it keeps each tool's schema enforced.

**Across sessions,** when users come back and shouldn't have to repeat themselves:

- **Long-term memory, with its write rules from the start** ([Lessons 8–10](→ this module, short term and long term memory lesson)). If an agent has memory at all, [the source rule](→ this module, deciding what to remember lesson, memory poisoning and the source rule concept) isn't optional: one planted instruction replays in every future session.
- **Scoring and forgetting once the store grows** ([Lesson 11](→ this module, forgetting aging and retrieval quality lesson)). They matter after months of sessions, not in the first week.

**Short tasks that fit:** none of the fitting, compaction or offloading machinery. The canonical loop, with a stable prefix, is the right design.

## Where the module leaves off

Several questions this module raised belong to later modules:

- **Retrieval by meaning,** rather than by keywords, for tools, notes and memories: Module 5.
- **Guardrails** on what an agent may do with what it recalls: Module 6.
- **Measuring whether any of this makes the agent better at its task,** which is the question every choice here ultimately depends on: Module 7.
- **Sub-agents** that keep messy work out of the main context altogether: Module 8.
- **Showing users their memories, and letting them edit them:** Module 9.
- **Retention, deletion rights and compliance:** Module 10.

---

## Quiz cards

> **Q1.** On a short task that fits the window, what did the full context step do to cost?
> - A) Cut it by half
> - B) Left it unchanged
> - C) Raised it by about half, because the naive loop's history was almost all cached, while the context step paid for rewrites, anchors and summaries ✅
> - D) Made it impossible to measure
>
> *Explanation:* At 7 checks, the managed loop cost 1.5 times the naive one. The context step pays off only when the history grows long.

> **Q2.** Which pieces are worth having in almost every agent?
> - A) Compaction and memory
> - B) A stable prefix, and restating the goal and rules at the end ✅
> - C) Tool search and offloading
> - D) Forgetting and archiving
>
> *Explanation:* A stable prefix costs nothing but care, and the anchor costs one message of reuse per turn. The rest is for particular problems.

> **Q3.** What should decide which piece to add next?
> - A) Whichever piece is newest
> - B) Adding all of them at once, to be safe
> - C) Whichever piece a provider offers
> - D) What measurement shows: where the tokens go, how fast they grow, and what goes missing ✅
>
> *Explanation:* Add complexity only when it demonstrably improves outcomes. `TurnTracker` and `run_report` are the module's tools for finding out.

> **Q4.** An agent will have long-term memory. Which part isn't optional, even in a first version?
> - A) Scoring and forgetting
> - B) Folding summaries
> - C) The source rule: only the user can create standing instructions ✅
> - D) Tool search
>
> *Explanation:* Scoring and forgetting matter once the store grows. Without the source rule, one planted instruction replays in every future session.

> **Q5.** Loading tools on demand shrank the prefix 26 times, yet cost fell only about 21% on that task. Why?
> - A) Each search is a round trip, and caching had already made the large prefix cheap to resend ✅
> - B) The tools were loaded twice
> - C) The prefix wasn't cached
> - D) Loading on demand doesn't save tokens
>
> *Explanation:* The saving that's always there is room in the window. The money saved depends on the task.

---

*(End of Concept 3 — final concept of Lesson 12. The lesson continues with the recap and comprehensive sandbox.)*
