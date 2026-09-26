/**
 * Python source for the scripted fake LLM client used throughout Module 2's
 * agent-loop lessons (Lesson 2.4 onward). Kept in one place so every demo's
 * `setupCode` and every graded exercise's hidden tests run against the exact
 * same classes the lesson shows the learner. See architecture.md §4.1.
 *
 * `ToolUseBlock` gets an auto-generated `.id` (not in the original mockup) so a
 * loop can send back a matching `tool_use_id`, as Claude's API requires. The
 * counter is a class variable incremented via the class name (`ToolUseBlock`),
 * not `itertools.count` (untaught in Module 0) -- the exact pattern from
 * Module 0's instance-vs-class-variables concept.
 */
export const FAKE_CLIENT = String.raw`class ToolUseBlock:
    _next_id = 1

    def __init__(self, name: str, input: dict):
        self.type = "tool_use"
        self.id = f"toolu_fake_{ToolUseBlock._next_id:02d}"
        ToolUseBlock._next_id += 1
        self.name = name
        self.input = input

class TextBlock:
    def __init__(self, text: str):
        self.type = "text"
        self.text = text

class FakeResponse:
    def __init__(self, content: list):
        self.content = content

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        response_block = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=[response_block])
`;

/**
 * Hidden-test-only helper: a FakeLLMClient that also snapshots the `messages`
 * list it was handed on every call, so a test can check what the learner's loop
 * actually sent back to the model without depending on whether the learner
 * mutated the caller's list in place or built a new one.
 */
export const RECORDING_CLIENT = String.raw`
class RecordingClient(FakeLLMClient):
    def __init__(self, scripted_responses: list):
        super().__init__(scripted_responses)
        self.seen = []

    def create(self, messages: list) -> FakeResponse:
        self.seen.append(list(messages))
        return super().create(messages)
`;

/**
 * Lesson 2.5 (ReAct) evolution of the fake client: a response is now a *list*
 * of content blocks (a `thinking` block followed by the action, like a real
 * multi-block response), so `scripted_responses` becomes a list of block-lists.
 * Appended after `FAKE_CLIENT` it redefines `FakeLLMClient` and adds
 * `ThinkingBlock`; `RECORDING_CLIENT` (defined after it) subclasses whichever
 * `FakeLLMClient` is in scope, so it works with either version. The lesson
 * page shows this exact text as a static block, so keep them identical.
 */
export const REACT_CLIENT_UPGRADE = String.raw`
class ThinkingBlock:
    def __init__(self, thinking: str):
        self.type = "thinking"
        self.thinking = thinking

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses   # now: a list of block-lists
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        content_blocks = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=content_blocks)
`;

export const REACT_FAKE_CLIENT = FAKE_CLIENT + REACT_CLIENT_UPGRADE;

/**
 * Module 3 Lesson 7 extension: create() also accepts a `tools` argument, as a
 * real API call does, and records both the messages and the tools it was
 * given. Append after REACT_FAKE_CLIENT. Backward compatible: every earlier
 * exercise's create(messages=...) still works on the classes it extends.
 */
export const TOOL_AWARE_CLIENT = String.raw`
class ToolAwareClient(FakeLLMClient):
    def __init__(self, scripted_responses):
        super().__init__(scripted_responses)
        self.seen = []
        self.tools_seen = []
    def create(self, messages, tools=None):
        self.seen.append(list(messages))
        self.tools_seen.append(tools)
        return super().create(messages)
`;

/**
 * Module 4 helper: deterministic token estimate (~4 characters per token) used
 * by every lesson in the context-and-memory module. Independent of the client
 * classes; append it to whatever client the demo or test needs. Content-block
 * objects are converted to plain dicts (via vars) so they can be JSON-encoded.
 */
export const COUNT_TOKENS = String.raw`
import json
import math

def _plain(x):
    # turn content-block objects into plain dicts, so everything can be written as JSON
    if isinstance(x, (str, int, float, bool)) or x is None:
        return x
    if isinstance(x, dict):
        return {key: _plain(value) for key, value in x.items()}
    if isinstance(x, (list, tuple)):
        return [_plain(value) for value in x]
    return _plain(vars(x))

def count_tokens(x) -> int:
    """Approximate token count: about 4 characters per token. Deterministic, not a real tokenizer."""
    if isinstance(x, str):
        return math.ceil(len(x) / 4)
    return math.ceil(len(json.dumps(_plain(x))) / 4)
`;

/**
 * Module 4 Lesson 1 concept 2's `measure_request` (returns parts, input_total,
 * reply_room, headroom). Append after COUNT_TOKENS; later Module 4 demos and
 * exercises build on it. Concept 2's own exercise extends it with `fits` and
 * `largest`, so it defines its own copy.
 */
