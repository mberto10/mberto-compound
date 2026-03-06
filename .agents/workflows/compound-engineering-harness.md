---
description: Run the autonomous multi-issue compound engineering loop for Linear work in Codex
argument-hint: <start|stop|status> [--project PROJECT] [--label ready] [--max 20] [--team MB90] [--discover-interval 3]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__linear__*
---

# Harness Command

Run the Codex-native compound engineering harness. This workflow processes one Linear issue at a time, applying a fixed phase sequence and then continuing with the next eligible issue until the queue is exhausted or the harness is stopped.

## Issue Flow

For each claimed issue, execute:

`linear-context -> plan -> work -> review -> ship`

Discovery is not forced on every issue. It runs on cadence across completed issues using the harness state runner's `discover_interval`.

## Parse Subcommand

Interpret `$ARGUMENTS` as one of:

- `start` or omitted
- `status`
- `stop`

Optional flags:

- `--project PROJECT`
- `--team TEAM` default `MB90`
- `--label LABEL` default `ready`
- `--max N` default `10`
- `--discover-interval N` default `5`
- `--resume`
- `--force`

## `stop`

Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-stop --json
```

Report the resulting state and stop.

## `status`

Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-status --json
```

Summarize:

- active state
- current iteration and max iterations
- current issue if any
- completed, failed, and skipped issues
- discover cadence
- last friction entries

Then stop.

## `start`

### Step 1: Initialize Or Resume State

Harness state lives in:

`compound-state/compound-engineering/harness-state.local.json`

Initialize or resume it with:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-init --project {project} --team {team} --label {label} \
  --max-iterations {max} --discover-interval {discover_interval} --json
```

If required arguments are missing, ask the user once and continue.

### Step 2: Load The Harness Protocol

Read `.agents/skills/compound-engineering-harness-protocol/SKILL.md`.

Use it for:

- failure taxonomy
- gate rules
- pause decisions
- commit discipline
- safe rollback behavior

### Step 3: Fetch The Next Issue

Load the current harness state, then query Linear with:

- project from `linear_project`
- team from `linear_team`
- label filter from `linear_filter_labels`
- exclude done and cancelled issues

Exclude any issue already present in:

- `completed_issues`
- `failed_issues`
- `skipped_issues`

Pick the highest-priority unblocked issue. If no issue remains:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event harness_done --json
```

Output `[HARNESS_DONE]` and stop.

### Step 4: Claim The Issue

1. Move the issue to the configured in-progress status.
2. Add a Linear comment saying the harness has started this iteration.
3. Record the claim:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-claim --issue-id {issue_id} --json
```

Track two local variables for the remainder of the iteration:

- `issue_start_head`: `git rev-parse HEAD`
- `issue_commits`: hashes created during this issue only

### Step 5: Linear Context Phase

Before planning, gather lightweight project and issue context:

- issue goal, acceptance criteria, constraints, comments
- related recent issues in the same project
- current git status and branch context

Use the `compound-engineering-linear_context` workflow methodology, but inline and concise. Do not spend the full turn here if the issue is already clear.

### Step 6: Plan Phase

Apply the `compound-engineering-plan` workflow inline:

1. Load subsystem specs before source files.
2. Identify primary, provider, and consumer subsystems.
3. Extract invariants and test tiers.
4. Build atomic change groups in dependency order.
5. Record risks and spec gaps.

Keep the plan concise, but explicit enough to execute without guessing.

If the issue is too ambiguous to plan safely:

1. Add a blocking comment on the Linear issue.
2. Record:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event issue_skipped --issue-id {issue_id} --json
```

3. Output `[ISSUE_SKIPPED: {issue_id}]`.
4. If `should_continue` is true, return to Step 3.

### Step 7: Work Phase

Apply the `compound-engineering-work` workflow inline:

1. Execute one change group at a time.
2. Verify invariants after every group.
3. Run tier0 tests after every group.
4. Record friction and spec gaps while working.

For each successful change group:

1. Stage only the relevant files.
2. Commit using the harness protocol format.
3. Append the commit hash to `issue_commits`.

If a group fails:

- retry once if the failure is retryable
- skip the group if structural
- stop and mark blocked only if human input is required

### Step 8: Review Phase

Apply the `compound-engineering-review` workflow inline across the full issue blast radius:

1. map changed files to subsystems
2. verify all affected invariants
3. run tier1 tests where appropriate
4. produce a verdict: `PASS`, `PASS WITH WARNINGS`, or `FAIL`

If the review verdict is `FAIL`:

1. Safely undo issue-specific commits only:

```bash
git revert --no-edit <issue-commit-hashes in reverse order>
```

2. Add a Linear comment describing the failure.
3. Record:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event issue_failed --issue-id {issue_id} --json
```

4. Output `[ISSUE_FAILED: {issue_id}]`.
5. If `should_continue` is true, return to Step 3. Otherwise output `[HARNESS_STOP]`.

### Step 9: Ship Phase

Apply the `compound-engineering-ship` workflow inline:

1. verify subsystem specs are current
2. prepare a task-scoped implementation summary
3. update the Linear issue
4. move it to Done
5. confirm only issue-relevant files were committed

Use the ship phase even when the issue required several change-group commits. The ship phase is responsible for the issue-level closeout, not for collapsing commit history.

### Step 10: Record Outcome

Persist the successful issue result:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event issue_complete --issue-id {issue_id} \
  --friction "{friction point}" --json
```

The runner response includes:

- `should_continue`
- `should_discover`
- `completed_count`

Output `[ISSUE_COMPLETE: {issue_id}]`.

### Step 11: Discovery Cadence

If `should_discover` is true, run a short `compound-engineering-discover` pass before moving to the next issue.

Focus the discovery pass on:

- repeated friction across recent completed issues
- recurring spec gaps
- harness pain points worth encoding into `.agents`

Do not auto-run consolidate here. Consolidation remains explicit and user-approved.

### Step 12: Continue Or Stop

- If `should_continue` is true, go back to Step 3.
- Otherwise output `[HARNESS_STOP]` and stop.

## Context Limit Handling

If context pressure becomes too high during an issue:

1. finish or safely stop the current change group
2. comment progress on the Linear issue
3. persist pause state:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event harness_pause --issue-id {issue_id} --json
```

4. output `[HARNESS_PAUSE: {issue_id}]`
5. stop

## Safety Rules

1. One issue at a time.
2. Never force-push.
3. Never use destructive git recovery such as `git reset --hard` for harness rollback.
4. Stage files explicitly.
5. Keep unrelated local changes untouched.
6. Ask the user only when the issue is genuinely blocked or ambiguous.
7. Log material outcomes back to Linear so the issue remains the audit trail.
