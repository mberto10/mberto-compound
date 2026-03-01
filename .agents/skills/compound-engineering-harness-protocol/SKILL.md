---
name: Harness Protocol
description: This skill should be used when running the autonomous engineering harness (/harness start), when the user asks about "harness gate rules", "autonomous work protocol", "harness failure handling", or when Claude needs guidance on autonomous decision-making during unsupervised plan-work-review-commit cycles.
---

# Harness Protocol

## Purpose

Provide the decision-making framework for autonomous engineering work. When the harness is running, there is no human in the loop for most decisions. This skill teaches you WHEN to proceed, WHEN to revert, WHEN to skip, and WHEN to stop and ask.

---

## Gate Protocol

Gates are checkpoints where work must meet criteria before proceeding. There are two types:

### Hard Gates (must pass, no exceptions)

| Gate | When | Criteria | On Failure |
|------|------|----------|------------|
| Invariant check | After each change group | All subsystem invariants pass | Revert group, try alternate approach once |
| Tier0 tests | After each change group | All tier0 tests pass | Revert group, try alternate approach once |
| Review verdict | After all groups | PASS or PASS_WITH_WARNINGS | Revert all issue commits, mark failed |

**Hard gate failure protocol:**
1. Revert the failing change group (uncommitted changes only)
2. Analyze the failure — is it retryable? (see Failure Taxonomy below)
3. If retryable: try ONE alternate approach. If that also fails, mark as structural.
4. If structural: skip the change group, note in Linear comment, continue to next group.
5. If ALL groups fail: mark issue as failed, revert any committed groups.

### Soft Gates (warn but proceed)

| Gate | When | Criteria | On Warning |
|------|------|----------|------------|
| Tier1 tests | During review | All tier1 tests pass | Proceed with PASS_WITH_WARNINGS |
| Spec coverage | During review | All changes covered by specs | Note gaps, create follow-up issues |
| Commit message | Before commit | Follows structured format | Fix format, don't skip commit |

**Soft gate warning protocol:**
1. Log the warning
2. Include in Linear comment
3. Proceed unless 3+ soft gate warnings accumulate — then pause and assess

---

## Issue Parsing

### Well-Structured Issues

Issues following the template have clear sections:

```markdown
## Goal
[What should be true after]

## Subsystems
[Which subsystem specs to load]

## Acceptance Criteria
- [ ] Testable assertions

## Constraints
[What not to do]

## Done When
[Verification command]
```

Extract each section directly. Map "Subsystems" to paths under `subsystems_knowledge/`.

### Free-Form Issues

Many issues won't follow the template. Extract actionable information:

1. **Goal**: Look for the first sentence or the title. What state change is requested?
2. **Subsystems**: Infer from mentioned file paths, component names, or feature areas. Map to `subsystems_knowledge/**/*.yaml` by checking `description` and `paths.owned`.
3. **Acceptance criteria**: Look for "should", "must", "needs to", bullet points, checkboxes. If none found, derive from the goal: what would prove this is done?
4. **Constraints**: Look for "don't", "without", "must not", "keep". If none found, load the affected subsystem's invariants as implicit constraints.
5. **Done when**: Look for test commands, verification steps. If none found, use the affected subsystem's `tests.tier0` as the verification.

### Ambiguous Issues

If after parsing you still can't determine:
- What files to change, OR
- What the success criteria are

Then the issue is **blocked** (needs human input). Comment on it asking for clarification and skip to the next issue. Do NOT guess at ambiguous requirements.

---

## Commit Discipline

### One Commit Per Change Group

Each change group gets its own commit. This makes reversion granular — if review fails, you can reset to before a specific group.

### Structured Commit Messages

