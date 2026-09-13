## Project context

This is a course website (Astro/MDX, deployed to GitHub Pages) plus a
Cloudflare Worker (`/worker`) that brokers real-Docker exercises via E2B.
Before making any structural or architectural change, read:

- [architecture.md](architecture.md) — tech stack, content model, the
  three-tier sandbox architecture (Pyodide / E2B+Worker / downloadable
  project), deployment. Update it alongside any architectural change.
- [lesson-structure.md](lesson-structure.md) — the fixed shape every
  lesson's content must follow.
- [full-syllabus.md](full-syllabus.md) — course-wide lesson status and
  scope, for context on what's built vs. planned.

Lesson content itself (mockups → `.mdx`) is authored in chat, one lesson
at a time — not generated from a spec.

## Content authoring workflow (mockup → .mdx)

A separate drafting process (not this session) writes lesson content as
Markdown mockups into `module_mockups/Module N/Lesson M/`, one file per
concept (`lesson-M-N-concept-K.md`) plus one bookends file
(`lesson-M-N-bookends.md`, containing the intro outcomes/why-it-matters,
the comprehensive quiz, and the comprehensive sandbox — added once every
concept in the lesson exists, not before).

**When the user says "added a new mockup"** (or similar, with no further
detail): find the newest file in that lesson's `module_mockups` folder
(`Glob` it — don't assume the filename), read it, and convert it into the
corresponding `.mdx` file(s) under `src/content/modules/.../<lesson>/`,
following [lesson-structure.md](lesson-structure.md)'s shape and
architecture.md's component/linking conventions — **without asking for
permission first**. This is standing authorization for the conversion
step itself (reading the mockup, writing/editing `.mdx`, building
whatever grading component or Pyodide harness code the exercise actually
needs, running the build, committing, and pushing) — per explicit prior
instruction: the mockup author deliberately minimizes how much they think
about implementing the actual code examples/exercises, and judgment on
how to actually implement them belongs to whoever does the conversion.
Still stop and ask if something in the mockup is genuinely ambiguous
about what to build (not how to build it), or if a real design tradeoff
needs the user's input (e.g. two materially different grading approaches
with different learner experiences).

**Every conversion should, in order:**
1. Read the mockup fully before writing anything.
2. Resolve every `(→ ...)` callback (see lesson-structure.md §6) to a
   real link — deep-link to a `Subsection` anchor. **Verify anchors
   against the actual built HTML** (`npm run build`, then grep the
   target page's `dist/.../index.html` for `id="..."`) rather than
   hand-slugifying the title — the slugify rule collapses *any* run of
   non-alphanumeric characters (spaces, punctuation, em dashes, apostrophes)
   to a single hyphen, which is easy to get subtly wrong by guessing.
3. If the exercise needs new grading logic (a new Pyodide harness, a new
   way of calling learner code), **verify it against a real Pyodide
   instance before writing it into the lesson** — a scratch Node script
   in a temp dir (`npm install pyodide@0.26.4`, see architecture.md §4.1
   for the pinned FastAPI stack) proving a correct submission passes and
   a couple of wrong ones fail the right way. This project's history
   (architecture.md §4.1) has repeatedly found real bugs this way
   (argument-order footguns, fixtures refusing direct calls, FastAPI
   inferring the wrong parameter source) that would otherwise have
   shipped silently broken.
4. `npm run build` and confirm it succeeds with no new errors.
5. Stage **only** the files this conversion touched (the mockup file
   itself plus the new/changed `.mdx`/`.tsx`/`.ts` files) — never a
   broad `git add`. If `git status` shows an unrelated stray change
   (e.g. to a mockup file this conversion never touched), leave it
   unstaged and mention it, don't silently include or "fix" it.
6. Commit (with the `Co-Authored-By` trailer from the system reminder)
   and push, then briefly summarize what shipped.

Update [architecture.md](architecture.md) alongside any new grading
component or harness (§4.1 is the running log of every FastAPI/Pyodide
finding so far), and update
[full-syllabus.md](full-syllabus.md)'s status line for the lesson being
worked on (**Locked** once every concept + bookends exist, **Building**
with a note on exactly what's drafted so far otherwise) so a fresh
session can tell what's done without reading this file's history.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

For the Cloudflare Worker (`/worker`, only needed for real-Docker exercise
work): `cd worker && npx wrangler dev --port 8787` for local testing,
`npx wrangler deploy` to push to production. See architecture.md §4.2 and
§6. On Windows, `wrangler dev` can leave stale `workerd.exe`/`node.exe`
processes across restarts that silently break local testing — check
`tasklist` and kill them if a code change doesn't seem to take effect or
requests hang.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
