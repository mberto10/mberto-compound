---
name: Discovery Craft
description: This skill should be used when the user invokes "/discover", asks to "find patterns", "extract workflows", "what could be a skill", "what could be a command", "modularize this", "discover repeatable procedures", or wants to identify engineering patterns that could become new plugin components. Provides methodology for subsystem-aware pattern extraction and component type selection.
---

# Discovery Craft

## Purpose

Analyze engineering work sessions to discover **modularizable patterns** and determine the right component type: **skill**, **command**, **agent**, or **hook**. This is subsystem-aware pattern extraction — grounding discovery in concrete subsystem knowledge rather than abstract observation.

## Foundation

Load `references/compounding-methodology.md` for the underlying philosophy — the compound loop, what makes learning worth encoding, and the frontier model.

## The Skills-as-Modules Lens

Every repeatable procedure with clear inputs and outputs can become a loadable module. The question:

> "What procedure lives in people's heads that could be a plugin component?"

In compound engineering, extend this to:

> "What subsystem-specific knowledge keeps being needed but isn't captured?"

## Component Type Selection

### Skills
**Use when:** Pattern provides specialized knowledge or methodology that Claude should apply when relevant.

**Characteristics:**
- Knowledge-based, not action-based
- Activates automatically based on context
- Provides guidance, workflows, domain expertise
- User doesn't invoke directly — Claude loads when needed

**In engineering context:** Domain knowledge about a subsystem, design patterns used in the codebase, testing strategies for specific areas.

### Commands
**Use when:** Pattern is a user-initiated action with clear steps.

**Characteristics:**
- User explicitly invokes with `/command-name`
- Has defined inputs (arguments) and outputs
- Executes a specific workflow
- May use skills for guidance during execution

**In engineering context:** Deployment procedures, migration workflows, code generation for specific patterns.

### Agents
**Use when:** Pattern requires autonomous, multi-step work that benefits from specialization.

**Characteristics:**
- Launched via Task tool, runs independently
- Has specific expertise and tool access
- Returns results to parent conversation
- Good for parallelizable or complex subtasks

**In engineering context:** Code review from a specific angle, dependency analysis, test generation.

### Hooks
**Use when:** Pattern should happen automatically in response to events.

**Characteristics:**
- Event-driven (PreToolUse, PostToolUse, Stop, etc.)
- No user invocation — triggers on system events
- For validation, logging, guardrails, automation
- Can block actions or modify behavior

**In engineering context:** Pre-commit checks, invariant validation, file change guards.

## Decision Matrix

| Pattern Characteristic | Component |
|------------------------|-----------|
| Knowledge Claude should know | **Skill** |
| Action user explicitly requests | **Command** |
| Autonomous specialized subtask | **Agent** |
| Should happen on every X event | **Hook** |
| Combines knowledge + action | **Command** + **Skill** |
| Complex workflow with subspecialties | **Command** + **Agents** |

## Subsystem-Aware Pattern Discovery

### 1. Session Analysis

Examine what happened with subsystem context:

- Which subsystems were touched? What patterns emerged within each?
- Were there cross-subsystem patterns (same approach applied in multiple subsystems)?
- Did `helpful_skills` have gaps — knowledge that was needed but not available?
- Did invariant checking reveal common failure modes?
- Were there spec gaps that suggest missing documentation patterns?

### 2. Pattern Extraction

For each pattern, document:

```
Pattern: [Name]
Trigger: When would this be needed?
Inputs: What does it start with?
Process: What happens (3-7 steps)?
Outputs: What does it produce?
Knowledge: What expertise is embedded?
Subsystems: Which subsystems does this relate to?
Frequency: How often does this come up?
```

### 3. Component Type Selection

Apply the decision matrix:

```
[ ] Is this knowledge Claude should apply contextually?
    → Yes: SKILL (add to subsystem helpful_skills)

[ ] Is this an action users explicitly request?
    → Yes: COMMAND (add to local project plugin)

[ ] Is this autonomous work for a specialist?
    → Yes: AGENT (add to local project plugin)

[ ] Should this happen automatically on events?
    → Yes: HOOK (add to local project plugin)

[ ] Multiple apply?
    → Design combination
```

### 4. Modularizability Assessment

| Criterion | Question |
|-----------|----------|
| **Recurrence** | Will this happen again in this project? |
| **Clear boundaries** | Are inputs/outputs defined? |
| **Teachable** | Can it be written as instructions? |
| **Consistent** | Should it work the same way each time? |
| **Value** | Is packaging worth the effort? |

### 5. Subsystem Integration Assessment

For each proposed component:

- **Which subsystems should reference it?** Determine which `helpful_skills` sections to update.
- **Does it fill a gap?** Check if it addresses a documented gap in any subsystem spec.
- **Is it cross-cutting?** If it applies to all subsystems, it might belong in the portable plugin instead.

### 6. Exaptation Scan

Features built for one purpose often work for another. For each discovered pattern:

- Was this built for a specific subsystem?
- Could it apply to other subsystems in this project?
- Is there a more general pattern hiding here?

Don't over-specialize. Look for the general capability.

## Specification Templates

### Skill Specification

```markdown
## Proposed Skill: [name]

**Location:** .claude/plugins/{project-plugin}/skills/[skill-name]/

### Trigger Description
This skill should be used when [triggers].

### What It Provides
- [Knowledge area]
- [Workflow guidance]

### Subsystem Integration
- Add to helpful_skills in: [subsystem1, subsystem2]
- Addresses gap: [GAP-XXX if applicable]

### Estimated Size
- SKILL.md: ~[X] words
```

### Command Specification

```markdown
## Proposed Command: /[name]

**Location:** .claude/plugins/{project-plugin}/commands/[name].md

### Frontmatter
description: [one-line description]
argument-hint: [arguments]
allowed-tools: [tools needed]

### Workflow
1. [Step]
2. [Step]
3. [Step]

### Subsystem Integration
- Reads from: [subsystem specs]
```

### Agent Specification

```markdown
## Proposed Agent: [name]

**Location:** .claude/plugins/{project-plugin}/agents/[name].md

### When to Use
[Situation where this agent helps]

### Expertise
[What it's good at]

### Tools Required
- [Tool]: [why]
```

### Hook Specification

```markdown
## Proposed Hook: [name]

**Location:** .claude/plugins/{project-plugin}/hooks/hooks.json

### Event Type
[PreToolUse | PostToolUse | Stop | etc.]

### Purpose
[What it enforces/validates]

### Configuration
{JSON config}
```

## Anti-Patterns

**Wrong component type:**
- Using a hook when a command is more appropriate (user should control when it runs)
- Using a command when a skill is more appropriate (knowledge, not action)
- Using a skill when an agent is more appropriate (autonomous work)

**Over-engineering:**
- Creating an agent for simple subtasks
- Adding hooks for rare situations
- Building skills for one-off knowledge

**Under-engineering:**
- Putting everything in one command when agents could parallelize
- Skipping skills that would help multiple commands
- Missing hooks for important guardrails

## Output

Discovery produces component specifications ready for implementation via `/consolidate`. Each spec should be complete enough to build from.
