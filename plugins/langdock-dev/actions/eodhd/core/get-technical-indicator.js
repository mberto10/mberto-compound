// name = Get Technical Indicator
// description = Fetches one technical indicator series for a symbol from EODHD technical endpoint.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// function = Indicator function (required, e.g. rsi, sma, ema, macd)
// period = Optional indicator period (default: 14)
// from = Optional YYYY-MM-DD date lower bound
// to = Optional YYYY-MM-DD date upper bound
// order = Optional order a|d (default: d)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
const indicatorFunction = (data.input.function || '').toString().trim().toLowerCase();
const from = (data.input.from || '').toString().trim();
const to = (data.input.to || '').toString().trim();
const order = (data.input.order || 'd').toString().trim().toLowerCase();

function clampNumber(value, fallback, minValue, maxValue) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

const period = clampNumber(data.input.period, 14, 1, 500);

if (!symbol) return { error: true, message: 'symbol is required.' };
if (!indicatorFunction) return { error: true, message: 'function is required (e.g. rsi, sma, ema, macd).' };
if (order !== 'a' && order !== 'd') return { error: true, message: 'order must be a or d.' };

function isValidDateString(dateStr) {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

if (!isValidDateString(from)) return { error: true, message: 'from must be YYYY-MM-DD.' };
if (!isValidDateString(to)) return { error: true, message: 'to must be YYYY-MM-DD.' };
if (from && to && from > to) return { error: true, message: 'from must be <= to.' };

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  params.push(key + '=' + encodeURIComponent(str));
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

function normalizeRows(payload) {
  if (!Array.isArray(payload)) return [];
  const out = [];
  for (let i = 0; i < payload.length; i++) {
    const row = payload[i] || {};
    const normalized = {
      date: (row.date || row.datetime || '').toString() || null,
      timestamp: safeNumber(row.timestamp),
      value: null,
      raw: row,
    };

    const keys = Object.keys(row);
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (key === 'date' || key === 'datetime' || key === 'timestamp') continue;
      const n = safeNumber(row[key]);
      if (Number.isFinite(n)) {
        normalized.value = n;
        normalized.indicatorKey = key;
        break;
      }
    }
    out.push(normalized);
  }
  return out;
}

try {
  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  addParam(params, 'function', indicatorFunction);
  addParam(params, 'period', period);
  addParam(params, 'order', order);
  addParam(params, 'from', from);
  addParam(params, 'to', to);

  const url = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?${params.join('&')}`;
  const payload = await fetchJson(url, 'technical');
  const rows = normalizeRows(payload);

  return {
    data: {
      symbol,
      function: indicatorFunction,
      rows,
      latest: rows.length > 0 ? rows[0] : null,
    },
    endpointDiagnostics: {
      endpoint: '/api/technical/{symbol}',
      parameters: { symbol, function: indicatorFunction, period, order, from: from || null, to: to || null },
      rowCount: rows.length,
    },
    metadata: {
      source: 'EODHD atomic action: get_technical_indicator',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_technical_indicator failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}

