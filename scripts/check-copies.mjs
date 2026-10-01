// Some files and code blocks exist twice on purpose: once where the offline
// scripts or a shared constant use them, and once where a learner reads or
// loads them. This script runs before `astro build` and fails the build if
// any pair has drifted apart — see architecture.md §3.1.
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1");
// git's autocrlf can check any of these out with CRLF; compare content, not line endings
const read = (path) => readFileSync(ROOT + path, "utf8").replace(/\r\n/g, "\n");

/** The value of `export const NAME = String.raw\`...\`` (none of the checked ones contain a backtick). */
function rawConstant(path, name) {
  const match = read(path).match(new RegExp(`export const ${name} = String\\.raw\`([^\`]*)\``));
  if (!match) throw new Error(`${name} not found in ${path}`);
  return match[1];
}

/** The body of the first ```python fence on a page that starts with `firstLine`. */
function pageFence(path, firstLine) {
  const fences = [...read(path).matchAll(/```python\n([^`]*)```/g)].map((m) => m[1]);
  const fence = fences.find((body) => body.startsWith(firstLine));
  if (fence === undefined) throw new Error(`no python block starting "${firstLine}" in ${path}`);
  return fence;
}

const PAIRS = [
  {
    what: "the pilot's tasks (Module 7)",
    a: ["scripts/eval/tasks/pilot.json", () => read("scripts/eval/tasks/pilot.json")],
    b: ["public/data/eval/pilot/tasks.json", () => read("public/data/eval/pilot/tasks.json")],
  },
  {
    what: "LOAD_PILOT (Module 7 Lesson 1 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_PILOT")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/01-grading-agents/01-why-an-agent-is-harder-to-grade.mdx",
        "import json\nfrom pathlib import Path\n\nPILOT =",
      ),
    ],
  },
];

let failed = false;
for (const { what, a, b } of PAIRS) {
  if (a[1]() !== b[1]()) {
    console.error(`check-copies: ${what} differs between ${a[0]} and ${b[0]}; change both together.`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`check-copies: ${PAIRS.length} pairs identical`);
