---
description: Analyze work session to discover modularizable patterns and specify appropriate plugin components (skills, commands, agents, hooks)
argument-hint: [optional focus - what pattern you noticed or want to explore]
allowed-tools: Read, Glob, Grep, mcp__linear__*, Write, AskUserQuestion, Task
---

# Compound Discover

Analyze the current work session to identify **patterns worth modularizing** and determine the right Claude Code component type: **skill**, **command**, **agent**, or **hook**.

**User focus:** $ARGUMENTS

## This is Different from /compound:reflect

| `/compound:reflect` | `/compound:discover` |
|---------------------|----------------------|
| Improve existing plugins | Create new components |
| Fix friction | Extract patterns |
| Output: change proposal | Output: component specification |

## Workflow

### 1. Load Methodology

Internalize:
- The **discovery-craft** skill (component type selection, spec templates)
- The **`references/compounding-methodology.md`** reference (philosophy, skills-as-modules, agent-leverageable architecture)

Key frameworks to apply:
- Skills-as-modules: "What procedure could be a loadable component?"
- Component type selection: skill vs command vs agent vs hook
- Modularizability criteria

### 2. Session Analysis

Examine what happened:
- What multi-step procedures were performed?
- What was done more than once?
- What domain knowledge was applied?
- What should have happened automatically but didn't?
- What could have been delegated to a specialist?

If user provided focus text, prioritize that area.

### 2b. Parallel Exploration (Optional)

For complex pattern spaces, launch parallel agents:

```
Launch Task with subagent_type='Explore':
"Find patterns similar to [X] in other parts of the codebase"

Launch Task with subagent_type='Explore':
"How do other plugins/tools solve [problem Y]?"
```

Evolution's power is testing many variants simultaneously. Go wide before deep. Synthesize findings before pattern extraction.

### 3. Pattern Extraction

For each potential pattern:

```
═══════════════════════════════════════════════════════════════
🔍 PATTERN: [Name]
═══════════════════════════════════════════════════════════════

**Trigger:** When would this be needed?
**Inputs:** What does it start with?
**Process:** [3-7 steps]
**Outputs:** What does it produce?
**Knowledge:** What expertise is embedded?
```

### 4. Component Type Selection

Apply the decision matrix for each pattern:

```
═══════════════════════════════════════════════════════════════
🎯 COMPONENT ANALYSIS: [Pattern Name]
═══════════════════════════════════════════════════════════════

□ Knowledge Claude should apply contextually?     → SKILL
□ Action user explicitly requests?                → COMMAND
□ Autonomous work for a specialist?               → AGENT
□ Should happen automatically on events?          → HOOK

**Selected:** [Component Type]
**Reasoning:** [Why this type fits]

**If combination needed:**
- Primary: [type] - [purpose]
- Supporting: [type] - [purpose]
```

### 5. Documentation Verification

Before generating specifications, verify current Claude Code patterns.

**Use the claude-code-guide agent** to check:
- Current frontmatter requirements for the component type
- Available hook events (if proposing a hook)
- Best practices for the component type
- Any recent changes to component structure

```
Launch Task with subagent_type='claude-code-guide':
"What are the current requirements for [component type] in Claude Code plugins?
Specifically: frontmatter fields, structure, best practices."
```

### 6. Modularizability Assessment

```
**Modularizability Score:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recurrence likelihood:    [High/Med/Low]
Clear boundaries:         [Yes/Partial/No]
Teachable as instructions:[Yes/Partial/No]
Should be consistent:     [Yes/Partial/No]
Packaging value:          [High/Med/Low]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Verdict:** [Worth modularizing / Maybe later / Not a good candidate]
```

### 7. Generate Specification

Based on component type, generate the full spec:

---

#### For Skills:

```markdown
═══════════════════════════════════════════════════════════════
📚 PROPOSED SKILL: [name]
═══════════════════════════════════════════════════════════════

**Location:** plugins/[plugin]/skills/[skill-name]/

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

## Estimated Size
- SKILL.md: ~[X] words
- References: [yes/no]
- Scripts: [yes/no]
```

---

#### For Commands:

```markdown
═══════════════════════════════════════════════════════════════
⚡ PROPOSED COMMAND: /[name]
═══════════════════════════════════════════════════════════════

**Location:** plugins/[plugin]/commands/[name].md

## Frontmatter
```yaml
description: [one-line description]
argument-hint: [arguments]
allowed-tools: [tools needed]
```

## Purpose
[What user accomplishes]

## Workflow
1. [Step]
2. [Step]
3. [Step]

## Inputs/Outputs
- Input: $ARGUMENTS = [what]
- Output: [what it produces]

## Skills Used
- [skill name] - [why]

## Agents Launched
- [agent name] - [for what]
```

---

#### For Agents:

```markdown
═══════════════════════════════════════════════════════════════
🤖 PROPOSED AGENT: [name]
═══════════════════════════════════════════════════════════════

**Location:** plugins/[plugin]/agents/[name].md

## Frontmatter
```yaml
description: [agent expertise]
model: [sonnet/opus/haiku]
tools: [tool list]
```

## When to Use
<example>
Context: [situation]
user: "[message]"
assistant: "[how Claude invokes]"
<commentary>Why appropriate</commentary>
</example>

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
🪝 PROPOSED HOOK: [name]
═══════════════════════════════════════════════════════════════

**Location:** plugins/[plugin]/hooks/hooks.json

## Event Type
[PreToolUse | PostToolUse | Stop | SubagentStop | SessionStart |
 SessionEnd | UserPromptSubmit | PreCompact | Notification]

## Matcher
[Tool pattern if applicable]

## Hook Type
[command | prompt]

## Purpose
[What it enforces/validates/logs]

## Configuration
```json
{
  "[Event]": [{
    "matcher": "[pattern]",
    "hooks": [{
      "type": "[type]",
      "command": "[path]" // or "prompt": "[instruction]"
    }]
  }]
}
```

## Behavior
- Triggers: [when]
- Action: [what]
- Blocks: [yes/no]
```

---

### 8. Create Discovery Artifact

**If Linear MCP available:**

Create issue:
- Team: MB90
- Project: Compound
- Labels: compound-discovery
- Title: `[compound-discover] YYYY-MM-DD: [component type]: [name]`

**If Linear not available:**

Write to `./compound-discoveries/YYYY-MM-DD-HHMMSS-[name].md`

### 9. Summary

```
═══════════════════════════════════════════════════════════════
✅ DISCOVERY COMPLETE
═══════════════════════════════════════════════════════════════

**Patterns Analyzed:** X
**Components Proposed:**
- Skills: Y
- Commands: Z
- Agents: W
- Hooks: V

**Top Candidate:**
[Type]: [Name] - [one-line description]
Plugin: [where it goes]

**Artifact Created:**
[Linear link or file path]

**Next Steps:**
1. Review specification
2. Implement via /compound:consolidate or manual build
3. Test the new component
═══════════════════════════════════════════════════════════════
```

## Prompting for Depth

If session context is thin, ask:
- "What workflow did you just complete?"
- "What would you want to do the same way next time?"
- "What took multiple steps that should be simpler?"
- "What should have happened automatically?"
- "What subtask could a specialist have handled?"

## Important Notes

- **All four component types** - consider skills, commands, agents, AND hooks
- **Verify with documentation** - use claude-code-guide for current patterns
- **Quality over quantity** - one good spec > five vague ideas
- **Right component type** - wrong type = wrong solution
- **Complete specifications** - output should be implementation-ready
