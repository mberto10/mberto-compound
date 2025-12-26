---
description: Review and implement pending compound-learning artifacts into plugin improvements
argument-hint: [optional filter - e.g., "only langfuse", "skill descriptions only"]
allowed-tools: Read, Write, Edit, Glob, Grep, mcp__linear__*, AskUserQuestion
---

# Compound Consolidate

Process pending compound-reflect learnings and implement approved changes into plugins.

**User filter:** $ARGUMENTS

## Workflow

### 1. Load Methodology

First, internalize the consolidation-craft skill and compounding-methodology skill. Understand:
- How to review and approve learnings
- Change implementation patterns
- The approval workflow (never auto-implement)

### 2. Gather Pending Learnings

**Try Linear first (preferred):**

Query Linear for pending issues:
- Team: MB90
- Project: Compound
- Labels: compound-learning
- Status: Not completed

**If Linear not available, check local:**

```
./compound-learnings/*.md
```

If user provided filter text, apply it to narrow results.

### 3. Present Each Learning for Review

For each learning, present:

```
═══════════════════════════════════════════════════════════════
📋 LEARNING #[N] from [date]
═══════════════════════════════════════════════════════════════

**Type:** [rule | feature | fix]
**Plugin:** [affected plugin]
**Source:** [src reference]

**Learning:**
> [The 1-line learning statement]

**Proposed Change:**
- File: [path/to/file]
- Action: [update | create | delete]
- Description: [specific change]

**My Recommendation:** [Approve | Defer | Reject]
**Reasoning:** [why]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your decision: (a)pprove / (d)efer / (r)eject / (m)odify?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for user decision before proceeding to next.

### 3b. Evolvability Review

For each proposed change, assess:

```
**Evolvability Check:**
- [ ] Modular: Can this skill/command change independently?
- [ ] Loosely coupled: No hidden dependencies?
- [ ] Adaptable: Does this make future changes easier?

**Cross-Pollination Check:**
- [ ] Could this apply to other plugins/domains?
- [ ] Should this be a shared pattern instead?
```

If a change reduces evolvability, flag it in the recommendation. Sometimes worth it, but should be conscious.

### 4. Handle User Decision

**Approve:** Proceed to implementation (Step 5)

**Defer:** Skip this learning, keep issue/file open for later

**Reject:** Close issue/delete file with reason noted

**Modify:** Ask user what to change, then proceed with modified version

### 5. Implement Approved Changes

Before making any change, show the specific edit:

```
═══════════════════════════════════════════════════════════════
🔧 PROPOSED EDIT
═══════════════════════════════════════════════════════════════

**File:** [full path]

**Current content (lines X-Y):**
```
[existing content]
```

**Proposed change:**
```
[new content]
```

**Reasoning:**
[Why this change implements the learning]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confirm edit? (y)es / (n)o / (m)odify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Only edit after explicit confirmation.

### 6. Implementation Patterns

**For Rules → Skill Update:**
- Add to relevant SKILL.md under "Operational Rules" or similar section
- Use imperative form
- Include source reference

**For Features → New Capability:**
- Create new command file if user-facing action
- Extend skill if knowledge addition
- Add to existing command if small enhancement

**For Fixes → Edit Existing:**
- Update skill description triggers
- Correct command behavior
- Fix inaccurate documentation

### 7. Close the Loop

**If Linear:**
- After implementing, close the issue
- Comment: "Implemented. Changes: [list of files modified]"

**If local files:**
- Create `./compound-learnings/archived/` if needed
- Move processed file there

### 8. Summary Report

After processing all learnings:

```
═══════════════════════════════════════════════════════════════
✅ CONSOLIDATION COMPLETE
═══════════════════════════════════════════════════════════════

**Processed:** X learnings
- Approved & implemented: Y
- Deferred: Z
- Rejected: W

**Files Modified:**
- [file1]: [brief change]
- [file2]: [brief change]

**Suggested Commit Message:**
```
compound: implement learnings from [date range]

- [plugin]: [change summary]
- [plugin]: [change summary]

Closes: [issue IDs]
```

**Follow-up Actions:**
- [Any items needing testing]
- [Any deferred items to revisit]
═══════════════════════════════════════════════════════════════
```

## Important Notes

- **Never auto-implement** - always show change and get confirmation
- **Provide reasoning** for each recommendation
- **Group by plugin** when multiple learnings affect same plugin
- **Respect user filter** if provided
- **Quality over speed** - better to implement fewer learnings well
- This command should only run in the main workstation where plugin source is accessible
