---
name: langdock-action-patterns
description: This skill should be used when the user asks to "build a langdock action", "create langdock integration", "write action script for langdock", "langdock ld.request", "langdock metadata format", or needs guidance on Langdock action conventions, authentication patterns, and script structure.
---

# Langdock Action Patterns

Build production-ready Langdock integration actions that connect external APIs to Langdock assistants.

## When to Use

- Creating new Langdock actions for third-party APIs
- Understanding Langdock action conventions and patterns
- Debugging or fixing existing Langdock action scripts
- Converting API documentation into Langdock actions

## Workflow for Building Actions

### Step 1: Fetch API Documentation

Before writing any code, fetch the target API's documentation:

```
Use WebFetch to retrieve API documentation from the provider's docs URL.
Extract: endpoints, authentication method, required parameters, response format.
```

### Step 2: Analyze API Requirements

Identify these key aspects:
- **Authentication**: API key in URL, Bearer token, OAuth, or custom header
- **Endpoints**: Base URL and path structure
- **Parameters**: Required vs optional, types, defaults
- **Response**: JSON structure, pagination, error formats

### Step 3: Write the Action Script

Follow the exact Langdock conventions below.

---

## Metadata Format (Required)

Every action script MUST start with metadata comments:

```javascript
// name = Action Name In Title Case
// description = One-line description of what this action does

// parameterName = Description of parameter (e.g. 'example value')
// optionalParam = Description with default (default: 'someValue')
```

**Rules:**
- `name` and `description` are required
- One parameter comment per line
- Include type hints and examples in descriptions
- Note default values where applicable

---

## Authentication Patterns

### Pattern A: API Key in Query String

```javascript
const options = {
  url: `https://api.example.com/endpoint?apikey=${data.auth.apikey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  body: null,
};
```

**Note:** Use lowercase `apikey` for query string auth.

### Pattern B: Bearer Token in Header

```javascript
const options = {
  url: 'https://api.example.com/endpoint',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: { /* request body */ },
};
```

**Note:** Use camelCase `apiKey` for Bearer auth.

### Pattern C: API Key in Header

```javascript
const options = {
  url: 'https://api.example.com/endpoint',
  method: 'GET',
  headers: {
    'X-API-Key': data.auth.api_key,
    'Content-Type': 'application/json',
  },
  body: null,
};
```

### Pattern D: OAuth 2.0

```javascript
const options = {
  url: 'https://api.example.com/endpoint',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${data.auth.access_token}`,
    'Content-Type': 'application/json',
  },
  body: null,
};
```

**Note:** Langdock handles token refresh automatically for OAuth connections.

---

## Input Parameter Access

Access user inputs via `data.input.parameterName`:

```javascript
// Required parameter
const symbol = data.input.symbol;

// Optional with default
const limit = data.input.limit || 10;

// Conditional inclusion
const params = new URLSearchParams();
params.append('symbol', data.input.symbol);
if (data.input.startDate) {
  params.append('from', data.input.startDate);
}
```

### Input Types

| Type | Access Pattern | Example |
|------|----------------|---------|
| TEXT | `data.input.fieldId` | String value |
| NUMBER | `data.input.fieldId` | Numeric value |
| BOOLEAN | `data.input.fieldId` | true/false |
| SELECT | `data.input.fieldId` | Selected option value |
| FILE | `data.input.fieldId` | `{fileName, mimeType, base64}` |
| OBJECT | `data.input.fieldId` | Parsed JSON object |

---

## Request Structure

### GET Request

```javascript
// name = Get Stock Quote
// description = Retrieves current stock quote for a symbol

// symbol = Stock ticker symbol (e.g. 'AAPL')

const options = {
  url: `https://api.example.com/quote/${data.input.symbol}?apikey=${data.auth.apikey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: null,
};

const response = await ld.request(options);
return response.json;
```

### POST Request

```javascript
// name = Create Task
// description = Creates a new task in the project management system

// title = Task title
// description = Task description (optional)
// priority = Task priority (default: 'medium')

const options = {
  url: 'https://api.example.com/tasks',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: {
    title: data.input.title,
    description: data.input.description || '',
    priority: data.input.priority || 'medium',
  },
};

const response = await ld.request(options);
return response.json;
```

---

## Response Handling

### Simple Return

```javascript
const response = await ld.request(options);
return response.json;
```

### With Transformation

```javascript
const response = await ld.request(options);
const data = response.json;

return {
  symbol: data.symbol,
  price: data.latestPrice,
  change: data.change,
  changePercent: `${(data.changePercent * 100).toFixed(2)}%`,
};
```

### File Downloads

```javascript
const options = {
  url: 'https://api.example.com/file/123',
  method: 'GET',
  headers: { Authorization: `Bearer ${data.auth.apiKey}` },
  responseType: 'binary', // or 'stream'
};

const response = await ld.request(options);

return {
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
  buffer: response.buffer,
};
```

---

## Error Handling

```javascript
try {
  const response = await ld.request(options);

  if (response.status !== 200) {
    return {
      error: true,
      message: `API returned status ${response.status}`,
      details: response.json,
    };
  }

  return response.json;
} catch (error) {
  return {
    error: true,
    message: 'Request failed',
    details: error.message,
  };
}
```

---

## Built-in Functions

| Function | Purpose |
|----------|---------|
| `ld.request(options)` | Execute HTTP request |
| `ld.log(...values)` | Debug output (visible in test results) |
| `JSON.stringify(obj)` | Serialize to JSON |
| `JSON.parse(str)` | Parse JSON string |
| `btoa(str)` | Base64 encode |
| `atob(str)` | Base64 decode |
| `encodeURIComponent(str)` | URL encode |

---

## Sandbox Limitations

- **CPU**: 120 seconds max
- **Memory**: 128 MB max
- **No external libraries**: Only built-in JS/Node APIs
- **No file system access**: Cannot read/write files
- **Top-level async**: Use async/await directly

---

## Complete Example

```javascript
// name = Get Company Financials
// description = Retrieves income statement and balance sheet for a company

// symbol = Stock ticker symbol (e.g. 'AAPL')
// period = Reporting period: 'annual' or 'quarterly' (default: 'annual')
// limit = Number of periods to return (default: 4)

const symbol = data.input.symbol;
const period = data.input.period || 'annual';
const limit = data.input.limit || 4;

const options = {
  url: `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=${period}&limit=${limit}&apikey=${data.auth.apikey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: null,
};

try {
  const response = await ld.request(options);

  if (response.status !== 200) {
    return { error: true, message: `API error: ${response.status}` };
  }

  return {
    symbol: symbol,
    period: period,
    data: response.json,
    retrieved: new Date().toISOString(),
  };
} catch (error) {
  return { error: true, message: error.message };
}
```

---

## Checklist Before Finalizing

- [ ] Metadata comments at top with name, description, parameters
- [ ] Correct auth pattern for the API (`apikey` vs `apiKey` vs `api_key`)
- [ ] All required parameters accessed via `data.input.*`
- [ ] Default values for optional parameters
- [ ] Proper error handling with try/catch
- [ ] Response returned as object (not string)
- [ ] URL parameters properly encoded with `encodeURIComponent` if needed
