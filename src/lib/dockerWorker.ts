// The real-Docker execution backend for Lesson 0.8's Docker exercises —
// Pyodide can't run containers at all, so these run against a real Docker
// daemon inside an ephemeral E2B sandbox, brokered through this Cloudflare
// Worker (source in /worker). See architecture.md's sandbox-execution
// section for the full rationale and setup.
const WORKER_BASE_URL = "https://agentic-ai-course-sandbox.agentic-ai-course.workers.dev";

// NOT a real secret — this ships in the public JS bundle of a static site,
// so anyone can read it from devtools. It only raises the bar against
// casual/automated abuse of the grading endpoint (each call spins up a
// real, billable E2B sandbox), paired with the worker restricting CORS to
// this site's origin. Neither stops someone determined to extract this and
// call the worker directly — see the matching comment in worker/src/index.ts.
const SITE_TOKEN = "d6f60b82182c001e9acee64151b64f0f8fc08b7e41995ff1";

export interface DockerGradeResult {
  passed: boolean;
  checks: {
    buildSucceeded: boolean;
    cacheHitOnUnrelatedChange: boolean;
    secretsExcluded: boolean;
  };
  buildLog: string;
  error?: string;
}

/**
 * Grades a Dockerfile + .dockerignore submission for Lesson 0.8 Concept 6's
 * exercise: builds it for real, makes an unrelated code change, rebuilds,
 * and checks both that the install layer was cached and that .env/.git
 * never made it into the built image.
 */
export async function gradeDockerExercise(dockerfile: string, dockerignore: string): Promise<DockerGradeResult> {
  const response = await fetch(`${WORKER_BASE_URL}/docker-exercise/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Site-Token": SITE_TOKEN },
    body: JSON.stringify({ dockerfile, dockerignore }),
  });
  const data = (await response.json()) as DockerGradeResult;
  if (!response.ok) {
    throw new Error(data.error ?? `Grading request failed (${response.status})`);
  }
  return data;
}
