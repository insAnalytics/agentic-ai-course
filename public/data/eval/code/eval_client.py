"""
One client interface, three implementations. Every client answers `create(messages=...)` with a response
whose `content` is the course's content blocks, which is all Module 6's loop calls:

- ModelClient     a real model, through a backend (vLLM on Colab, or a stand-in for dry runs). The system
                  prompt and tools are bound when it's made, so the loop's call stays `create(messages=...)`.
- ReplayClient    the browser's client: returns a recorded run's turns, after checking that each request
                  is exactly the one the recording answered, and raises ReplayDiverged if it isn't.
- (FakeLLMClient  the course's scripted client, from fake.py, unchanged.)

Simulated users follow the same pattern: SimulatedUser (a real model), ReplayUser (recorded replies).

The Qwen3.5 format lives here too: turning the course's messages into the chat template's messages,
rendering the template, and parsing a raw completion back into content blocks. The raw text is always
recorded, so a call the parser couldn't read is visible in the record, not hidden.
"""

import hashlib
import json
import re
import time
from pathlib import Path

import jinja2
import jinja2.ext
from jinja2.sandbox import ImmutableSandboxedEnvironment

from fake import FakeResponse, TextBlock, ThinkingBlock, ToolUseBlock
from tokens import _plain

TEMPLATES = Path(__file__).resolve().parent / "templates"
STOP_USER = "###STOP###"
END_TOKENS = ("<|im_end|>", "<|endoftext|>")


# --- hashing, so a replay can prove it's the same run ---

