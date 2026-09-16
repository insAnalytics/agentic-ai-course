import { useMemo, useState } from "react";
import { decode, encode } from "gpt-tokenizer";

const DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog, including FastAPI and Pydantic.";

const TOKEN_COLOR_COUNT = 6;

interface TokenizerVisualizerProps {
  /** Starting text shown in the box — editable, re-tokenized live on every keystroke. */
  initialText?: string;
}

export default function TokenizerVisualizer({ initialText = DEFAULT_TEXT }: TokenizerVisualizerProps) {
  const [text, setText] = useState(initialText);

  const pieces = useMemo(() => {
    if (!text) return [];
    return encode(text)
      .map((id) => decode([id]))
      .filter((piece) => piece.length > 0);
  }, [text]);

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
        {pieces.length === 0 ? (
          <span className="text-[var(--color-ink-soft)]">(type something above)</span>
        ) : (
          pieces.map((piece, i) => {
            const hue = `var(--color-token-${(i % TOKEN_COLOR_COUNT) + 1})`;
            return (
              <span
                key={i}
                style={{
                  whiteSpace: "pre",
                  background: `color-mix(in srgb, ${hue} 18%, var(--color-bg-subtle))`,
                  borderBottom: `2px solid ${hue}`,
                }}
                className="rounded-t-sm px-0.5 text-[var(--color-ink)]"
              >
                {piece}
              </span>
            );
          })
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        {pieces.length} token{pieces.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
