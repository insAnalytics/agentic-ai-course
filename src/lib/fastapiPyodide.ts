import {
  type PyodideInterface,
  type SandboxFile,
  withPyodideQueue,
  prepareMultiFileRun,
  teardownMultiFileRun,
  moduleNameFor,
} from "./pyodide";

// Grading a real FastAPI app in-browser, at zero cost — no E2B/server needed.
// The one thing that makes this possible: httpx.AsyncClient talking to the
// app directly via httpx.ASGITransport, entirely on the event loop Pyodide's
// runPythonAsync already provides. Starlette's own TestClient (the "normal"
// way to test a FastAPI app) instead spins up a background thread to offer a
// synchronous API, and Pyodide's standard build has no real threading
// (confirmed directly: `RuntimeError: can't start new thread`) — verified via
// a real Pyodide instance, not assumed. ASGITransport needs no such thread,
// since everything stays async end to end.
//
// The one real constraint this imposes on exercise code: route handlers must
// be `async def`, not plain `def`. A sync route handler is run by Starlette
// in a real worker thread (`anyio.to_thread.run_sync`, so a slow sync route
// can't block the event loop) — also confirmed to fail the same way. An
// `async def` route is awaited directly, no thread involved. This lines up
// with what this lesson already teaches about async fitting agent backends,
// so it's a reasonable ask rather than an arbitrary workaround.
//
// Package versions are pinned because this Pyodide build (v0.26.4) ships an
// older wasm-compiled `pydantic-core` (2.18.1, via `pydantic` 2.7.0) than
// what current fastapi/starlette/anyio/httpx releases require — installing
// the latest of each pulls in a `pydantic-core` version with no wasm wheel
// available at all. These versions are mutually compatible with the bundled
// pydantic-core, confirmed by actually installing and running them.
const FASTAPI_PACKAGES = [
  "sniffio",
  "idna",
  "certifi",
  "anyio==4.3.0",
  "starlette==0.36.3",
  "fastapi==0.110.0",
  "httpcore==1.0.5",
  "h11==0.14.0",
  "httpx==0.27.0",
];

let fastapiReadyPromise: Promise<void> | null = null;

/**
 * Installs the FastAPI stack into the shared Pyodide instance, once per page
 * session. Safe to call before every grading attempt — subsequent calls
 * resolve immediately once the first install has finished.
 */
export function ensureFastAPIReady(pyodide: PyodideInterface): Promise<void> {
  if (fastapiReadyPromise) return fastapiReadyPromise;

  fastapiReadyPromise = withPyodideQueue(async () => {
    await pyodide.loadPackage(["micropip", "pydantic", "ssl"]);
    pyodide.globals.set("__fastapi_packages", FASTAPI_PACKAGES);
    await pyodide.runPythonAsync(`
import micropip
for _pkg in __fastapi_packages:
    await micropip.install(_pkg)
`);
  });

  return fastapiReadyPromise;
}

// Runs the learner's code once (defining, among other things, a FastAPI
// instance named \`app\`), then runs a separate grading script in that same
// namespace — so the grading script can reference \`app\` and anything else
// the learner defined directly, no import needed. Both run through the same
// PyCF_ALLOW_TOP_LEVEL_AWAIT + eval() trick as the plain-Python harness in
// pyodide.ts, for the same reason: a plain exec() can't contain a top-level
// \`await\` at all, and both learner code and the grading script need one
// (learner code implicitly, via async def routes; the grading script
// explicitly, via \`await client.post(...)\`).
//
// The grading script is expected to set a variable named \`__result\` to a
// JSON-serializable dict, conventionally \`{"passed": bool, "checks": {...}}\`
// — deliberately not a fixed shape enforced here, since a stateful CRUD-style
// exercise (this lesson's) needs one shared client across a fixed sequence of
// requests, not independent per-check namespaces the way plain hidden tests
// work; each exercise's grading script owns its own request sequence and
// checks.
//
// If the learner's code defines \`app\`, the grading script runs inside
// \`app.router.lifespan_context(app)\` — confirmed directly that
// httpx.ASGITransport alone never triggers FastAPI's lifespan startup/shutdown
// at all (\`app.state\` set inside a \`lifespan\` never actually gets set), so
// any exercise using \`lifespan\` for shared startup state would otherwise
// silently fail. This is a no-op for an app with no custom \`lifespan\`
// (FastAPI always provides a default one), so it's safe to apply
// unconditionally rather than asking each exercise to remember it.
const FASTAPI_GRADING_HARNESS = `
import ast, json

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
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

_result = None
if _error is None:
    try:
        _app = _ns.get("app")
        if _app is not None:
            async with _app.router.lifespan_context(_app):
                await _run(__grading_script, _ns)
        else:
            await _run(__grading_script, _ns)
        _result = _ns.get("__result")
    except Exception as e:
        _error = f"{type(e).__name__}: {e}"

json.dumps({"error": _error, "result": _result})
`;

