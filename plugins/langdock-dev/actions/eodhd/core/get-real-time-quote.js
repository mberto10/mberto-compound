// name = Get Real Time Quote
// description = Fetches real-time quote snapshot for one symbol from EODHD.
//
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// symbol = EODHD symbol (required, e.g. AAPL.US)
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

const help = asBool(data.input.help, false);
const outputMode = (data.input.outputMode || data.input.output_mode || 'compact').toString().trim().toLowerCase();
if (help) {
  return {
    data: {
      action: 'get_real_time_quote',
      decisionGuide: {
        whenToUse: 'Use this for latest live quote checks (price now, daily range, volume) for a single symbol.',
        quickChoice: { symbol: 'AAPL.US' },
      },
      outputModeOptions: ['compact', 'full'],
    },
    endpointDiagnostics: {
      endpoint: '/api/real-time/{symbol}',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: get_real_time_quote',
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

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

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

try {
  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  const url = `https://eodhd.com/api/real-time/${encodeURIComponent(symbol)}?${params.join('&')}`;

  const payload = await fetchJson(url, 'real-time');
  const lastClose = safeNumber(payload.previousClose);
  const lastPrice = safeNumber(payload.close);
  const changePct = lastClose && lastPrice ? ((lastPrice - lastClose) / lastClose) * 100 : null;

  const dataBlock = {
    symbol,
    timestamp: payload.timestamp || payload.latestUpdate || null,
    close: lastPrice,
    previousClose: lastClose,
    change: safeNumber(payload.change),
    changePct,
    open: safeNumber(payload.open),
    high: safeNumber(payload.high),
    low: safeNumber(payload.low),
    volume: safeNumber(payload.volume),
  };
  if (outputMode === 'full') dataBlock.raw = payload;

  return {
    data: dataBlock,
    endpointDiagnostics: {
      endpoint: '/api/real-time/{symbol}',
      symbol,
      outputMode,
    },
    metadata: {
      source: 'EODHD atomic action: get_real_time_quote',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_real_time_quote failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}
