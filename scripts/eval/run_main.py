"""
Module 7's main runs, first phase: the registry agent (Qwen3.5-4B, thinking on) on the whole task pool,
traced as it runs with the instrumentation Lesson 2 teaches (tracing.py). Two batches with identical
settings and different seeds, so Lesson 10 can measure how much two runs of the same agent differ.

    # dry run, no GPU: stand-in models, both batches, 2 trials each
    python scripts/eval/run_main.py --dry-run --batch all --trials 2

    # on Colab, with the agent and simulated-user servers running (see README-main.md)
    python scripts/eval/run_main.py --batch a
    python scripts/eval/run_main.py --batch b

    # phase 2a: the new suite tasks, same agent and settings
    python scripts/eval/run_main.py --batch a --tasks-file tasks/suite-2a.json --name suite-2a

Writes public/data/eval/main/baseline-<batch>.json (or .dry-run.json). Every trial is saved as the pilot's
were (every raw completion, seed, tool call and the world's final state, so it can be replayed exactly) plus
its trace: the spans from tracing.py, with real timings.

Later phases (a changed prompt, FP8 serving, Module 6's layers, the compaction and memory suites, and the
single-call sets) use this runner's code once later lessons have settled what they need.
"""

import argparse
import dataclasses
import json
import platform
import sys
import tempfile
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from backends import StandInBackend, StandInUserBackend, VLLMBackend, VLLMChatBackend  # noqa: E402
from eval_client import STOP_USER, ChatTemplate, ModelClient, SimulatedUser, seed_for  # noqa: E402
from harness import SYSTEM_V1, config_hash, load_tasks, run_trial  # noqa: E402
from registry_world import TOOL_SPECS, ToolBox  # noqa: E402
from run_pilot import (MAX_TOKENS, MODELS, SAMPLING, USER_MAX_TOKENS, USER_MODEL, USER_SAMPLING,  # noqa: E402
                       USER_TEMPLATE_KWARGS, check_template, gpu_names)
from tokens import _plain  # noqa: E402
from tracing import Tracer, instrument, summarize  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "main"
MODEL = "4b"
THINKING = True
TRIALS = 5
PROVIDER = "vllm"


class TracedUser:
    """The simulated user, with each of its replies recorded as a span. Not a chat span: summarize() and the
    module's graders count only the agent's own model calls."""

    def __init__(self, user, tracer: Tracer, model: str):
        self.user, self.tracer, self.model = user, tracer, model

    def reply(self, messages: list):
        with self.tracer.span("simulated_user reply", {"registry_agent.simulated_user.model": self.model}) as span:
            reply = self.user.reply(messages)
            span.attributes["registry_agent.simulated_user.stopped"] = reply is None
            return reply


def traced_trial(task, model, user, directory, tracer: Tracer, root_attributes: dict, model_id: str) -> dict:
    """run_trial, with the client, tools and checks traced by Lesson 2's instrument() inside a root span."""
    def wrap(client, tools, checks):
        traced_client, traced_tools, traced_checks = instrument(client, tools, checks, tracer, model=model_id,
                                                                provider=PROVIDER)
        # keep the world's ToolBox behaviour: an unknown tool comes back as an error result, not a crash
        return traced_client, ToolBox(traced_tools), traced_checks

    with tracer.span("invoke_agent registry_agent", root_attributes) as root:
        outcome = run_trial(task, model, user, directory, checks=None, wrap=wrap)
        totals = summarize(tracer.spans)
        root.attributes["gen_ai.usage.input_tokens"] = totals["input_tokens"]
        root.attributes["gen_ai.usage.output_tokens"] = totals["output_tokens"]
    return outcome


def environment(args, vllm_version: str) -> dict:
    """What was changed on the machine to get the servers running, from the command line, so a run records it."""
    env_vars = dict(pair.split("=", 1) for pair in args.env_var)
    return {"vllm": vllm_version, "env_vars": env_vars,
            "packages_removed": args.package_removed, "notes": args.environment_notes}


