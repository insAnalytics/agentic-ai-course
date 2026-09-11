import { useEffect, useRef, useState } from "react";
import {
  startTerminalSession,
  execTerminalCommand,
  gradeTerminalSession,
  endTerminalSession,
  type TerminalGradeResult,
} from "../../lib/dockerWorker";

interface HistoryEntry {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

type SessionState = "starting" | "ready" | "running" | "error";

const CHECK_LABELS: Record<keyof TerminalGradeResult["checks"], string> = {
  imageBuilt: "Built the image as my-app",
  ranDetachedWithPortAndEnv: "Ran it detached, with 8000:5000 mapped and LOG_LEVEL=debug set",
  confirmedRunning: "Confirmed it's running with docker ps",
  logsShowDebugMode: "Checked its startup output with docker logs",
  execReadRequirements: "Peeked inside it with docker exec",
  cleanedUp: "Stopped and removed it",
  nothingRunningNow: "Nothing left running at the end",
};

/**
 * A real interactive terminal for Lesson 0.8 Concept 4's practice exercise:
 * every command actually runs inside a persistent E2B sandbox with a real
 * Docker daemon (see worker/src/index.ts's /docker-terminal/* routes), not a
 * scripted playback. The sandboxId doubles as the session token — the
 * worker itself holds no state between requests.
 */
export default function DockerLiveTerminal() {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState>("starting");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<TerminalGradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sandboxIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTerminalSession()
      .then(({ sandboxId }) => {
        if (cancelled) return;
        sandboxIdRef.current = sandboxId;
        setSandboxId(sandboxId);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setState("error");
      });

    return () => {
      cancelled = true;
      if (sandboxIdRef.current) {
        endTerminalSession(sandboxIdRef.current).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history, state]);

  const runCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = input.trim();
    if (!command || !sandboxId || state === "running") return;
    setInput("");
    setState("running");
    setError(null);
    try {
      const result = await execTerminalCommand(sandboxId, command);
      setHistory((h) => [...h, { command, ...result }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setState("ready");
  };

  const submitForGrading = async () => {
    if (!sandboxId) return;
    setGrading(true);
    setError(null);
    try {
      setGradeResult(await gradeTerminalSession(sandboxId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setGrading(false);
  };

  const checkEntries = gradeResult ? (Object.keys(CHECK_LABELS) as (keyof TerminalGradeResult["checks"])[]) : [];

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-sandbox-light)] px-4 py-2">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-sandbox-dark)] uppercase">
          Real terminal · live Docker sandbox
        </span>
        {gradeResult && (
          <span className="text-xs font-medium text-[var(--color-sandbox-dark)]">{gradeResult.passed ? "Passed" : "Not yet"}</span>
        )}
      </div>

      <div ref={scrollRef} className="max-h-80 overflow-y-auto bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed text-gray-100">
        {state === "starting" && <div className="text-gray-500">Starting a real sandbox… this takes a few seconds.</div>}
        {history.length === 0 && state !== "starting" && (
          <div className="text-gray-500">Sandbox ready. Type a command below — try `docker build -t my-app .` to start.</div>
        )}
        {history.map((entry, i) => (
          <div key={i} className="mb-2">
            <div>
              <span className="text-emerald-400">$</span> {entry.command}
            </div>
            {entry.stdout && <div className="whitespace-pre-wrap text-gray-300">{entry.stdout}</div>}
            {entry.stderr && <div className="whitespace-pre-wrap text-amber-300">{entry.stderr}</div>}
            {entry.exitCode !== 0 && <div className="text-red-400">(exit code {entry.exitCode})</div>}
          </div>
        ))}
        {state === "running" && <div className="text-gray-500">running…</div>}
      </div>

      <form onSubmit={runCommand} className="flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
        <span className="font-mono text-sm text-emerald-400">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={state !== "ready"}
          placeholder={state === "starting" ? "waiting for sandbox…" : "docker build -t my-app ."}
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-sm text-gray-100 outline-none placeholder:text-gray-500 disabled:opacity-50"
        />
      </form>

      <div className="flex items-center gap-2 p-3">
        <button
          onClick={submitForGrading}
          disabled={state === "starting" || grading || history.length === 0}
          className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {grading ? "Grading…" : "Submit for grading"}
        </button>
        <span className="text-xs text-[var(--color-ink-soft)]">Session ends automatically after 5 minutes idle.</span>
      </div>

      {error && (
        <div className="mx-3 mb-3 rounded-md bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">
          Couldn't reach the sandbox: {error}
        </div>
      )}

      {gradeResult && (
        <div
          className={`mx-3 mb-3 rounded-md p-3 text-sm ${
            gradeResult.passed ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
          }`}
        >
          <ul className="m-0 list-none p-0">
            {checkEntries.map((key) => (
              <li key={key}>
                {gradeResult.checks[key] ? "✓" : "✗"} {CHECK_LABELS[key]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
