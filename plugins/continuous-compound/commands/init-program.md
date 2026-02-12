---
description: Initialize a markdown-only long-running program ledger from user goal + deep exploration + targeted interview
argument-hint: <program name>
allowed-tools: Task, AskUserQuestion, Read, Write, Edit, Glob, Grep, Bash
---

# Initialize Program Ledger

Create a markdown-only contract-driven program ledger for long-running work using this strict sequence:

1. Clear direction and goal from user
2. Deep code exploration
3. Targeted interview loop
4. Synthesis into program ledger

This command is setup only. Ongoing continuity happens through continuous-compound hooks and markdown artifacts.

## Input

- `program name`: required (used as `programs/<program-name>/`)

If missing, ask for it explicitly.

## Phase 1: Direction and Goal (User-First)

Ask for explicit direction before exploring:

1. What outcome must be true when this program is complete?
2. What is in scope and out of scope?
3. What constraints are non-negotiable? (quality, risk, architecture, timeline)
4. Is this primarily a big refactor, big feature addition, or mixed?
5. What mandatory process steps can never be skipped?

Capture:

- `purpose`
- `goal` (measurable)
- `success_criteria` (3-7 bullets)

Do not proceed until the direction is specific enough to evaluate completion.

## Phase 2: Deep Code Exploration

Run deep exploration with parallel sub-agents. Focus on facts, not design decisions.

Required exploration tracks:

1. Architecture and boundaries
2. Dependency graph and likely blast radius
3. Existing patterns to follow
4. Test and verification surface
5. Risk hotspots and migration hazards
6. Delivery slicing opportunities (milestone/task boundaries)

Output from exploration:

- subsystem/file map
- dependency/cascade map
- initial risk register
- candidate milestones and tasks
- unresolved unknowns for interview

## Phase 3: Targeted Interview Loop

Only ask questions exploration cannot answer.

Question types:

- pattern choice
- tradeoffs and coupling boundaries
- migration/regression risk tolerance
- mandatory process enforcement
- scope exclusions

Loop rule:

- run 1-3 interview rounds max
- stop once uncertainty no longer blocks milestone/task definition

## Phase 4: Synthesize Program Ledger

Create markdown artifacts in:

- `programs/<program-id>/contract.md`
- `programs/<program-id>/tasks.md`
- `programs/<program-id>/status.md`
- `programs/<program-id>/risks.md`
- `programs/<program-id>/decision-log.md`
- `programs/<program-id>/evidence/`

Required content:

- contract: purpose, goal, success criteria, scope, constraints, verification, gates, governance, tracking
- tasks: milestone sections + checklist with strict markers `[ ]`, `[>]`, `[x]`, `[!]`
- status: required keys `Current:`, `Next:`, `Blocked:`
- one and only one current task (`[>]`) in tasks.md

## Quality Gates (must pass)

- [ ] Goal is measurable
- [ ] Constraints are enforceable
- [ ] Task and milestone gates are explicit
- [ ] Milestones are dependency-ordered
- [ ] One executable current task exists
- [ ] High-risk items include mitigations
- [ ] Mandatory process is unambiguous

If any gate fails, stop and report exact missing information.
