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

const PROJECT_DIR = "/home/user/project";

/**
 * Grades Lesson 0.8 Concept 6's exercise: a reordered Dockerfile (install
 * layer survives unrelated code changes) plus a .dockerignore that keeps
 * .git/.env/__pycache__ out of the build context entirely. Runs against a
 * real Docker daemon inside a fresh E2B sandbox per submission — see
 * architecture.md's sandbox-execution section for why (Pyodide can't run
 * real containers at all).
 */
async function gradeDockerExercise(body: GradeRequest, env: Env): Promise<GradeResult> {
  const sbx = await Sandbox.create("course-docker-sandbox", {
    apiKey: env.E2B_API_KEY,
    timeoutMs: 120_000,
  });

  try {
    await sbx.files.write([
      { path: `${PROJECT_DIR}/app.py`, data: "print('hello from the exercise app')\n" },
      { path: `${PROJECT_DIR}/requirements.txt`, data: "flask==3.0.0\n" },
      { path: `${PROJECT_DIR}/.env`, data: "API_KEY=fake-secret-for-this-exercise\n" },
      { path: `${PROJECT_DIR}/.git/HEAD`, data: "ref: refs/heads/main\n" },
      { path: `${PROJECT_DIR}/__pycache__/app.cpython-312.pyc`, data: "not a real pyc, just a placeholder\n" },
      { path: `${PROJECT_DIR}/Dockerfile`, data: body.dockerfile },
      { path: `${PROJECT_DIR}/.dockerignore`, data: body.dockerignore },
    ]);

    const firstBuild = await sbx.commands.run(`cd ${PROJECT_DIR} && sudo docker build -t exercise-image .`, {
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
    await sbx.commands.run(`echo '# unrelated comment' >> ${PROJECT_DIR}/app.py`);

    const secondBuild = await sbx.commands.run(`cd ${PROJECT_DIR} && sudo docker build -t exercise-image .`, {
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/docker-exercise/grade" && request.method === "POST") {
      if (request.headers.get("X-Site-Token") !== env.SITE_TOKEN) {
        return json({ error: "Unauthorized" }, 401);
      }

      let body: GradeRequest;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
      if (typeof body.dockerfile !== "string" || typeof body.dockerignore !== "string") {
        return json({ error: "Body must include dockerfile and dockerignore as strings" }, 400);
      }

      try {
        const result = await gradeDockerExercise(body, env);
        return json(result);
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
