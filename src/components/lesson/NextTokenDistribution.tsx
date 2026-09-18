import { useState } from "react";
import nextTokenDistributions from "../../data/next-token-distributions.json";

interface Candidate {
  token: string;
  probability: number;
}

interface PromptDistribution {
  prompt: string;
  candidates: Candidate[];
}

const ALL_PROMPTS = nextTokenDistributions as PromptDistribution[];

// the original six from Concept 1 -- pinned explicitly rather than "all of
// them" so this page's behavior doesn't silently change if more prompts get
// appended to the bank later (e.g. for a future page's own promptIndices)
const DEFAULT_PROMPT_INDICES = [0, 1, 2, 3, 4, 5];

interface NextTokenDistributionProps {
  /** Indices into the full prompt bank to show. Defaults to Concept 1's original six. */
  promptIndices?: number[];
}

export default function NextTokenDistribution({
  promptIndices = DEFAULT_PROMPT_INDICES,
}: NextTokenDistributionProps) {
  const PROMPTS = promptIndices.map((i) => ALL_PROMPTS[i]);
  const [promptIndex, setPromptIndex] = useState(0);
  const current = PROMPTS[promptIndex];
  const maxProb = Math.max(...current.candidates.map((c) => c.probability));

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — real next-token probabilities
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        {PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPromptIndex(i)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              i === promptIndex
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-alt)]"
            }`}
          >
            {p.prompt}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-4">
        <p className="m-0 mb-3 font-mono text-sm text-[var(--color-ink)]">
          {current.prompt} <span className="text-[var(--color-ink-soft)]">___</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {current.candidates.map((c, i) => {
            const widthPct = (c.probability / maxProb) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-right font-mono text-xs text-[var(--color-ink)]">
                  {JSON.stringify(c.token)}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-[var(--color-bg-alt)]">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${widthPct}%`,
                      background: "var(--color-token-1)",
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 font-mono text-xs text-[var(--color-ink-soft)]">
                  {(c.probability * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        Real logits from a real language model (GPT-2), softmaxed into probabilities — top 8 candidates for what
        actually comes next, not a hand-picked illustration.
      </div>
    </div>
  );
}
