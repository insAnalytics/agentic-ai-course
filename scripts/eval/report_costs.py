"""
Write public/data/eval/report/costs.json for Lesson 12 (the evaluation report): for each graded condition, every
trial's agent tokens (prompt plus generated, summed over the agent's model calls) and how many support-judge calls the
checks made inside the loop. Those in-loop judge calls were counted when the layered runs were made, but their tokens
weren't recorded, so a layered run's token count leaves them out. The script checks that each run file's trial tokens
add up to the run's recorded totals in main/settings.json.

    python scripts/eval/report_costs.py            # writes the file
    python scripts/eval/report_costs.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "public" / "data" / "eval" / "main"
OUT = ROOT / "public" / "data" / "eval" / "report" / "costs.json"
# each condition in ablations/results.json, and the run files behind it
CONDITIONS = {
    "baseline": ("baseline-a", "suite-2a-a"),
    "fp8": ("fp8-a", "fp8-suite-a"),
    "prompt-v2": ("prompt-v2-a", "prompt-v2-suite-a"),
    "compaction": ("compaction-a", "compaction-suite-a"),
    "no-labels": ("no-labels-a", "no-labels-suite-a"),
    "layers-v2": ("layers-v2-a", "layers-v2-suite-a"),
    "layers": ("layers-a", "layers-suite-a"),
}


def build() -> dict:
    recorded = json.loads((MAIN / "settings.json").read_text(encoding="utf-8"))["costs"]
    conditions = {}
    for condition, runs in CONDITIONS.items():
        trials = {}
        for run in runs:
            data = json.loads((MAIN / f"{run}.json").read_text(encoding="utf-8"))
            total = 0
            for trial in data["trials"]:
                tokens = sum(call["prompt_tokens"] + call["completion_tokens"] for call in trial["calls"])
                total += tokens
                trials[f"{trial['task_id']}/{trial['trial']}"] = {
                    "tokens": tokens, "judge_calls": (trial.get("layer_cost") or {}).get("judge_calls", 0)}
            expected = recorded[run]["prompt_tokens"] + recorded[run]["generated_tokens"]
            assert total == expected, f"{run}: trials add up to {total} tokens, settings.json records {expected}"
        conditions[condition] = trials
    return {"version": 1, "conditions": conditions}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else f"{OUT.name} is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(text) / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
