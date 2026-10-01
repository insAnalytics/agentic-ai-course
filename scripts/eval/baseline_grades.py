"""
Write public/data/eval/suite/baseline-grades.json for Lesson 4's pages: for each task in the main pool that has
code checks (the registry tasks and conversations), its split and kind, and its current checks' result on every
trial of both baseline batches. Grading needs the registry world, so it's done here.

    python scripts/eval/baseline_grades.py            # writes the file
    python scripts/eval/baseline_grades.py --check    # fails if it's out of date
"""

import argparse
import dataclasses
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
RUNS = [ROOT / "public" / "data" / "eval" / "main" / f"baseline-{batch}.json" for batch in "ab"]
OUT = ROOT / "public" / "data" / "eval" / "suite" / "baseline-grades.json"


def build() -> dict:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "main.json")}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    trials = {}
    for path in RUNS:
        for record in json.loads(path.read_text(encoding="utf-8"))["trials"]:
            task = tasks[record["task_id"]]
            if "checks" not in task.expect:
                continue
            passed, _ = grade(dataclasses.replace(task, checks=task.expect["checks"]), record, initial)
            trials.setdefault(task.id, []).append(passed)
    return {"version": 1, "runs": [p.relative_to(ROOT).as_posix() for p in RUNS],
            "grader": "scripts/eval/grading.py, matcher version 2, tasks/main.json version 2",
            "tasks": [{"id": t, "kind": tasks[t].kind, "split": tasks[t].split,
                       "conversation": tasks[t].user is not None} for t in trials],
            "trials": trials}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "baseline-grades.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
