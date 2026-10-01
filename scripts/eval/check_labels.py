"""
Check a labels file exported from the labelling page (labeller/index.html) against the reading sample: every
trace in the reader's order labelled exactly once, the required fields present, and every value from the lists
in README-labeller.md and the reading standard (standard.md). Prints the counts.

A re-review file (labels-simar-v2.json, with "review_of") must also mark every label "changed" true or false,
correctly, against the first labels it names. Revised labels may keep their earlier values in "<field>_original"
fields, with the reason in the file's "revisions".

    python scripts/eval/check_labels.py labels-simar.json            # exit 1 if anything is wrong
    python scripts/eval/check_labels.py labels-simar.json --partial  # mid-way: unlabelled traces aren't errors
"""

import argparse
import json
import statistics
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
READING = HERE.parents[1] / "public" / "data" / "eval" / "reading"
SAMPLE = READING / "sample.json"
VERDICTS = ("pass", "fail", "unsure")
FAULTS = ("agent", "harness", "task", "simulated_user", "environment", "unclear")
REVISABLE = ("verdict", "first_failure", "fault", "how")
FIELDS = ({"trial_id", "reference_viewed", "seconds", "changed", "standard_version"} | set(REVISABLE)
          | {f"{key}_original" for key in REVISABLE})


def problems_with(label: dict) -> list[str]:
    """What's wrong with one label, given that its trial id is known to be in the reader's order."""
    problems = []
    if extra := set(label) - FIELDS:
        problems.append(f"unknown fields {sorted(extra)}")
    if label.get("verdict") not in VERDICTS:
        problems.append(f"verdict is {label.get('verdict')!r}, not one of {', '.join(VERDICTS)}")
    for key in ("first_failure", "how"):
        if label.get(key) is not None and not isinstance(label[key], str):
            problems.append(f"{key} must be text or null")
    for key in ("fault", "fault_original"):
        if label.get(key) not in (None, "") and label[key] not in FAULTS:  # "" is no fault, as null is
            problems.append(f"{key} is {label[key]!r}, not one of {', '.join(FAULTS)}")
    if "verdict_original" in label and label["verdict_original"] not in VERDICTS:
        problems.append(f"verdict_original is {label['verdict_original']!r}, not one of {', '.join(VERDICTS)}")
    if "changed" in label and not isinstance(label["changed"], bool):
        problems.append("changed must be true or false")
    if label.get("verdict") in ("fail", "unsure"):
        if not (label.get("first_failure") or "").strip():
            problems.append(f"a {label['verdict']} needs the first failure")
        if not label.get("fault"):
            problems.append(f"a {label['verdict']} needs whose fault it was")
    if not isinstance(label.get("reference_viewed"), bool):
        problems.append("reference_viewed must be true or false")
    seconds = label.get("seconds")  # null for labels made without the page, which can't time them
    if seconds is not None and (isinstance(seconds, bool) or not isinstance(seconds, (int, float)) or seconds < 0):
        problems.append(f"seconds is {seconds!r}, not a time")
    return problems


