// name = Run Screener
// description = Runs EODHD screener and returns rows plus extracted symbols.
//
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// preset = Optional beginner preset: market_leaders|top_gainers|top_losers|oversold|overbought|high_volume
// filters = Optional advanced JSON string for EODHD screener filters
// signals = Optional comma-separated screener signals (common: top_gainers,top_losers,oversold,overbought)
// sort = Optional sort field. Common: market_capitalization.desc,market_capitalization.asc,name.asc,name.desc,volume.desc,change_p.desc
// outputMode = compact|full (default: compact)
// limit = Max rows (default: 25, min: 1, max: 500)
// offset = Pagination offset (default: 0, min: 0)
// resultLimit = Optional max rows returned in action output (default: same as limit, min: 1, max: 500)

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === false) return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

const help = asBool(data.input.help, false);
const presetInput = (data.input.preset || '').toString().trim().toLowerCase();
const filtersInput = (data.input.filters || '').toString().trim();
const signalsInputRaw = (data.input.signals || '').toString().trim();
const sortInputRaw = (data.input.sort || '').toString().trim();
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

const COMMON_SORT_OPTIONS = [
  'market_capitalization.desc',
  'market_capitalization.asc',
  'name.asc',
  'name.desc',
  'volume.desc',
  'change_p.desc',
  'change_p.asc',
];
const COMMON_SIGNALS = ['top_gainers', 'top_losers', 'oversold', 'overbought'];

const PRESET_MAP = {
  market_leaders: {
    description: 'Broad market leaders ranked by market cap.',
    sort: 'market_capitalization.desc',
    signals: '',
    limit: 50,
  },
  top_gainers: {
    description: 'Strongest daily gainers for headline scanning.',
    sort: 'change_p.desc',
    signals: 'top_gainers',
    limit: 30,
  },
  top_losers: {
    description: 'Strongest daily losers for downside narrative.',
    sort: 'change_p.asc',
    signals: 'top_losers',
    limit: 30,
  },
  oversold: {
    description: 'Potential mean-reversion candidates with oversold signal.',
    sort: 'change_p.asc',
    signals: 'oversold',
    limit: 50,
  },
  overbought: {
    description: 'Potential pullback candidates with overbought signal.',
    sort: 'change_p.desc',
    signals: 'overbought',
    limit: 50,
  },
  high_volume: {
    description: 'Most actively traded names by volume.',
    sort: 'volume.desc',
    signals: '',
    limit: 50,
  },
};

if (help) {
  return {
    data: {
      action: 'run_screener',
      decisionGuide: {
        whenToUse: 'Use this to build a stock universe before running deeper analysis.',
        firstDecision: 'If you are not sure, start with preset. Use filters only for advanced custom logic.',
        quickChoices: [
          { goal: 'General market leaders', use: { preset: 'market_leaders' } },
          { goal: 'Who is moving up today?', use: { preset: 'top_gainers' } },
          { goal: 'Who is moving down today?', use: { preset: 'top_losers' } },
          { goal: 'Active tape check', use: { preset: 'high_volume' } },
        ],
      },
      presets: PRESET_MAP,
      commonSortOptions: COMMON_SORT_OPTIONS,
      commonSignals: COMMON_SIGNALS,
      outputModeOptions: ['compact', 'full'],
      advancedNotes: {
        filters: 'filters is advanced raw JSON for EODHD screener. Prefer preset/signals first if unsure.',
      },
    },
    endpointDiagnostics: {
      endpoint: '/api/screener',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: run_screener',
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
if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'outputMode must be compact or full.' };
}

function clampNumber(value, fallback, minValue, maxValue) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

if (presetInput && !Object.prototype.hasOwnProperty.call(PRESET_MAP, presetInput)) {
  return {
    error: true,
    message: 'Unknown preset value for run_screener.',
    details: {
      presetInput,
      allowedPresets: Object.keys(PRESET_MAP),
    },
  };
}

const preset = presetInput ? PRESET_MAP[presetInput] : null;
const hasUserLimit = data.input.limit !== undefined && data.input.limit !== null && String(data.input.limit).trim() !== '';
let limit = clampNumber(data.input.limit, 25, 1, 500);
if (!hasUserLimit && preset && Number.isFinite(preset.limit)) {
  limit = clampNumber(preset.limit, 50, 1, 500);
}
const offset = clampNumber(data.input.offset, 0, 0, 1000000);
const resultLimit = clampNumber(data.input.resultLimit, limit, 1, 500);

const sortInput = sortInputRaw || (preset ? preset.sort : 'market_capitalization.desc');
const signalsInput = signalsInputRaw || (preset ? preset.signals : '');

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

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function firstText(row, keys) {
  for (let i = 0; i < keys.length; i++) {
    const value = (row[keys[i]] || '').toString().trim();
    if (value) return value;
  }
  return null;
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

  const rowsOut = rows.slice(0, resultLimit);
  const symbols = dedupe(rowsOut.map(extractSymbol).filter(Boolean));
  const compactRows = rows.map((row) => ({
    symbol: extractSymbol(row),
    code: firstText(row, ['code', 'Code', 'ticker']),
    name: firstText(row, ['name', 'Name']),
    exchange: firstText(row, ['exchange', 'Exchange']),
    sector: firstText(row, ['sector', 'Sector']),
    industry: firstText(row, ['industry', 'Industry']),
    close: safeNumber(row.close),
    changePct: safeNumber(row.change_p || row.changePercent || row.change_percentage),
    volume: safeNumber(row.volume),
    marketCap: safeNumber(row.market_capitalization || row.marketCap),
  }));
  const compactRowsOut = compactRows.slice(0, resultLimit);

  const dataBlock = {
    rows: outputMode === 'full' ? rowsOut : compactRowsOut,
    symbols,
    count: rows.length,
    returnedRows: outputMode === 'full' ? rowsOut.length : compactRowsOut.length,
  };
  if (outputMode === 'full') dataBlock.rawRows = rowsOut;

  return {
    data: dataBlock,
    endpointDiagnostics: {
      endpoint: '/api/screener',
      parameters: {
        limit,
        offset,
        sort: sortInput,
        hasFilters: !!parsedFilters,
        signals: signalsInput || null,
        preset: presetInput || null,
        outputMode,
        resultLimit,
      },
      commonSortOptions: COMMON_SORT_OPTIONS,
      commonSignals: COMMON_SIGNALS,
      presets: PRESET_MAP,
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
