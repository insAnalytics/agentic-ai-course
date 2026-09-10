import { useState } from "react";

export interface TerminalStep {
  /** A shell command shown after a `$` prompt. */
  command?: string;
  /** Output text shown as-is (no prompt). */
  output?: string;
  /** Pause before revealing this step, in ms. Defaults to 400 for a command, 150 per output line. */
  delayMs?: number;
}

interface TerminalProps {
  /** e.g. "Your machine" / "A teammate's machine" — identifies which pane this is. */
  label: string;
  steps: TerminalStep[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A single scripted terminal pane: clicking Run reveals `steps` one at a time,
 * command-then-output, at a readable pace — a stand-in for real streamed
 * command output until the E2B-backed version replaces the script with an
 * actual sandbox. Deliberately the same interaction shape (click to run, see
 * output appear) so swapping the implementation later doesn't change how a
 * lesson reads or how a learner uses it.
 */
export default function Terminal({ label, steps }: TerminalProps) {
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setRevealed(0);
    for (let i = 0; i < steps.length; i++) {
      await sleep(steps[i].delayMs ?? (steps[i].command !== undefined ? 500 : 150));
      setRevealed(i + 1);
    }
    setRunning(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-sandbox-light)] px-3 py-1.5">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-sandbox-dark)] uppercase">{label}</span>
        <button
          onClick={run}
          disabled={running}
          className="rounded-md bg-[var(--color-sandbox)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {running ? "Running…" : revealed > 0 ? "Run again" : "Run"}
        </button>
      </div>
      <pre className="m-0 min-h-[3rem] overflow-x-auto bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap text-gray-100">
        {steps.slice(0, revealed).map((step, i) =>
          step.command !== undefined ? (
            <div key={i}>
              <span className="text-emerald-400">$</span> {step.command}
            </div>
          ) : (
            <div key={i} className="text-gray-300">
              {step.output}
            </div>
          ),
        )}
        {revealed === 0 && <span className="text-gray-500">click Run to see this pane's output</span>}
      </pre>
    </div>
  );
}
