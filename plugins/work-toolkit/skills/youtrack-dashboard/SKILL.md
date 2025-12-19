---
name: YouTrack Dashboard
description: This skill should be used when the user asks to "write a youtrack comment", "create youtrack ticket", "update youtrack issue", "get youtrack comments", "compile weekly update from youtrack", "check epic status", "sync Linear to YouTrack", "update youtrack epic", mentions "KW" (Kalenderwoche) updates, or references YouTrack issue IDs like "AI-74", "AI-76". Provides guidance for interacting with the YouTrack REST API at fazit.youtrack.cloud and syncing with Linear.
version: 0.2.0
---

# YouTrack Dashboard

Interact with YouTrack (fazit.youtrack.cloud) via REST API for ticket management, comments, and weekly status compilation. Includes Linear integration for bidirectional project management.

## Slash Commands

### `/update-youtrack-epic <project_name>`
Generate a KW (Kalenderwoche) update from Linear project activity and post to both:
- **YouTrack**: As a comment on the matching epic
- **Linear**: Appended to project description

Options: `--youtrack-only`, `--linear-only`

### `/sync-linear-to-youtrack <project_name>`
One-way sync of open issues from Linear to YouTrack:
- Creates YouTrack sub-tasks under the matching epic
- Uses `[LINEAR_ID]` prefix for tracking
- Safe to re-run (skips already-synced issues)

Option: `--dry-run` for preview

### `/weekly-email`
Compile weekly Lenkungsausschuss update from all YouTrack KW comments.

## Recommended: Use helper_tools CLI

The `helper_tools/` directory contains ready-to-use Python scripts for all common YouTrack operations. **Prefer these over raw API calls.**

```bash
# Get ticket details
python helper_tools/youtrack/yt.py get AI-123

# Search tickets (defaults to AI project)
python helper_tools/youtrack/yt.py search "State: Open"
python helper_tools/youtrack/yt.py search "assignee: me"

# Create ticket in AI project
python helper_tools/youtrack/yt.py create "Bug: Login fails" "Users cannot log in"

# Add comment
python helper_tools/youtrack/yt.py comment AI-123 "Fixed in latest commit"

# Update ticket
python helper_tools/youtrack/yt.py update AI-123 --state="Done" --assignee="john"

# Get weekly KW updates from all epic tickets
python helper_tools/youtrack/get_kw_updates.py --kw=39

# Get project updates for weekly email
python helper_tools/youtrack/get_weekly_project_updates.py --weeks-back=1
```

See `helper_tools/README.md` for complete documentation.

## Configuration

**Base URL:** `https://fazit.youtrack.cloud`
**Authentication:** Bearer token via `YOUTRACK_API_TOKEN` environment variable
**Default Project:** AI (project ID: `0-331`)

### Request Headers

```
Authorization: Bearer $YOUTRACK_API_TOKEN
Accept: application/json
Content-Type: application/json
```

## Core Operations

### Get Issue Details

Retrieve a single issue by readable ID (e.g., `AI-74`):

```bash
curl -s "https://fazit.youtrack.cloud/api/issues/AI-74?fields=idReadable,summary,description,created,updated,reporter(name),assignee(name),customFields(name,value(name))" \
  -H "Authorization: Bearer $YOUTRACK_API_TOKEN" \
  -H "Accept: application/json"
```

### Search Issues

Query issues using YouTrack query syntax:

```bash
curl -s "https://fazit.youtrack.cloud/api/issues?query=project:AI%20State:Open&fields=idReadable,summary,description&\$top=50" \
  -H "Authorization: Bearer $YOUTRACK_API_TOKEN" \
  -H "Accept: application/json"
```

**Common query patterns:**
| Query | Purpose |
|-------|---------|
| `project: AI` | All issues in AI project |
| `project: AI Type: Story` | Epic/Story tickets only |
| `project: AI State: Projektticket` | Active project tickets |
| `project: AI assignee: me` | Issues assigned to current user |
| `project: AI updated: {Last week}` | Recently updated issues |

### Get Comments

Retrieve all comments for an issue:

```bash
curl -s "https://fazit.youtrack.cloud/api/issues/AI-74/comments?fields=id,text,created,author(name,login)&\$top=100" \
  -H "Authorization: Bearer $YOUTRACK_API_TOKEN" \
  -H "Accept: application/json"
```

### Add Comment

Post a new comment to an issue:

```bash
curl -s -X POST "https://fazit.youtrack.cloud/api/issues/AI-74/comments?fields=id,text,created,author(name)" \
  -H "Authorization: Bearer $YOUTRACK_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"text": "Comment text in **Markdown** format", "usesMarkdown": true}'
```

### Create Issue

Create a new issue in the AI project:

```bash
curl -s -X POST "https://fazit.youtrack.cloud/api/issues?fields=idReadable,summary" \
  -H "Authorization: Bearer $YOUTRACK_API_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "project": {"id": "0-331"},
    "summary": "Issue title",
    "description": "Detailed description"
  }'
```

## Weekly Update Workflow (KW Format)

Compile weekly status updates from YouTrack comments using German Kalenderwoche (KW) format.

### Recommended: Use helper_tools

```bash
# Get all KW updates for a specific week
python helper_tools/youtrack/get_kw_updates.py --kw=39

# Get project updates with structured output
python helper_tools/youtrack/get_weekly_project_updates.py --weeks-back=1 --format=markdown
```

## Project-Specific Configuration

### AI Project Custom Fields

| Field | Values |
|-------|--------|
| Type | Story, Task, Bug, Feature |
| State | Open, In Progress, Done, Projektticket |
| Priority | Critical, Major, Normal, Minor |
| Epic | (Dynamic - links to parent Story) |

## Linear Integration

YouTrack and Linear are used together for project management:

| System | Purpose | Primary Use |
|--------|---------|-------------|
| **Linear** | Day-to-day task management | Active development work, sprints |
| **YouTrack** | Executive reporting | Lenkungsausschuss updates, epic tracking |

### Project Mapping

Linear projects map to YouTrack epics by name:
- Linear: "Customer Support Chatbot" project
- YouTrack: AI-XX "Customer Support Chatbot" (Type: Story, State: Projektticket)

## Tips

- **Markdown in comments:** Set `usesMarkdown: true` when posting comments for rich formatting
- **Field expansion:** Use the `fields` parameter to specify exactly which fields to return
- **Pagination:** Use `$top` and `$skip` parameters for large result sets
- **Date filtering:** YouTrack supports natural language dates like `{Last week}`, `{Today}`, `{This month}`

## Reference Files

- **`references/api-reference.md`** - Complete YouTrack REST API field reference
- **`examples/kw-comment-template.md`** - Template for KW update comments
