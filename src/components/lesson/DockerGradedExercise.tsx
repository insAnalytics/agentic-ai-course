import { useState } from "react";
import { gradeDockerExercise, type DockerGradeResult } from "../../lib/dockerWorker";
import LinkedText from "./LinkedText";

interface DockerGradedExerciseProps {
  task: string;
  starterDockerfile: string;
  starterDockerignore: string;
  hint: string;
  correctAnswer: {
    dockerfile: string;
    dockerignore: string;
    explanation: string;
  };
}

type Reveal = "none" | "hint" | "answer";

const CHECK_LABELS: Record<keyof DockerGradeResult["checks"], string> = {
  buildSucceeded: "Image builds successfully",
  cacheHitOnUnrelatedChange: "Install layer survives an unrelated code change",
  secretsExcluded: ".env and .git are excluded from the built image",
};

/**
 * Same shape as GradedExercise, but for exercises that need a real Docker
 * daemon rather than Pyodide — submitting builds the Dockerfile for real
 * inside an ephemeral sandbox (see src/lib/dockerWorker.ts) and grades
 * against the actual build log and image contents, not string matching.
 */
export default function DockerGradedExercise({
  task,
  starterDockerfile,
  starterDockerignore,
  hint,
  correctAnswer,
}: DockerGradedExerciseProps) {
  const [dockerfile, setDockerfile] = useState(starterDockerfile);
  const [dockerignore, setDockerignore] = useState(starterDockerignore);
  const [status, setStatus] = useState<"ready" | "grading">("ready");
  const [result, setResult] = useState<DockerGradeResult | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal>("none");
  const [showLog, setShowLog] = useState(false);

  const submit = async () => {
    setStatus("grading");
    setGradingError(null);
    try {
      const outcome = await gradeDockerExercise(dockerfile, dockerignore);
      setResult(outcome);
    } catch (err) {
      setGradingError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
    setStatus("ready");
  };

  const checkEntries = result ? (Object.keys(CHECK_LABELS) as (keyof DockerGradeResult["checks"])[]) : [];

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Exercise · Graded (real Docker build)</span>
        {result && <span className="text-xs font-medium text-white/80">{result.passed ? "Passed" : "Not yet"}</span>}
      </div>
      <div className="p-5">
        <p className="mt-0 mb-3 font-medium text-[var(--color-ink)]">
          <LinkedText text={task} />
        </p>

        <label className="mb-1 block text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">Dockerfile</label>
        <textarea
          value={dockerfile}
          onChange={(e) => setDockerfile(e.target.value)}
          spellCheck={false}
          rows={dockerfile.split("\n").length + 1}
          className="mb-3 block w-full resize-y rounded-md bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed text-gray-100 outline-none ring-1 ring-[var(--color-border)]"
        />

        <label className="mb-1 block text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">.dockerignore</label>
        <textarea
          value={dockerignore}
          onChange={(e) => setDockerignore(e.target.value)}
          spellCheck={false}
          rows={Math.max(dockerignore.split("\n").length, 2) + 1}
          className="mb-3 block w-full resize-y rounded-md bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed text-gray-100 outline-none ring-1 ring-[var(--color-border)]"
        />

        <div className="my-3 flex gap-2">
          <button
            onClick={submit}
            disabled={status === "grading"}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === "grading" ? "Building for real, this takes a bit…" : "Submit"}
          </button>
          {result && !result.passed && reveal === "none" && (
            <>
              <button
                onClick={() => setReveal("hint")}
                className="rounded-md bg-[var(--color-bg-subtle)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)]"
              >
                Hint
              </button>
              <button
                onClick={() => setReveal("answer")}
                className="rounded-md bg-[var(--color-bg-subtle)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)]"
              >
                Show answer
              </button>
            </>
          )}
        </div>

        {gradingError && (
          <div className="rounded-md bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">
            Couldn't reach the build service: {gradingError}
          </div>
        )}

        {result && (
          <div
            className={`rounded-md p-3 text-sm ${
              result.passed ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
            }`}
          >
            {result.error ? (
              <p className="m-0">{result.error}</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {checkEntries.map((key) => (
                  <li key={key}>
                    {result.checks[key] ? "✓" : "✗"} {CHECK_LABELS[key]}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowLog((v) => !v)}
              className="mt-2 text-xs font-medium underline underline-offset-2 opacity-80"
            >
              {showLog ? "Hide" : "Show"} real build log
            </button>
            {showLog && (
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-[var(--color-code-bg)] p-3 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap text-gray-300">
                {result.buildLog}
              </pre>
            )}
          </div>
        )}

        {reveal === "hint" && (
          <div className="mt-3 rounded-md bg-[var(--color-hint-bg)] p-3 text-sm text-[var(--color-ink)]">
            <LinkedText text={hint} />
          </div>
        )}

        {reveal === "answer" && (
          <div className="mt-3 rounded-md bg-[var(--color-bg-subtle)] p-3">
            <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">Dockerfile</p>
            <pre className="mb-2 overflow-x-auto rounded-md bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed text-gray-100">
              {correctAnswer.dockerfile}
            </pre>
            <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">.dockerignore</p>
            <pre className="mb-2 overflow-x-auto rounded-md bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed text-gray-100">
              {correctAnswer.dockerignore}
            </pre>
            <p className="mt-2 mb-0 text-sm text-[var(--color-ink)]">
              <LinkedText text={correctAnswer.explanation} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
