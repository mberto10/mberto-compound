# YouTrack Actions

Langdock Actions fuer das projektbezogene Reporting in `https://fazit.youtrack.cloud`.

## Authentifizierung

Alle Actions verwenden Bearer-Token-Authentifizierung:

- **Auth-Feld:** `apiKey`
- **Header:** `Authorization: Bearer {apiKey}`

## Actions

### search-issues.js

Sucht Issues per YouTrack-Query und gibt strukturierte Kerndaten zurueck.

### get-issue.js

Liest ein einzelnes Issue inklusive Beschreibung und wichtiger Custom Fields.

### get-comments.js

Liest Kommentare eines Issues. Kann optional auf KW-Kommentare filtern.

### add-comment.js

Erstellt einen neuen Markdown-Kommentar auf einem Issue.

### update-comment.js

Aktualisiert einen vorhandenen Kommentar auf einem Issue.

### find-epic.js

Findet das passendste Epic zu einem Projektnamen und priorisiert aktive Projekttickets.

### get-weekly-kw-updates.js

Sammelt alle KW-Kommentare einer Woche fuer aktive Epics und parst `Updates`, `Blocker` und `Next Steps`.

### health-check-epics.js

Prueft aktive Epics auf fehlende Beschreibung, Meilensteine, Bearbeiter und veraltete KW-Updates.

## Empfohlenes Minimal-Set fuer den Reporting Assistant

- `search-issues.js`
- `get-issue.js`
- `get-comments.js`
- `add-comment.js`
- `update-comment.js`
- `find-epic.js`
- `get-weekly-kw-updates.js`

## Typische Workflows

### KW-Update schreiben

1. `find-epic.js` mit Projektnamen aufrufen
2. `get-comments.js` mit `kw_only=true` nutzen
3. Bestehenden KW-Kommentar analysieren
4. Entweder `update-comment.js` oder `add-comment.js` aufrufen

### Wochenmail erstellen

1. `get-weekly-kw-updates.js` fuer die Ziel-KW aufrufen
2. Projekte nach Blockern, Fortschritt und strategischer Relevanz priorisieren
3. 5-6 Projekte fuer die Mail auswaehlen
4. Nur `Updates` und `Next Steps` in die finale Mail uebernehmen
