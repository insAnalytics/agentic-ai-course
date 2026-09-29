# Module 6, Lesson 1 — Concept 5: Where agents fail, and where each failure is handled

---

## Why sort failures at all

Say an agent fails 30 runs out of 100. "Make it more reliable" isn't
something you can act on. "Eleven of those runs called a tool with the
wrong order id, and eight stopped before finishing the second half of the
request" is, because each of those has a specific fix. Sorting failures
into kinds turns a success rate into a to-do list.

Two studies show what sorting finds in single-agent systems. (Failures
between several cooperating agents are their own subject, in Module 8.)

**τ-bench's failure analysis.** The authors of
[τ-bench](https://arxiv.org/abs/2406.12045) read through the failed runs of
their best agent on the retail tasks, one run per task. Of the 36 failures
caused by the agent, rather than by a flaw in the task:

- **About 55% were wrong arguments or wrong information:** the right tool
  called with a wrong value, such as the wrong item after reasoning badly
  over a product list, or a wrong total told to the customer.
- **About 25% were wrong decisions:** the agent misread or ignored a rule
  in its written policy, such as exchanging one item when the policy said
  all items had to go in a single exchange call.
- **About 19% were requests only partly handled:** the customer asked for
  several things, and the agent did some of them and stopped, or fixed one
  order's address when all of them needed fixing.

That's one model on one set of tasks, 36 runs in all. It's a snapshot, not
a law, but the three kinds are ones you'll recognise from your own agents.

**Zhu et al.'s AgentErrorTaxonomy.** In
[*Where LLM Agents Fail and How They Can Learn from Failures*](https://arxiv.org/abs/2509.25370)
(Zhu et al., 2025), researchers annotated failed runs from three
benchmarks: household tasks in a text game (ALFWorld), web shopping
(WebShop) and general assistant questions (GAIA). They sorted each failure
by the part of the agent where it started: memory, reflection, planning,
action, or the system around the model. Their central finding is about
*when* errors happen rather than what kind they are. They name error
propagation, an early mistake cascading into the steps that build on it, as
the main bottleneck for agent reliability. So the last error in a failed
run is often not the one to fix.

That changes how you read a failed run. Scroll up to the first step that
went wrong, not the last. If the agent picked the wrong order at step 3,
the wrong refund at step 9 isn't a separate problem.

---

## The map: each failure and where it's handled

Most failure modes already have a home in this course. This module stays
focused by pointing to them rather than teaching them again. Here's the
map, roughly in the order you'd meet each one while an agent runs:

| Failure | What it looks like | Where it's handled |
|---|---|---|
| Never stopping | The loop calls tool after tool without finishing | [max steps](→ Module 2, termination, failure and control lesson, max steps concept) and [repeated-action detection](→ Module 2, termination, failure and control lesson, repeated-action detection concept) |
| Stopping too early | The agent says it's done when it isn't | [a deterministic check on real state](→ Module 2, termination, failure and control lesson, goal-state termination checks concept, the "a deterministic check on real state" subsection) |
| Handling only part of a request | Two of three things done, the third forgotten | [goal decomposition](→ Module 2, planning and decomposition lesson, goal decomposition concept), plus the goal-state check above |
| Drifting from the goal | A long session wanders off what the user asked | [re-anchoring the goal](→ Module 4, context that fits but still hurts lesson, re-anchoring the goal concept) |
| Wrong tool arguments | The right tool, called with a wrong or invented value | [validating arguments](→ Module 3, tool schemas and argument validation lesson, the "validate, and return failures as observations" concept); Lesson 3 adds checks on tool calls and their results |
| A tool or service failing | Timeouts, errors, a dependency that's down | [tool errors as observations](→ Module 2, termination, failure and control lesson, tool errors as observations concept) and [which failures to retry](→ Module 3, tools that call the outside world lesson, the "which failures to retry, and how" concept); Lesson 8 covers fallbacks when a dependency stays down |
| Misreading or ignoring a rule | The agent does something its instructions forbid | [behavioural constraints in the system prompt](→ Module 2, the system prompt as agent design lesson, role, persona, and behavioral constraints concept); rules that code can check move into Lesson 3's checks |
| Claims the sources don't support | An answer cites a document that doesn't say that | Lesson 4 |
| Giving in to the user | Dropping a correct answer under pushback, or accepting a false premise | [sycophancy](→ Module 1, the training pipeline lesson, preference training and message roles concept, the "sycophancy: a real, documented side effect" subsection); Lessons 4 and 6 |
| Different answers on different runs | The same question, answered correctly only some of the time | this lesson, and Lesson 5's voting |
| Pressing on when unsure | Guessing instead of asking, stopping or handing over | Lesson 6 |
| Acting on instructions in untrusted text | A retrieved page or tool result steers what the agent does | [the tool threat model](→ Module 3, the tool threat model lesson, prompt injection through tool results concept); Lesson 9 restricts what an agent may do after reading |
| Actions that fail silently, or false reports | "I've sent the email" when the send failed | Lesson 7 |

Two things stand out:

- **The early rows are mostly handled by ordinary code.** Step limits,
  state checks and argument validation are deterministic, and they catch
  every failure they're built to detect, but only those. Validation stops a
  malformed argument, not a well-formed wrong one: an order id that exists
  but belongs to the wrong order passes every schema check. That's why
  τ-bench's most common failure, wrong arguments, also appears among the
  failures Lesson 3's checks and Lesson 4's verification go after.
- **The later rows need judgement.** Whether a claim is supported, whether
  the agent should be confident, whether the user is right: these are where
  this module spends most of its time, and where every fix has a cost, which
  the next lesson makes concrete.

---

## Using the map on a failed run

A short routine, in the order the studies above suggest:

1. **Find the first step that went wrong.** Read the run from the start.
   Later errors usually follow from the first one.
2. **Name its kind from the table.** If it doesn't fit any row, write the
   new kind down: your agent may have a failure mode worth its own check.
3. **Count before you fix.** One run proves a failure is possible; the
   count across many runs says whether it's worth fixing first.
4. **Fix it where it lives,** with the technique the table points to, and
   measure again, as pass^k rather than a single run.

---

## Quiz cards

> **Q1.** An agent's run fails at step 12, when it issues a refund for the
> wrong amount. Looking back, at step 4 it picked the wrong order from a
> list of three. Which should you fix first?
> - A) The refund at step 12, since that's where the money actually went out wrong
> - B) The order choice at step 4, since the wrong refund followed from it ✅
> - C) Both equally, since each one is a separate failure with its own fix
> - D) Neither yet: rerun the task first and see whether it fails again
>
> *Explanation: this is error propagation, the central finding of Zhu et
> al.'s study: a run usually fails because every later step built on one
> early mistake. Fixing the refund step would leave the agent refunding the
> right amount for the wrong order. Rerunning tells you how often it fails,
> which is worth knowing, but not what to fix.*

