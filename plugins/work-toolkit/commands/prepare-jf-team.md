---
name: prepare-jf-team
description: Prepare JF agenda for all projects owned by a team member
allowed-tools:
  - Bash
  - Read
  - mcp__linear-server__get_document
  - mcp__linear-server__list_documents
  - mcp__linear-server__list_projects
argument-hint: "<team_member_name>"
---

# Prepare JF Team Command

Prepare Jour Fixe agenda for all active projects where a specific team member is Bearbeiter.

## Arguments

- `<team_member_name>`: Name (or partial name) of the team member to filter by

## Workflow

### 0. Consult Knowledge

1. Read the "Work Patterns & Communication" doc from Management project: use `mcp__linear-server__list_documents` with `projectId: "78be1839-6b2f-4310-a8d2-209f8fed436a"`, find doc by title, read with `mcp__linear-server__get_document`. Apply meeting preparation rules found there.
2. For each project in the JF agenda: use `mcp__linear-server__list_projects` to find the project, then `mcp__linear-server__list_documents` on that project to find "Updates & Learnings". If it exists, read it and apply project-specific context.
3. Do not mention this lookup to the user.

### 1. Fetch Team Member's Epics

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py team-epics "<team_member_name>"
```

This returns all active epics (State: Projektticket) where the team member is Bearbeiter, including:
- Epic ID and summary
- Description preview (milestones, goals)
- Latest KW comment preview
- Support team members

### 2. For Each Epic, Fetch Details

For epics that need deeper context:

```bash
# Get full description
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py get <epic_id>

# Get full latest KW comment
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments <epic_id> --full

# Get open Aufgaben
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "parent: <epic_id> State: -Done"
```

### 3. Generate JF Agenda

For each project, create an agenda section following this structure:

```markdown
# JF Vorbereitung: [Team Member] - [Datum]

---

## [Project 1 Name] (AI-XXX)

**Bearbeiter:** [Name]
**Support:** [Names or "Keine"]

### Meilensteine
| Meilenstein | Ziel-KW | Status |
|-------------|---------|--------|
| [From description] | KW XX | ✅/🔄/⏳ |

### Aktueller Status (KW XX)
[Summary from latest KW comment]

### Offene Aufgaben
- AI-XXX: [Task] - [Status]
- AI-XXX: [Task] - [Status]

### Blocker
- [From KW comment]

### Diskussionspunkte
- [ ] [Suggested based on blockers/stale milestones]

---

## [Project 2 Name] (AI-XXX)
...
```

### 4. Identify Priority Items

Flag projects that need attention:

| Condition | Flag |
|-----------|------|
| Blocker present | 🔴 **Blocker besprechen** |
| No KW update in 2+ weeks | 🟡 **Status-Check erforderlich** |
| Milestone overdue | 🟠 **Meilenstein überfällig** |
| Many open Aufgaben | 📋 **Aufgaben priorisieren** |

### 5. Present Agenda

Output the complete JF preparation document in German.

## Example

```bash
/prepare-jf-team "Maximilian"
```

Output:
```markdown
# JF Vorbereitung: Maximilian Bruhn - 06.01.2026

## Übersicht

| Projekt | Status | Priorität |
|---------|--------|-----------|
| Customer Support Chatbot | 🟢 On Track | - |
| Checkout Chatbot | 🟢 On Track | - |
| Web Research Agents | 🟢 On Track | - |

---

## Customer Support Chatbot (AI-301)

**Bearbeiter:** Maximilian Bruhn

### Aktueller Status (KW50)
- Tester-Feedback integriert
- System Prompt v2 deployed
- 60+ Testfragen verarbeitet

### Blocker
Keine

### Nächste Schritte
- Weiteres Testing durch Customer Support
- Knowledge Base Refresh bei Bedarf

---
...
```

## Output Format

- German language throughout
- Markdown formatted for easy reading/sharing
- Priority flags for items needing discussion
- Action items clearly marked with checkboxes

## Reference

See `skills/youtrack-dashboard/references/youtrack-documentation-guide.md` for:
- Epic structure
- KW comment format
- JF preparation guidelines
