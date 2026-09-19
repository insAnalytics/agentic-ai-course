import { useState } from "react";

// Illustrative toy model, NOT measured data: per-digit accuracy rises smoothly
// (a logistic in log10 model size) from chance up toward 1. Exact match on a
// k-digit answer needs every digit right, so it is p^k; partial credit is p.
const CHANCE = 0.1;
const MID = 9; // log10(parameters) where per-digit accuracy is halfway between chance and 1
const WIDTH = 0.7;
const LOG_MIN = 7;
const LOG_MAX = 12;

const perDigit = (logN: number) => CHANCE + (1 - CHANCE) / (1 + Math.exp(-(logN - MID) / WIDTH));

const W = 300;
const H = 210;
const M = { left: 38, right: 12, top: 12, bottom: 40 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const xFor = (logN: number) => M.left + ((logN - LOG_MIN) / (LOG_MAX - LOG_MIN)) * PLOT_W;
const yFor = (v: number) => M.top + (1 - v) * PLOT_H;
const f = (n: number) => n.toFixed(2);

const SUPERSCRIPT = ["⁷", "⁸", "⁹", "¹⁰", "¹¹", "¹²"];
const STEPS = Array.from({ length: 51 }, (_, i) => LOG_MIN + (i / 50) * (LOG_MAX - LOG_MIN));

function Panel({
  title,
  subtitle,
  score,
  marker,
}: {
  title: string;
  subtitle: string;
  score: (logN: number) => number;
  marker: number;
}) {
  const path = STEPS.map((s, i) => `${i === 0 ? "M" : "L"}${f(xFor(s))},${f(yFor(score(s)))}`).join(" ");
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="text-xs font-semibold text-[var(--color-ink)]">{title}</div>
      <div className="mb-1 text-[0.7rem] text-[var(--color-ink-soft)]">{subtitle}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={f(yFor(t))} y2={f(yFor(t))} stroke="var(--color-border)" strokeWidth={1} />
            <text x={M.left - 5} y={f(yFor(t) + 3.5)} textAnchor="end" fontSize={9} fill="var(--color-ink-soft)">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {SUPERSCRIPT.map((s, i) => (
          <text key={i} x={f(xFor(LOG_MIN + i))} y={H - M.bottom + 14} textAnchor="middle" fontSize={9} fill="var(--color-ink-soft)">
            10{s}
          </text>
        ))}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={f(xFor(marker))} cy={f(yFor(score(marker)))} r={5.5} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth={2} />
        <text x={M.left + PLOT_W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--color-ink-soft)">
          model size (parameters, log scale)
        </text>
      </svg>
    </div>
  );
}

export default function EmergenceMetricChart() {
  const [digits, setDigits] = useState(4);
  const [logN, setLogN] = useState(9.5);

  const partial = (s: number) => perDigit(s);
  const exact = (s: number) => Math.pow(perDigit(s), digits);

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Same underlying ability, two scoring rules — an illustration
        </span>
      </div>

      <div className="grid gap-3 bg-[var(--color-bg-subtle)] p-3 sm:grid-cols-2">
        <Panel
          title="All-or-nothing: exact match"
          subtitle={`Counts only if all ${digits} digit${digits === 1 ? "" : "s"} of the answer are right`}
          score={exact}
          marker={logN}
        />
        <Panel
          title="Continuous: partial credit"
          subtitle="Credit for each digit that's right"
          score={partial}
          marker={logN}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
        <label className="flex items-center gap-3">
          <span className="w-28 shrink-0">Answer length: {digits} digit{digits === 1 ? "" : "s"}</span>
          <input type="range" min={1} max={8} step={1} value={digits} onChange={(e) => setDigits(Number(e.target.value))} className="flex-1" />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-28 shrink-0">Model size: 10^{logN.toFixed(1)}</span>
          <input type="range" min={LOG_MIN} max={LOG_MAX} step={0.1} value={logN} onChange={(e) => setLogN(Number(e.target.value))} className="flex-1" />
        </label>
        <div className="text-[var(--color-ink)]">
          At this size: per-digit accuracy <strong>{(partial(logN) * 100).toFixed(0)}%</strong> → exact match on {digits === 8 ? "an" : "a"}{" "}
          {digits}-digit answer <strong>{(exact(logN) * 100).toFixed(0)}%</strong> (that is {(partial(logN) * 100).toFixed(0)}%
          multiplied by itself {digits} time{digits === 1 ? "" : "s"}).
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        <strong>Illustration, not measured data.</strong> Both charts come from one made-up but smooth underlying
        ability (per-digit accuracy rising steadily with scale, starting from 10% chance). Exact match on a k-digit
        answer needs every digit right, so it equals that per-digit accuracy raised to the k-th power. Drag the answer
        length up and watch the same smooth ability produce an ever-sharper "jump" under the all-or-nothing rule.
      </div>
    </div>
  );
}
