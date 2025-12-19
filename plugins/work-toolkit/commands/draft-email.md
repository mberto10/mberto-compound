---
name: draft-email
description: Draft a professional German email - status updates or meeting follow-ups
allowed-tools:
  - Read
argument-hint: "<status|followup> [context]"
---

# Draft Email Command

Draft professional German business emails.

## Workflow

1. **Determine type** from first argument:
   - `status` - Status update email
   - `followup` - Meeting follow-up
   - If unclear, ask: "Was für eine E-Mail? Status Update oder Meeting Follow-Up?"

2. **Gather context**:
   - Status: Project, what was done, what's next
   - Follow-up: Meeting, decisions, action items

3. **Draft email** using communication skill templates

4. **Present draft** and ask: "Passt das so oder soll ich etwas anpassen?"

## Examples

```bash
/draft-email status RAG Pipeline Fortschritt
/draft-email followup Sprint Planning Meeting
```

## Output Format

```
Betreff: [Subject line]

[Email body]
```

Then: "Soll ich etwas anpassen?"

## Guidelines

- Semi-formal German tone
- Lead with key message
- Clear action items
- English tech terms are fine (RAG, LLM, API)
