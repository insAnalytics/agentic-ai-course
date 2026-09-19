import examples from "../../data/training-examples.json";

type Stage = "pretraining" | "sft" | "preference" | "rl";

const STAGE_LABEL: Record<Stage, string> = {
  pretraining: "Pretraining",
  sft: "SFT",
  preference: "Preference training",
  rl: "RL for reasoning",
};

const PANEL = "rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3";
const LABEL = "mb-1 text-[0.65rem] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase";

function Source({ dataset, license, row, note }: { dataset: string; license: string; row: number; note: string }) {
  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
      A real record (row {row}) from {dataset}, license {license} — {note}.
    </div>
  );
}

function Pretraining() {
  const d = examples.pretraining;
  const context = d.tokens.slice(0, -1);
  const target = d.tokens[d.tokens.length - 1];
  const show = (t: string) => t.replace(/\n/g, "↵");
  return (
    <>
      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className={PANEL}>
          <div className={LABEL}>Context — a stretch of a raw web page</div>
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {context.map((t, i) => (
              <span key={i} className="rounded bg-[var(--color-bg-alt)] px-1.5 py-0.5 whitespace-pre text-[var(--color-ink)]">
                {show(t)}
              </span>
            ))}
          </div>
        </div>
        <div className={PANEL} style={{ borderColor: "var(--color-accent)" }}>
          <div className={LABEL}>Target — the token that actually came next</div>
          <span
            className="rounded px-1.5 py-0.5 font-mono text-xs whitespace-pre text-white"
            style={{ background: "var(--color-accent)" }}
          >
            {show(target)}
          </span>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        No labels, no curation: the "answer" is just whatever token came next in the document. Every position in every
        document is a training example like this one (tokens shown with GPT-2's tokenizer).
      </div>
      <Source dataset={d.dataset} license={d.license} row={d.row} note={`the first ${d.tokens.length} tokens of the document`} />
    </>
  );
}

function Sft() {
  const d = examples.sft;
  return (
    <>
      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className={PANEL}>
          <div className={LABEL}>Instruction (input) — category: {d.category}</div>
          <div className="text-sm text-[var(--color-ink)]">{d.instruction}</div>
        </div>
        <div className={PANEL} style={{ borderColor: "var(--color-accent)" }}>
          <div className={LABEL}>Response (what the model is trained to produce)</div>
          <div className="text-sm text-[var(--color-ink)]">{d.response}</div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        The same next-token objective as pretraining, but on a deliberately chosen pair: given the instruction, predict
        the demonstrated response (the training signal typically comes from the response's tokens).
      </div>
      <Source dataset={d.dataset} license={d.license} row={d.row} note="shown unedited" />
    </>
  );
}

function Preference() {
  const d = examples.preference;
  return (
    <>
      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className={PANEL}>
          <div className={LABEL}>Prompt</div>
          <div className="text-sm text-[var(--color-ink)]">{d.prompt}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={PANEL} style={{ borderColor: "var(--color-accent)" }}>
            <div className={LABEL}>Chosen — judged better</div>
            <div className="text-sm text-[var(--color-ink)]">{d.chosen}</div>
          </div>
          <div className={PANEL} style={{ opacity: 0.8 }}>
            <div className={LABEL}>Rejected — judged worse</div>
            <div className="text-sm text-[var(--color-ink)]">{d.rejected}</div>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        The label is only a comparison — one reply was ranked above the other, not graded as "good." Real preference
        data is like this: relative, sometimes subtle, and noisy. The model is trained to make the chosen kind of
        response more likely than the rejected kind.
      </div>
      <Source dataset={d.dataset} license={d.license} row={d.row} note="shown unedited" />
    </>
  );
}

function Rl() {
  const d = examples.rl;
  return (
    <>
      <div className="flex flex-col gap-3 bg-[var(--color-bg-subtle)] p-4">
        <div className={PANEL}>
          <div className={LABEL}>Problem</div>
          <div className="text-sm text-[var(--color-ink)]">{d.question}</div>
        </div>
        <div className={PANEL} style={{ borderColor: "var(--color-accent)" }}>
          <div className={LABEL}>Automatic check</div>
          <div className="text-sm text-[var(--color-ink)]">
            Reward <strong>1</strong> if the model's final answer is <strong className="font-mono">{d.final_answer}</strong>,
            otherwise <strong>0</strong> — however it got there.
          </div>
        </div>
        <details className={PANEL}>
          <summary className="cursor-pointer text-xs font-semibold text-[var(--color-ink-soft)]">
            The dataset's own human-written solution (not needed for the reward)
          </summary>
          <div className="mt-2 text-sm whitespace-pre-line text-[var(--color-ink)]">{d.reference_solution}</div>
        </details>
      </div>
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)]">
        The model generates its own step-by-step reasoning and a final answer; only that final answer is checked
        against the known result. Reasoning that tends to end in the right answer gets reinforced.
      </div>
      <Source dataset={d.dataset} license={d.license} row={d.row} note="shown as in the dataset, with the final-answer line split out as the check" />
    </>
  );
}

export default function TrainingExampleCard({ stage }: { stage: Stage }) {
  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          A real training example — {STAGE_LABEL[stage]}
        </span>
      </div>
      {stage === "pretraining" && <Pretraining />}
      {stage === "sft" && <Sft />}
      {stage === "preference" && <Preference />}
      {stage === "rl" && <Rl />}
    </div>
  );
}
