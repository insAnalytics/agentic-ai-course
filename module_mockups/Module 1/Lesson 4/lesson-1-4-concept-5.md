# Module 1, Lesson 4 — Concept 5: Knowledge cutoff

---

## Training ends, and the parameters stop changing

A model's parameters — [the embeddings, the attention weights, everything covered across this module so far](→ this module, the attention and transformer architecture lesson) — are learned entirely from training data collected up to some specific point in time, and once training finishes, those parameters are fixed. Nothing about them changes during actual use — a conversation with the model doesn't retrain it, doesn't update its weights, doesn't teach it anything new that persists afterward. Whatever happened in the world *after* that training data was collected simply never had any opportunity to influence the model's parameters at all. This cutoff point is the model's **knowledge cutoff**.

---

## Why asking about something recent looks structurally identical to hallucination

Ask a model about an event from after its knowledge cutoff, and
something specific happens mechanically: there's genuinely no training
data reflecting that event anywhere in the parameters that produced this
model, so the exact same logit-computation process from earlier in this
lesson runs with nothing real to actually draw on — [structurally identical to the fabricated-city case from Concept 3](→ this lesson, the model predicts it doesnt know grounded in mechanics concept), and capable of producing exactly the same kind of confident-sounding, plausible, fabricated answer covered in [Concept 4](→ this lesson, hallucination as a direct consequence concept). A model well-trained to recognize this specific situation might instead produce something like "I don't have information about that" — but that response itself is also just [a learned pattern the model was trained to produce](→ this module, the training pipeline lesson) when a question's phrasing resembles ones it was taught to decline, not some separate, built-in awareness of exactly where its own knowledge actually ends.

Worth one more nuance: the cutoff isn't a perfectly sharp line in
practice. Training data isn't uniformly collected or cleanly
time-stamped, so a model's knowledge right around its cutoff date is
often inconsistent — some things from just before the cutoff might be
thin or contradictory, and a model doesn't necessarily know its own
cutoff date precisely either, since that's just another fact it would
need to have learned during training like anything else.

---

## The fix, within a single conversation

None of this means a model can never discuss anything recent — it means
it can't do so from its own trained-in parameters alone. Providing
genuinely current information directly *in the prompt*, as part of the
input rather than relying on what's baked into the weights, sidesteps
the problem entirely for that one conversation — the model can reason
over information handed to it right now, even if that information
postdates its training. This is the natural entry point into two things
covered properly later in this course: [retrieval — finding and injecting relevant, current information into context, the actual mechanism behind RAG](→ this course, the rag systems module), and [tool use — letting a model call a live data source directly rather than relying on anything memorized](→ this module, structured output and tool calling lesson). Both are genuine fixes; neither is implemented here — this lesson stops at understanding *why* the cutoff exists and *why* it matters, the same scope boundary held throughout this lesson.

---

## Quiz cards

> **Q1.** Why does a model's knowledge cutoff exist at all?
> - A) It's an arbitrary restriction added after training, for safety reasons
> - B) The model's parameters are fixed once training finishes, and were learned only from data collected up to that point — nothing after that point could have influenced them ✅
> - C) Models are retrained after every conversation to update their cutoff
> - D) The cutoff only applies to certain topics, not the model as a whole

> **Q2.** Why does asking a model about an event after its knowledge
> cutoff carry the same risk as the fabricated-city example from
> Concept 3?
> - A) It doesn't — recent-event questions are handled by a completely separate mechanism
> - B) There's genuinely no training data reflecting that event, so the same generation process runs with nothing real to draw on, capable of producing the same kind of confident, plausible fabrication ✅
> - C) Models automatically refuse to answer any question about recent events
> - D) Knowledge cutoff only affects questions about specific dates, never events

> **Q3.** Does a model reliably know its own exact knowledge cutoff
> date?
> - A) Yes, always, with complete precision
> - B) Not necessarily — its awareness of its own cutoff is itself just another learned pattern from training, not some separate, built-in certainty ✅
> - C) Models never have any awareness of their own cutoff at all
> - D) The cutoff date is recalculated in real time during each conversation

> **Q4.** How does providing current information directly in a prompt
> address the knowledge cutoff problem?
> - A) It permanently updates the model's trained parameters
> - B) It lets the model reason over information handed to it right now, sidestepping the need to have that information baked into its trained-in weights ✅
> - C) It doesn't help — cutoff-related limitations can't be worked around at all
> - D) It only works for information from before the cutoff date

---

*(End of Concept 5 — final concept section of Lesson 4. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
