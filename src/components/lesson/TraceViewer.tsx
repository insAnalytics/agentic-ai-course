import { useEffect, useMemo, useState } from "react";

/**
 * Interactive viewer for the Module 7 pilot's traces (Lesson 2 concept 4).
 * Reads public/data/eval/pilot/traces/<setup>.json, built by
 * scripts/eval/build_pilot_traces.py from the lesson's own trace_from_recording
 * with content captured. Each setup's file (160-320 KB) is fetched when the
 * learner first picks it, never imported into the bundle.
 */

interface Span {
  name: string;
  span_id: string;
  parent_id: string | null;
  status: string;
  attributes: Record<string, unknown>;
}

interface Trial {
  trial_id: string;
  task_id: string;
  request: string;
  answer: string | null;
  spans: Span[];
}

interface TraceFile {
  setup: string;
  model: string;
  thinking: boolean;
  trials: Trial[];
}

interface Part {
  type: string;
  thinking?: string;
  text?: string;
  name?: string;
  input?: unknown;
}

interface TraceViewerProps {
  /** A trial id such as "4b-think/p08/1": the trace shown first. */
  initial: string;
  /** Trial ids offered as one-click suggestions, with a short label each. */
  suggestions?: { trial: string; label: string }[];
}

const SETUPS = [
  { id: "4b-think", label: "Qwen3.5-4B, thinking on (the registry agent)" },
  { id: "4b-nothink", label: "Qwen3.5-4B, thinking off" },
  { id: "9b-think", label: "Qwen3.5-9B, thinking on" },
];

const CONTENT_KEYS = ["gen_ai.output.messages", "gen_ai.tool.call.arguments", "gen_ai.tool.call.result"];

const files = new Map<string, Promise<TraceFile>>();

function loadSetup(setup: string): Promise<TraceFile> {
  let pending = files.get(setup);
  if (!pending) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    pending = fetch(`${base}/data/eval/pilot/traces/${setup}.json`).then((res) => {
      if (!res.ok) throw new Error(`Couldn't load the ${setup} traces (HTTP ${res.status})`);
      return res.json() as Promise<TraceFile>;
    });
    // a failed fetch shouldn't stick: picking the setup again retries
    pending.catch(() => files.delete(setup));
    files.set(setup, pending);
  }
  return pending;
}

function parseTrial(id: string): { setup: string; task: string; trial: number } {
  const [setup, task, trial] = id.split("/");
  return { setup, task, trial: Number(trial) };
}

/** A short summary for a span's row: tokens for a model call, the tool for a tool call. */
function keyFacts(span: Span): string {
  const a = span.attributes;
  const op = a["gen_ai.operation.name"];
  if (op === "chat") {
    const input = a["gen_ai.usage.input_tokens"];
    const output = a["gen_ai.usage.output_tokens"];
    return input !== undefined ? `${input} in · ${output} out tokens` : "";
  }
  // the tool's or agent's name, unless the span's name already says it (the conventions' "execute_tool {tool name}")
  const named = op === "execute_tool" ? a["gen_ai.tool.name"] : op === "invoke_agent" ? a["gen_ai.agent.name"] : undefined;
  return named !== undefined && !span.name.includes(String(named)) ? String(named) : "";
}

