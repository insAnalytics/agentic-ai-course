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
const MAX_K = PROMPTS[0].candidates.length; // 8 -- every prompt has the same top-8 shape

type Mode = "greedy" | "sampling";

/**
 * Reshapes the shown top-8 real probabilities by temperature. Only the
 * post-softmax probabilities are stored (not raw logits), but
 * log(p_i) recovers logit_i up to an additive constant shared by every
 * candidate in the same distribution -- and that shared constant cancels
 * out of softmax(logit/T) entirely, so this reshaping is mathematically
 * exact for these 8 candidates. What it can't show: a real model would
 * also pull in tokens outside this top-8 as temperature rises (the
 * lesson's own "even very implausible tokens start getting real
 * consideration" point) -- this reshapes the shape of the effect among
 * the same fixed 8 real candidates, not the complete real picture.
 *
 * Always renormalizes to sum to 1 across the shown 8, including at
 * temperature === 1 -- deliberately, even though that makes this
 * component's own T=1 baseline read differently from Concept 1's raw,
 * unrenormalized percentages for the same prompts (captioned below).
 * Renormalizing only for T != 1 was tried first and produces a visible
 * jump in the top candidate's percentage at the exact moment the slider
 * leaves 1 -- confirmed live, and it reads backwards (the number visibly
 * rising as temperature increases toward "flatter"), which contradicts
 * the concept being taught. A single consistent baseline avoids that.
 */
function reshapeByTemperature(candidates: Candidate[], temperature: number): number[] {
  const logits = candidates.map((c) => Math.log(c.probability));
  const maxLogit = Math.max(...logits);
  const expValues = logits.map((l) => Math.exp((l - maxLogit) / temperature));
  const total = expValues.reduce((sum, v) => sum + v, 0);
  return expValues.map((v) => v / total);
}

/**
 * probs is already rank-sorted (highest first), matching the generation
 * script's own ordering. Walks the ranking and marks a candidate as
 * surviving until EITHER the top-k count or the top-p cumulative
 * threshold is hit, whichever comes first -- top-k truncates to a fixed
 * count, top-p then further truncates within that count by cumulative
 * probability, exactly as the two toy filters above do individually.
 */
function applyTopKTopP(probs: number[], topK: number, topP: number): boolean[] {
  const survives = new Array(probs.length).fill(false);
  const k = Math.min(topK, probs.length);
  let cumulative = 0;
  for (let i = 0; i < k; i++) {
    survives[i] = true;
    cumulative += probs[i];
    if (cumulative >= topP) break;
  }
  return survives;
}

/** Weighted random draw over a set of (already reshaped/filtered, if applicable) probabilities. Entries with probability 0 (filtered out) never get picked. */
function sampleOne(probabilities: number[]): number {
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  let r = Math.random() * total;
  for (let i = 0; i < probabilities.length; i++) {
    r -= probabilities[i];
    if (r <= 0) return i;
  }
  return probabilities.length - 1;
}

interface DecodingPlaygroundProps {
  /** Show the temperature slider — off by default so Concept 1's embed (before temperature is taught) doesn't show a control nothing has explained yet. */
  showTemperature?: boolean;
  /** Show the top-k/top-p sliders — same reasoning, off until Concept 3. */
  showTopKTopP?: boolean;
}

