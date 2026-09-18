# How LLMs Generate Text

> **You'll be able to**
> - Explain what a logit is and how softmax turns raw scores into a real
>   probability distribution over the entire vocabulary
> - Describe the autoregressive generation loop — one token at a time,
>   each new token fed back in as input for the next — and why this
>   makes generation cost scale with output length
> - Explain, from the mechanics already covered, why "the model
>   predicts, it doesn't know" is an accurate description, not just a
>   slogan
> - Explain hallucination as a direct, expected consequence of that
>   mechanism, including why even well-known topics aren't immune
> - Explain what a knowledge cutoff is and why a model can't reliably
>   discuss anything after it without help

**Why it matters**
Nearly every practical question this course will eventually raise about
using an LLM well — why does it sometimes confidently state something
false, why doesn't it know about a recent event, why does "thinking
longer" cost more — traces back to exactly the mechanism covered in this
lesson. Understanding generation as a genuinely mechanical, repeated
process, rather than something closer to recall or reasoning in the
human sense, is what makes every one of those later, more practical
questions make sense on the first pass rather than needing to be
re-explained from scratch.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** What does the final transformer layer produce, before softmax
> is applied?
> - A) The single most likely next word, directly
> - B) A raw score (a logit) for every single token in the entire vocabulary ✅
> - C) A list of only the five most likely next tokens
> - D) A complete sentence

> **Q2.** How many tokens does a model generate in a single step of the
> autoregressive loop?
> - A) An entire sentence at once
> - B) Exactly one token ✅
> - C) A fixed number of tokens, set in advance
> - D) It varies based on the length of the input

> **Q3.** Why does generating a longer response require proportionally
> more computation than a shorter one?
> - A) It doesn't — response length has no effect on computation
> - B) Every generated token requires its own full pass through the entire model, over the whole sequence so far ✅
> - C) Only the first few tokens require real computation
> - D) Longer responses use a smaller, cheaper version of the model

> **Q4.** Does the logit-and-softmax process include any step that
> checks whether a candidate token is actually true?
> - A) Yes, a separate fact-checking step runs before softmax
> - B) No — the exact same mechanism runs regardless of whether the answer is well-established, obscure, or doesn't exist at all ✅
> - C) Only for well-known facts
> - D) Only when explicitly requested by the user

> **Q5.** Why is "the model predicts" more mechanically accurate than
> "the model knows"?
> - A) It isn't — both phrases are equally accurate
> - B) Every token comes from the same statistical best-guess process, with no separate mechanism distinguishing recalled truth from confident-sounding fabrication ✅
> - C) "Predicts" only applies to the first token generated
> - D) "Knows" is accurate for factual questions only

> **Q6.** Is a hallucination best understood as a malfunction in the
> generation process?
> - A) Yes — it represents the mechanism breaking down
> - B) No — it's the exact same mechanism working as designed, landing on a plausible but false continuation ✅
> - C) It only occurs due to a specific software bug
> - D) It's random noise, unrelated to how the model generates text

> **Q7.** Why can a widely-known topic still produce a confidently wrong
> answer?
> - A) Well-known topics are actually immune to hallucination
> - B) A popular misconception can appear frequently enough in training text to score higher than the actual correct answer ✅
> - C) The model deliberately prefers incorrect answers for famous topics
> - D) This can only happen for topics with almost no training data

> **Q8.** Why does a model's knowledge cutoff exist?
> - A) It's an arbitrary restriction added after training
> - B) The model's parameters are fixed once training finishes, learned only from data collected up to that point ✅
> - C) Models are retrained after every conversation
> - D) The cutoff only applies to certain topics

> **Q9.** Does a model reliably know its own exact knowledge cutoff
> date?
> - A) Yes, always, with complete precision
> - B) Not necessarily — its awareness of its own cutoff is itself just another learned pattern, not a built-in certainty ✅
> - C) Models never have any awareness of their own cutoff
> - D) The cutoff is recalculated in real time during each conversation

---

## Closing synthesis — reason it through, then check

*(end of lesson, reflective rather than graded — applying this lesson's
mechanics to scenarios not already covered, then verifying with
[Concept 1's interactive next-token visualizer](→ this lesson, logits and the probability distribution concept, the interactive live next token distribution explanation))*

For each scenario below, reason through three questions before
checking: **(a)** roughly what would the next-token distribution look
like — one dominant candidate, or several closely competing? **(b)** is
hallucination risk high or low here, and why? **(c)** is knowledge
cutoff relevant to this specific prompt at all?

1. `"Water boils at 100 degrees"` — completing with the unit.
2. `"The best programming language for beginners is"` — completing with
   a specific language name.
3. `"The winner of next year's Nobel Prize in Physics will be"` —
   completing with a name.
4. `"The CEO of [a company that changed leadership last month] is"` —
   completing with a name.

*Reasoning to check against:* (1) should have one heavily dominant
candidate (`"Celsius"`) — a near-universal, unambiguous fact, low
hallucination risk, cutoff irrelevant. (2) should show several closely
competing candidates (`"Python"`, `"Scratch"`, `"JavaScript"`) — genuine
disagreement exists in training data itself, since this is actually a
matter of opinion, not a hallucination risk so much as an inherently
contested question. (3) should produce a confident-*looking* answer
despite being fundamentally unknowable in advance — [exactly Concept 3's fabricated-city pattern](→ this lesson, the model predicts it doesnt know grounded in mechanics concept), genuinely high hallucination risk, since nothing about the mechanism prevents a confident guess about something that hasn't happened yet. (4) directly tests knowledge cutoff — if the leadership change happened after training, the model would confidently name the *previous* CEO, having no way to know a change occurred at all.

The pattern to walk away with: the *shape* of the distribution — one
dominant token versus several closely competing ones — is often a more
honest signal of how settled an answer actually is than the fluency of
the final generated sentence ever reveals on its own.
