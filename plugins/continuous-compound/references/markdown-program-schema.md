# Markdown Program Schema

This document defines exact file examples for markdown-only continuous-compound.

## `contract.md` Example

```md
---
program_id: refactor-auth
name: Refactor Auth Pipeline
---

# Program Contract

## Purpose
Improve maintainability of the auth flow without changing external behavior.

## Goal
Ship auth pipeline refactor with zero API contract regressions.

## Success Criteria
- All auth API contract tests pass.
- Legacy pipeline path removed.
- Error handling invariants preserved.

## Scope
### In
- Auth pipeline internals
- Validation boundary cleanup

### Out
- Auth UI redesign

## Constraints
- No public API shape changes.
- No increase in p95 auth latency.

## Verification
- Per task: run tier0 tests for touched modules.
- Per milestone: run auth integration suite.

## Gates
- Task done: acceptance criteria met + evidence recorded.
- Milestone done: all milestone tasks done + milestone checks pass.
```

## `tasks.md` Example

```md
# Tasks

## Milestone 1: Boundary Extraction
- [x] Inventory auth entry points
- [>] Extract auth boundary interfaces
- [ ] Migrate first consumer to boundary

## Milestone 2: Migration
- [ ] Migrate remaining consumers
- [ ] Remove legacy auth pipeline path
- [!] External dependency update pending
```

Rules:

- Allowed markers: `[ ]`, `[>]`, `[x]`, `[!]`
- Exactly one `[>]` line in file

## `status.md` Example

```md
# Program Status
Current: Extract auth boundary interfaces
Next: Migrate first consumer to boundary
Blocked: External dependency update pending

## Notes
- Keep contract constraints visible during each task.
```

Required keys:

- `Current:`
- `Next:`
- `Blocked:`

## Handoff File Example (`handoffs/handoff-YYYY-MM-DD-HHMMSS.md`)

```md
# Auto-Handoff

Generated: 2026-02-12T21:00:00Z
Session Duration: ~48 minutes

## Resume From Here
1. Continue: Extract auth boundary interfaces
2. Re-run tier0 auth tests after final edits

## Task State
- [>] Extract auth boundary interfaces
- [ ] Migrate first consumer to boundary

## Files Modified
- src/auth/pipeline.ts
- src/auth/contracts.ts

## Last Context
Need to complete boundary extraction and verify API contract invariants.
```