def request_hash(messages: list) -> str:
    """A short hash of exactly what the model was sent, the same whatever order a dict's keys are in."""
    text = json.dumps(_plain(messages), sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def seed_for(*parts) -> int:
    return int.from_bytes(hashlib.sha256(":".join(map(str, parts)).encode()).digest()[:4], "big")


def git_blob_sha(text: str) -> str:
    data = text.encode("utf-8")
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


class ModelResponse(FakeResponse):
    """The fake client's response, plus what a real API also returns: token usage, the model that
    answered, and why it stopped."""

    def __init__(self, content: list, usage: dict, model: str, stop_reason: str):
        super().__init__(content)
        self.usage = usage
        self.model = model
        self.stop_reason = stop_reason


def block_from_dict(block: dict):
    if block["type"] == "thinking":
        return ThinkingBlock(block["thinking"])
    if block["type"] == "text":
        return TextBlock(block["text"])
    tool_use = ToolUseBlock(block["name"], block["input"])
    tool_use.id = block["id"]
    return tool_use


# --- the Qwen3.5 chat format ---

def openai_tools(specs: list) -> list:
    """The course's tool definitions (name, description, input_schema) in the shape the template lists."""
    return [{"type": "function", "function": {"name": s["name"], "description": s["description"],
                                               "parameters": s["input_schema"]}} for s in specs]


def template_messages(system: str, messages: list) -> list:
    """The course's messages as the chat template expects them: thinking as reasoning_content, tool calls
    as tool_calls, and each tool result as its own "tool" message, in order."""
    out = [{"role": "system", "content": system}]
    for message in messages:
        content = message["content"]
        if message["role"] == "user":
            if isinstance(content, str):
                out.append({"role": "user", "content": content})
                continue
            for block in content:
                block = _plain(block)
                if block["type"] != "tool_result":
                    raise ValueError(f"a results message can only hold tool results here, not {block['type']}")
                out.append({"role": "tool", "content": str(block["content"])})
        else:
            blocks = [_plain(b) for b in content]
            out.append({
                "role": "assistant",
                "content": "\n\n".join(b["text"] for b in blocks if b["type"] == "text"),
                "reasoning_content": "\n\n".join(b["thinking"] for b in blocks if b["type"] == "thinking"),
                "tool_calls": [{"function": {"name": b["name"], "arguments": b["input"]}}
                               for b in blocks if b["type"] == "tool_use"],
            })
    return out


class ChatTemplate:
    """A model's chat template, rendered the way transformers renders it (the same Jinja settings)."""

    def __init__(self, text: str):
        def raise_exception(message):
            raise jinja2.exceptions.TemplateError(message)

        def tojson(x, ensure_ascii=False, indent=None, separators=None, sort_keys=False):
            return json.dumps(x, ensure_ascii=ensure_ascii, indent=indent, separators=separators, sort_keys=sort_keys)

        env = ImmutableSandboxedEnvironment(trim_blocks=True, lstrip_blocks=True, extensions=[jinja2.ext.loopcontrols])
        env.filters["tojson"] = tojson
        env.globals["raise_exception"] = raise_exception
        self.text = text
        self.sha = git_blob_sha(text)
        self._template = env.from_string(text)

    @classmethod
    def qwen35(cls):
        """The Qwen3.5 template as shipped at Qwen/Qwen3.5-4B@851bf6e (git blob a585dec...)."""
        return cls((TEMPLATES / "qwen3.5-chat_template.jinja").read_text(encoding="utf-8"))

    def render(self, messages: list, tools: list, thinking: bool) -> str:
        return self._template.render(messages=messages, tools=tools, add_generation_prompt=True,
                                     enable_thinking=thinking)


TOOL_CALL = re.compile(r"<tool_call>\s*<function=([^>\n]+)>\n?(.*?)</function>\s*</tool_call>", re.S)
PARAMETER = re.compile(r"<parameter=([^>\n]+)>\n?(.*?)\n?</parameter>", re.S)


def convert(value: str, schema: dict | None):
    """A parameter's text as the type its schema declares. Strings stay as written."""
    kind = (schema or {}).get("type", "string")
    if kind == "string":
        return value
    if kind == "integer":
        return int(value.strip())
    if kind == "number":
        return float(value.strip())
    if kind == "boolean":
        return value.strip().lower() == "true"
    return json.loads(value)


def parse_completion(raw: str, thinking: bool, specs: dict, id_prefix: str) -> tuple[list, list]:
    """A raw Qwen3.5 completion as content blocks, and a list of the problems found reading it.
    Text the parser can't read as a tool call is kept as text, which is what a model's reply looks like
    to the loop when its call was malformed: an answer, and the end of the run."""
    text, problems, content = raw, [], []
    for token in END_TOKENS:
        text = text.removesuffix(token)
    if thinking:
        if "</think>" not in text:
            problems.append("the thinking never ended (cut off at the token limit?)")
            return [ThinkingBlock(text.strip())], problems
        reasoning, text = text.split("</think>", 1)
        content.append(ThinkingBlock(reasoning.strip()))
    start = text.find("<tool_call>")
    head = text if start < 0 else text[:start]
    if head.strip():
        content.append(TextBlock(head.strip()))
    if start < 0:
        return content, problems
    tail = text[start:]
    matches = list(TOOL_CALL.finditer(tail))
    leftover = TOOL_CALL.sub("", tail).strip()
    if not matches:
        problems.append("a <tool_call> the parser couldn't read")
        content.append(TextBlock(tail.strip()))
        return content, problems
    if leftover:
        problems.append(f"text after the tool calls, ignored: {leftover[:80]!r}")
    for i, match in enumerate(matches):
        name = match.group(1).strip()
        properties = specs.get(name, {}).get("input_schema", {}).get("properties", {})
        arguments = {}
        for parameter in PARAMETER.finditer(match.group(2)):
            key, value = parameter.group(1).strip(), parameter.group(2)
            try:
                arguments[key] = convert(value, properties.get(key))
            except (ValueError, json.JSONDecodeError):
                problems.append(f"{name}.{key}: {value!r} isn't a {properties[key]['type']}")
                arguments[key] = value
        block = ToolUseBlock(name, arguments)
        block.id = f"{id_prefix}_{i}"
        content.append(block)
    return content, problems


# --- clients ---

class ModelClient:
    """A real model behind the course's client interface. One client per trial: it numbers its calls,
    derives each call's seed, and records everything needed to replay or audit the trial."""

    def __init__(self, backend, template: ChatTemplate, system: str, tools: list, thinking: bool,
                 sampling: dict, max_tokens: int, seed: int):
        self.backend, self.template = backend, template
        self.system, self.tools, self.thinking = system, tools, thinking
        self.specs = {spec["name"]: spec for spec in tools}
        self.sampling, self.max_tokens, self.seed = sampling, max_tokens, seed
        self.calls = []

    def create(self, messages: list) -> ModelResponse:
        n = len(self.calls)
        rendered = template_messages(self.system, messages)
        prompt = self.template.render(rendered, openai_tools(self.tools), self.thinking)
        # the template sends thinking only from turns after the latest user message; record whether it did
        last_query = max(i for i, m in enumerate(messages) if m["role"] == "user" and isinstance(m["content"], str))
        thinking_by_turn = [(i > last_query, b.thinking) for i, m in enumerate(messages) if m["role"] == "assistant"
                            for b in m["content"] if b.type == "thinking" and b.thinking]
        # split the prompt at the latest user message, so repeated thinking text can't be counted on the wrong side
        split = prompt.rfind("<|im_start|>user\n" + messages[last_query]["content"].strip())
        before, after = prompt[:split], prompt[split:]
        seed = seed_for(self.seed, n)
        started = time.monotonic()
        out = self.backend.complete(prompt, self.sampling, seed, self.max_tokens, rendered)
        wall = time.monotonic() - started
        content, problems = parse_completion(out["text"], self.thinking, self.specs, f"call_{n:02d}")
        self.calls.append({
            "n": n, "request_hash": request_hash(messages), "seed": seed,
            "prompt_tokens": out["prompt_tokens"], "completion_tokens": out["completion_tokens"],
            "finish_reason": out["finish_reason"], "wall_s": round(wall, 3),
            "thinking_sent": {"this_request": [t in after for current, t in thinking_by_turn if current],
                              "earlier_requests": [t in before for current, t in thinking_by_turn if not current]},
            "raw": out["text"], "problems": problems, "content": _plain(content),
        })
        stop = "max_tokens" if out["finish_reason"] == "length" else (
            "tool_use" if any(b.type == "tool_use" for b in content) else "end_turn")
        return ModelResponse(content, {"input_tokens": out["prompt_tokens"], "output_tokens": out["completion_tokens"]},
                             self.backend.model_id, stop)


class ReplayDiverged(Exception):
    """The replayed loop sent a request the recording never answered, so it isn't the recorded run."""


class ReplayClient:
    """Answers each request with the recorded response, after checking the request matches the one the
    recording answered. Tools still run for real; only the model's turns are replayed."""

    def __init__(self, calls: list, model: str):
        self.calls, self.model, self.n = calls, model, 0

    def create(self, messages: list) -> ModelResponse:
        if self.n >= len(self.calls):
            raise ReplayDiverged(f"call {self.n} wasn't in the recording ({len(self.calls)} calls)")
        call = self.calls[self.n]
        if (got := request_hash(messages)) != call["request_hash"]:
            raise ReplayDiverged(f"call {self.n}: request {got} isn't the recorded {call['request_hash']}")
        self.n += 1
        stop = "max_tokens" if call["finish_reason"] == "length" else (
            "tool_use" if any(b["type"] == "tool_use" for b in call["content"]) else "end_turn")
        return ModelResponse([block_from_dict(b) for b in call["content"]],
                             {"input_tokens": call["prompt_tokens"], "output_tokens": call["completion_tokens"]},
                             self.model, stop)


# --- simulated users ---

def user_view(messages: list) -> list:
    """The conversation as the user saw it: their messages, and the agent's final text of each turn.
    Thinking, tool calls and tool results are the agent's business, not the user's."""
    view = []
    for message in messages:
        content = message["content"]
        if message["role"] == "user" and isinstance(content, str):
            view.append({"role": "user", "content": content})
        elif message["role"] == "assistant":
            text = "\n\n".join(b.text for b in content if b.type == "text").strip()
            if text and not any(b.type == "tool_use" for b in content):
                view.append({"role": "assistant", "content": text})
    return view


USER_INSTRUCTIONS = """You are playing a user talking to an operations assistant for a company's agent registry. Stay in character.

{persona}

Rules:
- Write only your next message to the assistant, as the user would type it.
- Give information only when the assistant asks for it, and never invent facts you weren't given above. If you're asked something you don't know, say you don't know.
- When the assistant asks for something you do know, answer plainly and specifically, using the exact names you were given (for example, an agent's id).
- When the assistant has done what you asked, or tells you it can't be done, reply with exactly {stop} and nothing else."""


class SimulatedUser:
    """A user played by a second model, which sees only what a user would. Returns None when the user is
    done (the model wrote the stop marker)."""

    def __init__(self, backend, persona: str, sampling: dict, max_tokens: int, seed: int):
        self.backend, self.persona = backend, persona
        self.sampling, self.max_tokens, self.seed = sampling, max_tokens, seed
        self.calls = []

    def reply(self, messages: list) -> str | None:
        view = user_view(messages)
        # the simulator speaks as the user, so in its own conversation the roles are swapped
        chat = [{"role": "system", "content": USER_INSTRUCTIONS.format(persona=self.persona, stop=STOP_USER)}]
        chat += [{"role": "assistant" if m["role"] == "user" else "user", "content": m["content"]} for m in view]
        seed = seed_for(self.seed, "user", len(self.calls))
        out = self.backend.chat(chat, self.sampling, seed, self.max_tokens)
        text = out["text"].strip()
        self.calls.append({"n": len(self.calls), "view_hash": request_hash(view), "seed": seed,
                           "prompt_tokens": out["prompt_tokens"], "completion_tokens": out["completion_tokens"],
                           "finish_reason": out["finish_reason"], "raw": out["text"]})
        return None if STOP_USER in text else text


class ReplayUser:
    def __init__(self, calls: list):
        self.calls, self.n = calls, 0

    def reply(self, messages: list) -> str | None:
        if self.n >= len(self.calls):
            raise ReplayDiverged(f"user turn {self.n} wasn't in the recording")
        call = self.calls[self.n]
        if (got := request_hash(user_view(messages))) != call["view_hash"]:
            raise ReplayDiverged(f"user turn {self.n}: conversation {got} isn't the recorded {call['view_hash']}")
        self.n += 1
        text = call["raw"].strip()
        return None if STOP_USER in text else text
