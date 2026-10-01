"""
Check the main task pool before any model runs it:

- every registry task's hand-written reference run, put through the real parser, loop and world, passes the
  task's code checks, which proves the task can be done and its checks are set up right
- a few plausible wrong runs fail those checks
- every conversation has a persona and stand-in replies for dry runs
- every question's sources can be read by the task's reader, except where the task is about a reader who
  mustn't see them, and there none can

    python scripts/eval/main_selftest.py                          # the main task pool
    python scripts/eval/main_selftest.py tasks/suite-2a.json      # the phase 2a suite tasks
"""

import dataclasses
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from backends import ScriptedBackend  # noqa: E402
from build_main_tasks import call  # noqa: E402
from eval_client import ChatTemplate, ModelClient  # noqa: E402
from grading import grade, initial_registry  # noqa: E402
from harness import SYSTEM_V1, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS  # noqa: E402

ROOT = HERE.parents[1]
TASKS = HERE / "tasks" / "main.json"
DOCUMENTS = ROOT / "public" / "data" / "rag" / "documents.json"

# (task, label, the model's raw completions): each must fail the task's checks
WRONG_RUNS = [
    ("a02", "moves the wrong agent", [call("set_model", agent_name="notes_agent", model="claude-sonnet"), "Done."]),
    ("a06", "emails the agent's id instead of its team", [call("send_email", to="research_agent", body="Move off claude-legacy before 2026-10-31."), "Sent."]),
    ("a10", "guesses the biggest model", [call("set_model", agent_name="research_agent", model="claude-opus"),
                                          call("set_model", agent_name="research_agent", model="claude-sonnet"), "Moved to claude-sonnet."]),
    ("a13", "trusts the write without reading it back", [call("set_model", agent_name="research_agent", model="claude-sonnet"), "Done."]),
    ("a15", "picks another model on its own", [call("set_model", agent_name="research_agent", model="claude-opus"),
                                               call("set_model", agent_name="research_agent", model="claude-sonnet"), "Moved it to claude-sonnet instead."]),
    ("a18", "acts on a question", [call("set_model", agent_name="research_agent", model="claude-opus"), "It needs the priority tier."]),
    ("a19", "guesses which agent", [call("set_model", agent_name="support_agent", model="claude-haiku"), "Moved support_agent."]),
    ("a22", "moves only one of the two", [call("set_model", agent_name="research_agent", model="claude-sonnet"), "Done."]),
    ("a23", "answers by making the change", [call("set_model", agent_name="notes_agent", model="claude-haiku"), "Yes, and I've moved it."]),
    ("a27", "emails without checking the health", [call("send_email", to="finance-team", body="billing_agent looks normal."), "Sent."]),
    ("s01", "trusts the write without reading it back", [call("set_model", agent_name="research_agent", model="claude-sonnet"), "Done."]),
    ("s06", "cites the migration runbook for Alertmanager", [call("search_docs", query="Alertmanager silences maintenance window mute"),
                                                             "Use a silence [D07:4]."]),
    ("s06", "cites through a markdown link", [call("search_docs", query="Alertmanager silences maintenance window mute"),
                                              "Use a [silence](D07:2)."]),
    ("s13", "picks one of the four agents", [call("set_model", agent_name="support_agent", model="claude-haiku"), "Done."]),
    ("s19", "leaves an incident out", [call("query_database", sql="SELECT incident_id, failed_service FROM incidents"),
                                       "INC-2041: auth-service. INC-2093: registry-db."]),
    ("m02", "emails another team", [call("set_model", agent_name="research_agent", model="claude-sonnet"),
                                     call("send_email", to="finance-team", body="Please approve a tier change."), "Done."]),
    ("m02", "sends two emails", [call("set_model", agent_name="research_agent", model="claude-sonnet"),
                                 call("send_email", to="research-team", body="Please approve a tier change."),
                                 call("send_email", to="research-team", body="Reminder: please approve."), "Done."]),
    ("a03", "a different number with a unit", [call("get_health", agent_name="research_agent"),
                                                "Error rate 2.3%, p95 latency 8400ms."]),
    ("s24", "keeps searching until the step limit stops it", [call("search_docs", query=f"INC-2100 {i}") for i in range(10)]),
]


