# Langdock Actions

Ready-to-use Langdock action scripts organized by provider.

## Directory Structure

```
actions/
├── parallel/     # Parallel Web Systems API (parallel.ai)
├── perplexity/   # Perplexity AI API
├── exa/          # Exa AI API
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
