# Tool Description Patterns

Patterns for documenting different types of tools in German system prompts.

---

## Core Principles

### 1. User Benefit First

Describe what the tool enables, not technical implementation:

**Technical (avoid):**
```markdown
Exa ist eine semantische Such-API mit neuronaler Indexierung.
```

**User-focused (preferred):**
```markdown
Exa ermöglicht die Suche nach aktuellen Artikeln, Unternehmensinformationen und Expertenprofilen mit hoher Relevanz.
```

### 2. Action-Oriented Descriptions

Each action should answer: What does it do? When to use it?

```markdown
- `search`: Durchsucht aktuelle Webinhalte nach relevanten Artikeln und Quellen. Nutzen für spezifische Themenrecherche.
- `find_similar`: Findet ähnliche Inhalte zu einer gegebenen URL. Nutzen für erweiterte Quellenrecherche.
```

### 3. Explicit Trigger Conditions

State when to use AND when not to use:

```markdown
**Anwendung:**
- Aktuelle Nachrichtenartikel (< 30 Tage)
- Unternehmens- und Personenrecherche
- Quellensuche zu spezifischen Themen

**Nicht geeignet für:**
- Allgemeinwissen-Fragen
- Berechnungen oder Datenanalyse
- Meinungsfragen
```

---

## Patterns by Tool Type

### Search/Research Tools

Template:
```markdown
### [Werkzeugname]

**Beschreibung:** Ermöglicht [Art der Suche] mit Fokus auf [Stärke].

**Verfügbare Aktionen:**
- `search`: [Beschreibung] - Nutzen für [Anwendungsfall]
- `deep_search`: [Beschreibung] - Nutzen für [Anwendungsfall]

**Anwendung:**
Nutze dieses Werkzeug, wenn:
- [Bedingung 1]
- [Bedingung 2]
- [Bedingung 3]

**Nicht verwenden für:**
- [Anti-Pattern 1]
- [Anti-Pattern 2]

**Hinweise:**
- [Wichtige Einschränkung]
- [Best Practice]
```

Example (Exa):
```markdown
### Exa

**Beschreibung:** Ermöglicht semantische Websuche mit Fokus auf aktuelle Nachrichtenartikel, Unternehmensprofile und Fachpublikationen.

**Verfügbare Aktionen:**
- `search`: Sucht relevante Webinhalte basierend auf Suchbegriff - Nutzen für gezielte Themenrecherche
- `find_similar`: Findet ähnliche Inhalte zu einer URL - Nutzen für erweiterte Quellensuche
- `get_contents`: Ruft vollständigen Inhalt einer Seite ab - Nutzen für Detailanalyse

**Anwendung:**
Nutze Exa, wenn:
- Aktuelle Nachrichtenartikel benötigt werden (< 30 Tage alt)
- Unternehmens- oder Personenrecherche gefragt ist
- Spezifische Fachquellen gesucht werden
- Tiefergehende Quellenrecherche über Perplexity hinaus nötig ist

**Nicht verwenden für:**
- Allgemeinwissen, das ohne Recherche beantwortbar ist
- Meinungsfragen oder subjektive Einschätzungen
- Historische Fakten ohne Aktualitätsbezug

**Hinweise:**
- Bevorzuge spezifische Suchbegriffe über generische
- Kombiniere mit Perplexity für Faktenprüfung + Quellenvertiefung
```

Example (Perplexity):
```markdown
### Perplexity

**Beschreibung:** Ermöglicht schnelle Faktenprüfung und aktuelle Informationsrecherche mit automatischer Quellensynthese.

**Verfügbare Aktionen:**
- `search`: Recherchiert und synthetisiert Informationen aus mehreren Quellen - Nutzen für schnelle Faktenprüfung

**Anwendung:**
Nutze Perplexity, wenn:
- Schnelle Faktenprüfung einer Behauptung benötigt wird
- Aktuelle Informationen zu einem Thema gesucht werden
- Ein Überblick über ein Thema gebraucht wird

**Nicht verwenden für:**
- Suche nach spezifischen Dokumenten oder PDFs
- Tiefergehende Quellenrecherche (→ Exa verwenden)
- Bildersuche oder Multimedia

**Hinweise:**
- Ideal als erster Schritt vor tiefergehender Recherche
- Liefert synthetisierte Antworten, nicht Rohdaten
```

### Data/API Tools

Template:
```markdown
### [Werkzeugname]

**Beschreibung:** Ermöglicht Zugriff auf [Datentyp] von [Quelle].

**Verfügbare Aktionen:**
- `get_[entity]`: Ruft [Daten] ab - Parameter: [param1], [param2]
- `list_[entities]`: Listet [Daten] auf - Parameter: [param1]
- `create_[entity]`: Erstellt [Daten] - Parameter: [erforderliche Felder]

**Anwendung:**
Nutze dieses Werkzeug, wenn:
- [Bedingung für Datenabruf]
- [Bedingung für Datenmanipulation]

**Rückgabeformat:**
[Beschreibung des erwarteten Datenformats]
```

