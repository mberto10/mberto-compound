---
name: prepare-jf
description: Prepare Jour Fixe meeting - gather Linear/YouTrack context and generate agenda
allowed-tools:
  - Bash
  - Read
argument-hint: "<project_name>"
---

# Prepare JF Command

Prepare a Jour Fixe (JF) meeting by gathering context from Linear and YouTrack, then generating a structured agenda.

## Workflow

### 1. Identify Project Context

From the project name argument, find:
- Linear project/label for task filtering
- YouTrack epic for status

### 2. Gather Data

```bash
# Get Linear tasks for project
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/linear/linear.py tasks

# Search YouTrack for project epic
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py search "project: AI Type: Story \"<project_name>\""

# Get recent comments from epic
python ${CLAUDE_PLUGIN_ROOT}/helper_tools/youtrack/yt.py comments AI-XX
```

### 3. Categorize Tasks

From Linear data:
- **Erledigt**: Completed since last JF (typically 1 week)
- **In Arbeit**: Currently in progress
- **Geplant**: Upcoming tasks

### 4. Identify Blockers

Look for:
- Tasks marked as blocked
- Stale in-progress items (>1 week)
- Dependencies on external teams

### 5. Generate Agenda

Output in German using this structure:

```markdown
# JF: [Projektname] - [Datum]

## Teilnehmer
- [Teilnehmer eintragen]

---

## 1. Status seit letztem JF (10 min)

**Erledigt:**
- ✅ [Task 1]
- ✅ [Task 2]

**In Arbeit:**
- 🔄 [Task 3] - [Owner] - [Status/ETA]
- 🔄 [Task 4]

**Metriken:** (falls verfügbar)
| Metrik | Wert |
|--------|------|
| [M1] | [V1] |

## 2. Blocker & Risiken (10 min)

**Blocker:**
- ⚠️ [Blocker]: [Impact] - [Maßnahme]

**Risiken:**
- 🟡 [Risiko]: [Einschätzung]

## 3. Entscheidungen (15 min)

- [ ] [Entscheidung 1]
  - Option A: [...]
  - Option B: [...]
  - Empfehlung: [...]

## 4. Nächste Schritte (10 min)

| Wer | Was | Bis |
|-----|-----|-----|
| [Name] | [Task] | [Datum] |

## 5. Diverses (5 min)

- [Sonstige Themen]

---

**Nächster JF:** [Datum/Zeit]
```

### 6. Ask for Refinement

After generating:
- "Soll ich Themen ergänzen oder anpassen?"
- "Gibt es spezifische Entscheidungen die auf die Agenda sollen?"

## Arguments

- `<project_name>`: Name of the project (matches Linear project/YouTrack epic)

## Example

```
/prepare-jf "RAG Pipeline"
/prepare-jf "Customer Support Chatbot"
```

## Tips

- Run day before JF for time to refine
- Add specific decisions you know are needed
- Include metrics if available
- Keep agenda focused (3-5 main topics)
