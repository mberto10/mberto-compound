---
description: Capture learnings from this session into a structured compound-learning artifact
argument-hint: [optional focus - what you noticed or want to capture]
allowed-tools: Read, Glob, Grep, mcp__linear__*, Write
---

# Compound Reflect

Perform a trace-aware reflection on the current work session and create a structured learning artifact.

**User focus:** $ARGUMENTS

## Workflow

### 1. Load Methodology

First, internalize:
- The **reflection-craft** skill (how to analyze and structure findings)
- The **`references/compounding-methodology.md`** reference (philosophy, heuristics format, decision gates)

Key concepts to apply:
- What makes learning worth encoding (recurrence, testability, architecture fit)
- The 1-line testable rules format with source references
- Quality gates for learnings

### 2. Gather Session Context

Analyze the current session:
- What plugins, skills, commands were used
- What decisions were made
- What friction occurred
- What worked well
- What was missing

If the user provided focus text, prioritize that observation.

### 3. Introspect Plugin Structure

Read the plugin structure at `${CLAUDE_PLUGIN_ROOT}` to understand what exists:
- Current skills and their triggers
- Available commands
- Plugin organization

This informs targeted improvement proposals.

### 4. Structured Debrief

Document:
- **What happened:** Brief session summary
- **What worked:** Successful patterns
- **Friction points:** Where things were difficult or confusing
- **Missing capabilities:** What would have helped

### 5. Classify Learnings

For each potential learning, classify:

**Frontier position:**
- **Frontier-shifting** (high r): Improves underlying capability so both volume AND quality can improve
- **Frontier-sliding** (low r): Optimizes within current constraints, trades one for the other

**Selection pressure:**
- **Real friction** (high confidence): Emerged from actual pain in this session
- **Theoretical** (lower confidence): Sounds good, but hasn't been tested

Prioritize: frontier-shifting + real friction = highest value learnings.

### 6. Distill Learnings

Convert observations into 1-line testable rules:

```
[Specific, actionable learning statement]
[src:YYYY-MM-DDTHHMMZ__context] [type:rule|feature|fix]
```

**Quality filter - only include learnings that are:**
- Specific enough to act on
- Testable (can verify compliance)
- Likely to recur
- Worth the encoding cost

Reject vague observations like "be more careful" or "remember to check."

### 7. Create Learning Artifact

**Try Linear first (preferred):**

Use the Linear MCP tools to create an issue:
- Team: MB90
- Project: Compound
- Labels: compound-learning
- Title: `[compound-reflect] YYYY-MM-DD: [brief description]`

**If Linear not available, create local file:**

Write to `./compound-learnings/YYYY-MM-DD-HHMMSS.md`

Create the directory if it doesn't exist.

### Issue/File Body Format

```markdown
## Session Context
- Date: [today's date]
- Plugins used: [list what was used]
- Focus: [user-provided focus or "general reflection"]

## Summary
[2-3 sentences on what was done and outcomes]

## Learnings

### Rules
- [Learning] [src:...]
- [Learning] [src:...]

### Feature Requests
- [Feature] [src:...]

### Fixes
- [Fix] [src:...]

## Proposed Changes

### [Plugin/Skill Name]
- **File:** path/to/file
- **Change type:** update | create | delete
- **Description:** What to change and why
- **Priority:** high | medium | low

## Raw Observations
[Additional context that might be useful later]
```

### 8. Confirm Output

Report to user:
- Where the artifact was created (Linear issue link or file path)
- Count of learnings captured (X rules, Y features, Z fixes)
- Highest priority item
- Next step: "Run `/compound:consolidate` in your workstation to implement these"

## Outputs

- A structured learning artifact (Linear issue or `./compound-learnings/YYYY-MM-DD-HHMMSS.md`).
- A concise summary of learnings with counts and a highest-priority item.

## Important Notes

- If user provided focus text, make that the PRIMARY learning
- Ground all observations in what actually happened this session
- Be specific—vague learnings have no value
- Quality over quantity—3 good learnings > 10 vague ones
- Include source references for traceability
