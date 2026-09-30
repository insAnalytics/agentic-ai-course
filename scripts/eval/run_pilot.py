"""
Module 7's pilot: the registry agent, live, on 10 tasks x 3 trials, under three conditions, recording every
call so each trial can be replayed exactly and read.

    # dry run, no GPU: stand-in models, all three conditions
    python scripts/eval/run_pilot.py --dry-run --condition all

    # on Colab, one agent server at a time (see README-eval.md), the simulated user's server alongside
    python scripts/eval/run_pilot.py --condition 4b-think   --agent-url http://localhost:8000 --user-url http://localhost:8001
    python scripts/eval/run_pilot.py --condition 4b-nothink --agent-url http://localhost:8000 --user-url http://localhost:8001
    python scripts/eval/run_pilot.py --condition 9b-think   --agent-url http://localhost:8000 --user-url http://localhost:8001

Writes public/data/eval/pilot/<condition>.json (or <condition>.dry-run.json).

Everything needed to reproduce a trial is saved with it: model repository and pinned revision, engine
version, GPU, sampling settings, the seed of every request, the chat template's git hash, a hash of the
system prompt and tools, every raw completion before parsing, and the world's final state.
"""

import argparse
import json
import platform
import subprocess
import sys
import tempfile
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from backends import StandInBackend, StandInUserBackend, VLLMBackend, VLLMChatBackend  # noqa: E402
from eval_client import STOP_USER, ChatTemplate, ModelClient, SimulatedUser, seed_for, template_messages, openai_tools  # noqa: E402
from harness import SYSTEM_V1, config_hash, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS  # noqa: E402
from tokens import _plain  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "pilot"
TASKS = HERE / "tasks" / "pilot.json"

# the revisions Module 6 loaded, so the models are the ones earlier lessons measured
MODELS = {
    "4b": ("Qwen/Qwen3.5-4B", "851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a"),
    "9b": ("Qwen/Qwen3.5-9B", "c202236235762e1c871ad0ccb60c8ee5ba337b9a"),
}
CONDITIONS = {
    "4b-think": dict(model="4b", thinking=True),
    "4b-nothink": dict(model="4b", thinking=False),
    "9b-think": dict(model="9b", thinking=True),
}
# Qwen's recommended settings for general tasks (Qwen3.5 model card, "Best Practices"). CHECK THESE on the
# day of the run and edit them here if they differ: the values used are saved with every run.
SAMPLING = {
    True: dict(temperature=1.0, top_p=0.95, top_k=20, min_p=0.0, presence_penalty=1.5, repetition_penalty=1.0),
    False: dict(temperature=0.7, top_p=0.8, top_k=20, min_p=0.0, presence_penalty=1.5, repetition_penalty=1.0),
}
MAX_TOKENS = {True: 8192, False: 2048}

# The simulated user: a different family from the agent. CHECK Gemma 4's recommended sampling on its model
# card on the day, and how to turn its thinking off through the chat template, and edit these if needed.
USER_MODEL = "google/gemma-4-26B-A4B-it"
USER_SAMPLING = dict(temperature=1.0, top_p=0.95, top_k=64)
USER_TEMPLATE_KWARGS = {"enable_thinking": False}
USER_MAX_TOKENS = 512

TRIALS = 3


def gpu_names() -> list[str]:
    try:
        out = subprocess.run(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                             capture_output=True, text=True, check=True).stdout
        return [line.strip() for line in out.splitlines() if line.strip()]
    except (OSError, subprocess.CalledProcessError):
        return []


