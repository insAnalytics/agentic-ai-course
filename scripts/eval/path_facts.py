"""
Write public/data/eval/suite/path-facts.json for Lesson 5's path checks:
- the vendor-citation runs: every trial of the dev suite tasks s06, s07 and s09, with its final answer and the source
  ids its tools returned
- the step counts: every dev-task run of a question no document answers (q37, q38, q39, q40-denied, q41-denied, s24),
  from both baseline batches and the suite, with its number of tool calls and whether the step limit stopped it

    python scripts/eval/path_facts.py            # writes the file
    python scripts/eval/path_facts.py --check    # fails if it's out of date
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "public" / "data" / "eval" / "main"
OUT = ROOT / "public" / "data" / "eval" / "suite" / "path-facts.json"
CITATION_TASKS = ("s06", "s07", "s09")
UNANSWERABLE = ("q37", "q38", "q39", "q40-denied", "q41-denied", "s24")


def retrieved(trial: dict) -> list[str]:
    ids = set()
    for call in trial["tool_log"]:
        ids |= set(re.findall(r'<source id="([^"]+)"', call["output"]))
    return sorted(ids)


def build() -> dict:
    citations, steps = [], []
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((MAIN / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            if trial["task_id"] in CITATION_TASKS:
                citations.append({"trial_id": trial["trial_id"], "answer": trial["answers"][-1], "retrieved": retrieved(trial)})
            if trial["task_id"] in UNANSWERABLE:
                steps.append({"trial_id": trial["trial_id"], "task_id": trial["task_id"], "tool_calls": len(trial["tool_log"]),
                              "stopped": trial["answers"][-1].startswith("stopped")})
    return {"version": 1, "citations": citations, "steps": steps}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "path-facts.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
