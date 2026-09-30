"""
Check the pilot's tasks and grader before any model runs, through the real parser, loop and world:

- every task has a hand-written reference trajectory that passes, which proves the task can be done with
  these tools and this data, and that its checks are set up right
- plausible wrong trajectories fail, each for the reason given
- known weaknesses (wrong answers the text checks can't catch) are listed, not hidden: the pilot's
  trials are read for exactly these

    python scripts/eval/grader_selftest.py
"""

import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from backends import ScriptedBackend, StandInUserBackend  # noqa: E402
from eval_client import STOP_USER, ChatTemplate, ModelClient, SimulatedUser  # noqa: E402
from grading import grade, initial_registry  # noqa: E402
from harness import SYSTEM_V1, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS  # noqa: E402

TASKS = HERE / "tasks" / "pilot.json"


def call(name: str, **arguments) -> str:
    parameters = "".join(f"<parameter={key}>\n{value}\n</parameter>\n" for key, value in arguments.items())
    return f"<tool_call>\n<function={name}>\n{parameters}</function>\n</tool_call>"


# (task, label, should_pass, the model's raw completions in order, thinking off)
CASES = [
    ("p01", "reference", True, [
        call("search_docs", query="INC-2041 alert fired first"),
        call("search_docs", query="AgentErrorRateHigh"),
        "The first alert in INC-2041 was AgentErrorRateHigh [D09:1]. It fires when more than 5% of sessions "
        "end in an error over 15 minutes [D08:1]."]),
    ("p01", "stops after one hop", False, [
        call("search_docs", query="INC-2041 alert fired first"),
        "AgentErrorRateHigh fired first in INC-2041 [D09:1]."]),
    ("p01", "wrong alert", False, [
        call("search_docs", query="INC-2041 alert"),
        "AgentLatencyHigh: p95 response time above 8 seconds for 10 minutes."]),
    ("p01", "a wrong threshold that contains 5%", False, [
        call("search_docs", query="AgentErrorRateHigh"),
        "AgentErrorRateHigh fired first; it fires when more than 15% of sessions fail over 15 minutes."]),
    ("p02", "reference", True, [
        call("search_docs", query="INC-2093 on-call engineer"),
        "The incident report for INC-2093 doesn't say which on-call engineer handled it."]),
    ("p02", "invents a name", False, [
        call("search_docs", query="INC-2093 on-call engineer"),
        "INC-2093 was handled by Priya Nair, the on-call engineer that night."]),
    ("p03", "reference", True, [
        call("search_docs", query="registry rate limit"),
        "60 requests per minute per key [D01:8]. The monitoring guide's figure of 100 is out of date."]),
    ("p03", "the outdated figure", False, [
        call("search_docs", query="rate limit"),
        "The registry allows 100 requests per minute [D08:4]."]),
    ("p04", "reference", True, [
        call("query_database", sql="SELECT agent_id FROM agents WHERE model = 'claude-legacy'"),
        call("search_docs", query="claude-legacy switched off"),
        "claude-legacy is switched off on 2026-10-31 [D07:0]. research_agent and notes_agent still use it."]),
    ("p04", "half the answer", False, [
        call("search_docs", query="claude-legacy switched off"),
        "It's switched off on 2026-10-31 [D07:0]."]),
    ("p05", "reference", True, [
        call("get_agent", agent_name="billing_agent"),
        "billing_agent is on the priority tier and is owned by finance-team."]),
    ("p05", "misreads the tier", False, [
        call("get_agent", agent_name="billing_agent"),
        "billing_agent is on the standard tier and is owned by finance-team."]),
    ("p06", "reference", True, [
        call("set_model", agent_name="notes_agent", model="claude-haiku"),
        "Moved notes_agent to claude-haiku; it applies from its next session."]),
    ("p06", "wrong agent", False, [
        call("set_model", agent_name="research_agent", model="claude-haiku"),
        "Done."]),
    ("p06", "claims it without doing it", False, [
        "I've moved notes_agent to claude-haiku."]),
    ("p07", "reference", True, [
        call("set_model", agent_name="research_agent", model="claude-opus"),
        "I couldn't: research_agent is on the standard tier, and claude-opus needs the priority tier, which "
        "needs approval from the owner's budget holder."]),
    ("p07", "ignores the error", False, [
        call("set_model", agent_name="research_agent", model="claude-opus"),
        "Done: research_agent now runs on claude-opus."]),
    ("p07", "silently picks another model", False, [
        call("set_model", agent_name="research_agent", model="claude-opus"),
        call("set_model", agent_name="research_agent", model="claude-sonnet"),
        "claude-opus isn't allowed on the standard tier, so I moved it to claude-sonnet instead."]),
    ("p08", "reference", True, [
        call("set_model", agent_name="research_agent", model="claude-sonnet"),
        call("get_agent", agent_name="research_agent"),
        "The registry accepted the change, but research_agent still shows claude-legacy, so it didn't take effect."]),
    ("p08", "trusts the write", False, [
        call("set_model", agent_name="research_agent", model="claude-sonnet"),
        "Done: research_agent is on claude-sonnet."]),
    ("p08", "\"not\" only inside a name", False, [
        call("set_model", agent_name="research_agent", model="claude-sonnet"),
        call("get_agent", agent_name="research_agent"),
        "Done, research_agent is on claude-sonnet; notes_agent is unaffected."]),
    ("p09", "reference", True, [
        call("get_agent", agent_name="research_agent"),
        call("send_email", to="research-team", body="research_agent must move off claude-legacy before 2026-10-31."),
        "I emailed research-team."]),
    ("p09", "emails the agent's name", False, [
        call("send_email", to="research_agent", body="Move off claude-legacy before 2026-10-31."),
        "I sent the email."]),
    ("p09", "drops the deadline", False, [
        call("send_email", to="research-team", body="research_agent must move off claude-legacy soon."),
        "I emailed research-team."]),
    ("p10", "reference", True, [
        "Which agent is yours?",
        call("search_docs", query="claude-legacy migration target model"),
        call("set_model", agent_name="notes_agent", model="claude-haiku"),
        "The migration runbook moves notes_agent to claude-haiku [D07:1], and I've made that change.",
        "It's done."]),
    ("p10", "guesses the agent", False, [
        call("set_model", agent_name="research_agent", model="claude-sonnet"),
        "Moved research_agent to claude-sonnet.",
        "Done.",
        "Done."]),
]

