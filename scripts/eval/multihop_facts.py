"""
Write public/data/eval/suite/multihop-baseline.json: for every baseline run of Module 5's q29 (a multi-hop
question) and q39 (one with no answer in the documents), the searches it made, whether it found the section
that answers q29 (D08:1), whether its answer gave q29's threshold, and, for q39, Claude's reading of whether
it rightly declined. Module 5 promised to find out whether a second search answers q29 and whether the agent
rightly declines q39.

    python scripts/eval/multihop_facts.py            # writes the file
    python scripts/eval/multihop_facts.py --check    # fails if it's out of date
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNS = [ROOT / "public" / "data" / "eval" / "main" / f"baseline-{batch}.json" for batch in "ab"]
OUT = ROOT / "public" / "data" / "eval" / "suite" / "multihop-baseline.json"

# Claude's reading of the q39 runs (content chat): did it rightly decline to name an engineer?
Q39_READING = {
    "baseline-a/q39/0": (False, "stopped by the 10-step limit without answering"),
    "baseline-a/q39/2": (False, "said support-team handled it, because it owns the affected agents"),
    "baseline-a/q39/3": (False, "said the documents show support-team's on-call engineer was paged; they say only 'the on-call engineer'"),
}


def build() -> dict:
    rows = []
    for path in RUNS:
        for trial in json.loads(path.read_text(encoding="utf-8"))["trials"]:
            if trial["task_id"] not in ("q29", "q39"):
                continue
            searches = [call for call in trial["tool_log"] if call["tool"] == "search_docs"]
            answer = trial["answers"][-1]
            row = {"trial_id": trial["trial_id"], "task_id": trial["task_id"], "tool_calls": len(trial["tool_log"]),
                   "searches": len(searches),
                   "found_D08_1": any('id="D08:1"' in call["output"] for call in searches),
                   "answer_start": " ".join(answer.split())[:160]}
            if trial["task_id"] == "q29":
                row["gave_threshold"] = "5%" in answer and re.search(r"15[- ]minute", answer) is not None
            else:
                declined, note = Q39_READING.get(trial["trial_id"], (True, "says the records don't name the engineer"))
                row["declined_rightly"], row["reading"] = declined, note
            rows.append(row)
    return {"version": 1, "runs": [p.relative_to(ROOT).as_posix() for p in RUNS],
            "q39_read_by": "Claude, in the course's content chat; every q39 run was read in full", "rows": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "multihop-baseline.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
