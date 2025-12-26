---
name: Discovery Craft
description: This skill should be used when the user invokes "/compound:discover", asks to "find patterns", "extract workflows", "what could be a skill", "what could be a command", "what could be an agent", "modularize this", "discover repeatable procedures", or wants to identify work patterns that could become new plugin components. Provides methodology for pattern extraction and component type selection.
---

# Discovery Craft

## Purpose

Analyze work sessions to discover **modularizable patterns** and determine the right Claude Code component type: **skill**, **command**, **agent**, or **hook**. This is pattern extraction with architectural guidance.

## Foundation

Load `references/compounding-methodology.md` for the underlying philosophy—the compound loop, what makes learning worth encoding, and connected ideas (skills-as-modules, agent-leverageable architecture).

## The Skills-as-Modules Lens

Every repeatable procedure with clear inputs and outputs can become a loadable module. The question:

> "What procedure lives in people's heads that could be a plugin component?"

## Component Type Selection

When a pattern is discovered, determine which component type fits:

### Skills
**Use when:** Pattern provides specialized knowledge or methodology that Claude should apply when relevant.

**Characteristics:**
- Knowledge-based, not action-based
- Activates automatically based on context
- Provides guidance, workflows, domain expertise
- User doesn't invoke directly—Claude loads when needed

**Examples:**
- "How to analyze Langfuse traces effectively"
- "Best practices for German business emails"
- "The compound loop methodology"

**Trigger:** User asks questions or works in the domain → skill activates

### Commands
**Use when:** Pattern is a user-initiated action with clear steps.

**Characteristics:**
- User explicitly invokes with `/command-name`
- Has defined inputs (arguments) and outputs
- Executes a specific workflow
- May use skills for guidance during execution

**Examples:**
- `/reflect` - user wants to capture learnings
- `/draft` - user wants to write content
- `/analyze-traces` - user wants trace analysis

**Trigger:** User types `/command-name [args]`

### Agents
**Use when:** Pattern requires autonomous, multi-step work that benefits from specialization.

**Characteristics:**
- Launched via Task tool, runs independently
- Has specific expertise and tool access
- Returns results to parent conversation
- Good for parallelizable or complex subtasks

**Examples:**
- Code reviewer agent (analyzes PR from specific angle)
- Research agent (gathers information autonomously)
- Validator agent (checks work against criteria)

**Trigger:** Claude (or command) launches agent for specialized subtask

### Hooks
**Use when:** Pattern should happen automatically in response to Claude Code events.

**Characteristics:**
- Event-driven (PreToolUse, PostToolUse, Stop, etc.)
- No user invocation—triggers on system events
- For validation, logging, guardrails, automation
- Can block actions or modify behavior

**Examples:**
- Validate commits before allowing push
- Log all file edits for audit
- Block writes to protected directories
- Auto-format code after edits

**Trigger:** System event occurs → hook executes

## Decision Matrix

| Pattern Characteristic | → Component |
|------------------------|-------------|
| Knowledge Claude should know | **Skill** |
| Action user explicitly requests | **Command** |
| Autonomous specialized subtask | **Agent** |
| Should happen on every X event | **Hook** |
| Combines knowledge + action | **Command** + **Skill** |
| Complex workflow with subspecialties | **Command** + **Agents** |

## Pattern Discovery Process

### 1. Session Analysis

Examine what happened:
- What multi-step procedures were performed?
- What was done more than once?
- What domain knowledge was applied?
- What should have happened automatically but didn't?
- What could have been delegated to a specialist?

### 2. Parallel Search (Optional)

For complex pattern spaces, use parallel exploration. Evolution's power comes from testing many variants simultaneously.

```
Launch Task with subagent_type='Explore':
"Find patterns similar to [X] in other parts of the codebase"

Launch Task with subagent_type='Explore':
"How do other plugins/tools solve [problem Y]?"
```

Go wide before deep. When you hit a problem, the instinct is to go deep on one approach. Evolution says: explore multiple approaches, then double down on what shows promise.

### 3. Pattern Extraction

For each pattern, document:

```
Pattern: [Name]
Trigger: When would this be needed?
Inputs: What does it start with?
Process: What happens (3-7 steps)?
Outputs: What does it produce?
Knowledge: What expertise is embedded?
```

### 4. Component Type Selection

Apply the decision matrix:

```
□ Is this knowledge Claude should apply contextually?
  → Yes: SKILL

□ Is this an action users explicitly request?
  → Yes: COMMAND

□ Is this autonomous work for a specialist?
  → Yes: AGENT

□ Should this happen automatically on events?
  → Yes: HOOK

□ Multiple apply?
  → Design combination (e.g., command that uses skill and launches agents)
```

### 5. Modularizability Assessment

