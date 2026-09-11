# Course Website — Architecture Decisions

> **Status:** Living document. This defines the *current* setup for a
> personal-project course site: mostly-static/zero-cost, with real sandboxed
> execution (E2B + a Cloudflare Worker, §4.2) now added alongside Pyodide
> specifically where in-browser Python genuinely isn't enough (first needed
> for Lesson 0.8, Docker). Expect this doc to keep changing as later modules
> (agent frameworks, real tool execution) push further on what a lesson
> needs to actually run.
>
> **For Claude Code:** treat this as the source of truth for how the site is
> structured and built. When a course section requires something this doc
> doesn't cover yet (e.g. real sandboxed execution, persistence, auth), stop
> and flag it — don't silently improvise new infrastructure. Update this file
> alongside any architectural change so it stays accurate.

---

## 1. Goals & constraints

- **Cost: effectively $0 by default, small and usage-bounded where not.**
  No paid hosting, no server-side LLM calls billed to the site owner. The
  one exception is real-Docker exercises (§4): each spins up a genuinely
  billable E2B sandbox on the free/hobby tier, brokered through a
  Cloudflare Worker — bounded by a shared-secret header plus CORS locked
  to the site's own origin (soft deterrents against abuse, not real
  security — see the comment in `worker/src/index.ts`), with a real
  Cloudflare rate-limit rule still worth adding on top.
- **Content authoring must be easy for a non-developer (or future collaborators)
  to manage.** Adding/editing a lesson should mean adding/editing content
  files (a lesson folder of `.mdx` pages), not touching app code.
- **Local preview.** The site owner should be able to run the site on their
  own machine, see changes live, before pushing.
- **In-browser code execution for simple exercises**, wired per-lesson via
  config, not hardcoded per page.
