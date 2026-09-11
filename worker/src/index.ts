import { Sandbox } from "e2b";

export interface Env {
  E2B_API_KEY: string;
  SITE_TOKEN: string;
}

// Restricting CORS to the real site origin (rather than "*") and requiring
// a shared token are both soft speed bumps, not real access control — this
// is a public static site with no backend of its own, so anything sent to
// the browser (including this token) is readable by anyone who opens
// devtools. Both together raise the bar against casual/automated abuse of
// the grading endpoint (each call spins up a real, billable E2B sandbox);
// neither stops someone determined to extract the token and call this
// directly. A Cloudflare rate-limit rule is the real cost ceiling, and is
// still worth adding on top of this, not instead of it.
const SITE_ORIGIN = "https://insanalytics.github.io";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Site-Token",
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

function authorized(request: Request, env: Env): boolean {
  const got = request.headers.get("X-Site-Token");
  return got === env.SITE_TOKEN;
}

// --- Concept 6: Dockerfile + .dockerignore, graded in one shot ---

interface GradeRequest {
  dockerfile: string;
  dockerignore: string;
}

interface GradeResult {
  passed: boolean;
  checks: {
    buildSucceeded: boolean;
    cacheHitOnUnrelatedChange: boolean;
    secretsExcluded: boolean;
  };
  buildLog: string;
  error?: string;
}

const GRADE_PROJECT_DIR = "/home/user/project";

/**
 * Grades Lesson 0.8 Concept 6's exercise: a reordered Dockerfile (install
 * layer survives unrelated code changes) plus a .dockerignore that keeps
 * .git/.env/__pycache__ out of the build context entirely. Runs against a
 * real Docker daemon inside a fresh E2B sandbox per submission — see
 * architecture.md's sandbox-execution section for why (Pyodide can't run
 * real containers at all).
 */
async function gradeDockerfileExercise(body: GradeRequest, env: Env): Promise<GradeResult> {
  const sbx = await Sandbox.create("course-docker-sandbox", {
    apiKey: env.E2B_API_KEY,
    timeoutMs: 120_000,
  });

  try {
    await sbx.files.write([
      { path: `${GRADE_PROJECT_DIR}/app.py`, data: "print('hello from the exercise app')\n" },
      { path: `${GRADE_PROJECT_DIR}/requirements.txt`, data: "flask==3.0.0\n" },
      { path: `${GRADE_PROJECT_DIR}/.env`, data: "API_KEY=fake-secret-for-this-exercise\n" },
      { path: `${GRADE_PROJECT_DIR}/.git/HEAD`, data: "ref: refs/heads/main\n" },
      { path: `${GRADE_PROJECT_DIR}/__pycache__/app.cpython-312.pyc`, data: "not a real pyc, just a placeholder\n" },
      { path: `${GRADE_PROJECT_DIR}/Dockerfile`, data: body.dockerfile },
      { path: `${GRADE_PROJECT_DIR}/.dockerignore`, data: body.dockerignore },
    ]);

    const firstBuild = await sbx.commands.run(`cd ${GRADE_PROJECT_DIR} && sudo docker build -t exercise-image .`, {
      timeoutMs: 90_000,
    });
    if (firstBuild.exitCode !== 0) {
      return {
        passed: false,
        checks: { buildSucceeded: false, cacheHitOnUnrelatedChange: false, secretsExcluded: false },
        buildLog: firstBuild.stdout + firstBuild.stderr,
        error: "The first build failed — check the Dockerfile syntax.",
      };
    }

    // An edit with nothing to do with dependencies — the whole point being
    // graded is whether this specific kind of change still busts the cache.
    await sbx.commands.run(`echo '# unrelated comment' >> ${GRADE_PROJECT_DIR}/app.py`);

    const secondBuild = await sbx.commands.run(`cd ${GRADE_PROJECT_DIR} && sudo docker build -t exercise-image .`, {
      timeoutMs: 90_000,
    });
    const secondLog = secondBuild.stdout + secondBuild.stderr;
    if (secondBuild.exitCode !== 0) {
      return {
        passed: false,
        checks: { buildSucceeded: false, cacheHitOnUnrelatedChange: false, secretsExcluded: false },
        buildLog: secondLog,
        error: "The second build (after the unrelated app.py change) failed.",
      };
    }

    // A real reinstall always prints "Collecting <package>" lines; a cache
    // hit never does — more robust across Docker versions than matching an
    // exact "Using cache" string.
    const cacheHitOnUnrelatedChange = !secondLog.includes("Collecting");

    const secretCheck = await sbx.commands.run(
      `sudo docker run --rm exercise-image sh -c "test -e .env && echo HAS_ENV; test -e .git && echo HAS_GIT; true"`,
    );
    const secretsExcluded = !secretCheck.stdout.includes("HAS_ENV") && !secretCheck.stdout.includes("HAS_GIT");

    return {
      passed: cacheHitOnUnrelatedChange && secretsExcluded,
      checks: { buildSucceeded: true, cacheHitOnUnrelatedChange, secretsExcluded },
      buildLog: secondLog,
    };
  } finally {
    await sbx.kill();
  }
}

