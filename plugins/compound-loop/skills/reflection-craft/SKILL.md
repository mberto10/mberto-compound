---
name: Reflection Craft
description: This skill should be used when the user invokes "/compound:reflect", asks to "reflect on this session", "capture learnings", "what did we learn", "debrief this work", or wants to create a structured learning artifact from recent work. Provides methodology for trace-aware reflection and structured output.
---

# Reflection Craft

## Purpose

Transform a work session into structured, actionable learnings that can compound into plugin improvements. Reflection is trace-aware (grounded in what actually happened) and produces 1-line testable rules with source references.

## Reflection Workflow

### 1. Gather Context

**Session context to analyze:**
- What plugins/skills/commands were used
- What worked smoothly
- What caused friction or confusion
- What was attempted but failed
- What was missing that would have helped

**If user provides focus text:**
Prioritize analysis around their specific observation. The focus indicates what they noticed and want to capture.

**If no focus provided:**
Perform general reflection across all friction points and successes.

### 2. Introspect Plugin Structure

Read the plugin structure to understand what exists:

```
${CLAUDE_PLUGIN_ROOT}/
├── skills/          # What knowledge is packaged
├── commands/        # What actions are available
├── agents/          # What autonomous capabilities exist
└── .claude-plugin/  # Plugin metadata
```

Understanding the current structure enables targeted improvement proposals.

### 3. Structured Debrief

Answer these questions:

**What happened?**
- Brief summary of the work session
- Key decisions made
- Outcomes achieved

**What worked?**
- Successful patterns worth reinforcing
- Smooth interactions to preserve

**What friction occurred?**
- Confusion points
- Missing capabilities
- Unexpected behavior
- Workarounds needed

**What was missing?**
- Capabilities that would have helped
- Information that wasn't available
- Workflows that don't exist yet

### 4. Distill to Learnings

Load `references/compounding-methodology.md` for the full framework on what makes learning worth encoding and the heuristics format.

**Frontier Check:** For each potential learning, ask:
- Does this shift the frontier (improves underlying capability so both volume AND quality can improve)?
- Or does this slide along the frontier (trades one for the other)?

Prioritize frontier-shifting learnings. They have higher r.

**Selection Pressure Check:**
- Did this learning emerge from actual friction? (High confidence — real selection pressure)
- Or is this a theoretical improvement? (Lower confidence — test before encoding)

Evolution never fools itself. Prioritize learnings from real pain over elegant theories.

Convert observations into 1-line testable rules:

**Format:**
```
[Learning statement - specific, actionable, testable]
[src:YYYY-MM-DDTHHMMZ__context-description] [type:rule|feature|fix]
```

**Examples:**

```
When analyzing >100 Langfuse traces, apply filters (latency, error, time) before analysis.
[src:2025-12-25T1430Z__langfuse-batch-analysis] [type:rule]

Add token cost breakdown to langfuse-analyzer output for cost optimization workflows.
[src:2025-12-25T1430Z__langfuse-batch-analysis] [type:feature]

Skill description should include "trace analysis" as trigger phrase.
[src:2025-12-25T1430Z__langfuse-batch-analysis] [type:fix]
```

**Quality checks before including:**
- Is it specific enough to act on?
- Is it testable (can verify compliance)?
- Will this situation recur?
- Does encoding this add value?

Reject vague learnings like "be more careful" or "think about edge cases."

### 5. Categorize by Destination

Map each learning to where it should land:

| Type | Destination | Example |
|------|-------------|---------|
| `rule` | Skill update, CLAUDE.md | Behavioral guidance |
| `feature` | New command, skill extension | Missing capability |
| `fix` | Skill/command edit | Incorrect behavior |
| `architecture` | Documentation, structure change | Pattern improvement |

### 6. Create Linear Issue

**If Linear MCP is available:**

Create issue with:
- **Team:** MB90
- **Project:** Compound
- **Labels:** compound-learning
- **Title:** `[compound-reflect] YYYY-MM-DD: Brief description`
- **Body:** Structured format below

**If Linear MCP not available:**

Generate local markdown file at `./compound-learnings/YYYY-MM-DD-HHMMSS.md`

**Issue/File Body Format:**

```markdown
## Session Context
- Date: YYYY-MM-DD
- Plugins used: [list]
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

## Proposed Changes

### [Plugin/Skill Name]
- **File:** path/to/file
- **Change type:** update | create | delete
- **Description:** What to change and why
- **Priority:** high | medium | low

## Raw Observations
[Any additional context that didn't distill into rules but might be useful]
```

## User Focus Integration

When the user provides freeform text with their reflection request:

1. **Treat it as the primary lens** - their observation is what they want captured
2. **Validate against session** - confirm the observation matches what happened
3. **Expand if relevant** - add related learnings discovered during analysis
4. **Prioritize their focus** - their learning should be the first/primary item

Example:
```
User: /compound:reflect the skill description was confusing for langfuse
→ Primary learning: Update langfuse-analyzer skill description triggers
→ Secondary: Any other langfuse-related friction discovered
```

## Output Expectations

After reflection, confirm:

1. **Issue/file created** - with link or path
2. **Learning count** - "Captured X learnings (Y rules, Z features, W fixes)"
3. **Top priority item** - "Highest priority: [description]"
4. **Next step** - "Run /compound:consolidate in workstation to implement"