export interface FastAPIGradeResult {
  error: string | null;
  result: { passed: boolean; checks: Record<string, boolean> } | null;
}

/**
 * Grades `learnerCode` (must define `app`, a FastAPI instance, with `async
 * def` routes) against `gradingScript` — a Python script, written per
 * exercise, that builds an httpx.AsyncClient off `app` and sets `__result`.
 * Call `ensureFastAPIReady` first; this doesn't install anything itself.
 */
export async function gradeFastAPIExercise(
  pyodide: PyodideInterface,
  learnerCode: string,
  gradingScript: string,
): Promise<FastAPIGradeResult> {
  return withPyodideQueue(async () => {
    await pyodide.loadPackagesFromImports(learnerCode).catch(() => {});
    pyodide.globals.set("__learner_code", learnerCode);
    pyodide.globals.set("__grading_script", gradingScript);
    const resultJson = (await pyodide.runPythonAsync(FASTAPI_GRADING_HARNESS)) as string;
    return JSON.parse(resultJson) as FastAPIGradeResult;
  });
}

// --- Multi-file FastAPI apps (real files + real `import`, e.g. `main.py`
// importing an `APIRouter` from `agents.py`) ---
//
// Reuses pyodide.ts's multi-file sandbox machinery (writing files to a real
// per-instance directory on sys.path, invalidating the module cache) rather
// than duplicating it — the entry file is then imported as a genuine module
// so its own top-level `from agents import ...` resolves for real, and
// `<entry_module>.app` is what actually gets graded.
const FASTAPI_MULTI_FILE_GRADING_HARNESS = `
import ast, importlib, json

def _shim(src):
    return src.replace("asyncio.run(", "await (")

_error = None
_app = None
try:
    _entry = importlib.import_module(__entry_module)
    _app = getattr(_entry, "app", None)
    if _app is None:
        _error = f"No FastAPI instance named 'app' was found in {__entry_module}.py"
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

_result = None
if _error is None:
    _ns = {"app": _app}
    try:
        async with _app.router.lifespan_context(_app):
            code = compile(_shim(__grading_script), "<exec>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
            coro = eval(code, _ns)
            if coro is not None:
                await coro
        _result = _ns.get("__result")
    except Exception as e:
        _error = f"{type(e).__name__}: {e}"

json.dumps({"error": _error, "result": _result})
`;

/**
 * Same idea as `gradeFastAPIExercise`, but for a multi-file app: `files` are
 * written to a real per-instance sandbox directory, `entry` (e.g. `"main.py"`)
 * is imported as a genuine module so its own top-level imports resolve for
 * real, and `<entry module>.app` is what gets graded — same
 * `app.router.lifespan_context(app)` wrapping, same `__result` convention.
 */
export async function gradeFastAPIMultiFileExercise(
  pyodide: PyodideInterface,
  files: SandboxFile[],
  entry: string,
  gradingScript: string,
  instanceId: string,
): Promise<FastAPIGradeResult> {
  return withPyodideQueue(async () => {
    const dir = await prepareMultiFileRun(pyodide, instanceId, files);
    try {
      pyodide.globals.set("__entry_module", moduleNameFor(entry));
      pyodide.globals.set("__grading_script", gradingScript);
      const resultJson = (await pyodide.runPythonAsync(FASTAPI_MULTI_FILE_GRADING_HARNESS)) as string;
      return JSON.parse(resultJson) as FastAPIGradeResult;
    } finally {
      teardownMultiFileRun(pyodide, dir);
    }
  });
}
