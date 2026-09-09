import { useEffect, useId, useState } from "react";
import {
  loadPyodideOnce,
  runMultiFileAgainstHiddenTests,
  type PyodideInterface,
  type SandboxFile,
} from "../../lib/pyodide";
import MultiFileEditor from "./MultiFileEditor";
import LinkedText from "./LinkedText";

interface MultiFileGradedExerciseProps {
  task: string;
  files: SandboxFile[];
  /** Name of the file that gets executed (and graded output shown) on Submit. */
  entry: string;
  /** One script, run after the entry file, in a fresh namespace — asserts against the learner's files via real imports. */
  hiddenTests: string;
  hint: string;
  correctFiles: SandboxFile[];
  explanation: string;
}

type Reveal = "none" | "hint" | "answer";

export default function MultiFileGradedExercise({
  task,
  files: initialFiles,
  entry,
  hiddenTests,
  hint,
  correctFiles,
  explanation,
}: MultiFileGradedExerciseProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [files, setFiles] = useState(initialFiles);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "grading">("loading");
  const [outcome, setOutcome] = useState<{
    entryOutput: string;
    entryError: string | null;
    error: string | null;
    results: boolean[];
  } | null>(null);
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

  const passed = outcome && outcome.error === null && outcome.results.every(Boolean);
  const passCount = outcome?.results.filter(Boolean).length ?? 0;

  const submit = async () => {
    if (!pyodide) return;
    setStatus("grading");
    const result = await runMultiFileAgainstHiddenTests(pyodide, files, entry, hiddenTests, instanceId);
    setOutcome(result);
    setStatus("ready");
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Exercise · Graded</span>
        {outcome && (
          <span className="text-xs font-medium text-white/80">
            {passed ? "Passed" : `${passCount}/${outcome.results.length} passed`}
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

        {outcome && outcome.entryOutput.trim() && (
          <pre className="mt-3 mb-0 rounded-md bg-[var(--color-bg-subtle)] p-3 font-mono text-sm whitespace-pre-wrap text-[var(--color-ink)]">
            {outcome.entryOutput}
          </pre>
        )}
        {outcome && outcome.entryError && (
          <pre className="mt-3 mb-0 rounded-md bg-[var(--color-danger-bg)] p-3 font-mono text-sm whitespace-pre-wrap text-[var(--color-danger)]">
            {outcome.entryError}
          </pre>
        )}

        <div className="my-3 flex gap-2">
          <button
            onClick={submit}
            disabled={status !== "ready"}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === "loading" ? "Loading Python…" : status === "grading" ? "Grading…" : "Submit"}
          </button>
          {outcome && !passed && reveal === "none" && (
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

        {outcome && (
          <div
            className={`rounded-md p-3 text-sm ${
              passed
                ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
            }`}
          >
            {outcome.error ? (
              <>Your code didn't pass the hidden tests: {outcome.error}</>
            ) : passed ? (
              <>All {outcome.results.length} tests passed.</>
            ) : (
              <>
                {passCount}/{outcome.results.length} tests passed. Try again, or ask for a hint.
              </>
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
