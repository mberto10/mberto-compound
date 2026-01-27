// name = Parallel Multi-URL Extract
// description = Extrahiert und vergleicht Inhalte aus mehreren URLs. Ideal für vergleichende Analysen.

// urls = Komma-getrennte URLs, z.B. "https://example1.com, https://example2.com" (Required, max 5)
// objective = Was extrahiert/verglichen werden soll (Required, z.B. 'Preise und Features vergleichen')
// excerpts = Fokussierte Auszüge zurückgeben (default: true)
// full_content = Vollständigen Seiteninhalt als Markdown zurückgeben (default: false)

// Parse comma-separated URLs
const urlsInput = data.input.urls || '';
const urls = urlsInput
  .split(',')
  .map(u => u.trim())
  .filter(u => u.length > 0);
const objective = data.input.objective;
const excerpts = data.input.excerpts !== false; // default true
const fullContent = data.input.fullContent === true; // default false

if (urls.length === 0) {
  return {
    error: true,
    message: 'urls is required - provide comma-separated URLs',
  };
}

if (!objective) {
  return {
    error: true,
    message: 'objective is required - describe what to extract from the URLs',
  };
}

if (urls.length > 5) {
  return {
    error: true,
    message: 'Maximum 5 URLs allowed per request',
  };
}

// Validate each URL
for (const url of urls) {
  try {
    new URL(url);
  } catch (e) {
    return {
      error: true,
      message: `Invalid URL format: ${url}`,
    };
  }
}

const options = {
  url: 'https://api.parallel.ai/v1beta/extract',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
    'parallel-beta': 'search-extract-2025-10-10',
  },
  body: {
    urls: urls,
    objective: objective,
    excerpts: excerpts,
    full_content: fullContent,
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

  // Process results
  const results = (data.results || []).map(r => ({
    url: r.url,
    title: r.title || null,
    publishedDate: r.publish_date || null,
    excerpts: r.excerpts || [],
    fullContent: r.full_content || null,
  }));

  // Identify any errors
  const errors = data.errors || [];
  const successfulUrls = results.map(r => r.url);
  const failedUrls = urls.filter(u => !successfulUrls.includes(u));

  return {
    extractId: data.extract_id,
    objective: objective,
    results: results,
    summary: {
      totalUrls: urls.length,
      successful: results.length,
      failed: failedUrls.length,
    },
    errors: errors.length > 0 ? errors : null,
    failedUrls: failedUrls.length > 0 ? failedUrls : null,
    timestamp: new Date().toISOString(),
  };
} catch (error) {
  return {
    error: true,
    message: 'Multi-extract request failed',
    details: error.message,
  };
}
