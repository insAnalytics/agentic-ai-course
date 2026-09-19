import { useState } from "react";

const PROMPT = ["The", "cat", "sat"];
const GENERATED = ["on", "the", "mat"];

// Step 0 processes the whole prompt (cache starts empty); step N appends
// the Nth generated token. Same toy sequence as the lesson's code demo.
const STEP_COUNT = GENERATED.length;

export default function KVCacheDiagram() {
  const [step, setStep] = useState(0);

  const sequence = [...PROMPT, ...GENERATED.slice(0, step)];
  const freshStart = step === 0 ? 0 : sequence.length - 1;
  const freshCount = sequence.length - freshStart;
  const reusedCount = freshStart;

  let withCacheTotal = 0;
  let withoutCacheTotal = 0;
  for (let s = 0; s <= step; s++) {
    const len = PROMPT.length + s;
    withCacheTotal += s === 0 ? len : 1;
    withoutCacheTotal += len;
  }

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — a KV cache, step by step
        </span>
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-4">
        <div className="mb-3 text-xs text-[var(--color-ink-soft)]">
          {step === 0
            ? "Step 0 — the prompt is processed. The cache starts empty, so every token's Key/Value is computed fresh."
            : `Step ${step} — "${GENERATED[step - 1]}" is appended. Only its Key/Value is computed; the rest come straight from the cache.`}
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-sm">
          {sequence.map((token, i) => {
            const fresh = i >= freshStart;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className="rounded border px-2 py-1"
                  style={{
                    background: fresh ? "var(--color-green)" : "var(--color-bg-alt)",
                    color: fresh ? "white" : "var(--color-ink-soft)",
                    borderColor: fresh ? "var(--color-green)" : "var(--color-border)",
                    opacity: fresh ? 1 : 0.6,
                  }}
                >
                  {token}
                </span>
                <span
                  className="text-[0.65rem] tracking-wide uppercase"
                  style={{ color: fresh ? "var(--color-green-dark)" : "var(--color-ink-soft)" }}
                >
                  {fresh ? "computed" : "reused"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md bg-[var(--color-bg)] p-2">
            <div className="font-mono text-base font-semibold text-[var(--color-green-dark)]">{freshCount}</div>
            computed this step
          </div>
          <div className="rounded-md bg-[var(--color-bg)] p-2">
            <div className="font-mono text-base font-semibold text-[var(--color-ink)]">{reusedCount}</div>
            reused from cache
          </div>
          <div className="rounded-md bg-[var(--color-bg)] p-2">
            <div className="font-mono text-base font-semibold text-[var(--color-ink)]">{sequence.length}</div>
            cache size
          </div>
        </div>

        <div className="mt-3 text-xs text-[var(--color-ink-soft)]">
          Running total of Key/Value computations so far: <strong>{withCacheTotal}</strong> with a cache, versus{" "}
          <strong>{withoutCacheTotal}</strong> if every step recomputed the whole sequence from scratch.
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        A toy sequence for illustration — real models cache Key/Value vectors per layer and attention head, but the
        shape is the same: one new entry per token, everything else reused.
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md bg-[var(--color-bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-40"
        >
          ← Step back
        </button>
        <button
          onClick={() => setStep(0)}
          disabled={step === 0}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] disabled:opacity-40"
        >
          Reset
        </button>
        <button
          onClick={() => setStep((s) => Math.min(STEP_COUNT, s + 1))}
          disabled={step === STEP_COUNT}
          className="rounded-md bg-[var(--color-green)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          Generate next token →
        </button>
      </div>
    </div>
  );
}
