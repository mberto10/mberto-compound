---
description: Plan milestones/issues for _autonomous project and start working
allowed-tools: Task, mcp__linear-server__*, Read, Glob, Grep
---

# Start Working on Project

Load project from Linear (team MB90), plan milestones and issues through exploration, then begin systematic work.

## Label Reference

| Label | Purpose | When to Apply |
|-------|---------|---------------|
| `current` | Active focus | 1-2 issues being worked on now |
| `blocked` | Stuck | Waiting on external dependency |
| `decision` | Choice record | Architectural/design decisions |
| `learning` | Insight | Created by discovery at milestones |
| `pending-review` | Needs human | Learnings awaiting review |

## Usage

```
/start-project
```

No arguments needed - always works on `_autonomous` project.

---

## Phase 1: Load Project Context

1. **Fetch _autonomous project**:
```
mcp__linear-server__get_project(query: "_autonomous")
```

2. **Parse the ledger** from description:
   - Goal, constraints, technical approach
   - Risks, ambiguity protocol

3. **Check existing issues**:
```
mcp__linear-server__list_issues(project: "<id>")
```

If milestones/issues already exist → skip to Phase 4 (resume)
If empty or skeleton → continue to Phase 2 (plan)

---

## Phase 2: Plan Through Exploration

Use sub-agents to explore the codebase and produce the implementation plan:

```
Task(
  subagent_type="Explore",
  prompt="Project goal: <from ledger>
  Technical approach: <from ledger>
  Key files: <from ledger>

  Explore the codebase to plan implementation:
  1. What must be built first (dependencies)?
  2. What are natural milestone boundaries?
  3. What specific, surgical tasks make up each milestone?

  Output a milestone plan with concrete issues.
  Each issue should be precise and minimal - just enough context to execute.",
  description="Plan implementation"
)
```

The exploration should produce:
- 2-4 milestones with clear deliverables
- 3-7 issues per milestone
- Dependency order

---

## Phase 3: Create in Linear

### Issue Guidelines

Issues should be **surgical and precise**:
- Clear verb + object title
- Acceptance criteria (2-4 bullets)
- Minimal technical notes (only what's needed)
- No bloat - agent will explore when working

```markdown
Title: Add PDF generation endpoint

## Acceptance Criteria
- [ ] POST /api/reports/:id/pdf returns PDF
- [ ] Uses Playwright for rendering
- [ ] Tests pass

## Files
- src/api/reports.py
- tests/test_reports.py
```

### Create Issues

For each issue from the plan:
```
mcp__linear-server__create_issue(
  title: "<verb> <object>",
  team: "MB90",
  project: "_autonomous",
  description: "<surgical description>"
)
```

Label first task as `current`.

### Update Ledger

Update _autonomous project description:
```markdown
## Milestones
1. [ ] <M1> (X issues)
2. [ ] <M2> (X issues)
3. [ ] <M3> (X issues)

## State
- **Now**: <first task>
- **Next**: <M1 remaining>
```

---

## Phase 4: Begin Work

1. **Load current task** (label: `current`)
2. **Explore for task** - understand implementation context
3. **Implement**
4. **Mark done**, move `current` to next task

---

## Working Protocol

### During Work
- Add `friction:` comments when things are hard
- Update issue with progress

### Task Complete
1. Mark Done
2. Move `current` label to next task
3. Update ledger State

### Milestone Complete
```
[MILESTONE_COMPLETE: <name>]
```

### Project Complete
```
[PROJECT_COMPLETE]
```

### Before Context Fills

**IMPORTANT: Use /clear, NOT /compact**

Why /clear is preferred for autonomous projects:
- `/compact` summarizes the conversation, losing nuance and MANDATORY PROCESS details
- After /compact, agents often drift from documented processes because requirements get compressed
- `/clear` triggers SessionStart hook which reloads the FULL ledger and current issues with complete descriptions
- This ensures MANDATORY PROCESS steps and acceptance criteria are always visible

Steps:
1. Update ledger with current state
2. Create handoff issue: "Handoff: YYYY-MM-DD" (PreCompact hook does this automatically)
3. Run `/clear` (NOT /compact)
4. SessionStart hook will reload full context with MANDATORY PROCESS

---

## Resuming

If _autonomous already has issues:
1. Find `current` labeled issues
2. Check recent handoffs
3. Continue from Phase 4

Note: After /clear, SessionStart hook automatically prompts to reload _autonomous.
