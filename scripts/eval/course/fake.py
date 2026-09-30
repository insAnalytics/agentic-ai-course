# the fake LLM client used throughout this course, with the windowed-client upgrade -- read-only
from tokens import count_tokens
class ToolUseBlock:
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
