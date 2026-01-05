---
name: Resume Project
description: Use when the user asks to "resume work", "continue project", "load _autonomous", "what was I working on", or wants to continue autonomous project work. Loads the _autonomous project context from Linear.
version: 1.1.0
---

# Resume _autonomous Project

This skill loads context from the `_autonomous` project in Linear (team MB90).

## 1. Load Project Ledger

```
mcp__linear-server__get_project(query: "_autonomous")
```

The description contains the **ledger**:
- Goal and constraints
- Current milestone progress
- Done/Now/Next/Blocked state
- Key decisions made
- Working set (active files)

## 2. Get Current Work

```
mcp__linear-server__list_issues(project: "_autonomous", label: "current")
```

## 3. Check Blockers

```
mcp__linear-server__list_issues(project: "_autonomous", label: "blocked")
```

## 4. Check for Handoffs

```
mcp__linear-server__list_issues(project: "_autonomous", query: "Handoff:", limit: 1, orderBy: "updatedAt")
```

## 5. Resume

1. Parse the ledger's State section
2. Read the `current` issue details
3. Check handoff for resume instructions
4. Continue working

## Labels

| Label | Purpose |
|-------|---------|
| `current` | Active focus (1-2 max) |
| `blocked` | Waiting on dependency |
| `decision` | Decision record |
| `learning` | Extracted insight |
| `pending-review` | Needs human review |

## Markers

Output these when appropriate:
- `[MILESTONE_COMPLETE: <name>]` → Triggers discovery
- `[PROJECT_COMPLETE]` → Triggers wrap-up
