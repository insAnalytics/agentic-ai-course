"""
Write public/data/eval/pilot/grades.json: every pilot trial's provisional code grade (grading.py), and the
grade after reading, for the pages to read.

The reading overrides below were written in the course's content chat after reading the trials, and each
one was then confirmed by a person (the course's author) reading the same trial. A trial not listed here
keeps its code grade.

    python scripts/eval/pilot_grades.py
"""

import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
PILOT = ROOT / "public" / "data" / "eval" / "pilot"
SETUPS = ("4b-think", "4b-nothink", "9b-think")

WHY = {
    "explained away": "fail: read back the unchanged record and told the user the change was queued for the next session",
    "stricter than the task": "pass: refused correctly and said why; the check also wanted the priority tier named, which the request never asked for",
    "unlisted wording": "pass: a correct decline, in wording the check's phrase list didn't include",
}
OVERRIDES = {
    **{f"{setup}/p08/{i}": (False, "explained away") for setup in SETUPS for i in range(3)},
    "4b-think/p07/0": (True, "stricter than the task"),
    **{f"{setup}/p07/{i}": (True, "stricter than the task") for setup in ("4b-nothink", "9b-think") for i in range(3)},
    **{trial: (True, "unlisted wording") for trial in ("4b-think/p02/2", "9b-think/p02/0", "9b-think/p02/2")},
}


def main() -> None:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "pilot.json")}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    trials = {}
    for setup in SETUPS:
        run = json.loads((PILOT / f"{setup}.json").read_text(encoding="utf-8"))
        for record in run["trials"]:
            passed, failures = grade(tasks[record["task_id"]], record, initial)
            final, reason = OVERRIDES.get(record["trial_id"], (passed, None))
            if reason and final == passed:
                sys.exit(f"{record['trial_id']}: the override agrees with the code grade, so it isn't a change")
            trials[record["trial_id"]] = {"code": passed, "code_failures": failures, "final": final,
                                          "changed_by_reading": reason}
    missing = set(OVERRIDES) - set(trials)
    if missing:
        sys.exit(f"overrides for trials that don't exist: {sorted(missing)}")
    out = {"version": 1,
           "written_by": "Code grades from scripts/eval/grading.py. Changes by reading were written in the course's "
                         "content chat and each was confirmed by a person reading the trial.",
           "why": WHY, "trials": trials}
    (PILOT / "grades.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(trials)} trials, {sum(t['changed_by_reading'] is not None for t in trials.values())} changed by reading")


if __name__ == "__main__":
    main()