```
{type}: {concise description}

Issue: {linear_issue_id}
Change-Group: {N}/{total}
Subsystems: {comma-separated subsystem names}
Invariants: {pass_count}/{total_count} verified

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Type prefixes:**
- `feat:` — new functionality
- `fix:` — bug fix
- `refactor:` — restructuring without behavior change
- `test:` — test additions or changes
- `docs:` — documentation updates
- `chore:` — maintenance tasks

### What NOT to Commit

- Files with secrets or credentials
- Generated files that should be in .gitignore
- Unrelated changes (keep commits focused on the issue)
- Changes outside the planned blast radius

### Staging

Always `git add` specific files by name. Never use `git add -A` or `git add .` — this prevents accidentally staging unrelated changes or sensitive files.

---

## Failure Taxonomy

### Retryable Failures

**Characteristics:** Transient, non-deterministic, or caused by a fixable approach choice.

| Signal | Example | Action |
|--------|---------|--------|
| Test flake | Test passed before, fails now with no code change | Re-run once |
| Transient error | Network timeout, file lock | Wait briefly, retry |
| Wrong approach | Change group approach doesn't work but goal is clear | Try one alternate approach |
| Minor syntax | Typo, missing import | Fix and re-verify |

**Retry budget:** ONE retry per change group. If retry also fails, escalate to structural.

### Structural Failures

**Characteristics:** The approach fundamentally doesn't work. Retrying won't help.

| Signal | Example | Action |
|--------|---------|--------|
| Design mismatch | Issue requires architecture the codebase doesn't support | Skip group, flag in Linear |
| Missing dependency | Needs a library/service that isn't available | Skip group, create sub-issue |
| Conflicting invariants | Fixing one invariant breaks another | Skip group, flag as needs design |
| Cascading failures | Change group breaks downstream subsystems | Revert, flag in Linear |

**Action:** Revert the change group. Log detailed failure reason in Linear comment. Move to next group.

### Blocked Failures

**Characteristics:** Cannot proceed without human input.

| Signal | Example | Action |
|--------|---------|--------|
| Ambiguous requirements | Issue doesn't specify what to change | Comment asking for clarification |
| Access needed | Requires credentials, permissions, or external service | Comment explaining blocker |
| Design decision | Multiple valid approaches, no clear winner | Comment with options |
| Risk too high | Change could break production, needs human review | Comment with risk assessment |

**Action:** Comment on the issue with specific questions or blockers. Skip the issue (add to `skipped_issues`). Move to next issue.

---

## Context Budget Management

### When to Push Through

- You're mid-change-group and close to completing it
- Only 1-2 change groups remain
- The remaining work is mechanical (no complex reasoning needed)

### When to Save State and Pause

- You've completed 5+ change groups with extensive tool output
- You're about to start a new complex change group
- Tool call responses are getting very long
- You're doing multi-file tracing through unfamiliar code

### How to Pause

1. **Commit** any completed change groups (don't lose work)
2. **Comment** on the Linear issue with current progress:
   ```
   Harness pausing — context limit approaching.

   Completed: {N}/{total} change groups
   Commits: {hashes}
   Remaining: {description of what's left}

   Resume with /harness start
   ```
3. **Update state file** with all progress
4. Output `[HARNESS_PAUSE: {issue_id}]`

### How to Resume

When `/harness start` loads a state file with `current_issue` set:
1. Read the Linear issue and previous comments to understand where you left off
2. Check git log to see which change groups were already committed
3. Continue from the next uncommitted change group

---

## Self-Improvement Triggers

### Friction Patterns Worth Logging

| Pattern | Why It Matters |
|---------|----------------|
| Same subsystem spec consulted 3+ times per issue | Spec might be missing helpful_skills |
| Invariant not in spec but discovered during work | Spec gap — create follow-up issue |
| Same test command typed repeatedly | Should be in subsystem spec tests section |
| Manual step that could be automated | Hook or command candidate |
| Knowledge looked up externally | Should be encoded as skill or reference |

### Discovery Trigger

Every `discover_interval` completed issues (default: 5), run a brief discovery pass:

1. Review accumulated `friction_log` entries
2. Look for patterns appearing 3+ times
3. If found: note the pattern and propose a component (skill, command, hook)
4. Don't stop the loop for discovery — log it and continue

### Spec Gap Handling

When you find a gap in a subsystem spec during work:

1. Note it immediately in the friction log
2. After the issue is complete, create a new Linear issue:
   - Title: "Spec gap: {subsystem} — {what's missing}"
   - Apply the harness filter label so it gets picked up
3. Do NOT modify subsystem specs during issue work — that's a separate change

---

## Linear Etiquette

### What to Comment

- **On claim:** Brief note that harness is starting work
- **On completion:** Summary with file count, test results, commit hashes
- **On failure:** Detailed failure reason, what was tried, what needs human attention
- **On pause:** Progress so far and what remains
- **On spec gaps:** Create separate issues, don't burden the current issue

### What NOT to Comment

- Don't dump full test output (summarize)
- Don't include file diffs (they're in git)
- Don't comment on every change group (one summary at end)
- Don't speculate about issues beyond the current one

### Label Conventions

| Label | When |
|-------|------|
| Filter label (e.g., "ready") | Issue is ready for autonomous work |
| `blocked` | Issue needs human input |
| `spec-gap` | Issue is a discovered spec gap |

### Status Transitions

| From | To | When |
|------|-----|------|
| Ready/Backlog | In Progress | Harness claims the issue |
| In Progress | Done | All gates pass |
| In Progress | (unchanged) | Harness fails — leave for human triage |

---

## Issue Template (for best results)

Teach teams to structure issues for harness consumption:

```markdown
## Goal
[One sentence: what should be true after this is done]

## Subsystems
[e.g., backend/api, frontend/core-loop]

## Acceptance Criteria
- [ ] [Testable assertion 1]
- [ ] [Testable assertion 2]

## Constraints
[Invariants, no-go areas, or "see subsystem spec"]

## Done When
[Test command or verification step]
```

The harness can handle free-form issues too, but structured issues produce better results because:
- Subsystem mapping is explicit, not inferred
- Acceptance criteria become test assertions
- Constraints prevent the harness from making wrong assumptions
- "Done When" provides a concrete verification step
