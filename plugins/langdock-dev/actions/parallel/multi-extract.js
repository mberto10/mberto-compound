// name = Parallel Multi-URL Extract
// description = Extract and compare content from multiple URLs in a single call. Ideal for comparative analysis across sources.

// urls = JSON array of URLs to extract (e.g. '["https://example1.com", "https://example2.com"]') - max 5 URLs
// objective = What to extract/compare across all URLs (e.g. 'Extract pricing and features for comparison')
// excerpts = Return focused excerpts aligned to objective (default: true)
// full_content = Return complete page content as markdown (default: false)

const urlsInput = data.input.urls;
const objective = data.input.objective;
const excerpts = data.input.excerpts !== false; // default true
const fullContent = data.input.full_content === true; // default false

if (!urlsInput) {
  return {
    error: true,
    message: 'urls is required - provide a JSON array of URLs',
  };
}

if (!objective) {
  return {
    error: true,
    message: 'objective is required - describe what to extract from the URLs',
  };
}

// Parse URLs
let urls;
try {
  urls = JSON.parse(urlsInput);
} catch (e) {
  return {
    error: true,
    message: 'urls must be a valid JSON array of URL strings',
  };
}

if (!Array.isArray(urls) || urls.length === 0) {
  return {
    error: true,
    message: 'urls must be a non-empty array',
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
