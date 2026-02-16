// name = Run Screener
// description = Runs EODHD screener with optional filters/signals and returns rows plus extracted symbols.
//
// filters = Optional JSON string for EODHD screener filters
// signals = Optional comma-separated screener signals
// sort = Optional sort field (default: market_capitalization.desc)
// limit = Max rows (default: 50, min: 1, max: 500)
// offset = Pagination offset (default: 0, min: 0)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

const filtersInput = (data.input.filters || '').toString().trim();
const signalsInput = (data.input.signals || '').toString().trim();
const sortInput = (data.input.sort || 'market_capitalization.desc').toString().trim();

function clampNumber(value, fallback, minValue, maxValue) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

const limit = clampNumber(data.input.limit, 50, 1, 500);
const offset = clampNumber(data.input.offset, 0, 0, 1000000);

let parsedFilters = null;
if (filtersInput) {
  try {
    parsedFilters = JSON.parse(filtersInput);
  } catch (e) {
    return { error: true, message: 'filters must be valid JSON.', details: e.message };
  }
}

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  params.push(key + '=' + encodeURIComponent(str));
}

async function fetchJson(url, label) {
  const response = await ld.request({
    url,
    method: 'GET',
    headers: { Accept: 'application/json' },
    body: null,
  });

  if (response.status < 200 || response.status >= 300) {
    const err = new Error(label + ' request failed');
    err.status = response.status;
    err.details = response.json || null;
    throw err;
  }

  return response.json;
}

function extractSymbol(row) {
  const code = (row.code || row.Code || row.ticker || '').toString().trim().toUpperCase();
  if (!code) return null;
  if (code.indexOf('.') !== -1) return code;
  const exchange = (row.exchange || row.Exchange || '').toString().trim().toUpperCase();
  if (!exchange) return null;
  return code + '.' + exchange;
}

function dedupe(items) {
  const out = [];
  const seen = {};
  for (let i = 0; i < items.length; i++) {
    const value = (items[i] || '').toString().trim();
    if (!value || seen[value]) continue;
    seen[value] = true;
    out.push(value);
  }
  return out;
}

try {
  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  addParam(params, 'sort', sortInput);
  addParam(params, 'limit', limit);
  addParam(params, 'offset', offset);
  if (parsedFilters) addParam(params, 'filters', JSON.stringify(parsedFilters));
  if (signalsInput) addParam(params, 'signals', signalsInput);

  const url = `https://eodhd.com/api/screener?${params.join('&')}`;
  const payload = await fetchJson(url, 'screener');
  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.results) ? payload.results : []));

  const symbols = dedupe(rows.map(extractSymbol).filter(Boolean));

  return {
    data: {
      rows,
      symbols,
      count: rows.length,
    },
    endpointDiagnostics: {
      endpoint: '/api/screener',
      parameters: {
        limit,
        offset,
        sort: sortInput,
        hasFilters: !!parsedFilters,
        signals: signalsInput || null,
      },
    },
    metadata: {
      source: 'EODHD atomic action: run_screener',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'run_screener failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}

