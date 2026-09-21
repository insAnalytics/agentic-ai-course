/**
 * Python source for the scripted fake LLM client used throughout Module 2's
 * agent-loop lessons (Lesson 2.4 onward). Kept in one place so every demo's
 * `setupCode` and every graded exercise's hidden tests run against the exact
 * same classes the lesson shows the learner. See architecture.md §4.1.
 *
 * `ToolUseBlock` gets an auto-generated `.id` (not in the original mockup) so a
 * loop can send back a matching `tool_use_id`, as Claude's API requires.
 */
export const FAKE_CLIENT = String.raw`import itertools

_ids = itertools.count(1)

class ToolUseBlock:
    def __init__(self, name: str, input: dict):
        self.type = "tool_use"
        self.id = f"toolu_fake_{next(_ids):02d}"
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
