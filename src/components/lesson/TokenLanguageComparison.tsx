import { useMemo, useState } from "react";
import { tokenizePieces } from "../../lib/tokenize";
import TokenPieces from "./TokenPieces";

interface Row {
  id: number;
  label: string;
  text: string;
}

const DEFAULT_ROWS: Row[] = [
  { id: 1, label: "English", text: "How are you today?" },
  { id: 2, label: "Khmer", text: "តើថ្ងៃនេះអ្នកសុខសប្បាយជាទេ?" },
];

function TokenRow({
  row,
  onChange,
  onRemove,
  removable,
}: {
  row: Row;
  onChange: (next: Row) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const pieces = useMemo(() => tokenizePieces(row.text), [row.text]);

  return (
    <div className="border-t border-[var(--color-border)] first:border-t-0">
      <div className="flex items-center gap-2 bg-[var(--color-bg)] px-3 pt-2">
        <input
          value={row.label}
          onChange={(e) => onChange({ ...row, label: e.target.value })}
          placeholder="Language"
          className="w-28 shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-1 text-xs font-semibold text-[var(--color-ink)] outline-none"
        />
        <input
          value={row.text}
          onChange={(e) => onChange({ ...row, text: e.target.value })}
          spellCheck={false}
          className="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-sm text-[var(--color-ink)] outline-none"
        />
        {removable && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${row.label || "this language"}`}
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-subtle)]"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-y-1 bg-[var(--color-bg-subtle)] px-3 py-2 font-mono text-sm leading-relaxed">
        <TokenPieces pieces={pieces} emptyLabel="(type a sentence above)" />
      </div>
      <div className="px-3 pb-2 text-xs text-[var(--color-ink-soft)]">
        {pieces.length} token{pieces.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export default function TokenLanguageComparison() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const nextId = useMemo(() => Math.max(...rows.map((r) => r.id)) + 1, [rows]);

  const updateRow = (id: number, next: Row) => {
    setRows((rs) => rs.map((r) => (r.id === id ? next : r)));
  };

  const removeRow = (id: number) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((rs) => [...rs, { id: nextId, label: "", text: "" }]);
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — compare token counts across languages
        </span>
      </div>

      {rows.map((row) => (
        <TokenRow
          key={row.id}
          row={row}
          onChange={(next) => updateRow(row.id, next)}
          onRemove={() => removeRow(row.id)}
          removable={rows.length > 1}
        />
      ))}

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">
        <button
          onClick={addRow}
          className="rounded-md bg-[var(--color-green)] px-2.5 py-1 text-xs font-semibold text-white"
        >
          + Add a language
        </button>
      </div>
    </div>
  );
}
