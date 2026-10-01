"""
Write public/data/eval/reading/code-grades.json: the provisional code checks (grading.py, with each task's
expect.checks) applied to the 100 traces in the reading sample, for comparison with what people judged.
Only registry tasks and conversations have code checks; questions are graded in later lessons. These are the
grades Lesson 3 shows: the checks as first written and the first version of the phrase matcher, both kept so
the file can be reproduced after later lessons improved them.

    python scripts/eval/reading_code_grades.py            # writes the file
    python scripts/eval/reading_code_grades.py --check    # fails if it's out of date
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
READING = ROOT / "public" / "data" / "eval" / "reading"
RUN = ROOT / "public" / "data" / "eval" / "main" / "baseline-a.json"


def build() -> dict:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "main.json")}
    sample = json.loads((READING / "sample.json").read_text(encoding="utf-8"))
    run = json.loads(RUN.read_text(encoding="utf-8"))
    trials = {trial["trial_id"]: trial for trial in run["trials"]}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    grades = {}
    for entry in sample["entries"]:
        task = tasks[entry["task_id"]]
        # the checks as first written: Lesson 4 changed some after reading their runs (each keeps its first
        # version as checks_v1), and Lesson 3 shows these grades as they were
        checks = task.expect.get("checks_v1", task.expect.get("checks"))
        if checks is None:
            continue
        passed, failures = grade(dataclasses.replace(task, checks=checks), trials[entry["trial_id"]], initial, version=1)
        grades[entry["trial_id"]] = {"code": passed, "failures": failures, "checks": checks}
    return {"version": 1, "grader": "scripts/eval/grading.py with each task's expect.checks, as in main_report.py",
            "grades": grades}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    path = READING / "code-grades.json"
    if args.check:
        sys.exit(0 if path.exists() and path.read_text(encoding="utf-8") == text else "code-grades.json is out of date")
    path.write_text(text, encoding="utf-8")
    print(f"wrote {len(json.loads(text)['grades'])} code grades to {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
