---
name: start-day
description: Morning planning session - review Linear tasks and set priorities
allowed-tools:
  - Read
  - Bash
argument-hint: "[today|week]"
---

# Start Day Command

Help the user begin their day with a structured planning session.

## Workflow

1. **Query Linear** for current tasks using helper_tools:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py tasks
   ```

2. **Present tasks** organized by status:
   ```
   ## In Progress
   - [Task] - [Context]

   ## Ready to Start
   - [Task] - Priority: [High/Medium/Low]

   ## Upcoming This Week
   - [Task] - Due: [Date]
   ```

3. **Identify priority** - Ask: "Was ist heute dein Hauptfokus?"

4. **Create plan** in German:
   ```
   ## Dein Tag - [Datum]

   **Hauptpriorität:** [Task]

   **Plan:**
   - 09:00-11:00: Deep Work an [Task]
   - 11:00-12:00: [Meeting/Task]
   - 14:00-16:00: [Task]

   **Offen/Blocker:**
   - [Falls vorhanden]

   Los geht's!
   ```

## Arguments

- `today` (default): Focus on today's tasks
- `week`: Broader weekly planning view

## If Linear Unavailable

Ask the user what's on their plate and help prioritize manually.
