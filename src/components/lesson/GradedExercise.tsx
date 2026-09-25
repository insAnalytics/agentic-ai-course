import { useEffect, useState } from "react";
import { loadPyodideOnce, runAgainstHiddenTests, runCapturingOutput, type PyodideInterface } from "../../lib/pyodide";
import CodeEditor from "./CodeEditor";
import LinkedText from "./LinkedText";

interface GradedExerciseProps {
  task: string;
  starterCode: string;
  /** Python snippets asserting against the learner's exec'd namespace. Never shown to the learner. */
  hiddenTests: string[];
  hint: string;
  correctAnswer: {
    code: string;
    explanation: string;
  };
  /**
   * Optional hidden code run silently on Pyodide's real filesystem before
   * grading, every submit — never shown to the learner. For a hidden test
   * that needs a real file to already exist (e.g. a CSV the learner's
   * function reads by path), since real file I/O touches Pyodide's actual
   * FS regardless of the in-memory namespace hiddenTests otherwise runs
   * in. Same idea as LiveDemo's `setupCode`.
   */
  setupCode?: string;
  /**
   * Optional self-check rubric, shown once the hidden tests pass. For
   * exercises whose real quality can't be graded by code (e.g. a prompt:
   * the hidden tests check its structure, and the rubric asks the learner
   * to judge what a regex can't). Checkboxes are local UI state only.
   */
  selfCheck?: string[];
}

type Reveal = "none" | "hint" | "answer";

export default function GradedExercise({
  task,
  starterCode,
  hiddenTests,
  hint,
  correctAnswer,
  setupCode,
  selfCheck,
}: GradedExerciseProps) {
  const [code, setCode] = useState(starterCode);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "grading">("loading");
  const [results, setResults] = useState<{ error: string | null; results: boolean[] } | null>(null);
  const [reveal, setReveal] = useState<Reveal>("none");
  const [checked, setChecked] = useState<boolean[]>(() => (selfCheck ?? []).map(() => false));

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

  const passed = results && results.error === null && results.results.every(Boolean);
  const passCount = results?.results.filter(Boolean).length ?? 0;

  const submit = async () => {
    if (!pyodide) return;
    setStatus("grading");
    if (setupCode) await runCapturingOutput(pyodide, setupCode);
    const outcome = await runAgainstHiddenTests(pyodide, code, hiddenTests);
    setResults(outcome);
    setStatus("ready");
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-white uppercase">Exercise · Graded</span>
        {results && (
          <span className="text-xs font-medium text-white/80">
            {passed ? "Passed" : `${passCount}/${results.results.length} passed`}
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
            {status === "loading" ? "Loading Python…" : status === "grading" ? "Grading…" : "Submit"}
          </button>
          {results && !passed && reveal === "none" && (
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

        {results && (
          <div
            className={`rounded-md p-3 text-sm ${
              passed
                ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
            }`}
          >
            {results.error ? (
              <>Your code raised an error before any tests ran: {results.error}</>
            ) : passed ? (
              selfCheck ? (
                <>All {results.results.length} structure checks passed. Now check the parts code can't grade:</>
              ) : (
                <>All {results.results.length} tests passed.</>
              )
            ) : (
              <>
                {passCount}/{results.results.length} tests passed. Try again, or ask for a hint.
              </>
            )}
          </div>
        )}

        {passed && selfCheck && (
          <div className="mt-3 rounded-md bg-[var(--color-bg-subtle)] p-3 text-sm text-[var(--color-ink)]">
            <p className="mt-0 mb-2 font-medium">Self-check</p>
            <ul className="m-0 list-none space-y-1.5 p-0">
              {selfCheck.map((item, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked[i] ?? false}
                      onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                    />
                    <span>
                      <LinkedText text={item} />
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {checked.length > 0 && checked.every(Boolean) ? (
              <p className="mt-2 mb-0">Done. Compare with the sample answer if you'd like a second opinion.</p>
            ) : (
              <p className="mt-2 mb-0">If any item doesn't hold, revise your prompt and submit again.</p>
            )}
            {reveal !== "answer" && (
              <button
                onClick={() => setReveal("answer")}
                className="mt-2 rounded-md bg-[var(--color-bg)] px-3 py-1 text-sm font-medium text-[var(--color-ink)] ring-1 ring-[var(--color-border)]"
              >
                Show sample answer
              </button>
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
