// Lesson content links to other pages with hardcoded root-absolute paths
// (e.g. `/00-python-fundamentals/.../#anchor`), written directly in MDX
// prose and in hint/task/explanation prop strings — see architecture.md §3.
// Astro's configured `base` (needed for GitHub Pages project sites, served
// from `/agentic-ai-course/...` rather than the domain root) does not
// rewrite hardcoded strings like these; it only prefixes hrefs Astro itself
// generates from `import.meta.env.BASE_URL`. This project's markdown
// processor (`@astrojs/markdown-satteri`) also doesn't run rehype plugins,
// so the rewrite can't happen during rendering either.
//
// This script runs after `astro build` and rewrites every `href="/...")`
// in the built HTML to include the base, skipping anything already
// prefixed (idempotent) or protocol-relative (`//...`).
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = "/agentic-ai-course";
const DIST = new URL("../dist", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1");

const HREF_PATTERN = /href="(\/(?!\/)[^"]*)"/g;

function fixFile(path) {
  const html = readFileSync(path, "utf8");
  const fixed = html.replace(HREF_PATTERN, (match, href) => {
    if (href.startsWith(BASE + "/") || href === BASE) return match;
    return `href="${BASE}${href}"`;
  });
  if (fixed !== html) writeFileSync(path, fixed, "utf8");
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith(".html")) fixFile(path);
  }
}

walk(DIST);
console.log("Rewrote internal links to include base:", BASE);
