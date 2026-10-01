"""
Write public/data/eval/judges/digest.json for Lesson 6's pages: every judge decision from both phase 3 runs, without
the judges' replies (each page loads only the replies it shows, from the run files), and for each reply-failure
item, whether the task's code checks passed the same run.

    python scripts/eval/judge_digest.py            # writes the file
    python scripts/eval/judge_digest.py --check    # fails if it's out of date
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
JUDGES = ROOT / "public" / "data" / "eval" / "judges"
OUT = JUDGES / "digest.json"
KEEP = ("item_id", "kind", "trial_id", "trial_ids", "task_id", "split", "order", "question_id", "premise", "prompt",
        "sample", "marker_outcome", "decision")


def code_passes() -> dict:
    tasks = {**{t.id: t for t in load_tasks(HERE / "tasks" / "main.json")},
             **{t.id: t for t in load_tasks(HERE / "tasks" / "suite-2a.json")}}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    passes = {}
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((ROOT / "public/data/eval/main" / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            task = tasks[trial["task_id"]]
            if "checks" in task.expect:
                passes[trial["trial_id"]], _ = grade(dataclasses.replace(task, checks=task.expect["checks"]), trial, initial)
    return passes


def build() -> dict:
    code = code_passes()
    out = {"version": 1, "judges": {}}
    for judge in ("gemma", "qwen9b"):
        run = json.loads((JUDGES / f"{judge}.json").read_text(encoding="utf-8"))
        rows = []
        for result in run["results"]:
            row = {k: result[k] for k in KEEP if k in result}
            if result["kind"] in ("false_report", "planted", "broken_result"):
                row["code_pass"] = code.get(result["trial_id"])
            rows.append(row)
        out["judges"][judge] = {"model": run["model"], "results": rows}
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "digest.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
