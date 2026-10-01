"""
Write public/data/eval/suite/end-states.json for Lesson 5's first concept: the registry as every trial starts it,
and the final state, request and expected changes of a few baseline trials chosen to show what an end-state
check sees and misses.

    python scripts/eval/end_states.py            # writes the file
    python scripts/eval/end_states.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "suite" / "end-states.json"
# a right change, two changes, the wrong agent changed, a change nobody asked for, and a lost write reported as done
CHOSEN = ["baseline-a/a02/0", "baseline-a/a22/3", "baseline-a/a19/0", "baseline-a/m04/4", "baseline-a/a14/4"]


def build() -> dict:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "main.json")}
    trials = {t["trial_id"]: t for t in json.loads((ROOT / "public/data/eval/main/baseline-a.json").read_text(encoding="utf-8"))["trials"]}
    rows = []
    for trial_id in CHOSEN:
        trial, task = trials[trial_id], tasks[trial_id.split("/")[1]]
        rows.append({"trial_id": trial_id, "request": task.request, "faults": task.faults,
                     "expected_changes": task.expect["checks"].get("registry", {}),
                     "expected_outbox": task.expect["checks"].get("outbox", {"count": 0}),
                     "final": trial["final_state"], "answer_start": " ".join(trial["answers"][-1].split())[:140]})
    return {"version": 1, "initial": initial_registry(tempfile.mkdtemp(prefix="initial-")), "trials": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "end-states.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
