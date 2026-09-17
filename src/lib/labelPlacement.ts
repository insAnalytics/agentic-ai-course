export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

export type Anchor = "start" | "middle" | "end";

export interface Placement {
  dx: number;
  dy: number;
  anchor: Anchor;
}

// Real embedding coordinates cluster tightly (that's the whole point of
// every embedding-space demo) — two points can land close enough that a
// naive fixed "always above the dot" label collides into unreadable
// overlapping text. Each point tries a ring of candidate positions around
// its dot and takes the first one that doesn't collide with an
// already-placed label's bounding box.
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

function labelBox(px: number, py: number, labelWidth: number, labelHeight: number, placement: Placement): Box {
  const { dx, dy, anchor } = placement;
  const centerX = px + dx + (anchor === "start" ? labelWidth / 2 : anchor === "end" ? -labelWidth / 2 : 0);
  const centerY = py + dy - labelHeight / 2;
  return {
    x1: centerX - labelWidth / 2,
    y1: centerY - labelHeight / 2,
    x2: centerX + labelWidth / 2,
    y2: centerY + labelHeight / 2,
  };
}

export interface LabelPoint {
  key: string;
  px: number;
  py: number;
  /** Rendered label text — used only to estimate label width via charWidth. */
  label: string;
}

/** fontSize * ~0.62 is a reasonable monospace glyph-advance estimate. */
export function placeLabels(points: LabelPoint[], charWidth: number, labelHeight: number): Map<string, Placement> {
  const placed = new Map<string, Placement>();
  const boxes: Box[] = [];
  for (const { key, px, py, label } of points) {
    const width = label.length * charWidth;
    let chosen = CANDIDATES[0];
    let chosenBox = labelBox(px, py, width, labelHeight, chosen);
    for (const candidate of CANDIDATES) {
      const box = labelBox(px, py, width, labelHeight, candidate);
      if (!boxes.some((b) => overlaps(box, b))) {
        chosen = candidate;
        chosenBox = box;
        break;
      }
    }
    placed.set(key, chosen);
    boxes.push(chosenBox);
  }
  return placed;
}
