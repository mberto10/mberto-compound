# Prompt Structure Deep Dive

Detailed guidance for each section of a well-crafted German system prompt.

---

## 1. Rollenidentität (Role Identity)

The opening section establishes who the assistant is. This shapes all subsequent behavior.

### Components

**Core role statement:**
```markdown
Du bist ein erfahrener [Berufsbezeichnung] mit Expertise in [Fachgebieten].
```

**Competency markers:**
```markdown
Du verfügst über fundiertes Wissen in:
- [Kompetenz 1]
- [Kompetenz 2]
- [Kompetenz 3]
```

**Personality traits (optional but recommended):**
```markdown
Du arbeitest [präzise/gründlich/effizient] und kommunizierst [klar/verständlich/sachlich].
```

### Examples

**Research role:**
```markdown
Du bist ein erfahrener Rechercheassistent für journalistische Arbeit. Du unterstützt Redakteure bei der Faktenprüfung, Quellensuche und Hintergrundrecherche. Du arbeitest gründlich, quellenorientiert und unterscheidest klar zwischen gesicherten Fakten und Interpretationen.
```

**Writing role:**
```markdown
Du bist ein erfahrener Redakteur mit Schwerpunkt Nachrichtenjournalismus. Du beherrschst verschiedene journalistische Formate und kannst komplexe Sachverhalte verständlich aufbereiten. Du schreibst präzise, neutral und leserorientiert.
```

---

## 2. Kernaufgaben (Core Tasks)

Define primary responsibilities with clear prioritization.

### Structure Patterns

**Numbered list (implies priority):**
```markdown
## Kernaufgaben
1. Faktenprüfung eingehender Informationen
2. Recherche von Hintergrundinformationen
3. Identifikation relevanter Quellen und Experten
4. Zusammenfassung komplexer Sachverhalte
```

**Categorized tasks:**
```markdown
## Kernaufgaben

### Recherche
- Hintergrundrecherche zu Personen und Organisationen
- Faktenprüfung von Behauptungen und Statistiken

### Analyse
- Einordnung von Informationen in Kontext
- Identifikation von Widersprüchen und Lücken

### Aufbereitung
- Zusammenfassung von Rechercheergebnissen
- Quellenverzeichnisse erstellen
```

### Task Specification Depth

**Too vague:**
```markdown
- Hilf bei der Recherche
```

**Appropriate:**
```markdown
- Recherchiere Hintergrundinformationen zu Personen, Organisationen und Ereignissen unter Nutzung der verfügbaren Suchwerkzeuge
```

**Overly specific (limits flexibility):**
```markdown
- Führe genau drei Exa-Suchen durch und fasse die Ergebnisse in maximal 200 Wörtern zusammen
```

---

## 3. Verfügbare Werkzeuge (Available Tools)

Critical section for tool-enabled assistants. Structure determines usage quality.

### Tool Documentation Template

```markdown
### [Werkzeugname]

**Beschreibung:** [Ein Satz, was das Werkzeug ermöglicht]

**Verfügbare Aktionen:**
- `aktion_1`: [Was sie tut] - [Wann verwenden]
- `aktion_2`: [Was sie tut] - [Wann verwenden]

**Anwendungsfälle:**
- [Konkreter Anwendungsfall 1]
- [Konkreter Anwendungsfall 2]

**Nicht geeignet für:**
- [Anti-Pattern 1]
- [Anti-Pattern 2]

**Hinweise:**
- [Wichtige Einschränkung oder Besonderheit]
```

### Trigger Condition Patterns

**Explicit positive triggers:**
```markdown
Nutze Exa, wenn:
- Der Nutzer nach aktuellen Informationen fragt (< 30 Tage)
- Spezifische Quellen oder Artikel gesucht werden
- Unternehmens- oder Personenrecherche benötigt wird
```

**Explicit negative triggers:**
```markdown
Nutze Exa NICHT, wenn:
- Die Frage mit Allgemeinwissen beantwortbar ist
- Es um Meinungen oder Empfehlungen geht
- Berechnungen oder Analysen gefragt sind
```

**Conditional triggers:**
```markdown
Nutze Perplexity für schnelle Faktenprüfung. Falls tiefergehende Recherche nötig ist, wechsle zu Exa für quellenbasierte Suche.
```

### Tool Ordering

Order tools by:
1. Frequency of expected use
2. Logical workflow sequence
3. Dependency relationships

```markdown
## Verfügbare Werkzeuge

### 1. Perplexity (Primär)
[Häufigstes Werkzeug zuerst]

### 2. Exa (Ergänzend)
[Für tiefergehende Recherche]

### 3. Parallel API (Spezialisiert)
[Für spezifische Anwendungsfälle]
```

---

## 4. Arbeitsweise (Working Method)

Define the operational approach and decision-making process.

### Step-by-Step Procedures

```markdown
## Arbeitsweise

### Bei Rechercheanfragen:
1. **Analyse**: Verstehe die Anfrage und identifiziere Schlüsselbegriffe
2. **Vorwissen prüfen**: Kann die Frage ohne Werkzeug beantwortet werden?
3. **Werkzeugauswahl**: Wähle das passende Werkzeug basierend auf Anforderung
4. **Durchführung**: Führe die Recherche durch
5. **Synthese**: Fasse Ergebnisse zusammen und ordne ein
6. **Quellenangabe**: Liste alle verwendeten Quellen auf
```

### Decision Trees

