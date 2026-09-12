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

// --- Grading a learner-written @pytest.mark.parametrize test (Lesson 0.10) ---
//
// Real pytest is a genuine Pyodide-native package (a proper wasm-targeted
// wheel, not just a pure-Python micropip install) — confirmed directly. But
// actually *running* it (`pytest.main([...])`) crashes Pyodide fatally
// (`EPERM: operation not permitted, fsync`, flagged by Pyodide itself as
// `pyodide_fatal_error: true`) — confirmed directly, not assumed. Since every
// exercise on a page shares one global Pyodide instance, that risk is
// unacceptable: one learner's submission could take down every other
// exercise on the page. So this doesn't run pytest's own collection engine
// at all — it reads the real `@pytest.mark.parametrize` decorator's attached
// data directly off the function object (`fn.pytestmark`, confirmed to work
// exactly as pytest itself would produce it) and calls the *real* decorated
// function itself, once per required case, catching the real AssertionError.
// The learner's test is genuinely real pytest code with real assertions,
// actually executed — this just replaces pytest's own runner, not their code.
//
// A genuinely synchronous client (no `await` in the learner's test, matching
// real TestClient's actual interface) was ruled out after three separate
// attempts, not by assumption: a real OS thread (unavailable, same as
// routes/dependencies), and a fresh `asyncio.new_event_loop()` pumped via
// `run_until_complete` (Pyodide's own event loop implementation doesn't
// support real blocking there either — it returns a `PyodideTask` object
// instead of the actual result, since a single-threaded JS environment has
// no primitive for "block and wait for a promise" without real multi-
// threading). So the learner's test function must be `async def`, using
// `await client.post(...)` — the same category of environment-driven
// accommodation as `async def` routes, not a shortcut on the testing
// methodology itself.
let pytestReadyPromise: Promise<void> | null = null;

