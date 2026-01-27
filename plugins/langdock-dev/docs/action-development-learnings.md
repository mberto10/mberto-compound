# Langdock Action Development: Learnings & Best Practices

This document captures lessons learned from developing and debugging Langdock custom actions.

---

## 1. Parameter Naming: Snake_case vs CamelCase

### The Problem
Parameters defined in comment headers with snake_case (e.g., `max_per_query`) are automatically converted to camelCase when accessed via `data.input`.

### Example
```javascript
// Comment header (user-facing parameter name)
// max_per_query = Maximum results per query (default: 3)

// WRONG - This won't work!
const maxPerQuery = data.input.max_per_query;  // undefined!

// CORRECT - Langdock converts to camelCase
const maxPerQuery = data.input.maxPerQuery;
```

### Rule
- **Comment headers**: Use snake_case for user-facing parameter names
- **Code access**: Use camelCase when accessing `data.input.*`

---

## 2. Input Format: Prefer Comma-Separated Over JSON

### The Problem
JSON array inputs are harder for LLMs to generate correctly and can cause parsing errors on the platform.

### Before (JSON - problematic)
```javascript
// queries = JSON array of queries (e.g. '["query1", "query2"]')
const queries = JSON.parse(data.input.queries);
```

### After (Comma-separated - better)
```javascript
// queries = Komma-getrennte Suchanfragen, z.B. "Frage 1, Frage 2, Frage 3" (Required)
const queriesInput = data.input.queries || '';
const queries = queriesInput
  .split(',')
  .map(q => q.trim())
  .filter(q => q.length > 0);
```

### Benefits
- Simpler for LLMs to generate
- No JSON parsing errors
- More forgiving of whitespace/formatting
- Better error messages

---

## 3. Async/Await Pattern for ld.request

### The Problem
Langdock requires each `ld.request` call to be properly awaited. Using `.map()` without async/await causes issues.

### WRONG
```javascript
const requests = queries.map(query => ld.request({...}));
const results = await Promise.all(requests);
```

### CORRECT
```javascript
const requests = queries.map(async (query) => {
  const response = await ld.request({...});
  return response;
});
const results = await Promise.allSettled(requests);
```

### Key Points
- Each `ld.request` must be individually awaited
- Use `Promise.allSettled` (not `Promise.all`) to handle individual failures gracefully

---

## 4. Error Handling: Always Return Valid Output

### The Problem
If an action crashes without returning anything, Langdock shows: `"No tool output found for function call toolu_..."`. This happens when exceptions are uncaught.

### Solution: Double Try-Catch Pattern

```javascript
try {
  // Main action logic
  const results = await Promise.allSettled(requests);

  const processedResults = items.map((item, index) => {
    try {
      // Process each result with its own try-catch
      const result = results[index];
      if (result.status === 'fulfilled' && result.value) {
        return { status: 'success', data: result.value.json || {} };
      } else {
        return { status: 'error', error: result.reason?.message || 'Failed' };
      }
    } catch (parseError) {
      // Per-item error handling
      return { status: 'error', error: `Parse error: ${parseError.message}` };
    }
  });

  return { results: processedResults, timestamp: new Date().toISOString() };

} catch (error) {
  // Global error handler - ALWAYS returns something
  return {
    error: true,
    message: 'Action failed',
    details: error.message,
  };
}
```

### Key Points
1. **Outer try-catch**: Wraps entire action, catches any unhandled error
2. **Inner try-catch**: Wraps each result processing, one bad item won't crash everything
3. **Always return an object**: Never let the action exit without returning

---

## 5. Safe Property Access

### The Problem
Accessing nested properties on undefined values causes crashes.

### WRONG
```javascript
const response = result.value.json;  // Crashes if result.value is undefined
const excerpt = r.excerpts.join('\n');  // Crashes if excerpts is undefined
```

