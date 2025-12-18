---
name: create-action
description: Generate a complete Langdock action script from API documentation
allowed-tools:
  - WebFetch
  - WebSearch
  - Read
  - Write
argument-hint: "<api-docs-url-or-description>"
---

# Create Langdock Action

Generate a production-ready Langdock action script based on provided API documentation.

## Input Format

The user provides ONE of:
1. **URL to API documentation** - Fetch and analyze the docs
2. **API description** - Details about endpoint, auth, parameters

## Workflow

### Step 1: Gather API Information

If a URL is provided:
- Use WebFetch to retrieve the API documentation
- Extract: base URL, endpoints, authentication method, parameters, response format

If description is provided:
- Parse the details from the user's description
- Ask for clarification on missing critical info (auth type, required params)

### Step 2: Determine Action Type

Based on the API requirements, determine:
- **Single action**: One endpoint, straightforward request
- **Parallel action**: Multiple related endpoints, can use Promise.all

### Step 3: Generate the Action Script

Create a complete, copy-paste ready JavaScript file following these conventions:

**Metadata format:**
```javascript
// name = Action Name In Title Case
// description = One-line description

// paramName = Parameter description (e.g. 'example')
// optionalParam = Description (default: 'value')
```

**Authentication patterns:**
- API key in URL: `${data.auth.apikey}` (lowercase)
- Bearer token: `Authorization: Bearer ${data.auth.apiKey}` (camelCase)
- API key header: `'X-API-Key': data.auth.api_key`

**Request structure:**
```javascript
const options = {
  url: `https://api.example.com/endpoint`,
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: null,
};

const response = await ld.request(options);
return response.json;
```

### Step 4: Output

Provide the complete action script in a code block, ready to copy into Langdock.

Include:
- All metadata comments
- Proper authentication handling
- Input parameter access via `data.input.*`
- Error handling with try/catch
- Clean response transformation if needed

## Example Output

```javascript
// name = Get Weather Forecast
// description = Retrieves weather forecast for a city

// city = City name (e.g. 'London')
// days = Forecast days (default: 3)

const city = encodeURIComponent(data.input.city);
const days = data.input.days || 3;

const options = {
  url: `https://api.weatherapi.com/v1/forecast.json?key=${data.auth.apikey}&q=${city}&days=${days}`,
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

  const data = response.json;
  return {
    location: data.location.name,
    country: data.location.country,
    current: {
      temp_c: data.current.temp_c,
      condition: data.current.condition.text,
    },
    forecast: data.forecast.forecastday.map(day => ({
      date: day.date,
      maxTemp: day.day.maxtemp_c,
      minTemp: day.day.mintemp_c,
      condition: day.day.condition.text,
    })),
  };
} catch (error) {
  return { error: true, message: error.message };
}
```

## Tips

- Always URL-encode user inputs with `encodeURIComponent()`
- Use default values: `data.input.param || 'default'`
- Return structured objects, not raw API responses when transformation helps
- Include timestamp in response for debugging
- Handle pagination if the API uses it
