"""
Write public/data/eval/judges/question-runs.json for Lesson 6's comprehensive sandbox: the first two runs of every
dev question in baseline batch a, each with its final answer, the source ids its tools returned, whether it ended
without an answer, and Gemma 4 31B's correctness and relevance replies.

    python scripts/eval/question_runs.py            # writes the file
    python scripts/eval/question_runs.py --check    # fails if it's out of date
"""

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "judges" / "question-runs.json"


def build() -> dict:
    tasks = {t.id: t for t in load_tasks(HERE / "tasks" / "main.json")}
    replies = {r["item_id"]: r["reply"] for r in json.loads((OUT.parent / "gemma.json").read_text(encoding="utf-8"))["results"]}
    runs = []
    for trial in json.loads((ROOT / "public/data/eval/main/baseline-a.json").read_text(encoding="utf-8"))["trials"]:
        task = tasks[trial["task_id"]]
        if not task.source.startswith("queries.json") or task.split != "dev" or trial["trial"] > 1:
            continue
        answer = trial["answers"][-1] if trial["answers"] else ""
        runs.append({"trial_id": trial["trial_id"], "question": task.request, "answer": answer,
                     "no_answer": answer.startswith("stopped after"),
                     "retrieved": sorted({s for c in trial["tool_log"] for s in re.findall(r'<source id="([^"]+)"', c["output"])}),
                     "correctness_reply": replies[f"correctness:{trial['trial_id']}"],
                     "relevance_reply": replies[f"relevance:{trial['trial_id']}"]})
    return {"version": 1, "judge": "google/gemma-4-31B-it", "runs": runs}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "question-runs.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
