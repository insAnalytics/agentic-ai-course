"""
Write public/data/eval/ablations/results.json for Lesson 9's pages: for the baseline and each phase 5 variant, every
task's trial results, where a trial passes if it reached an answer, passed its task's code checks, and passed every
revised Gemma judge that graded it (correctness for Module 5's questions; the false-report, planted-instruction and
broken-result judges for those tasks). "baseline-b" is the baseline's second batch, main tasks only (the suite was run
once), for Lesson 10's no-change comparison. Plus, per trial, what each variant did: whether a run was compacted, stopped
at the step limit and repeated a tool call; which layers objected and whether the answer was withheld; whether the
answer cited a source.

    python scripts/eval/ablation_results.py            # writes the file
    python scripts/eval/ablation_results.py --check    # fails if it's out of date
"""

import argparse
import dataclasses
import json
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from grading import grade, initial_registry  # noqa: E402
from harness import load_tasks  # noqa: E402

ROOT = HERE.parents[1]
MAIN, JUDGES = ROOT / "public/data/eval/main", ROOT / "public/data/eval/judges"
OUT = ROOT / "public" / "data" / "eval" / "ablations" / "results.json"
CONDITIONS = {"baseline": ("baseline-a", "suite-2a-a"), "baseline-b": ("baseline-b",), "layers": ("layers-a", "layers-suite-a"),
              "compaction": ("compaction-a", "compaction-suite-a"), "no-labels": ("no-labels-a", "no-labels-suite-a"),
              # Lesson 10's three changes (phase 6)
              "prompt-v2": ("prompt-v2-a", "prompt-v2-suite-a"), "layers-v2": ("layers-v2-a", "layers-v2-suite-a"),
              "fp8": ("fp8-a", "fp8-suite-a")}
JUDGE_FILES = ("gemma-v2.json",
               "gemma-v2-layers-a+layers-suite-a+compaction-a+compaction-suite-a+no-labels-a+no-labels-suite-a.json",
               "gemma-v2-prompt-v2-a+prompt-v2-suite-a+layers-v2-a+layers-v2-suite-a+fp8-a+fp8-suite-a.json")
GROUPS = {"lost write": ("a13", "a14", "a26", "s01", "s02", "s03", "s04", "s05"),
          "planted": ("a11", "a12", "q13", "s10", "s11", "s12"), "broken result": ("a05", "s22", "s23")}
CITATION = re.compile(r"\[[\w./-]+:\d+\]")
# Lesson 10: layers v2's claim splitter strips underscores, so "research_agent" reaches the judge as "researchagent"
MANGLED = re.compile(r"\b[a-z]+agent\b")


def group(task) -> str:
    for name, ids in GROUPS.items():
        if task.id in ids:
            return name
    return "question" if task.source.startswith("queries.json") else "other"


def build() -> dict:
    tasks = {**{t.id: t for t in load_tasks(HERE / "tasks" / "main.json")},
             **{t.id: t for t in load_tasks(HERE / "tasks" / "suite-2a.json")}}
    initial = initial_registry(tempfile.mkdtemp(prefix="initial-"))
    verdicts = {}
    for name in JUDGE_FILES:
        for r in json.loads((JUDGES / name).read_text(encoding="utf-8"))["results"]:
            if r["kind"] in ("correctness", "false_report", "planted", "broken_result"):
                verdicts.setdefault(r["trial_id"], []).append(r["decision"])
    out = {"version": 1, "tasks": {t.id: {"split": t.split, "group": group(t)} for t in tasks.values()}, "conditions": {}}
    for condition, names in CONDITIONS.items():
        trials = {}
        for name in names:
            for trial in json.loads((MAIN / f"{name}.json").read_text(encoding="utf-8"))["trials"]:
                task = tasks[trial["task_id"]]
                answer = trial["answers"][-1] if trial["answers"] else ""
                passed = not trial["error"] and not answer.startswith("stopped after")
                if passed and "checks" in task.expect:
                    passed = grade(dataclasses.replace(task, checks=task.expect["checks"]), trial, initial)[0]
                passed = passed and all(v == "pass" for v in verdicts.get(trial["trial_id"], []))
                calls = [json.dumps([e["tool"], e["input"]], sort_keys=True) for e in trial["tool_log"]]
                row = {"pass": passed, "stopped": answer.startswith("stopped after"),
                       "repeated_calls": len(calls) - len(set(calls)), "cited": bool(CITATION.search(answer))}
                if "compactions" in trial:
                    row["compacted"] = len(trial["compactions"])
                if "layer_log" in trial:
                    row["objections"] = sorted({e["layer"] for e in trial["layer_log"]})
                    row["withheld"] = answer.startswith("answer withheld")
                    deciding = [e for e in trial["layer_log"] if e["point"] == "before_answer"]
                    row["withheld_by"] = deciding[0]["layer"] if row["withheld"] and deciding else None
                    claims = [c["claim"] for c in trial.get("judge_calls", [])]
                    row["judge_calls"] = len(claims)
                    row["empty_claims"] = sum(not c.strip(" .") for c in claims)
                    row["mangled_claims"] = sum(bool(MANGLED.search(c)) for c in claims)
                    reason = deciding[0]["reason"] if row["withheld_by"] == "support judge" else ""
                    row["withheld_on"] = ("an empty claim" if reason.endswith("''") else
                                          "a mangled name" if MANGLED.search(reason) else
                                          "a citation no tool returned" if reason.startswith("cites ") else
                                          "another claim" if reason else None)
                trials.setdefault(task.id, []).append(row)
        out["conditions"][condition] = trials
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "results.json is out of date")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
