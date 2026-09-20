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