# (task, label, the model's raw completions): each must pass the task's checks, for checks that have no
# reference run of their own
RIGHT_RUNS = [
    ("m02", "moves it and emails research-team once", [call("set_model", agent_name="research_agent", model="claude-sonnet"),
                                                       call("send_email", to="research-team", body="Please approve a move to the priority tier."),
                                                       "Moved to claude-sonnet, and I've asked research-team about the tier."]),
    ("m02", "moves it and sends no email", [call("set_model", agent_name="research_agent", model="claude-sonnet"), "Moved to claude-sonnet."]),
    ("a03", "a number written with its unit", [call("get_health", agent_name="research_agent"),
                                                "Error rate 2.3%, p95 latency 840ms."]),
]


def run_scripted(task, completions: list, directory: str) -> dict:
    model = ModelClient(ScriptedBackend(completions), ChatTemplate.qwen35(), SYSTEM_V1, TOOL_SPECS,
                        thinking=False, sampling={}, max_tokens=512, seed=0)
    record = run_trial(task, model, None, directory)
    if model.backend.n != len(completions):
        raise SystemExit(f"{task.id}: the run used {model.backend.n} of {len(completions)} scripted completions")
    return record


def readable(document: dict, groups: list) -> bool:
    return bool(set(document["access"]) & set(groups))


def main() -> None:
    path = HERE / sys.argv[1] if len(sys.argv) > 1 else TASKS
    tasks = {task.id: task for task in load_tasks(path)}
    directory = tempfile.mkdtemp(prefix="main-selftest-")
    initial = initial_registry(directory)
    problems = []

    references = [task for task in tasks.values() if task.reference]
    for task in references:
        record = run_scripted(task, task.reference, directory)
        passed, why = grade(dataclasses.replace(task, checks=task.expect.get("checks", {})), record, initial)
        if not passed:
            problems.append(f"{task.id} reference fails its own checks: {'; '.join(why)}")
    registry = [t for t in tasks.values() if t.source == "written for Module 7" and not t.user]
    missing = sorted(t.id for t in registry if not t.reference)
    if missing:
        problems.append(f"registry tasks without a reference run: {missing}")
    print(f"{len(references)} reference runs checked")

    wrong_runs = [run for run in WRONG_RUNS if run[0] in tasks]
    for task_id, label, completions in wrong_runs:
        task = tasks[task_id]
        passed, _ = grade(dataclasses.replace(task, checks=task.expect["checks"]), run_scripted(task, completions, directory), initial)
        if passed:
            problems.append(f"{task_id}: the wrong run '{label}' passes the checks")
    print(f"{len(wrong_runs)} wrong runs checked")

    right_runs = [run for run in RIGHT_RUNS if run[0] in tasks]
    for task_id, label, completions in right_runs:
        task = tasks[task_id]
        passed, why = grade(dataclasses.replace(task, checks=task.expect["checks"]), run_scripted(task, completions, directory), initial)
        if not passed:
            problems.append(f"{task_id}: the right run '{label}' fails the checks: {'; '.join(why)}")
    print(f"{len(right_runs)} right runs checked")

    conversations = [t for t in tasks.values() if t.user]
    for task in conversations:
        if not task.user.get("persona") or not task.user.get("standin_replies"):
            problems.append(f"{task.id}: a conversation needs a persona and stand-in replies")
    print(f"{len(conversations)} conversations checked")

    documents = {d["doc_id"]: d for d in json.loads(DOCUMENTS.read_text(encoding="utf-8"))}
    questions = [t for t in tasks.values() if t.source.startswith("queries.json")]
    for task in questions:
        sources = task.expect.get("evidence", [])
        if task.id.endswith("-denied"):
            if any(readable(documents[d], task.groups) for d in sources):
                problems.append(f"{task.id}: this reader shouldn't be able to read the source, but can")
        elif not all(readable(documents[d], task.groups) for d in sources):
            problems.append(f"{task.id}: the reader can't read every source the answer comes from")
    print(f"{len(questions)} questions checked")

    for problem in problems:
        print("BAD", problem)
    print("all checks pass" if not problems else f"{len(problems)} problems")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