def check(data: dict, sample: dict, partial: bool) -> tuple[list[str], list[dict]]:
    """The problems with a labels file, and its labels that have a verdict."""
    if data.get("reader") not in sample["order"]:
        return [f"reader is {data.get('reader')!r}, not one of {', '.join(sample['order'])}"], []
    if data.get("sample_version") != sample["version"]:
        return [f"sample_version is {data.get('sample_version')!r}; the sample is version {sample['version']}"], []
    if not isinstance(data.get("labels"), list):
        return ["no labels list"], []
    revisions = data.get("revisions", [])
    if not isinstance(revisions, list) or not all(isinstance(r, str) for r in revisions):
        return ["revisions must be a list of notes"], []
    revised = any(key.endswith("_original") for label in data["labels"] for key in label)
    if revised and not revisions:
        return ["labels keep *_original values but the file has no revisions note saying why"], []

    order = sample["order"][data["reader"]]
    problems, seen, labelled = [], Counter(), []
    for label in data["labels"]:
        trial_id = label.get("trial_id")
        seen[trial_id] += 1
        if trial_id not in order:
            problems.append(f"{trial_id}: not in {data['reader']}'s order")
            continue
        if partial and label.get("verdict") is None:
            continue  # opened but not labelled yet
        if wrong := problems_with(label):
            problems += [f"{trial_id}: {problem}" for problem in wrong]
        else:
            labelled.append(label)
    problems += [f"{trial_id}: labelled {n} times" for trial_id, n in seen.items() if n > 1]
    if data.get("review_of"):
        problems += changed_problems(data)
    if not partial:
        problems += [f"{trial_id}: not labelled" for trial_id in order
                     if not any(l.get("trial_id") == trial_id and l.get("verdict") for l in data["labels"])]
    return problems, labelled


def changed_problems(data: dict) -> list[str]:
    """A re-review's "changed" flags, checked against the first labels."""
    first_path = READING / data["review_of"]
    if not first_path.exists():
        return [f"review_of names {data['review_of']}, which isn't in {READING.name}/"]
    first = {l["trial_id"]: l for l in json.loads(first_path.read_text(encoding="utf-8"))["labels"]}
    norm = lambda value: (value.strip() if isinstance(value, str) else value) or None
    problems = []
    for label in data["labels"]:
        if label.get("verdict") is None or label.get("trial_id") not in first:
            continue
        actual = any(norm(label.get(key)) != norm(first[label["trial_id"]].get(key)) for key in REVISABLE)
        if label.get("changed") is not actual:
            problems.append(f"{label['trial_id']}: changed is {label.get('changed')!r}, but it "
                            f"{'differs from' if actual else 'matches'} {data['review_of']}")
    return problems


def report(labelled: list[dict], sample: dict, reader: str) -> None:
    groups = {e["trial_id"]: e["group"] for e in sample["entries"]}
    total = len(sample["order"][reader])
    print(f"{reader}: {len(labelled)} of {total} traces labelled")
    verdicts = Counter(l["verdict"] for l in labelled)
    print("  verdicts: " + ", ".join(f"{v} {verdicts[v]}" for v in VERDICTS))
    for group in ("question", "registry", "conversation"):
        mine = Counter(l["verdict"] for l in labelled if groups[l["trial_id"]] == group)
        if mine:
            print(f"    {group}: " + ", ".join(f"{v} {mine[v]}" for v in VERDICTS))
    faults = Counter(l["fault"] for l in labelled if l["verdict"] != "pass")
    if faults:
        print("  fault (fail and unsure): " + ", ".join(f"{f} {faults[f]}" for f in FAULTS if faults[f]))
    print(f"  reference viewed: {sum(l['reference_viewed'] for l in labelled)}")
    print(f"  with a note on how: {sum(1 for l in labelled if (l.get('how') or '').strip())}")
    if any("changed" in l for l in labelled):
        print(f"  changed since the first labels: {sum(1 for l in labelled if l.get('changed'))}")
    if seconds := [l["seconds"] for l in labelled if l.get("seconds") is not None]:
        print(f"  seconds per trace: median {statistics.median(seconds):.0f}, total {sum(seconds) / 60:.0f} min")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("labels", type=Path)
    parser.add_argument("--partial", action="store_true", help="don't count unlabelled traces as errors")
    args = parser.parse_args()
    sample = json.loads(SAMPLE.read_text(encoding="utf-8"))
    data = json.loads(args.labels.read_text(encoding="utf-8"))
    problems, labelled = check(data, sample, args.partial)
    for problem in problems:
        print(f"  {problem}")
    if data.get("reader") in sample["order"]:
        report(labelled, sample, data["reader"])
    if problems:
        sys.exit(f"{len(problems)} problem(s) in {args.labels}")


if __name__ == "__main__":
    main()
