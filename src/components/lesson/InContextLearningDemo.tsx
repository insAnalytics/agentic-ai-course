import data from "../../data/icl-demo.json";

interface Result {
  model: string;
  exact_match: number;
  example: { input: string; completion: string; expected: string };
}

const RESULTS = data.results as Result[];
const N = data.test_problems;

export default function InContextLearningDemo() {
  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Same prompt, four model sizes — real results
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="mb-1 text-[0.65rem] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
            The prompt — three examples, no rule stated
          </div>
          <pre className="m-0 overflow-x-auto bg-transparent p-0 font-mono text-xs whitespace-pre-wrap text-[var(--color-ink)]">
            {data.shots.map((s) => `"${s.input}" -> "${s.output}"\n`).join("")}
            {`"${RESULTS[0].example.input}" -> "`}
          </pre>
        </div>

        <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]">
          <table className="m-0 w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)]">
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Completion for this prompt</th>
                <th className="px-3 py-2 font-medium">Exact match, {N} new names</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => {
                const ok = r.example.completion === r.example.expected;
                return (
                  <tr key={r.model} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-semibold text-[var(--color-ink)]">{r.model}</td>
                    <td className="px-3 py-2 font-mono text-[var(--color-ink)]">
                      "{r.example.completion}" <span className="text-[var(--color-ink-soft)]">{ok ? "✓" : "✗"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded bg-[var(--color-bg-alt)]">
                          <div
                            className="h-2 rounded"
                            style={{ width: `${(r.exact_match * 100).toFixed(0)}%`, background: "var(--color-accent)" }}
                          />
                        </div>
                        <span className="font-mono text-[var(--color-ink)]">
                          {Math.round(r.exact_match * N)}/{N}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        Real runs for this course: the {data.family}. Every model saw the identical prompt, and no parameters were ever
        updated. One small task and one model family — enough to show the trend, not to measure it precisely.
      </div>
    </div>
  );
}
