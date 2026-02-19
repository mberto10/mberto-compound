# Runtime Caveats

## Default Rule

Use sequential requests by default:

```javascript
const first = await ld.request(firstOptions);
const second = await ld.request(secondOptions);
```

Do not default to `Promise.all` around `ld.request` calls.

## Why

Langdock action validation may reject patterns where `ld.request` calls are wrapped in `Promise.all`, even when valid in generic JavaScript runtimes.

## If User Explicitly Wants Parallel

1. State the validator risk.
2. Provide a sequential fallback implementation.
3. If still requested, provide parallel variant plus warning.

## Safe Response Pattern

When combining multiple calls, preserve partial failures:

```javascript
return {
  data: successfulResults,
  errors: failedResults,
  successCount: successfulResults.length,
  errorCount: failedResults.length,
  timestamp: new Date().toISOString(),
};
```
