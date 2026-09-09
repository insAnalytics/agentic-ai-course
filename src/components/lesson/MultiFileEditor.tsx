import { useState } from "react";
import CodeEditor from "./CodeEditor";
import type { SandboxFile } from "../../lib/pyodide";

export type { SandboxFile };

interface MultiFileEditorProps {
  files: SandboxFile[];
  entry: string;
  onChange?: (name: string, code: string) => void;
}

export default function MultiFileEditor({ files, entry, onChange }: MultiFileEditorProps) {
  const [activeName, setActiveName] = useState(files[0]?.name ?? "");
  const active = files.find((f) => f.name === activeName) ?? files[0];

  return (
    <div>
      <div className="flex gap-1 bg-[#1e1e1e] px-2 pt-2">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setActiveName(file.name)}
            className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 font-mono text-xs ${
              file.name === active?.name
                ? "bg-[#2a2d2e] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {file.name}
            {file.name === entry && (
              <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                entry
              </span>
            )}
          </button>
        ))}
      </div>
      {active && (
        <CodeEditor
          key={active.name}
          value={active.code}
          onChange={onChange ? (value) => onChange(active.name, value) : undefined}
          readOnly={active.readOnly}
        />
      )}
    </div>
  );
}
