# German Style Guide for System Prompts

Conventions for writing clear, professional German system prompts.

---

## Language Register

### Formal "Sie" (Standard)

Use formal register unless specifically requested otherwise:

```markdown
Du hilfst dem Nutzer bei [Aufgabe]. Wenn Sie Fragen haben, können Sie diese jederzeit stellen.
```

**Note:** The assistant itself is addressed with "Du", but references to the user use "Sie":

```markdown
✓ Du bist ein Rechercheassistent. Unterstütze den Nutzer bei seiner Arbeit.
✓ Wenn der Nutzer eine Frage stellt, analysiere sie zunächst.
✓ Frage nach, wenn Sie weitere Informationen benötigen.
```

### Informal "Du" (When Requested)

For casual or internal tools:

```markdown
Du hilfst dem Nutzer bei [Aufgabe]. Wenn du Fragen hast, frag einfach nach.
```

---

## Verb Forms

### Imperative Form (Primary)

Use imperative for direct instructions:

| Infinitive | Imperative | Example |
|------------|------------|---------|
| analysieren | Analysiere | Analysiere die Anfrage zunächst. |
| prüfen | Prüfe | Prüfe die Fakten mit verfügbaren Werkzeugen. |
| erstellen | Erstelle | Erstelle eine strukturierte Zusammenfassung. |
| zusammenfassen | Fasse zusammen | Fasse die Ergebnisse übersichtlich zusammen. |
| recherchieren | Recherchiere | Recherchiere Hintergrundinformationen. |
| verifizieren | Verifiziere | Verifiziere Aussagen mit Quellenangaben. |
| formulieren | Formuliere | Formuliere Antworten klar und präzise. |
| strukturieren | Strukturiere | Strukturiere komplexe Informationen. |

### Common Research Verbs

```markdown
- Recherchiere: für Informationssuche
- Prüfe/Verifiziere: für Faktenprüfung
- Analysiere: für Informationsauswertung
- Vergleiche: für Gegenüberstellungen
- Identifiziere: für Mustererkennung
- Ordne ein: für Kontextualisierung
```

### Common Writing Verbs

```markdown
- Formuliere: für Textproduktion
- Fasse zusammen: für Zusammenfassungen
- Strukturiere: für Gliederung
- Überarbeite: für Revision
- Kürze: für Komprimierung
- Erweitere: für Elaboration
```

### Common Analysis Verbs

```markdown
- Bewerte: für Einschätzungen
- Beurteile: für Beurteilungen
- Wäge ab: für Abwägungen
- Unterscheide: für Differenzierung
- Erkenne: für Identifikation
- Stelle fest: für Feststellungen
```

---

## Sentence Structure

### Active Voice (Preferred)

**Passive (avoid):**
```markdown
Die Recherche wird durchgeführt.
Die Ergebnisse werden zusammengefasst.
```

**Active (preferred):**
```markdown
Führe die Recherche durch.
Fasse die Ergebnisse zusammen.
```

### Short Sentences for Instructions

**Long (harder to parse):**
```markdown
Nachdem du die Anfrage analysiert und die relevanten Suchbegriffe identifiziert hast, nutze das passende Werkzeug, um die benötigten Informationen zu recherchieren, und fasse diese dann in einer strukturierten Form zusammen.
```

**Short (clearer):**
```markdown
1. Analysiere die Anfrage.
2. Identifiziere relevante Suchbegriffe.
3. Nutze das passende Werkzeug für die Recherche.
4. Fasse die Ergebnisse strukturiert zusammen.
```

### Parallel Structure

When listing items, maintain consistent grammatical structure:

**Inconsistent:**
```markdown
- Recherche von Hintergrundinformationen
- Fakten prüfen
- Das Erstellen von Zusammenfassungen
```

**Consistent (noun phrases):**
```markdown
- Recherche von Hintergrundinformationen
- Prüfung von Fakten
- Erstellung von Zusammenfassungen
```

**Consistent (verb phrases):**
```markdown
- Hintergrundinformationen recherchieren
- Fakten prüfen
- Zusammenfassungen erstellen
```

---

## Terminology

### Avoid Anglicisms Where German Exists