export const MEASURE_REQUEST = String.raw`
def measure_request(system: str, tools: list, messages: list, max_tokens: int, window: int) -> dict:
    parts = {
        "system": count_tokens(system),
        "tools": count_tokens(tools),
        "messages": count_tokens(messages),
    }
    input_total = sum(parts.values())
    return {
        "parts": parts,
        "input_total": input_total,
        "reply_room": max_tokens,
        "headroom": window - input_total - max_tokens,
    }
`;

/**
 * Module 4 Lesson 4: a stand-in for a provider with a context window. Its
 * create() measures each request with count_tokens and either raises
 * ContextWindowExceeded (on_overflow="error") or silently drops the oldest
 * whole messages, keeping the latest one (on_overflow="drop_front", as Ollama's
 * chat endpoint does). Replies stay scripted. Append after COUNT_TOKENS;
 * subclasses whichever FakeLLMClient is in scope.
 */
export const WINDOWED_CLIENT = String.raw`
class ContextWindowExceeded(Exception):
    pass

class WindowedClient(FakeLLMClient):
    """A stand-in for a provider with a context window. It checks each request's size
    before answering; the replies themselves are still scripted."""
    def __init__(self, scripted_responses: list, window: int, on_overflow: str = "error"):
        super().__init__(scripted_responses)
        self.window = window
        self.on_overflow = on_overflow
        self.seen = []
        self.dropped = []

    def create(self, messages: list, tools=None, system: str = "") -> FakeResponse:
        fixed = count_tokens(system) + count_tokens(tools or [])
        size = fixed + count_tokens(messages)
        if size > self.window and self.on_overflow == "error":
            raise ContextWindowExceeded(f"prompt is too long: {size:,} tokens > {self.window:,} maximum")
        kept = list(messages)
        dropped_now = 0
        # silent mode: drop the oldest whole messages, always keeping the latest one
        while fixed + count_tokens(kept) > self.window and len(kept) > 1:
            kept.pop(0)
            dropped_now += 1
        self.dropped.append(dropped_now)
        self.seen.append(kept)
        return super().create(kept)
`;

/**
 * Module 4 Lesson 4 concept 2: the two tool_use / tool_result pairing rules the
 * API enforces, as a checker returning a list of problems (empty = valid).
 * Depends only on _plain (from COUNT_TOKENS); append after it. A stand-in for
 * the API's check, not the API itself.
 */
export const CHECK_PAIRING = String.raw`
def is_tool_results(message: dict) -> bool:
    return (message["role"] == "user" and isinstance(message["content"], list)
            and all(_plain(b)["type"] == "tool_result" for b in message["content"]))

def check_pairing(messages: list) -> list:
    """The two pairing rules the API enforces, as a list of problems. Empty means the history is valid."""
    problems = []
    for i in range(len(messages)):
        message = messages[i]
        blocks = [_plain(b) for b in message["content"]] if isinstance(message["content"], list) else []
        if message["role"] == "assistant":
            call_ids = [b["id"] for b in blocks if b["type"] == "tool_use"]
            answered = []
            if i + 1 < len(messages) and is_tool_results(messages[i + 1]):
                answered = [b["tool_use_id"] for b in messages[i + 1]["content"]]
            missing = [c for c in call_ids if c not in answered]
            if missing:
                problems.append(f"messages.{i}: tool_use without a tool_result immediately after: {missing}")
        if message["role"] == "user":
            result_ids = [b["tool_use_id"] for b in blocks if b["type"] == "tool_result"]
            called = []
            if i > 0 and messages[i - 1]["role"] == "assistant":
                called = [_plain(b)["id"] for b in messages[i - 1]["content"] if _plain(b)["type"] == "tool_use"]
            unknown = [r for r in result_ids if r not in called]
            if unknown:
                problems.append(f"messages.{i}: tool_result with no tool_use in the previous message: {unknown}")
    return problems
`;

/**
 * Module 4 Lesson 4 concept 4: the open-round rule -- the assistant message whose
 * tool results are being sent must go back exactly as returned (reasoning
 * included). Depends only on _plain; append after CHECK_PAIRING. Structural
 * check only: real thinking blocks carry a signature the API verifies.
 */
export const CHECK_OPEN_ROUND = String.raw`
def check_open_round(history: list, sent: list) -> list:
    """The assistant message whose tool results are being sent must go back exactly as it was returned."""
    def last_assistant(messages):
        found = None
        for message in messages:
            if message["role"] == "assistant":
                found = message
        return found
    returned, resent = last_assistant(history), last_assistant(sent)
    if returned is None:
        return []
    if resent is None or _plain(resent["content"]) != _plain(returned["content"]):
        return ["the newest assistant message was not sent back exactly as returned"]
    return []
`;
