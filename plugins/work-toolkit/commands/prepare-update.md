---
name: prepare-update
description: Generate a complete project overview with milestones, status, and next steps
allowed-tools:
  - Bash
  - Read
  - mcp__linear-server__get_document
  - mcp__linear-server__list_documents
  - mcp__linear-server__list_projects
argument-hint: "<project_name>"
---

# Prepare Update Command

Generate a comprehensive project overview pulling together all relevant information from YouTrack.

## Arguments

- `<project_name>`: Name of the project to summarize

## Workflow

### 0. Consult Knowledge

1. Read the "Work Patterns & Communication" doc from Management project: use `mcp__linear-server__list_documents` with `projectId: "78be1839-6b2f-4310-a8d2-209f8fed436a"`, find doc by title, read with `mcp__linear-server__get_document`. Apply reporting and communication rules found there.
2. If a project is specified: use `mcp__linear-server__list_projects` to find the project, then `mcp__linear-server__list_documents` on that project to find "Updates & Learnings". If it exists, read it and apply project-specific context.
3. Do not mention this lookup to the user.

### 1. Find the Epic

```bash
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py find-epic "<project_name>"
```

### 2. Gather All Project Data

```bash
# Get full epic details (description with milestones)
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py get <epic_id>

# Get all KW comments for history
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments <epic_id> --full

# Get open Aufgaben
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "parent: <epic_id> State: -Done"

# Get completed Aufgaben (recent)
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "parent: <epic_id> State: Done"
```

### 3. Generate Project Overview

Compile all information into the standard format below.

## Output Format

```markdown
# Projektübersicht: [Project Name]

**Stand:** [Datum]
**Epic:** [AI-XXX]
**Bearbeiter:** [Name]
**Support:** [Names or "-"]

---

## Projektziel

[1-2 sentences describing what success looks like - from epic description]

---

## Meilensteine

| Meilenstein | Ziel-KW | Status | Bemerkung |
|-------------|---------|--------|-----------|
| [M1] | KW XX | ✅ | [Optional note] |
| [M2] | KW XX | 🔄 | In Arbeit |
| [M3] | KW XX | ⏳ | Geplant |
| [M4] | KW XX | ⏳ | - |

**Fortschritt:** [X] von [Y] Meilensteinen erreicht

---

## Aktueller Status (KW XX)

[Summary from latest KW comment]

**Updates:**
- [Recent accomplishment 1]
- [Recent accomplishment 2]
- [Recent accomplishment 3]

---

## Blocker

| Blocker | Seit | Impact | Lösungsansatz |
|---------|------|--------|---------------|
| [Blocker description] | KW XX | [Hoch/Mittel/Niedrig] | [What's being done] |

*Keine Blocker* - if none

---

## Offene Aufgaben

| ID | Aufgabe | Bearbeiter | Status |
|----|---------|------------|--------|
| AI-XXX | [Task title] | [Name] | Open |
| AI-XXX | [Task title] | [Name] | In Arbeit |

**Gesamt:** [X] offene Aufgaben

---

## Nächste Schritte

1. [Next step with target KW]
2. [Next step with target KW]
3. [Next step with target KW]

---

## Historie (letzte 4 Wochen)

| KW | Highlights |
|----|------------|
| KW XX | [Key accomplishment] |
| KW XX | [Key accomplishment] |
| KW XX | [Key accomplishment] |
| KW XX | [Key accomplishment] |
```

## Section Details

### Projektziel
- Extracted from epic description
- 1-2 sentences max
- Focus on outcome, not activities

### Meilensteine
- From epic description milestone table
- Status icons: ✅ Done, 🔄 In Progress, ⏳ Planned, ❌ Blocked
- Include any date changes or delays in Bemerkung

### Aktueller Status
- From most recent KW comment
- Summarize key updates
- Current week's focus

### Blocker
- From KW comments (Blocker section)
- Add context: how long blocked, what's being done
- If no blockers, explicitly state "Keine Blocker"

### Offene Aufgaben
- Child tickets not in Done state
- Show who's working on what
- Sorted by priority/status

### Nächste Schritte
- From latest KW comment + upcoming milestones
- Concrete, actionable items
- Include target timeline

### Historie
- Last 4 KW comments summarized
- Shows trajectory and progress pattern

## Example

```bash
/prepare-update "Customer Support Chatbot"
```

Output:
```markdown
# Projektübersicht: Customer Support Chatbot

**Stand:** 06.01.2026
**Epic:** AI-301
**Bearbeiter:** Maximilian Bruhn
**Support:** -

---

## Projektziel

Chatbot für Customer Support entwickeln, der häufige Kundenanfragen zu Abos und Zahlungen selbstständig beantwortet.

---

## Meilensteine

| Meilenstein | Ziel-KW | Status | Bemerkung |
|-------------|---------|--------|-----------|
| Anforderungen & Konzept | KW 32 | ✅ | - |
| MVP mit Hilfeseiten-Suche | KW 35 | ✅ | - |
| Testing mit Customer Care | KW 38 | ✅ | - |
| Feedback-Iteration | KW 42 | ✅ | Verzögert auf KW 50 |
| Produktiv-Deployment | KW 02 | 🔄 | In Vorbereitung |

**Fortschritt:** 4 von 5 Meilensteinen erreicht

---

## Aktueller Status (KW 50)

System Prompt v2 ist deployed und wird aktiv getestet.

**Updates:**
- Tester-Feedback (60+ Testfragen, 16 Szenarien) integriert
- Preisübersichten und Zahlungsarten im Prompt aktiviert
- Kontakt-URLs korrigiert (hilfe.faz.net)

---

## Blocker

*Keine Blocker*

---

## Offene Aufgaben

| ID | Aufgabe | Bearbeiter | Status |
|----|---------|------------|--------|
| AI-312 | Knowledge Base Refresh | Max | Open |
| AI-313 | Production Deployment | Max | Open |

**Gesamt:** 2 offene Aufgaben

---

## Nächste Schritte

1. Weiteres Testing durch Customer Support (KW 01)
2. Knowledge Base Refresh falls nötig (KW 01)
3. Production Deployment vorbereiten (KW 02)

---

## Historie (letzte 4 Wochen)

| KW | Highlights |
|----|------------|
| KW 50 | System Prompt v2 deployed, 60+ Testfragen verarbeitet |
| KW 48 | Neue Vorgaben erhalten, Implementierung gestartet |
| KW 46 | Entscheidung: zwei separate Bots (Customer Care + Paywall) |
| KW 44 | Warten auf Setup-Abstimmung zwischen Teams |
```

## Use Cases

- **Stakeholder Meeting**: Share complete project context
- **Handover**: Brief someone new on the project
- **Status Review**: Comprehensive self-check
- **Documentation**: Archive project state at a point in time

## Reference

See `skills/youtrack-dashboard/references/youtrack-documentation-guide.md` for:
- Epic description template
- KW comment format
- Aufgaben structure
