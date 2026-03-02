---
description: Manage Google Calendar — view events, find free time, create/update/delete events, respond to invites
argument-hint: "<today|week|calendars|free|create|update|delete|get|respond|slots> [details]"
allowed-tools:
  - ToolSearch
  - AskUserQuestion
  - mcp__claude_ai_Google_Calendar__gcal_list_events
  - mcp__claude_ai_Google_Calendar__gcal_create_event
  - mcp__claude_ai_Google_Calendar__gcal_update_event
  - mcp__claude_ai_Google_Calendar__gcal_delete_event
  - mcp__claude_ai_Google_Calendar__gcal_find_meeting_times
  - mcp__claude_ai_Google_Calendar__gcal_find_my_free_time
  - mcp__claude_ai_Google_Calendar__gcal_list_calendars
  - mcp__claude_ai_Google_Calendar__gcal_get_event
  - mcp__claude_ai_Google_Calendar__gcal_respond_to_event
---

# Calendar Command

Manage Google Calendar from Claude Code.

**Input:** $ARGUMENTS

If no argument is provided, default to showing today's events.

## Step 0: Load MCP Tools

Before any calendar operation, load the required Google Calendar MCP tools via ToolSearch. Load tools in parallel when possible.

For read operations:
```
ToolSearch: "+Google_Calendar list_events"
```

For write operations, also load the specific tool needed:
```
ToolSearch: "select:mcp__claude_ai_Google_Calendar__gcal_create_event"
```

All tools use the prefix `mcp__claude_ai_Google_Calendar__gcal_`.

## Step 1: Parse Action

Determine the action from $ARGUMENTS:

| Trigger | Action |
|---------|--------|
| `today` or empty | Show today's events |
| `week` | Show this week's events |
| `calendars` | List all calendars |
| `free [timeframe]` | Find free time slots |
| `get <event>` | Get event details |
| `create <details>` | Create a new event |
| `update <event> [changes]` | Update an existing event |
| `delete <event>` | Delete an event |
| `respond <event> <yes/no/maybe>` | RSVP to an invitation |
| `slots <duration> [timeframe]` | Find meeting time suggestions |

Use today's date from context for all relative references (today, tomorrow, this week).

## Step 2: Execute

### today / week

Call `gcal_list_events` with appropriate time boundaries.

Display as:
```
TODAY — Mon, Mar 2
─────────────────────────────────────
09:00  Team standup (30 min)
10:30  Product review (1h) — Google Meet
14:00  1:1 with Sarah (30 min)
─────────────────────────────────────
3 events
```

For `week`, group events by day. Show "— free" for empty days.

### calendars

Call `gcal_list_calendars`. Show each calendar's name and whether it's primary.

### free

Call `gcal_find_my_free_time` with timeframe from arguments (default: rest of today through end of week).

Display free blocks of 30+ minutes:
```
FREE TIME
─────────────────────────────────────
Mon  11:30–13:00  (1h 30m)
Tue  All day free
Wed  15:00–17:00  (2h)
─────────────────────────────────────
```

### get

If user provides a name, first `gcal_list_events` to find the event, then `gcal_get_event` by ID. Show full details: title, time, location, attendees, description, conference link.

### create

Parse from $ARGUMENTS: title (required), start time (required), end time/duration (default 1h), location, attendees, description.

If required fields are missing, use `AskUserQuestion` to collect them.

Call `gcal_create_event` and confirm with a summary of what was created.

### update

Find the event first (same as `get`). If multiple matches, list them and ask user to pick. Apply changes via `gcal_update_event`.

### delete

Find the event first. **Always confirm before deleting** via `AskUserQuestion` — show event title, date, and time. Only call `gcal_delete_event` after explicit confirmation.

### respond

Find the event. Map user input to response status:
- `yes` / `accept` → `accepted`
- `no` / `decline` → `declined`
- `maybe` / `tentative` → `tentative`

Call `gcal_respond_to_event`.

### slots

Call `gcal_find_meeting_times` with duration from arguments (default 30 min), within business hours (09:00–18:00).

```
SUGGESTED SLOTS (30 min)
─────────────────────────────────────
1.  Mon Mar 4   09:00–09:30
2.  Mon Mar 4   14:00–14:30
3.  Tue Mar 5   10:30–11:00
─────────────────────────────────────
```

## Output Principles

- Times in local format, no raw ISO strings
- For destructive actions (delete), always confirm first
- For ambiguous events (multiple matches), list options and ask user to pick
- Keep output scannable: aligned columns, grouped by day
