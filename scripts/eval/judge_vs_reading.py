"""
Write public/data/eval/judge-labels/vs-reading.json for Lesson 7's first concept: every run of Module 5's questions that
Lesson 3's reading labelled, with the reading's verdict (Simar's where he read it, otherwise Claude's), both judges'
correctness verdicts, and whether every source the answer cites was returned by a tool in the run.

    python scripts/eval/judge_vs_reading.py            # writes the file
    python scripts/eval/judge_vs_reading.py --check    # fails if it's out of date
"""

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import cited_ids  # noqa: E402

ROOT = HERE.parents[1]
READING = ROOT / "public" / "data" / "eval" / "reading"
OUT = ROOT / "public" / "data" / "eval" / "judge-labels" / "vs-reading.json"


def build() -> dict:
    labels = {}
    for name, reader in (("labels-simar-v2", "simar"), ("labels-claude", "claude")):
        for label in json.loads((READING / f"{name}.json").read_text(encoding="utf-8"))["labels"]:
            labels.setdefault(label["trial_id"], {**label, "reader": reader})
    verdicts = {}
    for judge in ("gemma", "qwen9b"):
        for r in json.loads((ROOT / "public/data/eval/judges" / f"{judge}.json").read_text(encoding="utf-8"))["results"]:
            if r["kind"] == "correctness":
                verdicts.setdefault(r["trial_id"], {})[judge] = r["decision"]
    trials = {t["trial_id"]: t for t in json.loads((ROOT / "public/data/eval/main/baseline-a.json").read_text(encoding="utf-8"))["trials"]}
    rows = []
    for trial_id, label in sorted(labels.items()):
        if trial_id not in verdicts or label["verdict"] not in ("pass", "fail"):
            continue
        trial = trials[trial_id]
        retrieved = {s for c in trial["tool_log"] for s in re.findall(r'<source id="([^"]+)"', c["output"])}
        rows.append({"trial_id": trial_id, "reading": label["verdict"], "reader": label["reader"],
                     "gemma": verdicts[trial_id]["gemma"], "qwen9b": verdicts[trial_id]["qwen9b"],
                     "citations_ok": cited_ids(trial["answers"][-1]) <= retrieved})
    return {"version": 1, "rows": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "vs-reading.json is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(json.loads(text)['rows'])} runs)")


if __name__ == "__main__":
    main()
