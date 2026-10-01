"""
Module 4 promised a test for the summarizer: real runs, each compacted and probed, rerun whenever the summary
instructions, the model or the compaction threshold change. This runs it for Module 7, Lesson 5.

- The runs: the 20 longest dev traces from the baseline (both batches), by number of rounds, among those with at
  least two facts to probe, and at most two runs of any one task. Held-out tasks are left out.
- The compaction: each run is cut after its last tool round; everything but that last round is summarised, as
  Module 4's summary_request does (keep_recent=1). The 4B, with the agent's own settings, writes the summary
  under two sets of instructions: Module 4's SUMMARY_INSTRUCTIONS ("careful") and a plain "summarize briefly"
  ("plain"), 3 samples each.
- The probes: written by this script from facts in the rounds the summary replaces, so each has an exact answer:
  which agent the request is about, what model the registry reported for an agent, which error code a tool
  returned, how many searches had been made. The 4B answers each from the summary alone (thinking off, greedy),
  and code grades the answer: the expected value must appear in it (a count as a whole number, in digits or words).

    python scripts/eval/run_summarizer_test.py --dry-run     # stand-in model, no GPU
    python scripts/eval/run_summarizer_test.py               # on Colab, with the agent server on :8000

Writes public/data/eval/summarizer/summarizer-test.json (or .dry-run.json).

One difference from Module 4's summary_request: the instructions go in a user message of their own after the
last tool results, instead of being appended to that message, because the chat template only allows tool results
in a results message. The text is the same.
"""

import argparse
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from eval_client import ChatTemplate, ModelClient, block_from_dict, seed_for  # noqa: E402
from harness import SYSTEM_V1, load_tasks  # noqa: E402
from m4 import SUMMARY_INSTRUCTIONS, split_rounds  # noqa: E402
from run_pilot import MAX_TOKENS, MODELS, SAMPLING, check_template, gpu_names  # noqa: E402

ROOT = HERE.parents[1]
RUNS = [ROOT / "public" / "data" / "eval" / "main" / f"baseline-{batch}.json" for batch in "ab"]
OUT = ROOT / "public" / "data" / "eval" / "summarizer"
TRACES, SAMPLES, PER_TASK = 20, 3, 2
INSTRUCTIONS = {"careful": SUMMARY_INSTRUCTIONS, "plain": "Summarize the conversation above briefly."}
PROBE_SYSTEM = "Answer the question from the text you're given. Give only the answer."
PROBE_SAMPLING = {"temperature": 0.0}
AGENT = re.compile(r"\b[a-z]+_agent\b")
NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
ERROR_CODE = re.compile(r"\bREG-\d{4}\b")


def plain_messages(recorded: list) -> list:
    """Recorded messages, with the assistant's blocks rebuilt as blocks."""
    return [m if m["role"] == "user" else {**m, "content": [block_from_dict(b) for b in m["content"]]} for m in recorded]


def probes_for(first: dict, older: list) -> list:
    """Questions with exact answers about what the rounds being replaced established."""
    probes = []
    request = first["content"] if isinstance(first["content"], str) else ""
    named = sorted(set(AGENT.findall(request)))
    if len(named) == 1:
        probes.append({"kind": "task", "question": "Which agent is the user's request about? Answer with the agent id only.",
                       "expected": named[0]})
    calls = {b["id"]: b for m in older if m["role"] == "assistant" for b in m["content"] if b["type"] == "tool_use"}
    results = [b for m in older if m["role"] == "user" and isinstance(m["content"], list) for b in m["content"]]
    reported = {}
    for result in results:
        call = calls.get(result["tool_use_id"])
        if call and call["name"] == "get_agent" and not result.get("is_error"):
            try:
                record = json.loads(result["content"])
            except ValueError:
                continue
            if record.get("model"):
                reported[record["agent_id"]] = record["model"]
    for agent, model in sorted(reported.items())[:1]:
        probes.append({"kind": "tool fact", "question": f"What model did the registry last report for {agent}? Answer with the model name only.",
                       "expected": model})
    codes = sorted({code for r in results if r.get("is_error") for code in ERROR_CODE.findall(str(r["content"]))})
    if codes:
        probes.append({"kind": "error", "question": "Which error code did a tool return? Answer with the code only.",
                       "expected": codes[0]})
    searches = sum(1 for call in calls.values() if call["name"] == "search_docs")
    if searches:
        probes.append({"kind": "progress", "question": "How many document searches had been made? Answer with a number only.",
                       "expected": str(searches)})
    return probes