// --- Concept 4: a real interactive terminal over a persistent sandbox ---
//
// The worker itself stays stateless: Sandbox.connect(sandboxId) reconnects
// to an already-running sandbox, so the sandbox ID *is* the session — no
// session store of our own needed. Every command the learner runs is
// appended to a transcript file inside the sandbox itself (not held in the
// worker), because grading needs to see things that are true anymore by
// the time grading runs — the exercise's last step stops and removes the
// very container earlier checks needed running.

const TERMINAL_PROJECT_DIR = "/home/user/project";
const TRANSCRIPT_PATH = `${TERMINAL_PROJECT_DIR}/.transcript.jsonl`;
const SESSION_TIMEOUT_MS = 5 * 60_000;

const TERMINAL_APP_PY = `import os
import time

log_level = os.environ.get("LOG_LEVEL", "info")
print(f"Starting app on port 5000... (log level: {log_level})", flush=True)
while True:
    time.sleep(3600)
`;

const TERMINAL_DOCKERFILE = `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python3", "app.py"]
`;

interface TranscriptEntry {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  ts: number;
}

async function startTerminalSession(env: Env): Promise<{ sandboxId: string }> {
  const sbx = await Sandbox.create("course-docker-sandbox", {
    apiKey: env.E2B_API_KEY,
    timeoutMs: SESSION_TIMEOUT_MS,
  });
  await sbx.files.write([
    { path: `${TERMINAL_PROJECT_DIR}/app.py`, data: TERMINAL_APP_PY },
    { path: `${TERMINAL_PROJECT_DIR}/requirements.txt`, data: "flask==3.0.0\n" },
    { path: `${TERMINAL_PROJECT_DIR}/Dockerfile`, data: TERMINAL_DOCKERFILE },
  ]);
  return { sandboxId: sbx.sandboxId };
}

async function execInTerminalSession(
  sandboxId: string,
  command: string,
  env: Env,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const sbx = await Sandbox.connect(sandboxId, { apiKey: env.E2B_API_KEY });
  await sbx.setTimeout(SESSION_TIMEOUT_MS);

  const result = await sbx.commands.run(`cd ${TERMINAL_PROJECT_DIR} && ${command}`, { timeoutMs: 60_000 });

  let existing = "";
  try {
    existing = (await sbx.files.read(TRANSCRIPT_PATH)) as string;
  } catch {
    // no transcript yet — first command of the session
  }
  const entry: TranscriptEntry = {
    command,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    ts: Date.now(),
  };
  await sbx.files.write(TRANSCRIPT_PATH, existing + JSON.stringify(entry) + "\n");

  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
}

interface TerminalGradeResult {
  passed: boolean;
  checks: {
    imageBuilt: boolean;
    ranDetachedWithPortAndEnv: boolean;
    confirmedRunning: boolean;
    logsShowDebugMode: boolean;
    execReadRequirements: boolean;
    cleanedUp: boolean;
    nothingRunningNow: boolean;
  };
}

