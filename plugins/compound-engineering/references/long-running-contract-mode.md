# Long-Running Contract Mode Spec

Status: command-oriented variant. If you want no recurring command usage, use the continuous-compound spec at `plugins/continuous-compound/references/program-ledger-mode.md`.

This document specifies a new compound-engineering mode for long-running, systematic execution under explicit constraints.

## Problem

Current commands (`/plan`, `/work`, `/review`) are strong for bounded tasks, but long-running initiatives need a persistent execution contract with:

- Explicit purpose, scope, and constraints
- Ongoing progress tracking across sessions
- Structured evidence and governance
- Replanning without losing original intent

## Design Goals

- Preserve compound principles: **Plan -> Work -> Review -> Compound**
- Make constraints first-class and testable
- Keep work incremental (change groups, milestones)
- Track progress through durable artifacts
- Require evidence at every gate
- Support long-running adaptation without contract drift

## Non-Goals

- Replace existing commands
- Fully automate product management
- Hide decisions or skip user approvals

## Shared Compound Principles

This mode unifies principles already present in `compound-loop` and `compound-engineering`:

- Compounding: each cycle must deposit reusable learning
- Invariants over opinions: constraints are verified, not narrated
- Evidence over claims: status updates require artifacts
- Frequency matters: short systematic check-ins beat occasional deep dives
- Frontier shift: optimize for both quality and throughput over time

## Proposed Mode

Name: `/program`

Purpose: manage long-running engineering initiatives with a persistent contract and repeatable execution loop.

Invocation style:

```text
/program start <initiative-name>
/program run [milestone-or-group]
/program checkin
/program replan
/program status
/program close
```

## Core Entities

### 1) Program Contract

The governing agreement for the initiative.

```yaml
id: "prog-2026-02-12-contract-mode"
name: "Contract Mode for Long-Running Work"
purpose: "Deliver a systematic execution mode for long-running engineering tasks."
goal: "Ship a usable mode with command surface, persistence, and gating."
success_criteria:
  - "Mode creates and validates a contract before execution."
  - "Execution persists status across sessions."
  - "Each change group has evidence and gate results."
scope:
  in:
    - "Command workflow and state artifacts"
    - "Integration with plan/work/review/discover/consolidate"
  out:
    - "New external project management backend"
non_goals:
  - "Replacing all workflow commands with one command"
constraints:
  technical:
    - "Reuse current plugin command patterns"
    - "No dependency on external SaaS required"
  quality:
    - "Invariant checks after each change group"
    - "Tiered tests at milestone gates"
  risk:
    - "Do not mutate plugin behavior without explicit state transition"
  schedule:
    - "Must support incremental rollout"
tracking:
  checkin_cadence: "daily or per major group"
  milestones:
    - id: "M1"
      title: "Contract + artifact model"
      done_when: "Contract validates and status artifacts render"
    - id: "M2"
      title: "Execution + gate loop"
      done_when: "run/checkin/replan/status flow works end-to-end"
  metrics:
    - "milestone_completion_pct"
    - "group_pass_rate"
    - "open_risk_count"
verification:
  required_tests:
    - "tier0 on each change group"
    - "tier1 at milestone completion"
  invariants:
    - "Contract constraints are never silently weakened"
    - "Every completed group has evidence"
  acceptance_gates:
    - "Gate A: contract valid"
    - "Gate B: group invariants + tests pass"
    - "Gate C: milestone acceptance criteria pass"
governance:
  decision_log: "required"
  change_control:
    - "Any scope/constraint change must be logged with rationale"
  escalation_rules:
    - "Pause on repeated gate failures or unresolved high-risk item"
```

### 2) Program State

Lifecycle:

```text
draft -> active -> at_risk -> blocked -> active -> complete -> archived
```

Rules:

- `draft`: contract incomplete, no execution allowed
- `active`: execution allowed
- `at_risk`: execution allowed with mandatory mitigation plan
- `blocked`: execution paused until blocker resolution
- `complete`: all acceptance gates passed
- `archived`: immutable historical record

### 3) Evidence

Each change group and milestone must produce:

