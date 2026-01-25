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
| `model` | No | enum | Model selection (see below) |
| `search_domain_filter` | No | string[] | Domains to include/exclude (prefix `-` to exclude) |
| `search_recency_filter` | No | enum | Time filter: `day`, `week`, `month`, `year` |

---

## Available Models

| Model | Best For |
|-------|----------|
| `sonar` | Fast, general-purpose queries, quick fact checks |
| `sonar-pro` | Complex queries requiring deeper analysis |
| `sonar-reasoning-pro` | Multi-step reasoning, complex research |
| `sonar-deep-research` | Comprehensive research with extensive sources |

**Model Selection Guidelines:**
- Default to `sonar` for quick fact-checking
- Use `sonar-pro` for nuanced questions requiring synthesis
- Use `sonar-reasoning-pro` for complex analytical questions
- Reserve `sonar-deep-research` for comprehensive backgrounders

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
model: sonar-pro
user_message: "Was ist der aktuelle Stand bei den Tarifverhandlungen im öffentlichen Dienst und welche Forderungen stehen im Raum?"
search_recency_filter: day
search_domain_filter: ["reuters.com", "apnews.com", "dpa.com"]
```

### Pattern C: Background Research
```
Action: chat_completion
model: sonar-deep-research
user_message: "Erkläre die Geschichte und aktuelle Debatte um das Bürgergeld in Deutschland, einschließlich der wichtigsten Kritikpunkte von verschiedenen politischen Seiten."
```

### Pattern D: Competitor-Free Research
```
Action: chat_completion
model: sonar-pro
user_message: "Welche neuen Entwicklungen gibt es beim Thema KI-Regulierung in der EU?"
search_domain_filter: ["-eigene-zeitung.de"]
```

---

## Comparison: Perplexity vs. Exa

| Aspect | Perplexity | Exa |
|--------|------------|-----|
| **Output** | Synthesized answer + citations | Raw search results + optional content |
| **Best for** | Quick answers, fact synthesis | Source discovery, full article retrieval |
| **Control** | Less control over sources | Fine-grained filtering |
| **Speed** | Very fast | Depends on content retrieval |
| **Use first** | Initial fact check | Deep source research |

**Recommended workflow:**
1. Start with Perplexity for quick verification
2. If more sources needed, use Exa for deeper search
3. Use Exa's `get_page` to retrieve full article text

---

## Tool Description Template for Prompts

Use this template when including Perplexity in assistant system prompts:

```markdown
### Perplexity (Sonar)

**Beschreibung:** Ermöglicht schnelle Faktenprüfung und Recherche mit automatischer Quellensynthese und Zitaten.

**Verfügbare Aktionen:**
- `chat_completion`: Recherchiert und beantwortet Fragen mit Quellenangaben - Parameter: user_message, model (sonar/sonar-pro/sonar-deep-research), search_recency_filter (day/week/month/year), search_domain_filter

**Anwendung:**
Nutze Perplexity, wenn:
- Schnelle Faktenprüfung einer Behauptung benötigt wird
- Ein Überblick über ein Thema mit Quellenangaben gebraucht wird
- Aktuelle Ereignisse zusammengefasst werden sollen
- Eine erste Recherche vor tiefergehender Exa-Suche erfolgen soll

**Nicht verwenden für:**
- Suche nach spezifischen Dokumenten oder PDFs
- Wenn vollständige Originalquellen benötigt werden (→ Exa verwenden)
- Reine Auflistung von Quellen ohne Synthese

**Hinweis:** Perplexity liefert bereits synthetisierte Antworten mit Zitaten. Für Zugriff auf vollständige Originalartikel zusätzlich Exa nutzen.
```

---

## Typical Parameters by Use Case

| Use Case | Model | Recency Filter | Domain Filter |
|----------|-------|----------------|---------------|
| Schnelle Faktenprüfung | `sonar` | - | - |
| Aktuelle Nachrichten | `sonar-pro` | `day` | Nachrichtenagenturen |
| Hintergrundrecherche | `sonar-deep-research` | `month` | - |
| Themenüberblick | `sonar-pro` | `week` | - |
| Quellenfreie Recherche | `sonar-pro` | - | Konkurrenz ausschließen |