export default function DecodingPlayground({
  showTemperature = false,
  showTopKTopP = false,
}: DecodingPlaygroundProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("greedy");
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(MAX_K);
  const [topP, setTopP] = useState(1);
  const [sampledIndex, setSampledIndex] = useState<number | null>(null);

  const current = PROMPTS[promptIndex];
  const reshaped = reshapeByTemperature(current.candidates, temperature);
  const survives = applyTopKTopP(reshaped, topK, topP);
  const survivingTotal = reshaped.reduce((sum, p, i) => sum + (survives[i] ? p : 0), 0);
  // renormalized among survivors for display/sampling; 0 for anything filtered out
  const shownProbs = reshaped.map((p, i) => (survives[i] ? p / survivingTotal : 0));
  const maxProb = Math.max(...shownProbs);
  const greedyIndex = 0; // rank 0 always survives (topK >= 1, topP always includes at least one candidate)

  const chosenIndex = mode === "greedy" ? greedyIndex : sampledIndex;

  const redraw = (probs: number[]) => setSampledIndex(sampleOne(probs));

  const recompute = (t: number, k: number, p: number) => {
    const r = reshapeByTemperature(current.candidates, t);
    const s = applyTopKTopP(r, k, p);
    const total = r.reduce((sum, prob, i) => sum + (s[i] ? prob : 0), 0);
    return r.map((prob, i) => (s[i] ? prob / total : 0));
  };

  const selectPrompt = (i: number) => {
    setPromptIndex(i);
    setSampledIndex(null);
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    if (m === "sampling") redraw(recompute(temperature, topK, topP));
  };

  const changeTemperature = (t: number) => {
    setTemperature(t);
    if (mode === "sampling") redraw(recompute(t, topK, topP));
  };

  const changeTopK = (k: number) => {
    setTopK(k);
    if (mode === "sampling") redraw(recompute(temperature, k, topP));
  };

  const changeTopP = (p: number) => {
    setTopP(p);
    if (mode === "sampling") redraw(recompute(temperature, topK, p));
  };

  const drawAgain = () => redraw(shownProbs);

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

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
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
            className="rounded-md bg-[var(--color-green)] px-3 py-1 text-xs font-semibold text-white"
          >
            Sample again
          </button>
        )}
      </div>

      {(showTemperature || showTopKTopP) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          {showTemperature && (
            <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
              Temperature
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => changeTemperature(Number(e.target.value))}
                className="w-28"
              />
              <span className="w-8 font-mono font-semibold text-[var(--color-ink)]">{temperature.toFixed(1)}</span>
            </label>
          )}
          {showTopKTopP && (
            <>
              <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                Top-k
                <input
                  type="range"
                  min={1}
                  max={MAX_K}
                  step={1}
                  value={topK}
                  onChange={(e) => changeTopK(Number(e.target.value))}
                  className="w-28"
                />
                <span className="w-8 font-mono font-semibold text-[var(--color-ink)]">{topK}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                Top-p
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={topP}
                  onChange={(e) => changeTopP(Number(e.target.value))}
                  className="w-28"
                />
                <span className="w-10 font-mono font-semibold text-[var(--color-ink)]">{topP.toFixed(2)}</span>
              </label>
            </>
          )}
        </div>
      )}

      <div className="bg-[var(--color-bg-subtle)] p-4">
        <p className="m-0 mb-3 font-mono text-sm text-[var(--color-ink)]">
          {current.prompt} <span className="text-[var(--color-ink-soft)]">___</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {current.candidates.map((c, i) => {
            const discarded = !survives[i];
            // discarded candidates show their pre-filter (temperature-reshaped
            // but not renormalized) probability, dimmed -- "this is what it
            // would have had" rather than just vanishing from the list
            const prob = discarded ? reshaped[i] : shownProbs[i];
            const widthPct = ((prob / maxProb) * 100).toFixed(2);
            const isChosen = !discarded && i === chosenIndex;
            return (
              <div key={i} className="flex items-center gap-2" style={{ opacity: discarded ? 0.4 : 1 }}>
                <span
                  className="w-24 shrink-0 truncate text-right font-mono text-xs"
                  style={{
                    color: isChosen ? "var(--color-green-dark)" : "var(--color-ink)",
                    fontWeight: isChosen ? 700 : 400,
                    textDecoration: discarded ? "line-through" : "none",
                  }}
                >
                  {JSON.stringify(c.token)}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-[var(--color-bg-alt)]">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${widthPct}%`,
                      background: isChosen
                        ? "var(--color-green)"
                        : discarded
                          ? "var(--color-ink-soft)"
                          : "var(--color-token-1)",
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 font-mono text-xs text-[var(--color-ink-soft)]">
                  {discarded ? "out" : `${(prob * 100).toFixed(1)}%`}
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
        {(showTemperature || showTopKTopP) && (
          <>
            Percentages are renormalized across whichever of these 8 real candidates survive
            {showTopKTopP ? " top-k/top-p" : ""}
            {showTemperature ? (showTopKTopP ? ", at every temperature" : ", reshaped by temperature") : ""} — a
            real model would also draw from tokens outside this list, and this page's percentages will read a bit
            higher than Concept 1's original, un-renormalized ones for the same prompt.{" "}
          </>
        )}
        {mode === "greedy"
          ? `Greedy always picks the single highest-probability candidate — deterministic${
              showTemperature || showTopKTopP ? ", and unaffected by any of these controls, which only reshape or restrict the pool sampling draws from." : "."
            }`
          : 'Sampling draws a token weighted by the probabilities shown — click "Sample again" and watch the choice actually vary.'}
      </div>
    </div>
  );
}
