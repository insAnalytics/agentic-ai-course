---
doc_id: D10
title: "Incident INC-2067: research_agent returning outdated results"
date: 2026-06-24
access: [all-staff]
source_type: official
---
# Incident INC-2067: research_agent returning outdated results

## Summary

From 2026-06-15 to 2026-06-22, `research_agent` answered questions with knowledge-base articles that had since been updated. Nothing failed and no alert fired; a user noticed that a report quoted a policy that had changed four days earlier.

## What happened

`research_agent` finds its sources through kb-search. On 2026-06-15 a config change set the kb-search cache's time-to-live to 7 days instead of 7 hours. Every search that had been cached returned the version of each article from when it was first cached, so answers drifted further out of date each day.

## Why it took a week to notice

The agent's latency and error rate looked better than usual: cached answers are fast and never fail. Nothing in monitoring measures whether results are current. The only signal was a person comparing an answer with the source.

## What we changed

- kb-search's cache settings are now reviewed like code, and a time-to-live above 24 hours needs the Search team's approval.
- Each kb-search result now carries the date the article was last updated, and `research_agent` includes it when it cites a source.
- Reports produced during the affected week were flagged to their readers.
