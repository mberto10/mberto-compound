// name = Parallel Web Search
// description = Execute natural language web searches optimized for LLMs. Returns relevant excerpts with citations.

// objective = Natural language search query describing what to find (e.g. 'Latest developments in quantum computing 2026')
// max_results = Maximum number of results to return (default: 5)
// max_chars_per_result = Character limit per excerpt (default: 1500)
// days_back = Only include results from the last X days (default: 30)

const objective = data.input.objective;
const maxResults = data.input.max_results || 5;
const maxCharsPerResult = data.input.max_chars_per_result || 1500;
const daysBack = data.input.days_back || 30;

if (!objective) {
  return {
    error: true,
    message: 'objective is required - describe what you want to search for',
  };
}

// Calculate date filter (RFC 3339 format)
const afterDate = new Date();
afterDate.setDate(afterDate.getDate() - daysBack);
const afterDateStr = afterDate.toISOString().split('T')[0];

const options = {
  url: 'https://api.parallel.ai/v1beta/search',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
    'parallel-beta': 'search-extract-2025-10-10',
  },
  body: {
    objective: objective,
    max_results: maxResults,
    mode: 'one-shot',
    source_policy: {
      after_date: afterDateStr,
    },
    excerpts: {
      max_chars_per_result: maxCharsPerResult,
      max_chars_total: maxCharsPerResult * maxResults,
    },
  },
};

try {
  const response = await ld.request(options);

  if (response.status !== 200) {
    return {
      error: true,
      message: `API returned status ${response.status}`,
      details: response.json,
    };
  }

  const data = response.json;
  const results = (data.results || []).map(r => ({
    title: r.title,
    url: r.url,
    publishedDate: r.publish_date || null,
    excerpt: r.excerpts?.join('\n\n') || '',
  }));

  return {
    objective: objective,
    searchId: data.search_id,
    results: results,
    resultCount: results.length,
    dateFilter: `Last ${daysBack} days`,
    timestamp: new Date().toISOString(),
  };
} catch (error) {
  return {
    error: true,
    message: 'Search request failed',
    details: error.message,
  };
}
