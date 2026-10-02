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
CONDITIONS = ("baseline-a", "layers-a")
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
    if stale:
        sys.exit(f"out of date: {', '.join(stale)}")


if __name__ == "__main__":
    main()
