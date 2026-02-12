---
name: Resume Project
description: Use when the user asks to "resume work", "continue project", "load program context", or "what was I working on". Loads markdown program context from local files.
version: 2.0.0
---

# Resume Program Context (Markdown)

This skill resumes work from local markdown program artifacts.

## Program Location

By default:

- `programs/<program-name>/contract.md`
- `programs/<program-name>/tasks.md`
- `programs/<program-name>/status.md`
- `programs/<program-name>/handoffs/*.md`

`<program-name>` comes from `CONTINUOUS_COMPOUND_PROGRAM` (default `_autonomous`).

## Resume Steps

1. Read `contract.md` for goal, constraints, and gates.
2. Read `status.md` for `Current:`, `Next:`, and `Blocked:`.
3. Read `tasks.md` and find the single `[>]` current task.
4. Read latest handoff from `handoffs/` if present.
5. Continue execution on current task.

## Strict Rules

- Exactly one `[>]` in `tasks.md`.
- Allowed markers: `[ ]`, `[>]`, `[x]`, `[!]`.
- Status must contain `Current:`, `Next:`, and `Blocked:`.
- Manual task advancement only; do not assume automatic progression.

## Markers

Output these when appropriate:

- `[MILESTONE_COMPLETE: <name>]`
- `[PROJECT_COMPLETE]`