function pretty(value: unknown): string {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function ContentValue({ name, value }: { name: string; value: unknown }) {
  if (name === "gen_ai.output.messages" && Array.isArray(value)) {
    const parts = ((value[0] as { parts?: Part[] })?.parts ?? []) as Part[];
    return (
      <div className="flex flex-col gap-2">
        {parts.map((part, i) => {
          if (part.type === "thinking") {
            return (
              <details key={i} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                <summary className="cursor-pointer px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                  Thinking ({(part.thinking ?? "").length.toLocaleString()} characters)
                </summary>
                <pre className="m-0 max-h-80 overflow-auto px-2 pb-2 font-mono text-xs whitespace-pre-wrap text-[var(--color-ink)]">
                  {part.thinking}
                </pre>
              </details>
            );
          }
          if (part.type === "tool_use") {
            return (
              <div key={i} className="rounded-md border border-[var(--color-accent-light)] bg-[var(--color-accent-light)] px-2 py-1">
                <div className="text-xs font-semibold text-[var(--color-accent)]">Tool call: {part.name}</div>
                <pre className="m-0 font-mono text-xs whitespace-pre-wrap text-[var(--color-ink)]">{pretty(part.input)}</pre>
              </div>
            );
          }
          return (
            <div key={i} className="rounded-md border border-[var(--color-border)] px-2 py-1">
              <div className="text-xs font-semibold text-[var(--color-ink-soft)]">Text</div>
              <pre className="m-0 font-mono text-xs whitespace-pre-wrap text-[var(--color-ink)]">{part.text}</pre>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <pre className="m-0 max-h-80 overflow-auto rounded-md bg-[var(--color-bg-subtle)] p-2 font-mono text-xs whitespace-pre-wrap text-[var(--color-ink)]">
      {pretty(value)}
    </pre>
  );
}

function SpanDetails({ span }: { span: Span }) {
  const entries = Object.entries(span.attributes);
  const plain = entries.filter(([key]) => !CONTENT_KEYS.includes(key));
  const content = entries.filter(([key]) => CONTENT_KEYS.includes(key));
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-sm font-semibold text-[var(--color-ink)]">
        {span.name}
        {span.status === "ERROR" && <ErrorBadge />}
      </div>
      <table className="m-0 w-full border-collapse text-xs">
        <tbody>
          <tr>
            <td className="py-0.5 pr-3 align-top font-mono text-[var(--color-ink-soft)]">status</td>
            <td className="py-0.5 font-mono break-all text-[var(--color-ink)]">{span.status}</td>
          </tr>
          {plain.map(([key, value]) => (
            <tr key={key}>
              <td className="py-0.5 pr-3 align-top font-mono text-[var(--color-ink-soft)]">{key}</td>
              <td className="py-0.5 font-mono break-all text-[var(--color-ink)]">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {content.map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 font-mono text-xs text-[var(--color-ink-soft)]">{key}</div>
          <ContentValue name={key} value={value} />
        </div>
      ))}
    </div>
  );
}

function ErrorBadge() {
  return (
    <span className="ml-2 rounded bg-[var(--color-danger-bg)] px-1.5 py-0.5 font-sans text-[0.65rem] font-bold text-[var(--color-danger)]">
      ERROR
    </span>
  );
}

export default function TraceViewer({ initial, suggestions = [] }: TraceViewerProps) {
  const start = parseTrial(initial);
  const [setup, setSetup] = useState(start.setup);
  const [task, setTask] = useState(start.task);
  const [trialNo, setTrialNo] = useState(start.trial);
  const [data, setData] = useState<TraceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    loadSetup(setup)
      .then((file) => !cancelled && setData(file))
      .catch((err) => !cancelled && setError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [setup]);

  const tasks = useMemo(() => (data ? [...new Set(data.trials.map((t) => t.task_id))].sort() : []), [data]);
  const trial = data?.trials.find((t) => t.trial_id === `${setup}/${task}/${trialNo}`) ?? null;

  const children = useMemo(() => {
    const map = new Map<string | null, Span[]>();
    for (const span of trial?.spans ?? []) {
      map.set(span.parent_id, [...(map.get(span.parent_id) ?? []), span]);
    }
    return map;
  }, [trial]);

  // a new trial opens with its first model call selected and the tree expanded
  useEffect(() => {
    setSelected(trial?.spans[1]?.span_id ?? trial?.spans[0]?.span_id ?? null);
    setCollapsed(new Set());
  }, [trial]);

  const choose = (id: string) => {
    const t = parseTrial(id);
    setSetup(t.setup);
    setTask(t.task);
    setTrialNo(t.trial);
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderSpan = (span: Span, depth: number) => {
    const kids = children.get(span.span_id) ?? [];
    const open = !collapsed.has(span.span_id);
    const facts = keyFacts(span);
    const isSelected = selected === span.span_id;
    return (
      <li key={span.span_id} className="list-none">
        <div
          className={`flex items-center gap-1 rounded px-1 py-0.5 ${isSelected ? "bg-[var(--color-accent-light)]" : "hover:bg-[var(--color-bg-subtle)]"}`}
          style={{ paddingLeft: `${depth * 1.1 + 0.25}rem` }}
        >
          {kids.length ? (
            <button
              onClick={() => toggle(span.span_id)}
              aria-label={open ? "Collapse" : "Expand"}
              className="w-4 shrink-0 text-xs text-[var(--color-ink-soft)]"
            >
              {open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <button onClick={() => setSelected(span.span_id)} className="flex min-w-0 flex-wrap items-center gap-x-2 text-left">
            <span className="font-mono text-xs text-[var(--color-ink)]">{span.name}</span>
            {span.status === "ERROR" && <ErrorBadge />}
            {facts && <span className="text-[0.7rem] text-[var(--color-ink-soft)]">{facts}</span>}
          </button>
        </div>
        {kids.length > 0 && open && <ul className="m-0 p-0">{kids.map((kid) => renderSpan(kid, depth + 1))}</ul>}
      </li>
    );
  };

  const selectedSpan = trial?.spans.find((s) => s.span_id === selected) ?? null;
  const select = "rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-ink)]";

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center bg-[var(--color-accent-light)] px-3 py-1.5">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-accent)] uppercase">Trace viewer</span>
      </div>

      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Setup" className={select} value={setup} onChange={(e) => setSetup(e.target.value)}>
            {SETUPS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select aria-label="Task" className={select} value={task} onChange={(e) => setTask(e.target.value)}>
            {(tasks.length ? tasks : [task]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select aria-label="Trial" className={select} value={trialNo} onChange={(e) => setTrialNo(Number(e.target.value))}>
            {[0, 1, 2].map((n) => (
              <option key={n} value={n}>
                trial {n}
              </option>
            ))}
          </select>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
            Worth reading:
            {[{ trial: initial, label: "" }, ...suggestions].map(({ trial: id, label }) => (
              <button
                key={id}
                onClick={() => choose(id)}
                title={label}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                  id === `${setup}/${task}/${trialNo}`
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-alt)] text-[var(--color-ink)]"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="p-3 text-sm text-[var(--color-danger)]">{error}</div>}
      {!error && !trial && <div className="p-3 text-sm text-[var(--color-ink-soft)]">Loading the {setup} traces…</div>}

      {trial && (
        <>
          <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase">Request</span>
            <div className="text-[var(--color-ink)]">{trial.request}</div>
          </div>
          <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <ul className="m-0 max-h-[32rem] overflow-auto border-b border-[var(--color-border)] p-2 md:border-r md:border-b-0">
              {(children.get(null) ?? []).map((root) => renderSpan(root, 0))}
            </ul>
            <div className="max-h-[32rem] overflow-auto p-3">
              {selectedSpan ? (
                <SpanDetails span={selectedSpan} />
              ) : (
                <div className="text-sm text-[var(--color-ink-soft)]">Click a span to see its attributes.</div>
              )}
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase">Final answer</span>
            <div className="whitespace-pre-wrap text-[var(--color-ink)]">{trial.answer ?? "(no answer)"}</div>
          </div>
        </>
      )}

      <div className="border-t border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        Built from the pilot's real recordings with this lesson's <code>trace_from_recording</code>, content
        captured. The recordings have no timings, so these spans have none.
      </div>
    </div>
  );
}
