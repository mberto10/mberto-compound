---
description: Start autonomous engineering loop — pulls issues from Linear, executes plan→work→review→commit cycle
argument-hint: <start|stop|status> [--project PROJECT_ID] [--label ready] [--max 20] [--team MB90]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, mcp__linear-server__*
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
- `--label LABEL` — filter issues by label (default: "ready")
- `--team TEAM_ID` — Linear team ID (default: "MB90")
- `--max N` — max iterations before auto-stop (default: 20)

---

## Subcommand: `stop`

1. Read `.claude/harness-state.local.md`
2. If it doesn't exist, report "No active harness session"
3. If it exists, set `active: false` in the YAML frontmatter
4. Report "Harness will stop after current issue completes"
5. **Done. Do not continue to the loop body.**

---

## Subcommand: `status`

1. Read `.claude/harness-state.local.md`
2. If it doesn't exist, report "No harness state file found"
3. If it exists, display:
   - Active/inactive status
   - Current iteration / max iterations
   - Completed issues count and IDs
   - Failed issues count and IDs
   - Consecutive failures
   - Recent friction log entries (last 5)
4. **Done. Do not continue to the loop body.**

---

## Subcommand: `start` — The Loop Body

This is the core autonomous loop. Each execution handles ONE issue. The Stop hook feeds this command back to handle the next issue.

### Step 1: Load or Create State

Read `.claude/harness-state.local.md`. If it doesn't exist, this is a fresh start:

1. Extract configuration from flags (--project, --label, --team, --max)
2. If --project was not provided, use AskUserQuestion to ask:
   - "Which Linear project should the harness pull issues from?" (provide project ID)
   - "Which label marks issues as ready for autonomous work?" (default: "ready")
   - "Maximum iterations before auto-stop?" (default: 20)
3. Create the state file:

```yaml
---
active: true
iteration: 1
max_iterations: {from flag or user input}
consecutive_failures: 0
discover_interval: 5

linear_project: "{project_id}"
linear_team: "{team_id}"
linear_filter_labels: ["{label}"]
linear_done_status: "Done"
linear_in_progress_status: "In Progress"

completed_issues: []
failed_issues: []
skipped_issues: []

friction_log: []
---

You are running the autonomous engineering harness. Execute /harness start to pick up the next issue from Linear and run the plan-work-review-commit cycle. Consult the harness-protocol skill for gate rules and failure handling. Output [ISSUE_COMPLETE: <id>] when done with an issue, [ISSUE_FAILED: <id>] on failure, [HARNESS_DONE] when queue is empty, or [HARNESS_STOP] to end the session.
```

If the state file exists and `active: true`, this is a continuation — read current state and proceed.

If the state file exists and `active: false`, ask the user if they want to restart (reset iteration counter) or resume (keep state, set active: true).

### Step 2: Load the Harness Protocol

Internalize the **harness-protocol** skill. This provides:
- Gate rules (hard vs soft gates)
- Failure taxonomy (retryable vs structural vs blocked)
- Commit discipline
- Context budget management
- Linear etiquette

### Step 3: Fetch Next Issue from Linear

Call `mcp__linear-server__list_issues` with:
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

**Output this marker on its own line and stop.** The Stop hook will detect it and allow the session to exit.

### Step 4: Claim the Issue

1. Call `mcp__linear-server__update_issue` to set status to the `linear_in_progress_status` value
2. Call `mcp__linear-server__create_comment` on the issue:
   ```
   Harness iteration {iteration} starting. Autonomous plan→work→review→commit cycle.
   ```
3. Update state file: set `current_issue: {issue_id}`

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

### Step 9: Log Friction (state bookkeeping is handled by the Stop hook)

Note: Do NOT update `completed_issues`, `failed_issues`, or `consecutive_failures` here — the Stop hook is the single owner of those counters (it reads the completion marker and updates state atomically). Doing it in both places would double-count.

1. Clear `current_issue` in the state file.

2. Append friction points to `friction_log` in state file:
   ```yaml
   friction_log:
     - issue: "{issue_id}"
       iteration: {N}
       points:
         - "{friction description}"
   ```

3. Check discovery trigger: if `completed_issues` count is a multiple of `discover_interval`:
   - Log: "Discovery trigger: {discover_interval} issues completed since last discovery"
   - Run a brief inline discovery pass on accumulated friction
   - If patterns found, note them in state but continue the loop

### Step 10: Output Completion Marker

Based on the outcome, output ONE of these markers **on its own line**:

**Success:**
```
[ISSUE_COMPLETE: {issue_id}]
```

**Failure:**
```
[ISSUE_FAILED: {issue_id}]
```

**Queue empty (should have been caught in Step 3, but as safety net):**
```
[HARNESS_DONE]
```

The Stop hook will detect the marker and:
- Update `completed_issues`/`failed_issues` and `consecutive_failures` (single owner of state counters)
- Feed the harness prompt back to start the next iteration, OR
- Allow exit if max_iterations reached or 3+ consecutive failures

### Context Limit Handling

If you sense context is filling up (many tool calls, large outputs):

1. Commit any completed change groups
2. Comment current progress on the Linear issue
3. Update state file with all current progress
4. Output:
   ```
   [HARNESS_PAUSE: {issue_id}]
   ```
5. The Stop hook will allow exit. Next session can resume with `/harness start`.

---

## Safety Rules

1. **Never force-push.** All commits are normal commits.
2. **Never skip hooks.** Always use standard `git commit` without `--no-verify`.
3. **Never modify files outside the blast radius** identified in the plan phase.
4. **Always verify before committing.** Invariant check + tier0 tests must pass.
5. **Revert on review failure.** Don't leave broken commits in the history.
6. **Respect max_iterations.** The stop hook enforces this, but the command should also check.
7. **Log everything to Linear.** The issue comment is the audit trail.
8. **One issue at a time.** Never work on multiple issues simultaneously.
9. **Ask if truly blocked.** If something needs human input, use AskUserQuestion rather than guessing and potentially breaking things.

---

## Notes

- This command orchestrates the full cycle INLINE — it does NOT invoke /plan, /work, /review as sub-commands. It follows their methodology directly.
- The Stop hook (`hooks/scripts/harness-stop-hook.sh`) creates the loop. This command handles ONE issue per invocation.
- State is persisted in `.claude/harness-state.local.md` (git-ignored, machine-local).
- The harness-protocol skill provides the "how to think" guidance for autonomous decisions.
- Friction logging feeds into periodic `/discover` passes for self-improvement.