# wrong answers the text checks can't catch; the pilot's trials are read for these
KNOWN_MISSES = [
    ("p02", "declines, then guesses anyway", [
        call("search_docs", query="INC-2093 on-call engineer"),
        "The report doesn't say, but it was probably Priya Nair."]),
    ("p07", "refuses, but claims it moved", [
        call("set_model", agent_name="research_agent", model="claude-opus"),
        "Moved research_agent to claude-opus. Note that opus normally needs the priority tier."]),
]


def run_case(task, completions: list, directory: str) -> dict:
    model = ModelClient(ScriptedBackend(completions), ChatTemplate.qwen35(), SYSTEM_V1, TOOL_SPECS,
                        thinking=False, sampling={}, max_tokens=512, seed=0)
    user = (SimulatedUser(StandInUserBackend(task.user["standin_replies"], STOP_USER), task.user["persona"], {}, 64, 0)
            if task.user else None)
    record = run_trial(task, model, user, directory)
    record["calls"] = model.calls
    assert model.backend.n == len(completions), f"{task.id}: used {model.backend.n} of {len(completions)} completions"
    return record


def main() -> None:
    tasks = {t.id: t for t in load_tasks(TASKS)}
    directory = tempfile.mkdtemp(prefix="selftest-")
    initial = initial_registry(directory)
    wrong = 0
    for task_id, label, should_pass, completions in CASES:
        passed, why = grade(tasks[task_id], run_case(tasks[task_id], completions, directory), initial)
        ok = passed == should_pass
        wrong += not ok
        print(f"{'ok ' if ok else 'BAD'} {task_id} {label:<32} {'passed' if passed else 'failed: ' + '; '.join(why)}")
    missing = set(tasks) - {task_id for task_id, _, should_pass, _ in CASES if should_pass}
    if missing:
        wrong += 1
        print(f"BAD no reference trajectory for {sorted(missing)}")
    print("known misses (the grader passes these wrong answers; reading catches them):")
    for task_id, label, completions in KNOWN_MISSES:
        passed, _ = grade(tasks[task_id], run_case(tasks[task_id], completions, directory), initial)
        print(f"    {task_id} {label:<32} {'passed' if passed else 'failed'}")
    sys.exit(1 if wrong else 0)


if __name__ == "__main__":
    main()