### CORRECT
```javascript
const response = result.value?.json || {};
const excerpt = Array.isArray(r.excerpts) ? r.excerpts.join('\n') : (r.excerpts || '');

// For mapped objects, provide fallbacks
const sources = (response.results || []).map(r => ({
  title: r.title || '',
  url: r.url || '',
  date: r.publish_date || null,
}));
```

### Patterns
- `?.` - Optional chaining for potentially undefined parents
- `|| {}` - Fallback to empty object
- `|| []` - Fallback to empty array
- `|| ''` - Fallback to empty string
- `|| null` - Explicit null for optional fields

---

## 6. Updating Assistant Documentation

### The Problem
When action input formats change, assistant system prompts may still reference the old format.

### Checklist After Changing Action Parameters
1. Search all assistants for references to the changed action
2. Update parameter descriptions (e.g., "JSON-Array" → "komma-getrennt")
3. Update all code examples in the assistant prompts
4. Change code block language hints (`json` → plain)

### Example Update
```markdown
<!-- BEFORE -->
**Parameter:** queries (JSON-Array)
```json
["Query 1", "Query 2", "Query 3"]
```

<!-- AFTER -->
**Parameter:** queries (komma-getrennt)
```
queries: Query 1, Query 2, Query 3
```
```

---

## 7. Debugging Platform Errors

### Common Errors and Causes

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `"No tool output found"` | Action crashed without returning | Add try-catch wrapper |
| `"encrypted content could not be verified"` | Platform issue | Retry or contact Langdock |
| `401 Unauthorized` | Invalid API key | Check credentials in Langdock settings |
| `"[object Object] is not valid JSON"` | Platform auto-parsing JSON | Use string input instead |
| `"must be string at /queries"` | Type mismatch | Check parameter type in comment header |

### Not Our Code
These errors are platform-level, not action bugs:
- Encryption/verification errors
- `toolu_vrtx_...` function call IDs
- Generic "generating response failed"

---

## 8. Action Template

Use this template for new batch-processing actions:

```javascript
// name = Action Name
// description = Description in German

// param_one = Description (Required)
// param_two = Description (default: value)

const paramOne = data.input.paramOne;  // Note: camelCase access
const paramTwo = data.input.paramTwo || 'default';

// Input validation
if (!paramOne) {
  return {
    error: true,
    message: 'param_one is required',
  };
}

try {
  // Build requests
  const requests = items.map(async (item) => {
    const response = await ld.request({
      url: 'https://api.example.com/endpoint',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { /* ... */ },
    });
    return response;
  });

  // Execute in parallel
  const results = await Promise.allSettled(requests);

  // Process with per-item error handling
  const processed = items.map((item, index) => {
    try {
      const result = results[index];
      if (result.status === 'fulfilled' && result.value?.status === 200) {
        const data = result.value.json || {};
        return {
          status: 'success',
          // ... processed fields with fallbacks
        };
      } else {
        return {
          status: 'error',
          error: result.reason?.message || `Status ${result.value?.status}`,
        };
      }
    } catch (parseError) {
      return {
        status: 'error',
        error: `Parse error: ${parseError.message}`,
      };
    }
  });

  // Return structured result
  return {
    results: processed,
    summary: {
      total: items.length,
      successful: processed.filter(r => r.status === 'success').length,
      failed: processed.filter(r => r.status === 'error').length,
    },
    timestamp: new Date().toISOString(),
  };

} catch (error) {
  return {
    error: true,
    message: 'Action failed',
    details: error.message,
  };
}
```

---

## Summary Checklist

Before deploying a Langdock action:

- [ ] Parameters accessed with camelCase (`data.input.paramName`)
- [ ] Simple input formats (comma-separated > JSON)
- [ ] Each `ld.request` is awaited
- [ ] Outer try-catch wraps entire action
- [ ] Inner try-catch for each result processing
- [ ] Safe property access with fallbacks
- [ ] Always returns a valid object
- [ ] Assistant prompts updated if format changed
