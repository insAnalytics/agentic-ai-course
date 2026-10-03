"""
Write public/data/eval/faithfulness/measure.json for Lessons 6 and 7: the faithfulness judge's verdicts in a compact
form, so a page can load them without the full judge runs.

- "runs": for each judged run, how many of its dev question runs each rubric version passed and failed.
- "strata": the labelling pool's size in each stratum, from items.json, for weighting the labels.
- "labelled": one row per labelled item, with its stratum and split, Simar's first-pass and second-pass labels, and
  both judge versions' verdicts.
- "examples": the version 1 judge's full replies on the items the lessons quote.

    python scripts/eval/faithfulness_measure.py            # writes the file
    python scripts/eval/faithfulness_measure.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "public" / "data" / "eval"
OUT = DATA / "faithfulness" / "measure.json"
EXAMPLES = ("faithfulness:baseline-a/q22/0", "faithfulness:baseline-b/q04/1")


def build() -> dict:
    judged = {version: {r["item_id"]: r for r in json.loads((DATA / "judges" / f"gemma-faithfulness{suffix}.json")
                                                            .read_text(encoding="utf-8"))["results"]}
              for version, suffix in (("v1", ""), ("v2", "-v2"))}
    runs = {}
    for version, results in judged.items():
        for r in results.values():
            if r["split"] != "dev":
                continue
            counts = runs.setdefault(r["trial_id"].split("/")[0], {}).setdefault(version, {"pass": 0, "fail": 0, "other": 0})
            counts[r["decision"] if r["decision"] in ("pass", "fail") else "other"] += 1
    items = json.loads((DATA / "faithfulness" / "items.json").read_text(encoding="utf-8"))
    first = {l["item_id"]: l["verdict"] for l in json.loads((DATA / "faithfulness" / "labels-faithfulness-simar.json").read_text(encoding="utf-8"))["labels"]}
    second = {l["item_id"]: l["verdict"] for l in json.loads((DATA / "faithfulness" / "labels-faithfulness-simar-v2.json").read_text(encoding="utf-8"))["labels"]}
    labelled = [{"item_id": i["item_id"], "stratum": i["stratum"], "split": i["split"], "label_first": first[i["item_id"]],
                 "label": second[i["item_id"]], "v1": judged["v1"][i["item_id"]]["decision"],
                 "v2": judged["v2"][i["item_id"]]["decision"]} for i in sorted(items["items"], key=lambda i: i["item_id"])]
    examples = {item: judged["v1"][item]["reply"] for item in EXAMPLES}
    return {"version": 1, "runs": dict(sorted(runs.items())), "strata": items["strata"], "labelled": labelled,
            "examples": examples}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "measure.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(text) / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
