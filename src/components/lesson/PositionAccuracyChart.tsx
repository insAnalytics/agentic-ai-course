import { useState } from "react";
import data from "../../data/lost-in-the-middle.json";

interface ModelResult {
  name: string;
  accuracy: number[];
  closedBook: number;
  oracle: number;
}

const MODELS = data.models as ModelResult[];
const INDEXES = data.documentIndexes;
const TOTAL = data.totalDocuments;

const W = 480;
const H = 250;
const M = { left: 42, right: 18, top: 16, bottom: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const xFor = (docIndex: number) => M.left + (docIndex / (TOTAL - 1)) * PLOT_W;
const yFor = (pct: number) => M.top + (1 - pct / 100) * PLOT_H;
const f = (n: number) => n.toFixed(2);

export default function PositionAccuracyChart() {
  const [modelIdx, setModelIdx] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const model = MODELS[modelIdx];

  const points = INDEXES.map((docIndex, i) => ({ docIndex, pct: model.accuracy[i] }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${f(xFor(p.docIndex))},${f(yFor(p.pct))}`).join(" ");
  const active = hover ?? null;

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Explore — accuracy by position
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        {MODELS.map((m, i) => (
          <button
            key={m.name}
            onClick={() => {
              setModelIdx(i);
              setHover(null);
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              i === modelIdx
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-alt)]"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Accuracy of ${model.name} by position of the answer-containing document among ${TOTAL} documents`}>
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line x1={M.left} x2={W - M.right} y1={f(yFor(tick))} y2={f(yFor(tick))} stroke="var(--color-border)" strokeWidth={1} />
              <text x={M.left - 6} y={f(yFor(tick) + 3.5)} textAnchor="end" fontSize={10} fill="var(--color-ink-soft)">
                {tick}%
              </text>
            </g>
          ))}

          <line
            x1={M.left}
            x2={W - M.right}
            y1={f(yFor(model.closedBook))}
            y2={f(yFor(model.closedBook))}
            stroke="var(--color-ink-soft)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />

          <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" />

          {points.map((p, i) => (
            <g key={p.docIndex}>
              <circle
                cx={f(xFor(p.docIndex))}
                cy={f(yFor(p.pct))}
                r={active === i ? 6.5 : 5}
                fill="var(--color-accent)"
                stroke="var(--color-bg-subtle)"
                strokeWidth={2}
              />
              <circle
                cx={f(xFor(p.docIndex))}
                cy={f(yFor(p.pct))}
                r={16}
                fill="transparent"
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                style={{ cursor: "pointer", outline: "none" }}
              />
              <text x={f(xFor(p.docIndex))} y={H - M.bottom + 16} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
                Doc {p.docIndex + 1}
              </text>
            </g>
          ))}
          <text x={M.left + PLOT_W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
            position of the one document containing the answer (out of {TOTAL})
          </text>
        </svg>

        <div className="mt-1 flex items-center gap-4 text-xs text-[var(--color-ink-soft)]">
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke="var(--color-accent)" strokeWidth={2} />
            </svg>
            {model.name}, by answer position
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke="var(--color-ink-soft)" strokeWidth={1.5} strokeDasharray="5 4" />
            </svg>
            with no documents at all (closed-book): {model.closedBook.toFixed(1)}%
          </span>
        </div>

        <div className="mt-2 min-h-[1.25rem] text-xs text-[var(--color-ink)]">
          {active === null ? (
            <span className="text-[var(--color-ink-soft)]">Hover or focus a point to read its exact value.</span>
          ) : (
            <>
              Answer in document <strong>{points[active].docIndex + 1}</strong> of {TOTAL}:{" "}
              <strong>{points[active].pct.toFixed(1)}%</strong> correct
            </>
          )}
        </div>

        <table className="mt-2 w-full text-center text-xs text-[var(--color-ink-soft)]">
          <thead>
            <tr>
              {points.map((p) => (
                <th key={p.docIndex} className="font-medium">
                  Doc {p.docIndex + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono text-[var(--color-ink)]">
              {points.map((p) => (
                <td key={p.docIndex}>{p.pct.toFixed(1)}%</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        Real published measurements, not an illustration: Liu et al. (2023), "Lost in the Middle" — Appendix G.2, Table
        6 (20 retrieved documents; the question's answer is in exactly one of them, and only that document's position
        changes), closed-book baseline from Table 1. These are 2023-era models; newer models may behave differently.
      </div>
    </div>
  );
}
