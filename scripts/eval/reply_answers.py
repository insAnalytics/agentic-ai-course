"""
Write public/data/eval/suite/reply-answers.json for Lesson 5's reply checks: every baseline and phase 2a suite trial
of a dev task whose checks include answer_includes, with the final answer and the task's phrase checks (current and,
where a task's checks were changed after reading, as first written).

    python scripts/eval/reply_answers.py            # writes the file
    python scripts/eval/reply_answers.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "suite" / "reply-answers.json"
SOURCES = [("tasks/main.json", "baseline-a.json"), ("tasks/main.json", "baseline-b.json"), ("tasks/suite-2a.json", "suite-2a-a.json")]


def build() -> dict:
    rows = []
    for tasks_file, run_file in SOURCES:
        tasks = {task.id: task for task in load_tasks(HERE / tasks_file)}
        for trial in json.loads((ROOT / "public/data/eval/main" / run_file).read_text(encoding="utf-8"))["trials"]:
            task = tasks[trial["task_id"]]
            checks = task.expect.get("checks", {})
            # held-out tasks stay unread, here too
            if task.split != "dev" or not checks.get("answer_includes") or not trial["answers"]:
                continue
            first = task.expect.get("checks_v1", checks)
            rows.append({"trial_id": trial["trial_id"], "task_id": task.id,
                         "answer": trial["answers"][-1], "answer_includes": checks["answer_includes"],
                         "answer_includes_v1": first.get("answer_includes", [])})
    return {"version": 1, "runs": [run for _, run in SOURCES], "trials": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "reply-answers.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
