# Course Website — Architecture Decisions

> **Status:** Living document. This defines the *current* setup for a zero-cost,
> personal-project course site with in-browser micro-sandboxes. It is expected
> to change — specifically the sandbox section — once the course reaches
> "meatier" agentic exercises that need real tool execution.
>
> **For Claude Code:** treat this as the source of truth for how the site is
> structured and built. When a course section requires something this doc
> doesn't cover yet (e.g. real sandboxed execution, persistence, auth), stop
> and flag it — don't silently improvise new infrastructure. Update this file
> alongside any architectural change so it stays accurate.

---

## 1. Goals & constraints

- **Cost: effectively $0.** No paid hosting, no paid compute, no server-side
  LLM calls billed to the site owner.
- **Content authoring must be easy for a non-developer (or future collaborators)
  to manage.** Adding/editing a lesson should mean adding/editing content
  files (a lesson folder of `.mdx` pages), not touching app code.
- **Local preview.** The site owner should be able to run the site on their
  own machine, see changes live, before pushing.
- **In-browser code execution for simple exercises**, wired per-lesson via
  config, not hardcoded per page.
- **Explicitly out of scope for now:** real containerized/agentic sandboxes,
  server-side LLM proxying, user accounts, payments.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** + **MDX** | Content-first static site generator. Ships zero JS by default; interactive bits (like the sandbox) are opt-in "islands," so most of the site stays fast and free to host. Better fit than Next.js for a content-heavy course site. |
| Content model | **Astro Content Collections** | Lessons are files with typed frontmatter (title, module, order, sandbox config). Astro validates structure at build time, so a malformed lesson file fails the build loudly instead of breaking silently. |
| In-browser execution | **Pyodide** (Python compiled to WASM) | Runs entirely client-side. Zero server cost, scales to any number of learners for free. Good enough for concept-level exercises (agent loop logic, tool-call parsing, state handling written in plain Python). |
| Code editing | **CodeMirror 6** (`@uiw/react-codemirror` + `@codemirror/lang-python` + `@uiw/codemirror-theme-vscode`) | Real syntax highlighting (VS Code's own dark theme) and Python-aware completion for every editable code box — a plain `<textarea>` can only render flat, single-color text. Lighter than Monaco, a real editor rather than a highlight-only overlay trick. |
| LLM calls (when a lesson needs one) | **Learner's own API key**, stored in browser `localStorage` only, sent directly from the browser to the provider's API | Keeps cost and liability at $0 regardless of traffic. Never touches any server we control. |
| Hosting | **Cloudflare Pages** (or GitHub Pages) free tier | Static output from Astro deploys directly from a git push. No server to maintain. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Clean-docs look (white background, Inter). Palette and component identity colors documented in §7. |

---

## 3. Content architecture

Course content lives as files, not database entries. One lesson = one
**folder**, one page (intro / concept / recap) = one `.mdx` file inside it —
split this way specifically so a lesson reads as several focused pages with
sidebar navigation, not one very long scroll.

```
/src
  /content
    /modules
      01-foundations/
        _module.yaml                    # module title, description, order
        01-what-is-an-agent/
          _lesson.yaml                  # lesson title, module, order, projectDownload
          00-intro.mdx                  # LearningOutcomes + WhyItMatters (+ any asides)
          01-a-tool-is-just-a-function.mdx   # one concept per file
          02-recap-practice.mdx         # comprehensive quiz + comprehensive sandbox
      02-tool-calling/
        _module.yaml
        01-designing-a-tool/
          _lesson.yaml
          ...
  /components
    Sidebar.astro               # left nav — accordion per lesson, listing its pages
    PageNav.astro                # Prev/Next footer between sibling pages in a lesson
    ProjectDownload.tsx         # link/zip for heavier local projects
    /lesson                     # components implementing lesson-structure.md
      LearningOutcomes.astro
      WhyItMatters.astro
      ConceptSection.astro
      Subsection.astro            # sub-heading + content, alternating background per instance
      CodeEditor.tsx               # shared CodeMirror 6 editor (VS Code dark theme, Python highlighting)
      LiveDemo.tsx               # editable, ungraded code demo (Pyodide, manual run)
      QuizGroup.tsx                # cycles one multiple-choice question at a time
      GradedExercise.tsx          # editable code, graded against hidden tests
      MultiFileEditor.tsx          # shared file-tab strip + CodeEditor, used by both multi-file components below
      MultiFileLiveDemo.tsx        # multi-file LiveDemo — real cross-file imports, editable or readOnly per file
      MultiFileGradedExercise.tsx  # multi-file GradedExercise — real imports, graded via a real Pyodide FS + sys.modules
      CheckpointZone.astro        # full-bleed colored band behind a quiz/exercise card
  /lib
    pyodide.ts                  # shared Pyodide loader + single-file and multi-file grading harnesses
  /layouts
    BaseLayout.astro            # shell: sidebar + main slot, fonts, global.css
    LessonLayout.astro          # page chrome (breadcrumb + hero + PageNav), wraps BaseLayout
  /styles
    global.css                  # Tailwind import + color/font tokens
  /pages
    [module]/[lesson]/[page].astro   # renders one page; getStaticPaths from the `pages` collection
```

**Content collections** (`src/content.config.ts`): `modules` (unchanged),
`lessons` (loads each `_lesson.yaml`, schema `title`/`module`/`order`/
`projectDownload`), and `pages` (loads every `.mdx` under a lesson folder,
schema `title`/`lesson`/`order` — `lesson` holds the parent lesson's slug,
same pattern as `lessons.module`). A page's `order` also drives its
`PageNav` Prev/Next; `0` is reserved for the intro, the highest number is
always Recap & Practice.

A page's MDX body follows the shape in
[lesson-structure.md](lesson-structure.md) — spread across pages instead of
one page per lesson: the intro page carries learning outcomes/why-it-matters,
each concept page carries its own live demos and quiz questions plus a
per-concept graded exercise at natural checkpoints, and the Recap & Practice
page carries the comprehensive quiz + comprehensive sandbox. Each piece is
one of the `/components/lesson` components above, imported and given content
inline as props — content itself is authored in chat, not generated from a
spec.

**`ConceptSection` usage rule:** a page's own hero title (rendered by
`LessonLayout`) already names what the page is about, so `ConceptSection`'s
colored banner would be pure redundancy on any page — no page uses it
anymore, including Recap & Practice (its comprehensive quiz and
comprehensive sandbox now sit directly under the page, told apart by their
own `CheckpointZone` header-bar color rather than a repeated sub-heading).
Concept pages put `Subsection`s directly under the page.

