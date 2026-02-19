---
name: markdown-program-autopilot
description: Use when the user asks for long-running autonomous execution with markdown state, wants a self-sustaining work loop, asks to resume or continue a program from local files, or needs strict contract and task marker enforcement in programs/<program>/.
---

# Markdown Program Autopilot

Run a long-lived program from local markdown files with strict schema and repeatable checkpoints.

## When to Use

Use this skill when the user asks to:

- run long projects from markdown instead of Linear
- continue work autonomously across sessions
- enforce strict task marker rules and status keys
- checkpoint progress into handoff files

## Canonical Program Layout

Each program lives at:

`programs/<program>/`

Required files:

- `contract.md`
- `tasks.md`
- `status.md`

Required directories:

- `handoffs/`
- `evidence/`

Optional files:

- `risks.md`
- `decision-log.md`

## Strict Schema Rules

`tasks.md` markers:

- `[ ]` pending
- `[>]` current (exactly one)
- `[x]` done
- `[!]` blocked

`status.md` keys (required):

- `Current:`
- `Next:`
- `Blocked:`

If schema is invalid, do not proceed with execution. Fix schema first.

## Quick Start

### 1) Scaffold (if missing)

```bash
bash codex-skills/markdown-program-autopilot/scripts/scaffold_program.sh --program <program>
```

### 2) Validate

```bash
bash codex-skills/markdown-program-autopilot/scripts/validate_program.sh --program <program>
```

### 3) Execute One Loop Iteration

1. Read `contract.md`, `status.md`, `tasks.md`.
2. Work only on the single `[>]` current task.
3. Update `tasks.md` and `status.md` manually.
4. Add task evidence in `evidence/`.
5. Write checkpoint handoff.

Checkpoint command:

```bash
bash codex-skills/markdown-program-autopilot/scripts/checkpoint_program.sh \
  --program <program> \
  --note "<what was done and what is next>"
```

## Execution Protocol (Self-Sustaining Loop)

Repeat this loop until blocked or complete:

1. Validate schema.
2. Read current `[>]` task.
3. Implement changes for that task only.
4. Verify acceptance criteria and constraints from `contract.md`.
5. Mark task `[x]` only when evidence exists.
6. Select next task manually by setting exactly one `[>]`.
7. Update `status.md` keys (`Current`, `Next`, `Blocked`).
8. Checkpoint handoff.

## Non-Negotiables

- Never keep zero or multiple `[>]` markers.
- Never auto-advance tasks by heuristic scripts.
- Never claim completion without evidence files.
- If blocked, set `[!]` marker and update `Blocked:` with reason.

## Output Discipline

For each completed task, add one evidence file:

`programs/<program>/evidence/<timestamp>-<slug>.md`

Use this minimum structure:

- Task
- Changes
- Verification
- Risks
- Next Step

See format examples in `references/` files.

## References

- Schema and examples: `references/markdown-schema.md`
- Loop playbook: `references/loop-playbook.md`
- Evidence template: `references/evidence-template.md`
- Handoff template: `references/handoff-template.md`
