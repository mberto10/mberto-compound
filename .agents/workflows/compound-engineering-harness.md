---
description: Start autonomous engineering loop — pulls issues from Linear, executes plan→work→review→commit cycle
argument-hint: <start|stop|status> [--project PROJECT_ID] [--label ready] [--max 20] [--team MB90]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__linear__*
---

# Harness Command

Autonomous engineering loop that pulls issues from Linear and executes the full plan→work→review→commit cycle unsupervised, leveraging subsystem knowledge at every step.

**Input:** $ARGUMENTS

---

## Parse Subcommand

Extract the subcommand from $ARGUMENTS:
- `start` (default if omitted) — begin or resume the autonomous loop
- `stop` — gracefully stop the loop after current issue completes
- `status` — show current harness state without modifying anything

Also extract optional flags:
- `--project PROJECT_ID` — Linear project to pull issues from
- `--team TEAM_ID` — Linear team ID (default: "MB90")
- `--max N` — max iterations before auto-stop (default: 10)

---

## Subcommand: `stop`

1. Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-stop --json
```

2. If state doesn't exist, report "No active harness session"
3. Otherwise report "Harness stopped" with current state summary
4. **Done. Do not continue to the loop body.**

---

## Subcommand: `status`

1. Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-status --json
```

2. If no state exists, report "No harness state file found"
3. If state exists, display:
   - Active/inactive status
   - Current iteration / max iterations
   - Completed issues count and IDs
   - Failed issues count and IDs
   - Consecutive failures
   - Recent friction log entries (last 5)
4. **Done. Do not continue to the loop body.**

---

## Subcommand: `start` — The Loop Body

This is the core autonomous loop. It processes all queued issues in sequence until the queue is empty, max_iterations is reached, or 3 consecutive failures occur.

### Step 1: Load or Create State

Harness state is managed by the hookless Codex runner at:
`compound-state/compound-engineering/harness-state.local.json`

Initialize or resume state:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-init --project {project} --team {team} --label {label} --max-iterations {max} --json
```

Guidance:
1. Extract configuration from flags (`--project`, `--team`, `--max`, optional label).
2. If project is missing, ask once for project, label, and max iterations.
3. Use `--resume` when state exists and user wants continuation.
4. Use `--force` only when user explicitly wants a fresh restart.

### Step 2: Load the Harness Protocol

Internalize the **harness-protocol** skill. This provides:
- Gate rules (hard vs soft gates)
- Failure taxonomy (retryable vs structural vs blocked)
- Commit discipline
- Context budget management
- Linear etiquette

### Step 3: Fetch Next Issue from Linear

Call `mcp__linear__list_issues` with:
- Project filter: `linear_project` from state
- Team filter: `linear_team` from state
- Label filter: `linear_filter_labels` from state
- Status: NOT "Done", NOT "Cancelled"

From the results, exclude:
- IDs in `completed_issues`
- IDs in `failed_issues`
- IDs in `skipped_issues`

Select the highest-priority unblocked issue. If no issues remain:

```
[HARNESS_DONE]
```

Record terminal state via runner and stop the loop:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event harness_done --json
```

### Step 4: Claim the Issue

1. Call `mcp__linear__update_issue` to set status to the `linear_in_progress_status` value
2. Call `mcp__linear__create_comment` on the issue:
   ```
   Harness iteration {iteration} starting. Autonomous plan→work→review→commit cycle.
   ```
3. Record claim in state:
   ```bash
   python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
     harness-claim --issue-id {issue_id} --json
   ```

### Step 5: Plan Phase

Follow the /plan methodology inline (do NOT invoke /plan as a sub-command):

1. **Parse the issue** — extract goal, subsystems, acceptance criteria, constraints from the issue description. Use the harness-protocol skill's issue parsing guidance for free-form issues.

2. **Locate subsystems** — scan `subsystems_knowledge/**/*.yaml` for specs covering affected areas.

3. **Trace dependencies** — read full specs for affected subsystems, extract dependents, dependencies, invariants.

4. **Examine code** — read source files identified in the blast radius (ONLY after loading subsystem context).

5. **Produce change groups** — organize changes into atomic groups ordered by dependency. For each group specify:
   - Files to change and what changes
   - Invariants to verify after
   - Test command to run (from subsystem spec)

6. **Assess risks** — check `recently_fixed`, known gaps, cascade paths.

Do NOT output the plan in full `/plan` format — keep it concise. The plan is internal to this iteration.

### Step 6: Work Phase

Follow the /work methodology inline (do NOT invoke /work as a sub-command):

For each change group in order:

#### 6a. Apply Changes

Make the code changes for this group. Apply `helpful_skills` from affected subsystems.

**Notice friction** — anything harder than expected, missing patterns, unexpected dependencies. Log inline.

#### 6b. Verify Invariants

Check each invariant from the affected subsystems against the changed code.

```
Invariant Check — Group {N}:
- [PASS] {invariant} — {evidence}
- [FAIL] {invariant} — {issue}
```

#### 6c. Run Tier0 Tests

Run the `tests.tier0` command from the subsystem spec.

#### 6d. Gate Decision

