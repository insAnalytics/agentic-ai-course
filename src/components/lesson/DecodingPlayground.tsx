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
// the original six real prompts from Lesson 1.4 Concept 1 -- reusing the
// same real GPT-2 data rather than a fresh bank, since this tool needs the
// exact same "real next-token distribution" this lesson already established
const PROMPT_INDICES = [0, 1, 2, 3, 4, 5];
const PROMPTS = PROMPT_INDICES.map((i) => ALL_PROMPTS[i]);

type Mode = "greedy" | "sampling";

/** Weighted random draw over the shown top-8 candidates, renormalized to sum to 1 -- an honest simplification, since only the top 8 of the real ~50,000-token distribution are stored at all. */
function sampleOne(candidates: Candidate[]): number {
  const total = candidates.reduce((sum, c) => sum + c.probability, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= candidates[i].probability;
    if (r <= 0) return i;
  }
  return candidates.length - 1;
}

export default function DecodingPlayground() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("greedy");
  const [sampledIndex, setSampledIndex] = useState<number | null>(null);

  const current = PROMPTS[promptIndex];
  const maxProb = Math.max(...current.candidates.map((c) => c.probability));
  const greedyIndex = 0; // candidates are already sorted highest-first by the generation script

  const chosenIndex = mode === "greedy" ? greedyIndex : sampledIndex;

  const selectPrompt = (i: number) => {
    setPromptIndex(i);
    setSampledIndex(null);
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    if (m === "sampling") setSampledIndex(sampleOne(current.candidates));
  };

  const drawAgain = () => {
    setSampledIndex(sampleOne(current.candidates));
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — the decoding playground
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        {PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => selectPrompt(i)}
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

      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
        {(["greedy", "sampling"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => selectMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${
              mode === m
                ? "bg-[var(--color-quiz)] text-white"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-alt)]"
            }`}
          >
            {m}
          </button>
        ))}
        {mode === "sampling" && (
          <button
            onClick={drawAgain}
            className="ml-auto rounded-md bg-[var(--color-green)] px-3 py-1 text-xs font-semibold text-white"
          >
            Sample again
          </button>
        )}
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-4">
        <p className="m-0 mb-3 font-mono text-sm text-[var(--color-ink)]">
          {current.prompt} <span className="text-[var(--color-ink-soft)]">___</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {current.candidates.map((c, i) => {
            const widthPct = (c.probability / maxProb) * 100;
            const isChosen = i === chosenIndex;
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-24 shrink-0 truncate text-right font-mono text-xs"
                  style={{
                    color: isChosen ? "var(--color-green-dark)" : "var(--color-ink)",
                    fontWeight: isChosen ? 700 : 400,
                  }}
                >
                  {JSON.stringify(c.token)}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-[var(--color-bg-alt)]">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${widthPct}%`,
                      background: isChosen ? "var(--color-green)" : "var(--color-token-1)",
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 font-mono text-xs text-[var(--color-ink-soft)]">
                  {(c.probability * 100).toFixed(1)}%
                </span>
                {isChosen && (
                  <span className="shrink-0 rounded-full bg-[var(--color-green)] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                    CHOSEN
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        {mode === "greedy"
          ? "Greedy always picks the single highest-probability candidate — deterministic, never changes for this prompt."
          : "Sampling draws a token weighted by these real probabilities (renormalized across the top 8 shown) — click \"Sample again\" and watch the choice actually vary."}
      </div>
    </div>
  );
}
