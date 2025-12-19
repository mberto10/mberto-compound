---
name: prepare-update
description: Prepare update meeting for different audiences (stakeholder, team, management)
allowed-tools:
  - Bash
  - Read
argument-hint: "<stakeholder|team|management> [project]"
---

# Prepare Update Command

Prepare an update meeting tailored to a specific audience.

## Audiences

| Audience | Focus | Format |
|----------|-------|--------|
| `stakeholder` | Business outcomes, timeline, impact | High-level, visual |
| `team` | Technical progress, blockers, PRs | Detailed, action-oriented |
| `management` | Status, risks, decisions | Executive summary |

## Workflow

### 1. Determine Audience & Project

From arguments:
- First arg: audience type
- Second arg (optional): specific project

### 2. Gather Context

```bash
# Get Linear tasks
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py tasks

# Get YouTrack status (if project specified)
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "project: AI \"<project>\""
```

### 3. Generate Audience-Specific Update

## Stakeholder Update Template

```markdown
# Update: [Projekt] - [Datum]

## Executive Summary
[1-2 Sätze: Status und wichtigste Nachricht]

## Fortschritt

```
[=========>        ] 65% Complete
```

| Meilenstein | Status | Datum |
|-------------|--------|-------|
| [M1] | ✅ Erledigt | [D1] |
| [M2] | 🔄 In Arbeit | [D2] |
| [M3] | ⏳ Geplant | [D3] |

## Highlights
- 🎉 [Wichtigster Erfolg]
- 📈 [Verbesserung/Metrik]

## Risiken
| Risiko | Status | Maßnahme |
|--------|--------|----------|
| [R1] | 🟡 | [M1] |

## Nächste Schritte
1. [Schritt] - [Datum]
2. [Schritt] - [Datum]

## Entscheidungsbedarf
- [ ] [Entscheidung benötigt]
```

## Team Update Template

```markdown
# Team Sync: [Projekt] - [Datum]

## Seit letztem Sync

**Merged:**
- PR #123: [Title]
- PR #124: [Title]

**Deployed:**
- [Component] to [Environment]

## Aktueller Stand

| Task | Owner | Status | Blocker |
|------|-------|--------|---------|
| [T1] | [Name] | 🔄 80% | - |
| [T2] | [Name] | 🔄 50% | Waiting on API |

## Technische Updates
- **Entscheidung**: [Was] - [Warum]
- **Learnings**: [Was gelernt]

## Dependencies
- ⏳ Warten auf: [Team] für [Was]
- 🔗 Blockiert: [Was] durch [Grund]

## Review Requests
- [ ] PR #125: [Title] - @reviewer
- [ ] PR #126: [Title] - @reviewer

## Action Items
- [ ] [Wer]: [Was] bis [Wann]
```

## Management Update Template

```markdown
# Status Report: [Projekt] - [Datum]

## TL;DR
**Status:** 🟢 On Track / 🟡 At Risk / 🔴 Blocked
[Eine Zeile Zusammenfassung]

## Kennzahlen
| KPI | Aktuell | Ziel | Trend |
|-----|---------|------|-------|
| [KPI1] | [V] | [Z] | ↗️ |
| [KPI2] | [V] | [Z] | → |

## Meilensteine
- ✅ [Erledigt]: [Meilenstein]
- 🔄 [Diese Woche]: [Meilenstein]
- ⏳ [Nächste Woche]: [Meilenstein]

## Risiken & Eskalationen
| # | Risiko | Impact | Wahrscheinlichkeit | Maßnahme |
|---|--------|--------|-------------------|----------|
| 1 | [R1] | Hoch | Mittel | [M1] |

## Budget/Ressourcen
| Bereich | Plan | Ist | Prognose |
|---------|------|-----|----------|
| Budget | [X]€ | [Y]€ | 🟢 |
| Team | [X] FTE | [Y] FTE | 🟢 |

## Entscheidungen benötigt
1. **[Entscheidung]**: [Kontext]
   - Empfehlung: [Option]
   - Deadline: [Datum]

## Nächste Berichtsperiode
- [Geplante Aktivitäten]
```

## Arguments

```
/prepare-update stakeholder
/prepare-update team "RAG Pipeline"
/prepare-update management
```

## Tips

- **Stakeholder**: Focus on "so what?" - why does this matter to them
- **Team**: Be specific, include PR numbers and technical details
- **Management**: Lead with status, be clear about asks
