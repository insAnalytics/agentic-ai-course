import { useState } from "react";

const TOKENS = ["The", "cat", "sat", "down"];
// six layers, matching the real depth of all-MiniLM-L6-v2, the small
// real model already used elsewhere in this course (Concepts 1 and 3
// of this lesson) -- a genuine, grounded number, not an arbitrary pick
const LAYER_COUNT = 6;

export default function TransformerStack() {
  const [step, setStep] = useState(0); // 0 = raw input, not yet through any layer

  const atStart = step === 0;
  const atEnd = step === LAYER_COUNT;

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — step through the stack
        </span>
      </div>

      <div className="flex flex-col-reverse items-center gap-2 bg-[var(--color-bg-subtle)] p-4">
        {/* rendered bottom-to-top visually via flex-col-reverse + array order below */}
        {Array.from({ length: LAYER_COUNT }, (_, i) => {
          const layerNumber = i + 1;
          const done = layerNumber <= step;
          const active = layerNumber === step;
          return (
            <div key={i} className="flex w-full max-w-sm flex-col items-center gap-2">
              <div
                className="flex w-full items-center justify-center rounded-md border px-3 py-2 text-center text-xs font-semibold transition-colors"
                style={{
                  background: active
                    ? "var(--color-accent)"
                    : done
                      ? "var(--color-accent-light)"
                      : "var(--color-bg)",
                  color: active ? "white" : done ? "var(--color-accent-dark)" : "var(--color-ink-soft)",
                  borderColor: done || active ? "var(--color-accent)" : "var(--color-border)",
                }}
              >
                Block {layerNumber}: multi-head attention + feedforward
              </div>
              <div className="flex gap-1.5 font-mono text-xs" style={{ opacity: done ? 1 : 0.35 }}>
                {TOKENS.map((t, ti) => (
                  <span
                    key={ti}
                    className="rounded px-1.5 py-0.5"
                    style={{
                      background: done ? "var(--color-green-light)" : "var(--color-bg-alt)",
                      color: done ? "var(--color-green-dark)" : "var(--color-ink-soft)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        }).reverse()}

        <div className="flex gap-1.5 font-mono text-xs">
          {TOKENS.map((t, ti) => (
            <span
              key={ti}
              className="rounded bg-[var(--color-bg-alt)] px-1.5 py-0.5 text-[var(--color-ink)]"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="text-[0.65rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
          Input tokens (raw embeddings + positional encoding)
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={atStart}
          className="rounded-md bg-[var(--color-bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-40"
        >
          ← Step back
        </button>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {atStart
            ? "Raw input — hasn't passed through any block yet"
            : atEnd
              ? `After all ${LAYER_COUNT} blocks — the model's final representation`
              : `After block ${step} of ${LAYER_COUNT}`}
        </span>
        <button
          onClick={() => setStep((s) => Math.min(LAYER_COUNT, s + 1))}
          disabled={atEnd}
          className="rounded-md bg-[var(--color-green)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          Step forward →
        </button>
      </div>
    </div>
  );
}
