# Lesson Structure — Template & Rules

> **Status:** Locked template for how every lesson on the site is structured.
> This defines the *shape* lesson content must follow — not the content
> itself. Content is authored separately, lesson by lesson, and must conform
> to this structure.
>
> **For Claude Code:** this is context for building the components that
> render and grade lesson content (concept blocks, quiz cards, sandbox
> exercises) — not a spec to generate lesson content from. Lesson content
> itself is authored in chat, one lesson at a time, and handed over once
> finished.

---

## 1. Lesson shape

A lesson is built from a repeating unit, followed by a fixed closing sequence:

```
[Learning outcomes callout]
[Why it matters]

[Concept section → quiz card(s)] × N     — repeats per distinguishable concept
[Applied sandbox exercise] × 1–2         — at natural checkpoints, not after every concept

[Comprehensive quiz]                     — end of lesson, conceptual, spans all concepts
[Comprehensive sandbox]                  — end of lesson, applied, combines everything
```

## 2. Section-by-section rules

### Learning outcomes callout
- 2–3 concrete, checkable outcomes ("do X", not "understand X").
- Everything the outcomes promise must actually be covered in the concept
  sections below — no outcome should exist without matching content.

### Why it matters
- Short. Grounded in the course's actual end goal (agentic AI systems), not
  generic subject-matter motivation.

### Concept sections
- One section per distinguishable idea. A lesson has as many concept
  sections as it has genuinely separate ideas — no fixed count.
- Each concept section includes a code snippet that **runs live and shows
  output**. It's editable (a scratchpad for the learner to tinker in — e.g.
  add another `print`) but never graded — this is for demonstration, distinct
  from the graded sandbox exercises. It does not run on page load; the
  learner triggers execution explicitly (a "Run" click). "Runs live" doesn't
  have to mean Pyodide specifically — a scripted terminal demo (click Run,
  steps reveal progressively, no real backend) is a valid substitute when
  the point is showing what a command's output looks like rather than
  needing the learner to actually edit and re-run it (e.g. terminal/Docker
  commands, first used in Lesson 0.8).
- Errors/crashes can be shown deliberately as part of teaching (e.g. show
  the crash before teaching the fix) — this is a valid walkthrough technique,
  not a mistake.

### Quiz cards
- Placed after each concept section.
- **Quantity follows section density** — however many distinguishable
  sub-ideas the section covers, not a fixed number per section.
- Each quiz card: question, multiple choice options, one marked correct,
  and an explanation shown after answering (why the correct answer is
  correct, ideally also why the common wrong answer is tempting).
- Conceptual only — no code writing/execution in a quiz card.

### Applied sandbox exercises
- Placed at natural checkpoints — not mandatory after every single concept
  section. Typically 1–2 per lesson, at points where a concept is ready to
  be applied.
- **Format:** starter code (empty or partially built, like a fill-in-the-gap)
  → learner edits and submits → graded against hidden test cases → on
  failure, learner can choose: retry, view a hint, or view the correct
  answer with an explanation.
- **Difficulty ramps by composition, not puzzle complexity** — a later
  exercise in the same lesson can be "harder" only by requiring the learner
  to combine concepts already taught earlier in that same lesson (e.g.
  control flow + try/except together). Never harder via added logical
  trickiness or scope beyond what's been taught.
- Every exercise must include, fully written (nothing left as a description
  for later): starter code, the task description, hidden test cases, a hint,
  and the correct-answer explanation.

### Comprehensive quiz (end of lesson)
- Conceptual, spans every concept section in the lesson, mixed order (not
  grouped by section).
- Same quiz card format as above (question, options, correct answer,
  explanation) — just positioned at the end and broader in scope.

### Comprehensive sandbox (end of lesson)
- One applied exercise combining everything taught in the lesson.
- Same fully-graded format as applied sandbox exercises (starter code, task,
  hidden tests, hint, correct-answer explanation).
- This is the natural difficulty ceiling of the lesson — composes every
  concept taught, not a harder/trickier problem than the material supports.
