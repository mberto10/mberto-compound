// name = Get Fundamentals
// description = Fetches EODHD fundamentals for one symbol with optional top-level field selection and compact summary.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// fields = Optional comma-separated top-level keys to return (e.g. General,Highlights,Valuation)
// format = raw|summary (default: raw)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
const fieldsInput = (data.input.fields || '').toString().trim();
const formatInput = (data.input.format || 'raw').toString().trim().toLowerCase();

if (!symbol) return { error: true, message: 'symbol is required.' };
if (formatInput !== 'raw' && formatInput !== 'summary') {
  return { error: true, message: 'format must be raw or summary.' };
}

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
  const url = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?${params.join('&')}`;

  const raw = await fetchJson(url, 'fundamentals');
  const fields = fieldsInput
    ? fieldsInput.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  let selected = raw;
  if (fields.length > 0) {
    selected = {};
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];
      if (raw && Object.prototype.hasOwnProperty.call(raw, key)) {
        selected[key] = raw[key];
      }
    }
  }

  const general = raw && raw.General ? raw.General : {};
  const highlights = raw && raw.Highlights ? raw.Highlights : {};
  const valuation = raw && raw.Valuation ? raw.Valuation : {};
  const sharesStats = raw && raw.SharesStats ? raw.SharesStats : {};
  const technicals = raw && raw.Technicals ? raw.Technicals : {};

  const summary = {
    symbol,
    name: (general.Name || '').toString() || null,
    exchange: (general.Exchange || '').toString() || null,
    sector: (general.Sector || '').toString() || null,
    industry: (general.Industry || '').toString() || null,
    marketCap: safeNumber(highlights.MarketCapitalization),
    peTTM: safeNumber(valuation.TrailingPE),
    forwardPE: safeNumber(valuation.ForwardPE),
    priceBook: safeNumber(valuation.PriceBookMRQ),
    roeTTM: safeNumber(highlights.ReturnOnEquityTTM),
    revenueTTM: safeNumber(highlights.RevenueTTM),
    epsTTM: safeNumber(highlights.DilutedEpsTTM),
    dividendYield: safeNumber(highlights.DividendYield),
    beta: safeNumber(technicals.Beta),
    sharesOutstanding: safeNumber(sharesStats.SharesOutstanding),
    updatedAt: (general.UpdatedAt || '').toString() || null,
  };

  return {
    data: formatInput === 'summary' ? summary : selected,
    summary,
    endpointDiagnostics: {
      endpoint: '/api/fundamentals/{symbol}',
      symbol,
      requestedFields: fields,
      responseType: Array.isArray(raw) ? 'array' : typeof raw,
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
      generatedAt: new Date().toISOString(),
      parameters: { symbol, format: formatInput, fields },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_fundamentals failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}

