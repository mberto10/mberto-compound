// name = Batch Web Search
// description = Führt mehrere Suchanfragen parallel aus und gibt alle Ergebnisse zurück. Ideal für Faktenprüfung mehrerer Behauptungen.

// queries = JSON Array mit Suchanfragen (e.g. '["Behauptung 1 prüfen", "Ist X wahr?", "Faktencheck Y"]') (Required)
// recency = Aktualitätsfilter: day, week, month, year (default: 'week')
// max_per_query = Maximale Ergebnisse pro Anfrage (default: 3)

const queries = JSON.parse(data.input.queries);
const recency = data.input.recency || 'week';
const maxPerQuery = data.input.maxPerQuery || 3;

// Validate input
if (!Array.isArray(queries) || queries.length === 0) {
  return {
    error: true,
    message: 'queries must be a non-empty JSON array of strings',
  };
}

if (queries.length > 10) {
  return {
    error: true,
    message: 'Maximum 10 queries per batch allowed',
  };
}

// Build parallel search requests (each ld.request must be awaited)
const searchRequests = queries.map(async (query) => {
  const response = await ld.request({
    url: 'https://api.perplexity.ai/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${data.auth.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      search_recency_filter: recency,
    },
  });
  return response;
});

// Execute all searches in parallel
const results = await Promise.allSettled(searchRequests);

// Process and structure results
const searchResults = queries.map((query, index) => {
  const result = results[index];

  if (result.status === 'fulfilled') {
    const response = result.value.json;
    const message = response.choices?.[0]?.message;

    return {
      index: index,
      query: query,
      status: 'success',
      answer: message?.content || '',
      citations: response.citations || [],
    };
  } else {
    return {
      index: index,
      query: query,
      status: 'error',
      answer: null,
      citations: [],
      error: result.reason?.message || 'Search request failed',
    };
  }
});

// Summary statistics
const successful = searchResults.filter(r => r.status === 'success').length;
const failed = searchResults.filter(r => r.status === 'error').length;

return {
  results: searchResults,
  summary: {
    total_queries: queries.length,
    successful: successful,
    failed: failed,
    recency_filter: recency,
  },
  timestamp: new Date().toISOString(),
};
