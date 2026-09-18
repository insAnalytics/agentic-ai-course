import { useMemo, useState } from "react";
import attentionSentences from "../../data/attention-sentences.json";

interface SentenceAttention {
  sentence: string;
  tokens: string[];
  matrix: number[][];
}

const SENTENCES = attentionSentences as SentenceAttention[];

export default function AttentionExplorer() {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const current = SENTENCES[sentenceIndex];

  // default to the ambiguous word itself where possible, so the effect is visible on load
  const defaultTokenIndex = useMemo(() => {
    const idx = current.tokens.findIndex((t) => ["bank", "court", "pilot"].includes(t));
    return idx >= 0 ? idx : 0;
  }, [current]);

  const [selected, setSelected] = useState(defaultTokenIndex);

  const selectSentence = (i: number) => {
    setSentenceIndex(i);
    const next = SENTENCES[i].tokens.findIndex((t) => ["bank", "court", "pilot"].includes(t));
    setSelected(next >= 0 ? next : 0);
  };

  const weights = current.matrix[selected];

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — click a token to see what it attends to
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        {SENTENCES.map((s, i) => (
          <button
            key={i}
            onClick={() => selectSentence(i)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              i === sentenceIndex
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-alt)]"
            }`}
          >
            {i + 1}. {s.sentence}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-x-1.5 gap-y-3 bg-[var(--color-bg-subtle)] p-4 font-mono text-base leading-relaxed">
        {current.tokens.map((token, i) => {
          const isSelected = i === selected;
          const weight = weights[i];
          const strength = isSelected ? 0 : Math.round(weight * 100 * 3.2 + 8);
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="flex flex-col items-center gap-0.5 rounded px-1.5 py-1"
              style={{
                background: isSelected
                  ? "var(--color-accent)"
                  : `color-mix(in srgb, var(--color-token-1) ${Math.min(strength, 90)}%, var(--color-bg))`,
                color: isSelected ? "white" : "var(--color-ink)",
                fontWeight: isSelected ? 700 : 400,
              }}
            >
              <span>{token}</span>
              {!isSelected && (
                <span className="text-[0.65rem] text-[var(--color-ink-soft)]">{weight.toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        Showing what <strong className="text-[var(--color-ink)]">"{current.tokens[selected]}"</strong> attends to
        — darker means a higher attention weight. Real weights, averaged across every layer and head of a real
        small transformer, not illustrative.
      </div>
    </div>
  );
}
