---
name: Meetings Workflow
description: This skill should be used when the user asks to "prepare a meeting", "JF vorbereiten", "Jour Fixe", "prepare update", "meeting agenda", "Lenkungsausschuss vorbereiten", "stakeholder update", or needs help preparing for recurring meetings and update sessions.
version: 0.1.0
---

# Meetings Workflow

Prepare for recurring meetings like Jour Fixe (JF), stakeholder updates, and Lenkungsausschuss sessions by gathering context from Linear/YouTrack and generating structured agendas.

## Slash Commands

### `/prepare-jf <project>`
Prepare Jour Fixe meeting:
1. Gather Linear activity for project
2. Check YouTrack epic status
3. Generate agenda with talking points

### `/prepare-update <audience>`
Prepare update meeting:
- `stakeholder` - Business-focused, outcomes and timeline
- `team` - Technical details, blockers, dependencies
- `management` - High-level status, risks, decisions needed

## Jour Fixe (JF) Preparation

### What is a JF?
Regular project sync meeting (weekly/bi-weekly) to:
- Review progress since last meeting
- Discuss blockers and decisions
- Align on next steps

### JF Agenda Template

```markdown
# JF: [Projektname] - [Datum]

## Teilnehmer
- [Namen]

## Agenda

### 1. Status seit letztem JF (10 min)
**Erledigt:**
- [Aus Linear: completed items]

**In Arbeit:**
- [Aus Linear: in progress items]

### 2. Blocker & Risiken (10 min)
- [Blocker 1]
- [Risiko 1]

### 3. Entscheidungen (15 min)
- [ ] [Entscheidung 1 - Optionen A/B/C]
- [ ] [Entscheidung 2]

### 4. Nächste Schritte (10 min)
- [Wer]: [Was] bis [Wann]

### 5. Diverses (5 min)
- [Sonstige Themen]

---
**Nächster JF:** [Datum/Zeit]
```

### JF Preparation Workflow

```bash
# 1. Get Linear activity
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py tasks

# 2. Get YouTrack epic status
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "project: AI Type: Story \"<project>\""

# 3. Get recent comments for context
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments AI-XX
```

## Stakeholder Update Preparation

### Audience-Specific Focus

| Audience | Focus | Avoid |
|----------|-------|-------|
| **Stakeholder** | Outcomes, timeline, business impact | Technical details |
| **Team** | Technical progress, dependencies, blockers | Business justification |
| **Management** | Status, risks, decisions needed | Implementation details |

### Stakeholder Update Template

```markdown
# Update: [Projektname] - [Datum]

## Executive Summary
[1-2 Sätze: Wo stehen wir?]

## Fortschritt
| Meilenstein | Status | Zieldatum |
|-------------|--------|-----------|
| [M1] | ✅ Erledigt | [Datum] |
| [M2] | 🔄 In Arbeit | [Datum] |
| [M3] | ⏳ Geplant | [Datum] |

## Highlights
- [Wichtigster Erfolg]
- [Zweiter Erfolg]

## Risiken & Maßnahmen
| Risiko | Impact | Maßnahme |
|--------|--------|----------|
| [R1] | Hoch | [Maßnahme] |

## Entscheidungsbedarf
- [ ] [Entscheidung]: [Optionen]

## Nächste Schritte
- [Schritt 1] bis [Datum]
```

### Team Update Template

```markdown
# Team Sync: [Projektname] - [Datum]

## Seit letztem Sync
- [PR merged: Feature X]
- [Bug fixed: Issue Y]
- [Deployed: Component Z]

## Aktuell in Arbeit
| Wer | Was | Blocker |
|-----|-----|---------|
| [Name] | [Task] | [Blocker/Keiner] |

## Technische Entscheidungen
- **[Entscheidung]**: [Begründung]

## Dependencies
- Warten auf: [Team/Person] für [Was]
- Blockiert: [Was] weil [Grund]

## Code Review Requests
- [ ] PR #123: [Title] - Review by [Name]

## Action Items
- [ ] [Wer]: [Was]
```

## Lenkungsausschuss Preparation

High-level steering committee meeting - combine all project updates.

### Workflow

1. Use `/weekly-email` to compile KW updates
2. Add executive summary per project
3. Highlight cross-project dependencies
4. Prepare decision requests

### Template

```markdown
# Lenkungsausschuss - [Datum]

## Management Summary
[2-3 Sätze: Gesamtstatus aller Projekte]

## Projektstatus

### [Projekt 1]
**Status:** 🟢 On Track / 🟡 At Risk / 🔴 Blocked
[KW Update zusammenfassung]

### [Projekt 2]
**Status:** 🟢/🟡/🔴
[KW Update zusammenfassung]

## Übergreifende Themen
- [Thema 1]
- [Thema 2]

## Entscheidungen
1. [Entscheidung] - [Empfehlung]

## Ressourcen & Budget
| Projekt | Budget | Verbraucht | Prognose |
|---------|--------|------------|----------|
| [P1] | [X]€ | [Y]€ | 🟢 |
```

## Tips

- **Prepare day before**: Give yourself time to gather context
- **Keep agendas focused**: 3-5 topics max per JF
- **Time-box discussions**: Assign minutes per topic
- **Capture decisions**: Document decisions immediately
- **Follow up**: Send summary within 24h

## Reference Files

- **`references/meeting-types.md`** - Different meeting formats
- **`examples/jf-agenda-example.md`** - Real JF agenda example
