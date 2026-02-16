// name = Get Calendar Events
// description = Fetches calendar events from EODHD for a selected calendar type and date window.
//
// calendarType = earnings|dividends|splits|ipos|economic_events (required)
// from = Start date YYYY-MM-DD (required)
// to = End date YYYY-MM-DD (required)
// symbols = Optional comma-separated symbols filter
// limit = Optional max items (default: 100, min: 1, max: 1000)
// offset = Optional pagination offset (default: 0, min: 0)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

const calendarTypeRaw = (data.input.calendarType || '').toString().trim().toLowerCase();
const from = (data.input.from || '').toString().trim();
const to = (data.input.to || '').toString().trim();
const symbols = (data.input.symbols || '').toString().trim();

function clampNumber(value, fallback, minValue, maxValue) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

const limit = clampNumber(data.input.limit, 100, 1, 1000);
const offset = clampNumber(data.input.offset, 0, 0, 1000000);

function isValidDateString(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

if (!calendarTypeRaw) return { error: true, message: 'calendarType is required.' };
if (!from || !to) return { error: true, message: 'from and to are required (YYYY-MM-DD).' };
if (!isValidDateString(from) || !isValidDateString(to)) {
  return { error: true, message: 'from/to must be valid YYYY-MM-DD dates.' };
}
if (from > to) return { error: true, message: 'from must be <= to.' };

const endpointByType = {
  earnings: 'earnings',
  dividends: 'dividends',
  splits: 'splits',
  ipos: 'ipos',
  economic_events: 'economic-events',
};

const endpointType = endpointByType[calendarTypeRaw];
if (!endpointType) {
  return {
    error: true,
    message: 'calendarType must be one of: earnings, dividends, splits, ipos, economic_events.',
  };
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

try {
  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  addParam(params, 'from', from);
  addParam(params, 'to', to);
  addParam(params, 'symbols', symbols);
  addParam(params, 'limit', limit);
  addParam(params, 'offset', offset);

  const url = `https://eodhd.com/api/calendar/${endpointType}?${params.join('&')}`;
  const payload = await fetchJson(url, 'calendar');
  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.results) ? payload.results : []));

  return {
    data: {
      calendarType: calendarTypeRaw,
      count: rows.length,
      rows,
    },
    endpointDiagnostics: {
      endpoint: '/api/calendar/{type}',
      endpointType,
      parameters: { from, to, symbols: symbols || null, limit, offset },
    },
    metadata: {
      source: 'EODHD atomic action: get_calendar_events',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_calendar_events failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}

