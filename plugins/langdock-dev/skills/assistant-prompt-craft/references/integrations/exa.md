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
| `type` | Yes | enum | Search type: `neural`, `fast`, `auto`, `deep` |
| `numResults` | No | integer | Number of results (max 100) |
| `startPublishedDate` | No | ISO 8601 | Filter: published after date |
| `endPublishedDate` | No | ISO 8601 | Filter: published before date |
| `include_Domains` | No | string[] | Only search these domains |
| `exclude_Domains` | No | string[] | Exclude these domains |
| `summary` | No | boolean | Return page summaries |

**Search Types:**
- `neural`: Embeddings-based semantic search (best for concepts)
- `fast`: Quick, streamlined search
- `auto`: Intelligent combination of methods (recommended default)
- `deep`: Comprehensive with query expansion (best for research)

**Best for:**
- Current news and articles
- Company/organization research
- Topic-specific source discovery
- Finding authoritative content

---

### 2. Find Similar (exa_find_similar)

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

### 3. Answer (exa_answer)

**Langdock Action:** `exa_answer`
**API Endpoint:** `POST /answer`

**Description:** Performs search AND generates an LLM answer with citations. Combines retrieval and synthesis in one call.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `query` | Yes | string | Question or query to answer |
| `model` | No | string | LLM model for answer generation |
| `systemprompt` | No | string | Custom system prompt for answer |
| `text` | No | boolean | Include full text in citations |

**Best for:**
- Quick fact-checking with sources
- Getting summarized answers to research questions
- When you need both answer AND citations
- Rapid initial research

**Note:** This action calls an LLM internally, so responses include generated text with source citations.

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

### Pattern A: Quick Fact Check
```
Action: exa_answer
query: "Wann hat die EZB zuletzt die Leitzinsen geändert und um wie viel Prozentpunkte?"

→ Review citations for credibility
→ If needed, use exa_get_page to read full source
```

### Pattern B: Topic Research
```
Action: Web Recherche
type: deep
query: "Welche Positionen vertreten die verschiedenen Parteien zur Reform der Schuldenbremse in Deutschland?"

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

---

## Tool Description Template for Prompts

Use this template when including Exa in assistant system prompts:

```markdown
### Exa (Websuche)

**Beschreibung:** Ermöglicht semantische Websuche mit Fokus auf aktuelle Artikel, Unternehmensprofile und Fachquellen.

**Verfügbare Aktionen:**
- `Web Recherche`: Führt semantische Suche durch - Parameter: query, type (auto/neural/fast/deep), numResults, Datumsfilter, Domain-Filter
- `exa_find_similar`: Findet ähnliche Seiten zu einer URL - Parameter: url, numResults, Filter
- `exa_answer`: Suche mit automatischer LLM-Antwort und Quellenangaben - Parameter: query, text
- `exa_get_page`: Ruft vollständige Seiteninhalte ab - Parameter: urls, livecrawl, summary

**Anwendung:**
Nutze Exa, wenn:
- Aktuelle Nachrichtenartikel gesucht werden
- Unternehmens- oder Personenrecherche gefragt ist
- Quellenvertiefung über Perplexity hinaus nötig ist
- Vollständige Artikelinhalte benötigt werden

**Nicht verwenden für:**
- Allgemeinwissen ohne Quellenanforderung
- Berechnungen oder Datenanalyse
- Meinungsfragen
```

---

## Typical Parameters by Use Case

| Use Case | Action | Recommended Parameters |
|----------|--------|----------------------|
| Breaking news | Web Recherche | `type=fast`, `startPublishedDate` (24h), `numResults=10` |
| Deep research | Web Recherche | `type=deep`, `numResults=20-50` |
| Competitor analysis | exa_find_similar | `excludeDomains` (own outlet) |
| Fact verification | exa_answer | `text=true` for full citations |
| Article retrieval | exa_get_page | `livecrawl=fallback`, `text=true` |
