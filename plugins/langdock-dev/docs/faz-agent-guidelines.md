# Guidelines für FAZ GenAI Team Agenten

## Standard-Beschreibung für alle Agenten

Die folgende Beschreibung muss in **jedem** Langdock-Agenten als Teil der Systemnachricht oder als sichtbarer Hinweis eingefügt werden:

---

> **Hinweis:** Dieser Agent wird vom GenAI Team verwaltet und regelmäßig auf Basis von Feedback weiterentwickelt. Jegliche AI-Funktionalitäten unterliegen dem **Human-First/Human-Last Prinzip** und müssen vor Verwendung auf Richtigkeit geprüft werden. Bei Fragen oder Feedback schreiben Sie uns gerne an **team-genai@faz.de**

---

## Kopiervorlage

```
Dieser Agent wird vom GenAI Team verwaltet und regelmäßig auf Basis von Feedback weiterentwickelt. Jegliche AI-Funktionalitäten unterliegen dem Human-First/Human-Last Prinzip und müssen vor Verwendung auf Richtigkeit geprüft werden. Bei Fragen oder Feedback schreiben Sie uns gerne an team-genai@faz.de
```

---

## Optionaler Zusatz für Test-Assistenten

Falls der Agent Teil einer **Testphase** ist und die Antworten zur Verbesserung ausgewertet werden, kann folgender Hinweis ergänzend hinzugefügt werden:

---

> **Test-Hinweis:** Dieser Assistent befindet sich derzeit in einer Testphase. Ihre Eingaben und die generierten Antworten werden anonymisiert ausgewertet, um den Assistenten kontinuierlich zu verbessern.

---

### Kopiervorlage (Test-Zusatz)

```
Dieser Assistent befindet sich derzeit in einer Testphase. Ihre Eingaben und die generierten Antworten werden anonymisiert ausgewertet, um den Assistenten kontinuierlich zu verbessern.
```

### Wann verwenden?

- Agent ist neu und wird evaluiert
- Antworten werden für Qualitätsverbesserungen analysiert
- Nutzer sollen über die Datenverwendung informiert werden

---

## Human-First/Human-Last Prinzip

| Phase | Bedeutung |
|-------|-----------|
| **Human-First** | Menschen definieren die Aufgabe, den Kontext und die Qualitätskriterien |
| **Human-Last** | Menschen prüfen, validieren und verantworten alle Ergebnisse vor Veröffentlichung |

---

## Nutzeranleitung (Pflichtabschnitt)

Jeder Agent muss auf Nutzeranfragen wie "Nutzungsleitfaden", "Nutzungsbeispiele" oder "Hilfe" hilfreich reagieren können. Füge folgenden Abschnitt in jeden Systemprompt ein:

### Kopiervorlage

```
## Nutzeranleitung

Wenn der Nutzer nach "Nutzungsleitfaden", "Nutzungsbeispiele" oder "Hilfe" fragt:

### Was ich für Sie tun kann
[2-3 Sätze zu den Kernfunktionen dieses Agenten]

### Nutzungsbeispiele
- **[Anwendungsfall 1]:** "[Konkrete Beispiel-Eingabe]"
- **[Anwendungsfall 2]:** "[Konkrete Beispiel-Eingabe]"
- **[Anwendungsfall 3]:** "[Konkrete Beispiel-Eingabe]"

### Tipps für beste Ergebnisse
- [Tipp 1 für diesen spezifischen Agenten]
- [Tipp 2 für diesen spezifischen Agenten]
```

### Warum wichtig?

- Nutzer wissen oft nicht, was ein Agent kann
- Konkrete Beispiele senken die Einstiegshürde
- Bessere Nutzung führt zu besserem Feedback

---

## Kontakt

**GenAI Team:** team-genai@faz.de