All quiz questions for one spot in a lesson (a concept page, or the
Recap & Practice page's comprehensive quiz) go into a single
`<QuizGroup questions={[...]} />` call, which shows one question at a time
with a progress indicator rather than stacking every question's card on the
page — keeps long quiz sets from dominating the page.
Every `<QuizGroup>` and `<GradedExercise>` is wrapped in `<CheckpointZone>`,
a full-bleed band in the shared `--color-checkpoint-bg` color that sits
behind the card (not the card's own background) — the signal to the learner
is "the reading ends here, you're being tested now." The card itself keeps
its own header-bar color (violet for quiz, navy for exercise) to tell the
two apart; the zone color is what marks both as "not reading content."
Within a concept page, each `###`-level sub-topic is wrapped in
`<Subsection title="..." variant="a"|"b">`, alternating the variant by hand
between consecutive subsections (no automatic counter — Astro components mix
with other div-based content at the same nesting level, so CSS
`nth-of-type` alternation isn't reliable) to give each one a distinct
background band.
**Linking to another concept:** every `<Subsection title="...">` gets a
deterministic `id` (the title lowercased, non-alphanumerics collapsed to
`-`) so any concept is deep-linkable as `/module/lesson/page/#slug` — no
manual anchor bookkeeping. When a mockup calls back to something taught
elsewhere ("as covered in the dicts section," "you saw this pattern
earlier"), write it as a real Markdown link to that subsection's anchor
(same-page callbacks can just use `#slug`) — this works both in a page's
MDX prose (rendered natively as `<a>` by MDX) and inside a `hint`,
`explanation`, `task`, or similar plain-string prop passed to
`QuizGroup`/`GradedExercise`/`MultiFileGradedExercise`, via
`<LinkedText text={...} />` (`src/components/lesson/LinkedText.tsx`) — a
small parser those components use internally that finds `[text](url)` in an
otherwise-plain string and renders it as a real anchor, leaving everything
else as text. It is intentionally not a general Markdown renderer (no bold,
code spans, etc. — only link syntax) so it stays predictable inside a prop
that's mostly plain sentences. Skip the link rather than force one onto a
vague callback ("earlier in the module") that has no single precise target
— an honest miss is better than a link that lands somewhere only loosely
related. **Style note:** don't spell out "Lesson N"/"Concept N" in the link
text or surrounding sentence unless it already reads naturally that way —
the link itself is the navigation, a lesson number next to it is usually
redundant.
`LiveDemo`, `QuizGroup`, and `GradedExercise` are React and **must** carry
`client:load` in the MDX, or they render as static, non-interactive markup.
Adding a lesson = adding a lesson folder with a `_lesson.yaml` and its page
`.mdx` files in the right module folder. No app code changes required for
ordinary content.

---

## 4. Sandbox architecture (current: in-browser only)

Per [lesson-structure.md](lesson-structure.md), a lesson uses Pyodide in two
distinct roles, both built on the shared loader in `src/lib/pyodide.ts`.
Both roles edit code through the shared `<CodeEditor />` (CodeMirror 6 +
`@uiw/codemirror-theme-vscode`'s dark theme + `@codemirror/lang-python`) —
real syntax highlighting and Python-aware completions, not a plain
`<textarea>`, which can only render flat single-color text:

- **`<LiveDemo />`** — editable, ungraded code shown inside a concept
  section (a scratchpad the learner can tinker with, e.g. add another
  `print`). Never runs on page load — only on an explicit "Run" click.
  Deliberate crashes are shown as a teaching device when the learner runs
  the starter code as-is. Optional `setupCode` prop: hidden code run
  silently (output discarded) immediately before the visible code, on every
  Run click — for seeding a fixture the demo assumes already exists (e.g.
  writing a file into Pyodide's virtual FS before a file-reading demo),
  without cluttering the shown code with unrelated setup or depending on
  some other demo having run first. First used in Lesson 0.6's file I/O
  concept.
- **`<GradedExercise />`** — editable starter code, submitted and run against
  hidden test snippets inside the same Pyodide instance. Only pass/fail
  counts are surfaced to the learner; test source is never sent to the
  client-visible DOM in a way a learner would casually read, but note this is
  still client-side execution — a determined learner can inspect the MDX
  source. Treat hidden tests as sequencing psychology, not real security.
  Optional `setupCode` prop, same idea as `LiveDemo`'s: hidden code run
  silently on Pyodide's real filesystem before grading, every submit — for
  a hidden test whose function reads a real file by path (real file I/O
  touches Pyodide's actual FS regardless of the in-memory namespace
  `hiddenTests` otherwise runs in). First used in Lesson 0.6's CSV concept.
- **`asyncio.run()` shim**: `pyodide.runPythonAsync` already executes inside
  its own live event loop, so real `asyncio.run(...)` — the standard entry
  point every learner would actually write — raises "cannot be called from a
  running event loop" if run as-is (confirmed by testing against the pinned
  Pyodide version). Both execution paths rewrite a top-level
  `asyncio.run(coro())` to `await (coro())` immediately before running it —
  equivalent for a single top-level call, and purely an execution shim:
  lesson content keeps writing and showing real `asyncio.run(...)`, never a
  browser-only substitute. Introduced in Lesson 0.7's `async`/`await`
  concept.
  - `LiveDemo` (`runCapturingOutput`): applies the text rewrite, then runs
    the whole thing through `runPythonAsync`, which supports top-level
    `await` natively.
  - `GradedExercise` (`TEST_HARNESS`, both the learner's own code and each
    hidden test): a plain `exec(compile(src, ..., "exec"))` can't contain a
    top-level `await` at all (`SyntaxError`), so the harness instead
    compiles with `ast.PyCF_ALLOW_TOP_LEVEL_AWAIT` and runs the result via
    `eval()` — the same mechanism CPython's own async REPL uses. If the
    (shimmed) source contains a top-level await, `eval()` returns a
    coroutine, which the harness itself `await`s (valid there since
    `TEST_HARNESS` runs via `runPythonAsync` too); otherwise `eval()` just
    runs the code normally and returns `None`, so every pre-existing
    synchronous hidden test elsewhere in the course is unaffected — verified
    directly, including a deliberate-failure case, before shipping.
  exercises are hand-rolled Python (not a framework like LangChain) — this is
  deliberate: for teaching, seeing the raw loop matters more than hiding it
  behind a library, and it also sidesteps Pyodide's lack of support for
  native/C-extension packages.
- "Tools" in these exercises are plain Python functions (calculator, mock
  APIs, virtual file read/write) — no real network or shell access is
  possible or expected at this tier.

**Multi-file sandboxes** (`<MultiFileLiveDemo />` / `<MultiFileGradedExercise />`,
first used by Lesson 0.3's modules-and-imports concept): several files shown
as tabs in one sandbox instance, with real `import` statements working
between them — needed to teach genuine module/`__name__` semantics, which a
single exec'd string can't demonstrate. Unlike single-file mode (which execs
learner code into an in-memory `dict` namespace — no real filesystem or
module system involved at all), multi-file mode writes every file to
Pyodide's real virtual filesystem and lets Python's own import machinery
resolve them:
- Each sandbox **instance** gets its own directory under the shared Pyodide
  FS (`/sandboxes/<instanceId>`), pushed onto `sys.path` only for the
  duration of that instance's run and popped afterward — this course reuses
  filenames (`main.py`, `tools.py`) across multiple independent sandbox
  instances on the same page, so per-instance isolation is what keeps them
  from colliding.
- Before every run, every file's module name (filename minus `.py`) is
  popped from `sys.modules` — otherwise Python's import cache would keep
  serving a stale version after the learner edits a non-entry file and
  re-runs.
- Grading runs the entry file first (its own output/errors surfaced to the
  learner, but never gating what follows — a hidden test may import and
  check a *different* file directly, independent of whether the entry file
  itself is wired up correctly), then runs the hidden-test script as one
  block in a fresh namespace, with its own imports resolving against the
  same already-invalidated module cache.
- All Pyodide calls (single-file and multi-file alike) are serialized
  through one queue in `pyodide.ts`, since the interpreter is one shared
  global instance across every sandbox on a page — without it, two
  components' runs could interleave mid-`await` and corrupt each other's
  `sys.path`/`sys.modules` edits.
- `MultiFileEditor`'s CodeMirror instance is keyed by the active filename so
  React remounts it on every tab switch; without that key, `@uiw/react-codemirror`
  does not reliably re-sync its displayed content to a new `value` prop when
  reused across two different controlled values, even though the underlying
  file state is correct (verified: grading a stale-looking tab still used
  the right code — it was a display bug, not a data bug).

**Known ceiling of this approach** (why it will need revisiting):
- No real subprocess/shell execution.
- No native/compiled Python packages.
- No genuine multi-agent, long-running, or stateful-across-sessions execution.

**Planned fallback for heavier builds (not yet implemented):** downloadable
project scaffolds (a repo/zip per project) that learners clone and run
locally with their own machine and their own API key — via
`projectDownload` in frontmatter and the `<ProjectDownload />` component.
This keeps cost at $0 by pushing real compute to the learner's machine.

**If/when real sandboxed execution becomes necessary** (e.g. a module truly
needs live multi-step agent runs in-browser, not just local downloads): the
leading candidate is a managed ephemeral-sandbox provider (e.g. E2B) with a
free/hobby tier, added as a new execution backend alongside — not replacing —
Pyodide. **This section must be rewritten when that decision is made.**

---

## 5. Local editing/preview workflow

1. Clone the repo.
2. `npm install`
3. `npm run dev` — local server with live reload, editing any `.mdx` file in
   `/src/content/modules/` updates the page instantly.
4. Commit + push → Cloudflare Pages auto-deploys from the connected branch.

No build step is required to *write* a lesson — only to preview/deploy it.

---

## 6. Deployment

- Static build (`astro build`) → deployed via Cloudflare Pages (or GitHub
  Pages) on push to `main`. Free tier covers this at personal-project scale.
- No environment secrets needed server-side (LLM keys are client-side only).

---

## 7. Open questions / revisit list

- [x] Styling approach — **Tailwind CSS v4** (via `@tailwindcss/vite`). Visual
      direction is a clean-docs look (white background, one typeface —
      Inter), colored with a palette pulled from the InsAnalytics brand plus
      component-identity colors layered on top, all as tokens in
      `src/styles/global.css`:
      - `--color-accent` (navy) — primary actions and `GradedExercise`'s identity.
      - `--color-green` — `LiveDemo`'s identity (ungraded, editable).
      - `--color-quiz` (violet) — `QuizGroup`'s identity.
      - `--color-checkpoint-bg` (teal) — the shared full-bleed band behind
        every quiz/exercise card, signaling "you're being tested now,"
        distinct from each card's own header-bar color.
      - `--color-link` (indigo, `#4338ca`) — inline prose/hint/explanation
        links (see §3's "Linking to another concept"). Deliberately **not**
        navy/green/violet, since those are already claimed as component
        identities; also deliberately not `--color-accent-dark` (the
        original choice), which was nearly indistinguishable from
        `--color-ink`'s near-black at a glance — a real bug caught only once
        actual prose links existed to look at.
      - Inline code is red-on-light-gray.
      A persistent left sidebar (`src/components/Sidebar.astro`) lists all
      modules/lessons and highlights the active one; both `index.astro` and
      `LessonLayout.astro` render through `src/layouts/BaseLayout.astro`.
- [ ] When exactly does a lesson "graduate" from Pyodide sandbox to downloadable
      project? Need a rule of thumb once we hit the first ambiguous case.
- [ ] Real sandbox provider evaluation (E2B/Daytona/etc.) — only if/when a
      lesson genuinely can't be done as a local download.
- [x] Navigation/sidebar structure across modules — resolved: each lesson is
      a folder of pages (intro/concepts/recap), and the sidebar shows each
      lesson as an accordion (`<details>`/`<summary>`, no JS) expanding to
      that lesson's pages, auto-open for whichever lesson the current page
      belongs to. See §3.
