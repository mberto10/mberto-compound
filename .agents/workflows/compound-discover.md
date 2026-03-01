---
description: Analyze recent work to identify reusable patterns, gaps, and improvements for the engineering system
---

# Discover Command

Analyze recent work sessions to find reusable patterns, gaps, and improvements. Creates discovery artifacts that can be consolidated into the system.

---

## Input

**Analysis target:** The user's request (e.g., "last 3 sessions", "auth subsystem", "recent friction").

If no argument provided, ask the user what to analyze.

---

## Step 1: Gather Context

Identify the source material for analysis:

1. **Recent transcripts:** Look for recent interaction logs or work sessions
2. **Friction logs:** Check for "FRICTION POINT" or "Spec Gaps Discovered" in recent command outputs
3. **Subsystem specs:** Read `subsystems_knowledge/**/*.yaml` to see current knowns/unknowns
4. **Code changes:** check `git log -n 20 --stat` to see what actually changed recently

**Output:** Summary of the material being analyzed.

---

## Step 2: Analyze for Patterns

Look for 4 types of patterns:

### Type A: Reusable Skills
*Did we solve a problem that requires a specific technique?*
- "How to debug the auth token expiration"
- "How to structure a new React component"
- "How to migrate a database schema safely"

### Type B: Missing Tools (Commands)
*Did we run the same sequence of manual steps repeatedly?*
- "Grepping for X then editing Y then running Z" -> could be a command
- "Checking 5 different logs to diagnose an issue" -> could be a diagnosis command

### Type C: System Gaps
*Did we hit a wall because documentation was missing?*
- "Spent 30 mins figuring out how the event bus works" -> needs a subsystem spec update
- "Got confused by the testing strategy" -> needs a `tests` section update

### Type D: Process Improvements (Hooks/Agents)
*Did we forget a step that should be automated?*
- "Forgot to run the linter before commit" -> needs a pre-commit hook
- "Always need to ask a specific expert agent" -> needs a specialized agent

**Output:** List of potential discoveries with evidence.

---

## Step 3: Draft Discoveries

For each strong pattern found, draft a **Discovery Artifact**.

**Format:**

```markdown
# Discovery: {Name}

## Type
[Skill | Command | Agent | Hook | Subsystem Update]

## Context
{What triggered this? Link to transcript/commit if possible}

## The Pattern
{Description of the recurring problem and the solution}

## Proposed Solution
{Specifics: new file to create, or text to add to a spec}
```

---

## Step 4: Validate

For each draft:
1. **Uniqueness:** Does this already exist in `plugins/` or `subsystems_knowledge/`?
2. **Generality:** Is this specific to one issue, or truly reusable?
3. **Value:** Is it worth the maintenance cost?

Eliminate weak discoveries.

---

## Step 5: Save Artifacts

For each validated discovery, save a new file to `./compound-discoveries/`:

Filename: `YYYY-MM-DD-{type}-{kebab-case-name}.md`

Content: Use the format from Step 3, plus metadata.

If `./compound-discoveries/` does not exist, create it.

---

## Output

```
═══════════════════════════════════════════════════════════════
DISCOVERY COMPLETE
═══════════════════════════════════════════════════════════════

Analyzed: {context summary}

Discoveries Captured:
1. {filename} — {brief description}
2. {filename} — {brief description}

Next Steps:
- Run /consolidate to review and implement these discoveries
- Run /work to continue working (if you were interrupted)
═══════════════════════════════════════════════════════════════
```

---

## Notes

- This command DOES NOT implement changes. It only captures them.
- Implementation happens via `/consolidate`.
- Don't capture trivial things. High bar for "system knowledge".
- If no patterns found, say so. Don't force it.
