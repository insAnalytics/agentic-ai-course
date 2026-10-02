"""
Write public/data/eval/report/baseline-grades.json for Lesson 12 (the evaluation report): every baseline trial (batch a
and the first suite run, the trials behind ablations/results.json's "baseline"), broken down by which grader decided it.
For each trial: whether the run reached an answer, its task's code-check result (null for a task with no code checks,
or a run with no answer, which the code checks never see), and each revised Gemma judge's verdict on it. A trial's pass
in results.json is: reached an answer, passed its code checks, and passed every judge listed here; the script checks
that its own breakdown gives exactly that.

    python scripts/eval/report_grades.py            # writes the file
    python scripts/eval/report_grades.py --check    # fails if it's out of date
"""

import argparse
import dataclasses
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
MAIN, JUDGES = ROOT / "public/data/eval/main", ROOT / "public/data/eval/judges"
RESULTS = ROOT / "public/data/eval/ablations/results.json"
OUT = ROOT / "public/data/eval/report/baseline-grades.json"
KINDS = ("correctness", "false_report", "planted", "broken_result")


def build() -> dict:
    tasks = {**{t.id: t for t in load_tasks(HERE / "tasks" / "main.json")},
             **{t.id: t for t in load_tasks(HERE / "tasks" / "suite-2a.json")}}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    verdicts = {}
    for r in json.loads((JUDGES / "gemma-v2.json").read_text(encoding="utf-8"))["results"]:
        if r["kind"] in KINDS:
            verdicts.setdefault(r["trial_id"], {})[r["kind"]] = r["decision"]
    results = json.loads(RESULTS.read_text(encoding="utf-8"))
    rows = []
    for name in ("baseline-a", "suite-2a-a"):
        for trial in json.loads((MAIN / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
            task = tasks[trial["task_id"]]
            answer = trial["answers"][-1] if trial["answers"] else ""
            answered = not trial["error"] and not answer.startswith("stopped after")
            code = None
            if answered and "checks" in task.expect:
                code = grade(dataclasses.replace(task, checks=task.expect["checks"]), trial, initial)[0]
            judged = verdicts.get(trial["trial_id"], {})
            passed = answered and code is not False and all(v == "pass" for v in judged.values())
            recorded = results["conditions"]["baseline"][task.id][trial["trial"]]["pass"]
            assert passed == recorded, f"{trial['trial_id']}: breakdown says {passed}, results.json says {recorded}"
            rows.append({"trial_id": trial["trial_id"], "task_id": task.id, "split": task.split,
                         "group": results["tasks"][task.id]["group"], "answered": answered, "code": code,
                         "judges": judged})
    return {"version": 1, "judge_file": "gemma-v2.json", "trials": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else f"{OUT.name} is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(json.loads(text)['trials'])} trials, {len(text) / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
