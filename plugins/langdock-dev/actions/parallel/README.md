# Parallel Web Systems Actions

Actions for the [Parallel API](https://docs.parallel.ai) - Web search and research APIs built for AI agents.

## Authentication

All actions use Bearer token authentication:
- **Auth field:** `apiKey`
- **Header:** `Authorization: Bearer {apiKey}`
- **Beta header:** `parallel-beta: search-extract-2025-10-10`

Get your API key at [platform.parallel.ai](https://platform.parallel.ai)

---

## Actions

### search.js - Parallel Web Search

Execute natural language web searches optimized for LLMs.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `objective` | Yes | - | Natural language search query |
| `max_results` | No | `5` | Maximum results to return |
| `max_chars_per_result` | No | `1500` | Character limit per excerpt |
| `days_back` | No | `30` | Only results from last X days |

**Example:**
```json
{
  "objective": "Latest developments in quantum computing 2026",
  "max_results": 5
}
```

---

### extract.js - Parallel URL Extract

Convert any public URL into clean, LLM-ready markdown.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `url` | Yes | - | Public URL to extract |
| `objective` | No | - | Focus extraction on specific goals |
| `excerpts` | No | `true` | Return focused excerpts |
| `full_content` | No | `false` | Return complete page markdown |

**Example:**
```json
{
  "url": "https://example.com/article",
  "objective": "Extract the pricing information"
}
```

---

### multi-extract.js - Parallel Multi-URL Extract

Extract and compare content from multiple URLs in a single call.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `urls` | Yes | - | JSON array of URLs (max 5) |
| `objective` | Yes | - | What to extract across all URLs |
| `excerpts` | No | `true` | Return focused excerpts |
| `full_content` | No | `false` | Return complete content |

**Example:**
```json
{
  "urls": "[\"https://company1.com/pricing\", \"https://company2.com/pricing\"]",
  "objective": "Extract pricing tiers and features for comparison"
}
```

---

### task.js - Parallel Deep Research

Execute complex research tasks with citations and confidence levels.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `query` | Yes | - | Research question or task |
| `output_format` | No | - | Expected output format |
| `processor` | No | `base` | Tier: `base`, `core`, `ultra` |

**Example:**
```json
{
  "query": "What are the key differences between React and Vue in 2026?",
  "output_format": "A comparison table with pros and cons",
  "processor": "core"
}
```

**Note:** This action polls for results (max 50 seconds). For complex queries, it may return a `taskId` to check later.

---

### batch-search.js - Batch Parallel Search

Execute multiple searches in parallel for comprehensive research.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `queries` | Yes | - | JSON array of search queries |
| `days_back` | No | `30` | Only results from last X days |
| `max_results` | No | `5` | Results per query |
| `excerpt_chars` | No | `2000` | Max chars per excerpt |

**Example:**
```json
{
  "queries": "[\"Faktencheck: X\", \"Recherche zu Y\"]",
  "max_results": 3
}
```
