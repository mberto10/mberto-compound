# Compounding Methodology

Compound engineering treats every task as both delivery work and system improvement work.

## Core Loop

1. Plan
   Load subsystem context first, then define atomic change groups and verification.
2. Work
   Execute one group at a time, keeping invariants and tests close to the edits.
3. Review
   Verify the full blast radius, not just the files touched directly.
4. Discover
   Extract reusable patterns, friction points, and missing guardrails from the session.
5. Consolidate
   Turn approved discoveries into durable `.agents` assets or subsystem knowledge updates.
6. Ship
   Close the loop with task-scoped commits, ticket updates, and spec synchronization.

## What Is Worth Encoding

- Repeated multi-step procedures
- Domain knowledge that regularly blocks progress
- Guardrails that should run every time
- Specialist subtasks that can be delegated

Do not encode one-off trivia, style preferences, or obvious generic advice.

## Component Selection

- Skill: reusable knowledge Codex should apply when the context matches
- Workflow: explicit phase the user or harness should execute
- Agent: bounded autonomous subtask with a clear handoff
- Hookless state runner: durable machine state that replaces Claude hook behavior

## Harness Principle

For queued issue execution, every issue should run the same phase sequence:

`linear-context -> plan -> work -> review -> ship`

Discovery runs on a cadence across issues, not necessarily on every issue. Consolidation stays user-approved.

## Evidence Standard

Every phase should leave behind concrete evidence:

- plan: affected subsystems, invariants, change groups
- work: edits, tests, friction, spec gaps
- review: verdict, warnings, failed invariants, missing coverage
- discover: proposed reusable components or knowledge updates
- ship: issue comment, commit set, subsystem spec updates

## Safety Rules

- Prefer explicit file staging over broad git commands.
- Do not use destructive git recovery unless the user explicitly authorizes it.
- Preserve unrelated local changes.
- Ask only when the issue is genuinely ambiguous or blocked.
