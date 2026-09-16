import { useMemo, useState } from "react";
import { tokenizePieces } from "../../lib/tokenize";
import TokenPieces from "./TokenPieces";

const DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog, including FastAPI and Pydantic.";

interface TokenizerVisualizerProps {
  /** Starting text shown in the box — editable, re-tokenized live on every keystroke. */
  initialText?: string;
}

export default function TokenizerVisualizer({ initialText = DEFAULT_TEXT }: TokenizerVisualizerProps) {
  const [text, setText] = useState(initialText);

  const pieces = useMemo(() => tokenizePieces(text), [text]);

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — tokenize your own text
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        spellCheck={false}
        className="w-full resize-none border-0 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-sm text-[var(--color-ink)] outline-none"
      />

      <div className="flex flex-wrap items-start gap-y-1 bg-[var(--color-bg-subtle)] p-3 font-mono text-sm leading-relaxed">
        <TokenPieces pieces={pieces} />
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        {pieces.length} token{pieces.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
