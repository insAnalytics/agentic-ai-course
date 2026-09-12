import { useEffect, useId, useState } from "react";
import { loadPyodideOnce, type PyodideInterface, type SandboxFile } from "../../lib/pyodide";
import { ensureFastAPIReady, gradeFastAPIMultiFileExercise, type FastAPIGradeResult } from "../../lib/fastapiPyodide";
import MultiFileEditor from "./MultiFileEditor";
import LinkedText from "./LinkedText";

interface MultiFileFastAPIGradedExerciseProps {
  task: string;
  files: SandboxFile[];
  /** Name of the file imported as the entry module (e.g. "main.py") — its `app` is what gets graded. */
  entry: string;
  /** Maps a boolean key the gradingScript sets on __result.checks to its learner-facing label. */
  checkLabels: Record<string, string>;
  /**
   * A Python script, written for this exercise, that imports/references
   * `app` (bound in its own exec namespace) and must set a variable
   * `__result` to `{"passed": bool, "checks": {...}}`. Never shown to the
   * learner.
   */
  gradingScript: string;
  hint: string;
  correctFiles: SandboxFile[];
  explanation: string;
}

type Reveal = "none" | "hint" | "answer";
type Status = "loading" | "preparing" | "ready" | "grading";

export default function MultiFileFastAPIGradedExercise({
  task,
  files: initialFiles,
  entry,
  checkLabels,
  gradingScript,
  hint,
  correctFiles,
  explanation,
}: MultiFileFastAPIGradedExerciseProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [files, setFiles] = useState(initialFiles);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<FastAPIGradeResult | null>(null);
  const [reveal, setReveal] = useState<Reveal>("none");

  useEffect(() => {
    let cancelled = false;
    loadPyodideOnce().then((p) => {
      if (cancelled) return;
      setPyodide(p);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFile = (name: string, code: string) => {
    setFiles((prev) => prev.map((f) => (f.name === name ? { ...f, code } : f)));
  };

  const passed = result?.result?.passed ?? false;
  const checkKeys = result?.result ? Object.keys(checkLabels) : [];
  const passCount = result?.result ? checkKeys.filter((k) => result.result!.checks[k]).length : 0;

  const submit = async () => {
    if (!pyodide) return;
    setStatus("preparing");
    await ensureFastAPIReady(pyodide);
    setStatus("grading");
    const outcome = await gradeFastAPIMultiFileExercise(pyodide, files, entry, gradingScript, instanceId);
    setResult(outcome);
    setStatus("ready");
  };

  const statusLabel =
    status === "loading"
      ? "Loading Python…"
      : status === "preparing"
        ? "Preparing FastAPI (first time only)…"
        : status === "grading"
          ? "Grading…"
          : "Submit";

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Exercise · Graded (real FastAPI, in-browser)</span>
        {result?.result && (
          <span className="text-xs font-medium text-white/80">
            {passed ? "Passed" : `${passCount}/${checkKeys.length} passed`}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="mt-0 mb-3 font-medium text-[var(--color-ink)]">
          <LinkedText text={task} />
        </p>
        <div className="overflow-hidden rounded-md ring-1 ring-[var(--color-border)]">
          <MultiFileEditor files={files} entry={entry} onChange={updateFile} />
        </div>
        <div className="my-3 flex gap-2">
          <button
            onClick={submit}
            disabled={status !== "ready"}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {statusLabel}
          </button>
          {result?.result && !passed && reveal === "none" && (
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

        {result && (
          <div
            className={`rounded-md p-3 text-sm ${
              passed ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
            }`}
          >
            {result.error ? (
              <p className="m-0">Your code raised an error before grading could run: {result.error}</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {checkKeys.map((key) => (
                  <li key={key}>
                    {result.result!.checks[key] ? "✓" : "✗"} {checkLabels[key]}
                  </li>
                ))}
              </ul>
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
            <div className="overflow-hidden rounded-md">
              <MultiFileEditor files={correctFiles.map((f) => ({ ...f, readOnly: true }))} entry={entry} />
            </div>
            <p className="mt-2 mb-0 text-sm text-[var(--color-ink)]">
              <LinkedText text={explanation} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