**If ALL pass (invariants + tier0):**
- Stage the changed files: `git add {specific files}`
- Commit with structured message:
  ```
  {type}: {description}

  Issue: {issue_id}
  Change-Group: {N}/{total}
  Subsystems: {affected subsystems}
  Invariants: {pass_count}/{total_count} verified

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  ```

**If ANY fail:**
- Check failure taxonomy (harness-protocol skill):
  - **Retryable** (test flake, transient error): Try ONE alternate approach. If retry also fails, treat as structural.
  - **Structural** (wrong approach, missing dependency): Revert uncommitted changes for this group. Log the failure. Continue to next group.
  - **Blocked** (needs human input): Skip the group. Flag in Linear comment.

### Step 7: Review Phase

Follow the /review methodology inline:

1. **Map changes** — identify all files changed across committed groups, map to subsystems.
2. **Check invariants** — verify all invariants across ALL affected subsystems (not just per-group).
3. **Run tier1 tests** — run `tests.tier1` from each affected subsystem spec.
4. **Produce verdict** — PASS, PASS_WITH_WARNINGS, or FAIL.

#### Gate Decision

**PASS or PASS_WITH_WARNINGS:**
- Proceed to Step 8.
- If warnings exist, include them in the Linear comment.

**FAIL:**
- Assess if the failure is fixable within this iteration.
- If fixable: fix and re-review (one retry).
- If not fixable: revert all commits for this issue using `git reset --hard` to the pre-issue commit (the HEAD before Step 6 began). This discards both the commits and any staged/unstaged changes from the failed work. Mark the issue as failed.
- Note: Be careful with git reset — only reset to the commit that was HEAD before THIS issue's work phase started. Record that commit hash at the start of Step 6.

### Step 8: Update Linear

#### On Success (PASS/PASS_WITH_WARNINGS):

1. Comment on the issue with results:
   ```
   Harness completed issue in iteration {iteration}.

   Files changed: {count}
   Change groups: {completed}/{total}
   Invariants: {pass}/{total} verified
   Tests: tier0 PASS, tier1 PASS
   {Warnings if any}

   Commits: {commit_hashes}
   ```

2. Move issue to `linear_done_status` (Done)

3. If spec gaps were discovered, create new issues in Linear:
   - Title: "Spec gap: {description}"
   - Label: the filter label so harness can pick them up
   - Description: what's missing and which subsystem spec to update

#### On Failure:

1. Comment on the issue:
   ```
   Harness failed on this issue in iteration {iteration}.

   Failure type: {retryable|structural|blocked}
   Reason: {description}
   Change groups completed: {N}/{total}
   {Partial work description if any}

   Requires manual intervention.
   ```

2. Do NOT change the issue status — leave it for human triage.

### Step 9: Update State and Log Friction

Persist iteration outcome with the runner:

- Success:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event issue_complete --issue-id {issue_id} --json
```

- Failure:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
  harness-record --event issue_failed --issue-id {issue_id} --json
```

- Include friction points as needed with repeated `--friction "..."` flags.

### Step 10: Check Termination and Continue

Emit marker for observability:
- Success: `[ISSUE_COMPLETE: {issue_id}]`
- Failure: `[ISSUE_FAILED: {issue_id}]`

Then evaluate the `harness-record` output:
- If `should_continue: true` -> go back to Step 3.
- If `should_continue: false` -> output `[HARNESS_STOP]` and stop.

Also respect manual stop requests by running:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py harness-stop --json
```

### Context Limit Handling

If you sense context is filling up (many tool calls, large outputs):

1. Commit any completed change groups
2. Comment current progress on the Linear issue
3. Persist pause state:
   ```bash
   python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py \
     harness-record --event harness_pause --issue-id {issue_id} --json
   ```
4. Output:
   ```
   [HARNESS_PAUSE: {issue_id}]
   ```
5. **Stop. Do not continue to the next issue.** Next session can resume with `/harness start`.

---

## Safety Rules

1. **Never force-push.** All commits are normal commits.
2. **Use standard commits.** Avoid bypassing verification unless explicitly requested by the user.
3. **Never modify files outside the blast radius** identified in the plan phase.
4. **Always verify before committing.** Invariant check + tier0 tests must pass.
5. **Revert on review failure.** Don't leave broken commits in the history.
6. **Respect max_iterations.** Check before starting each new issue.
7. **Log everything to Linear.** The issue comment is the audit trail.
8. **One issue at a time.** Never work on multiple issues simultaneously.
9. **Ask if truly blocked.** If something needs human input, use AskUserQuestion rather than guessing and potentially breaking things.

---

## Notes

- This command orchestrates the full cycle INLINE — it does NOT invoke /plan, /work, /review as sub-commands. It follows their methodology directly.
- The loop is self-contained: after completing an issue, the command checks termination conditions and loops back to Step 3.
- This Codex variant is hookless: loop continuation and stop conditions are handled explicitly via `compound_engineering_runner.py`.
- State is persisted in `compound-state/compound-engineering/harness-state.local.json` (machine-local).
- The harness-protocol skill provides the "how to think" guidance for autonomous decisions.
- Friction logging feeds into periodic `/discover` passes for self-improvement.
