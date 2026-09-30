"""
Summarise the pilot runs, and apply the decision rule fixed before the pilot ran:

    Use the 4B unless tool-call format errors are more than about 10% of first failures, or its pass rate
    falls outside roughly 40-85% (not saturated, not hopeless). Otherwise use the 9B.

    python scripts/eval/pilot_report.py public/data/eval/pilot/4b-think.json public/data/eval/pilot/4b-nothink.json public/data/eval/pilot/9b-think.json

Grades are the provisional code grades from grading.py, and first-failure kinds are sorted automatically.
Both are a first pass: the trials are read before any number here is used, and where the reading
disagrees, the reading wins.
"""

import json
import sys
import tempfile
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

TASKS = HERE / "tasks" / "pilot.json"
FORMAT_LIMIT = 0.10
PASS_RANGE = (0.40, 0.85)


def first_failure(record: dict) -> str:
    """A rough first sort of a failed trial, by what the record shows mechanically."""
    if record["error"]:
        return "the trial raised"
    for call in record["calls"]:
        if call["finish_reason"] == "length":
            return "cut off at the token limit"
        if call["problems"]:
            return "tool-call format"
    if record["answers"] and record["answers"][-1].startswith("stopped"):
        return "never finished"
    return "other: read it"


def summarise(path: Path, tasks: dict, initial: dict) -> dict:
    run = json.loads(path.read_text(encoding="utf-8"))
    trials = run["trials"]
    results = []
    for record in trials:
        if record["error"]:
            results.append((record, False, ["the trial raised"]))
        else:
            passed, why = grade(tasks[record["task_id"]], record, initial)
            results.append((record, passed, why))
    failed = [(r, why) for r, passed, why in results if not passed]
    kinds = Counter(first_failure(r) for r, _ in failed)
    calls = [c for r in trials for c in r["calls"]]
    gpus = max(len(run["setup"]["gpus"]), 1)
    gpu_seconds = run["timing"]["wall_seconds"] * gpus
    this_request = [x for c in calls for x in c["thinking_sent"]["this_request"]]
    earlier = [x for c in calls for x in c["thinking_sent"]["earlier_requests"]]
    pass_rate = sum(passed for _, passed, _ in results) / len(results)
    format_share = kinds["tool-call format"] / len(failed) if failed else 0.0

    print(f"\n=== {run['condition']}: {run['model']} @ {run['revision'][:7]}, thinking {'on' if run['thinking'] else 'off'}"
          f"{'  (DRY RUN: stand-in model, numbers mean nothing)' if run['dry_run'] else ''}")
    print(f"passed (provisional code grade): {sum(p for _, p, _ in results)} of {len(results)} = {pass_rate:.0%}")
    by_task = {}
    for record, passed, _ in results:
        by_task.setdefault(record["task_id"], []).append("P" if passed else ".")
    print("by task: " + "  ".join(f"{task} {''.join(marks)}" for task, marks in sorted(by_task.items())))
    print("first failures: " + (", ".join(f"{kind} {n}" for kind, n in kinds.most_common()) or "none"))
    print(f"calls with a format problem: {sum(bool(c['problems']) for c in calls)} of {len(calls)}; "
          f"cut off at the limit: {sum(c['finish_reason'] == 'length' for c in calls)}")
    print(f"per trial: {len(calls) / len(trials):.1f} model calls, "
          f"{sum(c['prompt_tokens'] for c in calls) / len(trials):,.0f} prompt tokens, "
          f"{sum(c['completion_tokens'] for c in calls) / len(trials):,.0f} generated tokens")
    print(f"GPU time: {gpu_seconds:,.0f} GPU-seconds for the condition, {gpu_seconds / len(trials):.1f} per trial "
          f"(trials ran concurrently, so this is the condition's total shared out; the simulated user's server "
          f"shared the GPU)")
    print(f"thinking resent: {sum(this_request)} of {len(this_request)} from the current request, "
          f"{sum(earlier)} of {len(earlier)} from before the latest user message")
    user_calls = [c for r in trials for c in r["user_calls"]]
    if user_calls:
        print(f"simulated user: {len(user_calls)} replies; each trial's replies, to read:")
        for record in trials:
            if record["user_calls"]:
                print(f"  {record['trial_id']}: " + " | ".join(c["raw"].strip()[:70] for c in record["user_calls"]))
    print("failed trials, to read:")
    for record, why in failed:
        answer = (record["answers"][-1] if record["answers"] else "").replace("\n", " ")
        print(f"  {record['trial_id']} [{first_failure(record)}] {'; '.join(why)} || {answer[:110]}")
    return {"condition": run["condition"], "pass_rate": pass_rate, "format_share": format_share,
            "dry_run": run["dry_run"]}


def main() -> None:
    tasks = {t.id: t for t in load_tasks(TASKS)}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    summaries = [summarise(Path(p), tasks, initial) for p in sys.argv[1:]]
    print("\n=== decision rule (fixed before the pilot)")
    for s in summaries:
        ok_format = s["format_share"] <= FORMAT_LIMIT
        ok_rate = PASS_RANGE[0] <= s["pass_rate"] <= PASS_RANGE[1]
        print(f"{s['condition']}: format errors {s['format_share']:.0%} of first failures "
              f"({'within' if ok_format else 'over'} {FORMAT_LIMIT:.0%}); pass rate {s['pass_rate']:.0%} "
              f"({'inside' if ok_rate else 'outside'} {PASS_RANGE[0]:.0%}-{PASS_RANGE[1]:.0%})"
              f"{'  [dry run]' if s['dry_run'] else ''}")
    meets = {s["condition"]: s["format_share"] <= FORMAT_LIMIT and PASS_RANGE[0] <= s["pass_rate"] <= PASS_RANGE[1]
             for s in summaries}
    if "4b-think" in meets:
        if meets["4b-think"]:
            verdict = "keep the 4B"
        elif meets.get("9b-think"):
            verdict = "the rule points to the 9B, which meets it"
        else:
            verdict = "neither model meets the rule: bring the reading to the content chat before choosing"
        print(f"on the code grades: {verdict}. Confirm by reading the trials before deciding.")


if __name__ == "__main__":
    main()
