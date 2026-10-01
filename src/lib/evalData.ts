/**
 * Module 7 (Evaluation) shared setup. Demos that read the pilot's recorded
 * runs pass `dataFiles={pilotData("4b-think")}` (fetched on first Run, see
 * courseData.ts) and start their setup code with LOAD_PILOT. Each run file is
 * 250-600 KB, so a demo lists only the runs it reads.
 */
export function pilotData(...setups: string[]): string[] {
  return ["eval/pilot/tasks.json", ...setups.map((setup) => `eval/pilot/${setup}.json`)];
}

/**
 * Introduced in Module 7 Lesson 1 concept 1; shown there verbatim (keep the
 * two byte-identical: scripts/check-copies.mjs checks it on every build).
 */
export const LOAD_PILOT = String.raw`import json
from pathlib import Path

PILOT = Path("/data/eval/pilot")


def load_pilot(setup: str) -> dict:
    """One pilot run file: "4b-think" (the agent this module evaluates), "4b-nothink" or "9b-think"."""
    return json.loads((PILOT / f"{setup}.json").read_text(encoding="utf-8"))


def load_tasks() -> dict[str, dict]:
    """The pilot's ten tasks by id: the request, and what each run was checked for."""
    return {task["id"]: task for task in json.loads((PILOT / "tasks.json").read_text(encoding="utf-8"))["tasks"]}
`;