def select(tasks: dict) -> list:
    """The longest dev traces with at least two probes, cut after their last tool round."""
    candidates = []
    for path in RUNS:
        for trial in json.loads(path.read_text(encoding="utf-8"))["trials"]:
            if tasks[trial["task_id"]].split != "dev" or trial["error"]:
                continue
            messages = trial["messages"]
            # cut after the last tool-results message, so the run is mid-task
            last_results = max((i for i, m in enumerate(messages) if m["role"] == "user" and isinstance(m["content"], list)),
                               default=None)
            if last_results is None:
                continue
            cut = messages[:last_results + 1]
            rounds = split_rounds(cut)
            if len(rounds) < 3:
                continue
            older = [m for r in rounds[:-1] for m in r]
            probes = probes_for(cut[0], older)
            if len(probes) >= 2:
                candidates.append({"trial_id": trial["trial_id"], "task_id": trial["task_id"], "rounds": len(rounds),
                                   "messages": cut, "older": [cut[0]] + older, "probes": probes})
    candidates.sort(key=lambda c: (-c["rounds"], c["trial_id"]))
    # at most PER_TASK runs of any one task, so a few long tasks don't fill the set
    chosen, per_task = [], {}
    for candidate in candidates:
        if per_task.get(candidate["task_id"], 0) < PER_TASK:
            chosen.append(candidate)
            per_task[candidate["task_id"]] = per_task.get(candidate["task_id"], 0) + 1
    return chosen[:TRACES]


def probe_correct(probe: dict, answer: str) -> bool:
    """Whether a probe's answer gives its expected value: a whole number (as digits or a word) for a count,
    the exact text anywhere in the answer otherwise."""
    answer = answer.lower()
    if probe["kind"] == "progress":
        n = int(probe["expected"])
        words = [probe["expected"]] + ([NUMBER_WORDS[n]] if n < len(NUMBER_WORDS) else [])
        return any(re.search(rf"(?<![\w.]){word}(?![\w.])", answer) for word in words)
    return probe["expected"].lower() in answer


class StandInText:
    """Not a model: a fixed reply, for dry runs."""
    model_id = "stand-in"

    def complete(self, prompt, sampling, seed, max_tokens, messages=None):
        text = "</think>\n\nThe agent searched the documents and looked up research_agent." if prompt.endswith("<think>\n") \
            else "unknown"
        return {"text": text, "prompt_tokens": len(prompt) // 4, "completion_tokens": len(text) // 4, "finish_reason": "stop"}

    def server_info(self):
        return {"version": "stand-in", "models": ["stand-in"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--agent-url", default="http://localhost:8000")
    parser.add_argument("--workers", type=int, default=32)
    args = parser.parse_args()
    repo, revision = MODELS["4b"]
    template, template_check = ChatTemplate.qwen35(), None
    if args.dry_run:
        backend = StandInText()
    else:
        from huggingface_hub import hf_hub_download
        from transformers import AutoTokenizer
        from backends import VLLMBackend
        tokenizer = AutoTokenizer.from_pretrained(repo, revision=revision)
        template = ChatTemplate(Path(hf_hub_download(repo, "chat_template.jinja", revision=revision)).read_text(encoding="utf-8"))
        template_check = check_template(template, tokenizer, True)
        if not template_check:
            sys.exit("our template rendering differs from transformers'")
        backend = VLLMBackend(args.agent_url, repo, tokenizer)

    tasks = {t.id: t for t in load_tasks(HERE / "tasks" / "main.json")}
    chosen = select(tasks)

    def one(job):
        trace, variant, sample = job
        seed = seed_for("summarizer", trace["trial_id"], variant, sample)
        writer = ModelClient(backend, template, SYSTEM_V1, [], True, SAMPLING[True], MAX_TOKENS[True], seed)
        request = plain_messages(trace["older"]) + [{"role": "user", "content": INSTRUCTIONS[variant]}]
        response = writer.create(request)
        summary = "\n".join(b.text for b in response.content if b.type == "text").strip()
        answers = []
        for n, probe in enumerate(trace["probes"]):
            reader = ModelClient(backend, template, PROBE_SYSTEM, [], False, PROBE_SAMPLING, 64,
                                 seed_for("probe", trace["trial_id"], variant, sample, n))
            reply = reader.create([{"role": "user", "content": f"{summary}\n\nUsing only the summary above: {probe['question']}"}])
            text = " ".join(b.text for b in reply.content if b.type == "text").strip()
            answers.append({"answer": text, "correct": probe_correct(probe, text)})
        return {"trial_id": trace["trial_id"], "variant": variant, "sample": sample, "seed": seed, "summary": summary,
                "summary_calls": writer.calls, "answers": answers}

    jobs = [(trace, variant, sample) for trace in chosen for variant in INSTRUCTIONS for sample in range(SAMPLES)]
    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(one, jobs))
    wall = time.monotonic() - started

    run = {"dry_run": args.dry_run, "model": repo, "revision": revision, "system": SYSTEM_V1,
           "summary_sampling": SAMPLING[True], "probe_sampling": PROBE_SAMPLING, "probe_system": PROBE_SYSTEM,
           "instructions": INSTRUCTIONS, "keep_recent": 1, "samples": SAMPLES, "template_matches_transformers": template_check,
           "setup": {"agent_server": backend.server_info(), "gpus": gpu_names()},
           "timing": {"wall_seconds": round(wall, 3)},
           "traces": [{k: v for k, v in t.items() if k not in ("messages", "older")} for t in chosen],
           "results": results}
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"summarizer-test{'.dry-run' if args.dry_run else ''}.json"
    path.write_text(json.dumps(run, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for variant in INSTRUCTIONS:
        marks = [a["correct"] for r in results if r["variant"] == variant for a in r["answers"]]
        print(f"{variant}: {sum(marks)} of {len(marks)} probe answers right")
    print(f"{len(chosen)} traces, {len(results)} summaries in {wall:.1f}s -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
