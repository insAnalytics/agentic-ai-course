import { useMemo, useState } from "react";
import embeddingSentences from "../../data/embedding-sentences.json";
import { placeLabels } from "../../lib/labelPlacement";
import { cosineSimilarity } from "../../lib/cosineSimilarity";

interface SentencePoint {
  text: string;
  x: number;
  y: number;
  vector: number[];
}

const SENTENCES = embeddingSentences as SentencePoint[];
const SCALE = 100;
const VIEW = 140;
const FONT_SIZE = 12;
const CHAR_WIDTH = FONT_SIZE * 0.62;
const LABEL_HEIGHT = FONT_SIZE * 1.2;

// three real paraphrase pairs, pre-checked — enough to show the effect
// across more than one topic without overwhelming the plot on first load
const DEFAULT_CHECKED = [0, 1, 2, 3, 8, 9];

interface SentenceEmbeddingSpaceProps {
  /** Adds a live pairwise cosine-similarity table below the checklist — Concept 4's extension of this same component. */
  showSimilarityTable?: boolean;
}

export default function SentenceEmbeddingSpace({ showSimilarityTable = false }: SentenceEmbeddingSpaceProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set(DEFAULT_CHECKED));

  const shownIndices = useMemo(() => SENTENCES.map((_, i) => i).filter((i) => checked.has(i)), [checked]);

  const labelPlacements = useMemo(() => {
    const points = shownIndices.map((i) => {
      const s = SENTENCES[i];
      const label = String(i + 1);
      return { key: label, px: s.x * SCALE, py: s.y * SCALE, label };
    });
    return placeLabels(points, CHAR_WIDTH, LABEL_HEIGHT);
  }, [shownIndices]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — compare sentences by meaning
        </span>
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-3">
        <svg
          viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
          className="mx-auto block w-full max-w-md"
          role="img"
          aria-label="A 2D plot of sentences positioned by meaning, from a real sentence-embedding model"
        >
          <rect
            x={-VIEW}
            y={-VIEW}
            width={VIEW * 2}
            height={VIEW * 2}
            fill="var(--color-bg)"
            stroke="var(--color-border)"
          />
          {shownIndices.map((i) => {
            const s = SENTENCES[i];
            const px = s.x * SCALE;
            const py = s.y * SCALE;
            const label = String(i + 1);
            const { dx, dy, anchor } = labelPlacements.get(label)!;
            return (
              <g key={i}>
                <circle cx={px} cy={py} r={4.5} fill="var(--color-accent)" />
                <text
                  x={px + dx}
                  y={py + dy}
                  textAnchor={anchor}
                  fontSize={FONT_SIZE}
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="var(--color-accent)"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="max-h-64 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {SENTENCES.map((s, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 text-sm hover:bg-[var(--color-bg-subtle)]">
                <input
                  type="checkbox"
                  checked={checked.has(i)}
                  onChange={() => toggle(i)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-[var(--color-ink-soft)]">{i + 1}.</span>
                <span className="text-[var(--color-ink)]">{s.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {showSimilarityTable && (
        <div className="overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          {shownIndices.length < 2 ? (
            <p className="m-0 text-xs text-[var(--color-ink-soft)]">Check at least two sentences to compare them.</p>
          ) : (
            <table className="border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-1.5" />
                  {shownIndices.map((j) => (
                    <th key={j} className="p-1.5 text-center font-semibold text-[var(--color-ink-soft)]">
                      {j + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownIndices.map((i) => (
                  <tr key={i}>
                    <th className="p-1.5 pr-2 text-right font-semibold text-[var(--color-ink-soft)]">{i + 1}</th>
                    {shownIndices.map((j) => {
                      if (i === j) {
                        return (
                          <td key={j} className="p-1.5 text-center text-[var(--color-ink-soft)]">
                            —
                          </td>
                        );
                      }
                      const sim = cosineSimilarity(SENTENCES[i].vector, SENTENCES[j].vector);
                      // sequential encoding: light -> dark blue as similarity rises from -1 to 1
                      const strength = Math.round(((sim + 1) / 2) * 70 + 8);
                      return (
                        <td
                          key={j}
                          className="p-1.5 text-center text-[var(--color-ink)]"
                          style={{
                            background: `color-mix(in srgb, var(--color-token-1) ${strength}%, var(--color-bg))`,
                          }}
                        >
                          {sim.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