### Document Processing Tools

Template:
```markdown
### [Werkzeugname]

**Beschreibung:** Ermöglicht [Verarbeitungsart] von [Dokumenttypen].

**Verfügbare Aktionen:**
- `upload`: Lädt Dokument hoch - Akzeptiert: [Dateitypen]
- `extract`: Extrahiert [Inhaltstyp] - Rückgabe: [Format]
- `summarize`: Fasst Dokument zusammen - Optionen: [Optionen]

**Einschränkungen:**
- Maximale Dateigröße: [Größe]
- Unterstützte Formate: [Formate]

**Anwendung:**
Nutze dieses Werkzeug, wenn:
- [Dokumentverarbeitungs-Szenario]
```

---

## Multi-Tool Orchestration

When multiple tools are available, define the selection logic:

### Sequential Pattern

```markdown
## Werkzeugnutzung bei Rechercheanfragen

**Reihenfolge:**
1. **Perplexity** für schnellen Überblick und Faktenprüfung
2. **Exa** für tiefergehende Quellenrecherche bei Bedarf
3. **Parallel API** für spezialisierte Suchen (z.B. akademische Quellen)

**Entscheidungslogik:**
- Einfache Faktenfrage → Nur Perplexity
- Quellensuche erforderlich → Perplexity + Exa
- Spezialisierte Recherche → Alle drei Werkzeuge
```

### Parallel Pattern

```markdown
## Werkzeugnutzung bei umfassender Recherche

Bei komplexen Rechercheanfragen können mehrere Werkzeuge parallel genutzt werden:

- **Perplexity**: Aktuelle Fakten und Kontextinformation
- **Exa**: Nachrichtenartikel und Unternehmensprofile
- **Parallel API**: Akademische und wissenschaftliche Quellen

Synthese: Kombiniere Ergebnisse und kennzeichne Quellen nach Werkzeug.
```

### Conditional Pattern

```markdown
## Werkzeugauswahl nach Anfragetyp

| Anfragetyp | Primäres Werkzeug | Ergänzend |
|------------|-------------------|-----------|
| Schnelle Faktenprüfung | Perplexity | - |
| Aktuelle Nachrichten | Exa | Perplexity |
| Hintergrundrecherche | Perplexity + Exa | Parallel API |
| Quellensuche | Exa | - |
| Personenrecherche | Exa | Perplexity |
```

---

## Action Naming Conventions

Use consistent German terminology for action descriptions:

| English Action | German Description |
|---------------|-------------------|
| search | Durchsucht, Recherchiert |
| get | Ruft ab, Ermittelt |
| list | Listet auf, Zeigt an |
| create | Erstellt, Legt an |
| update | Aktualisiert, Ändert |
| delete | Löscht, Entfernt |
| upload | Lädt hoch |
| download | Lädt herunter |
| extract | Extrahiert, Gewinnt |
| summarize | Fasst zusammen |
| analyze | Analysiert, Wertet aus |
| validate | Prüft, Validiert |

---

## Common Mistakes

### Mistake 1: Missing Negative Guidance

**Incomplete:**
```markdown
Nutze Exa für Nachrichtenrecherche.
```

**Complete:**
```markdown
Nutze Exa für Nachrichtenrecherche.
Nutze Exa NICHT für Allgemeinwissen-Fragen oder Berechnungen.
```

### Mistake 2: Vague Action Descriptions

**Vague:**
```markdown
- `search`: Sucht nach Informationen
```

**Specific:**
```markdown
- `search`: Durchsucht aktuelle Webinhalte nach Artikeln und Quellen zum angegebenen Thema. Rückgabe: Titel, URL, Snippet, Datum.
```

### Mistake 3: No Usage Conditions

**Missing conditions:**
```markdown
### Perplexity
Perplexity ist ein Recherchetool.
```

**With conditions:**
```markdown
### Perplexity
**Anwendung:** Nutze Perplexity als erstes Werkzeug für schnelle Faktenprüfung. Bei tiefergehenden Rechercheanforderungen wechsle zu Exa.
```

### Mistake 4: Technical Jargon

**Technical:**
```markdown
Exa nutzt neuronale Embeddings für semantische Ähnlichkeitssuche mit Cosine-Similarity.
```

**User-focused:**
```markdown
Exa findet relevante Artikel auch wenn die Suchbegriffe nicht exakt im Text vorkommen.
```
