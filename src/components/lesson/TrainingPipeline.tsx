interface Stage {
  name: string;
  short: string;
  // Filled in only once the lesson's concept for that stage exists.
  blurb: string | null;
}

const STAGES: Stage[] = [
  {
    name: "Pretraining",
    short: "Stage 1",
    blurb:
      "Predict the next token, over and over, across a massive body of raw text. Produces the model's learned parameters — by far the most resource-intensive stage.",
  },
  { name: "SFT", short: "Stage 2", blurb: null },
  { name: "Preference training", short: "Stage 3", blurb: null },
  { name: "RL for reasoning", short: "Stage 4", blurb: null },
];

interface TrainingPipelineProps {
  /** Which stage is highlighted as "the one this page is about" (0-based). */
  active?: number;
  /** How many stages, from the left, are filled in with their description (the rest are shown as dimmed placeholders). */
  revealed?: number;
}

export default function TrainingPipeline({ active = 0, revealed = 1 }: TrainingPipelineProps) {
  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          The training pipeline
        </span>
      </div>

      <ol className="m-0 grid list-none grid-cols-1 gap-2 bg-[var(--color-bg-subtle)] p-4 sm:grid-cols-4">
        {STAGES.map((stage, i) => {
          const isActive = i === active;
          const isRevealed = i < revealed;
          return (
            <li
              key={stage.name}
              className="flex flex-col gap-1 rounded-md border p-3"
              style={{
                background: isActive ? "var(--color-accent-light)" : "var(--color-bg)",
                borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                opacity: isRevealed ? 1 : 0.5,
              }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="text-[0.65rem] tracking-wide text-[var(--color-ink-soft)] uppercase">
                {stage.short}
                {i < STAGES.length - 1 ? " →" : ""}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: isActive ? "var(--color-accent-dark)" : "var(--color-ink)" }}
              >
                {stage.name}
              </span>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {isRevealed && stage.blurb ? stage.blurb : "Covered later in this lesson"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
