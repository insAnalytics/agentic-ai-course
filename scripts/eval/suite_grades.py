"""
Write public/data/eval/suite/grades-2a.json for Lesson 4's pages: for each phase 2a suite task, its code-check
result on every trial of suite-2a-a.json, and whether its hand-written reference run passes its own checks.
Grading needs the registry world, which is heavy for a browser page, so it's done here. These are the grades Lesson 4
shows: the checks of task file version 2.

    python scripts/eval/suite_grades.py            # writes the file
    python scripts/eval/suite_grades.py --check    # fails if it's out of date
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
from main_selftest import run_scripted  # noqa: E402

ROOT = HERE.parents[1]
RUN = ROOT / "public" / "data" / "eval" / "main" / "suite-2a-a.json"
OUT = ROOT / "public" / "data" / "eval" / "suite" / "grades-2a.json"


def checks_for(task) -> dict:
    """The checks Lesson 4 graded the suite with: task file version 2. A task changed later keeps those as
    checks_before_v3 (Lesson 5 shows the change)."""
    return task.expect.get("checks_before_v3", task.expect["checks"])


def build() -> dict:
    tasks = load_tasks(HERE / "tasks" / "suite-2a.json")
    run = json.loads(RUN.read_text(encoding="utf-8"))
    directory = tempfile.mkdtemp(prefix="suite-grades-")
    initial = initial_registry(directory)
    trials = {}
    for record in run["trials"]:
        task = next(t for t in tasks if t.id == record["task_id"])
        passed, _ = grade(dataclasses.replace(task, checks=checks_for(task)), record, initial)
        trials.setdefault(task.id, []).append(passed)
    references = {}
    for task in tasks:
        record = run_scripted(task, task.reference, directory)
        references[task.id], _ = grade(dataclasses.replace(task, checks=checks_for(task)), record, initial)
    return {"version": 1, "run": RUN.relative_to(ROOT).as_posix(), "grader": "scripts/eval/grading.py, matcher version 2",
            "tasks": [{"id": t.id, "kind": t.kind, "category": t.source.rsplit(" ", 1)[-1], "split": t.split,
                       "request": t.request, "expect": t.expect} for t in tasks],
            "trials": trials, "reference_passes": references}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "grades-2a.json is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
