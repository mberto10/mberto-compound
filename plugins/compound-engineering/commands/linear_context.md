---
description: Get context on a Linear project and issue, review previous work, and understand codebase state
argument-hint: <project-name> <issue-id> (e.g., "dispatch MB90-1234")
allowed-tools: Read, Glob, Grep, Task, Bash, mcp__linear__*
---

# Linear Context Command

Retrieve comprehensive context for a Linear project and specific issue to understand the current work state.

---

## Input

**Arguments:** $ARGUMENTS

Expected format: `<project-name> <issue-id>`

If no arguments provided, ask the user for:
1. The Linear project name (e.g., "dispatch", "writing-ecosystem")
2. The specific issue ID or name of the issue (e.g., "MB90-1234")

---

## Step 1: Retrieve the Linear Project

Use Linear MCP to get the project overview.

```
mcp__linear__list_projects → find project matching the provided name
mcp__linear__get_project → get full project details including:
  - Project description and goals
  - Current status
  - Team members
  - Milestones if any
```

**Output:** Project summary including purpose, current phase, and key objectives.

---

## Step 2: Retrieve the Specific Issue

Get the target issue with full context.

```
mcp__linear__get_issue(issue_id) → retrieve:
  - Title and description
  - Status (backlog, in progress, done, etc.)
  - Priority and labels
  - Assignee
  - Parent issue/epic if any
  - Comments and activity
  - Related issues
```

**Output:** Full issue details including requirements, acceptance criteria, and any discussion.

---

## Step 3: Review Previous Issues in the Project

Get historical context from completed work.

```
mcp__linear__search_issues → filter by:
  - Same project
  - Status: completed/done
  - Order by: recently completed first
  - Limit: last 10-15 issues
```

For each completed issue, note:
- What was implemented
- Any patterns or architectural decisions made
- Related commits/PRs if mentioned in comments
- Blockers that were resolved

**Output:** Summary of recent project progress and patterns established.

---

## Step 4: Understand Codebase State

Get an overview of the repository's current state.

```
# Check git status
git status
git log --oneline -20  # Recent commits

# Check for any in-progress work
git branch -a | head -20

# Look at project structure for context
ls -la
```

Cross-reference:
- Recent commits against completed Linear issues
- Any branches that match the current issue ID
- Modified files that might be relevant to the issue

**Output:** Current codebase state including recent changes, active branches, and any work-in-progress related to the project.

---

## Step 5: Synthesize Context

Combine all gathered information into a structured summary.

**Output format:**

```markdown
# Linear Context: {issue-id}

## Project Overview
**Project:** {project name}
**Purpose:** {brief description}
**Current Phase:** {status/phase}

## Target Issue: {issue-id}
**Title:** {title}
**Status:** {status}
**Priority:** {priority}
**Labels:** {labels}

### Description
{issue description}

### Acceptance Criteria
{if available}

### Related Issues
- {related issue links}

## Recent Project History
| Issue | Title | Status | Key Outcome |
|-------|-------|--------|-------------|
| {id} | {title} | Done | {what was achieved} |

### Patterns & Decisions Established
- {pattern 1}
- {pattern 2}

## Codebase State
**Branch:** {current branch}
**Recent Commits:**
- {commit 1}
- {commit 2}

**Relevant Modified Files:**
- {file paths related to project/issue}

## Recommended Starting Points
1. {file or area to start with}
2. {related code to review}
3. {tests to understand}
```

---

## Notes

- This command is read-only — it gathers context but makes no changes
- If Linear MCP is not available, inform the user and suggest manual retrieval
- When issue ID format doesn't match expected pattern, ask for clarification
- Cross-reference git history with Linear issues when possible to connect code changes to tickets
