import { useState } from "react";

const COMPLEXITY = [
  { key: "simple", label: "Simple", hint: "Lookups, classification, format changes" },
  { key: "moderate", label: "Moderate", hint: "Drafting, summarizing, tool use with clear steps" },
  { key: "hard", label: "Hard, multi-step", hint: "Math, code, planning that rewards working through steps" },
] as const;

const CONTROL = [
  { key: "low", label: "Low", hint: "Fine sending data to a provider" },
  { key: "some", label: "Some", hint: "Provider terms must fit your data policy" },
  { key: "strict", label: "Strict", hint: "Data can't leave your infrastructure" },
] as const;

type ComplexityKey = (typeof COMPLEXITY)[number]["key"];
type ControlKey = (typeof CONTROL)[number]["key"];

interface Recommendation {
  short: string;
  hosting: string;
  size: string;
  mode: string;
  why: string;
}

const HOSTED_SIZE: Record<ComplexityKey, string> = {
  simple: "Small tier — the smallest, cheapest tier that reliably handles the task",
  moderate: "Larger tier — this is where a small tier starts to fall short",
  hard: "Start with a small tier; step up only if it can't do the job",
};

const SELF_HOSTED_SIZE: Record<ComplexityKey, string> = {
  simple: "Small open-weight model — quantized (INT8 or INT4) so it fits modest hardware",
  moderate: "Larger open-weight model — quantize as far as quality on your task allows",
  hard: "Start with a small open-weight model; step up only if it can't do the job",
};

const MODE: Record<ComplexityKey, string> = {
  simple: "Standard — extra reasoning tokens would mostly be wasted cost and latency",
  moderate: "Standard — reserve reasoning for when this genuinely falls short",
  hard: "Reasoning — multi-step problems are where extra thinking tokens pay off",
};

const SHORT_SIZE: Record<ComplexityKey, string> = {
  simple: "Small standard",
  moderate: "Large standard",
  hard: "Small reasoning",
};

function recommend(complexity: ComplexityKey, control: ControlKey): Recommendation {
  const selfHost = control === "strict";
  const shortBase = SHORT_SIZE[complexity];
  const short = selfHost ? `${shortBase}, self-hosted open-weight` : `${shortBase}, via API`;

  let hosting: string;
  let why: string;
  if (control === "low") {
    hosting = "Closed model through a provider's API — nothing to run yourself, fastest to get started";
    why = "With no real privacy constraint, the operational burden of self-hosting buys you very little.";
  } else if (control === "some") {
    hosting =
      "Closed API under terms that fit your data policy — or an open-weight model if they don't";
    why =
      "This is the genuine gray zone: check what the provider does with your data first, and fall back to self-hosting only if you have to.";
  } else {
    hosting = "Self-hosted open-weight model — your data never leaves your own infrastructure";
    why =
      "Control and privacy are the whole point here, so you accept the operational burden, including the quantization decisions from the previous concept.";
  }

  return {
    short,
    hosting,
    size: selfHost ? SELF_HOSTED_SIZE[complexity] : HOSTED_SIZE[complexity],
    mode: MODE[complexity],
    why,
  };
}

export default function ModelSelectionGrid() {
  const [sel, setSel] = useState<{ c: ComplexityKey; p: ControlKey } | null>(null);
  const rec = sel ? recommend(sel.c, sel.p) : null;

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — place your own scenario on the grid
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className="text-xs text-[var(--color-ink-soft)]">
          Rows: how complex the task is. Columns: how much control and privacy you need. Click the cell that best
          matches a real scenario of yours.
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid min-w-[30rem] gap-1.5"
            style={{ gridTemplateColumns: "minmax(6.5rem, 0.8fr) repeat(3, 1fr)" }}
          >
            <div />
            {CONTROL.map((col) => (
              <div key={col.key} className="px-1 text-center">
                <div className="text-xs font-semibold text-[var(--color-ink)]">{col.label} control needs</div>
                <div className="text-[0.65rem] text-[var(--color-ink-soft)]">{col.hint}</div>
              </div>
            ))}

            {COMPLEXITY.map((row) => (
              <div key={row.key} className="contents">
                <div className="flex flex-col justify-center pr-1">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">{row.label}</div>
                  <div className="text-[0.65rem] text-[var(--color-ink-soft)]">{row.hint}</div>
                </div>
                {CONTROL.map((col) => {
                  const active = sel?.c === row.key && sel?.p === col.key;
                  return (
                    <button
                      key={col.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSel({ c: row.key, p: col.key })}
                      className="rounded-md p-2 text-left text-xs font-medium ring-1 transition-colors"
                      style={{
                        background: active ? "var(--color-accent-light)" : "var(--color-bg)",
                        color: active ? "var(--color-accent-dark)" : "var(--color-ink)",
                        // ring color via box-shadow so the active border reads in both themes
                        boxShadow: `inset 0 0 0 ${active ? 2 : 1}px ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                      }}
                    >
                      {recommend(row.key, col.key).short}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {rec ? (
          <div
            className="rounded-md border p-3"
            style={{ borderColor: "var(--color-accent)", background: "var(--color-accent-light)" }}
          >
            <div className="text-[0.65rem] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Rough recommendation
            </div>
            <div className="text-base font-semibold" style={{ color: "var(--color-accent-dark)" }}>
              {rec.short}
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-ink)]">
              <li>
                <span className="font-semibold">Hosting:</span> {rec.hosting}
              </li>
              <li>
                <span className="font-semibold">Size tier:</span> {rec.size}
              </li>
              <li>
                <span className="font-semibold">Standard vs. reasoning:</span> {rec.mode}
              </li>
            </ul>
            <div className="mt-2 text-sm text-[var(--color-ink-soft)]">{rec.why}</div>
          </div>
        ) : (
          <div className="text-sm text-[var(--color-ink-soft)]">No cell selected yet.</div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        A rough starting point, not a rule: real choices also weigh cost at your volume, latency, and how a specific
        model actually performs on your task.
      </div>
    </div>
  );
}
