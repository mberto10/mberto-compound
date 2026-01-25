# Perplexity AI Actions

Actions for the [Perplexity API](https://docs.perplexity.ai) - AI-powered search with synthesized answers.

## Authentication

All actions use Bearer token authentication:
- **Auth field:** `apiKey`
- **Header:** `Authorization: Bearer {apiKey}`

Get your API key at [perplexity.ai](https://www.perplexity.ai/settings/api)

---

## Actions

### batch-search.js - Batch Web Search

Execute multiple Perplexity searches in parallel. Returns synthesized answers with citations.

**Best for:** Fact-checking, quick verification of multiple claims

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `queries` | Yes | - | JSON array of search queries |
| `recency` | No | `week` | Time filter: `day`, `week`, `month`, `year` |
| `max_per_query` | No | `3` | Max results per query |

**Example Input:**
```json
{
  "queries": "[\"Wann wurde Berlin gegründet?\", \"Wie viele Einwohner hat München?\"]",
  "recency": "month"
}
```

**Example Output:**
```json
{
  "results": [
    {
      "index": 0,
      "query": "Wann wurde Berlin gegründet?",
      "status": "success",
      "answer": "Berlin wurde 1237 erstmals urkundlich erwähnt...",
      "citations": ["https://..."]
    }
  ],
  "summary": {
    "total_queries": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

## Use Cases

### Fact Checker Workflow

```markdown
Wenn du mehrere Behauptungen prüfen musst:

1. Extrahiere alle prüfbaren Behauptungen
2. Formuliere für jede eine Suchanfrage
3. Nutze `Batch Web Search` mit allen Anfragen als JSON-Array
4. Analysiere die Ergebnisse und bestimme für jede:
   - VERIFIZIERT (Quellen bestätigen)
   - FALSCH (Quellen widerlegen)
   - UNKLAR (widersprüchliche/fehlende Evidenz)
```