- **When the lesson's concepts genuinely can't compose into a single
  in-browser exercise** (e.g. they need more than one real service running
  together — an app *and* a database), this slot becomes a **comprehensive
  downloadable project** instead: a real, runnable project the learner
  clones and works through locally, still combining everything the lesson
  taught, just not gradeable in-browser. See
  [architecture.md §4.3](architecture.md#43-downloadable-project-local-learners-own-machine).
  This is the exception, not the default — reach for it only when the
  in-browser format genuinely can't fit, not as a shortcut.
- **When the lesson is purely conceptual and has no natural "write code,
  pass hidden tests" task** (e.g. Lesson 1.1, Tokenization — reading plus
  trying real interactive tools, no learner-authored code anywhere in the
  lesson), this slot becomes a **reflective, ungraded closing synthesis**
  instead: a predict-then-check activity reusing the lesson's own
  interactive components (not a new one), explicitly framed to the learner
  as review rather than required completion — no starter code, no hidden
  tests, no hint/correct-answer pair, since there's nothing being graded.
  Also the exception, not the default — a lesson with any real
  learner-authored code (even a small from-scratch exercise, like a toy
  BPE implementation) still gets a real graded comprehensive sandbox
  built around that code, same as any other lesson.

## 3. What's explicitly NOT part of this template

- No separate "check yourself" section — comprehensive quiz + comprehensive
  sandbox together replace this.
- No content decisions belong to Claude Code. If a lesson's content doesn't
  yet cover something its learning outcomes promise (e.g. an outcome
  mentions environment setup but no concept section teaches it), that's a
  content gap to fix during authoring — not something to be filled in during
  implementation.

## 4. Authoring process (for reference, not implementation)

Lessons are drafted one at a time, in chat, section by section, reviewed and
corrected before being locked. Full content (all code, all quiz questions,
all sandbox starter code/tests/hints/answers) is finalized before a lesson
is handed off — nothing is left as a description of what content should be
there.

## 5. Multi-file sandboxes

Most live demos and exercises are single-file. When a concept genuinely
needs more than one file talking to each other — real `import` statements,
`if __name__ == "__main__":` behavior, a module split across files — the
sandbox supports multiple file tabs in one instance, with real imports
working between them (first used in Lesson 0.3's modules-and-imports
concept; see `tool_registry.py`/`main.py` there for a worked example).

**How to mark it in a mockup:** label each file as its own tab before its
code block:

```
**Tab: `tools.py`**
​```python
def search(query):
    return f"searching for {query}"
​```

**Tab: `main.py`**
​```python
from tools import search
print(search("weather"))
​```
​```
searching for weather
​```
*(runs live across both tabs, shows output — read-only demo, not graded)*
```

Same idea for a graded multi-file exercise — starter code for each file
tab, one task description, hidden tests (which may import directly from a
non-entry file — e.g. testing a function in `tool_registry.py` independent
of whatever `main.py` does with it), a hint, and a correct-answer version of
every file. State which file is the **entry point** (the one that actually
runs / gets graded when Run or Submit is clicked) — usually `main.py`, but
say so explicitly if it's ever ambiguous.

Only reach for multi-file when the concept is actually *about* multiple
files (imports, module structure) — don't split an otherwise single-file
exercise across files for no reason.

## 6. Linking back to an earlier concept

The site makes every concept individually linkable (each concept page, and
every named sub-topic within it, has its own stable URL). When a mockup's
text calls back to something taught elsewhere — "as covered in the dicts
section," "same pattern as the counter example earlier in this lesson,"
"you saw this in Lesson 0.1" — **mark it explicitly** instead of leaving it
as plain prose, so it becomes a real clickable link during conversion:

```
[the dict iteration pattern](→ Lesson 0.2, Dicts, the .items() iteration example)
[the counter example](→ this lesson, the nonlocal/closures concept)
[you saw this earlier](→ Lesson 0.1, the control-flow concept, the for-loop example)
```

Standard Markdown link syntax, but the part in `(...)` is a plain-language
pointer to the target — not a real URL. Give enough detail to find the
target unambiguously: which lesson, which concept, and if it's a specific
named sub-topic within that concept, name it. Resolving that pointer to the
actual link is handled during conversion — don't try to write real site
paths or anchors by hand.

This works anywhere text appears in a mockup — concept prose, quiz
explanations, and exercise hints/tasks/correct-answer explanations are all
linkable now, not just the main walkthrough text.

**Rules:**
- Only mark a callback when there's one clear, specific place it points to.
  A vague or generic callback ("the loop pattern from earlier") with no
  single precise target should stay as plain prose rather than force a
  loose or misleading link.
- Don't add "Lesson N" / "Concept N" to the link text or the sentence
  around it unless it already reads naturally that way — the link itself
  is the navigation, so calling out the number too is usually redundant.
  "as you saw earlier" beats "as you saw in Lesson 0.1" when both link to
  the same place.
- A callback to something earlier in the *same* lesson or even the *same*
  concept is just as worth marking as a cross-lesson one.
