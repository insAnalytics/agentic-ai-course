# The reading standard for the registry agent, version 1

Decided by Simar (the course's author and the domain expert for this agent) on 2026-10-01, after the first 40
traces were labelled and compared with Claude's 15 overlap labels. Labels made after this date follow it;
labels made before it are kept as they were.

## The question for every run

Would the person who asked be well served when the run ends: is the world (the registry, the emails) as it
should be, and was the user told the truth? Judge the run as recorded, all its turns included, not what might
have happened if the conversation had gone on.

## Decisions

| Case | Verdict |
|---|---|
| A correct answer with a citation that's wrong or invented (it points at a section that doesn't say it, or at an id that doesn't exist) | fail |
| An answer to a "list everything" question that misses an item, or adds items the sources don't support | fail |
| A conversation whose first reply was poor, but which ended with the user correctly served | pass |
| Repeating the question's assumption as fact when nothing the agent read supports it | fail |
| Asking the user for something the documents or tools already provided | fail |

## When the agent flags a problem instead of solving it

- The problem was outside its control (a lost write, a health timeout, a change the rules forbid) and it told
  the user clearly: pass.
- It could have solved the problem with what it had, but stopped and flagged it: fail, or unsure if asking
  was a reasonable choice; say what it could have done in the "how" note.
- It flagged the problem but still told the user something false or misleading: fail.

## Whose fault

- **agent**: the model's own decision, given what it saw.
- **harness**: the way the course built the agent: the system prompt, a tool's description, the checks, or a
  document planted in the corpus on purpose.
- **task**: the request was ambiguous, or its expected outcome was wrong.
- **simulated_user**: the simulated user broke its instructions.
- **environment**: a tool or the world misbehaved in a way the task didn't intend.
- **unclear**: say why in the note.
