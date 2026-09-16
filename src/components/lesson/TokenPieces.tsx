const TOKEN_COLOR_COUNT = 6;

interface TokenPiecesProps {
  pieces: string[];
  emptyLabel?: string;
}

/** Renders one token per colored span, cycling --color-token-1..6 (global.css). Shared by TokenizerVisualizer and TokenLanguageComparison so the coloring behavior can't drift between them. */
export default function TokenPieces({ pieces, emptyLabel = "(type something above)" }: TokenPiecesProps) {
  if (pieces.length === 0) {
    return <span className="text-[var(--color-ink-soft)]">{emptyLabel}</span>;
  }
  return (
    <>
      {pieces.map((piece, i) => {
        const hue = `var(--color-token-${(i % TOKEN_COLOR_COUNT) + 1})`;
        return (
          <span
            key={i}
            style={{
              whiteSpace: "pre",
              background: `color-mix(in srgb, ${hue} 18%, var(--color-bg-subtle))`,
              borderBottom: `2px solid ${hue}`,
            }}
            className="rounded-t-sm px-0.5 text-[var(--color-ink)]"
          >
            {piece}
          </span>
        );
      })}
    </>
  );
}
