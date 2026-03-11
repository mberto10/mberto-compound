# Langdock Actions

Ready-to-use Langdock action scripts organized by provider.

## Directory Structure

```
actions/
├── parallel/     # Parallel Web Systems API (parallel.ai)
├── perplexity/   # Perplexity AI API
├── exa/          # Exa AI API
├── youtrack/     # YouTrack Reporting und KW-Workflow
├── eodhd/        # Unified EODHD actions (core + bundles)
│   ├── core/
│   └── bundles/
└── README.md
```

## Providers

### [Parallel](./parallel/)

Web search and research APIs built for AI agents. Features natural language objectives and LLM-optimized excerpts.

| Action | Description |
|--------|-------------|
| `search.js` | Natural language web search with excerpts |
| `extract.js` | Convert URLs to clean markdown |
| `multi-extract.js` | Batch extract from multiple URLs |
| `task.js` | Deep research with citations |
| `batch-search.js` | Multiple parallel searches |

**Auth:** Bearer token (`apiKey`)

---

### [Perplexity](./perplexity/)

AI-powered search with synthesized answers and citations.

| Action | Description |
|--------|-------------|
| `batch-search.js` | Multiple searches with answers |

**Auth:** Bearer token (`apiKey`)

---

### [Exa](./exa/)

Neural search engine for finding articles and documents.

| Action | Description |
|--------|-------------|
| `batch-search.js` | Multiple searches with article excerpts |

**Auth:** API key header (`apikey`)

---

### [YouTrack](./youtrack/)

Actions fuer Projektstatus, Epic-Reviews und KW-Reporting in fazit YouTrack.

| Action | Description |
|--------|-------------|
| `search-issues.js` | Issues per YouTrack-Query suchen |
| `get-issue.js` | Einzelnes Issue mit Feldern und Beschreibung lesen |
| `get-comments.js` | Kommentare lesen, optional nur KW-Kommentare |
| `add-comment.js` | Kommentar auf einem Issue erstellen |
| `update-comment.js` | Bestehenden Kommentar aktualisieren |
| `find-epic.js` | Passendes Epic zu einem Projektnamen finden |
| `get-weekly-kw-updates.js` | KW-Kommentare aktiver Epics sammeln und parsen |
| `health-check-epics.js` | Aktive Epics auf SOP-Luecken pruefen |

**Auth:** Bearer token (`apiKey`)

---

### [EODHD](./eodhd/)

Unified EODHD folder containing both atomic and bundle actions.

| Scope | Path | Description |
|--------|------|-------------|
| Core atomic actions | `./eodhd/core/` | Single-endpoint wrappers (`fundamentals`, `screener`, `technical`, `calendar`, `news`, `real-time`) |
| Bundle composite actions | `./eodhd/bundles/` | Multi-endpoint newsroom analyses (daily pulse, deep dive, earnings reaction, etc.) |

**Auth:** API key (`apiKey`, mapped to `api_token`) for all EODHD actions.

---

## Usage in Assistants

### Fact Checker Workflow

1. Assistant extracts claims from text
2. Calls batch search action with claims as queries
3. Analyzes results to determine verdicts

### Research Workflow

1. User provides research topic
2. Assistant generates multiple search angles
3. Calls appropriate search actions
4. Synthesizes findings with citations

---

## Limits

- Maximum 10 queries per batch (to prevent timeout)
- 60 second execution timeout per action
- Subject to individual provider API rate limits
