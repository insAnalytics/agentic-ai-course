# Agentic AI Course

An Astro/MDX course site on building agentic AI systems, deployed to
[insanalytics.github.io/agentic-ai-course](https://insanalytics.github.io/agentic-ai-course/).
Course content lives as `.mdx` files (one file per intro/concept/recap
page), rendered through a shared set of interactive lesson components
(quizzes, editable/graded code sandboxes, and — for exercises that need
real Docker rather than in-browser Python — a Cloudflare Worker backed by
[E2B](https://e2b.dev)).

See [architecture.md](architecture.md) for the full technical picture
(stack, content model, the three-tier sandbox architecture) and
[lesson-structure.md](lesson-structure.md) for the fixed shape every
lesson follows.

## Development

```sh
npm install
npm run dev       # local server with live reload at localhost:4321
npm run build     # production build to ./dist/
```

Editing any `.mdx` file under `src/content/modules/` updates the page
instantly in dev — no build step needed to write a lesson, only to
preview/deploy it. Pushing to `main` deploys automatically via GitHub
Actions.

### The Worker (`/worker`)

Only needed when working on real-Docker exercises (Lesson 0.8 and
later, where relevant). It brokers E2B sandbox calls so the API key
never reaches the browser.

```sh
cd worker
npm install
npx wrangler dev --port 8787   # local testing — needs .dev.vars (gitignored, see below)
npx wrangler deploy            # deploy to production
```

`worker/.dev.vars` (gitignored) needs:

```
E2B_API_KEY=...
SITE_TOKEN=...
```

See [architecture.md §4.2](architecture.md#42-e2b--cloudflare-worker-real-docker-one-call-from-the-browser)
for how it fits together, including a couple of real gotchas worth
knowing before extending it (a command-exit-code bug in the E2B SDK, and
a stale-process issue with `wrangler dev` on Windows).

## Downloadable projects

Some lessons' comprehensive exercises are downloadable projects rather
than in-browser sandboxes — each lives in its own public GitHub repo
under the `insAnalytics` org (`agentic-ai-course-<project-name>`), linked
from the lesson via `_lesson.yaml`'s `projectDownload` field. See
[architecture.md §4.3](architecture.md#43-downloadable-project-local-learners-own-machine).
