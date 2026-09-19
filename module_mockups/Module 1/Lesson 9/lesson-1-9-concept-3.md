# Module 1, Lesson 9 — Concept 3: Multi-turn conversations, and why the client resends everything

---

## The API itself has no memory between calls

An LLM API call is completely stateless — nothing about a previous
request is remembered anywhere on the server side. For a multi-turn
conversation to work at all, the *client* has to resend the entire
conversation history — every prior user message and every prior
assistant response — with **every single new request**, not just
whatever's newly being said.

```python
conversation = [
    {"role": "system", "content": "You are a helpful assistant."},
]

def add_turn(conversation: list, user_message: str, assistant_response: str) -> list:
    return conversation + [
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_response},
    ]

conversation = add_turn(conversation, "What is the capital of France?", "The capital of France is Paris.")
print(f"turn 1 -> sending {len(conversation)} messages")

conversation = add_turn(conversation, "What about Germany?", "The capital of Germany is Berlin.")
print(f"turn 2 -> sending {len(conversation)} messages")

conversation = add_turn(conversation, "And Italy?", "The capital of Italy is Rome.")
print(f"turn 3 -> sending {len(conversation)} messages")
```
```
turn 1 -> sending 3 messages
turn 2 -> sending 5 messages
turn 3 -> sending 7 messages
```
*(runs live, shows output — read-only demo snippet, not graded)*

By turn 3, the client's request actually sends all `7` messages — the
original system message, plus every prior exchange — even though the
user only typed three new words, `"And Italy?"`. Every earlier message
travels along again, every single time.

---

## This is REST's statelessness, showing up concretely

This is a direct, satisfying instance of [statelessness, one of REST's guiding principles from Module 0's FastAPI lesson](→ Module 0, the FastAPI lesson, rest api fundamentals concept, the guiding principles explanation): every request carries everything the server needs to process it, with the server never remembering anything about a client between one call and the next. That principle wasn't just an abstract REST design rule — it's the literal, practical reason a chat application has to manage and resend its own growing conversation history on every turn.

---

## The real, compounding cost consequence

Since every message in the history counts as *input tokens* on every
single request, [not free just because it was already sent before](→ this lesson, the response shape concept, the usage tokens finally readable explanation), a long-running conversation's cost grows with every turn — not linearly with just the new content, but with the entire accumulated history, resent in full each time. This is also exactly why [Lesson 6's shared context-window budget](→ this module, context windows and kv cache lesson, what a context window actually is and what happens past it concept) eventually becomes a real constraint in any sufficiently long conversation: the history itself keeps growing, consuming more and more of that fixed, shared budget on every single turn, until eventually something has to give — truncation, summarization, or hitting the limit outright.

---

## Quiz cards

> **Q1.** Does an LLM API remember anything about a previous request
> when a new one arrives?
> - A) Yes, it automatically remembers the full conversation history
> - B) No — the API is completely stateless; nothing about a previous call is remembered server-side ✅
> - C) Only the most recent message is remembered
> - D) It remembers conversations from the same API key indefinitely

> **Q2.** In the live demo, why does turn 3 send 7 messages, when the
> user only typed one new short message?
> - A) This is a bug — only the new message should be sent
> - B) The client resends the entire accumulated conversation history — system message plus every prior exchange — along with the new message, every single time ✅
> - C) The API automatically pads the request with unrelated content
> - D) Each message gets duplicated for redundancy

> **Q3.** How does this concept connect directly to a principle already
> covered in Module 0?
> - A) It doesn't connect to anything covered previously
> - B) It's a concrete instance of REST's statelessness principle — every request carries everything the server needs, with nothing remembered between calls ✅
> - C) It relates to Docker's isolation principle, not REST
> - D) It's related to WebSocket persistence, not REST statelessness

> **Q4.** Why does a long-running conversation's cost grow with every
> turn, not just with the newest content?
> - A) It doesn't — cost only depends on the newest message each time
> - B) Every message in the accumulated history counts as input tokens on every single request, so the entire growing history gets billed again with each new turn ✅
> - C) API providers charge a flat fee per conversation, regardless of length
> - D) Cost only depends on the assistant's responses, never the user's messages

---

*(End of Concept 3. This lesson continues with Concept 4 — sending
non-text inputs — drafted separately.)*
