# Perplexity Sonar Integration Reference

Perplexity Sonar is a grounded LLM API that combines language model capabilities with real-time web search. Responses include citations to sources.

---

## Available Actions in Langdock

### 1. Chat Completion

**Langdock Action:** `chat_completion`
**API Endpoint:** `POST /chat/completions`

**Description:** Sends a query to Perplexity and receives a grounded response with automatic web search and citations.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `user_message` | Yes | string | The question or query to answer |
| `model` | No | enum | Model selection: `sonar` |
| `search_domain_filter` | No | string[] | Domains to include/exclude (prefix `-` to exclude) |
| `search_recency_filter` | No | enum | Time filter: `day`, `week`, `month`, `year` |

---

## Available Models

| Model | Best For |
|-------|----------|
| `sonar` | Fast, general-purpose queries, quick fact checks, topic overviews |

**Model Selection Guidelines:**
- Use `sonar` for all Perplexity queries
- For complex research requiring deeper analysis, use `exa_answer` instead (see Exa integration)
- For comprehensive backgrounders, combine `sonar` with Exa `Web Recherche` and `exa_get_page`

---

## Parameter Details

### search_domain_filter

Restrict or exclude specific domains (max 20):

**Include only specific domains:**
```
["reuters.com", "apnews.com", "bbc.com"]
```

**Exclude specific domains (prefix with -):**
```
["-wikipedia.org", "-reddit.com"]
```

**Mixed (include some, exclude others):**
```
["reuters.com", "apnews.com", "-tabloid.com"]
```

### search_recency_filter

Filter results by publication time:

| Value | Searches Content From |
|-------|----------------------|
| `day` | Last 24 hours |
| `week` | Last 7 days |
| `month` | Last 30 days |
| `year` | Last 12 months |

---

## Response Characteristics

Perplexity responses include:
- **Answer text**: Synthesized response to the query
- **Citations**: Numbered references to sources used
- **Source URLs**: Links to original content

**Note:** Unlike raw search, Perplexity returns a synthesized answer, not a list of links. The LLM has already processed and summarized the information.

---

## Semantische Suchformulierung

**WICHTIG:** Perplexity ist für natürlichsprachliche Fragen optimiert. Formuliere Anfragen IMMER als vollständige Fragen oder Sätze, niemals als Keyword-Fragmente.

**Richtig (semantisch):**
```
"Welche Kontroversen gab es um Christian Lindner in den letzten Monaten?"
"Was sind die aktuellen Herausforderungen der deutschen Automobilindustrie?"
"Wie hat die Bundesregierung auf die Kritik an der Kindergrundsicherung reagiert?"
```

**Falsch (Keyword-Stil):**
```
"Christian Lindner Kontroversen 2026"
"Automobilindustrie Herausforderungen Deutschland"
"Bundesregierung Kindergrundsicherung Kritik"
```

---

## Usage Patterns for Journalists

### Pattern A: Quick Fact Check
```
Action: chat_completion
model: sonar
user_message: "Stimmt es, dass die Inflationsrate in Deutschland im Januar 2026 über 3% lag?"
search_recency_filter: week
```

### Pattern B: Breaking News Context
```
Action: chat_completion
model: sonar
user_message: "Was ist der aktuelle Stand bei den Tarifverhandlungen im öffentlichen Dienst?"
search_recency_filter: day
search_domain_filter: ["reuters.com", "apnews.com", "dpa.com"]
```

### Pattern C: Topic Overview
```
Action: chat_completion
model: sonar
user_message: "Was sind die wichtigsten Punkte in der aktuellen Debatte um das Bürgergeld?"
search_recency_filter: month
```

**Note:** For comprehensive background research with extensive sources, use `exa_answer` instead (see Exa integration reference).

### Pattern D: Competitor-Free Research
```
Action: chat_completion
model: sonar
user_message: "Welche neuen Entwicklungen gibt es beim Thema KI-Regulierung in der EU?"
search_domain_filter: ["-eigene-zeitung.de"]
```

---

## Comparison: Perplexity vs. Exa

| Aspect | Perplexity (sonar) | Exa (exa_answer) |
|--------|-------------------|------------------|
| **Output** | Synthesized answer + citations | Synthesized answer + detailed citations |
| **Best for** | Quick overviews, simple fact checks | Fact-checking with sources, research questions |
| **Speed** | Very fast | Fast |
| **Depth** | Surface-level synthesis | Deeper analysis with source access |
| **Use when** | Need quick answer | Need reliable sources and citations |

**Recommended workflow:**
1. Start with Perplexity `sonar` for quick topic overview
2. Use `exa_answer` for fact-checking requiring reliable sources
3. Use Exa `Web Recherche` for source discovery
4. Use Exa `exa_get_page` to retrieve full article text

---

## Tool Description Template for Prompts

Use this template when including Perplexity in assistant system prompts:

```markdown
### Perplexity (Sonar)

**Beschreibung:** Ermöglicht schnelle Themenübersichten und einfache Faktenprüfung mit automatischer Quellensynthese.

**Verfügbare Aktionen:**
- `chat_completion`: Recherchiert und beantwortet Fragen mit Quellenangaben - Parameter: user_message, model (sonar), search_recency_filter (day/week/month/year), search_domain_filter

**Anwendung:**
Nutze Perplexity, wenn:
- Ein schneller Überblick über ein Thema benötigt wird
- Einfache Faktenfragen beantwortet werden sollen
- Aktuelle Ereignisse zusammengefasst werden sollen

**Nicht verwenden für:**
- Faktenprüfung mit hohen Quellenanforderungen (→ exa_answer verwenden)
- Suche nach spezifischen Dokumenten oder PDFs (→ Exa Web Recherche)
- Tiefergehende Recherche (→ exa_answer oder Exa Web Recherche)

**Hinweis:** Für zuverlässige Faktenprüfung mit Quellenangaben bevorzuge `exa_answer`. Perplexity eignet sich für schnelle Übersichten.
```

---

## Typical Parameters by Use Case

| Use Case | Model | Recency Filter | Domain Filter |
|----------|-------|----------------|---------------|
| Schneller Themenüberblick | `sonar` | `week` | - |
| Aktuelle Nachrichten | `sonar` | `day` | Nachrichtenagenturen |
| Einfache Faktenprüfung | `sonar` | - | - |
| Quellenfreie Recherche | `sonar` | - | Konkurrenz ausschließen |

**For complex research:** Use `exa_answer` instead of Perplexity.
