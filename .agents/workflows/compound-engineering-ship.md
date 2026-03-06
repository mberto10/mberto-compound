---
description: Final wrap-up — verify subsystem spec, set Linear issue to Done with implementation comment, commit task-specific files
argument-hint: <linear-issue-id e.g. MB90-1553>
allowed-tools: Read, Glob, Grep, Bash, Edit, mcp__linear__get_issue, mcp__linear__update_issue, mcp__linear__create_comment, AskUserQuestion
---

# Ship Command

Close out a completed task: verify subsystem specs are current, update Linear, and commit only the files belonging to this task.

**Issue:** $ARGUMENTS

---

## Step 1: Identify Task Scope

1. Get the Linear issue details using the provided identifier
2. Run `git diff --name-only HEAD` and `git status --short` to enumerate all changed/untracked files
3. Present the file list and ask the user to confirm which files belong to this task (pre-select based on issue context)

**Output:** Confirmed list of files to commit.

---

## Step 2: Map to Subsystems & Verify Specs

For each file in the commit set:

1. Find the owning subsystem via `subsystems_knowledge/**/*.yaml` `paths.owned` globs
2. Read the subsystem spec
3. Check whether the changes require spec updates:

**Checklist per subsystem:**
- [ ] New public functions/classes → add to `public_api`?
- [ ] New invariants introduced (validation, constraints) → add to `invariants`?
- [ ] New dependencies imported → add to `dependencies.runtime` or `dependencies.compile_time`?
- [ ] New test file → add to `tests` tiers?
- [ ] Implementation notes worth recording → add to `notes`?

If updates are needed, make them. If all specs are current, confirm with:

```
Subsystem specs verified — no updates needed.
```

or:

```
Updated {subsystem}.yaml:
- Added {what} to {section}
```

---

## Step 3: Update Linear Issue

1. Compose an implementation comment summarizing:
   - What changed (grouped by logical change area)
   - Key files modified/created
   - Test results (pass counts)
   - Any invariants verified
2. Create the comment on the Linear issue
3. Set the issue status to **Done**

**Comment format:**

```markdown
## Implementation Complete

### Changes
- **[Area 1]**: [what changed]
- **[Area 2]**: [what changed]

### Test Results
- [X passed, Y failed (pre-existing)]

### Files
- `path/to/file.py` — [brief description]
```

---

## Step 4: Commit

1. Stage only the confirmed task files (from Step 1) using `git add` with explicit paths
2. Show `git diff --staged --stat` for final confirmation
3. Commit with message format:

```
feat|fix|refactor: <concise summary> (<issue-id>)

<optional body with details>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

4. Run `git status --short` after to confirm only non-task files remain unstaged

---

## Step 5: Summary

```
═══════════════════════════════════════════════════════════════
SHIPPED: <issue-id>
═══════════════════════════════════════════════════════════════

Commit:     <hash> <message>
Linear:     <issue-id> → Done
Subsystems: <list of checked subsystems>
Spec Updates: <count> (or "none needed")
═══════════════════════════════════════════════════════════════
```

---

## Notes

- This command does NOT push to remote. The user decides when to push.
- If no Linear issue ID is provided, ask for it.
- If the user hasn't run `/review` yet, suggest running it first but don't block.
- Only commit files the user confirms belong to this task — never auto-include unrelated changes.
- Include subsystem spec files in the commit if they were updated in Step 2.