def run_batch(batch: str, args) -> dict:
    repo, revision = MODELS[MODEL]
    condition = f"{args.name}-{batch}"
    template = ChatTemplate.qwen35()
    template_check = None
    if args.dry_run:
        backend = StandInBackend(model_id=f"stand-in for {repo}")
    else:
        from huggingface_hub import hf_hub_download
        from transformers import AutoTokenizer
        tokenizer = AutoTokenizer.from_pretrained(repo, revision=revision)
        shipped = Path(hf_hub_download(repo, "chat_template.jinja", revision=revision)).read_text(encoding="utf-8")
        template = ChatTemplate(shipped)
        template_check = check_template(template, tokenizer, THINKING)
        if not template_check:
            sys.exit("our template rendering differs from transformers'; see run_pilot.check_template")
        backend = VLLMBackend(args.agent_url, repo, tokenizer)

    tasks_path = HERE / args.tasks_file
    tasks = load_tasks(tasks_path)
    if args.tasks:
        tasks = [t for t in tasks if t.id in args.tasks.split(",")]
    workdir = tempfile.mkdtemp(prefix="registry-world-")
    hash_ = config_hash(SYSTEM_V1, TOOL_SPECS)

    def one_trial(task, trial):
        seed = seed_for("main", condition, task.id, trial)
        model = ModelClient(backend, template, SYSTEM_V1, TOOL_SPECS, THINKING, SAMPLING[THINKING],
                            MAX_TOKENS[THINKING], seed)
        tracer = Tracer()
        user = None
        if task.user:
            user_backend = (StandInUserBackend(task.user["standin_replies"], STOP_USER) if args.dry_run
                            else VLLMChatBackend(args.user_url, USER_MODEL, USER_TEMPLATE_KWARGS))
            simulated = SimulatedUser(user_backend, task.user["persona"], USER_SAMPLING, USER_MAX_TOKENS, seed)
            user = TracedUser(simulated, tracer, user_backend.model_id)
        trial_id = f"{condition}/{task.id}/{trial}"
        root_attributes = {"gen_ai.operation.name": "invoke_agent", "gen_ai.agent.name": "registry_agent",
                           "gen_ai.request.model": repo, "gen_ai.conversation.id": trial_id,
                           "registry_agent.config_hash": hash_, "registry_agent.task": task.id}
        started = time.monotonic()
        record = {"trial_id": trial_id, "task_id": task.id, "trial": trial, "seed": seed}
        try:
            outcome = traced_trial(task, model, user, workdir, tracer, root_attributes, repo)
            record.update(answers=outcome["answers"], messages=_plain(outcome["messages"]),
                          tool_log=outcome["tool_log"], final_state=outcome["final_state"], error=None)
        except Exception:
            record.update(answers=[], messages=None, tool_log=[], final_state=None, error=traceback.format_exc())
        record.update(wall_s=round(time.monotonic() - started, 3), calls=model.calls,
                      user_calls=user.user.calls if user else [],
                      trace=[dataclasses.asdict(span) for span in tracer.spans])
        return record

    jobs = [(task, trial) for task in tasks for trial in range(args.trials)]
    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        records = list(pool.map(lambda job: one_trial(*job), jobs))
    wall = time.monotonic() - started

    server = backend.server_info()
    run = {
        "condition": condition, "dry_run": args.dry_run, "model": repo, "revision": revision, "thinking": THINKING,
        "sampling": SAMPLING[THINKING], "max_tokens": MAX_TOKENS[THINKING], "trials_per_task": args.trials,
        "system": SYSTEM_V1, "tools": TOOL_SPECS, "config_hash": hash_,
        "template_sha": template.sha, "template_matches_transformers": template_check,
        "user": None if args.dry_run else {"model": USER_MODEL, "sampling": USER_SAMPLING,
                                            "template_kwargs": USER_TEMPLATE_KWARGS, "max_tokens": USER_MAX_TOKENS},
        "tasks_file": {"path": str(tasks_path.relative_to(ROOT)), "version": json.loads(tasks_path.read_text(encoding="utf-8"))["version"]},
        "setup": {"agent_server": server, "gpus": gpu_names(), "python": platform.python_version(),
                  "workers": args.workers},
        "environment": environment(args, server["version"]),
        "timing": {"wall_seconds": round(wall, 3), "trials": len(records),
                   "generated_tokens": sum(c["completion_tokens"] for r in records for c in r["calls"]),
                   "prompt_tokens": sum(c["prompt_tokens"] for r in records for c in r["calls"]),
                   "user_generated_tokens": sum(c["completion_tokens"] for r in records for c in r["user_calls"])},
        "trials": records,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{condition}{'.dry-run' if args.dry_run else ''}.json"
    path.write_text(json.dumps(run, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    errors = sum(1 for r in records if r["error"])
    print(f"{condition}: {len(records)} trials in {wall:.1f}s, {run['timing']['generated_tokens']} tokens generated, "
          f"{errors} trials raised -> {path.relative_to(ROOT)} ({path.stat().st_size / 1e6:.1f} MB)")
    return run


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", required=True, choices=["a", "b", "all"])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--trials", type=int, default=TRIALS)
    parser.add_argument("--agent-url", default="http://localhost:8000")
    parser.add_argument("--user-url", default="http://localhost:8001")
    parser.add_argument("--workers", type=int, default=48)
    parser.add_argument("--tasks", help="comma-separated task ids, for a quick check")
    parser.add_argument("--tasks-file", default="tasks/main.json", help="the task file, relative to scripts/eval")
    parser.add_argument("--name", default="baseline", help="the run's name; files are <name>-<batch>.json")
    # recorded in the run's "environment" field; see README-main.md for the values the baseline used
    parser.add_argument("--env-var", action="append", default=[], metavar="NAME=VALUE",
                        help="an environment variable set for the servers (repeatable)")
    parser.add_argument("--package-removed", action="append", default=[], metavar="PACKAGE",
                        help="a package uninstalled to make vLLM work (repeatable)")
    parser.add_argument("--environment-notes", default=None, help="why, in a sentence or two")
    args = parser.parse_args()
    if bad := [pair for pair in args.env_var if "=" not in pair]:
        parser.error(f"--env-var takes NAME=VALUE, not {bad[0]!r}")
    if not Path("/data/rag/documents.json").exists():
        sys.exit("Module 5's data must be at /data/rag, as in the browser: ln -s \"$PWD/public/data/rag\" /data/rag")
    if args.batch == "all" and not args.dry_run:
        sys.exit("run one batch at a time against a live server; --batch all is for dry runs")
    for batch in ("a", "b") if args.batch == "all" else (args.batch,):
        run_batch(batch, args)


if __name__ == "__main__":
    main()
