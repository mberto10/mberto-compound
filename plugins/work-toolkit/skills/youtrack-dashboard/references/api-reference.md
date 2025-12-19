# YouTrack API Reference

## Base Configuration

- **URL**: `https://fazit.youtrack.cloud`
- **Auth**: `Authorization: Bearer $YOUTRACK_API_TOKEN`
- **Format**: JSON

## Common Fields Parameter

```
idReadable,summary,description,created,updated,reporter(name),assignee(name),customFields(name,value(name))
```

## Query Syntax

| Pattern | Example | Description |
|---------|---------|-------------|
| `project: X` | `project: AI` | Filter by project |
| `Type: X` | `Type: Story` | Filter by type |
| `State: X` | `State: Open` | Filter by state |
| `assignee: X` | `assignee: me` | Filter by assignee |
| `updated: {X}` | `updated: {Last week}` | Date filter |
| `parent: X` | `parent: AI-74` | Child issues |

## Custom Fields (AI Project)

| Field | Values |
|-------|--------|
| Type | Story, Task, Bug, Feature |
| State | Open, In Progress, Done, Projektticket |
| Priority | Critical, Major, Normal, Minor |

## Pagination

- `$top=N` - Limit results
- `$skip=N` - Skip results
- Default limit: 100

## Endpoints

### Issues
- `GET /api/issues/{id}` - Get issue
- `GET /api/issues?query=X` - Search issues
- `POST /api/issues` - Create issue
- `POST /api/issues/{id}` - Update issue

### Comments
- `GET /api/issues/{id}/comments` - List comments
- `POST /api/issues/{id}/comments` - Add comment

### Articles (Knowledge Base)
- `GET /api/articles` - List articles
- `GET /api/articles/{id}` - Get article
