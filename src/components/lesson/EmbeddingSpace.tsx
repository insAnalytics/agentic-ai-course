import { useMemo, useState } from "react";
import embeddingWords from "../../data/embedding-words.json";

const WORDS = embeddingWords as Record<string, [number, number]>;
const SCALE = 100;
const VIEW = 140; // half-width/height of the viewBox, in scaled units

const DEFAULT_WORDS = ["cat", "dog", "kitten", "car", "truck", "vehicle"];

const ALL_WORDS = Object.keys(WORDS).sort();

const FONT_SIZE = 11;
const CHAR_WIDTH = FONT_SIZE * 0.62; // monospace glyph advance, roughly
const LABEL_HEIGHT = FONT_SIZE * 1.2;

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

type Anchor = "start" | "middle" | "end";

interface Placement {
  dx: number;
  dy: number;
  anchor: Anchor;
}

// Real embedding coordinates cluster tightly (that's the whole point of the
// demo) — two words can land close enough that a naive fixed "always above
// the dot" label collides into unreadable overlapping text. Each word tries
// a ring of candidate positions around its dot and takes the first one that
// doesn't collide with an already-placed label's bounding box.
const CANDIDATES: Placement[] = [
  { dx: 0, dy: -9, anchor: "middle" }, // above
  { dx: 0, dy: 18, anchor: "middle" }, // below
  { dx: 8, dy: 3, anchor: "start" }, // right
  { dx: -8, dy: 3, anchor: "end" }, // left
  { dx: 8, dy: -9, anchor: "start" }, // above-right
  { dx: -8, dy: -9, anchor: "end" }, // above-left
  { dx: 8, dy: 18, anchor: "start" }, // below-right
  { dx: -8, dy: 18, anchor: "end" }, // below-left
];

function labelBox(px: number, py: number, word: string, placement: Placement): Box {
  const width = word.length * CHAR_WIDTH;
  const { dx, dy, anchor } = placement;
  const centerX = px + dx + (anchor === "start" ? width / 2 : anchor === "end" ? -width / 2 : 0);
  const centerY = py + dy - LABEL_HEIGHT / 2;
  return {
    x1: centerX - width / 2,
    y1: centerY - LABEL_HEIGHT / 2,
    x2: centerX + width / 2,
    y2: centerY + LABEL_HEIGHT / 2,
  };
}

function placeLabels(words: string[]): Map<string, Placement> {
  const placed = new Map<string, Placement>();
  const boxes: Box[] = [];
  for (const word of words) {
    const [x, y] = WORDS[word];
    const px = x * SCALE;
    const py = y * SCALE;
    let chosen = CANDIDATES[0];
    let chosenBox = labelBox(px, py, word, chosen);
    for (const candidate of CANDIDATES) {
      const box = labelBox(px, py, word, candidate);
      if (!boxes.some((b) => overlaps(box, b))) {
        chosen = candidate;
        chosenBox = box;
        break;
      }
    }
    placed.set(word, chosen);
    boxes.push(chosenBox);
  }
  return placed;
}

export default function EmbeddingSpace() {
  const [added, setAdded] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [notFound, setNotFound] = useState<string | null>(null);

  const shown = useMemo(() => [...DEFAULT_WORDS, ...added], [added]);
  const labelPlacements = useMemo(() => placeLabels(shown), [shown]);

  const submit = () => {
    const word = input.trim().toLowerCase();
    if (!word) return;
    if (!(word in WORDS)) {
      setNotFound(word);
      setInput("");
      return;
    }
    setNotFound(null);
    setInput("");
    if (!shown.includes(word)) {
      setAdded((a) => [...a, word]);
    }
  };

  const removeWord = (word: string) => {
    setAdded((a) => a.filter((w) => w !== word));
  };

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-green-light)] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-green-dark)] uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
          Try it — drag in a word
        </span>
      </div>

      <div className="bg-[var(--color-bg-subtle)] p-3">
        <svg
          viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
          className="mx-auto block w-full max-w-md"
          role="img"
          aria-label="A 2D plot of words positioned by meaning, from real word embeddings"
        >
          <rect
            x={-VIEW}
            y={-VIEW}
            width={VIEW * 2}
            height={VIEW * 2}
            fill="var(--color-bg)"
            stroke="var(--color-border)"
          />
          {shown.map((word) => {
            const [x, y] = WORDS[word];
            const px = x * SCALE;
            const py = y * SCALE;
            const isAdded = added.includes(word);
            const color = isAdded ? "var(--color-green-dark)" : "var(--color-accent)";
            const { dx, dy, anchor } = labelPlacements.get(word)!;
            return (
              <g key={word}>
                <circle cx={px} cy={py} r={4.5} fill={color} />
                <text
                  x={px + dx}
                  y={py + dy}
                  textAnchor={anchor}
                  fontSize={FONT_SIZE}
                  fontFamily="monospace"
                  fill="var(--color-ink)"
                >
                  {word}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            list="embedding-space-words"
            placeholder="Type a word to place it on the map…"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)] outline-none"
          />
          <datalist id="embedding-space-words">
            {ALL_WORDS.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
          <button
            onClick={submit}
            className="shrink-0 rounded-md bg-[var(--color-green)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Add
          </button>
        </div>

        {notFound && (
          <p className="mt-2 mb-0 text-xs text-[var(--color-ink-soft)]">
            "{notFound}" isn't in this demo's vocabulary — try a common word like{" "}
            <code>happy</code>, <code>river</code>, or <code>computer</code> (start typing for suggestions).
          </p>
        )}

        {added.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {added.map((word) => (
              <button
                key={word}
                onClick={() => removeWord(word)}
                className="rounded-full bg-[var(--color-green-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-green-dark)]"
              >
                {word} ✕
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
