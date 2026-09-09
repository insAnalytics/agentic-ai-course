import { useEffect, useId, useState } from "react";
import { loadPyodideOnce, runMultiFileCapturingOutput, type PyodideInterface, type SandboxFile } from "../../lib/pyodide";
import MultiFileEditor from "./MultiFileEditor";

interface MultiFileLiveDemoProps {
  /** Starting files — editable unless a file sets `readOnly`, not graded. */
  files: SandboxFile[];
  /** Name of the file that gets executed when Run is clicked. */
  entry: string;
}

export default function MultiFileLiveDemo({ files: initialFiles, entry }: MultiFileLiveDemoProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [files, setFiles] = useState(initialFiles);
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "running">("loading");
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);

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

  const run = async () => {
    if (!pyodide) return;
    setStatus("running");
    const { output, error } = await runMultiFileCapturingOutput(pyodide, files, entry, instanceId);
    setOutput(error ? output + error : output);
    setStatus("ready");
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — edit and run
        </span>
        <button
          onClick={run}
          disabled={status !== "ready"}
          className="rounded-md bg-[var(--color-green)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {status === "loading" ? "Loading Python…" : status === "running" ? "Running…" : "Run"}
        </button>
      </div>
      <MultiFileEditor files={files} entry={entry} onChange={updateFile} />
      {output !== null && (
        <pre className="m-0 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 font-mono text-sm whitespace-pre-wrap text-[var(--color-ink)]">
          {output || "(no output)"}
        </pre>
      )}
    </div>
  );
}