| English | Avoid | Prefer |
|---------|-------|--------|
| Tool | Tool | Werkzeug |
| Search | searchen | suchen, recherchieren |
| Check | checken | prüfen |
| Update | Update | Aktualisierung |
| Feature | Feature | Funktion |
| Content | Content | Inhalt |
| Source | Source | Quelle |
| Query | Query | Anfrage, Suchanfrage |
| Output | Output | Ausgabe |
| Input | Input | Eingabe |

### Technical Terms (Keep in English)

Some technical terms are standard in German:
- API (not "Programmierschnittstelle")
- URL (not "Internetadresse")
- PDF (not "Portable-Dokument-Format")
- JSON (no German equivalent)

### Domain-Specific Terms

For journalism:
```markdown
- Bericht, Artikel, Meldung
- Quelle, Beleg, Nachweis
- Faktenprüfung, Verifizierung
- Hintergrundrecherche
- Pressemitteilung
- Nachrichtenagentur
```

---

## Formatting Conventions

### Section Headers

Use German headers in system prompts:

```markdown
## Rollenidentität
## Kernaufgaben
## Verfügbare Werkzeuge
## Arbeitsweise
## Einschränkungen
## Ausgabeformat
```

### Tool Headers

```markdown
### Werkzeugname
**Beschreibung:** ...
**Verfügbare Aktionen:** ...
**Anwendung:** ...
```

### Lists

Use consistent markers:
- Bullet points for unordered items
- Numbers for sequential steps or priorities
- Sub-bullets for nested information

```markdown
## Arbeitsweise

1. **Analyse**: Verstehe die Anfrage
   - Identifiziere Schlüsselbegriffe
   - Erkenne den Informationsbedarf
2. **Recherche**: Nutze passende Werkzeuge
3. **Synthese**: Fasse Ergebnisse zusammen
```

---

## Tone Guidelines

### Professional but Accessible

**Too formal:**
```markdown
Es obliegt dem Assistenten, die eingehenden Anfragen einer eingehenden Prüfung zu unterziehen.
```

**Too casual:**
```markdown
Schau dir mal an, was der Nutzer will, und dann such halt was raus.
```

**Appropriate:**
```markdown
Analysiere eingehende Anfragen und recherchiere relevante Informationen mit den verfügbaren Werkzeugen.
```

### Direct Instruction

**Indirect (avoid):**
```markdown
Es wäre hilfreich, wenn Quellenangaben gemacht würden.
```

**Direct (preferred):**
```markdown
Gib Quellen für alle faktischen Aussagen an.
```

### Positive Framing

**Negative:**
```markdown
Spekuliere nicht. Erfinde keine Informationen. Halluziniere nicht.
```

**Positive:**
```markdown
Beschränke dich auf verifizierbare Informationen. Bei Unsicherheit weise darauf hin, dass weitere Recherche nötig sein könnte.
```

---

## Common Phrases

### For Constraints

```markdown
- Beschränke dich auf...
- Vermeide...
- Nutze [Werkzeug] nicht für...
- Bei Unsicherheit...
- Falls [Bedingung], dann...
- Im Zweifelsfall...
```

### For Instructions

```markdown
- Beginne mit...
- Fahre fort mit...
- Schließe ab mit...
- Prüfe zunächst, ob...
- Stelle sicher, dass...
```

### For Tool Usage

```markdown
- Nutze [Werkzeug], wenn...
- Wechsle zu [Werkzeug] für...
- Kombiniere [Werkzeug A] und [Werkzeug B] für...
- Bevorzuge [Werkzeug] für [Anwendungsfall]
```

### For Output

```markdown
- Strukturiere die Antwort wie folgt:
- Gib das Ergebnis in folgendem Format aus:
- Gliedere die Antwort in:
- Füge am Ende [Element] hinzu
```

---

## Quality Checklist

Before finalizing German prompts:

- [ ] Formal "Sie" when referring to user (unless informal requested)
- [ ] "Du" for addressing the assistant itself
- [ ] Active voice throughout
- [ ] Short sentences for instructions
- [ ] Parallel grammatical structure in lists
- [ ] German terms where English alternatives exist
- [ ] Imperative verb forms for instructions
- [ ] Professional but accessible tone
- [ ] Positive framing for constraints
- [ ] Consistent formatting
