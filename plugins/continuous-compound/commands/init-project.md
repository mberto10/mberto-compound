---
name: init-project
description: Initialize a new Continuous Compound project in Linear through iterative exploration and targeted interviewing
allowed_tools:
  - AskUserQuestion
  - Task
  - mcp__linear-server__create_project
  - mcp__linear-server__update_project
  - mcp__linear-server__create_issue
  - mcp__linear-server__list_projects
  - mcp__linear-server__get_project
  - Read
  - Glob
  - Grep
---

# Initialize Continuous Compound Project

Create a new long-running project in Linear with a comprehensive, well-researched ledger through iterative exploration and targeted interviewing.

## Phase 1: Initial Description

Ask the user to describe the project in their own words:

"Please describe the project you want to start:
- What are you trying to build or accomplish?
- Where does this fit in the codebase/system?
- What's the rough scope?"

Let them explain freely. Capture:
- The core objective
- Where it lives in the system
- Initial scope indication

## Phase 2: Exploration Loop (Repeat Until Complete)

### 2a. Explore Based on Current Understanding

Launch exploration sub-agents to investigate what the user described:

```
Task(
  subagent_type="Explore",
  prompt="Based on this project description: '<user_description>'

  Explore the codebase to understand:
  1. Where this functionality would live
  2. Existing patterns and conventions in this area
  3. Related implementations to learn from
  4. Integration points and dependencies
  5. Potential constraints or conflicts

  Be thorough. Return structured findings.",
  description="Explore: <area>"
)
```

Run multiple exploration agents in parallel for different aspects:
- Architecture/structure exploration
- Related feature exploration
- Test pattern exploration
- Documentation exploration

### 2b. Interview Based on Findings

After exploration returns, ask targeted questions based on what you learned:

Use `AskUserQuestion` to clarify:
- Ambiguities the exploration revealed
- Decisions that need to be made
- Tradeoffs identified in the codebase
- Gaps between user's description and codebase reality

**Question categories based on exploration findings:**

| Finding Type | Question to Ask |
|--------------|-----------------|
| Multiple patterns found | "I found X and Y patterns. Which should this follow?" |
| Unclear integration | "This touches [system]. How tightly should they couple?" |
| Potential conflict | "Existing [feature] does similar. Extend or separate?" |
| Missing context | "I couldn't find [thing]. Does it exist? Should it?" |
| Scope uncertainty | "This could include [X]. In or out of scope?" |
| Risk identified | "I noticed [risk]. How concerned are you about this?" |

**REQUIRED question (ask every project):**

> "What is the mandatory process for each task in this project? List the steps that must NEVER be skipped, no matter how simple the task seems."

This question populates the MANDATORY PROCESS section of the ledger.

**Don't ask obvious questions** - if the codebase answered it, don't ask.

### 2c. Decide: Continue or Finalize?

After each interview round, assess:
- Do I have enough context to write a comprehensive ledger?
- Are there still major unknowns?
- Did the answers reveal new areas to explore?

If more exploration needed → return to 2a with new focus areas
If complete → proceed to Phase 3

**Typical loop: 2-4 iterations of explore → interview**

## Phase 3: Synthesize Ledger

Combine all exploration findings + interview answers into the ledger:

```markdown
# Continuity Ledger

## ⚠️ MANDATORY PROCESS (READ EVERY TASK)

**You MUST follow this process for every task. No exceptions. No shortcuts.**

1. [Project-specific step 1 - from interview]
2. [Project-specific step 2 - from interview]
3. [Project-specific step 3 - from interview]
4. Before marking Done: verify ALL acceptance criteria are met

**If you think you can skip a step, you are wrong. Follow the process.**

**If you think a task is "different" and doesn't need the full process, you are wrong. Follow the process.**

---

## Goal
[Specific, measurable - derived from interviews]

## Constraints
- [From interview: non-negotiables]
- [From exploration: technical constraints]
- [From interview: scope boundaries]

## Context
[Why this exists, what it enables - from initial description]

## Technical Approach
[From exploration findings]
- Pattern: [existing pattern to follow]
- Location: [where this lives]
- Key files: [from exploration]
- Integration: [touchpoints identified]

## Risks & Mitigations
| Risk | Source | Mitigation |
|------|--------|------------|
| [From exploration] | Codebase analysis | [Strategy] |
| [From interview] | User concern | [Strategy] |

## Decisions Made
- [Decision from interview]: [choice] because [rationale]

## Open Questions
- [ ] [Still unresolved]

## Out of Scope
- [Explicitly excluded - from interview]

## Ambiguity Protocol
[From interview: how to handle unclear situations]

## State
- **Done**: <none>
- **Now**: Initial setup
- **Next**: [First tasks from breakdown]
- **Blocked**: <none>

## Working Set
[Key files from exploration]

---
*Created: YYYY-MM-DD via init-project*
*Exploration rounds: N*
*Interview rounds: N*
```

## Phase 4: Create in Linear

1. **Create the project**:
```
mcp__linear-server__create_project(
  name: "<project_name>",
  team: "MB90",
  description: "<synthesized_ledger>"
)
```

2. **Create initial issues** from the breakdown:
- First actionable task with `current` label
- Known blockers with `blocked` label
- Pending decisions with `decision` label

3. **Confirm to user**:
- Project URL
- Summary: "Created project with X issues across Y milestones"
- Next step: `export LINEAR_PROJECT_ID="<project_id>"`
- Workflow reminder: Use `[MILESTONE_COMPLETE: X]` markers

## Quality Gates

Before creating, verify:

- [ ] Goal is measurable (not vague aspirations)
- [ ] Technical approach cites actual codebase patterns
- [ ] At least 2 risks with mitigations
- [ ] Out of scope explicitly defined
- [ ] First task is immediately actionable
- [ ] Exploration covered: patterns, integration, tests
- [ ] No major open questions remain

## Example Flow

```
User: "I want to add PDF export for stock reports"

→ Explore: reporting system, existing exports, PDF libraries
→ Findings: HTML templates exist, no PDF yet, Playwright available

Interview:
- "HTML templates use React Email. Generate PDF from HTML or new template?"
- "Reports can be long. Page breaks important or single scroll?"

→ Explore: React Email PDF options, Playwright PDF capabilities

Interview:
- "Playwright PDF works. Acceptable dependency or too heavy?"
- "Out of scope: Interactive PDFs, or include?"

→ Synthesize ledger with specific approach + decisions
→ Create in Linear with first task: "Set up Playwright PDF generation"
```
