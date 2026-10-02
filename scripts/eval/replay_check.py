"""
Replay every recorded trial the way a lesson page will: a fresh world, the same loop, the same tools run
for real, and only the model's and the simulated user's turns taken from the recording. A trial passes if
every request matches the recorded one and the answers, tool log, messages and final state all come out
identical. Anything else means the page's code isn't the code that ran.

    python scripts/eval/replay_check.py public/data/eval/pilot/4b-think.json [more run files]
"""

import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from ablations import ReplaySupportJudge, variant_parts  # noqa: E402
from eval_client import ReplayClient, ReplayDiverged, ReplayUser  # noqa: E402
from harness import SYSTEMS, config_hash, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS, TOOL_SPECS_PILOT  # noqa: E402
from tokens import _plain  # noqa: E402

ROOT = HERE.parents[1]


def replay(record: dict, task, model_id: str, directory: str, variant: str = "none") -> str | None:
    """None if the trial replays exactly, or what differed. A Lesson 9 variant is applied as it was in the run, with
    the support judge's recorded verdicts."""
    if record["error"]:
        return "the recorded trial raised, so there's nothing to replay"
    model = ReplayClient(record["calls"], model_id)
    user = ReplayUser(record["user_calls"]) if task.user else None
    logged, wrap, factory = {}, None, None
    if variant != "none":
        change_tools, change_client, factory = variant_parts(variant, ReplaySupportJudge(record.get("judge_calls", [])), logged)
        wrap = lambda client, tools, checks: (change_client(client), change_tools(tools), checks)  # noqa: E731
    try:
        outcome = run_trial(task, model, user, directory, wrap=wrap, checks_factory=factory)
    except (ReplayDiverged, RuntimeError) as error:
        return f"diverged: {error}"
    for key, value in logged.items():
        if value != record.get(key):
            return f"{key} differs"
    for key in ("answers", "tool_log", "final_state"):
        if outcome[key] != record[key]:
            return f"{key} differs"
    if _plain(outcome["messages"]) != record["messages"]:
        return "messages differ"
    if model.n != len(record["calls"]):
        return f"used {model.n} of {len(record['calls'])} recorded calls"
    return None


def main() -> None:
    directory = tempfile.mkdtemp(prefix="replay-")
    failed = 0
    for path in sys.argv[1:]:
        run = json.loads(Path(path).read_text(encoding="utf-8"))
        # a replay never renders the prompt, so check the system prompt and tools separately, by hash
        known = run["system"] in SYSTEMS.values() and run["tools"] in (TOOL_SPECS, TOOL_SPECS_PILOT)
        if not known or run["config_hash"] != config_hash(run["system"], run["tools"]):
            print(f"{Path(path).name}: recorded with a system prompt or tool set this code doesn't have ({run['config_hash']})")
            failed += 1
            continue
        tasks = {t.id: t for t in load_tasks(ROOT / run["tasks_file"]["path"])}
        problems = [(r["trial_id"], why) for r in run["trials"]
                    if (why := replay(r, tasks[r["task_id"]], run["model"], directory, run.get("variant", "none")))]
        failed += len(problems)
        print(f"{Path(path).name}: {len(run['trials']) - len(problems)} of {len(run['trials'])} trials replay exactly")
        for trial_id, why in problems:
            print(f"  {trial_id}: {why}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
