---
name: Linear Workflow
description: This skill should be used when the user asks to "check my linear tasks", "plan my day", "start my day", "what should I work on", "update linear", "create linear issue", "mark task done", mentions daily planning, or references Linear issue IDs. Provides guidance for personal task management using Linear API.
version: 0.1.0
---

# Linear Workflow

Personal task management and daily planning using Linear. Linear is the source of truth for day-to-day work.

## Slash Commands

### `/start-day`
Morning planning routine:
1. Query today's Linear tasks
2. Identify priorities
3. Create time-blocked plan

### `/linear <action>`
Direct Linear operations:
- `tasks` - List assigned tasks
- `today` - Tasks due today
- `create <title>` - Create new issue
- `done <id>` - Mark complete
- `progress <id>` - Move to in progress

## Recommended: Use helper_tools CLI

```bash
# Get your tasks
python helper_tools/linear/linear.py tasks

# Tasks due today
python helper_tools/linear/linear.py today

# Create a task
python helper_tools/linear/linear.py create "Review PR for auth refactor"

# Update status
python helper_tools/linear/linear.py done ABC-123
python helper_tools/linear/linear.py progress ABC-123

# Search tasks
python helper_tools/linear/linear.py search "RAG"
```

## Configuration

**API Endpoint:** `https://api.linear.app/graphql`
**Authentication:** API key via `LINEAR_API_KEY` environment variable

## Daily Planning Framework

### Morning Routine

1. **Review tasks** - Query Linear for assigned issues
2. **Identify blockers** - Any waiting or blocked items?
3. **Set #1 priority** - What's the most important thing today?
4. **Time-block** - Schedule 2-3 focus blocks

### Prioritization

Use Eisenhower matrix:
- **Do First**: Urgent + Important (deadlines, blockers)
- **Schedule**: Important, not urgent (deep work)
- **Delegate**: Urgent, not important (can wait)
- **Eliminate**: Neither (backlog or delete)

### Recommended Daily Goals

- 3-5 meaningful tasks (not an exhaustive list)
- 1 "big rock" priority item
- Buffer for unexpected work
- Group similar tasks together

## Core API Operations

### Query My Issues

```graphql
query MyIssues {
  viewer {
    assignedIssues(
      filter: { state: { type: { nin: ["completed", "canceled"] } } }
      first: 50
    ) {
      nodes {
        id
        identifier
        title
        priority
        dueDate
        state { name type }
        labels { nodes { name } }
      }
    }
  }
}
```

### Create Issue

```graphql
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { id identifier title url }
  }
}
```

Variables:
```json
{
  "input": {
    "teamId": "<team-id>",
    "title": "Issue title",
    "description": "Details"
  }
}
```

### Update Issue State

```graphql
mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue { id identifier state { name } }
  }
}
```

## Workflow Integration

### Daily Flow

```
Morning:  /start-day → Review Linear → Plan
During:   Work tasks → /linear progress <id>
Evening:  /linear done <id> → Update YouTrack docs
```

### Sync with YouTrack

After completing significant work:
1. Mark Linear task done
2. Update YouTrack epic with progress
3. Use `/update-youtrack-epic` for KW updates

## Tips

- **Labels for context**: Use labels to categorize work types
- **Due dates**: Set realistic due dates, not aspirational
- **Descriptions**: Include acceptance criteria
- **Link to PRs**: Connect issues to pull requests

## Reference Files

- **`references/graphql-queries.md`** - Common GraphQL queries and mutations
