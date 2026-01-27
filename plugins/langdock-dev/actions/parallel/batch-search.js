// name = Batch Search Parallel
// description = Führt mehrere Suchanfragen mit der Parallel API aus. Nutzt natürliche Sprache als Suchziel und liefert LLM-optimierte Auszüge.

// queries = JSON Array mit Suchanfragen (e.g. '["Faktencheck: X", "Recherche zu Y"]') (Required)
// days_back = Nur Ergebnisse der letzten X Tage (default: 30)
// max_results = Ergebnisse pro Anfrage (default: 5)
// excerpt_chars = Maximale Zeichen pro Auszug (default: 2000)

const queries = JSON.parse(data.input.queries);
const daysBack = data.input.daysBack || 30;
const maxResults = data.input.maxResults || 5;
const excerptChars = data.input.excerptChars || 2000;

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

// Calculate date filter (RFC 3339 format)
const afterDate = new Date();
afterDate.setDate(afterDate.getDate() - daysBack);
const afterDateStr = afterDate.toISOString().split('T')[0];

// Build parallel search requests using Parallel API
const searchRequests = queries.map(query =>
  ld.request({
    url: 'https://api.parallel.ai/v1beta/search',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${data.auth.apiKey}`,
      'Content-Type': 'application/json',
      'parallel-beta': 'search-extract-2025-10-10',
    },
    body: {
      objective: query,
      max_results: maxResults,
      mode: 'one-shot',
      source_policy: {
        after_date: afterDateStr,
      },
      excerpts: {
        max_chars_per_result: excerptChars,
        max_chars_total: excerptChars * maxResults,
      },
    },
  })
);

// Execute all searches in parallel
const results = await Promise.allSettled(searchRequests);

// Process and structure results
const searchResults = queries.map((query, index) => {
  const result = results[index];

  if (result.status === 'fulfilled' && result.value.status === 200) {
    const response = result.value.json;
    const sources = (response.results || []).map(r => ({
      title: r.title,
      url: r.url,
      publishedDate: r.publish_date || null,
      excerpt: r.excerpts?.join('\n\n') || '',
    }));

    return {
      index: index,
      query: query,
      status: 'success',
      sources: sources,
      sourceCount: sources.length,
      searchId: response.search_id,
    };
  } else {
    const errorMsg = result.status === 'rejected'
      ? result.reason?.message
      : `API returned status ${result.value?.status}`;

    return {
      index: index,
      query: query,
      status: 'error',
      sources: [],
      sourceCount: 0,
      error: errorMsg || 'Search request failed',
    };
  }
});

// Summary statistics
const successful = searchResults.filter(r => r.status === 'success').length;
const failed = searchResults.filter(r => r.status === 'error').length;
const totalSources = searchResults.reduce((sum, r) => sum + r.sourceCount, 0);

return {
  results: searchResults,
  summary: {
    total_queries: queries.length,
    successful: successful,
    failed: failed,
    total_sources: totalSources,
    date_filter: `Last ${daysBack} days`,
  },
  timestamp: new Date().toISOString(),
};
