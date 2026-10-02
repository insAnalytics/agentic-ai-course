"""
Write public/data/eval/judge-labels/items.json for Module 7, Lesson 7: about 100 judge items for a person to label,
blind, on the same question and material the judge saw, so each judge can be measured against people.

- Dev tasks only; runs in Lesson 3's reading sample are left out, so earlier labels can't be remembered.
- Stratified within each judge question by what the two judges decided (and, for set F, by the marker's outcome),
  so the set holds passes, fails and disagreements, not just the common case.
- Each item is assigned to "dev" (for revising rubrics) or "test" (measured once), alternating within each stratum
  after a seeded shuffle; 30 items, spread across the questions, are marked for relabelling after three weeks.

    python scripts/eval/build_judge_labelling.py            # writes the file
    python scripts/eval/build_judge_labelling.py --check    # fails if it's out of date
"""

import argparse
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from judges import FORMAT_VERDICT, RUBRICS, all_items  # noqa: E402

ROOT = HERE.parents[1]
JUDGES = ROOT / "public" / "data" / "eval" / "judges"
OUT = ROOT / "public" / "data" / "eval" / "judge-labels" / "items.json"
SEED = 20261002
RELABEL = 30

# (kind, stratum) -> how many items; a stratum is "gemma/qwen" verdicts, with extra keys where noted
QUOTAS = {
    "false_report": {"pass/pass": 3, "fail/pass": 2, "fail/fail": 4},
    "planted": {"pass/pass": 1, "fail/fail": 6},
    "broken_result": {"pass/pass": 2, "pass/fail": 4, "fail/fail": 3},
    "correctness": {"pass/pass": 16, "fail/fail": 10, "pass/fail": 8, "fail/pass": 5, "no answer": 3, "unanswerable": 3},
    "relevance": {"no answer": 4, "pass/fail": 4, "pass/pass": 2},
    "premise": {"false answered pass": 5, "false rejected pass": 2, "false answered fail": 1, "true answered fail": 5,
                "true rejected pass": 4, "true rejected fail": 2, "true answered pass": 1},
}


def decisions() -> dict:
    out = {}
    for judge in ("gemma", "qwen9b"):
        for r in json.loads((JUDGES / f"{judge}.json").read_text(encoding="utf-8"))["results"]:
            out.setdefault(r["item_id"], {})[judge] = r["decision"]
    return out


def stratum(item: dict, verdicts: dict, no_answer: set) -> str | None:
    pair = f"{verdicts.get('gemma')}/{verdicts.get('qwen9b')}"
    if item["kind"] in ("correctness", "relevance") and item["trial_id"] in no_answer:
        return "no answer"
    if item["kind"] == "correctness" and item["task_kind"] == "docs: unanswerable":
        return "unanswerable"
    if item["kind"] == "premise":
        return f"{item['premise']} {item['marker_outcome']} {verdicts.get('gemma')}"
    return pair


def material(item: dict) -> dict:
    """What the judge was shown, split into its rubric and the run, without the format line."""
    content = item["messages"][1]["content"]
    rubric = RUBRICS[item["kind"]]
    shown = content[len(rubric):].removesuffix(FORMAT_VERDICT).strip()
    return {"rubric": rubric, "shown": shown}


def build() -> dict:
    tasks = {}
    for name in ("main.json", "suite-2a.json"):
        for task in json.loads((HERE / "tasks" / name).read_text(encoding="utf-8"))["tasks"]:
            tasks[task["id"]] = task
    read_before = {e["trial_id"] for e in json.loads((ROOT / "public/data/eval/reading/sample.json").read_text(encoding="utf-8"))["entries"]}
    no_answer = set()
    for name in ("baseline-a", "baseline-b", "suite-2a-a"):
        for trial in json.loads((ROOT / "public/data/eval/main" / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            if trial["answers"] and trial["answers"][-1].startswith("stopped after"):
                no_answer.add(trial["trial_id"])
    verdicts = decisions()
    pools = defaultdict(list)
    for item in all_items():
        if item["kind"] not in QUOTAS:
            continue
        if item["kind"] != "premise":
            if item["split"] != "dev" or item["trial_id"] in read_before:
                continue
            item["task_kind"] = tasks[item["task_id"]]["kind"]
        key = stratum(item, verdicts[item["item_id"]], no_answer)
        if key in QUOTAS[item["kind"]]:
            pools[(item["kind"], key)].append(item)
    rng = random.Random(SEED)
    chosen = []
    for kind, quotas in QUOTAS.items():
        for key, n in quotas.items():
            pool = sorted(pools[(kind, key)], key=lambda i: i["item_id"])
            if len(pool) < n:
                sys.exit(f"{kind} / {key}: only {len(pool)} items for a quota of {n}")
            picked = rng.sample(pool, n)
            for position, item in enumerate(picked):
                chosen.append({"item_id": item["item_id"], "kind": kind, "stratum": key,
                               "split": "dev" if position % 2 == 0 else "test", **material(item)})
    rng.shuffle(chosen)
    relabel = sorted(rng.sample([c["item_id"] for c in chosen], RELABEL))
    return {"version": 1, "seed": SEED,
            "instructions": "For each item, read the rubric and what the judge was shown, and decide as the rubric "
                            "asks: PASS, FAIL or UNCLEAR. Judge only from what's shown. A note is optional, but "
                            "useful wherever the rubric didn't settle the case.",
            "relabel_after_weeks": 3, "relabel": relabel, "items": chosen}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "items.json is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    data = json.loads(text)
    print(f"wrote {len(data['items'])} items ({sum(i['split'] == 'test' for i in data['items'])} test), "
          f"{len(data['relabel'])} marked for relabelling -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
