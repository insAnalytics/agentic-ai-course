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

from eval_client import ReplayClient, ReplayDiverged, ReplayUser  # noqa: E402
from harness import SYSTEM_V1, config_hash, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS  # noqa: E402
from tokens import _plain  # noqa: E402

TASKS = HERE / "tasks" / "pilot.json"


def replay(record: dict, task, model_id: str, directory: str) -> str | None:
    """None if the trial replays exactly, or what differed."""
    if record["error"]:
        return "the recorded trial raised, so there's nothing to replay"
    model = ReplayClient(record["calls"], model_id)
    user = ReplayUser(record["user_calls"]) if task.user else None
    try:
        outcome = run_trial(task, model, user, directory)
    except ReplayDiverged as error:
        return f"diverged: {error}"
    for key in ("answers", "tool_log", "final_state"):
        if outcome[key] != record[key]:
            return f"{key} differs"
    if _plain(outcome["messages"]) != record["messages"]:
        return "messages differ"
    if model.n != len(record["calls"]):
        return f"used {model.n} of {len(record['calls'])} recorded calls"
    return None


def main() -> None:
    tasks = {t.id: t for t in load_tasks(TASKS)}
    directory = tempfile.mkdtemp(prefix="replay-")
    failed = 0
    for path in sys.argv[1:]:
        run = json.loads(Path(path).read_text(encoding="utf-8"))
        # a replay never renders the prompt, so check the system prompt and tools separately, by hash
        if run["config_hash"] != config_hash(SYSTEM_V1, TOOL_SPECS):
            print(f"{Path(path).name}: recorded with another system prompt or tool set ({run['config_hash']})")
            failed += 1
            continue
        problems = [(r["trial_id"], why) for r in run["trials"]
                    if (why := replay(r, tasks[r["task_id"]], run["model"], directory))]
        failed += len(problems)
        print(f"{Path(path).name}: {len(run['trials']) - len(problems)} of {len(run['trials'])} trials replay exactly")
        for trial_id, why in problems:
            print(f"  {trial_id}: {why}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
