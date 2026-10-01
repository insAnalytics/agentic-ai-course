"""
Draw the reading sample for Module 7, Lesson 3 (error analysis) from the baseline's batch a, and write the
traces the labelling page shows.

The sample is 100 trials of dev tasks: 50 questions, 35 registry tasks, 15 conversations. Within each group
it covers every task once before taking a second trial of any, so no task is missed, and it picks without
looking at any grade, so passes are read as well as failures. Held-out tasks and batch b are left unread.

Readers:
- Simar (the course's author, and the person whose labels these are) reads 40: 20 questions, 14 registry
  tasks, 6 conversations.
- Claude reads the other 60, and also 15 of Simar's 40 (7, 6, 2), labelled before seeing Simar's notes, so the
  lesson can report how often a person and a model agree.

    python scripts/eval/reading_sample.py            # writes public/data/eval/reading/
    python scripts/eval/reading_sample.py --check    # fails if the files are out of date

Deterministic: the same inputs give the same sample.
"""

import argparse
import json
import random
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
RUN = ROOT / "public" / "data" / "eval" / "main" / "baseline-a.json"
OUT = ROOT / "public" / "data" / "eval" / "reading"
SEED = 20261001
SIZES = {"question": 50, "registry": 35, "conversation": 15}
SIMAR = {"question": 20, "registry": 14, "conversation": 6}
OVERLAP = {"question": 7, "registry": 6, "conversation": 2}


def group_of(task) -> str:
    if task.source.startswith("queries.json"):
        return "question"
    return "conversation" if task.user else "registry"


def draw(trials_by_task: dict, size: int, rng: random.Random) -> list[str]:
    """Every task once, in random order, then second (and later) trials of random tasks until the size is
    reached. Within a task, trials are taken in a random order."""
    queues = {task_id: rng.sample(trial_ids, len(trial_ids)) for task_id, trial_ids in sorted(trials_by_task.items())}
    chosen = []
    while len(chosen) < size:
        round_ = [task_id for task_id in sorted(queues) if queues[task_id]]
        rng.shuffle(round_)
        for task_id in round_:
            if len(chosen) == size:
                break
            chosen.append(queues[task_id].pop())
    return chosen


def changes(final: dict, initial: dict) -> dict:
    """What a trial changed in the world: registry fields that differ from the start, and the emails sent."""
    registry = {agent: {field: [initial[agent][field], value] for field, value in fields.items() if initial[agent][field] != value}
                for agent, fields in final["registry"].items()}
    return {"registry": {agent: diff for agent, diff in registry.items() if diff}, "outbox": final["outbox"]}


def build() -> tuple[dict, dict]:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "main.json")}
    run = json.loads(RUN.read_text(encoding="utf-8"))
    rng = random.Random(SEED)

    by_group = {group: {} for group in SIZES}
    for trial in run["trials"]:
        task = tasks[trial["task_id"]]
        if task.split == "dev":
            by_group[group_of(task)].setdefault(task.id, []).append(trial["trial_id"])

    entries = []
    for group, size in SIZES.items():
        chosen = draw(by_group[group], size, rng)
        simar = rng.sample(chosen, SIMAR[group])
        overlap = set(rng.sample(simar, OVERLAP[group]))
        for trial_id in chosen:
            readers = ["simar", "claude"] if trial_id in overlap else ["simar"] if trial_id in simar else ["claude"]
            entries.append({"trial_id": trial_id, "task_id": trial_id.split("/")[1], "group": group, "readers": readers})

    # each reader sees their traces in a shuffled order, not grouped by kind or task
    order = {}
    for reader in ("simar", "claude"):
        mine = [e["trial_id"] for e in entries if reader in e["readers"]]
        order[reader] = rng.sample(mine, len(mine))

    sample = {"version": 1, "run": RUN.relative_to(ROOT).as_posix(), "config_hash": run["config_hash"], "seed": SEED,
              "drawn_by": "scripts/eval/reading_sample.py: every dev task once per group, then random extra trials; "
                          "no grade was looked at",
              "entries": entries, "order": order}

    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    trials = {trial["trial_id"]: trial for trial in run["trials"]}
    traces = {}
    for entry in entries:
        trial, task = trials[entry["trial_id"]], tasks[entry["task_id"]]
        traces[entry["trial_id"]] = {
            "task": {"id": task.id, "kind": task.kind, "request": task.request, "history": task.history,
                     "groups": task.groups, "faults": task.faults,
                     "persona": task.user["persona"] if task.user else None,
                     # shown only when the reader asks for it
                     "reference": {"answer": task.expect.get("answer"), "notes": task.expect.get("notes")}},
            "messages": trial["messages"], "answers": trial["answers"], "tool_log": trial["tool_log"],
            "changes": changes(trial["final_state"], initial),
            "user_replies": [call["raw"] for call in trial["user_calls"]],
            "trace": trial["trace"],
        }
    return sample, traces


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    sample, traces = build()
    files = {"sample.json": json.dumps(sample, ensure_ascii=False, indent=1) + "\n",
             "traces.json": json.dumps(traces, ensure_ascii=False, separators=(",", ":")) + "\n"}
    if args.check:
        stale = [name for name, text in files.items()
                 if not (OUT / name).exists() or (OUT / name).read_text(encoding="utf-8") != text]
        if stale:
            sys.exit(f"out of date: {', '.join(stale)}")
        print("reading sample is up to date")
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in files.items():
        (OUT / name).write_text(text, encoding="utf-8")
    counts = {}
    for entry in sample["entries"]:
        for reader in entry["readers"]:
            counts[(reader, entry["group"])] = counts.get((reader, entry["group"]), 0) + 1
    print(f"wrote {len(sample['entries'])} traces to {OUT.relative_to(ROOT)} "
          f"({(OUT / 'traces.json').stat().st_size / 1e6:.1f} MB): "
          + ", ".join(f"{reader} {group} {n}" for (reader, group), n in sorted(counts.items())))


if __name__ == "__main__":
    main()
