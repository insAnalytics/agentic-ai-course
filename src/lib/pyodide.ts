declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
  loadPackagesFromImports: (code: string) => Promise<void>;
  loadPackage: (names: string | string[]) => Promise<void>;
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => unknown;
  };
  FS: {
    writeFile: (path: string, data: string) => void;
  };
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

let pyodidePromise: Promise<PyodideInterface> | null = null;

export function loadPyodideOnce(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PYODIDE_CDN}pyodide.js"]`,
    );
    const onReady = async () => {
      try {
        if (!window.loadPyodide) throw new Error("Pyodide failed to attach to window");
        resolve(await window.loadPyodide({ indexURL: PYODIDE_CDN }));
      } catch (err) {
        reject(err);
      }
    };

    if (existing) {
      onReady();
      return;
    }

    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });

  return pyodidePromise;
}

// All Pyodide calls share one global interpreter across every LiveDemo/
// GradedExercise instance on a page. Two independent async runs can otherwise
// interleave mid-await (e.g. one instance's sys.path edit landing while
// another instance is mid-run) — this queue serializes every run so only one
// is ever in flight at a time, regardless of which component started it.
let pyodideQueue: Promise<unknown> = Promise.resolve();
export function withPyodideQueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = pyodideQueue.then(fn, fn);
  pyodideQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * `pyodide.runPythonAsync` already runs code inside its own live event loop
 * (that's what makes top-level `await` work at all), so `asyncio.run(...)` —
 * the standard real-Python entry point — raises "cannot be called from a
 * running event loop" here even though it's completely normal code outside
 * the browser. Rather than teach a different, browser-only entry point,
 * lesson content keeps writing (and showing) real `asyncio.run(coro())`,
 * and this rewrites it to `await (coro())` — equivalent for a single
 * top-level call — right before execution. Purely an execution-environment
 * shim: it never changes what's shown to the learner, only what actually
 * runs. Only applies where `runPythonAsync` is used (LiveDemo); the hidden
 * test harness execs code without top-level-await support, so this can't
 * help there — a GradedExercise involving async code needs its own fix.
 */
function shimAsyncioRun(code: string): string {
  return code.replaceAll("asyncio.run(", "await (");
}

/** Runs `code`, capturing everything written to stdout/stderr as one string. */
export async function runCapturingOutput(
  pyodide: PyodideInterface,
  code: string,
): Promise<{ output: string; error: string | null }> {
  return withPyodideQueue(async () => {
    const runnableCode = shimAsyncioRun(code);
    let output = "";
    pyodide.setStdout({ batched: (text) => (output += text + "\n") });
    pyodide.setStderr({ batched: (text) => (output += text + "\n") });

    try {
      await pyodide.loadPackagesFromImports(runnableCode).catch(() => {});
      const result = await pyodide.runPythonAsync(runnableCode);
      if (result !== undefined && result !== null) output += String(result);
      return { output, error: null };
    } catch (err) {
      return { output, error: String(err) };
    }
  });
}

// exec(compile(src, ..., "exec")) can't contain a top-level \`await\` at all
// (SyntaxError) — unlike runPythonAsync, a plain "exec" compile has no
// top-level-await support. Compiling with PyCF_ALLOW_TOP_LEVEL_AWAIT and
// running the result through eval() instead of exec() is what CPython's own
// async REPL uses to get around this: if the source contains a top-level
// await, eval() returns a coroutine (driven here with our own \`await\`,
// valid since the TEST_HARNESS script itself runs via runPythonAsync);
// otherwise eval() just runs the code normally and returns None. Combined
// with the same asyncio.run() -> await (...) shim runPythonAsync's own
// caller applies, this lets both the learner's own code and a hidden test
// use real \`asyncio.run(...)\` exactly as shown in lesson content.
//
// \`_ns["__source__"]\` stashes the learner's raw, un-exec'd source text into
// the namespace every hidden test's copy inherits — exec/eval only ever
// produces runtime objects (functions, classes, values), which drop any
// comments outright, so a hidden test that needs to check for a comment
// (e.g. "justify this in a comment") has no other way to see one. Every
// pre-existing hidden test elsewhere in the course ignores this extra key
// entirely, since none of them reference \`__source__\`. First needed by
// Module 3 Lesson 1's comprehensive sandbox.
const TEST_HARNESS = `
import json, ast

def _shim(src):
    return src.replace("asyncio.run(", "await (")

async def _run(src, ns):
    code = compile(_shim(src), "<exec>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    coro = eval(code, ns)
    if coro is not None:
        await coro

_ns = {}
_error = None
try:
    await _run(__learner_code, _ns)
    _ns["__source__"] = __learner_code
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

_tests = json.loads(__tests_json)
_results = []
if _error is None:
    for _i, _src in enumerate(_tests):
        try:
            await _run(_src, dict(_ns))
            _results.append(True)
        except Exception:
            _results.append(False)
else:
    _results = [False] * len(_tests)

json.dumps({"error": _error, "results": _results})
`;

/**
 * Runs `learnerCode` once, then each hidden test snippet against the resulting
 * namespace (a fresh copy per test, so tests can't see each other's mutations).
 * Test source is never surfaced back to the caller — only pass/fail per test.
 */
export async function runAgainstHiddenTests(
  pyodide: PyodideInterface,
  learnerCode: string,
  tests: string[],
): Promise<{ error: string | null; results: boolean[] }> {
  return withPyodideQueue(async () => {
    await pyodide.loadPackagesFromImports(learnerCode).catch(() => {});
    pyodide.globals.set("__learner_code", learnerCode);
    pyodide.globals.set("__tests_json", JSON.stringify(tests));
    const resultJson = (await pyodide.runPythonAsync(TEST_HARNESS)) as string;
    return JSON.parse(resultJson);
  });
}

// --- Multi-file sandboxes (real files + real `import`) ---
//
// Unlike the single-file harness above (which execs learner code into an
// in-memory dict namespace — no real filesystem or module system involved),
// multi-file mode needs genuine `import` semantics so `__name__` guards and
// cross-file imports behave exactly like real Python. Each sandbox instance
// gets its own directory under Pyodide's virtual FS, pushed onto `sys.path`
// only for the duration of its run, so same-named files in two different
// sandbox instances on the same page (this course reuses `main.py`/`tools.py`
// across multiple demos) never collide.

export interface SandboxFile {
  name: string;
  code: string;
  readOnly?: boolean;
}

export function moduleNameFor(fileName: string): string {
  return fileName.replace(/\.py$/, "");
}

export async function prepareMultiFileRun(
  pyodide: PyodideInterface,
  instanceId: string,
  files: SandboxFile[],
): Promise<string> {
  const dir = `/sandboxes/${instanceId}`;
  pyodide.runPython(`
import os
os.makedirs(${JSON.stringify(dir)}, exist_ok=True)
`);
  for (const file of files) {
    pyodide.FS.writeFile(`${dir}/${file.name}`, file.code);
  }
  const moduleNames = files.map((f) => moduleNameFor(f.name));
  pyodide.runPython(`
import sys
for _m in ${JSON.stringify(moduleNames)}:
    sys.modules.pop(_m, None)
_dir = ${JSON.stringify(dir)}
if _dir not in sys.path:
    sys.path.insert(0, _dir)
`);
  for (const file of files) {
    await pyodide.loadPackagesFromImports(file.code).catch(() => {});
  }
  return dir;
}

export function teardownMultiFileRun(pyodide: PyodideInterface, dir: string) {
  pyodide.runPython(`
import sys
try:
    sys.path.remove(${JSON.stringify(dir)})
except ValueError:
    pass
`);
}

/**
 * Writes every file to a per-instance sandbox directory, then runs the entry
 * file's *current* source directly (not re-read from disk, matching
 * `runCapturingOutput`'s single-file behavior) with stdout/stderr captured.
 */
export async function runMultiFileCapturingOutput(
  pyodide: PyodideInterface,
  files: SandboxFile[],
  entry: string,
  instanceId: string,
): Promise<{ output: string; error: string | null }> {
  return withPyodideQueue(async () => {
    const dir = await prepareMultiFileRun(pyodide, instanceId, files);
    const entryCode = files.find((f) => f.name === entry)?.code ?? "";

    let output = "";
    pyodide.setStdout({ batched: (text) => (output += text + "\n") });
    pyodide.setStderr({ batched: (text) => (output += text + "\n") });

    try {
      const result = await pyodide.runPythonAsync(entryCode);
      if (result !== undefined && result !== null) output += String(result);
      return { output, error: null };
    } catch (err) {
      return { output, error: String(err) };
    } finally {
      teardownMultiFileRun(pyodide, dir);
    }
  });
}

const MULTI_FILE_TEST_HARNESS = `
import json

_error = None
try:
    exec(compile(__hidden_tests, "<hidden_tests>", "exec"), {})
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

json.dumps({"error": _error, "results": [_error is None]})
`;

/**
 * Runs the entry file first (its own output/errors surfaced separately, and
 * never gating the tests below — an exercise's hidden tests may check a
 * non-entry file directly, independent of whether the entry file itself is
 * wired up correctly), then runs `hiddenTests` as one script in a fresh
 * namespace. Real `import`s in `hiddenTests` resolve against the same
 * sandbox directory (and the same already-invalidated module cache), so they
 * see the learner's latest edits.
 */
export async function runMultiFileAgainstHiddenTests(
  pyodide: PyodideInterface,
  files: SandboxFile[],
  entry: string,
  hiddenTests: string,
  instanceId: string,
): Promise<{
  entryOutput: string;
  entryError: string | null;
  error: string | null;
  results: boolean[];
}> {
  return withPyodideQueue(async () => {
    const dir = await prepareMultiFileRun(pyodide, instanceId, files);
    const entryCode = files.find((f) => f.name === entry)?.code ?? "";

    let entryOutput = "";
    pyodide.setStdout({ batched: (text) => (entryOutput += text + "\n") });
    pyodide.setStderr({ batched: (text) => (entryOutput += text + "\n") });

    let entryError: string | null = null;
    try {
      await pyodide.runPythonAsync(entryCode);
    } catch (err) {
      entryError = String(err);
    }

    // Hidden-test output is never shown to the learner — only pass/fail.
    pyodide.setStdout({ batched: () => {} });
    pyodide.setStderr({ batched: () => {} });

    await pyodide.loadPackagesFromImports(hiddenTests).catch(() => {});
    pyodide.globals.set("__hidden_tests", hiddenTests);
    const resultJson = (await pyodide.runPythonAsync(MULTI_FILE_TEST_HARNESS)) as string;
    const { error, results } = JSON.parse(resultJson) as { error: string | null; results: boolean[] };

    teardownMultiFileRun(pyodide, dir);
    return { entryOutput, entryError, error, results };
  });
}
