/**
 * Module 6 (Reliability) shared setup. Demos that read the committed model
 * runs pass `dataFiles={reliabilityData("plain", ...)}` (fetched on first
 * Run, see courseData.ts) and start their setup code with LOAD_RUNS. Each
 * run file is 1-2.5 MB, so a demo lists only the runs it reads.
 */
export function reliabilityData(...runs: string[]): string[] {
  return ["reliability/set-e.json", ...runs.map((run) => `reliability/runs/${run}.json`)];
}

/** Introduced in Module 6 Lesson 1 concept 2; shown there verbatim (keep the two byte-identical). */
export const LOAD_RUNS = String.raw`
import json
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_questions() -> dict[str, dict]:
    """Set E's questions by id: wordings, answer, and the fixed context each one is asked with."""
    data = json.loads((DATA / "set-e.json").read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}
`;

/** Module 6 Lesson 1 concept 2's successes, verbatim; later demos that use it without defining it append it. */
export const SUCCESSES = String.raw`
def successes(run: dict) -> dict[str, int]:
    """How many of each question's runs were right."""
    return {r["id"]: sum(reply["correct"] for reply in r["samples"]) for r in run["results"]}
`;
