"""
Write public/data/eval/suite/grader-cases.json for Lesson 5's comprehensive sandbox: a handful of real runs, each
with its final answer, tool calls, the source ids its tools returned, its final state and its task's current
checks, plus the registry as every trial starts it.

    python scripts/eval/grader_cases.py            # writes the file
    python scripts/eval/grader_cases.py --check    # fails if it's out of date
"""

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "suite" / "grader-cases.json"
CASES = ["baseline-a/a02/0", "baseline-a/a03/0", "baseline-a/a19/0", "baseline-a/m04/4", "baseline-a/a14/4",
         "baseline-b/m03/1", "suite-2a-a/s06/0", "suite-2a-a/s24/4", "suite-2a-a/s29/0", "suite-2a-a/s19/0"]


def build() -> dict:
    tasks = {**{t.id: t for t in load_tasks(HERE / "tasks" / "main.json")},
             **{t.id: t for t in load_tasks(HERE / "tasks" / "suite-2a.json")}}
    runs = {}
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((ROOT / "public/data/eval/main" / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            if trial["trial_id"] in CASES:
                runs[trial["trial_id"]] = trial
    cases = []
    for trial_id in CASES:
        trial, task = runs[trial_id], tasks[trial_id.split("/")[1]]
        retrieved = sorted({sid for call in trial["tool_log"] for sid in re.findall(r'<source id="([^"]+)"', call["output"])})
        cases.append({"trial_id": trial_id, "request": task.request, "checks": task.expect["checks"],
                      "answer": trial["answers"][-1],
                      "tool_log": [{"tool": c["tool"], "input": c["input"], "ok": c["ok"]} for c in trial["tool_log"]],
                      "retrieved": retrieved, "final": trial["final_state"]})
    return {"version": 1, "initial": initial_registry(tempfile.mkdtemp(prefix="initial-")), "cases": cases}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "grader-cases.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
