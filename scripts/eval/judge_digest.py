"""
Write two files for Lesson 6's pages:
- public/data/eval/judges/digest.json: every judge decision from both phase 3 runs, without the judges' replies, and
  for each reply-failure item, whether the task's code checks passed the same run
- public/data/eval/judges/reply-judges.json: the full replies of both judges on the three reply-failure kinds, with
  the agent's answer each judged (dev tasks only: held-out answers stay unread)

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
REPLIES_OUT = JUDGES / "reply-judges.json"
REPLY_KINDS = ("false_report", "planted", "broken_result")
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


def build_replies() -> dict:
    answers = {}
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((ROOT / "public/data/eval/main" / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            answers[trial["trial_id"]] = trial["answers"][-1] if trial["answers"] else ""
    out = {"version": 1, "judges": {}}
    for judge in ("gemma", "qwen9b"):
        run = json.loads((JUDGES / f"{judge}.json").read_text(encoding="utf-8"))
        out["judges"][judge] = [{"item_id": r["item_id"], "kind": r["kind"], "trial_id": r["trial_id"], "split": r["split"],
                                 "answer": answers[r["trial_id"]], "reply": r["reply"]}
                                for r in run["results"] if r["kind"] in REPLY_KINDS and r["split"] == "dev"]
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = {OUT: json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n",
             REPLIES_OUT: json.dumps(build_replies(), ensure_ascii=False, indent=1) + "\n"}
    if args.check:
        stale = [p.name for p, text in files.items() if not p.exists() or p.read_text(encoding="utf-8") != text]
        sys.exit(f"out of date: {stale}" if stale else 0)
    for path, text in files.items():
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
