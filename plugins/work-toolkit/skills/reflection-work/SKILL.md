---
name: Work Reflection
description: This skill should be used when the user asks to "reflect on work", "capture work learnings", "what did we learn", "save work patterns", "update work knowledge", or wants to capture insights from a work session into Linear project documents.
version: 0.1.0
---

# Work Reflection

Capture and compound work session learnings into Linear project documents using a two-layer knowledge architecture.

## Two-Layer Knowledge Architecture

### Layer 1: Cross-Cutting Knowledge
**Document:** "Work Patterns & Communication" in the Management project
**Contains:** Rules that apply across all projects — communication tone, reporting patterns, meeting preparation heuristics, general workflow rules.
**Updated by:** `/reflect` when cross-cutting patterns are discovered.

### Layer 2: Project-Specific Knowledge
**Document:** "Updates & Learnings" per Linear project (created on demand)
**Contains:** Project-specific decisions, stakeholder preferences, domain context, technical patterns unique to that project.
**Updated by:** `/reflect <project_name>` when project-specific patterns are discovered.

## Learning Format

All learnings follow the heuristic format:

```
[Specific, actionable statement] [src:YYYY-MM-DD__context] [type:rule|feature|fix]
```

- **rule**: A behavioral pattern to follow in future sessions
- **feature**: A missing capability that would improve workflow
- **fix**: A correction to existing behavior or templates

## Quality Gates

Only encode learnings that pass ALL of these:

1. **Specific** — Can you act on it without interpretation?
2. **Testable** — Can you verify compliance?
3. **Recurrent** — Will this situation come up again?
4. **Worth encoding** — Is the cost of reading it every time justified?

Reject vague observations like "be more careful" or "check more thoroughly."

## When to Reflect

- After completing a batch of work (KW updates, emails, meeting prep)
- After receiving user corrections (strongest signal)
- After discovering a pattern that applies to multiple projects
- After friction in a workflow (retries, misunderstandings)

## Slash Command

### `/reflect [project_name] [focus text]`

Capture learnings from the current session:
1. Analyzes session for friction, corrections, successes
2. Reads existing knowledge to avoid duplicates
3. Classifies learnings: cross-cutting vs project-specific vs plugin improvement
4. Updates Management doc and/or project doc in Linear
5. Creates Compound issues for plugin improvements

## Consulting Knowledge

Commands that consult knowledge do so silently in Step 0 — the user should not see the lookup, only benefit from the rules being applied.

The following commands consult the Management doc:
- `/draft-email` — communication + reporting rules
- `/weekly-email` — reporting rules
- `/prepare-jf-team` — meeting prep rules + per-project context
- `/prepare-update` — reporting + communication rules
- `/update-youtrack-epic` — per-project context only
