import { useEffect, useState } from "react";
import { loadPyodideOnce, type PyodideInterface } from "../../lib/pyodide";
import {
  ensureFastAPIReady,
  ensurePytestReady,
  gradePytestParametrizeExercise,
  type PytestGradeResult,
  type RequiredParametrizeCase,
} from "../../lib/fastapiPyodide";
import CodeEditor from "./CodeEditor";
import LinkedText from "./LinkedText";

interface PytestGradedExerciseProps {
  task: string;
  starterCode: string;
  /** Name of the `@pytest.mark.parametrize`-decorated async test function the learner must define. */
  entryTestName: string;
  /** Hidden setup code (never shown) defining, at minimum, `app` and `client` for the learner's test to use. */
  setupCode: string;
  requiredCases: RequiredParametrizeCase[];
  hint: string;
  correctAnswer: {
    code: string;
    explanation: string;
  };
}

type Reveal = "none" | "hint" | "answer";
type Status = "loading" | "preparing" | "ready" | "grading";

export default function PytestGradedExercise({
  task,
  starterCode,
  entryTestName,
  setupCode,
  requiredCases,
  hint,
  correctAnswer,
}: PytestGradedExerciseProps) {
  const [code, setCode] = useState(starterCode);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<PytestGradeResult | null>(null);
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

  const passed = result?.result?.passed ?? false;
  const checkKeys = result?.result ? Object.keys(result.result.checks) : [];
  const passCount = result?.result ? checkKeys.filter((k) => result.result!.checks[k]).length : 0;

  const submit = async () => {
    if (!pyodide) return;
    setStatus("preparing");
    await Promise.all([ensureFastAPIReady(pyodide), ensurePytestReady(pyodide)]);
    setStatus("grading");
    const outcome = await gradePytestParametrizeExercise(pyodide, setupCode, code, entryTestName, requiredCases);
    setResult(outcome);
    setStatus("ready");
  };

  const statusLabel =
    status === "loading"
      ? "Loading Python…"
      : status === "preparing"
        ? "Preparing pytest + FastAPI (first time only)…"
        : status === "grading"
          ? "Grading…"
          : "Submit";

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Exercise · Graded (real pytest, in-browser)</span>
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
          <CodeEditor value={code} onChange={setCode} />
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
                    {result.result!.checks[key] ? "✓" : "✗"} {key}
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
              <CodeEditor value={correctAnswer.code} readOnly />
            </div>
            <p className="mt-2 mb-0 text-sm text-[var(--color-ink)]">
              <LinkedText text={correctAnswer.explanation} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