| Criterion | Question |
|-----------|----------|
| **Recurrence** | Will this happen again? |
| **Clear boundaries** | Are inputs/outputs defined? |
| **Teachable** | Can it be written as instructions? |
| **Consistent** | Should it work the same way each time? |
| **Value** | Is packaging worth the effort? |

### 6. Exaptation Scan

Features evolved for one purpose often get repurposed for another. For each discovered pattern:

- Was this built for a specific use case?
- Could it apply to unexpected domains?
- Is there a more general pattern hiding here?

Example: A Langfuse trace analysis pattern might generalize to any trace-based debugging. German email templates might inform any formal communication.

Don't over-specialize. Look for the general capability.

### 7. Recombination Opportunities

Sexual reproduction accelerates evolution by mixing genes. Deliberate recombination of skills can create novel capabilities.

- Could patterns from different plugins combine?
- What would writing-studio + work-toolkit patterns produce?
- Look for capabilities at intersections of domains.

We can do this intentionally. Evolution does it by accident.

### 8. Specification Generation

Based on component type, generate the appropriate spec.

---

## Specification Templates

### Skill Specification

```markdown
## Proposed Skill: [name]

**Location:** plugins/[plugin-name]/skills/[skill-name]/

### Trigger Description (for SKILL.md frontmatter)
This skill should be used when the user asks to "[trigger 1]",
"[trigger 2]", "[trigger 3]", or [broader context description].

### What It Provides
- [Knowledge area 1]
- [Workflow guidance]
- [Domain expertise]

### SKILL.md Structure
1. Purpose (what this skill enables)
2. Core Concepts (essential knowledge)
3. Workflow (how to apply it)
4. Examples (concrete applications)
5. References (link to detailed docs if needed)

### Estimated Size
- SKILL.md: ~[X] words (target 1,500-2,000)
- References needed: [yes/no - list if yes]
- Scripts needed: [yes/no - purpose if yes]
```

### Command Specification

```markdown
## Proposed Command: /[command-name]

**Location:** plugins/[plugin-name]/commands/[command-name].md

### Frontmatter
```yaml
description: [What this command does - one line]
argument-hint: [What arguments it accepts]
allowed-tools: [Tools needed: Read, Write, Edit, Bash, Task, etc.]
```

### Purpose
[What the user accomplishes by running this command]

### Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Inputs
- `$ARGUMENTS`: [What user provides]
- Files read: [Any files the command reads]

### Outputs
- [What the command produces]

### Skills Used
- [Skills this command should load for guidance]

### Agents Launched (if any)
- [Agents this command delegates to]
```

### Agent Specification

```markdown
## Proposed Agent: [agent-name]

**Location:** plugins/[plugin-name]/agents/[agent-name].md

### Frontmatter
```yaml
description: [Agent's expertise and role]
model: [sonnet/opus/haiku - based on complexity]
tools: [Tools the agent needs]
color: [optional - for visual distinction]
```

### When to Use (for whenToUse examples)
<example>
Context: [Situation where this agent helps]
user: "[Example user message]"
assistant: "[How Claude would invoke this agent]"
<commentary>Why this agent is appropriate</commentary>
</example>

### System Prompt Summary
- Role: [What this agent is]
- Expertise: [What it's good at]
- Task: [What it should accomplish]
- Output: [What it returns]

### Tools Required
- [Tool 1]: [Why needed]
- [Tool 2]: [Why needed]

### Interaction Pattern
- Launched by: [Command or Claude directly]
- Returns: [What results come back]
- Runs in background: [yes/no]
```

### Hook Specification

```markdown
## Proposed Hook: [hook-name]

**Location:** plugins/[plugin-name]/hooks/hooks.json

### Event Type
[PreToolUse | PostToolUse | Stop | SubagentStop | SessionStart |
 SessionEnd | UserPromptSubmit | PreCompact | Notification]

### Matcher (if applicable)
[Tool pattern to match, e.g., "Write|Edit", "Bash"]

### Hook Type
[command | prompt]

### Purpose
[What this hook enforces/validates/logs]

### Configuration
```json
{
  "[EventType]": [{
    "matcher": "[pattern]",
    "hooks": [{
      "type": "[command|prompt]",
      "command": "[script path]",  // if command type
      "prompt": "[instruction]"    // if prompt type
    }]
  }]
}
```

### Behavior
- Triggers when: [Condition]
- Action: [What it does]
- Can block: [yes/no]

### Script (if command type)
- Path: hooks/scripts/[name].sh
- Inputs: [What it receives via stdin/env]
- Outputs: [What it returns]
```

---

## Documentation Lookup

When specifying components, use the claude-code-guide agent or search tools to verify:
- Current best practices for the component type
- Required frontmatter fields
- Available hook events
- Tool access patterns

This ensures specifications align with current Claude Code capabilities.

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

Discovery produces component specifications ready for implementation. Each spec should be complete enough to build from.
