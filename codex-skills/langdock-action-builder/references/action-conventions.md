# Action Conventions

Use this template shape for generated Langdock actions.

## Metadata Header

```javascript
// name = Action Name In Title Case
// description = One-line description
//
// requiredParam = Description (e.g. 'value')
// optionalParam = Description (default: 'default')
```

## Skeleton

```javascript
const requiredParam = data.input.requiredParam;
const optionalParam = data.input.optionalParam || 'default';

const options = {
  url: `https://api.example.com/resource/${encodeURIComponent(requiredParam)}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: null,
};

try {
  const response = await ld.request(options);

  if (response.status < 200 || response.status >= 300) {
    return {
      error: true,
      status: response.status,
      message: `API error: ${response.status}`,
    };
  }

  const payload = response.json;
  return {
    data: payload,
    metadata: {
      source: 'API Name',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: error.message,
  };
}
```

## Auth Mapping

- Query key: `...apikey=${data.auth.apikey}`
- Bearer token: `Authorization: \`Bearer ${data.auth.apiKey}\``
- API key header: `'X-API-Key': data.auth.api_key`
- OAuth token: `Authorization: \`Bearer ${data.auth.access_token}\``

## Generation Checklist

1. Validate required input fields.
2. Apply defaults for optional inputs.
3. Encode user-provided URL segments.
4. Add deterministic status/error handling.
5. Transform response if raw payload is noisy.
6. Return a structured object.
