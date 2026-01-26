# Exa Integration Reference

Exa is a semantic web search API optimized for AI applications. It uses embeddings-based models to find relevant content and can return full page contents.

---

## Available Actions in Langdock

### 1. Web Recherche (Search)

**Langdock Action:** `Web Recherche`
**API Endpoint:** `POST /search`

**Description:** Performs intelligent web search using neural embeddings and returns relevant content with optional filtering.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `query` | Yes | string | Search query |
| `type` | Yes | enum | Search type: `neural`, `fast`, `auto` |
| `numResults` | No | integer | Number of results (max 100) |
| `startPublishedDate` | No | ISO 8601 | Filter: published after date |
| `endPublishedDate` | No | ISO 8601 | Filter: published before date |
| `include_Domains` | No | string[] | Only search these domains |
| `exclude_Domains` | No | string[] | Exclude these domains |
| `summary` | No | boolean | Return page summaries |

**Search Types:**
- `auto`: Intelligent combination of methods (recommended default)
- `neural`: Embeddings-based semantic search (best for concepts)
- `fast`: Quick, streamlined search (best for breaking news)

**Best for:**
- Current news and articles
- Company/organization research
- Topic-specific source discovery
- Finding authoritative content

---

### 2. Answer (exa_answer) - PRIMARY FOR FACT-CHECKING

**Langdock Action:** `exa_answer`
**API Endpoint:** `POST /answer`

**Description:** Performs search AND generates an LLM answer with citations. Combines retrieval and synthesis in one call. **This is the preferred action for fact-checking and research questions.**

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `query` | Yes | string | Question or query to answer |
| `model` | No | string | LLM model for answer generation |
| `systemprompt` | No | string | Custom system prompt for answer |
| `text` | No | boolean | Include full text in citations |

**Best for:**
- **Fact-checking with sources** (primary use case)
- Getting summarized answers to research questions
- When you need both answer AND reliable citations
- Rapid initial research with verifiable sources
- Complex queries requiring synthesis

**Note:** This action calls an LLM internally, so responses include generated text with source citations. Preferred over Perplexity when source reliability matters.

---

### 3. Find Similar (exa_find_similar)

**Langdock Action:** `exa_find_similar`
**API Endpoint:** `POST /findSimilar`

**Description:** Finds pages similar to a given URL. Useful for expanding research from a known good source.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `url` | Yes | string | Reference URL to find similar content |
| `numResults` | No | integer | Number of similar results |
| `startPublishedDate` | No | ISO 8601 | Filter: published after date |
| `endPublishedDate` | No | ISO 8601 | Filter: published before date |
| `startCrawlDate` | No | ISO 8601 | Filter: crawled after date |
| `endCrawlDate` | No | ISO 8601 | Filter: crawled before date |
| `includeDomains` | No | string[] | Only include these domains |
| `excludeDomains` | No | string[] | Exclude these domains |
| `includeText` | No | string[] | Must contain these terms |
| `excludeText` | No | string[] | Must not contain these terms |

**Best for:**
- Expanding research from a known good article
- Finding competing coverage of a story
- Discovering related sources
- Building source lists for backgrounders

---

### 4. Get Page (exa_get_page)

**Langdock Action:** `exa_get_page`
**API Endpoint:** `POST /contents`

**Description:** Retrieves full page contents, summaries, and metadata for specific URLs.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `urls` | Yes | string[] | URLs to retrieve content from |
| `text` | No | boolean | Return full page text |
| `livecrawl` | No | enum | `never`, `fallback`, `preferred`, `always` |
| `livecrawltimeout` | No | integer | Timeout in ms (default: 10000) |
| `subpages` | No | integer | Number of subpages to crawl |
| `subpagetarget` | No | string | Term to find specific subpages |
| `summaryquery` | No | string | Query for focused summary |
| `summaryschema` | No | object | Schema for structured summary |

**Livecrawl Options:**
- `never`: Only use cached content
- `fallback`: Livecrawl if not cached (default)
- `preferred`: Prefer fresh content
- `always`: Always fetch live

**Best for:**
- Retrieving full article text from known URLs
- Getting page summaries for research
- Extracting content from specific pages
- Deep-diving into individual sources

---

## Semantische Suchformulierung

**WICHTIG:** Exa verwendet neuronale Embeddings und funktioniert am besten mit natürlichsprachlichen Anfragen. Formuliere Suchanfragen IMMER als vollständige Fragen oder beschreibende Sätze.

**Richtig (semantisch):**
```
"Welche Rolle spielt Christian Lindner in der aktuellen Haushaltsdebatte?"
"Artikel über die Auswirkungen der KI-Regulierung auf deutsche Startups"
"Hintergrundinformationen zur Biografie und Karriere von [Person]"
```

