"""
Summarise the main runs for the content chat: whether the runs and their traces are sound, what they cost,
and a provisional first pass of the code checks on the registry tasks. The questions aren't graded here:
their graders are written in later lessons. Nothing in this report is a result to publish; it says whether
the data is fit to read.

    python scripts/eval/main_report.py public/data/eval/main/baseline-a.json public/data/eval/main/baseline-b.json
"""

import dataclasses
import json
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402
from tracing import Span, summarize  # noqa: E402

ROOT = HERE.parents[1]


def trace_problems(record: dict) -> list[str]:
    """What's wrong with a trial's trace, if anything."""
    spans = [Span(**span) for span in record["trace"]]
    if not spans or spans[0].parent_id is not None:
        return ["no root span"]
    by_id = {span.span_id: span for span in spans}
    problems = []
    for span in spans[1:]:
        ancestor = span
        while ancestor.parent_id in by_id:
            ancestor = by_id[ancestor.parent_id]
        if ancestor is not spans[0]:
            problems.append(f"{span.name} isn't under the root")
        if span.end_ns is None or span.end_ns < span.start_ns:
            problems.append(f"{span.name} has no proper end time")
    if summarize(spans)["model_calls"] != len(record["calls"]):
        problems.append("the trace's model calls don't match the recorded calls")
    return problems


def report(path: Path, tasks: dict, initial: dict) -> None:
    run = json.loads(path.read_text(encoding="utf-8"))
    trials = run["trials"]
    calls = [c for r in trials for c in r["calls"]]
    print(f"\n=== {run['condition']}: {run['model']} @ {run['revision'][:7]}, {len(trials)} trials, "
          f"{run['trials_per_task']} per task{'  (DRY RUN: stand-in models, numbers mean nothing)' if run['dry_run'] else ''}")
    print(f"raised: {sum(bool(r['error']) for r in trials)}; calls with a format problem: "
          f"{sum(bool(c['problems']) for c in calls)} of {len(calls)}; cut off at the token limit: "
          f"{sum(c['finish_reason'] == 'length' for c in calls)}; stopped at the step limit: "
          f"{sum(1 for r in trials if r['answers'] and r['answers'][-1].startswith('stopped'))}")
    broken = [(r["trial_id"], p) for r in trials if not r["error"] for p in trace_problems(r)]
    print(f"traces with problems: {len({t for t, _ in broken})}" + "".join(f"\n    {t}: {p}" for t, p in broken[:10]))
    gpus = max(len(run["setup"]["gpus"]), 1)
    print(f"per trial: {len(calls) / len(trials):.1f} model calls, "
          f"{sum(c['prompt_tokens'] for c in calls) / len(trials):,.0f} prompt tokens, "
          f"{sum(c['completion_tokens'] for c in calls) / len(trials):,.0f} generated; "
          f"{run['timing']['wall_seconds'] * gpus:,.0f} GPU-seconds in all")
    user_trials = [r for r in trials if r["user_calls"]]
    if user_trials:
        unfinished = [r["trial_id"] for r in user_trials if "###STOP###" not in r["user_calls"][-1]["raw"]]
        print(f"conversations: {len(user_trials)}; the simulated user never said it was done in {len(unfinished)}")

    by_task = defaultdict(list)
    for record in trials:
        task = tasks[record["task_id"]]
        checks = task.expect.get("checks")
        if checks is None or record["error"]:
            continue
        passed, _ = grade(dataclasses.replace(task, checks=checks), record, initial)
        by_task[task.id].append(passed)
    rates = {task_id: sum(marks) / len(marks) for task_id, marks in by_task.items()}
    print(f"provisional code checks, {len(rates)} registry tasks and conversations "
          f"(the questions are graded in later lessons):")
    print(f"    mean pass rate {sum(rates.values()) / len(rates):.0%}; never passed: "
          f"{sorted(t for t, r in rates.items() if r == 0) or 'none'}; always passed: {sum(r == 1 for r in rates.values())} tasks")
    print("    by task: " + "  ".join(f"{t} {''.join('P' if m else '.' for m in by_task[t])}" for t in sorted(by_task)))


def main() -> None:
    tasks = {task.id: task for task in load_tasks(HERE / "tasks" / "main.json")}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    for path in sys.argv[1:]:
        report(Path(path), tasks, initial)


if __name__ == "__main__":
    main()
