// name = Batch Web Search
// description = Führt mehrere Suchanfragen parallel aus und gibt alle Ergebnisse zurück. Ideal für Faktenprüfung mehrerer Behauptungen.

// queries = Komma-getrennte Suchanfragen, z.B. "Frage 1, Frage 2, Frage 3" (Required)
// recency = Aktualitätsfilter: day, week, month, year (default: 'week')
// max_per_query = Maximale Ergebnisse pro Anfrage (default: 3)

// Parse comma-separated queries
const queriesInput = data.input.queries || '';
const queries = queriesInput
  .split(',')
  .map(q => q.trim())
  .filter(q => q.length > 0);
const recency = data.input.recency || 'week';
const maxPerQuery = data.input.maxPerQuery || 3;

// Validate input
if (queries.length === 0) {
  return {
    error: true,
    message: 'queries is required - provide comma-separated search queries',
  };
}

if (queries.length > 10) {
  return {
    error: true,
    message: 'Maximum 10 queries per batch allowed',
  };
}

try {
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

  // Process and structure results with safe parsing
  const searchResults = queries.map((query, index) => {
    try {
      const result = results[index];

      if (result.status === 'fulfilled' && result.value) {
        const response = result.value.json || {};
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
    } catch (parseError) {
      return {
        index: index,
        query: query,
        status: 'error',
        answer: null,
        citations: [],
        error: `Parse error: ${parseError.message}`,
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
} catch (error) {
  return {
    error: true,
    message: 'Batch search failed',
    details: error.message,
  };
}
