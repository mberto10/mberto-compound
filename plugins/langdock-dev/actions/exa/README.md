# Exa AI Actions

Actions for the [Exa API](https://docs.exa.ai) - Neural search engine for finding articles and documents.

## Authentication

All actions use API key header authentication:
- **Auth field:** `apikey` (lowercase)
- **Header:** `x-api-key: {apikey}`

Get your API key at [exa.ai](https://dashboard.exa.ai/api-keys)

---

## Actions

### batch-search.js - Batch Exa Search

Execute multiple Exa searches in parallel for deep source research. Returns article URLs, excerpts, and AI summaries.

**Best for:** Deep source research, finding multiple articles per topic

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `queries` | Yes | - | JSON array of search queries |
| `num_results` | No | `5` | Articles per query |
| `days_back` | No | `30` | Only articles from last X days |
| `include_summary` | No | `true` | Include AI summaries |

**Example Input:**
```json
{
  "queries": "[\"Tesla Q4 earnings 2024\", \"OpenAI latest funding\"]",
  "num_results": 3,
  "days_back": 7
}
```

**Example Output:**
```json
{
  "results": [
    {
      "index": 0,
      "query": "Tesla Q4 earnings 2024",
      "status": "success",
      "articles": [
        {
          "title": "Tesla Reports Q4 Results",
          "url": "https://...",
          "publishedDate": "2024-01-25",
          "excerpt": "Tesla announced...",
          "summary": "..."
        }
      ],
      "articleCount": 3
    }
  ],
  "summary": {
    "total_queries": 2,
    "successful": 2,
    "total_articles": 6
  }
}
```

---

## Use Cases

### Research Workflow

1. User provides research topic
2. Assistant generates multiple search angles
3. Calls batch-search for comprehensive sources
4. Synthesizes findings from multiple articles

### Competitive Analysis

1. Define competitor names as queries
2. Search for recent news and updates
3. Extract key insights from article summaries