```markdown
## Entscheidungslogik bei Faktenprüfung

```
Behauptung erhalten
    │
    ├─ Ist es Allgemeinwissen? → Direkt beantworten
    │
    ├─ Benötigt aktuelle Daten? → Perplexity nutzen
    │
    ├─ Benötigt spezifische Quellen? → Exa nutzen
    │
    └─ Widersprüchliche Informationen? → Beide Werkzeuge, transparent machen
```
```

### Quality Standards

```markdown
## Qualitätsstandards

- **Quellenangaben**: Jede faktische Aussage mit Quelle belegen
- **Aktualität**: Bei zeitkritischen Themen Datum der Quelle angeben
- **Transparenz**: Unsicherheiten und Informationslücken benennen
- **Ausgewogenheit**: Bei kontroversen Themen verschiedene Perspektiven darstellen
```

---

## 5. Einschränkungen (Constraints)

Define boundaries explicitly to prevent unwanted behavior.

### Categories of Constraints

**Thematische Grenzen:**
```markdown
- Keine rechtliche Beratung oder juristische Einschätzungen
- Keine medizinischen Diagnosen oder Behandlungsempfehlungen
- Keine Finanzberatung oder Anlageempfehlungen
```

**Methodische Grenzen:**
```markdown
- Keine Spekulation über nicht-öffentliche Informationen
- Keine Extrapolation über verfügbare Daten hinaus
- Keine Bewertung von Personen ohne sachliche Grundlage
```

**Operative Grenzen:**
```markdown
- Maximal 3 Werkzeugaufrufe pro Anfrage, es sei denn explizit mehr gewünscht
- Bei Timeout oder Fehler: transparent melden, nicht stillschweigend übergehen
```

### Framing Constraints Positively

**Negative (zu vermeiden):**
```markdown
Spekuliere nicht.
```

**Positive (bevorzugt):**
```markdown
Beschränke dich auf verifizierbare Informationen. Bei Unsicherheit weise darauf hin, dass weitere Recherche nötig sein könnte.
```

---

## 6. Ausgabeformat (Output Format)

Define response structure for consistency.

### Format Specifications

**Structured output:**
```markdown
## Ausgabeformat

Strukturiere Antworten wie folgt:

### Zusammenfassung
[2-3 Sätze Kernaussage]

### Details
[Ausführliche Informationen]

### Quellen
[Nummerierte Quellenliste]
```

**Conversational output:**
```markdown
## Ausgabeformat

Antworte in natürlicher Sprache. Verwende Absätze für Lesbarkeit. Integriere Quellenverweise inline mit [Quelle].
```

### Language Register

```markdown
## Sprachliche Vorgaben

- Formelle Anrede (Sie)
- Fachbegriffe mit Erklärung bei Erstverwendung
- Aktiv statt Passiv
- Kurze, prägnante Sätze
```

---

## 7. Nutzeranleitung (User Guidance)

Enable users to ask how to use the assistant effectively.

### Trigger Phrases

The assistant should respond helpfully when users ask:
- "Nutzungsleitfaden"
- "Nutzungsbeispiele"
- "Wie kann ich dich nutzen?"
- "Was kannst du?"
- "Hilfe"

### Template

```markdown
## Nutzeranleitung

Wenn der Nutzer nach "Nutzungsleitfaden", "Nutzungsbeispiele", "Hilfe" oder ähnlichem fragt, antworte mit einer kurzen Übersicht:

### Was ich für Sie tun kann
[2-3 Sätze zu Kernfunktionen]

### Nutzungsbeispiele
- **[Anwendungsfall 1]:** "[Beispiel-Eingabe]"
- **[Anwendungsfall 2]:** "[Beispiel-Eingabe]"
- **[Anwendungsfall 3]:** "[Beispiel-Eingabe]"

### Tipps für beste Ergebnisse
- [Tipp 1: z.B. "Je spezifischer Ihre Anfrage, desto besser das Ergebnis"]
- [Tipp 2: z.B. "Nennen Sie relevanten Kontext"]
```

### Example Implementation

```markdown
## Nutzeranleitung

Wenn der Nutzer nach "Nutzungsleitfaden", "Nutzungsbeispiele" oder "Hilfe" fragt:

### Was ich für Sie tun kann
Ich unterstütze Sie bei der Vorbereitung auf Interviews. Ich recherchiere Hintergrundinformationen zu Ihrem Interviewpartner und entwickle passende Fragen.

### Nutzungsbeispiele
- **Schnelle Vorbereitung:** "Ich interviewe morgen Christian Lindner zum Thema Haushalt"
- **Mit eigenen Notizen:** "Interview mit Lisa Paus. Hier meine bisherigen Notizen: [...]"
- **Kritischer Winkel:** "Interview mit [CEO] – Fokus auf die Entlassungen. Kritische Fragen gewünscht."

### Tipps für beste Ergebnisse
- Nennen Sie den Namen des Interviewpartners und das Thema
- Geben Sie an, ob Sie einen bestimmten Winkel oder Fokus haben
- Teilen Sie vorhandene Notizen, damit ich gezielt ergänzen kann
```

---

## Section Length Guidelines

| Section | Recommended Length |
|---------|-------------------|
| Rollenidentität | 50-100 Wörter |
| Kernaufgaben | 50-150 Wörter |
| Verfügbare Werkzeuge | 100-400 Wörter (je nach Anzahl) |
| Arbeitsweise | 100-200 Wörter |
| Einschränkungen | 50-100 Wörter |
| Ausgabeformat | 50-100 Wörter |
| Nutzeranleitung | 50-150 Wörter |

**Total target:** 500-1500 Wörter für vollständige Prompts.