def check_template(template: ChatTemplate, tokenizer, thinking: bool) -> bool:
    """Our rendering must equal transformers' for the same conversation, tool calls and results included."""
    from fake import TextBlock, ThinkingBlock, ToolUseBlock
    call = ToolUseBlock("get_agent", {"agent_name": "research_agent"})
    call.id = "call_00_0"
    sample = [{"role": "user", "content": "What model is research_agent on?"},
              {"role": "assistant", "content": [ThinkingBlock("Look it up."), TextBlock("Checking."), call]},
              {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": '{"model": "claude-legacy"}'}]}]
    ours = template.render(template_messages(SYSTEM_V1, sample), openai_tools(TOOL_SPECS), thinking)
    theirs = tokenizer.apply_chat_template(template_messages(SYSTEM_V1, sample), tools=openai_tools(TOOL_SPECS),
                                           add_generation_prompt=True, tokenize=False, enable_thinking=thinking)
    return ours == theirs


def run_condition(name: str, args) -> dict:
    spec = CONDITIONS[name]
    repo, revision = MODELS[spec["model"]]
    thinking = spec["thinking"]
    template = ChatTemplate.qwen35()
    template_check = None
    if args.dry_run:
        backend = StandInBackend(model_id=f"stand-in for {repo}")
    else:
        from huggingface_hub import hf_hub_download
        from transformers import AutoTokenizer
        tokenizer = AutoTokenizer.from_pretrained(repo, revision=revision)
        # the model's own template at the pinned revision is the one we render; ours must match it byte for byte
        shipped = Path(hf_hub_download(repo, "chat_template.jinja", revision=revision)).read_text(encoding="utf-8")
        template = ChatTemplate(shipped)
        template_check = check_template(template, tokenizer, thinking)
        if not template_check and not args.allow_template_mismatch:
            sys.exit("our template rendering differs from transformers'; see check_template")
        backend = VLLMBackend(args.agent_url, repo, tokenizer)

    tasks = load_tasks(TASKS)
    if args.tasks:
        tasks = [t for t in tasks if t.id in args.tasks.split(",")]

    def user_backend(task):
        if args.dry_run:
            return StandInUserBackend(task.user["standin_replies"], STOP_USER)
        return VLLMChatBackend(args.user_url, USER_MODEL, USER_TEMPLATE_KWARGS)

    workdir = tempfile.mkdtemp(prefix="registry-world-")

    def one_trial(task, trial):
        seed = seed_for("pilot", name, task.id, trial)
        model = ModelClient(backend, template, SYSTEM_V1, TOOL_SPECS, thinking, SAMPLING[thinking],
                            MAX_TOKENS[thinking], seed)
        user = (SimulatedUser(user_backend(task), task.user["persona"], USER_SAMPLING, USER_MAX_TOKENS, seed)
                if task.user else None)
        started = time.monotonic()
        record = {"trial_id": f"{name}/{task.id}/{trial}", "task_id": task.id, "trial": trial, "seed": seed}
        try:
            outcome = run_trial(task, model, user, workdir)
            record.update(answers=outcome["answers"], messages=_plain(outcome["messages"]),
                          tool_log=outcome["tool_log"], final_state=outcome["final_state"], error=None)
        except Exception:
            record.update(answers=[], messages=None, tool_log=[], final_state=None, error=traceback.format_exc())
        record.update(wall_s=round(time.monotonic() - started, 3), calls=model.calls,
                      user_calls=user.calls if user else [])
        return record

    jobs = [(task, trial) for task in tasks for trial in range(TRIALS)]
    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        records = list(pool.map(lambda job: one_trial(*job), jobs))
    wall = time.monotonic() - started

    run = {
        "condition": name, "dry_run": args.dry_run, "model": repo, "revision": revision, "thinking": thinking,
        "sampling": SAMPLING[thinking], "max_tokens": MAX_TOKENS[thinking], "trials_per_task": TRIALS,
        "system": SYSTEM_V1, "tools": TOOL_SPECS, "config_hash": config_hash(SYSTEM_V1, TOOL_SPECS),
        "template_sha": template.sha, "template_matches_transformers": template_check,
        "user": None if args.dry_run else {"model": USER_MODEL, "sampling": USER_SAMPLING,
                                            "template_kwargs": USER_TEMPLATE_KWARGS, "max_tokens": USER_MAX_TOKENS},
        "tasks_file": {"path": str(TASKS.relative_to(ROOT)), "version": json.loads(TASKS.read_text(encoding="utf-8"))["version"]},
        "setup": {"agent_server": backend.server_info(), "gpus": gpu_names(), "python": platform.python_version(),
                  "workers": args.workers},
        "timing": {"wall_seconds": round(wall, 3), "trials": len(records),
                   "generated_tokens": sum(c["completion_tokens"] for r in records for c in r["calls"]),
                   "prompt_tokens": sum(c["prompt_tokens"] for r in records for c in r["calls"]),
                   "user_generated_tokens": sum(c["completion_tokens"] for r in records for c in r["user_calls"])},
        "trials": records,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}{'.dry-run' if args.dry_run else ''}.json"
    path.write_text(json.dumps(run, ensure_ascii=False, indent=1), encoding="utf-8")
    errors = sum(1 for r in records if r["error"])
    print(f"{name}: {len(records)} trials in {wall:.1f}s, {run['timing']['generated_tokens']} tokens generated, "
          f"{errors} trials raised -> {path.relative_to(ROOT)}")
    return run


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--condition", required=True, choices=[*CONDITIONS, "all"])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--agent-url", default="http://localhost:8000")
    parser.add_argument("--user-url", default="http://localhost:8001")
    parser.add_argument("--workers", type=int, default=30)
    parser.add_argument("--tasks", help="comma-separated task ids, for a quick check")
    parser.add_argument("--allow-template-mismatch", action="store_true")
    args = parser.parse_args()
    if not Path("/data/rag/documents.json").exists():
        sys.exit("Module 5's data must be at /data/rag, as in the browser: ln -s \"$PWD/public/data/rag\" /data/rag")
    if args.condition == "all" and not args.dry_run:
        sys.exit("run one condition at a time against a live server; --condition all is for dry runs")
    for name in (CONDITIONS if args.condition == "all" else [args.condition]):
        run_condition(name, args)


if __name__ == "__main__":
    main()
