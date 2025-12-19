---
name: youtrack
description: Query YouTrack for projects, documentation, and team progress
allowed-tools:
  - Bash
  - Read
argument-hint: "<projects|issues|docs|search> [query]"
---

# YouTrack Command

Interface with YouTrack for documentation and team progress.

## Actions

| Action | Usage | Description |
|--------|-------|-------------|
| `projects` | `/youtrack projects` | List projects |
| `issues` | `/youtrack issues <project>` | Project issues |
| `docs` | `/youtrack docs [project]` | Documentation articles |
| `search` | `/youtrack search <query>` | Search articles |
| `get` | `/youtrack get AI-74` | Get specific issue |
| `comment` | `/youtrack comment AI-74 <text>` | Add comment |

## Implementation

Use helper_tools CLI:

```bash
# Get issue
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py get AI-123

# Search issues
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "State: Open"

# Add comment
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comment AI-123 "Update text"

# Get KW updates
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/get_kw_updates.py --kw=51
```

## Output Format

```
## [Project] - Status

**Issues:**
- AI-74: [Summary] - [State]
- AI-76: [Summary] - [State]

**Recent Activity:**
- [Update 1]
- [Update 2]
```

## Error Handling

If API unavailable:
```
YouTrack API nicht konfiguriert. Bitte setze YOUTRACK_API_TOKEN.
```
