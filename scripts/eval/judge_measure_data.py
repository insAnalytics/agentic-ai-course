"""
Write public/data/eval/judge-labels/measure.json for Lesson 7's pages: each labelled item with its kind, split and
stratum, Simar's label (first pass and after re-review), both judges' verdicts with the phase 3 rubrics (version 1) and
the revised ones (version 2), whether the run ended without an answer, and whether its reference changed after
labelling in a way that could change the label (q19, whose reference Simar disputed: those items are left out of
the measurement; q40-allowed's change only removed a description of the other kind of reader, so its labels stand);
how each judge decided on every dev run of each kind, for correcting pass rates; and, for set F, how many replies
fall in each labelling stratum and how each judge decided by premise.

    python scripts/eval/judge_measure_data.py            # writes the file
    python scripts/eval/judge_measure_data.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
LABELS = ROOT / "public" / "data" / "eval" / "judge-labels"
JUDGES = ROOT / "public" / "data" / "eval" / "judges"
OUT = LABELS / "measure.json"
# a task whose reference answer changed after labelling in a way that could change the label
REFERENCE_DISPUTED = ("q19",)


def build() -> dict:
    items = json.loads((LABELS / "items.json").read_text(encoding="utf-8"))["items"]
    first = {l["item_id"]: l for l in json.loads((LABELS / "labels-judges-simar.json").read_text(encoding="utf-8"))["labels"]}
    revised = {l["item_id"]: l for l in json.loads((LABELS / "labels-judges-simar-v2.json").read_text(encoding="utf-8"))["labels"]}
    verdicts = {}
    for judge in ("gemma", "qwen9b"):
        for version, suffix in ((1, ""), (2, "-v2")):
            for r in json.loads((JUDGES / f"{judge}{suffix}.json").read_text(encoding="utf-8"))["results"]:
                verdicts.setdefault(r["item_id"], {})[f"{judge}_v{version}"] = r["decision"]
                verdicts[r["item_id"]]["trial_id"] = r.get("trial_id")
    no_answer = set()
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((ROOT / "public/data/eval/main" / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            if trial["answers"] and trial["answers"][-1].startswith("stopped after"):
                no_answer.add(trial["trial_id"])
    rows = []
    for item in items:
        v = verdicts[item["item_id"]]
        trial_id = v.pop("trial_id")
        rows.append({"item_id": item["item_id"], "kind": item["kind"], "split": item["split"], "stratum": item["stratum"],
                     "label_first": first[item["item_id"]]["verdict"], "label": revised[item["item_id"]]["verdict"],
                     "note": revised[item["item_id"]]["note"], **v, "no_answer": trial_id in no_answer,
                     "excluded": item["kind"] == "correctness" and any(f"/{t}/" in item["item_id"] for t in REFERENCE_DISPUTED)})
    # how each judge decided on every dev run of each kind, for correcting pass rates (Lesson 7, concept 4)
    population = {}
    for judge in ("gemma", "qwen9b"):
        for version, suffix in ((1, ""), (2, "-v2")):
            counts = {}
            for r in json.loads((JUDGES / f"{judge}{suffix}.json").read_text(encoding="utf-8"))["results"]:
                if r["kind"] in ("correctness", "relevance", "false_report", "planted", "broken_result") and r["split"] == "dev":
                    kind = counts.setdefault(r["kind"], {"pass": 0, "fail": 0, "other": 0})
                    kind[r["decision"] if r["decision"] in ("pass", "fail") else "other"] += 1
            population[f"{judge}_v{version}"] = counts
    # set F: how many of the 1,600 premise replies fall in each labelling stratum (premise, the marker's outcome,
    # Gemma's phase 3 verdict), and how the revised judges decided, by premise (Lesson 7, concept 5)
    premise_strata, premise_judged = {}, {}
    for r in json.loads((JUDGES / "gemma.json").read_text(encoding="utf-8"))["results"]:
        if r["kind"] == "premise":
            key = f"{r['premise']} {r['marker_outcome']} {r['decision']}"
            premise_strata[key] = premise_strata.get(key, 0) + 1
    for judge in ("gemma", "qwen9b"):
        for version, suffix in ((1, ""), (2, "-v2")):
            counts = {}
            for r in json.loads((JUDGES / f"{judge}{suffix}.json").read_text(encoding="utf-8"))["results"]:
                if r["kind"] == "premise":
                    side = counts.setdefault(r["premise"], {"pass": 0, "fail": 0, "other": 0})
                    side[r["decision"] if r["decision"] in ("pass", "fail") else "other"] += 1
            premise_judged[f"{judge}_v{version}"] = counts
    return {"version": 1, "rows": rows, "population": population,
            "premise_strata": dict(sorted(premise_strata.items())), "premise_judged": premise_judged}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "measure.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(json.loads(text)['rows'])} items)")


if __name__ == "__main__":
    main()
