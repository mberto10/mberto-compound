---
name: German Business Communication
description: This skill should be used when the user asks to "write an email", "draft a message", "status update email", "meeting follow-up", "formulate in german", "wie formuliere ich", or needs help with German business communication including emails, status updates, and meeting notes.
version: 0.1.0
---

# German Business Communication

Draft professional German business emails focusing on status updates and meeting follow-ups for a Gen AI team context.

## Slash Commands

### `/draft-email <type> [context]`
Draft an email:
- `status` - Project status update
- `followup` - Meeting follow-up

Example: `/draft-email status RAG Pipeline Progress`

## Tone & Style

### Semi-Formal German Business

- **Professional but not stiff**: "Hallo" over "Sehr geehrte Damen und Herren"
- **Direct and clear**: Germans appreciate clarity
- **Structured**: Use headers for complex updates
- **Action-oriented**: End with clear next steps

### Tech/Startup Context

- English technical terms are fine (RAG, LLM, API, POC)
- Mix German structure with English vocabulary
- Example: "Das RAG-Pipeline Deployment ist abgeschlossen"

## Status Update Templates

### Project Status (Formal)

```
Betreff: Status Update: [Projektname] - KW [XX]

Hallo zusammen,

hier ein kurzes Update zum aktuellen Stand von [Projektname]:

**Erledigt diese Woche:**
- [Aufgabe 1]
- [Aufgabe 2]

**In Arbeit:**
- [Aufgabe 3] - voraussichtlich fertig bis [Datum]

**Blocker/Risiken:**
- [Falls vorhanden, sonst weglassen]

**Nächste Schritte:**
- [Was als nächstes kommt]

Bei Fragen meldet euch gerne.

Beste Grüße
[Name]
```

### Quick Status (Informal)

```
Betreff: Quick Update: [Thema]

Hi [Name],

kurzes Update: [1-2 Sätze zum Stand]

Nächster Schritt meinerseits: [Aktion]

Melde mich wieder wenn [Meilenstein].

VG
[Name]
```

## Meeting Follow-Up Templates

### Standard Follow-Up

```
Betreff: Follow-Up: [Meeting-Titel] vom [Datum]

Hallo zusammen,

danke für das produktive Meeting heute. Hier die wichtigsten Punkte:

**Besprochene Themen:**
- [Thema 1]
- [Thema 2]

**Entscheidungen:**
- [Entscheidung 1]
- [Entscheidung 2]

**Action Items:**
- [ ] [Person]: [Aufgabe] bis [Datum]
- [ ] [Person]: [Aufgabe] bis [Datum]

**Nächstes Meeting:** [Datum/Zeit falls vereinbart]

Falls ich etwas vergessen habe, gebt gerne Bescheid.

Beste Grüße
[Name]
```

### Brief Follow-Up

```
Betreff: Kurzes Follow-Up: [Meeting]

Hi [Name],

danke für den Austausch eben.

Wie besprochen kümmere ich mich um [Aufgabe] und melde mich bis [Zeitpunkt].

VG
[Name]
```

## Useful Phrases

### Openings
| Phrase | Context |
|--------|---------|
| `Hallo zusammen,` | Team email |
| `Hi [Name],` | Direct, informal |
| `Hallo [Name],` | Standard professional |

### Transitions
| Phrase | Meaning |
|--------|---------|
| `Kurz zum Hintergrund:` | Brief context |
| `Wie besprochen:` | As discussed |
| `Zum aktuellen Stand:` | Current status |
| `Ein kurzes Update:` | Quick update |

### Closings
| Phrase | Context |
|--------|---------|
| `Beste Grüße` | Standard professional |
| `VG` / `Viele Grüße` | Semi-formal |
| `Bei Fragen meldet euch gerne.` | Open for questions |
| `Melde mich wieder wenn...` | Promise to follow up |

### Requests
| Phrase | Meaning |
|--------|---------|
| `Könntest du bitte...` | Could you please... |
| `Wäre es möglich, dass...` | Would it be possible... |
| `Bitte gebt mir Bescheid, wenn...` | Please let me know if... |

## Audience Guidelines

### To Stakeholders/Management
- Lead with outcomes and impact
- Business language, less technical detail
- Clear timeline and next steps
- Proactive about risks

### To Technical Team
- More technical detail is fine
- Direct and concise
- Focus on blockers and dependencies
- Link to documentation

### Cross-Functional
- Balance technical and business context
- Explain implications, not just facts
- Be explicit about what you need

## Reference Files

- **`references/email-patterns.md`** - Additional email templates
- **`examples/status-update-example.md`** - Real-world example
