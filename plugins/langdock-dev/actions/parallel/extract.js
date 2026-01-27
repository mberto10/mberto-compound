// name = Parallel URL Extract
// description = Convert any public URL into clean, LLM-ready markdown content. Handles JavaScript-rendered sites and PDFs.

// url = Public URL to extract content from (e.g. 'https://example.com/article')
// objective = Focus extraction on specific goals (optional, e.g. 'Extract the pricing information')
// excerpts = Return focused excerpts aligned to objective (default: true)
// full_content = Return complete page content as markdown (default: false)

const url = data.input.url;
const objective = data.input.objective || null;
const excerpts = data.input.excerpts !== false; // default true
const fullContent = data.input.fullContent === true; // default false

if (!url) {
  return {
    error: true,
    message: 'url is required - provide a public URL to extract content from',
  };
}

// Validate URL format
try {
  new URL(url);
} catch (e) {
  return {
    error: true,
    message: 'Invalid URL format provided',
  };
}

const requestBody = {
  urls: [url],
  excerpts: excerpts,
  full_content: fullContent,
};

// Only add objective if provided
if (objective) {
  requestBody.objective = objective;
}

const options = {
  url: 'https://api.parallel.ai/v1beta/extract',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
    'parallel-beta': 'search-extract-2025-10-10',
  },
  body: requestBody,
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

  // Handle errors array
  if (data.errors && data.errors.length > 0) {
    return {
      error: true,
      message: 'Extraction failed for URL',
      details: data.errors,
    };
  }

  const result = data.results?.[0];

  if (!result) {
    return {
      error: true,
      message: 'No content extracted from URL',
    };
  }

  return {
    extractId: data.extract_id,
    url: result.url,
    title: result.title || null,
    publishedDate: result.publish_date || null,
    excerpts: result.excerpts || [],
    fullContent: result.full_content || null,
    objective: objective,
    timestamp: new Date().toISOString(),
  };
} catch (error) {
  return {
    error: true,
    message: 'Extract request failed',
    details: error.message,
  };
}
