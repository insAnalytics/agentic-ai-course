# Calling LLM APIs and Processing Responses

> **You'll be able to**
> - Construct a real LLM API request — endpoint, auth, and a body using
>   `messages`, model, and the generation parameters from Lesson 5
> - Read a real response's content, `usage`, and `stop_reason`, and
>   explain what each field actually tells you
> - Explain why a client must resend the entire conversation history on
>   every turn, grounded in REST's statelessness principle
> - Include an image in a request using base64 encoding, and explain why
>   that encoding step is necessary at all
> - Process a streamed response incrementally, and explain why streaming
>   is possible at all given how generation actually works
> - Recognize how a reasoning model's thinking content appears in a
>   response, and that it's billed regardless of whether it's shown

**Why it matters**
This lesson is where eight lessons of concepts — tokens, message roles,
decoding parameters, context windows, training stages, reasoning
models — stop being separate facts and become fields you'd actually
read and write in a real request and response. Everything after this
lesson in this course assumes you can look at a real API payload and
recognize every piece in it, not because you memorized a schema, but
because you understand what each piece is actually doing underneath.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** What does the `messages` field's `role` value actually
> represent, given what Lesson 7 covered?
> - A) A hardcoded, architecturally-enforced security level
> - B) A learned formatting convention from preference training, now appearing as a literal field in a real request ✅
> - C) A field with no real meaning to the model itself
> - D) Something invented specifically for one API

> **Q2.** What does `usage.output_tokens` in a response actually tell
> you?
> - A) The total number of words in the response
> - B) The actual number of output tokens that call consumed ✅
> - C) The maximum tokens the model can ever generate
> - D) Tokens remaining in the model's training data

> **Q3.** What does a `stop_reason` of `"max_tokens"` indicate?
> - A) The response finished naturally
> - B) Generation was cut off because it hit the output token limit before finishing naturally ✅
> - C) The request failed due to an invalid API key
> - D) The model refused to answer

> **Q4.** Does an LLM API remember anything about a previous request
> when a new one arrives?
> - A) Yes, automatically
> - B) No — the API is completely stateless; nothing is remembered server-side ✅
> - C) Only the most recent message
> - D) Conversations are remembered indefinitely per API key

> **Q5.** How does multi-turn conversation handling connect to a
> principle from Module 0?
> - A) It doesn't connect to anything covered previously
> - B) It's a concrete instance of REST's statelessness principle ✅
> - C) It relates to Docker's isolation principle
> - D) It relates to WebSocket persistence

> **Q6.** Why can't an image's raw binary data be placed directly inside
> a JSON request body?
> - A) JSON has no length limits, so this isn't a problem
> - B) JSON is plain text with no way to embed raw binary data directly — base64 encoding represents it as safe, embeddable text ✅
> - C) Images are always sent as separate files
> - D) JSON only supports numbers

> **Q7.** What does `content` become, structurally, once an image is
> included in a message?
> - A) It stays a plain string either way
> - B) An array of typed content blocks — text and image blocks together ✅
> - C) The `role` field is removed entirely
> - D) A completely separate request

> **Q8.** What mechanism does LLM response streaming directly reuse from
> earlier in this course?
> - A) WebSockets
> - B) SSE (Server-Sent Events), from Module 0's real-time communication lesson ✅
> - C) gRPC streaming
> - D) A completely new, unrelated mechanism

> **Q9.** Why does streaming actually work, mechanically?
> - A) It requires a fundamentally different generation process
> - B) The model already generates text one token at a time; streaming exposes that existing process to the client instead of withholding it ✅
> - C) Streaming only works for short responses
> - D) Streaming makes the model generate faster overall

> **Q10.** How does a reasoning model's "thinking" content typically
> show up in a response?
> - A) Mixed directly into the final answer's text with no distinction
> - B) As a separate content block, distinct from the final answer ✅
> - C) It never appears in the response at all
> - D) As a completely separate HTTP request

> **Q11.** Do all providers expose a reasoning model's thinking content
> the same way?
> - A) Yes, always identically
> - B) No — this varies by provider, though the tokens are billed regardless of whether they're shown ✅
> - C) No provider has ever exposed reasoning content
> - D) Reasoning content is never billed

---

## Closing synthesis — tracing a real multi-turn interaction

*(end of lesson, reflective rather than graded — walking through one
realistic conversation, applying every concept in this lesson)*

A user is three turns into a conversation with a reasoning-capable
model, streaming the response. Before checking the reasoning below,
work through: what does the turn-3 *request* actually contain? What
would you check in the turn-3 *response* to know what happened? What's
different here versus a simple, non-streamed, non-reasoning call?

*Reasoning to check against:* the **request** contains the full
accumulated history — [system message plus every prior user/assistant exchange](→ this lesson, multi turn conversations and why the client resends everything concept), not just the newest message — formatted as a `messages` array with the model name and generation parameters from Lesson 5 alongside it. Because it's a **streamed** request, the client processes the **response** as [a sequence of incremental chunks](→ this lesson, streaming a response concept), assembling the final text progressively rather than waiting for one complete payload. Because it's a **reasoning** model, the assembled response likely includes [a separate thinking block ahead of the final text](→ this lesson, reasoning output in responses concept), and checking `usage.output_tokens` afterward would very plausibly show a number meaningfully higher than the visible final answer's length alone would suggest — the reasoning tokens are in there too, billed regardless of whether the thinking block was actually shown. Checking `stop_reason` afterward confirms whether generation actually finished naturally or got cut short by [the shared context-window budget](→ Module 0, the FastAPI lesson) — a budget growing a little more consumed with every one of these three turns, purely from resending the accumulated history each time.

Every field in this one interaction traces back to a specific, earlier
lesson — which is exactly the point this lesson was built to prove: a
real API call isn't a new thing to learn, it's everything already
learned, arriving together.
