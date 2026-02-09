---
name: Consolidation Craft
description: This skill should be used when the user invokes "/consolidate", asks to "process discoveries", "implement compound improvements", "review pending patterns", or wants to turn discovered patterns into actual project plugin components and subsystem knowledge updates. Provides methodology for reviewing, approving, and implementing discovery artifacts.
---

# Consolidation Craft

## Purpose

Process pending discovery artifacts and implement approved changes into the local project plugin and subsystem knowledge. Consolidation is the second half of the compound loop — where discovered patterns become permanent improvements.

## Foundation

Load `references/compounding-methodology.md` for the underlying philosophy — where learnings land, the heuristics format, and anti-patterns to avoid.

## Consolidation Workflow

### 1. Gather Pending Discoveries

Check the project's discovery directory:

```
./compound-discoveries/*.md
```

If user provides filter text, focus on matching discoveries.

### 2. Present for Review

For each discovery, present:
- Component type and name
- Target location (local project plugin)
- Summary of what it provides
- Subsystem integration points
- Recommendation with reasoning

Group by subsystem when multiple discoveries affect the same area.

### 3. Evolvability & Cross-Pollination Check

Before presenting for approval, evaluate each proposed change:

**Evolvability Check:**
- [ ] **Modular:** Can this component change independently?
- [ ] **Loosely coupled:** No hidden dependencies on other skills?
- [ ] **Adaptable:** Does this make future changes easier or harder?

If a change reduces evolvability, flag it. Sometimes worth it, but should be conscious.

**Cross-Pollination Check:**
- Could this pattern apply to other projects?
- Should this be a shared pattern in the portable plugin instead?
- Is there a more general capability hiding in this specific discovery?

### 4. Get Approval

For each discovery, user can:
- **Approve** — Implement the change
- **Defer** — Keep for later (don't archive)
- **Reject** — Archive without implementing (with reason)
- **Modify** — Adjust the proposed change before implementing

Wait for explicit approval before making changes. Never auto-implement.

### 5. Implement Approved Changes

Based on component type:

**Skill → Create in local plugin:**
- Create `skills/{skill-name}/SKILL.md` with proper frontmatter
- Register in `plugin.json`
- Follow structure: Purpose, Core Concepts, Workflow, Examples

**Command → Create in local plugin:**
- Create `commands/{name}.md` with proper frontmatter
- Register in `plugin.json`
- Include description, argument-hint, allowed-tools

**Agent → Create in local plugin:**
- Create `agents/{name}.md` with proper frontmatter
- Register in `plugin.json`

**Hook → Update local plugin:**
- Add to `hooks/hooks.json`
- Create supporting scripts if needed

### 6. Update Subsystem Knowledge

After creating a component:

**Add to helpful_skills:**
```yaml
helpful_skills:
  - name: "{skill name}"
    plugin: "{local plugin name}"
    when: "{when this skill is relevant}"
```

**Mark addressed gaps:**
```yaml
gaps:
  - id: GAP-XXX
    status: addressed
    addressed_by: "{component name}"
```

### 7. Archive Processed Discoveries

- Move to `./compound-discoveries/archived/`
- Approved: note what was implemented
- Rejected: note the reason

### 8. Verify Implementation

After changes:
- Confirm files were created correctly
- Verify plugin.json is valid
- Note if testing is needed
- Suggest follow-up if changes need validation

## Change Implementation Patterns

### Creating New Skills

```markdown
---
name: {Skill Name}
description: This skill should be used when [specific trigger phrases and contexts].
---

# {Skill Name}

## Purpose
[What this skill enables]

## Core Concepts
[Essential knowledge]

## Workflow
[How to apply it]

## Examples
[Concrete applications]
```

### Creating New Commands

```markdown
---
description: [What this command does]
argument-hint: [What arguments it accepts]
allowed-tools: [Tools needed]
---

# {Command Name}

[Implementation instructions...]
```

### Updating Subsystem YAMLs

When adding helpful_skills:
- Add to the specific subsystem that benefits
- Include `when` field for context on when the skill applies
- Don't duplicate — if the same skill helps multiple subsystems, add to each

## Output Expectations

After consolidation:

1. **Summary** — "Processed X discoveries: Y approved, Z deferred, W rejected"
2. **Changes made** — List of files created/modified
3. **Subsystem updates** — Which YAMLs were updated and how
4. **Commit suggestion** — If multiple changes, suggest commit message
5. **Follow-up** — Any discoveries that need testing or further work

## Commit Convention

When changes are ready to commit:

```
compound: implement discoveries from [date range]

- [plugin]: create [component type] [name]
- [subsystem]: update helpful_skills
- [subsystem]: address GAP-XXX
```
