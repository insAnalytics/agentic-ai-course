"""
Write public/data/eval/faithfulness/items.json for Module 7, Lesson 6's faithfulness judge: about 40 of the judge's
items for Simar to label, blind, on the same material the judge saw, so Lesson 7's method can measure it.

- Dev question runs of the two baseline batches only, answered, and judged pass or fail. Runs Lesson 3's reading
  labelled, and runs whose correctness Simar already labelled, are left out, so earlier labels can't be remembered.
- Stratified by the judge's verdict and by whether the answer cites any source, with fixed quotas that oversample the
  rarer strata. The file records how many runs each stratum holds, so the labels can be weighted back to the runs.
- Each item is "dev" (for revising the rubric) or "test" (measured once), alternating within each stratum after a
  seeded shuffle.

    python scripts/eval/build_faithfulness_labelling.py            # writes the file, from judges/gemma-faithfulness.json
    python scripts/eval/build_faithfulness_labelling.py --check    # fails if it's out of date
"""

import argparse
import json
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from judges import FORMAT_VERDICT, RUBRIC_FAITHFULNESS, faithfulness_items  # noqa: E402

ROOT = HERE.parents[1]
DATA = ROOT / "public" / "data" / "eval"
OUT = DATA / "faithfulness" / "items.json"
SEED = 20261004
# (judge verdict, whether the answer cites a source) -> how many items
QUOTAS = {"pass/cited": 12, "pass/uncited": 10, "fail/cited": 10, "fail/uncited": 8}
RUNS = ("baseline-a", "baseline-b")


def build(judge_file: Path) -> dict:
    decisions = {r["item_id"]: r["decision"] for r in json.loads(judge_file.read_text(encoding="utf-8"))["results"]}
    results = json.loads((DATA / "ablations" / "results.json").read_text(encoding="utf-8"))
    # whether each trial's answer cited a source, from the regraded results ("baseline" is batch a)
    cited = {}
    for condition, run in (("baseline", "baseline-a"), ("baseline-b", "baseline-b")):
        for task, rows in results["conditions"][condition].items():
            for n, row in enumerate(rows):
                cited[f"{run}/{task}/{n}"] = row["cited"]
    read_before = {e["trial_id"] for e in json.loads((DATA / "reading" / "sample.json").read_text(encoding="utf-8"))["entries"]}
    labelled = {i["item_id"].split(":", 1)[1] for i in json.loads((DATA / "judge-labels" / "items.json").read_text(encoding="utf-8"))["items"]}
    pools = {key: [] for key in QUOTAS}
    for item in faithfulness_items(RUNS):
        if item["split"] != "dev" or item["trial_id"] in read_before or item["trial_id"] in labelled:
            continue
        decision = decisions.get(item["item_id"])
        if decision not in ("pass", "fail"):
            continue
        key = f"{decision}/{'cited' if cited[item['trial_id']] else 'uncited'}"
        pools[key].append(item)
    rng = random.Random(SEED)
    chosen = []
    for key, quota in QUOTAS.items():
        pool = sorted(pools[key], key=lambda i: i["item_id"])
        picked = rng.sample(pool, min(quota, len(pool)))
        for position, item in enumerate(picked):
            shown = item["messages"][1]["content"][len(RUBRIC_FAITHFULNESS):].removesuffix(FORMAT_VERDICT).strip()
            chosen.append({"item_id": item["item_id"], "kind": "faithfulness", "stratum": key,
                           "split": "dev" if position % 2 == 0 else "test", "rubric": RUBRIC_FAITHFULNESS,
                           "shown": shown})
    rng.shuffle(chosen)
    return {"version": 1, "seed": SEED, "judge_file": judge_file.name,
            "instructions": "For each item, read the question, what the assistant's tools returned and its final "
                            "answer, and decide as the rubric asks: PASS, FAIL or UNCLEAR. Judge only from what's "
                            "shown: a claim the tool results don't state or directly imply is unsupported, even if "
                            "you know it's true. A note is optional; for a FAIL, naming the first unsupported claim "
                            "helps.",
            "strata": {key: len(pool) for key, pool in pools.items()}, "items": chosen}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--judge-file", default=str(DATA / "judges" / "gemma-faithfulness.json"))
    args = parser.parse_args()
    text = json.dumps(build(Path(args.judge_file)), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "items.json is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    data = json.loads(text)
    print(f"wrote {OUT.relative_to(ROOT)}: {len(data['items'])} items; pools {data['strata']}")


if __name__ == "__main__":
    main()
