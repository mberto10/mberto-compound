# Program Ledger Mode (Markdown-Only)

This plugin runs a long-running engineering program entirely from local markdown artifacts in the repository.

## Purpose

Provide continuity across sessions without external systems by storing contract, tasks, status, handoffs, and evidence in `programs/<program>/`.

## Canonical Layout

- `programs/<program>/contract.md`
- `programs/<program>/tasks.md`
- `programs/<program>/status.md`
- `programs/<program>/risks.md`
- `programs/<program>/decision-log.md`
- `programs/<program>/handoffs/*.md`
- `programs/<program>/evidence/*.md`

## Runtime Configuration

- `CONTINUOUS_COMPOUND_PROGRAM=<program-name>`
- `CONTINUOUS_COMPOUND_WORKSPACE_DIR=<repo-root>`
- `CONTINUOUS_COMPOUND_PROGRAM_DIR=<override-path>`

Deprecated and ignored:

- `CONTINUOUS_COMPOUND_BACKEND`
- `CONTINUOUS_COMPOUND_TEAM_KEY`
- `CONTINUOUS_COMPOUND_LINEAR_API_URL`
- `LINEAR_API_KEY`

## Strict Schema Rules

- `tasks.md` markers:
  - `[ ]` pending
  - `[>]` current
  - `[x]` done
  - `[!]` blocked
- Exactly one `[>]` current task is required.
- `status.md` must contain:
  - `Current:`
  - `Next:`
  - `Blocked:`

Invalid schema blocks hook operations with explicit validation errors.

## Hook Lifecycle

- SessionStart:
  - validate schema
  - inject contract/task/status/handoff context
- PreCompact:
  - validate schema
  - write handoff markdown
  - append handoff metadata to `status.md`
- Stop:
  - enforce milestone/project completion marker behavior

## Execution Model

- Manual task progression only.
- Hooks do not auto-advance tasks.
- Agent updates `tasks.md` and `status.md` as work progresses.
