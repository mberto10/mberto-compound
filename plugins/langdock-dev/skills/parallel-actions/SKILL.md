---
name: langdock-parallel-actions
description: This skill should be used when the user asks to "combine multiple api calls", "parallel langdock action", "batch requests in langdock", "Promise.all langdock", "multi-endpoint action", or needs to build Langdock actions that efficiently combine multiple API calls with proper error handling.
---

# Langdock Parallel Actions

Build efficient Langdock actions that combine multiple API calls with parallel execution and fault tolerance.

## When to Use

- Combining data from multiple API endpoints in one action
- Reducing the number of action calls needed by assistants
- Building dashboard-style data aggregation actions
- Implementing fault-tolerant multi-request patterns

## Execution Patterns

### Pattern A: Pure Parallel (Independent Calls)

Use when all API calls are independent and can run simultaneously:

```javascript
// name = Get Full Stock Data
// description = Fetches quote, profile, and news in parallel

// symbol = Stock ticker symbol (e.g. 'AAPL')

const symbol = data.input.symbol;
const apikey = data.auth.apikey;
const baseUrl = 'https://financialmodelingprep.com/api/v3';

const [quoteRes, profileRes, newsRes] = await Promise.all([
  ld.request({
    url: `${baseUrl}/quote/${symbol}?apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/profile/${symbol}?apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/stock_news?tickers=${symbol}&limit=5&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
]);

return {
  symbol: symbol,
  quote: quoteRes.json[0],
  profile: profileRes.json[0],
  news: newsRes.json,
  timestamp: new Date().toISOString(),
};
```

### Pattern B: Fault-Tolerant Parallel

Use when partial success is acceptable and you need to handle failures gracefully:

```javascript
// name = Get Market Overview
// description = Fetches multiple market indicators, continues on partial failure

// indices = Comma-separated index symbols (default: 'SPY,QQQ,DIA')

const indices = (data.input.indices || 'SPY,QQQ,DIA').split(',');
const apikey = data.auth.apikey;

const requests = indices.map(symbol =>
  ld.request({
    url: `https://api.example.com/quote/${symbol.trim()}?apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  })
);

const results = await Promise.allSettled(requests);

const successful = [];
const failed = [];

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    successful.push({
      symbol: indices[index],
      data: result.value.json,
    });
  } else {
    failed.push({
      symbol: indices[index],
      error: result.reason?.message || 'Unknown error',
    });
  }
});

return {
  data: successful,
  errors: failed,
  successCount: successful.length,
  failCount: failed.length,
  timestamp: new Date().toISOString(),
};
```

### Pattern C: Sequential with Parallel Groups

Use when some calls depend on results from previous calls:

```javascript
// name = Get Company Details with Financials
// description = First fetches company info, then fetches related financials in parallel

// symbol = Stock ticker symbol (e.g. 'AAPL')

const symbol = data.input.symbol;
const apikey = data.auth.apikey;
const baseUrl = 'https://financialmodelingprep.com/api/v3';

// Step 1: Get base company data (needed for some subsequent calls)
const profileRes = await ld.request({
  url: `${baseUrl}/profile/${symbol}?apikey=${apikey}`,
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: null,
});

const profile = profileRes.json[0];

// Step 2: Parallel calls that may use data from step 1
const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
  ld.request({
    url: `${baseUrl}/income-statement/${symbol}?limit=4&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/balance-sheet-statement/${symbol}?limit=4&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/cash-flow-statement/${symbol}?limit=4&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
]);

return {
  symbol: symbol,
  company: {
    name: profile.companyName,
    industry: profile.industry,
    sector: profile.sector,
    marketCap: profile.mktCap,
  },
  financials: {
    incomeStatement: incomeRes.json,
    balanceSheet: balanceRes.json,
    cashFlow: cashFlowRes.json,
  },
  timestamp: new Date().toISOString(),
};
```

### Pattern D: Dynamic Parallel Based on First Call

Use when the first call determines what subsequent calls to make:

```javascript
// name = Get Portfolio Summary
// description = Fetches details for all positions in a portfolio

// portfolioId = Portfolio ID to fetch

const portfolioRes = await ld.request({
  url: `https://api.example.com/portfolios/${data.input.portfolioId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: null,
});

const positions = portfolioRes.json.positions;

// Build parallel requests based on portfolio contents
const detailRequests = positions.map(position =>
  ld.request({
    url: `https://api.example.com/quote/${position.symbol}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${data.auth.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: null,
  })
);

const detailResults = await Promise.allSettled(detailRequests);

const enrichedPositions = positions.map((position, index) => {
  const result = detailResults[index];
  return {
    ...position,
    currentPrice: result.status === 'fulfilled' ? result.value.json.price : null,
    fetchError: result.status === 'rejected' ? result.reason?.message : null,
  };
});

return {
  portfolioId: data.input.portfolioId,
  positions: enrichedPositions,
  totalPositions: positions.length,
  timestamp: new Date().toISOString(),
};
```

---

## Response Structure Best Practices

Always return a well-organized object:

```javascript
return {
  // Primary data from main request(s)
  primaryData: response1.json,
  secondaryData: response2.json,

  // Metadata for context
  metadata: {
    requestedSymbol: data.input.symbol,
    timestamp: new Date().toISOString(),
    requestCount: 3,
    successCount: 3,
  },

  // Error tracking (if using allSettled)
  errors: failedRequests,
};
```

---

## Error Handling Strategies

### Strategy 1: Fail Fast (Promise.all)

All requests must succeed or entire action fails:

```javascript
try {
  const [res1, res2, res3] = await Promise.all([
    ld.request(options1),
    ld.request(options2),
    ld.request(options3),
  ]);
  return { data1: res1.json, data2: res2.json, data3: res3.json };
} catch (error) {
  return { error: true, message: error.message };
}
```

### Strategy 2: Partial Success (Promise.allSettled)

Continue with available data even if some requests fail:

```javascript
const results = await Promise.allSettled([
  ld.request(options1),
  ld.request(options2),
  ld.request(options3),
]);