**Falsch (Keyword-Stil):**
```
"Christian Lindner Haushalt 2026"
"KI Regulierung Startups Deutschland"
"[Person] Biografie Karriere"
```

---

## Usage Patterns for Journalists

### Pattern A: Fact-Checking (PRIMARY)
```
Action: exa_answer
query: "Wann hat die EZB zuletzt die Leitzinsen geändert und um wie viel Prozentpunkte?"
text: true

→ Returns answer with verifiable citations
→ Review citations for credibility
→ If needed, use exa_get_page to read full source
```

### Pattern B: Topic Research
```
Action: Web Recherche
type: auto
query: "Welche Positionen vertreten die verschiedenen Parteien zur Reform der Schuldenbremse in Deutschland?"
numResults: 15

→ Filter by date range for recency
→ Use exa_get_page to retrieve full content of top results
```

### Pattern C: Source Expansion
```
Action: exa_find_similar
url: [URL eines guten Artikels]
excludeDomains: ["eigene-zeitung.de"]

→ Finds related coverage from diverse perspectives
```

### Pattern D: Breaking News
```
Action: Web Recherche
type: fast
query: "Was sind die neuesten Entwicklungen beim Tarifkonflikt im öffentlichen Dienst?"
startPublishedDate: [letzte 24-48 Stunden]
summary: true
```

### Pattern E: Research Question with Sources
```
Action: exa_answer
query: "Welche wirtschaftlichen Auswirkungen hatte die Einführung des Bürgergelds in Deutschland?"
text: true

→ Preferred over Perplexity when reliable sources are critical
```

---

## Tool Description Template for Prompts

Use this template when including Exa in assistant system prompts:

```markdown
### Exa (Websuche & Faktenprüfung)

**Beschreibung:** Ermöglicht semantische Websuche und zuverlässige Faktenprüfung mit Quellenangaben.

**Verfügbare Aktionen:**
- `exa_answer`: Beantwortet Fragen mit automatischer Recherche und Quellenangaben - Parameter: query, text. **Bevorzugt für Faktenprüfung.**
- `Web Recherche`: Führt semantische Suche durch - Parameter: query, type (auto/neural/fast), numResults, Datumsfilter, Domain-Filter
- `exa_find_similar`: Findet ähnliche Seiten zu einer URL - Parameter: url, numResults, Filter
- `exa_get_page`: Ruft vollständige Seiteninhalte ab - Parameter: urls, livecrawl, summary

**Anwendung:**
Nutze `exa_answer`, wenn:
- Faktenprüfung mit zuverlässigen Quellen benötigt wird
- Recherchefragen mit Quellenangaben beantwortet werden sollen
- Verifikation von Behauptungen oder Statistiken gefragt ist

Nutze `Web Recherche`, wenn:
- Aktuelle Nachrichtenartikel gesucht werden
- Unternehmens- oder Personenrecherche gefragt ist
- Quellensuche ohne direkte Antwort benötigt wird

Nutze `exa_find_similar`, wenn:
- Ähnliche Quellen zu einem bekannten guten Artikel gesucht werden
- Perspektivenvielfalt durch verwandte Inhalte hergestellt werden soll

Nutze `exa_get_page`, wenn:
- Vollständige Artikelinhalte benötigt werden
- Detailinformationen aus bekannten URLs extrahiert werden sollen

**Nicht verwenden für:**
- Allgemeinwissen ohne Quellenanforderung
- Berechnungen oder Datenanalyse
- Meinungsfragen
```

---

## Typical Parameters by Use Case

| Use Case | Action | Recommended Parameters |
|----------|--------|----------------------|
| **Fact-checking** | `exa_answer` | `text=true` for full citations |
| Breaking news | `Web Recherche` | `type=fast`, `startPublishedDate` (24h), `numResults=10` |
| Topic research | `Web Recherche` | `type=auto`, `numResults=15-20` |
| Competitor analysis | `exa_find_similar` | `excludeDomains` (own outlet) |
| Article retrieval | `exa_get_page` | `livecrawl=fallback`, `text=true` |
| Research questions | `exa_answer` | `text=true` |

---

## Comparison: exa_answer vs. Perplexity

| Aspect | exa_answer | Perplexity (sonar) |
|--------|------------|-------------------|
| **Best for** | Fact-checking, research questions | Quick topic overviews |
| **Source quality** | Higher - direct citations | Variable |
| **Depth** | Deeper analysis | Surface-level |
| **Use when** | Sources matter | Speed matters |
| **Recommended for** | Journalistic verification | Initial exploration |

**Rule of thumb:** Use `exa_answer` when accuracy and sources are critical. Use Perplexity `sonar` for quick overviews where source verification is less important.
