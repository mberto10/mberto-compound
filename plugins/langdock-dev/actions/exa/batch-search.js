// name = Batch Exa Search
// description = Führt mehrere Exa-Suchanfragen parallel aus für tiefere Quellenrecherche. Gibt Artikel-URLs und Auszüge zurück.

// queries = Komma-getrennte Suchanfragen, z.B. "Frage 1, Frage 2, Frage 3" (Required)
// num_results = Ergebnisse pro Anfrage (default: 5)
// days_back = Nur Artikel der letzten X Tage (default: 30)
// include_summary = Zusammenfassungen einschließen (default: true)

// Parse comma-separated queries
const queriesInput = data.input.queries || '';
const queries = queriesInput
  .split(',')
  .map(q => q.trim())
  .filter(q => q.length > 0);
const numResults = data.input.numResults || 5;
const daysBack = data.input.daysBack || 30;
const includeSummary = data.input.includeSummary !== false;

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

// Calculate date filter
const startDate = new Date();
startDate.setDate(startDate.getDate() - daysBack);
const startPublishedDate = startDate.toISOString().split('T')[0];

// Build parallel search requests
const searchRequests = queries.map(async (query) => {
  const response = await ld.request({
    url: 'https://api.exa.ai/search',
    method: 'POST',
    headers: {
      'x-api-key': data.auth.apikey,
      'Content-Type': 'application/json',
    },
    body: {
      query: query,
      type: 'auto',
      numResults: numResults,
      startPublishedDate: startPublishedDate,
      contents: {
        text: { maxCharacters: 1500 },
        summary: includeSummary,
      },
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
    const articles = (response.results || []).map(r => ({
      title: r.title,
      url: r.url,
      publishedDate: r.publishedDate,
      excerpt: r.text?.substring(0, 500) || '',
      summary: r.summary || null,
    }));

    return {
      index: index,
      query: query,
      status: 'success',
      articles: articles,
      articleCount: articles.length,
    };
  } else {
    return {
      index: index,
      query: query,
      status: 'error',
      articles: [],
      articleCount: 0,
      error: result.reason?.message || 'Search request failed',
    };
  }
});

// Summary statistics
const successful = searchResults.filter(r => r.status === 'success').length;
const failed = searchResults.filter(r => r.status === 'error').length;
const totalArticles = searchResults.reduce((sum, r) => sum + r.articleCount, 0);

return {
  results: searchResults,
  summary: {
    total_queries: queries.length,
    successful: successful,
    failed: failed,
    total_articles: totalArticles,
    date_filter: `Last ${daysBack} days`,
  },
  timestamp: new Date().toISOString(),
};
