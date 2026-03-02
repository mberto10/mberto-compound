---
name: Calendar Management
description: This skill should be used when the user asks about their schedule, calendar, meetings, events, appointments, availability, or free time. Triggers on phrases like "what's on my calendar", "am I free", "schedule a meeting", "when is my next meeting", "block time", "create an event", "cancel my meeting", "accept that invite", "find a time for us to meet", "what do I have tomorrow", or any request involving dates and scheduling.
version: 0.1.0
---

# Calendar Management

## Purpose

Manage the user's Google Calendar — reading, creating, updating, deleting events and finding availability — through the native Google Calendar MCP integration.

## Loading MCP Tools

Google Calendar tools are deferred. Before using any `mcp__claude_ai_Google_Calendar__*` tool, load it via ToolSearch first:

```
ToolSearch: "+Google_Calendar list_events"
```

Load only what you need for the current request. Available tools:

| Tool | Operation |
|------|-----------|
| `gcal_list_events` | List events in a time range |
| `gcal_get_event` | Get full details of one event |
| `gcal_create_event` | Create a new event |
| `gcal_update_event` | Update an existing event |
| `gcal_delete_event` | Delete an event |
| `gcal_list_calendars` | List all calendars |
| `gcal_find_my_free_time` | Find free time blocks |
| `gcal_find_meeting_times` | Suggest meeting slots |
| `gcal_respond_to_event` | RSVP to an invitation |

## Intent Recognition

| User Says | Tool to Use |
|-----------|-------------|
| "what's on my calendar today/tomorrow/this week" | `gcal_list_events` |
| "am I free" / "do I have time" | `gcal_find_my_free_time` |
| "schedule" / "create" / "add an event" / "block time" | `gcal_create_event` |
| "move" / "reschedule" / "change the time" | `gcal_update_event` |
| "cancel" / "delete" / "remove" | `gcal_delete_event` |
| "find a time" / "when can we meet" | `gcal_find_meeting_times` |
| "accept" / "decline" / "respond to invite" | `gcal_respond_to_event` |
| "details about [event]" / "what's that meeting about" | `gcal_get_event` |
| "which calendars do I have" | `gcal_list_calendars` |

## Operations Reference

### Reading Events

Use `gcal_list_events` with date boundaries derived from today's date (available in context):
- "today" → timeMin = today 00:00, timeMax = today 23:59
- "tomorrow" → next day, same pattern
- "this week" → Monday 00:00 through Sunday 23:59

### Finding Availability

Use `gcal_find_my_free_time`. Show free blocks of 30+ minutes grouped by day. Default range: today through end of week.

### Creating Events

Minimum required: title + start time. Defaults: duration = 1 hour. Ask for missing required fields via `AskUserQuestion` before calling the tool. Confirm what was created.

### Updating Events

First identify the event via `gcal_list_events`. If multiple matches, show a numbered list and ask which one. Apply only the changed fields via `gcal_update_event`.

### Deleting Events

**Always confirm before deleting.** Show the event title, date, and time. Only proceed after explicit user confirmation via `AskUserQuestion`.

### Responding to Invitations

Map user language:
- yes / accept / attending → `accepted`
- no / decline / can't make it → `declined`
- maybe / tentative / unsure → `tentative`

### Finding Meeting Times

Use `gcal_find_meeting_times`. Default to business hours (09:00–18:00) and 30-minute slots. Present 3–5 suggestions.

## Output Format

**Event lists:**
```
TODAY — Mon, Mar 2
─────────────────────────────────────
09:00  Team standup (30 min)
10:30  Product review (1h)
14:00  1:1 with Sarah (30 min)
─────────────────────────────────────
3 events  |  Next free: 11:30–13:00
```

**Free time:**
```
FREE THIS WEEK
─────────────────────────────────────
Mon  11:30–13:00  (1h 30m)
Tue  All day
Wed  15:00–17:00  (2h)
─────────────────────────────────────
```

**Meeting slots:**
```
SUGGESTED SLOTS (30 min)
1.  Mon Mar 4   09:00–09:30
2.  Mon Mar 4   14:00–14:30
3.  Tue Mar 5   10:30–11:00
```

## Behavior Principles

- Use today's date from context for all date calculations
- For destructive actions (delete), always confirm before proceeding
- When multiple events match, list options and ask user to pick
- Show times in local format, never raw ISO strings
- When creating events, confirm what was created with a brief summary
- If a calendar operation fails, explain clearly and suggest alternatives