const data = {};
const errors = [];

if (results[0].status === 'fulfilled') {
  data.quotes = results[0].value.json;
} else {
  errors.push({ source: 'quotes', error: results[0].reason?.message });
}

if (results[1].status === 'fulfilled') {
  data.profile = results[1].value.json;
} else {
  errors.push({ source: 'profile', error: results[1].reason?.message });
}

if (results[2].status === 'fulfilled') {
  data.news = results[2].value.json;
} else {
  errors.push({ source: 'news', error: results[2].reason?.message });
}

return { ...data, errors, hasErrors: errors.length > 0 };
```

### Strategy 3: Fallback Values

Provide defaults when requests fail:

```javascript
const results = await Promise.allSettled([
  ld.request(quotesOptions),
  ld.request(newsOptions),
]);

return {
  quotes: results[0].status === 'fulfilled' ? results[0].value.json : [],
  news: results[1].status === 'fulfilled' ? results[1].value.json : [],
  dataComplete: results.every(r => r.status === 'fulfilled'),
};
```

---

## Rate Limiting Considerations

When making many parallel requests, consider:

1. **Batch size limits**: Some APIs limit concurrent requests
2. **Chunking**: Split large request arrays into smaller batches

```javascript
// Helper function to chunk array
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Process in batches of 5
const symbols = data.input.symbols.split(',');
const batches = chunk(symbols, 5);
const allResults = [];

for (const batch of batches) {
  const batchResults = await Promise.all(
    batch.map(symbol =>
      ld.request({
        url: `https://api.example.com/quote/${symbol}?apikey=${data.auth.apikey}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      })
    )
  );
  allResults.push(...batchResults.map(r => r.json));
}

return { quotes: allResults };
```

---

## Metadata for Parallel Actions

```javascript
// name = Combined Financial Data
// description = Fetches income statement, balance sheet, and cash flow in parallel

// symbol = Stock ticker symbol (e.g. 'AAPL')
// period = Reporting period: 'annual' or 'quarterly' (default: 'annual')
// dataPoints = Comma-separated data to fetch: income,balance,cashflow (default: 'income,balance,cashflow')
```

---

## Complete Production Example

```javascript
// name = Comprehensive Stock Analysis
// description = Fetches quote, profile, financials, and news in optimized parallel batches

// symbol = Stock ticker symbol (e.g. 'AAPL')
// includeNews = Include recent news (default: true)
// financialPeriods = Number of financial periods (default: 4)

const symbol = data.input.symbol;
const includeNews = data.input.includeNews !== false;
const periods = data.input.financialPeriods || 4;
const apikey = data.auth.apikey;
const baseUrl = 'https://financialmodelingprep.com/api/v3';

// Build request list based on options
const requests = [
  ld.request({
    url: `${baseUrl}/quote/${symbol}?apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/profile/${symbol}?apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/income-statement/${symbol}?limit=${periods}&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
  ld.request({
    url: `${baseUrl}/key-metrics/${symbol}?limit=${periods}&apikey=${apikey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: null,
  }),
];

if (includeNews) {
  requests.push(
    ld.request({
      url: `${baseUrl}/stock_news?tickers=${symbol}&limit=5&apikey=${apikey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: null,
    })
  );
}

const results = await Promise.allSettled(requests);

const getValue = (index) =>
  results[index].status === 'fulfilled' ? results[index].value.json : null;

const getError = (index) =>
  results[index].status === 'rejected' ? results[index].reason?.message : null;

const errors = [];
if (getError(0)) errors.push({ source: 'quote', error: getError(0) });
if (getError(1)) errors.push({ source: 'profile', error: getError(1) });
if (getError(2)) errors.push({ source: 'financials', error: getError(2) });
if (getError(3)) errors.push({ source: 'metrics', error: getError(3) });
if (includeNews && getError(4)) errors.push({ source: 'news', error: getError(4) });

return {
  symbol: symbol,
  quote: getValue(0)?.[0] || null,
  profile: getValue(1)?.[0] || null,
  financials: getValue(2) || [],
  metrics: getValue(3) || [],
  news: includeNews ? (getValue(4) || []) : null,
  metadata: {
    timestamp: new Date().toISOString(),
    requestCount: requests.length,
    successCount: results.filter(r => r.status === 'fulfilled').length,
    includesNews: includeNews,
    periodCount: periods,
  },
  errors: errors.length > 0 ? errors : null,
};
```

---

## Checklist for Parallel Actions

- [ ] Identify independent vs dependent API calls
- [ ] Use `Promise.all` for strict requirements, `Promise.allSettled` for fault tolerance
- [ ] Structure sequential calls before parallel groups when needed
- [ ] Include error tracking in response
- [ ] Add metadata about request count and success rate
- [ ] Consider rate limiting and batch if necessary
- [ ] Return well-structured, predictable response format
