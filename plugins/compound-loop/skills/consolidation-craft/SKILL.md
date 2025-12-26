---
name: Consolidation Craft
description: This skill should be used when the user invokes "/compound:consolidate", asks to "process learnings", "implement compound improvements", "review pending reflections", or wants to turn captured learnings into actual plugin changes. Provides methodology for reviewing, approving, and implementing learning artifacts.
---

# Consolidation Craft

## Purpose

Process pending compound-reflect learnings and implement approved changes into plugins. Consolidation is the second half of the compound loop—where captured learnings become permanent improvements.

## Foundation

Load `references/compounding-methodology.md` for the underlying philosophy—where learnings land, the heuristics format, and anti-patterns to avoid.

## Consolidation Workflow

### 1. Gather Pending Learnings

**If Linear MCP available:**

Query for pending issues:
- Team: MB90
- Project: Compound
- Labels: compound-learning
- Status: Not done

**If Linear not available:**

Check local directory:
```
./compound-learnings/*.md
```

**If user provides filter text:**
Focus on learnings matching their filter (e.g., "only langfuse", "just skill descriptions").

### 2. Present for Review

For each learning, present:

```markdown
## Learning #1 [source-date]

**Type:** rule | feature | fix
**Plugin:** affected-plugin-name
**Learning:** The 1-line learning statement

**Proposed Change:**
- File: path/to/file
- Action: update | create | delete
- Description: What specifically to change

**Recommendation:** Approve | Defer | Reject
**Reasoning:** Why this change is/isn't worth implementing
```

Group by plugin for easier review when multiple learnings exist.

### 3. Evolvability & Cross-Pollination Check

Before presenting for approval, evaluate each proposed change:

**Evolvability Check:**
- [ ] **Modular:** Can this skill/command change independently?
- [ ] **Loosely coupled:** No hidden dependencies on other skills?
- [ ] **Adaptable:** Does this make future changes easier or harder?

If a change reduces evolvability, flag it. Sometimes worth it, but should be conscious.

**Cross-Pollination Check:**
- Could this learning apply to other plugins/domains?
- Should we create a shared pattern instead of plugin-specific?
- Is there a more general capability hiding in this specific learning?

### 4. Get Approval

For each learning, user can:
- **Approve** - Implement the change
- **Defer** - Keep for later (don't close issue)
- **Reject** - Close without implementing (with reason)
- **Modify** - Adjust the proposed change before implementing

Wait for explicit approval before making changes. Never auto-implement.

### 5. Implement Approved Changes

For approved learnings, implement based on type:

**Rule → Skill Update**
- Add to relevant SKILL.md
- Or add to CLAUDE.md if cross-cutting
- Use imperative form, keep concise

**Feature → New Capability**
- Create new command if user-facing action
- Extend skill if knowledge addition
- Add to existing command if small enhancement

**Fix → Edit Existing**
- Update skill description triggers
- Correct command behavior
- Fix documentation

**Architecture → Structure Change**
- Update plugin structure
- Add/remove directories
- Modify plugin.json if needed

### 6. Propose Changes with Reasoning

Before implementing, present the specific change:

```markdown
## Proposed Edit

**File:** plugins/langfuse-analyzer/skills/trace-analysis/SKILL.md

**Current (lines 3-5):**
```yaml
description: This skill should be used when analyzing traces...
```

**Proposed:**
```yaml
description: This skill should be used when the user asks to "analyze traces", "trace analysis", "find slow operations", "debug latency"...
```

**Reasoning:**
Adding explicit trigger phrases improves skill activation. The learning from 2025-12-25 showed the skill wasn't triggering on "trace analysis" queries.

**Approve this change? [y/n/modify]**
```

### 7. Close the Loop

After implementing approved changes:

**If Linear:**
- Close the issue with comment referencing commit
- Format: "Implemented in [commit-hash]. Changes: [brief list]"

**If local files:**
- Move processed file to `./compound-learnings/archived/`
- Or delete if not needed for history

### 8. Verify Implementation

After changes:
- Confirm files were updated correctly
- Note if testing is needed
- Suggest follow-up if changes need validation

## Change Implementation Patterns

### Updating Skill Descriptions

When improving trigger phrases:
```yaml
# Before
description: This skill handles X.

# After
description: This skill should be used when the user asks to "do X", "perform X", "X workflow", or mentions X-related tasks.
```

### Adding Rules to Skills

When encoding behavioral rules:
```markdown
## Operational Rules

- When processing >100 items, use pagination [src:2025-12-25]
- Always validate inputs before API calls [src:2025-12-20]
```

### Creating New Commands

When a feature request warrants a new command:
```markdown
---
name: new-command
description: Brief description of what it does
allowed-tools: [Tool1, Tool2]
---

# Command Name

[Implementation instructions...]
```

### Extending Existing Skills

When adding to skill knowledge:
- Add to appropriate section in SKILL.md
- Or create new reference file if substantial
- Update SKILL.md to reference new file

## User Filter Integration

When user provides filter text:

```
/compound:consolidate only langfuse improvements
→ Filter to learnings tagged with langfuse or affecting langfuse-analyzer plugin

/compound:consolidate skill descriptions only
→ Filter to learnings of type "fix" targeting skill descriptions
```

Match against:
- Plugin names
- Learning types (rule, feature, fix)
- Keywords in learning text
- File paths in proposed changes

## Output Expectations

After consolidation:

1. **Summary** - "Processed X learnings: Y approved, Z deferred, W rejected"
2. **Changes made** - List of files modified with brief description
3. **Commit suggestion** - If multiple changes, suggest commit message
4. **Follow-up** - Any learnings that need testing or further action

## Commit Convention

When changes are ready to commit:

```
compound: implement learnings from [date range]

- [Plugin]: [brief change description]
- [Plugin]: [brief change description]

Closes: [Linear issue IDs or "local learning files"]
```
