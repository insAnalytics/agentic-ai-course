"""
Write public/data/eval/monitoring/traffic-<condition>.json for Lesson 11 (monitoring in production): each development
run of a recorded main run, as the spans its tracer recorded while it ran, in the order the runs started. The lesson
replays them as if they were live traffic, so the pages say "simulated" wherever they use them.

What changes from the recording:
- Held-out tasks are left out, as everywhere the module looks at runs.
- Each span keeps its name, ids, times, status and attributes, minus the trace id (one per run, kept on the run).
- `registry_agent.check.reason` is dropped: a support judge's reason quotes the agent's answer, and a dashboard
  works from attributes, not content. The point, verdict and action stay.
- Each `search_docs` tool span gains `registry_agent.search.results`, the number of sources the search returned,
  counted from the tool log. The runs recorded the results only as content; a production tracer would record the
  count as an attribute, and this is that attribute.

It also writes public/data/eval/monitoring/relevance-judged.json: every development question run of the baseline's
two batches, with whether the run ended with an answer (its last model call asked for no tools, read from its trace)
and the revised Gemma relevance judge's verdict and tokens on it, from judges/gemma-v2.json.

And public/data/eval/monitoring/question-mix.json: every development run of the baseline's two batches, with its
task's kind, the kind's group (CATEGORY below: the coarse categories a request classifier would assign), and whether
the run passed (code checks and revised judges, from ablations/results.json).

    python scripts/eval/monitoring_traffic.py            # writes the files
    python scripts/eval/monitoring_traffic.py --check    # fails if any is out of date
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "public" / "data" / "eval" / "main"
OUT = ROOT / "public" / "data" / "eval" / "monitoring"
TASKS = ROOT / "scripts" / "eval" / "tasks" / "main.json"
JUDGE = ROOT / "public" / "data" / "eval" / "judges" / "gemma-v2.json"
ABLATIONS = ROOT / "public" / "data" / "eval" / "ablations" / "results.json"


def category(kind: str) -> str:
    """A task kind's coarse category, checked in this order."""
    if kind.startswith("docs"):
        return "docs question"
    if kind.startswith("conversation"):
        return "conversation"
    if kind.startswith("should not act"):
        return "should not act"
    if "email" in kind:
        return "email"
    if kind.startswith("action") or kind == "two actions":
        return "model change"
    return "lookup"
CONDITIONS = ("baseline-a", "baseline-b", "layers-a", "compaction-a")
DROPPED = {"registry_agent.check.reason"}


def compact(trial: dict) -> dict:
    searches = iter(entry for entry in trial["tool_log"] if entry["tool"] == "search_docs")
    spans = []
    for span in trial["trace"]:
        attributes = {key: value for key, value in span["attributes"].items() if key not in DROPPED}
        if attributes.get("gen_ai.operation.name") == "execute_tool" and attributes["gen_ai.tool.name"] == "search_docs":
            entry = next(searches)
            attributes["registry_agent.search.results"] = entry["output"].count("<source ") if entry["ok"] else 0
        spans.append({"name": span["name"], "span_id": span["span_id"], "parent_id": span["parent_id"],
                      "start_ns": span["start_ns"], "end_ns": span["end_ns"], "attributes": attributes,
                      "status": span["status"]})
    assert next(searches, None) is None, f"{trial['trial_id']}: more searches logged than traced"
    return {"trial_id": trial["trial_id"], "trace_id": trial["trace"][0]["trace_id"], "spans": spans}


def build(condition: str, dev: set[str]) -> dict:
    run = json.loads((MAIN / f"{condition}.json").read_text(encoding="utf-8"))
    trials = [trial for trial in run["trials"] if trial["task_id"] in dev]
    trials.sort(key=lambda trial: trial["trace"][0]["start_ns"])
    return {"version": 1, "condition": condition, "model": run["model"], "config_hash": run["config_hash"],
            "runs": [compact(trial) for trial in trials]}


def answered(trial: dict) -> bool:
    chats = [span for span in trial["trace"] if span["attributes"].get("gen_ai.operation.name") == "chat"]
    return not chats[-1]["attributes"].get("registry_agent.tool_calls")


def build_relevance(dev: set[str]) -> dict:
    judge = json.loads(JUDGE.read_text(encoding="utf-8"))
    trials = {}
    for condition in ("baseline-a", "baseline-b"):
        run = json.loads((MAIN / f"{condition}.json").read_text(encoding="utf-8"))
        trials |= {trial["trial_id"]: trial for trial in run["trials"]}
    rows = [{"trial_id": item["trial_id"], "answered": answered(trials[item["trial_id"]]), "judge": item["decision"],
             "judge_tokens": item["prompt_tokens"] + item["completion_tokens"]}
            for item in judge["results"] if item["kind"] == "relevance" and item["task_id"] in dev]
    rows.sort(key=lambda row: row["trial_id"])
    return {"version": 1, "judge": judge["model"], "rubrics_version": judge["rubrics_version"], "runs": rows}


def build_mix() -> dict:
    tasks = {task["id"]: task for task in json.loads(TASKS.read_text(encoding="utf-8"))["tasks"]}
    results = json.loads(ABLATIONS.read_text(encoding="utf-8"))["conditions"]
    runs = []
    for condition, batch in (("baseline", "baseline-a"), ("baseline-b", "baseline-b")):
        for task_id, trials in sorted(results[condition].items()):
            task = tasks.get(task_id)
            if task is None or task["split"] != "dev":
                continue
            runs += [{"trial_id": f"{batch}/{task_id}/{n}", "kind": task["kind"], "category": category(task["kind"]),
                      "passed": trial["pass"]} for n, trial in enumerate(trials)]
    return {"version": 1, "runs": runs}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    tasks = json.loads(TASKS.read_text(encoding="utf-8"))["tasks"]
    dev = {task["id"] for task in tasks if task["split"] == "dev"}
    stale = []
    for condition in CONDITIONS:
        path = OUT / f"traffic-{condition}.json"
        text = json.dumps(build(condition, dev), ensure_ascii=False, separators=(",", ":")) + "\n"
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                stale.append(path.name)
            continue
        OUT.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)}: {len(json.loads(text)['runs'])} runs, {len(text) / 1e6:.1f} MB")
    path = OUT / "relevance-judged.json"
    text = json.dumps(build_relevance(dev), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            stale.append(path.name)
    else:
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)}: {len(json.loads(text)['runs'])} runs")
    path = OUT / "question-mix.json"
    text = json.dumps(build_mix(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            stale.append(path.name)
    else:
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)}: {len(json.loads(text)['runs'])} runs")
    if stale:
        sys.exit(f"out of date: {', '.join(stale)}")


if __name__ == "__main__":
    main()
