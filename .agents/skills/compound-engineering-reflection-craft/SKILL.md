---
name: Reflection Craft
description: This skill should be used when the user asks to "reflect on this session", "capture learnings", "what did we learn", "debrief this work", or wants to create a structured learning artifact from recent engineering work. Provides methodology for subsystem-aware reflection and structured output.
---

# Reflection Craft

## Purpose

Transform an engineering work session into structured, actionable learnings that feed into the compound engineering cycle. Reflection is subsystem-aware (grounded in what subsystems were touched) and trace-aware (grounded in what actually happened).

## Reflection Workflow

### 1. Gather Context

**Session context to analyze:**
- Which subsystems were touched (check git diff → subsystem mapping)
- What plans were executed
- What invariants were checked
- What tests were run and their results
- What friction points were logged
- What spec gaps were discovered

**If user provides focus text:**
Prioritize analysis around their specific observation.

**If no focus provided:**
Perform general reflection across all friction points and successes.

### 2. Subsystem-Aware Debrief

For each subsystem that was touched:

**What happened?**
- Files changed and why
- Invariants verified or violated
- Tests run and results

**What worked?**
- Patterns from subsystem specs that helped
- helpful_skills that were useful
- Invariants that caught issues early

**What friction occurred?**
- Spec gaps discovered
- Missing helpful_skills
- Invariants that should exist but don't
- Dependencies not documented

**What was missing?**
- Knowledge that would have helped
- Automation that should exist
- Test coverage gaps

### 3. Distill to Learnings

Convert observations into 1-line testable rules:

**Format:**
```
[Learning statement - specific, actionable, testable]
[src:YYYY-MM-DD__context-description] [type:rule|feature|fix|spec-update]
```

**Examples:**

```
When modifying the API routes subsystem, always check auth middleware invariant.
[src:2025-06-15__api-auth-cascade] [type:rule]

Add a helpful_skill for database migration patterns to the data subsystem.
[src:2025-06-15__data-migration-friction] [type:feature]

Subsystem spec for frontend/auth is missing dependency on backend/api.
[src:2025-06-15__auth-flow-trace] [type:spec-update]
```

**Quality checks:**
- Is it specific enough to act on?
- Is it testable (can verify compliance)?
- Will this situation recur?
- Does encoding this add value?

Reject vague learnings like "be more careful" or "think about edge cases."

### 4. Categorize by Destination

Map each learning to where it should land:

| Type | Destination | Example |
|------|-------------|---------|
| `rule` | Skill, CLAUDE.md, or invariant | Behavioral guidance |
| `feature` | New command, skill, or agent | Missing capability |
| `fix` | Skill/command edit | Incorrect behavior |
| `spec-update` | Subsystem YAML update | Missing knowledge |

### 5. Frontier Check

For each potential learning, ask:
- Does this **shift the frontier** (improves underlying capability so both volume AND quality improve)?
- Or does this **slide along the frontier** (trades one for the other)?

Prioritize frontier-shifting learnings. They have higher r in the compound formula.

**Selection Pressure Check:**
- Did this learning emerge from actual friction? (High confidence)
- Or is this a theoretical improvement? (Lower confidence — test before encoding)

### 6. Create Output

Write structured output as a discovery artifact:

```
./compound-discoveries/YYYY-MM-DD-reflection-[focus].md
```

**Body Format:**

```markdown
## Session Context
- Date: YYYY-MM-DD
- Subsystems touched: [list]
- Focus: [user-provided focus or "general reflection"]

## Summary
[2-3 sentence summary of work and key outcomes]

## Learnings

### Rules
- [Learning 1] [src:...]
- [Learning 2] [src:...]

### Feature Requests
- [Feature 1] [src:...]

### Fixes
- [Fix 1] [src:...]

### Spec Updates
- [Update 1] [src:...]

## Proposed Changes

### [Subsystem or Plugin]
- **File:** path/to/file
- **Change type:** update | create
- **Description:** What to change and why
- **Priority:** high | medium | low

## Friction Log
[Raw friction points captured during session]
```

## Output Expectations

After reflection, confirm:

1. **Artifact created** — with file path
2. **Learning count** — "Captured X learnings (Y rules, Z features, W fixes, V spec-updates)"
3. **Top priority item** — "Highest priority: [description]"
4. **Next step** — "Run /consolidate to implement approved changes, or /discover to explore patterns further"

## Integration with Engineering Workflow

Reflection feeds back into the compound engineering cycle:

```
/plan → /work → /review → reflect → /discover → /consolidate
                                         ↓
                              Subsystem specs updated
                              helpful_skills expanded
                              Local plugin grows
```

The reflection skill captures the raw material. `/discover` shapes it into component specs. `/consolidate` implements it.