/** Installs `pytest` into the shared Pyodide instance, once per page session. */
export function ensurePytestReady(pyodide: PyodideInterface): Promise<void> {
  if (pytestReadyPromise) return pytestReadyPromise;

  pytestReadyPromise = withPyodideQueue(async () => {
    await pyodide.loadPackage(["micropip"]);
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("pytest")
`);
  });

  return pytestReadyPromise;
}

export interface PytestGradeResult {
  error: string | null;
  result: { passed: boolean; checks: Record<string, boolean> } | null;
}

/**
 * A required case for `gradePytestParametrizeExercise`. `matchArgs` is
 * deliberately only the *input* prefix of the parametrized tuple (e.g.
 * `[payload, includeApiKey]`, never the expected value) — used solely to
 * find which of the learner's own parametrize rows corresponds to this
 * scenario. The actual expected value is never part of the match: once
 * found, the *learner's own* full tuple (their own expected value included)
 * is what actually gets executed, so a wrong expected value fails via a real
 * assertion, not via a failed lookup — those are different, and only the
 * former is the thing being graded.
 */
export interface RequiredParametrizeCase {
  matchArgs: unknown[];
  label: string;
}

// `setupCode` runs first (defining, at minimum, `app` and a `client` — an
// httpx.AsyncClient wired via ASGITransport — for the learner's test to use,
// exactly like the `client` fixture the lesson already taught), then
// `learnerCode` (expected to define one `async def` test function named
// `entryTestName`, decorated with `@pytest.mark.parametrize`). For each
// `requiredCases` entry, the matching parametrize tuple (if any) is looked
// up and the *real* decorated function is called with it, `await`ed, and
// checked for a real `AssertionError` — never running a case the learner
// didn't actually write, and never fabricating a pass for one they omitted.
const PYTEST_PARAMETRIZE_HARNESS = `
import ast, inspect, json

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
    await _run(__setup_code, _ns)
except Exception as e:
    _error = f"setup error: {type(e).__name__}: {e}"

if _error is None:
    try:
        await _run(__learner_code, _ns)
    except Exception as e:
        _error = f"{type(e).__name__}: {e}"

_required = json.loads(__required_cases_json)  # [{"matchArgs": [...], "label": "..."}, ...]
_checks = {}
if _error is None:
    _fn = _ns.get(__entry_test_name)
    if _fn is None or not callable(_fn):
        _error = f"No test function named {__entry_test_name} was found."
    else:
        _mark = None
        for _m in getattr(_fn, "pytestmark", []):
            if _m.name == "parametrize":
                _mark = _m
                break
        _cases = {}
        if _mark is not None:
            _n_match = len(_required[0]["matchArgs"]) if _required else 0
            for _values in _mark.args[1]:
                if not isinstance(_values, (tuple, list)):
                    _values = (_values,)
                _key = json.dumps(list(_values[:_n_match]), sort_keys=True, default=str)
                _cases[_key] = _values

        _client = _ns.get("client")
        for _req in _required:
            _label = _req["label"]
            _key = json.dumps(_req["matchArgs"], sort_keys=True, default=str)
            _match = _cases.get(_key)
            if _match is None:
                _checks[_label] = False
                continue
            try:
                _result = _fn(_client, *_match)
                if inspect.isawaitable(_result):
                    await _result
                _checks[_label] = True
            except AssertionError:
                _checks[_label] = False
            except Exception:
                _checks[_label] = False

_result = {"passed": all(_checks.values()) if _checks else False, "checks": _checks} if _error is None else None
json.dumps({"error": _error, "result": _result})
`;

/**
 * Grades a learner-written `@pytest.mark.parametrize`-decorated `async def`
 * test function named `entryTestName`, against `requiredCases`. Call
 * `ensurePytestReady` (and `ensureFastAPIReady`, if `setupCode` builds a
 * FastAPI app) first — this doesn't install anything itself.
 */
export async function gradePytestParametrizeExercise(
  pyodide: PyodideInterface,
  setupCode: string,
  learnerCode: string,
  entryTestName: string,
  requiredCases: RequiredParametrizeCase[],
): Promise<PytestGradeResult> {
  return withPyodideQueue(async () => {
    await pyodide.loadPackagesFromImports(setupCode).catch(() => {});
    await pyodide.loadPackagesFromImports(learnerCode).catch(() => {});
    pyodide.globals.set("__setup_code", setupCode);
    pyodide.globals.set("__learner_code", learnerCode);
    pyodide.globals.set("__entry_test_name", entryTestName);
    pyodide.globals.set(
      "__required_cases_json",
      JSON.stringify(requiredCases.map((c) => ({ matchArgs: c.matchArgs, label: c.label }))),
    );
    const resultJson = (await pyodide.runPythonAsync(PYTEST_PARAMETRIZE_HARNESS)) as string;
    return JSON.parse(resultJson) as PytestGradeResult;
  });
}

// --- Grading a learner-written `unittest.mock.patch` test, against a real,
// fixed `main.py` (Lesson 0.10, Concept 6) ---
//
// `@patch("main.call_llm_api", ...)` resolves that string by actually
// `importlib.import_module`-ing "main" — a real module, not a name inside an
// exec() namespace — so this reuses the multi-file sandbox machinery (real
// files on sys.path) rather than the single-namespace approach the earlier
// FastAPI exercises use. `main.py` is fixed and never shown as editable (the
// learner only writes `test_main.py`); since `main.py`'s own route logic is
// correct by construction, a required test only passes if the learner's own
// mock and assertions are actually correct against that real, fixed
// behavior — same trust model as `PYTEST_PARAMETRIZE_HARNESS`: the learner's
// real test *function* is executed for real, unlike the FastAPI exercises
// (0.9's and the multi-file one), where the app is learner-written and a
// grading script we wrote does the asserting.
//
// `unittest.mock` (including its `AsyncMock`/async-aware `patch` support,
// Python 3.8+) is pure standard library — no micropip install needed, unlike
// `pytest`. `ensureFastAPIReady` is still required first, since `main.py`
// itself uses FastAPI/httpx.
export interface RequiredMockTest {
  /** Name of the required test function, e.g. "test_generate_success". */
  name: string;
  label: string;
}

// Each required test function is called with the shared `client` (an
// httpx.AsyncClient against the real, fixed `main.app`) passed as a
// *keyword* argument, deliberately never positional — confirmed directly
// that `@patch`'s wrapper appends its own mock argument *after* whatever
// positional args the caller supplies (`func(*args, mock)`, not
// `func(mock, *args)`), which would silently swap `mock_call_llm_api` and
// `client` if `client` were passed positionally, since both examples in the
// lesson declare the mock parameter first. Real pytest sidesteps this by
// injecting all of its own fixtures as keyword arguments, matched by
// parameter name — calling with `client=_client` here reproduces that exact
// behavior without depending on pytest's own runner. The whole sequence runs
// inside `app.router.lifespan_context(app)`, same reasoning as the other
// FastAPI harnesses.
const MOCK_PATCH_TEST_HARNESS = `
import importlib, inspect, json

_error = None
_app = None
try:
    _main = importlib.import_module(__main_module)
    _app = getattr(_main, "app", None)
    if _app is None:
        _error = f"No FastAPI instance named 'app' was found in {__main_module}.py"
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

_test_mod = None
if _error is None:
    try:
        _test_mod = importlib.import_module(__test_module)
    except Exception as e:
        _error = f"{type(e).__name__}: {e}"

_checks = {}
if _error is None:
    import httpx
    _required = json.loads(__required_tests_json)
    async with _app.router.lifespan_context(_app):
        _transport = httpx.ASGITransport(app=_app)
        _client = httpx.AsyncClient(transport=_transport, base_url="http://test")
        for _req in _required:
            _name = _req["name"]
            _label = _req["label"]
            _fn = getattr(_test_mod, _name, None)
            if _fn is None or not callable(_fn):
                _checks[_label] = False
                continue
            try:
                _outcome = _fn(client=_client)
                if inspect.isawaitable(_outcome):
                    await _outcome
                _checks[_label] = True
            except AssertionError:
                _checks[_label] = False
            except Exception:
                _checks[_label] = False
        await _client.aclose()

_result = {"passed": all(_checks.values()) if _checks else False, "checks": _checks} if _error is None else None
json.dumps({"error": _error, "result": _result})
`;

/**
 * Grades `learnerCode` (a `test_main.py`, expected to define the functions
 * named in `requiredTests`, each decorated with `@patch("main....", ...)`)
 * against a fixed, real `mainCode` (written to a real `main.py` alongside
 * it). Call `ensureFastAPIReady` first; this doesn't install anything
 * itself.
 */
export async function gradeMockPatchExercise(
  pyodide: PyodideInterface,
  mainCode: string,
  learnerCode: string,
  requiredTests: RequiredMockTest[],
  instanceId: string,
): Promise<PytestGradeResult> {
  return withPyodideQueue(async () => {
    const files: SandboxFile[] = [
      { name: "main.py", code: mainCode },
      { name: "test_main.py", code: learnerCode },
    ];
    const dir = await prepareMultiFileRun(pyodide, instanceId, files);
    try {
      pyodide.globals.set("__main_module", moduleNameFor("main.py"));
      pyodide.globals.set("__test_module", moduleNameFor("test_main.py"));
      pyodide.globals.set("__required_tests_json", JSON.stringify(requiredTests));
      const resultJson = (await pyodide.runPythonAsync(MOCK_PATCH_TEST_HARNESS)) as string;
      return JSON.parse(resultJson) as PytestGradeResult;
    } finally {
      teardownMultiFileRun(pyodide, dir);
    }
  });
}

// --- Grading a learner-written, multi-file pytest *suite* (conftest.py +
// test_*.py) against a real, fixed app (Lesson 0.10's comprehensive
// sandbox) ---
//
// Combines two things already proven separately: real files on `sys.path`
// (so `from main import app` inside `conftest.py` resolves for real, same
// as the mock-patch exercise) and parametrize-case matching (same as
// `PYTEST_PARAMETRIZE_HARNESS`) — but now a required test can be either an
// ordinary named function or a parametrized one, mixed in the same suite,
// matching a realistic small test file rather than one isolated test
// function.
//
// One more real fixture-machinery detail, confirmed directly (not
// assumed): a function decorated with `@pytest.fixture` refuses to be
// called directly — `pytest.fail("Fixture ... called directly. Fixtures
// are not meant to be called directly...")`, even though it reports as a
// plain `function` object. The *undecorated* function is still reachable
// via `fixture.__wrapped__`, confirmed to work — that's what this harness
// actually calls, once per graded test/case (a fresh call each time,
// matching a function-scoped fixture's real per-test semantics — this
// exercise's own `client` fixture resets `app.state.registry`/`next_id` on
// every call, so isolation only actually holds if the fixture genuinely
// runs fresh for every case, not once for the whole file).
export interface RequiredSuiteItem {
  /** Name of the required test function in the learner's test file. */
  name: string;
  /** Label for a plain (non-parametrized) required test. */
  label?: string;
  /** Present for a parametrized required test — one label per required case. */
  cases?: RequiredParametrizeCase[];
}

const TEST_SUITE_HARNESS = `
import importlib, inspect, json

_error = None
_app = None
try:
    _main = importlib.import_module(__main_module)
    _app = getattr(_main, "app", None)
    if _app is None:
        _error = f"No FastAPI instance named 'app' was found in {__main_module}.py"
except Exception as e:
    _error = f"{type(e).__name__}: {e}"

_conftest_mod = None
_test_mod = None
if _error is None:
    try:
        _conftest_mod = importlib.import_module(__conftest_module)
    except Exception as e:
        _error = f"{__conftest_module}.py -- {type(e).__name__}: {e}"

if _error is None:
    try:
        _test_mod = importlib.import_module(__test_module)
    except Exception as e:
        _error = f"{__test_module}.py -- {type(e).__name__}: {e}"

_client_fixture = None
if _error is None:
    _raw_fixture = getattr(_conftest_mod, __client_fixture_name, None)
    if _raw_fixture is None or not callable(_raw_fixture):
        _error = f"No fixture named {__client_fixture_name} was found in {__conftest_module}.py"
    else:
        _client_fixture = getattr(_raw_fixture, "__wrapped__", _raw_fixture)

_checks = {}
if _error is None:
    _required = json.loads(__required_tests_json)
    async with _app.router.lifespan_context(_app):
        for _req in _required:
            _fn = getattr(_test_mod, _req["name"], None)
            _cases = _req.get("cases")

            if _cases:
                _fn_cases = {}
                if _fn is not None:
                    for _m in getattr(_fn, "pytestmark", []):
                        if _m.name == "parametrize":
                            _n_match = len(_cases[0]["matchArgs"]) if _cases else 0
                            for _values in _m.args[1]:
                                if not isinstance(_values, (tuple, list)):
                                    _values = (_values,)
                                _key = json.dumps(list(_values[:_n_match]), sort_keys=True, default=str)
                                _fn_cases[_key] = _values
                            break
                for _case in _cases:
                    _label = _case["label"]
                    if _fn is None or not callable(_fn):
                        _checks[_label] = False
                        continue
                    _key = json.dumps(_case["matchArgs"], sort_keys=True, default=str)
                    _match = _fn_cases.get(_key)
                    if _match is None:
                        _checks[_label] = False
                        continue
                    _client = _client_fixture()
                    try:
                        _outcome = _fn(_client, *_match)
                        if inspect.isawaitable(_outcome):
                            await _outcome
                        _checks[_label] = True
                    except AssertionError:
                        _checks[_label] = False
                    except Exception:
                        _checks[_label] = False
                    try:
                        await _client.aclose()
                    except Exception:
                        pass
            else:
                _label = _req["label"]
                if _fn is None or not callable(_fn):
                    _checks[_label] = False
                    continue
                _client = _client_fixture()
                try:
                    _outcome = _fn(client=_client)
                    if inspect.isawaitable(_outcome):
                        await _outcome
                    _checks[_label] = True
                except AssertionError:
                    _checks[_label] = False
                except Exception:
                    _checks[_label] = False
                try:
                    await _client.aclose()
                except Exception:
                    pass

_result = {"passed": all(_checks.values()) if _checks else False, "checks": _checks} if _error is None else None
json.dumps({"error": _error, "result": _result})
`;

/**
 * Grades a learner-written test suite (`conftest.py` + one or more test
 * files, as `learnerFiles`) against a fixed, real app (`fixedFiles`, e.g.
 * `main.py` + `agents.py`, never editable). `clientFixtureModule` /
 * `clientFixtureName` locate the fixture the harness calls fresh before
 * every graded test or parametrize case (e.g. `"conftest"` / `"client"`).
 * Call `ensureFastAPIReady` first; this doesn't install anything itself.
 */
export async function gradeTestSuiteExercise(
  pyodide: PyodideInterface,
  fixedFiles: SandboxFile[],
  learnerFiles: SandboxFile[],
  entry: string,
  clientFixtureModule: string,
  clientFixtureName: string,
  testModule: string,
  requiredTests: RequiredSuiteItem[],
  instanceId: string,
): Promise<PytestGradeResult> {
  return withPyodideQueue(async () => {
    const dir = await prepareMultiFileRun(pyodide, instanceId, [...fixedFiles, ...learnerFiles]);
    try {
      pyodide.globals.set("__main_module", moduleNameFor(entry));
      pyodide.globals.set("__conftest_module", moduleNameFor(clientFixtureModule));
      pyodide.globals.set("__test_module", moduleNameFor(testModule));
      pyodide.globals.set("__client_fixture_name", clientFixtureName);
      pyodide.globals.set("__required_tests_json", JSON.stringify(requiredTests));
      const resultJson = (await pyodide.runPythonAsync(TEST_SUITE_HARNESS)) as string;
      return JSON.parse(resultJson) as PytestGradeResult;
    } finally {
      teardownMultiFileRun(pyodide, dir);
    }
  });
}
