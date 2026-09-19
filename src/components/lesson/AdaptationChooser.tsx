import { useState } from "react";

type Node = "knowledge" | "behavior" | "retrieval" | "finetuning" | "prompting";

const QUESTIONS: Record<"knowledge" | "behavior", string> = {
  knowledge:
    "Is the real problem knowledge the model doesn't have — information that's private, or changes too often to ever be baked into a model?",
  behavior:
    "Does the behavior need to be extremely consistent across a large volume of uses, or is it a narrow, highly specialized task that prompting handles unreliably?",
};

const RESULTS: Record<"retrieval" | "finetuning" | "prompting", { title: string; body: string }> = {
  retrieval: {
    title: "Retrieval (RAG)",
    body: "Missing or fast-changing knowledge can't be reliably trained in — fetch it at request time and put it in the prompt.",
  },
  finetuning: {
    title: "Fine-tuning",
    body: "The gap is reliable behavior, not missing knowledge — exactly the case where training on examples earns its cost.",
  },
  prompting: {
    title: "Prompting",
    body: "Instructions and a few in-prompt examples are the cheapest, fastest option and cover most behavior and format changes — start here.",
  },
};

export default function AdaptationChooser() {
  const [node, setNode] = useState<Node>("knowledge");
  const [path, setPath] = useState<string[]>([]);

  const answer = (label: string, next: Node) => {
    setPath((p) => [...p, label]);
    setNode(next);
  };
  const reset = () => {
    setNode("knowledge");
    setPath([]);
  };

  const isResult = node === "retrieval" || node === "finetuning" || node === "prompting";

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — choosing between the three
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        {path.length > 0 && (
          <div className="text-xs text-[var(--color-ink-soft)]">Your answers so far: {path.join(" → ")}</div>
        )}

        {!isResult ? (
          <>
            <div className="text-sm font-medium text-[var(--color-ink)]">{QUESTIONS[node as "knowledge" | "behavior"]}</div>
            <div className="flex gap-2">
              <button
                onClick={() => answer("Yes", node === "knowledge" ? "retrieval" : "finetuning")}
                className="rounded-md bg-[var(--color-green)] px-4 py-1.5 text-xs font-semibold text-white"
              >
                Yes
              </button>
              <button
                onClick={() => answer("No", node === "knowledge" ? "behavior" : "prompting")}
                className="rounded-md bg-[var(--color-bg)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] ring-1 ring-[var(--color-border)]"
              >
                No
              </button>
            </div>
          </>
        ) : (
          <div
            className="rounded-md border p-3"
            style={{ borderColor: "var(--color-accent)", background: "var(--color-accent-light)" }}
          >
            <div className="text-[0.65rem] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Start with
            </div>
            <div className="text-base font-semibold" style={{ color: "var(--color-accent-dark)" }}>
              {RESULTS[node].title}
            </div>
            <div className="mt-1 text-sm text-[var(--color-ink)]">{RESULTS[node].body}</div>
          </div>
        )}

        {(path.length > 0 || isResult) && (
          <div>
            <button onClick={reset} className="text-xs font-semibold text-[var(--color-ink-soft)] underline">
              Start over
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        A simplification: real systems often combine these, and even when fine-tuning looks likely it's usually worth
        trying prompting first, since it's the cheapest thing to test.
      </div>
    </div>
  );
}
