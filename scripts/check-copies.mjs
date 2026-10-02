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

/**
 * Like rawConstant, for a constant whose code contains backticks (written ${"`"} inside String.raw): its source
 * text up to the closing backtick on a line of its own, escapes left as written on both sides of a comparison.
 */
function escapedConstant(path, name) {
  const match = read(path).replace(/\r/g, "").match(new RegExp(`export const ${name} = String\\.raw\`([\\s\\S]*?)\\n\`;`));
  if (!match) throw new Error(`${name} not found in ${path}`);
  return match[1];
}

/** The body of the first ```python fence on a page that starts with `firstLine`. */
function pageFence(path, firstLine) {
  // up to the closing fence line, so a block may contain backticks of its own (in a docstring, say)
  const fences = [...read(path).replace(/\r/g, "").matchAll(/```python\n([\s\S]*?\n)```/g)].map((m) => m[1]);
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
  {
    what: "LOAD_READING (Module 7 Lesson 3 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_READING")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/03-error-analysis/01-from-a-fixed-map.mdx",
        "import json\nfrom pathlib import Path\n\nREADING =",
      ),
    ],
  },
  {
    what: "LOAD_SUITE (Module 7 Lesson 4 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_SUITE")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/04-task-suite/01-what-makes-a-good-task.mdx",
        "import json\nfrom pathlib import Path\n\nSUITE =",
      ),
    ],
  },
  ...["01-checking-the-end-state", "02-checking-the-reply-in-code", "03-checking-the-path-in-code"].map((page, n) => ({
    what: `LOAD_SUITE (Module 7 Lesson 5 concept ${n + 1})`,
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_SUITE")],
    b: [
      "the page's setup block",
      () => pageFence(
        `src/content/modules/07-evaluation/05-code-graders/${page}.mdx`,
        "import json\nfrom pathlib import Path\n\nSUITE =",
      ),
    ],
  })),
  {
    what: "LOAD_SUITE (Module 7 Lesson 9 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_SUITE")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/09-ablations/01-one-piece-on-and-off.mdx",
        "import json\nfrom pathlib import Path\n\nSUITE =",
      ),
    ],
  },
  {
    what: "LOAD_ABLATIONS (Module 7 Lesson 9 concept 3)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_ABLATIONS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/09-ablations/03-compaction-on-and-off.mdx",
        "import json\nfrom pathlib import Path\n\nABLATIONS =",
      ),
    ],
  },
  {
    what: "LOAD_SETTINGS (Module 7 Lesson 10 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_SETTINGS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/10-regression-tests/01-what-changed-and-the-last-known-good-run.mdx",
        "import json\nfrom pathlib import Path\n\nsettings =",
      ),
    ],
  },
  {
    what: "LOAD_COSTS (Module 7 Lesson 10 concept 5)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_COSTS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/10-regression-tests/05-keeping-it-affordable.mdx",
        "import json\nfrom pathlib import Path\n\nrecorded =",
      ),
    ],
  },
  {
    what: "TRAFFIC_SETUP (Module 7 Lesson 11 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "TRAFFIC_SETUP")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/11-monitoring/01-what-to-watch-on-every-run.mdx",
        "import json\nfrom math import ceil\nfrom pathlib import Path\n\nMONITORING =",
      ),
    ],
  },
  {
    what: "DEPLOY_STREAM (Module 7 Lesson 11 concept 2)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "DEPLOY_STREAM")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/11-monitoring/02-is-this-a-real-change.mdx",
        "import random\n\n\ndef run_facts",
      ),
    ],
  },
  {
    what: "JUDGED_SAMPLE (Module 7 Lesson 11 concept 3)",
    a: ["src/lib/evalData.ts", () => escapedConstant("src/lib/evalData.ts", "JUDGED_SAMPLE").replaceAll('${"`"}', "`") + "\n"],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/11-monitoring/03-judges-on-a-sample.mdx",
        "from math import sqrt\n\njudged =",
      ),
    ],
  },
  {
    what: "LOAD_SUMMARIZER (Module 7 Lesson 5 concept 5)",
    a: ["the LOAD_SUMMARIZER constant", () => rawConstant("src/content/modules/07-evaluation/05-code-graders/05-a-component-test-the-summarizer.mdx", "LOAD_SUMMARIZER")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/05-code-graders/05-a-component-test-the-summarizer.mdx",
        "import json\nfrom pathlib import Path\n\nSUMMARIZER =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGES (Module 7 Lesson 6 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGES")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/06-model-graders/01-from-a-check-to-a-grader.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGES =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGES (Module 7 Lesson 6 concept 2)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGES")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/06-model-graders/02-writing-a-rubric.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGES =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGES (Module 7 Lesson 6 concept 3)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGES")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/06-model-graders/03-pass-fail-scores-and-pairs.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGES =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGES (Module 7 Lesson 6 concept 4)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGES")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/06-model-graders/04-correctness-and-relevance.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGES =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGES (Module 7 Lesson 6 concept 5)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGES")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/06-model-graders/05-grading-set-f.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGES =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGE_LABELS (Module 7 Lesson 7 concept 1)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGE_LABELS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/07-measuring-judges/01-a-judge-is-a-measurement.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGE_LABELS =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGE_LABELS (Module 7 Lesson 7 concept 2)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGE_LABELS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/07-measuring-judges/02-labels-from-people.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGE_LABELS =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGE_LABELS (Module 7 Lesson 7 concept 3)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGE_LABELS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/07-measuring-judges/03-development-and-test-sets.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGE_LABELS =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGE_LABELS (Module 7 Lesson 7 concept 4)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGE_LABELS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/07-measuring-judges/04-correcting-a-pass-rate.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGE_LABELS =",
      ),
    ],
  },
  {
    what: "LOAD_JUDGE_LABELS (Module 7 Lesson 7 concept 5)",
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", "LOAD_JUDGE_LABELS")],
    b: [
      "the page's setup block",
      () => pageFence(
        "src/content/modules/07-evaluation/07-measuring-judges/05-set-f-graded.mdx",
        "import json\nfrom pathlib import Path\n\nJUDGE_LABELS =",
      ),
    ],
  },
  // Module 7 Lesson 8's hidden setup rebuilds Module 6's SIGNALS_SETUP from copies of its two signals
  ...["ANSWER_PROBABILITY", "VERDICT_PROBABILITY"].map((name) => ({
    what: `${name} (Module 7 Lesson 8's copy of Module 6 Lesson 6 concept 2's)`,
    a: ["src/lib/evalData.ts", () => rawConstant("src/lib/evalData.ts", name)],
    b: [
      "Module 6's signals page",
      () => rawConstant("src/content/modules/06-reliability/06-when-unsure/02-signals-the-agent-isnt-sure.mdx", name),
    ],
  })),
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
  // Lesson 10's recap lib.py: every function the lesson's concepts define, byte for byte (imports gathered at its top)
  ...["WHAT_CHANGED", "PAIRED_DIFFERENCE", "GATE", "FISHER_DROP", "BENJAMINI_HOCHBERG"].flatMap((name) =>
    escapedConstant("src/lib/evalData.ts", name).split("\n\n\n").map((piece) => piece.trim())
      .filter((piece) => piece && !/^(import|from) /.test(piece))
      .map((piece) => ({
        what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
        escaped: ["src/content/modules/07-evaluation/10-regression-tests/06-recap-practice.mdx", "LIB_PY"],
      }))),
  // the provided code is shown as one block of the separate pieces eval_client.py defines
  ...rawConstant(REPLAY_PAGE, "PROVIDED").split("\n\n\n").map((piece, i) => ({
    what: `the replay exercise's provided code, piece ${i + 1}`, text: piece.trim(), file: "scripts/eval/eval_client.py",
  })),
  { what: "the replay exercise's reference ReplayClient", text: rawConstant(REPLAY_PAGE, "REFERENCE").trim(),
    file: "scripts/eval/eval_client.py" },
  // the main runs' scripts/eval/tracing.py: every definition of the tracing Lesson 2 teaches, byte for byte
  ...["TRACER", "TRACED_CHECKS", "INSTRUMENT_WRAPPERS", "SUMMARIZE"].flatMap((name) =>
    rawConstant("src/lib/evalData.ts", name).split("\n\n\n").map((piece) => piece.trim())
      .filter((piece) => piece && !/^(import|from) /.test(piece))
      .map((piece) => ({ what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece, file: "scripts/eval/tracing.py" }))),
  // Lesson 2's recap lib.py: every definition from the lesson's shared code, byte for byte (imports are
  // gathered at its top, and config_hash isn't needed there)
  ...["TRACER", "TRACED_CHECKS", "INSTRUMENT_WRAPPERS", "SUMMARIZE", "LOAD_PILOT"].flatMap((name) =>
    rawConstant("src/lib/evalData.ts", name).split("\n\n\n").map((piece) => piece.trim())
      .filter((piece) => piece && !/^(import|from) /.test(piece) && !piece.startsWith("def config_hash"))
      .map((piece) => ({
        what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
        constant: ["src/content/modules/07-evaluation/02-tracing/06-recap-practice.mdx", "LIB_PY"],
      }))),
  // Lesson 3's recap lib.py: the lesson's loader and tally, and the task_bootstrap and read_back its demos define
  ...[
    ...["LOAD_READING", "TALLY"].map((name) => [name, rawConstant("src/lib/evalData.ts", name)]),
    ...[["04-grouping-and-counting", "BOOTSTRAP_DEMO", "def task_bootstrap"], ["05-how-not-only-whether", "READ_BACK_DEMO", "def read_back"]]
      .map(([page, name, start]) => [name, rawConstant(`src/content/modules/07-evaluation/03-error-analysis/${page}.mdx`, name)
        .split("\n\n\n").find((piece) => piece.startsWith(start))]),
  ].flatMap(([name, code]) => code.split("\n\n\n").map((piece) => piece.trim())
    .filter((piece) => piece && !/^(import|from) /.test(piece))
    .map((piece) => ({
      what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
      constant: ["src/content/modules/07-evaluation/03-error-analysis/06-recap-practice.mdx", "LIB_PY"],
    }))),
  // Module 7 Lesson 4 concept 4 loads Module 6 Lesson 6 concept 4's reference after_pushback and its helpers,
  // without the demo after them, as a demo's hidden setup: every definition must still be in that REFERENCE
  ...rawConstant("src/content/modules/07-evaluation/04-task-suite/04-pushback-both-ways.mdx", "AFTER_PUSHBACK")
    .split("\n\n\n").map((piece) => piece.trim()).filter(Boolean)
    .map((piece) => ({
      what: `AFTER_PUSHBACK's ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
      constant: ["src/content/modules/06-reliability/06-when-unsure/04-when-the-user-pushes-back.mdx", "REFERENCE"],
    })),
  // Lesson 4's recap lib.py: the lesson's loader and the first concept's triage, byte for byte
  ...["LOAD_SUITE", "TRIAGE"].flatMap((name) =>
    rawConstant("src/lib/evalData.ts", name).split("\n\n\n").map((piece) => piece.trim())
      .filter((piece) => piece && !/^(import|from) /.test(piece))
      .map((piece) => ({
        what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
        constant: ["src/content/modules/07-evaluation/04-task-suite/07-recap-practice.mdx", "LIB_PY"],
      }))),
  // Lesson 5's recap lib.py: the matcher, the end-state check and the citation check, byte for byte
  ...["CONTAINS", "STATE_DIFF", "CITED_IDS"].flatMap((name) =>
    rawConstant("src/lib/evalData.ts", name).split("\n\n\n").map((piece) => piece.trim())
      .filter((piece) => piece && !/^(import|from) /.test(piece))
      .map((piece) => ({
        what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
        constant: ["src/content/modules/07-evaluation/05-code-graders/06-recap-practice.mdx", "LIB_PY"],
      }))),
  // Lesson 6's recap lib.py: concept 2's reference parse_verdict and summarize, and Lesson 5's citation check
  ...[
    ["concept 2's SOLUTION", rawConstant("src/content/modules/07-evaluation/06-model-graders/02-writing-a-rubric.mdx", "SOLUTION")],
    ["CITED_IDS", rawConstant("src/lib/evalData.ts", "CITED_IDS")],
  ].flatMap(([name, code]) => code.split("\n\n\n")
    .map((piece) => piece.split("\n").filter((line) => !/^(import|from) /.test(line)).join("\n").trim())
    .filter(Boolean)
    .map((piece) => ({
      what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
      constant: ["src/content/modules/07-evaluation/06-model-graders/06-recap-practice.mdx", "LIB_PY"],
    }))),
  // Lesson 8's recap lib.py: Module 6's two signals and this lesson's references, byte for byte (read from the
  // page source, since lib.py's normalize holds a backtick that rawConstant can't parse)
  ...["ANSWER_PROBABILITY", "VERDICT_PROBABILITY", "CALIBRATION", "TEMPERATURE_SCALING"].flatMap((name) =>
    rawConstant("src/lib/evalData.ts", name).split("\n\n\n")
      .map((piece) => piece.split("\n").filter((line) => !/^(import|from) /.test(line)).join("\n").trim())
      .filter(Boolean)
      .map((piece) => ({
        what: `${name}'s ${piece.split("\n")[0].slice(0, 40)}`, text: piece,
        file: "src/content/modules/07-evaluation/08-calibration/05-recap-practice.mdx",
      }))),
  // Lesson 7's recap lib.py: concept 4's reference rogan_gladen, byte for byte
  {
    what: "Lesson 7 concept 4's rogan_gladen",
    text: rawConstant("src/content/modules/07-evaluation/07-measuring-judges/04-correcting-a-pass-rate.mdx", "ROGAN_GLADEN").trim(),
    constant: ["src/content/modules/07-evaluation/07-measuring-judges/06-recap-practice.mdx", "LIB_PY"],
  },
];

let failed = false;
for (const { what, a, b } of PAIRS) {
  if (a[1]() !== b[1]()) {
    console.error(`check-copies: ${what} differs between ${a[0]} and ${b[0]}; change both together.`);
    failed = true;
  }
}
for (const { what, text, file, constant, escaped } of CONTAINED) {
  const where = file ?? `${(constant ?? escaped)[0]}'s ${(constant ?? escaped)[1]}`;
  const haystack = file ? read(file) : constant ? rawConstant(...constant) : escapedConstant(...escaped);
  if (!haystack.includes(text)) {
    console.error(`check-copies: ${what} is no longer in ${where} as written; change both together.`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`check-copies: ${PAIRS.length} pairs identical, ${CONTAINED.length} blocks found in their sources`);
