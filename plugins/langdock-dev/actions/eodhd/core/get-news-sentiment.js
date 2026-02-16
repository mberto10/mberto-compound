// name = Get News Sentiment
// description = Fetches EODHD news with optional symbol/date filters and returns normalized sentiment-ready rows.
//
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// symbols = Optional comma-separated symbols (e.g. AAPL.US,MSFT.US)
// windowPreset = Optional date shortcut: today|last_7d|last_30d
// window_preset = snake_case alias for windowPreset
// from = Optional YYYY-MM-DD start date (or use windowPreset)
// to = Optional YYYY-MM-DD end date (or use windowPreset)
// limit = Optional max items (default: 20, min: 1, max: 200)
// offset = Optional pagination offset (default: 0, min: 0)
// s = Optional direct EODHD news s-query override (if set, it is used as-is; example: AAPL.US,MSFT.US)
// outputMode = compact|full (default: compact)
// output_mode = snake_case alias for outputMode
// contentMaxChars = Maximum content chars per item in compact mode (default: 280, min: 80, max: 5000)
// content_max_chars = snake_case alias for contentMaxChars
// resultLimit = Optional max returned rows after fetch (default: limit, min: 1, max: 200)
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
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  params.push(key + '=' + encodeURIComponent(str));
}

function toSymbolsQuery(symbols) {
  if (!symbols) return '';
  const parts = symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return parts.join(',');
}

function normalizeItem(item, outputMode, contentMaxChars) {
  const symbols = Array.isArray(item.symbols)
    ? item.symbols
    : (item.symbol ? [item.symbol] : []);
  const contentRaw = (item.content || item.text || '').toString();
  const content = outputMode === 'full'
    ? (contentRaw || null)
    : (contentRaw ? contentRaw.slice(0, contentMaxChars) : null);
  return {
    date: (item.date || item.publishedAt || '').toString() || null,
    title: (item.title || '').toString() || null,
    content,
    source: (item.source || item.site || '').toString() || null,
    link: (item.link || item.url || '').toString() || null,
    symbols,
    sentiment: item.sentiment || null,
  };
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

const help = asBool(data.input.help, false);
const WINDOW_PRESETS = ['today', 'last_7d', 'last_30d'];

if (help) {
  return {
    data: {
      action: 'get_news_sentiment',
      decisionGuide: {
        whenToUse: 'Use this to collect recent headlines for symbols or broad market topics.',
        firstDecision: 'Use symbols for company-specific news. Use s override only for advanced query control.',
        quickChoices: [
          { goal: 'Last 7 days for a ticker set', use: { symbols: 'AAPL.US,MSFT.US', windowPreset: 'last_7d' } },
          { goal: 'Today-only headlines', use: { windowPreset: 'today' } },
          { goal: 'Custom s-query', use: { s: 'AAPL.US,TSLA.US', windowPreset: 'last_30d' } },
        ],
      },
      windowPresetOptions: WINDOW_PRESETS,
      outputModeOptions: ['compact', 'full'],
      contentMaxCharsDefault: 280,
    },
    endpointDiagnostics: {
      endpoint: '/api/news',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: get_news_sentiment',
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

const symbolsInput = (data.input.symbols || '').toString().trim();
const sOverride = (data.input.s || '').toString().trim();
const windowPreset = (data.input.windowPreset || data.input.window_preset || '').toString().trim().toLowerCase();
const outputMode = (data.input.outputMode || data.input.output_mode || 'compact').toString().trim().toLowerCase();
let from = (data.input.from || '').toString().trim();
let to = (data.input.to || '').toString().trim();
const contentMaxChars = clampNumber(data.input.contentMaxChars || data.input.content_max_chars, 280, 80, 5000);

if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'outputMode must be compact or full.' };
}

if (windowPreset) {
  if (WINDOW_PRESETS.indexOf(windowPreset) === -1) {
    return {
      error: true,
      message: 'Unknown windowPreset value.',
      details: { windowPreset, allowedWindowPresets: WINDOW_PRESETS },
    };
  }
  if (!from || !to) {
    const today = formatDate(new Date());
    if (windowPreset === 'today') {
      from = today;
      to = today;
    } else if (windowPreset === 'last_7d') {
      from = shiftDays(today, -7);
      to = today;
    } else if (windowPreset === 'last_30d') {
      from = shiftDays(today, -30);
      to = today;
    }
  }
}

if (!isValidDateString(from) || !isValidDateString(to)) {
  return { error: true, message: 'from/to must be valid YYYY-MM-DD dates when provided.' };
}
if (from && to && from > to) return { error: true, message: 'from must be <= to.' };

const limit = clampNumber(data.input.limit, 20, 1, 200);
const offset = clampNumber(data.input.offset, 0, 0, 1000000);
const resultLimit = clampNumber(data.input.resultLimit || data.input.result_limit, limit, 1, 200);

try {
  const sParam = sOverride || toSymbolsQuery(symbolsInput);
  const queryMode = sOverride ? 's_override' : (symbolsInput ? 'symbols' : 'market_wide');

  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  addParam(params, 's', sParam);
  addParam(params, 'from', from);
  addParam(params, 'to', to);
  addParam(params, 'limit', limit);
  addParam(params, 'offset', offset);

  const url = `https://eodhd.com/api/news?${params.join('&')}`;
  const payload = await fetchJson(url, 'news');
  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.results) ? payload.results : []));
  const normalized = rows.map((item) => normalizeItem(item, outputMode, contentMaxChars));
  const truncated = normalized.length > resultLimit;
  const rowsLimited = normalized.slice(0, resultLimit);
  const rawRowsLimited = rows.slice(0, resultLimit);

  const dataBlock = {
    fetchedCount: normalized.length,
    count: rowsLimited.length,
    rows: rowsLimited,
  };
  if (outputMode === 'full') dataBlock.rawRows = rawRowsLimited;

  return {
    data: dataBlock,
    endpointDiagnostics: {
      endpoint: '/api/news',
      parameters: {
        s: sParam || null,
        from: from || null,
        to: to || null,
        limit,
        offset,
        resultLimit,
        windowPreset: windowPreset || null,
        outputMode,
        contentMaxChars: outputMode === 'compact' ? contentMaxChars : null,
      },
      queryMode,
      windowPresetOptions: WINDOW_PRESETS,
      truncated,
      truncationNotes: truncated ? [`Returned ${rowsLimited.length} of ${rows.length} rows (resultLimit=${resultLimit}).`] : [],
    },
    metadata: {
      source: 'EODHD atomic action: get_news_sentiment',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_news_sentiment failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}
