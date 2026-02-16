// name = Get Calendar Events
// description = Fetches calendar events from EODHD for a selected calendar type and date window.
//
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// calendarType = earnings|dividends|splits|ipos|economic_events (required)
// calendar_type = snake_case alias for calendarType
// windowPreset = Optional beginner window: today|next_7d|next_30d|last_7d|last_30d
// window_preset = snake_case alias for windowPreset
// from = Start date YYYY-MM-DD (required unless windowPreset is used)
// to = End date YYYY-MM-DD (required unless windowPreset is used)
// symbols = Optional comma-separated symbols filter
// limit = Optional max items (default: 50, min: 1, max: 1000)
// offset = Optional pagination offset (default: 0, min: 0)
// outputMode = compact|full (default: compact)
// output_mode = snake_case alias for outputMode
// resultLimit = Optional max returned rows after fetch (default: limit, min: 1, max: 1000)
// result_limit = snake_case alias for resultLimit

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === false) return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

function clampNumber(value, fallback, minValue, maxValue) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function shiftDays(baseDate, days) {
  const d = new Date(baseDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

function isValidDateString(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

const help = asBool(data.input.help, false);
const calendarTypeRaw = (data.input.calendarType || data.input.calendar_type || '').toString().trim().toLowerCase();
const windowPreset = (data.input.windowPreset || data.input.window_preset || '').toString().trim().toLowerCase();
const symbols = (data.input.symbols || '').toString().trim();
const outputMode = (data.input.outputMode || data.input.output_mode || 'compact').toString().trim().toLowerCase();

const CALENDAR_TYPE_OPTIONS = ['earnings', 'dividends', 'splits', 'ipos', 'economic_events'];
const WINDOW_PRESETS = ['today', 'next_7d', 'next_30d', 'last_7d', 'last_30d'];

if (help) {
  return {
    data: {
      action: 'get_calendar_events',
      decisionGuide: {
        whenToUse: 'Use this to fetch catalysts (earnings/dividends/splits/IPO/economic events) for a date window.',
        quickChoices: [
          { goal: 'Upcoming earnings this week', use: { calendarType: 'earnings', windowPreset: 'next_7d' } },
          { goal: 'Recent splits last month', use: { calendarType: 'splits', windowPreset: 'last_30d' } },
          { goal: 'Upcoming dividends this month', use: { calendarType: 'dividends', windowPreset: 'next_30d' } },
        ],
      },
      calendarTypeOptions: CALENDAR_TYPE_OPTIONS,
      windowPresetOptions: WINDOW_PRESETS,
      outputModeOptions: ['compact', 'full'],
    },
    endpointDiagnostics: {
      endpoint: '/api/calendar/{type}',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: get_calendar_events',
      generatedAt: new Date().toISOString(),
    },
  };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (
  auth.apiKey ||
  auth.api_key ||
  auth.apiToken ||
  auth.api_token ||
  auth.eodhdApiKey ||
  auth.EODHD_API_KEY ||
  ''
).toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential. Set one of: auth.apiKey, auth.apiToken, auth.api_key, auth.api_token, auth.eodhdApiKey' };
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };

if (!calendarTypeRaw) return { error: true, message: 'calendarType is required.' };
if (CALENDAR_TYPE_OPTIONS.indexOf(calendarTypeRaw) === -1) {
  return {
    error: true,
    message: 'calendarType must be one of: earnings, dividends, splits, ipos, economic_events.',
  };
}
if (windowPreset && WINDOW_PRESETS.indexOf(windowPreset) === -1) {
  return {
    error: true,
    message: 'Unknown windowPreset value.',
    details: { windowPreset, allowedWindowPresets: WINDOW_PRESETS },
  };
}

let from = (data.input.from || '').toString().trim();
let to = (data.input.to || '').toString().trim();
if ((!from || !to) && windowPreset) {
  const today = formatDate(new Date());
  if (windowPreset === 'today') {
    from = today;
    to = today;
  } else if (windowPreset === 'next_7d') {
    from = today;
    to = shiftDays(today, 7);
  } else if (windowPreset === 'next_30d') {
    from = today;
    to = shiftDays(today, 30);
  } else if (windowPreset === 'last_7d') {
    from = shiftDays(today, -7);
    to = today;
  } else if (windowPreset === 'last_30d') {
    from = shiftDays(today, -30);
    to = today;
  }
}

if (!from || !to) return { error: true, message: 'from and to are required (or set windowPreset).' };
if (!isValidDateString(from) || !isValidDateString(to)) {
  return { error: true, message: 'from/to must be valid YYYY-MM-DD dates.' };
}
if (from > to) return { error: true, message: 'from must be <= to.' };

const limit = clampNumber(data.input.limit, 50, 1, 1000);
const offset = clampNumber(data.input.offset, 0, 0, 1000000);
const resultLimit = clampNumber(data.input.resultLimit || data.input.result_limit, limit, 1, 1000);

const endpointByType = {
  earnings: 'earnings',
  dividends: 'dividends',
  splits: 'splits',
  ipos: 'ipos',
  economic_events: 'economic-events',
};
const endpointType = endpointByType[calendarTypeRaw];

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
  const compactRows = rows.map((row) => ({
    date: (row.date || row.report_date || row.exDate || row.datetime || '').toString() || null,
    symbol: (row.code || row.symbol || row.ticker || '').toString() || null,
    name: (row.name || row.company || row.event || '').toString() || null,
    exchange: (row.exchange || row.exchangeCode || '').toString() || null,
    currency: (row.currency || '').toString() || null,
    epsEstimate: Number.isFinite(Number(row.epsEstimate ?? row.eps_estimate)) ? Number(row.epsEstimate ?? row.eps_estimate) : null,
    epsActual: Number.isFinite(Number(row.epsActual ?? row.eps_actual ?? row.eps)) ? Number(row.epsActual ?? row.eps_actual ?? row.eps) : null,
  }));
  const truncated = compactRows.length > resultLimit;
  const compactRowsLimited = compactRows.slice(0, resultLimit);
  const rawRowsLimited = rows.slice(0, resultLimit);

  const dataBlock = {
    calendarType: calendarTypeRaw,
    fetchedCount: rows.length,
    count: compactRowsLimited.length,
    rows: compactRowsLimited,
  };
  if (outputMode === 'full') dataBlock.rawRows = rawRowsLimited;

  return {
    data: dataBlock,
    endpointDiagnostics: {
      endpoint: '/api/calendar/{type}',
      endpointType,
      parameters: { from, to, symbols: symbols || null, limit, offset, resultLimit, windowPreset: windowPreset || null, outputMode },
      truncated,
      truncationNotes: truncated ? [`Returned ${compactRowsLimited.length} of ${rows.length} rows (resultLimit=${resultLimit}).`] : [],
      calendarTypeOptions: CALENDAR_TYPE_OPTIONS,
      windowPresetOptions: WINDOW_PRESETS,
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
