// name = Get Technical Indicator
// description = Fetches one technical indicator series for a symbol from EODHD technical endpoint.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// analysisType = Optional beginner shortcut: momentum|trend_short|trend_medium|trend_strength|volatility|mean_reversion
// analysis_type = snake_case alias for analysisType
// function = Indicator function (required unless analysisType is used). Common: rsi,sma,ema,wma,macd,atr,adx,stochastic,cci,williams,mfi,bbands
// period = Optional indicator period (default: 14, or analysisType default if provided)
// from = Optional YYYY-MM-DD date lower bound
// to = Optional YYYY-MM-DD date upper bound
// order = Optional order a|d (default: d)
// maxPoints = Maximum points to return (default: 120, min: 1, max: 2000)
// max_points = snake_case alias for maxPoints
// maxPeriods = camelCase alias for maxPoints
// max_periods = snake_case alias for maxPoints
// outputMode = compact|full (default: compact)
// output_mode = snake_case alias for outputMode

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

function isValidDateString(dateStr) {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

const COMMON_FUNCTIONS = [
  'rsi',
  'sma',
  'ema',
  'wma',
  'macd',
  'atr',
  'adx',
  'stochastic',
  'cci',
  'williams',
  'mfi',
  'bbands',
];

const ANALYSIS_TYPE_MAP = {
  momentum: { function: 'rsi', period: 14, description: 'Momentum/overbought-oversold check.' },
  trend_short: { function: 'ema', period: 20, description: 'Short-term trend check.' },
  trend_medium: { function: 'sma', period: 50, description: 'Medium-term trend check.' },
  trend_strength: { function: 'adx', period: 14, description: 'How strong the trend is.' },
  volatility: { function: 'atr', period: 14, description: 'Volatility/range behavior.' },
  mean_reversion: { function: 'cci', period: 20, description: 'Mean-reversion pressure.' },
};

const help = asBool(data.input.help, false);
const analysisType = (data.input.analysisType || data.input.analysis_type || '').toString().trim().toLowerCase();

if (help) {
  return {
    data: {
      action: 'get_technical_indicator',
      decisionGuide: {
        whenToUse: 'Use this when you want one technical series for a symbol.',
        firstDecision: 'If unsure, choose analysisType instead of raw function.',
        quickChoices: [
          { goal: 'Momentum state', use: { symbol: 'AAPL.US', analysisType: 'momentum' } },
          { goal: 'Short-term trend', use: { symbol: 'AAPL.US', analysisType: 'trend_short' } },
          { goal: 'Volatility check', use: { symbol: 'AAPL.US', analysisType: 'volatility' } },
        ],
      },
      analysisTypes: ANALYSIS_TYPE_MAP,
      commonFunctions: COMMON_FUNCTIONS,
      orderOptions: ['a', 'd'],
      outputModeOptions: ['compact', 'full'],
      maxPointsDefault: 120,
    },
    endpointDiagnostics: {
      endpoint: '/api/technical/{symbol}',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: get_technical_indicator',
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

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
const indicatorFunctionInput = (data.input.function || '').toString().trim().toLowerCase();
const from = (data.input.from || '').toString().trim();
const to = (data.input.to || '').toString().trim();
const order = (data.input.order || 'd').toString().trim().toLowerCase();
const outputMode = (data.input.outputMode || data.input.output_mode || 'compact').toString().trim().toLowerCase();
const maxPointsInput = data.input.maxPoints || data.input.max_points || data.input.maxPeriods || data.input.max_periods;
const maxPoints = clampNumber(maxPointsInput, 120, 1, 2000);

if (!symbol) return { error: true, message: 'symbol is required.' };
if (analysisType && !Object.prototype.hasOwnProperty.call(ANALYSIS_TYPE_MAP, analysisType)) {
  return {
    error: true,
    message: 'Unknown analysisType value.',
    details: {
      analysisType,
      allowedAnalysisTypes: Object.keys(ANALYSIS_TYPE_MAP),
    },
  };
}
if (order !== 'a' && order !== 'd') return { error: true, message: 'order must be a or d.' };
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };
if (!isValidDateString(from)) return { error: true, message: 'from must be YYYY-MM-DD.' };
if (!isValidDateString(to)) return { error: true, message: 'to must be YYYY-MM-DD.' };
if (from && to && from > to) return { error: true, message: 'from must be <= to.' };

const analysisPreset = analysisType ? ANALYSIS_TYPE_MAP[analysisType] : null;
const effectiveFunction = indicatorFunctionInput || (analysisPreset ? analysisPreset.function : '');
if (!effectiveFunction) {
  return {
    error: true,
    message: 'Provide function or analysisType.',
    details: {
      allowedAnalysisTypes: Object.keys(ANALYSIS_TYPE_MAP),
      commonFunctions: COMMON_FUNCTIONS,
    },
  };
}

const hasUserPeriod = data.input.period !== undefined && data.input.period !== null && String(data.input.period).trim() !== '';
const effectivePeriod = hasUserPeriod
  ? clampNumber(data.input.period, 14, 1, 500)
  : (analysisPreset ? analysisPreset.period : 14);

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

function normalizeRows(payload, includeRaw) {
  if (!Array.isArray(payload)) return [];
  const out = [];
  for (let i = 0; i < payload.length; i++) {
    const row = payload[i] || {};
    const normalized = {
      date: (row.date || row.datetime || '').toString() || null,
      timestamp: safeNumber(row.timestamp),
      value: null,
    };
    if (includeRaw) normalized.raw = row;

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
  addParam(params, 'function', effectiveFunction);
  addParam(params, 'period', effectivePeriod);
  addParam(params, 'order', order);
  addParam(params, 'from', from);
  addParam(params, 'to', to);

  const url = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?${params.join('&')}`;
  const payload = await fetchJson(url, 'technical');
  const rowsFull = normalizeRows(payload, outputMode === 'full');
  const rows = rowsFull.slice(0, maxPoints);

  return {
    data: {
      symbol,
      function: effectiveFunction,
      analysisType: analysisType || null,
      period: effectivePeriod,
      rows,
      latest: rows.length > 0 ? rows[0] : null,
    },
    endpointDiagnostics: {
      endpoint: '/api/technical/{symbol}',
      parameters: {
        symbol,
        function: effectiveFunction,
        period: effectivePeriod,
        order,
        from: from || null,
        to: to || null,
        analysisType: analysisType || null,
        maxPoints,
        outputMode,
      },
      commonFunctions: COMMON_FUNCTIONS,
      analysisTypes: ANALYSIS_TYPE_MAP,
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
