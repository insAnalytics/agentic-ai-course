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
  {
    what: "TRACE_FROM_RECORDING (Module 7 Lesson 2 concept 2)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "TRACE_FROM_RECORDING")],
    b: [
      "the page's first demo, up to its run",
      () => {
        const demo = rawConstant("src/content/modules/07-evaluation/02-tracing/02-a-shared-format.mdx", "RECORDING_DEMO");
        return demo.slice(0, demo.indexOf("\n\n\nrun = load_pilot(")) + "\n";
      },
    ],
  },
  {
    what: "INSTRUMENT_WRAPPERS (Module 7 Lesson 2 concept 3)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "INSTRUMENT_WRAPPERS")],
    b: [
      "the page's instrumentation demo, up to its run",
      () => {
        const demo = rawConstant("src/content/modules/07-evaluation/02-tracing/03-what-this-course-adds.mdx", "INSTRUMENT_DEMO");
        return demo.slice(0, demo.indexOf("\n\n\nSYSTEM = ")) + "\n";
      },
    ],
  },
  {
    what: "the replay exercise's provided code (Module 7 Lesson 2 concept 5)",
    a: ["the PROVIDED constant", () => rawConstant("src/content/modules/07-evaluation/02-tracing/05-replaying-a-recorded-run.mdx", "PROVIDED")],
    b: [
      "the page's static block",
      () => pageFence("src/content/modules/07-evaluation/02-tracing/05-replaying-a-recorded-run.mdx",
        "import hashlib\nimport json\n\n\ndef request_hash"),
    ],
  },
  // the pilot's modules, served to the browser for Module 7 Lesson 2 concept 5's replays
  ...[
    ...["eval_client", "registry_world", "harness"].map((name) => `scripts/eval/${name}.py`),
    ...["tokens", "fake", "m4", "m5", "m6loop"].map((name) => `scripts/eval/course/${name}.py`),
  ].map((source) => {
    const copy = `public/data/eval/code/${source.split("/").pop()}`;
    return { what: `the pilot's ${source.split("/").pop()} (Module 7)`, a: [source, () => read(source)], b: [copy, () => read(copy)] };
  }),
];

// code a page shows that must appear, byte for byte, inside a file the offline scripts run
const REPLAY_PAGE = "src/content/modules/07-evaluation/02-tracing/05-replaying-a-recorded-run.mdx";
const CONTAINED = [
  // the provided code is shown as one block of the separate pieces eval_client.py defines
  ...rawConstant(REPLAY_PAGE, "PROVIDED").split("\n\n\n").map((piece, i) => ({
    what: `the replay exercise's provided code, piece ${i + 1}`, text: piece.trim(), file: "scripts/eval/eval_client.py",
  })),
  { what: "the replay exercise's reference ReplayClient", text: rawConstant(REPLAY_PAGE, "REFERENCE").trim(),
    file: "scripts/eval/eval_client.py" },
];

let failed = false;
for (const { what, a, b } of PAIRS) {
  if (a[1]() !== b[1]()) {
    console.error(`check-copies: ${what} differs between ${a[0]} and ${b[0]}; change both together.`);
    failed = true;
  }
}
for (const { what, text, file } of CONTAINED) {
  if (!read(file).includes(text)) {
    console.error(`check-copies: ${what} is no longer in ${file} as written; change both together.`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`check-copies: ${PAIRS.length} pairs identical, ${CONTAINED.length} blocks found in their sources`);
