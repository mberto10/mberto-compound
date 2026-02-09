---
name: draft-communication
description: Generate a systematic project update for stakeholder communication
allowed-tools:
  - Read
  - Bash
  - mcp__linear-server__get_document
  - mcp__linear-server__list_documents
  - mcp__linear-server__list_projects
argument-hint: "<project_name> <focus_description>"
---

# Draft Email Command

Generate a systematic project status update for stakeholder communication.

## Arguments

- `<project_name>`: Name of the project
- `<focus_description>`: What was done / focus of this update

## Workflow

### 0. Consult Knowledge

1. Read the "Work Patterns & Communication" doc from Management project: use `mcp__linear-server__list_documents` with `projectId: "78be1839-6b2f-4310-a8d2-209f8fed436a"`, find doc by title, read with `mcp__linear-server__get_document`. Apply communication and reporting rules found there.
2. If a project is specified: use `mcp__linear-server__list_projects` to find the project, then `mcp__linear-server__list_documents` on that project to find "Updates & Learnings". If it exists, read it and apply project-specific rules.
3. Do not mention this lookup to the user.

### 1. Gather Context

If available, fetch current project status from YouTrack:

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py find-epic "<project_name>"
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments <epic_id> --full
```

### 2. Generate Update

Based on the focus description and any YouTrack context, generate a structured update.

### 3. Present Draft

Output the formatted update and ask: "Passt das so oder soll ich etwas anpassen?"

## Output Format

```markdown
**[Project Name] - Update**

**Informationen:**
- [Key update point 1]
- [Key update point 2]
- [Key update point 3]

**Nächste Schritte:**
- [Next step 1]
- [Next step 2]
```

### Optional Sections

Add only when relevant:

```markdown
**Blocker:**
- [Blocking issue requiring attention]

**Entscheidungsbedarf:**
- [Decision needed from stakeholder]
```

## Standard Sections

| Section | When to Include | Content |
|---------|-----------------|---------|
| **Informationen** | Always | What was done, progress, key facts |
| **Nächste Schritte** | Always | What's planned, upcoming milestones |
| **Blocker** | If blocked | Issues needing resolution |
| **Entscheidungsbedarf** | If decision needed | Choices requiring stakeholder input |

## Examples

### Basic Update

```bash
/draft-email "Customer Support Chatbot" "System Prompt v2 deployed mit Tester-Feedback"
```

Output:
```markdown
**Customer Support Chatbot - Update**

**Informationen:**
- System Prompt v2 erfolgreich deployed
- Tester-Feedback (60+ Testfragen) eingearbeitet
- Preisübersichten und Zahlungsarten im Prompt aktiviert

**Nächste Schritte:**
- Weiteres Testing durch Customer Support Team
- Knowledge Base Refresh bei Bedarf
```

### Update with Decision

```bash
/draft-email "Checkout Chatbot" "MVP fertig, Deployment-Entscheidung steht an"
```

Output:
```markdown
**Checkout Chatbot - Update**

**Informationen:**
- MVP-Version ist fertiggestellt
- System Prompt mit vollständigem Checkout-Flow
- Inaktivitäts-Trigger (60s) implementiert

**Nächste Schritte:**
- Deployment auf Staging-Umgebung
- User-Testing mit Paywall-Team

**Entscheidungsbedarf:**
- Deployment-Zeitpunkt: Diese Woche oder nach Feiertagen?
```

## Guidelines

- German language, semi-formal tone
- 2-4 bullet points per section
- Concise, actionable statements
- English tech terms acceptable (API, MVP, Deploy)
- Lead with most important information
- Keep each bullet to one line

## Sharing Options

After generating, the update can be:
- Copied into an email
- Posted in Teams/Slack
- Added to a status report
- Shared in a meeting