function parseTranscript(raw: string): TranscriptEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TranscriptEntry);
}

async function gradeTerminalSession(sandboxId: string, env: Env): Promise<TerminalGradeResult> {
  const sbx = await Sandbox.connect(sandboxId, { apiKey: env.E2B_API_KEY });
  await sbx.setTimeout(SESSION_TIMEOUT_MS);

  let entries: TranscriptEntry[] = [];
  try {
    entries = parseTranscript((await sbx.files.read(TRANSCRIPT_PATH)) as string);
  } catch {
    // no commands run yet
  }

  const ok = (e: TranscriptEntry) => e.exitCode === 0;

  const imageBuilt = entries.some((e) => /docker build/.test(e.command) && /-t\s+my-app/.test(e.command) && ok(e));

  const ranDetachedWithPortAndEnv = entries.some(
    (e) =>
      /docker run/.test(e.command) &&
      /(^|\s)-d(\s|$)|--detach/.test(e.command) &&
      /8000:5000/.test(e.command) &&
      /LOG_LEVEL=debug/.test(e.command) &&
      ok(e),
  );

  const confirmedRunning = entries.some((e) => /docker ps/.test(e.command) && !/docker ps -a/.test(e.command) && e.stdout.includes("my-app"));

  const logsShowDebugMode = entries.some((e) => /docker logs/.test(e.command) && /debug/i.test(e.stdout));

  const execReadRequirements = entries.some(
    (e) => /docker exec/.test(e.command) && /requirements\.txt/.test(e.command) && /flask/i.test(e.stdout),
  );

  const cleanedUp =
    entries.some((e) => /docker stop/.test(e.command) && ok(e)) && entries.some((e) => /docker rm/.test(e.command) && ok(e));

  const liveCheck = await sbx.commands.run("sudo docker ps --format '{{.Image}}'");
  const nothingRunningNow = !liveCheck.stdout.includes("my-app");

  const checks = {
    imageBuilt,
    ranDetachedWithPortAndEnv,
    confirmedRunning,
    logsShowDebugMode,
    execReadRequirements,
    cleanedUp,
    nothingRunningNow,
  };

  return { passed: Object.values(checks).every(Boolean), checks };
}

async function endTerminalSession(sandboxId: string, env: Env): Promise<void> {
  await Sandbox.kill(sandboxId, { apiKey: env.E2B_API_KEY });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method !== "POST") return json({ error: "Not found" }, 404);
    if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

    try {
      if (url.pathname === "/docker-exercise/grade") {
        const body = (await request.json()) as GradeRequest;
        if (typeof body.dockerfile !== "string" || typeof body.dockerignore !== "string") {
          return json({ error: "Body must include dockerfile and dockerignore as strings" }, 400);
        }
        return json(await gradeDockerfileExercise(body, env));
      }

      if (url.pathname === "/docker-terminal/start") {
        return json(await startTerminalSession(env));
      }

      if (url.pathname === "/docker-terminal/exec") {
        const body = (await request.json()) as { sandboxId: string; command: string };
        if (typeof body.sandboxId !== "string" || typeof body.command !== "string") {
          return json({ error: "Body must include sandboxId and command as strings" }, 400);
        }
        return json(await execInTerminalSession(body.sandboxId, body.command, env));
      }

      if (url.pathname === "/docker-terminal/grade") {
        const body = (await request.json()) as { sandboxId: string };
        if (typeof body.sandboxId !== "string") {
          return json({ error: "Body must include sandboxId as a string" }, 400);
        }
        return json(await gradeTerminalSession(body.sandboxId, env));
      }

      if (url.pathname === "/docker-terminal/end") {
        const body = (await request.json()) as { sandboxId: string };
        if (typeof body.sandboxId !== "string") {
          return json({ error: "Body must include sandboxId as a string" }, 400);
        }
        await endTerminalSession(body.sandboxId, env);
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  },
};