> **Q2.** In τ-bench's analysis of its best agent's failures, what was the
> largest group?
> - A) Loops that never stopped
> - B) Following injected instructions from tool results
> - C) Wrong arguments or wrong information: the right tool, called or answered with the wrong value ✅
> - D) Tools that timed out or returned errors
>
> *Explanation: about 55% of the 36 failures were wrong arguments or
> information, 25% were wrong decisions about the policy, and 19% were
> requests only partly handled. It's one model on one benchmark, so treat
> the proportions as a snapshot; the kinds are the useful part.*

> **Q3.** A customer asks an agent to update the address on all three of
> their orders. It updates the first and replies that it's done. Which
> techniques from the map address this?
> - A) Max steps and repeated-action detection, since the agent stopped early
> - B) Argument validation on the update tool, since an address was written
> - C) Voting across several runs, so the majority catches the missed orders
> - D) One step per order, and a check on the real orders before finishing ✅
>
> *Explanation: this is a partly handled request, which also shows up as
> stopping too early. Decomposition makes the three updates explicit; a
> goal-state check reads the real orders and refuses to accept "done" while
> any address is unchanged. Nothing about the loop ran too long, and the one
> address it wrote may well have been correct.*

> **Q4.** Why does this module point to earlier lessons for failures like
> never stopping or malformed arguments, instead of covering them again?
> - A) Those failures are too rare in real agents to be worth the space
> - B) Earlier lessons already fix them in code; this module takes the ones needing judgement ✅
> - C) They only affect multi-agent systems, which Module 8 covers
> - D) Code can't detect them, so there's nothing practical to teach
>
> *Explanation: step limits, state checks and argument validation are
> ordinary code that reliably catch what they're built to detect, and
> they're already part of the agent built in Modules 2–5. The failures left
> over, such as a well-formed but wrong argument, an unsupported claim or
> giving in to a user, are harder, because checking them takes judgement and
> every check has a cost.*

> **Q5.** You find a failure in your agent's runs that doesn't fit any row
> of the table. What's the sensible next step?
> - A) Assume it's random noise from sampling and leave it alone
> - B) File it under the closest row so the table stays complete
> - C) Name it as a new kind, and count how often it happens ✅
> - D) Switch to a larger model, since unusual failures come from model size
>
> *Explanation: a taxonomy is a tool for deciding what to fix, not a closed
> list. Forcing a new failure into the nearest row sends you to the wrong
> fix. Counting first tells you whether it's a one-off or a pattern worth a
> check of its own.*

---

*(End of this concept, and the last in this lesson. The recap page brings
the lesson together.)*
