---
name: linear
description: Query and manage Linear tasks
allowed-tools:
  - Bash
  - Read
argument-hint: "<tasks|today|create|done|progress> [details]"
---

# Linear Command

Interface with Linear for task management.

## Actions

| Action | Usage | Description |
|--------|-------|-------------|
| `tasks` | `/linear tasks` | Show assigned tasks |
| `today` | `/linear today` | Tasks due today |
| `create` | `/linear create <title>` | Create new task |
| `done` | `/linear done <id>` | Mark complete |
| `progress` | `/linear progress <id>` | Move to in progress |
| `search` | `/linear search <query>` | Search tasks |

## Implementation

Use helper_tools CLI:

```bash
# List tasks
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py tasks

# Tasks due today
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py today

# Create task
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py create "Task title"

# Update status
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py done ABC-123
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py progress ABC-123
```

## Output Format

```
## In Progress
- [ ] Task title (Due: Date)

## Todo
- [ ] Upcoming task
```

## Error Handling

If API unavailable:
```
Linear API nicht konfiguriert. Bitte setze LINEAR_API_KEY.
```
