import { useState } from "react";
import data from "../../data/scaling-laws.json";

interface Law {
  key: string;
  label: string;
  variable: string;
  alpha: number;
  xc: number;
  equation: string;
  testedMin: number;
  testedMax: number;
  testedNote: string;
  plotMin: number;
  plotMax: number;
  unit: string;
}

const LAWS = data.laws as Law[];

const W = 480;
const H = 270;
const M = { left: 40, right: 18, top: 14, bottom: 44 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const Y_MIN = 1.5;
const Y_MAX = 7.5;
const Y_TICKS = [2, 3, 4, 5, 6, 7];

const loss = (law: Law, x: number) => Math.pow(law.xc / x, law.alpha);
const f = (n: number) => n.toFixed(2);

function fmt(x: number): string {
  if (x >= 1e3 || x < 1e-2) {
    const exp = Math.floor(Math.log10(x));
    const mant = x / Math.pow(10, exp);
    return `${mant.toFixed(1)}×10${superscript(exp)}`;
  }
  return x.toPrecision(3);
}

function superscript(n: number): string {
  const map: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n)
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}

export default function ScalingCurveChart() {
  const [lawIdx, setLawIdx] = useState(0);
  const [pos, setPos] = useState(0.5); // 0..1 along the log-x axis
  const law = LAWS[lawIdx];

  const logMin = Math.log10(law.plotMin);
  const logMax = Math.log10(law.plotMax);
  const xFor = (x: number) => M.left + ((Math.log10(x) - logMin) / (logMax - logMin)) * PLOT_W;
  const yFor = (y: number) => M.top + (1 - (Math.log10(y) - Math.log10(Y_MIN)) / (Math.log10(Y_MAX) - Math.log10(Y_MIN))) * PLOT_H;

  const decades: number[] = [];
  for (let e = Math.ceil(logMin); e <= Math.floor(logMax); e++) decades.push(e);

  const line = (a: number, b: number) =>
    `M${f(xFor(a))},${f(yFor(loss(law, a)))} L${f(xFor(b))},${f(yFor(loss(law, b)))}`;

  const x = Math.pow(10, logMin + pos * (logMax - logMin));
  const y = loss(law, x);
  const inRange = x >= law.testedMin && x <= law.testedMax;
  const tenX = Math.pow(10, -law.alpha);

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Explore — published scaling curves
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        {LAWS.map((l, i) => (
          <button
            key={l.key}
            onClick={() => setLawIdx(i)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              i === lawIdx
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-bg-alt)]"
            }`}
          >
            Loss vs. {l.label.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Log-log plot of test loss against ${law.variable}: a straight line`}
        >
          {Y_TICKS.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={f(yFor(t))} y2={f(yFor(t))} stroke="var(--color-border)" strokeWidth={1} />
              <text x={M.left - 6} y={f(yFor(t) + 3.5)} textAnchor="end" fontSize={10} fill="var(--color-ink-soft)">
                {t}
              </text>
            </g>
          ))}
          {decades.map((e) => (
            <g key={e}>
              <line x1={f(xFor(Math.pow(10, e)))} x2={f(xFor(Math.pow(10, e)))} y1={M.top} y2={H - M.bottom} stroke="var(--color-border)" strokeWidth={1} opacity={0.5} />
              <text x={f(xFor(Math.pow(10, e)))} y={H - M.bottom + 14} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
                10{superscript(e)}
              </text>
            </g>
          ))}

          <path d={line(law.plotMin, law.plotMax)} fill="none" stroke="var(--color-ink-soft)" strokeWidth={1.5} strokeDasharray="5 4" />
          <path
            d={line(Math.max(law.testedMin, law.plotMin), Math.min(law.testedMax, law.plotMax))}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          <circle cx={f(xFor(x))} cy={f(yFor(y))} r={6} fill="var(--color-accent)" stroke="var(--color-bg-subtle)" strokeWidth={2} />

          <text x={M.left + PLOT_W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
            {law.variable} (log scale)
          </text>
          <text x={10} y={M.top + PLOT_H / 2} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)" transform={`rotate(-90 10 ${M.top + PLOT_H / 2})`}>
            test loss, nats/token (log scale)
          </text>
        </svg>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke="var(--color-accent)" strokeWidth={2.5} />
            </svg>
            range the paper actually measured
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke="var(--color-ink-soft)" strokeWidth={1.5} strokeDasharray="5 4" />
            </svg>
            extrapolation of the fit
          </span>
        </div>

        <label className="mt-3 flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
          Move along the curve
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="flex-1"
            aria-label={`Position along the ${law.variable} axis`}
          />
        </label>

        <div className="mt-2 text-xs text-[var(--color-ink)]">
          At <strong>{fmt(x)}</strong> {law.unit}: loss <strong>{y.toFixed(2)}</strong> nats/token{" "}
          <span className="text-[var(--color-ink-soft)]">({inRange ? "inside the measured range" : "extrapolated"})</span>.
          Every 10× increase multiplies loss by <strong>{tenX.toFixed(3)}</strong> — about{" "}
          <strong>{((1 - tenX) * 100).toFixed(1)}%</strong> lower, at any starting point.
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        These are the power-law <em>fits</em> published by Kaplan et al. (2020), {law.equation} — {law.testedNote}. A power
        law is a straight line on log-log axes by construction; the paper's finding is that real training runs sit on
        it across many orders of magnitude. Loss values are specific to that paper's dataset and tokenizer, and the
        paper itself expects the trend to break down eventually.
      </div>
    </div>
  );
}