- **Explicitly out of scope for now:** server-side LLM proxying, user
  accounts, payments. (Real containerized sandboxes *were* out of scope —
  see §4, now implemented via E2B for exercises Pyodide genuinely can't do.)

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** + **MDX** | Content-first static site generator. Ships zero JS by default; interactive bits (like the sandbox) are opt-in "islands," so most of the site stays fast and free to host. Better fit than Next.js for a content-heavy course site. |
| Content model | **Astro Content Collections** | Lessons are files with typed frontmatter (title, module, order, sandbox config). Astro validates structure at build time, so a malformed lesson file fails the build loudly instead of breaking silently. |
| In-browser execution | **Pyodide** (Python compiled to WASM) | Runs entirely client-side. Zero server cost, scales to any number of learners for free. Good enough for concept-level exercises (agent loop logic, tool-call parsing, state handling written in plain Python). |
| Real-Docker execution (where Pyodide can't) | **E2B** ephemeral sandboxes (real Ubuntu + Docker CE, via a custom `course-docker-sandbox` template) + a **Cloudflare Worker** (`/worker`) as the broker holding the E2B API key server-side | For exercises that genuinely need real containers/subprocess/networking — Pyodide has no such capability at all. See §4 for the full architecture. |
| Code editing | **CodeMirror 6** (`@uiw/react-codemirror` + `@codemirror/lang-python` + `@uiw/codemirror-theme-vscode`) | Real syntax highlighting (VS Code's own dark theme) and Python-aware completion for every editable code box — a plain `<textarea>` can only render flat, single-color text. Lighter than Monaco, a real editor rather than a highlight-only overlay trick. |
| LLM calls (when a lesson needs one) | **Learner's own API key**, stored in browser `localStorage` only, sent directly from the browser to the provider's API | Keeps cost and liability at $0 regardless of traffic. Never touches any server we control. |
| Hosting | **GitHub Pages** (site) + **Cloudflare Workers** free tier (the E2B broker) | Static output from Astro deploys directly from a git push (`insanalytics.github.io/agentic-ai-course/`). The Worker is the one piece of server-side infrastructure this project runs — see §4. |
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
    ProjectDownload.astro       # link/zip for heavier local projects (one GitHub repo per project)
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
      Terminal.tsx / TerminalGroup.tsx  # scripted terminal playback (click Run, steps reveal progressively) — no real backend, for demos where full fidelity isn't needed
      DockerBuildDemo.tsx          # read-only Dockerfile + Build button, generates a build log from the actual Dockerfile text (cacheHit prop controls timing)
      DockerGradedExercise.tsx     # real-Docker graded exercise (Dockerfile + .dockerignore textareas) — see §4
      DockerLiveTerminal.tsx       # real interactive terminal over a persistent E2B sandbox — see §4
      CheckpointZone.astro        # full-bleed colored band behind a quiz/exercise card
  /lib
    pyodide.ts                  # shared Pyodide loader + single-file and multi-file grading harnesses
    dockerWorker.ts              # fetch wrapper for the Cloudflare Worker's /docker-exercise and /docker-terminal routes — see §4
  /layouts
    BaseLayout.astro            # shell: sidebar + main slot, fonts, global.css
    LessonLayout.astro          # page chrome (breadcrumb + hero + PageNav), wraps BaseLayout
  /styles
    global.css                  # Tailwind import + color/font tokens
  /pages
    [module]/[lesson]/[page].astro   # renders one page; getStaticPaths from the `pages` collection
/worker                          # separate Cloudflare Worker project — the E2B broker, see §4
  src/index.ts                   # all routes: /docker-exercise/grade, /docker-terminal/{start,exec,grade,end}
  wrangler.jsonc
  .dev.vars                      # gitignored — E2B_API_KEY + SITE_TOKEN for local `wrangler dev`
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

## 4. Sandbox architecture — three tiers

Three distinct execution tiers exist now, in increasing order of what they
can actually do — pick the *lightest* tier that genuinely covers what a
concept needs, not the heaviest available:

1. **Pyodide** (§4.1) — in-browser, zero cost, zero setup, instant. Default
   choice for anything that's really just Python logic (loops, data
   structures, mock tool functions). No real subprocess/filesystem/network.
2. **E2B + Cloudflare Worker** (§4.2) — a real, disposable Linux sandbox
   with a real Docker daemon, one call away from the browser. For a single
   in-browser exercise that genuinely needs something Pyodide can't do
   (build a real image, run a real container) but is still small/bounded
   enough to grade in one shot or one short interactive session.
3. **Downloadable project** (§4.3) — a separate GitHub repo the learner
   clones and runs on their own machine. For anything that needs more than
   one real service running together (an app *and* a database, say),
   or is meant as a lesson's capstone rather than a single exercise.

### 4.1 Pyodide (in-browser)

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

**Known ceiling of Pyodide** (why the tiers below exist):
- No real subprocess/shell execution.
- No native/compiled Python packages.
- No genuine multi-agent, long-running, or stateful-across-sessions execution.

### 4.2 E2B + Cloudflare Worker (real Docker, one call from the browser)

First built for Lesson 0.8 (Docker), once Pyodide's ceiling above stopped
being theoretical — a Docker lesson genuinely cannot be taught with no
real Docker daemon anywhere. Two pieces:

- **E2B** (`e2b` npm package) — a managed ephemeral-sandbox provider,
  hobby/free tier. A custom template, `course-docker-sandbox` (Ubuntu
  24.04 + Docker CE, confirmed via `docker run hello-world` at build time),
  gives every sandbox a real, working Docker daemon from the moment it
  starts — no per-session install/startup cost.
- **A Cloudflare Worker** (`/worker`, deployed as `agentic-ai-course-sandbox`
  at `agentic-ai-course-sandbox.agentic-ai-course.workers.dev`) — holds the
  E2B API key server-side (never shipped to the browser) and exposes a
  small REST API the static site calls directly. Confirmed, by direct
  testing rather than trusting docs: E2B's SDK genuinely works inside the
  Workers runtime (`@connectrpc/connect-web`'s fetch-based transport),
  despite older E2B documentation claiming Workers-incompatibility.

**Two usage shapes, both live in `worker/src/index.ts`:**

- **One-shot graded exercise** (`/docker-exercise/grade`, backing
  `<DockerGradedExercise />`) — spins up a fresh sandbox, writes the
  learner's submitted Dockerfile/.dockerignore alongside fixture files
  (including a fake `.env`/`.git` to check get excluded), builds twice
  (to check layer caching survives an unrelated change), inspects the
  built image, kills the sandbox, returns pass/fail + the real build log.
  One request, no session state.
- **Persistent interactive terminal** (`/docker-terminal/{start,exec,grade,end}`,
  backing `<DockerLiveTerminal />`) — for exercises that are a *sequence*
  of commands (build → run detached → inspect → clean up), not a single
  submission. The worker itself stays stateless: `start` creates a
  sandbox and returns its `sandboxId`; every later call
  (`exec`/`grade`/`end`) reconnects via `Sandbox.connect(sandboxId)` — the
  sandbox ID **is** the session token, no Durable Object or session store
  needed. Every `exec`'d command is appended to a transcript file written
  inside the sandbox's own filesystem (not held in worker memory), because
  grading needs to see commands whose effects a *later* command
  deliberately undoes (the exercise's own last step is `docker rm`, which
  destroys the very container earlier checks needed running) — `grade`
  replays that transcript rather than only checking current live state.
  `DockerLiveTerminal` only starts the sandbox on an explicit "Start
  sandbox" click (it's billable), not on page load/mount.

**Two real bugs worth remembering if this pattern gets extended:**
- `sbx.commands.run()` **throws** `CommandExitError` on any non-zero exit
  code — it does not just return a result with `exitCode` set. Every call
  site goes through a small `run()` wrapper in `worker/src/index.ts` that
  catches `CommandExitError` and reconstructs a normal
  `{stdout, stderr, exitCode}` result, otherwise a learner's *own* failing
  command (a typo'd flag, a broken Dockerfile) surfaces as an opaque
  `"exit status 1"` 500 instead of real, gradeable output.
- The sandbox's Docker socket is root-only, but lesson content teaches
  plain `docker ...` commands — `execInTerminalSession` transparently
  prepends `sudo` to any `docker` command rather than requiring learners
  to know a sandbox-specific permissions detail unrelated to what's being
  taught.

**Auth model** (`authorized()` in `worker/src/index.ts`): CORS locked to
`https://insanalytics.github.io`, plus a shared-secret `X-Site-Token`
header the client sends (`src/lib/dockerWorker.ts`). Explicitly **not**
real security — the token necessarily ships in the site's public JS
bundle, readable by anyone who opens devtools. Both together are a soft
speed bump against casual/automated abuse (each call is billable), not a
guarantee. A real Cloudflare rate-limit rule is the actual cost ceiling
and is still worth adding on top.

**Local dev gotcha:** `wrangler dev` on Windows can leave multiple stale
`workerd.exe`/`node.exe` processes running across restarts, silently
serving stale env bindings or hanging entirely on every request (even
trivial ones) once enough pile up. If a locally-correct code change
doesn't seem to take effect, or requests hang for no obvious reason,
`taskkill //F //IM workerd.exe` + `taskkill //F //IM node.exe` then a
single fresh `wrangler dev` is the fix — check `tasklist` before assuming
the code itself is wrong.

### 4.3 Downloadable project (local, learner's own machine)

For anything needing more than E2B's single-exercise shape can
reasonably provide (multiple real services running together, meant as a
lesson capstone rather than one graded step) — via `projectDownload` in
`_lesson.yaml` and the `<ProjectDownload />` component
(`src/components/ProjectDownload.astro`). Keeps cost at $0 by pushing
real compute to the learner's own machine entirely.

**Implemented as: one separate public GitHub repo per project**, under
the `insAnalytics` org, `main` as the default branch, named
`agentic-ai-course-<project-name>` — not a folder inside this repo, not a
shared "projects" mono-repo. The component links to the repo itself plus
GitHub's own auto-generated `/archive/refs/heads/main.zip` (works with no
extra build/release step). Locally, each project also gets cloned into
`../Agentic_AI_Projects/<project-name>` (a sibling folder to this repo,
outside version control here) rather than left in a scratch/temp
directory. First one: `agentic-ai-course-agent-registry` (Lesson 0.8) —
a Flask + Postgres app shipped with intentional bugs (naive Dockerfile
layer ordering, a `docker-compose.yml` missing its volume, root user) for
the README's walkthrough to fix. Verified end-to-end in a real E2B
sandbox before publishing, including confirming the specific claim the
walkthrough makes (a volume surviving container recreation) is actually
true and not just plausible-sounding — `docker compose restart` alone
does *not* prove this, since restart never destroys the container in the
first place; `docker compose up -d --force-recreate` does.

---

## 5. Local editing/preview workflow

1. Clone the repo.
2. `npm install`
3. `npm run dev` — local server with live reload, editing any `.mdx` file in
   `/src/content/modules/` updates the page instantly.
4. Commit + push to `main` → a GitHub Actions workflow builds and deploys to
   GitHub Pages automatically.

No build step is required to *write* a lesson — only to preview/deploy it.

For the Worker (`/worker`, only needed when touching real-Docker exercises):
`cd worker && npm install`, then `npx wrangler dev --port 8787` for local
testing (reads `worker/.dev.vars`, gitignored — needs `E2B_API_KEY` and
`SITE_TOKEN`) and `npx wrangler deploy` to push to production. See §4.

---

## 6. Deployment

- **Site:** static build (`astro build`) → **GitHub Pages**, via a GitHub
  Actions workflow on push to `main`. Live at
  `https://insanalytics.github.io/agentic-ai-course/`. Free tier covers this
  at personal-project scale. No environment secrets needed for the site
  itself (LLM keys are client-side only).
- **Worker** (`agentic-ai-course-sandbox`, the E2B broker): deployed
  separately via `npx wrangler deploy` from `/worker` — not part of the
  site's own build/deploy pipeline. Its two secrets (`E2B_API_KEY`,
  `SITE_TOKEN`) are set with `wrangler secret put`, never committed.

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
- [x] Real sandbox provider evaluation — **E2B**, chosen and implemented
      (§4.2) once Lesson 0.8 (Docker) made Pyodide's ceiling concrete rather
      than theoretical. Added alongside, not replacing, Pyodide.
- [ ] The tier-choice rule of thumb in §4's opening (Pyodide → E2B →
      downloadable, lightest tier that covers the need) is the guidance in
      use so far, across exactly one lesson (0.8) that needed tiers 2 and 3.
      Revisit once a second lesson forces a real judgment call between them.
- [x] Navigation/sidebar structure across modules — resolved: each lesson is
      a folder of pages (intro/concepts/recap), and the sidebar shows each
      lesson as an accordion (`<details>`/`<summary>`, no JS) expanding to
      that lesson's pages, auto-open for whichever lesson the current page
      belongs to. See §3.