- Code/test evidence (diff + test outcomes)
- Invariant check evidence
- Decision records
- Newly discovered reusable patterns (if any)

## Artifact Model

Persist under:

```text
.compound/programs/<program-id>/
```

Recommended files:

```text
.compound/programs/<id>/contract.yaml
.compound/programs/<id>/status.md
.compound/programs/<id>/milestones.yaml
.compound/programs/<id>/decision-log.md
.compound/programs/<id>/risks.yaml
.compound/programs/<id>/checkins/YYYY-MM-DD-HHMM.md
.compound/programs/<id>/evidence/<group-id>.md
```

## Command Behaviors

### `/program start`

Creates draft contract and validates completeness.

Workflow:

1. Parse user objective into contract sections
2. Validate required fields
3. Resolve impacted subsystems (via `/plan` logic)
4. Generate initial milestones/change groups
5. Persist artifacts and set state `active` if valid

Output:

- Program ID
- Contract summary
- First executable group
- Initial risks and mitigations

### `/program run`

Executes next change group under active contract.

Workflow:

1. Load current group from milestone plan
2. Execute work (reuse `/work` behavior)
3. Verify invariants and tier0 tests
4. Emit evidence artifact
5. Update status and metrics

Failure behavior:

- If invariant/test gate fails: keep group open, state `at_risk` if repeated

### `/program checkin`

Produces a structured progress report.

Required sections:

- Progress since last check-in
- Gate results and evidence links
- Risk updates
- Drift assessment
- Next group and ETA confidence

### `/program replan`

Adjusts milestones/change groups without losing contract integrity.

Rules:

- Purpose/goal cannot change silently
- Scope or constraint changes require change-control log entry
- Replan must preserve acceptance gates or strengthen them

### `/program status`

Renders current state snapshot:

- State and milestone progress
- Gate pass/fail summary
- Open risks/blockers
- Decision log highlights

### `/program close`

Finalizes the initiative only if all gates pass.

Output:

- Final acceptance verdict
- Residual risks
- Compounding deposits (discoveries/spec updates) completed

## Gate Model

### Gate A: Contract Validity (entry gate)

- Required contract fields present
- At least one measurable success criterion
- Constraints and acceptance gates defined

### Gate B: Change Group Integrity (iteration gate)

- Group objective matches contract scope
- Invariants pass
- Tier0 tests pass
- Evidence artifact written

### Gate C: Milestone Acceptance (milestone gate)

- Milestone done_when met
- Tier1 tests pass
- No unresolved high-priority blocker

### Gate D: Program Closure (exit gate)

- All success criteria satisfied
- Critical risks closed or explicitly accepted
- Discoveries consolidated or deferred with rationale

## Progress and Drift Tracking

Track at each check-in:

- `milestone_completion_pct`
- `groups_done / groups_total`
- `group_pass_rate`
- `open_risk_count` (by severity)
- `gate_failure_streak`
- `scope_change_count`

Drift triggers:

- Repeated failures in same gate
- Increase in unresolved high-risk items
- Frequent scope changes without decision log quality

When drift triggers fire:

1. Move to `at_risk`
2. Require mitigation plan in check-in
3. Block new group execution if mitigation is missing

## Integration with Existing Compound Commands

- `/plan`: used for dependency-aware scoping and grouping during start/replan
- `/work`: used to execute each group
- `/review`: used for milestone and closure verification
- `/discover`: used when friction reveals reusable patterns
- `/consolidate`: used to encode approved discoveries

This keeps `/program` as orchestration, not duplication.

## Minimal Implementation Plan

Phase 1:

- Add `/program` command contract parser + artifact persistence
- Implement `start`, `status`, `checkin`

Phase 2:

- Implement `run` with gate checks and evidence writing
- Implement `replan` with change control

Phase 3:

- Implement `close` with final review and compounding deposit checks
- Add optional hook integrations for automatic check-in reminders

## Why This Fills the Gap

It adds what short-run commands lack:

- Persistent contract memory
- Governance for long horizons
- Explicit drift control
- Repeatable status and evidence protocol

It preserves existing compound philosophy while making it operational for long-running, systematic work.
