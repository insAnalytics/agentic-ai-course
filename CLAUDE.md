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
