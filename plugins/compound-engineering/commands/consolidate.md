---
name: consolidate
description: Implement discovered patterns into the local project plugin and update subsystem knowledge
argument-hint: [optional filter - e.g., "only backend skills", "from latest discover"]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

# Consolidate Command

Process pending discovery artifacts and implement approved changes into the **local project plugin** and subsystem knowledge files.

**User filter:** $ARGUMENTS

---

## Key Difference from compound-loop's /consolidate

| compound-loop | compound-engineering |
|---------------|---------------------|
| Processes reflection learnings | Processes discovery artifacts |
| Updates any plugin | Updates local project plugin + subsystem YAMLs |
| Linear or local files | Local files only (portable, no Linear dependency) |

---

## Workflow

### 1. Load Methodology

Internalize the **consolidation-craft** skill and **`references/compounding-methodology.md`**. Understand:
- How to review and approve discoveries
- Change implementation patterns
- The approval workflow (never auto-implement)
- Evolvability checks

### 2. Gather Pending Discoveries

Check for discovery artifacts:

```
./compound-discoveries/*.md
```

If user provided filter text, apply it to narrow results.

If no discoveries exist, suggest running `/discover` first.

### 3. Present Each Discovery for Review

For each discovery artifact, present:

```
═══════════════════════════════════════════════════════════════
DISCOVERY: [Name] from [date]
═══════════════════════════════════════════════════════════════

Type: [skill | command | agent | hook]
Target Plugin: [local project plugin path]

Summary:
> [Brief description of the component]

Proposed Changes:
1. Create [file path] — [purpose]
2. Update [subsystem].yaml — add to helpful_skills
3. [Any other changes]

Recommendation: [Approve | Defer | Reject]
Reasoning: [why]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your decision: (a)pprove / (d)efer / (r)eject / (m)odify?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wait for user decision before proceeding to next.

### 3b. Evolvability Review

For each proposed change, assess:

```
Evolvability Check:
- [ ] Modular: Can this component change independently?
- [ ] Loosely coupled: No hidden dependencies?
- [ ] Adaptable: Does this make future changes easier?

Cross-Pollination Check:
- [ ] Could this apply to other projects using this plugin?
- [ ] Should this be a shared pattern in the portable plugin instead?
```

If a change reduces evolvability, flag it in the recommendation. Sometimes worth it, but should be conscious.

### 4. Handle User Decision

**Approve:** Proceed to implementation (Step 5)

**Defer:** Skip this discovery, keep artifact for later

**Reject:** Move artifact to `./compound-discoveries/archived/` with reason noted

**Modify:** Ask user what to change, then proceed with modified version

### 5. Implement Approved Changes

Before making any change, show the specific edit:

```
═══════════════════════════════════════════════════════════════
PROPOSED EDIT
═══════════════════════════════════════════════════════════════

File: [full path]
Action: [create | update]

Content:
[The content to write or the diff to apply]

Reasoning:
[Why this implements the discovery]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confirm? (y)es / (n)o / (m)odify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Only edit after explicit confirmation.

### 6. Implementation Patterns

**For Skills → Create in local plugin:**
- Create `skills/{skill-name}/SKILL.md` in the local project plugin
- Follow the skill structure: Purpose, Core Concepts, Workflow, Examples
- Update `plugin.json` to register the new skill

**For Commands → Create in local plugin:**
- Create `commands/{command-name}.md` in the local project plugin
- Include proper frontmatter (description, argument-hint, allowed-tools)
- Update `plugin.json` to register the new command

**For Agents → Create in local plugin:**
- Create `agents/{agent-name}.md` in the local project plugin
- Include proper frontmatter (description, model, tools)
- Update `plugin.json` to register the new agent

**For Hooks → Update local plugin:**
- Add to `hooks/hooks.json` in the local project plugin
- Create any supporting scripts in `hooks/scripts/`

### 7. Update Subsystem Knowledge

After creating a component, update the relevant subsystem YAMLs:

**Add to `helpful_skills`:**
```yaml
helpful_skills:
  - name: "{skill name}"
    plugin: "{local plugin name}"
    when: "{when this skill is relevant for this subsystem}"
```

**Update `gaps`** if the discovery addresses a known gap:
```yaml
gaps:
  - id: GAP-001
    # ... existing fields ...
    status: addressed  # Mark as addressed by the new component
```

### 8. Archive Processed Discoveries

After implementing:
- Move processed discovery files to `./compound-discoveries/archived/`
- Create `archived/` directory if needed

### 9. Summary Report

```
═══════════════════════════════════════════════════════════════
CONSOLIDATION COMPLETE
═══════════════════════════════════════════════════════════════

Processed: X discoveries
- Approved & implemented: Y
- Deferred: Z
- Rejected: W

Files Created:
- [file1]: [brief description]
- [file2]: [brief description]

Subsystem YAMLs Updated:
- [subsystem]: added [skill] to helpful_skills
- [subsystem]: marked GAP-XXX as addressed

Suggested Commit Message:
compound: implement discoveries from [date range]

- [plugin]: create [component type] [name]
- [subsystem]: update helpful_skills
- [subsystem]: address GAP-XXX

Follow-up Actions:
- [Any items needing testing]
- [Any deferred items to revisit]
═══════════════════════════════════════════════════════════════
```

---

## Notes

- **Never auto-implement** — always show change and get confirmation
- **Provide reasoning** for each recommendation
- **Components go to the local project plugin** — never modify this portable plugin
- **Subsystem YAMLs are updated** — the `helpful_skills` section is the bridge
- **Quality over speed** — better to implement fewer discoveries well
- This command should run in the project where subsystem knowledge and the local plugin exist
