// name = Get Real Time Quote
// description = Fetches real-time quote snapshot for one symbol from EODHD.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

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

  return {
    data: {
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
      raw: payload,
    },
    endpointDiagnostics: {
      endpoint: '/api/real-time/{symbol}',
      symbol,
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

