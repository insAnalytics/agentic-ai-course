# Decoding Strategies and Generation Controls

> **You'll be able to**
> - Explain the difference between greedy decoding and sampling, and
>   why greedy decoding alone tends toward repetitive output
> - Explain what temperature actually does to a distribution — the
>   direct payoff for a field used unexplained since Module 0
> - Explain top-p and top-k as a genuinely separate lever from
>   temperature, and why top-p adapts to a distribution's shape while
>   top-k doesn't
> - Contrast frequency penalty and presence penalty directly, and know
>   when each actually fits
> - Read a logprob to judge how confident a model actually was, beyond
>   what the fluent generated text alone would reveal
> - Explain what a stop sequence controls, and why temperature 0 doesn't
>   guarantee identical output in practice

**Why it matters**
Every one of these controls is a real, commonly-exposed parameter on
every major LLM API — and until now, this course has used several of
them (`temperature`, most visibly) purely as unexplained fields on a
Pydantic model. This lesson closes that gap completely: not just naming
what each control does, but grounding every one of them in the same
logit/softmax mechanics from Lesson 4, so choosing settings for a real
use case becomes a matter of reasoning from mechanism, not guessing from
a vague sense of "higher temperature means more creative."

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** What does greedy decoding always do?
> - A) Randomly select any token from the vocabulary
> - B) Always pick whichever token has the single highest probability ✅
> - C) Pick a token based on how recently it was last used
> - D) Combine the top three candidates into one output

> **Q2.** What does temperature actually do to a token distribution?
> - A) It removes low-probability tokens from consideration entirely
> - B) It reshapes the distribution's sharpness by dividing logits by the temperature value before softmax ✅
> - C) It only affects the very first token generated
> - D) It has no measurable effect on the output

> **Q3.** What's the core difference between what temperature does and
> what top-p/top-k do?
> - A) They're two names for the same mechanism
> - B) Temperature reshapes probabilities without removing any candidate; top-p/top-k remove candidates from the pool entirely before sampling ✅
> - C) Top-p/top-k only apply to the first token generated
> - D) Temperature can only increase probabilities

> **Q4.** Why does top-p keep more tokens for a flat, uncertain
> distribution than for a sharply peaked one, using the same threshold?
> - A) This is inconsistent behavior and indicates an error
> - B) Top-p adapts to the distribution's actual shape — an uncertain distribution needs more tokens to reach the same cumulative probability threshold ✅
> - C) The flat distribution's probabilities don't sum to 1
> - D) Top-p ignores probability values and just counts tokens

> **Q5.** How does presence penalty behave differently from frequency
> penalty once a token has appeared more than once?
> - A) They behave identically in every case
> - B) Presence penalty stays fixed at the same flat amount, while frequency penalty keeps growing with each additional use ✅
> - C) Presence penalty grows even faster than frequency penalty
> - D) Presence penalty resets to zero after the second use

> **Q6.** Why might presence penalty be the better choice for a response
> that legitimately needs to repeat a specific technical term many
> times?
> - A) Presence penalty prevents the term from being used at all after the first time
> - B) It applies one flat penalty and never continues making every additional legitimate repetition more expensive, unlike frequency penalty ✅
> - C) They behave identically in this case
> - D) Technical terms are automatically exempt from both

> **Q7.** What is a logprob, mathematically?
> - A) The raw probability itself, unmodified
> - B) The natural logarithm of a token's probability ✅
> - C) A count of how many tokens were considered
> - D) The number of times a token appeared in training data

> **Q8.** What does a logprob close to `0` indicate?
> - A) Low confidence
> - B) High confidence — a probability near 1 ✅
> - C) No relationship to confidence at all
> - D) An invalid token

> **Q9.** What does a stop sequence actually control?
> - A) Which specific token gets chosen at each step
> - B) When generation halts entirely, the moment the specified string appears in the output ✅
> - C) The overall length of every response
> - D) How confident the model is in its output

> **Q10.** Why can temperature `0` fail to produce byte-for-byte
> identical output across identical requests, in practice?
> - A) It always produces identical output — this never happens
> - B) Batching multiple requests together on shared hardware can subtly change floating-point operation order, occasionally flipping which of two very close candidates comes out ahead ✅
> - C) Temperature 0 disables logit computation entirely
> - D) This only happens with sampling, never greedy decoding

---

## Closing synthesis — choose settings for a real use case

*(end of lesson, reflective rather than graded — extending [the decoding playground built across Concepts 1-3](→ this lesson, greedy decoding vs sampling the baseline choice concept, the interactive decoding playground explanation) into a practical decision exercise)*

For each scenario, decide roughly what you'd set — temperature (low,
medium, high), whether top-p/top-k would help, and whether a
repetition penalty matters — before checking your reasoning against the
playground on a similar prompt:

1. **A customer support bot answering account-specific factual
   questions.**
2. **A brainstorming tool generating varied marketing taglines.**
3. **A code-generation assistant.**

*Reasoning to check your choices against:* (1) wants low temperature,
close to greedy — consistency and precision matter far more than
variety here, and [nondeterminism at temperature 0](→ this lesson, stop sequences and nondeterminism even at temperature 0 concept) is a real caveat worth knowing about even in this exact use case. (2) wants meaningfully higher temperature, and top-p is genuinely useful here — allowing real variety in word choice is the entire point, and a presence penalty helps avoid the same few taglines dominating repeatedly. (3) is the most interesting case: mostly low temperature, since exact syntax matters enormously and a wrong token can break working code — but not *zero*, and a mild frequency penalty can help avoid a model getting stuck in an actual repetition loop (like re-emitting the same broken line), a real failure mode [Concept 1 named directly](→ this lesson, greedy decoding vs sampling the baseline choice concept).

The pattern worth taking away: every one of these settings is a genuine
trade-off, not a "better" or "worse" direction in the abstract —
choosing well means matching the control to what the specific use case
actually needs, exactly the same reasoning this lesson has built toward
one mechanism at a time.
