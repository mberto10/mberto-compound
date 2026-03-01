---
description: Analyze work session to discover reusable patterns and specify appropriate components for the local project plugin
argument-hint: [optional focus - what pattern you noticed or want to explore]
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
---

# Discover Command

Analyze the current work session to identify **patterns worth modularizing** and determine the right component type: **skill**, **command**, **agent**, or **hook**. Discovered components target the **local project plugin** (not this portable plugin).

**User focus:** $ARGUMENTS

---

## Key Difference from compound-loop's /discover

| compound-loop | compound-engineering |
|---------------|---------------------|
| Generic pattern discovery | Subsystem-aware pattern detection |
| Outputs to Linear or local files | Outputs specs for the local project plugin |
| Any context | Engineering work context with subsystem knowledge |

---

## Workflow

### 1. Load Methodology

Internalize:
- The **discovery-craft** skill (component type selection, spec templates)
- The **`references/compounding-methodology.md`** reference (philosophy, frontier model, anti-patterns)

Key frameworks to apply:
- Skills-as-modules: "What procedure could be a loadable component?"
- Component type selection: skill vs command vs agent vs hook
- Modularizability criteria

### 2. Session Analysis

Examine what happened in the current work session:

**Subsystem-aware analysis:**
- Which subsystems were touched? Read their specs.
- Were there patterns that repeated across subsystems?
- Did any `helpful_skills` prove missing or insufficient?
- Did invariant checking reveal common failure modes?

**General analysis:**
- What multi-step procedures were performed?
- What was done more than once?
- What domain knowledge was applied?
- What should have happened automatically but didn't?
- What could have been delegated to a specialist?

If user provided focus text, prioritize that area.

### 3. Pattern Extraction

For each potential pattern:

```
═══════════════════════════════════════════════════════════════
PATTERN: [Name]
═══════════════════════════════════════════════════════════════

Trigger: When would this be needed?
Inputs: What does it start with?
Process: [3-7 steps]
Outputs: What does it produce?
Knowledge: What expertise is embedded?
Subsystems: Which subsystems does this relate to?
```

### 4. Component Type Selection

Apply the decision matrix for each pattern:

```
═══════════════════════════════════════════════════════════════
COMPONENT ANALYSIS: [Pattern Name]
═══════════════════════════════════════════════════════════════

[ ] Knowledge Claude should apply contextually?     → SKILL
[ ] Action user explicitly requests?                → COMMAND
[ ] Autonomous work for a specialist?               → AGENT
[ ] Should happen automatically on events?          → HOOK

Selected: [Component Type]
Reasoning: [Why this type fits]

If combination needed:
- Primary: [type] - [purpose]
- Supporting: [type] - [purpose]
```

### 5. Modularizability Assessment

```
Modularizability Score:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recurrence likelihood:    [High/Med/Low]
Clear boundaries:         [Yes/Partial/No]
Teachable as instructions:[Yes/Partial/No]
Should be consistent:     [Yes/Partial/No]
Packaging value:          [High/Med/Low]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verdict: [Worth modularizing / Maybe later / Not a good candidate]
```

### 6. Subsystem Integration Check

For each proposed component, determine how it connects to subsystem knowledge:

- **Should this be a `helpful_skill` for specific subsystems?** If so, note which subsystems' YAMLs should reference it.
- **Does this capture cross-subsystem patterns?** If so, it may be more valuable as a general skill.
- **Does this fill a gap in a subsystem spec?** Note if the pattern addresses a known gap.

### 7. Generate Specification

Based on component type, generate the full spec. The spec should target the **local project plugin** (e.g., `.claude/plugins/{project-plugin}/`).

---

#### For Skills:

```markdown
═══════════════════════════════════════════════════════════════
PROPOSED SKILL: [name]
═══════════════════════════════════════════════════════════════

Location: .claude/plugins/{project-plugin}/skills/[skill-name]/

## Trigger Description
This skill should be used when the user asks to "[trigger 1]",
"[trigger 2]", "[trigger 3]", or [context].

## What It Provides
- [Knowledge 1]
- [Workflow guidance]

## SKILL.md Structure
1. Purpose
2. Core Concepts
3. Workflow
4. Examples
5. References (if needed)

## Subsystem Integration
- Add to helpful_skills in: [subsystem1, subsystem2]

## Estimated Size
- SKILL.md: ~[X] words
```

---

#### For Commands:

```markdown
═══════════════════════════════════════════════════════════════
PROPOSED COMMAND: /[name]
═══════════════════════════════════════════════════════════════

Location: .claude/plugins/{project-plugin}/commands/[name].md

## Frontmatter
description: [one-line description]
argument-hint: [arguments]
allowed-tools: [tools needed]

## Purpose
[What user accomplishes]

## Workflow
1. [Step]
2. [Step]
3. [Step]

## Inputs/Outputs
- Input: $ARGUMENTS = [what]
- Output: [what it produces]

## Subsystem Integration
- Reads from: [which subsystem specs]
- Updates: [which subsystem specs if any]
```

---

#### For Agents:

```markdown
═══════════════════════════════════════════════════════════════
PROPOSED AGENT: [name]
═══════════════════════════════════════════════════════════════

Location: .claude/plugins/{project-plugin}/agents/[name].md

## When to Use
[Situation where this agent helps]

## System Prompt Summary
- Role: [what it is]
- Expertise: [specialty]
- Task: [what to accomplish]
- Output: [what it returns]

## Tools Required
- [Tool]: [why]
```

---

#### For Hooks:

```markdown
═══════════════════════════════════════════════════════════════
PROPOSED HOOK: [name]
═══════════════════════════════════════════════════════════════

Location: .claude/plugins/{project-plugin}/hooks/hooks.json

## Event Type
[PreToolUse | PostToolUse | Stop | etc.]

## Purpose
[What it enforces/validates/logs]

## Configuration
{JSON config}
```

---

### 8. Create Discovery Artifact

Write the discovery artifact to the project:

```
./compound-discoveries/YYYY-MM-DD-[name].md
```

Create the `compound-discoveries/` directory if it doesn't exist.

### 9. Summary

```
═══════════════════════════════════════════════════════════════
DISCOVERY COMPLETE
═══════════════════════════════════════════════════════════════

Patterns Analyzed: X
Components Proposed:
- Skills: Y
- Commands: Z
- Agents: W
- Hooks: V

Top Candidate:
[Type]: [Name] - [one-line description]
Target Plugin: [local project plugin]

Subsystem Integration:
- [subsystem]: add to helpful_skills
- [subsystem]: addresses GAP-XXX

Artifact Created:
[file path]

Next Steps:
1. Review specification
2. Implement via /consolidate or manual build
3. Update subsystem YAMLs with helpful_skills references
═══════════════════════════════════════════════════════════════
```

---

## Prompting for Depth

If session context is thin, ask:
- "What workflow did you just complete?"
- "What would you want to do the same way next time?"
- "What took multiple steps that should be simpler?"
- "Which subsystem was hardest to work with and why?"
- "What should have happened automatically?"

---

## Notes

- Discovered components go to the **local project plugin**, not this portable plugin
- The `helpful_skills` section in subsystem YAMLs is the bridge — `/discover` proposes skills, `/consolidate` writes them and updates the YAMLs
- Quality over quantity — one good spec beats five vague ideas
- Right component type matters — wrong type = wrong solution
- Complete specifications — output should be implementation-ready
