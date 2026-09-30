"""
Where completions come from. A backend has `model_id` and either `complete(prompt, sampling, seed,
max_tokens, messages)` (the agent: we render the chat template ourselves and send the text) or
`chat(messages, sampling, seed, max_tokens)` (the simulated user: the server applies its own template).
Each returns {"text", "prompt_tokens", "completion_tokens", "finish_reason"}.

- VLLMBackend / VLLMChatBackend talk to a running `vllm serve` over its OpenAI-compatible API. The server
  batches concurrent requests itself, so trials run in threads.
- StandInBackend / StandInUserBackend are deterministic stand-ins for dry runs without a GPU. They are not
  models: they exist to exercise the parser, loop, world, recording and replay, including a malformed
  tool call now and then.
"""

import json
import math
import random
import re
import urllib.request


def post(url: str, body: dict, timeout: float = 600) -> dict:
    request = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                     headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def get(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


class VLLMBackend:
    """The agent's model: raw completions from our own rendering of the chat template, sent as token ids
    so the server tokenises nothing differently. Special tokens are kept in the output, so <think> and
    <tool_call> arrive as the model wrote them."""

    def __init__(self, base_url: str, model_id: str, tokenizer):
        self.base_url, self.model_id, self.tokenizer = base_url.rstrip("/"), model_id, tokenizer

    def complete(self, prompt: str, sampling: dict, seed: int, max_tokens: int, messages=None) -> dict:
        ids = self.tokenizer.encode(prompt, add_special_tokens=False)
        body = {"model": self.model_id, "prompt": ids, "max_tokens": max_tokens, "seed": seed,
                "skip_special_tokens": False, "stop": ["<|im_end|>"], **sampling}
        reply = post(f"{self.base_url}/v1/completions", body)
        choice = reply["choices"][0]
        return {"text": choice["text"], "prompt_tokens": reply["usage"]["prompt_tokens"],
                "completion_tokens": reply["usage"]["completion_tokens"], "finish_reason": choice["finish_reason"]}

    def server_info(self) -> dict:
        info = {"version": get(f"{self.base_url}/version").get("version")}
        info["models"] = [m["id"] for m in get(f"{self.base_url}/v1/models")["data"]]
        return info


class VLLMChatBackend:
    """The simulated user's model, through the server's own chat template."""

    def __init__(self, base_url: str, model_id: str, chat_template_kwargs: dict | None = None):
        self.base_url, self.model_id = base_url.rstrip("/"), model_id
        self.chat_template_kwargs = chat_template_kwargs or {}

    def chat(self, messages: list, sampling: dict, seed: int, max_tokens: int) -> dict:
        body = {"model": self.model_id, "messages": messages, "max_tokens": max_tokens, "seed": seed, **sampling}
        if self.chat_template_kwargs:
            body["chat_template_kwargs"] = self.chat_template_kwargs
        reply = post(f"{self.base_url}/v1/chat/completions", body)
        choice = reply["choices"][0]
        return {"text": choice["message"]["content"] or "", "prompt_tokens": reply["usage"]["prompt_tokens"],
                "completion_tokens": reply["usage"]["completion_tokens"], "finish_reason": choice["finish_reason"]}

    def server_info(self) -> dict:
        return {"version": get(f"{self.base_url}/version").get("version"),
                "models": [m["id"] for m in get(f"{self.base_url}/v1/models")["data"]]}


def estimate_tokens(text: str) -> int:
    return math.ceil(len(text) / 4)


AGENT_NAME = re.compile(r"\b[a-z]+_agent\b")


class StandInBackend:
    """Not a model. Looks at the last message and writes a plausible Qwen3.5-format reply: a tool call
    after a request, an answer quoting the result after a tool result. About one reply in eight is a
    malformed tool call, so the parser's failure path runs too."""

    def __init__(self, model_id: str = "stand-in", malformed_rate: float = 0.125):
        self.model_id, self.malformed_rate = model_id, malformed_rate

    def complete(self, prompt: str, sampling: dict, seed: int, max_tokens: int, messages=None) -> dict:
        rng = random.Random(seed)
        thinking = prompt.endswith("<think>\n")
        last = messages[-1]
        if last["role"] == "tool":
            body = f"From the tool result: {last['content'][:160].strip()}"
        elif rng.random() < self.malformed_rate:
            body = "<tool_call>\n<function=get_agent>\n<parameter=agent_name>\nresearch_agent\n"
        else:
            request = last["content"]
            names = AGENT_NAME.findall(request)
            if names:
                body = f"<tool_call>\n<function=get_agent>\n<parameter=agent_name>\n{names[0]}\n</parameter>\n</function>\n</tool_call>"
            else:
                words = " ".join(request.split()[:6])
                body = f"<tool_call>\n<function=search_docs>\n<parameter=query>\n{words}\n</parameter>\n<parameter=k>\n3\n</parameter>\n</function>\n</tool_call>"
        text = (f"The stand-in considers the request.\n</think>\n\n{body}" if thinking else body)
        return {"text": text, "prompt_tokens": estimate_tokens(prompt), "completion_tokens": estimate_tokens(text),
                "finish_reason": "stop"}

    def server_info(self) -> dict:
        return {"version": "stand-in", "models": [self.model_id]}


class StandInUserBackend:
    """Not a model. Gives the task's scripted stand-in replies in order, then the stop marker."""

    def __init__(self, replies: list, stop: str, model_id: str = "stand-in-user"):
        self.replies, self.stop, self.model_id = replies, stop, model_id

    def chat(self, messages: list, sampling: dict, seed: int, max_tokens: int) -> dict:
        turn = sum(1 for m in messages if m["role"] == "user") - 1
        text = self.replies[turn] if 0 <= turn < len(self.replies) else self.stop
        prompt = "".join(m["content"] for m in messages)
        return {"text": text, "prompt_tokens": estimate_tokens(prompt), "completion_tokens": estimate_tokens(text),
                "finish_reason": "stop"}

    def server_info(self) -> dict:
        return {"version": "stand-in", "models": [self.model_id]}


class ScriptedBackend:
    """Not a model. Returns the given raw completions in order: hand-written reference trajectories, and
    wrong ones, for checking that a task can be passed and that its grader catches what it should."""

    def __init__(self, completions: list, model_id: str = "scripted"):
        self.completions, self.model_id, self.n = completions, model_id, 0

    def complete(self, prompt: str, sampling: dict, seed: int, max_tokens: int, messages=None) -> dict:
        text = self.completions[self.n]
        self.n += 1
        return {"text": text, "prompt_tokens": estimate_tokens(prompt), "completion_tokens": estimate_tokens(text),
                "finish_reason": "stop"}
