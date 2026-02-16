// name = Get Fundamentals
// description = Fetches EODHD fundamentals for one symbol with optional top-level field selection and compact summary.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// fieldsPreset = Optional beginner preset: profile|valuation|financials|ownership|technical_snapshot|corporate_actions|full
// fields = Optional comma-separated top-level keys to return. Allowed: General,Highlights,Valuation,SharesStats,SplitsDividends,Technicals,Holders,InsiderTransactions,ESGScores,outstandingShares,Earnings,Financials.
// format = raw|summary (default: summary)
// periodsLimit = Max yearly/quarterly periods kept in raw mode for heavy statement blocks (default: 8, min: 1, max: 40)
// listLimit = Max list items kept in raw mode for heavy arrays (default: 30, min: 5, max: 200)
// maxOutputChars = Approximate maximum serialized response size in raw mode before summary fallback (default: 90000, min: 20000, max: 180000)

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

const ALLOWED_TOP_LEVEL_FIELDS = [
  'General',
  'Highlights',
  'Valuation',
  'SharesStats',
  'SplitsDividends',
  'Technicals',
  'Holders',
  'InsiderTransactions',
  'ESGScores',
  'outstandingShares',
  'Earnings',
  'Financials',
];

const FIELDS_PRESET_MAP = {
  profile: ['General', 'SharesStats'],
  valuation: ['Highlights', 'Valuation'],
  financials: ['Financials', 'Earnings', 'Highlights'],
  ownership: ['Holders', 'InsiderTransactions', 'SharesStats'],
  technical_snapshot: ['Technicals', 'Highlights'],
  corporate_actions: ['SplitsDividends', 'outstandingShares'],
  full: [],
};

const help = asBool(data.input.help, false);
const fieldsPresetInput = (data.input.fieldsPreset || '').toString().trim().toLowerCase();

if (help) {
  return {
    data: {
      action: 'get_fundamentals',
      decisionGuide: {
        whenToUse: 'Use this when you need company profile, valuation, ownership, or accounting fundamentals for one symbol.',
        quickChoices: [
          { goal: 'Quick company snapshot', use: { symbol: 'AAPL.US', format: 'summary' } },
          { goal: 'Valuation payload', use: { symbol: 'AAPL.US', fieldsPreset: 'valuation', format: 'raw' } },
          { goal: 'Financial statement deep dive', use: { symbol: 'AAPL.US', fieldsPreset: 'financials', format: 'raw' } },
        ],
      },
      allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
      fieldsPresetMap: FIELDS_PRESET_MAP,
      formatOptions: ['raw', 'summary'],
    },
    endpointDiagnostics: {
      endpoint: '/api/fundamentals/{symbol}',
      helpOnly: true,
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
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
const fieldsInput = (data.input.fields || '').toString().trim();
const formatInput = (data.input.format || 'summary').toString().trim().toLowerCase();
const periodsLimit = clampNumber(data.input.periodsLimit, 8, 1, 40);
const listLimit = clampNumber(data.input.listLimit, 30, 5, 200);
const maxOutputChars = clampNumber(data.input.maxOutputChars, 90000, 20000, 180000);

if (!symbol) return { error: true, message: 'symbol is required.' };
if (formatInput !== 'raw' && formatInput !== 'summary') {
  return { error: true, message: 'format must be raw or summary.' };
}
if (fieldsPresetInput && !Object.prototype.hasOwnProperty.call(FIELDS_PRESET_MAP, fieldsPresetInput)) {
  return {
    error: true,
    message: 'Unknown fieldsPreset value.',
    details: {
      fieldsPresetInput,
      allowedFieldsPresets: Object.keys(FIELDS_PRESET_MAP),
    },
  };
}

const allowedFieldsMap = {};
for (let i = 0; i < ALLOWED_TOP_LEVEL_FIELDS.length; i++) {
  const key = ALLOWED_TOP_LEVEL_FIELDS[i];
  allowedFieldsMap[key.toLowerCase()] = key;
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

function capArray(items, maxItems) {
  if (!Array.isArray(items)) return items;
  return items.slice(0, maxItems);
}

function capObjectByDateKey(obj, maxItems) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const keys = Object.keys(obj).sort().reverse();
  const out = {};
  for (let i = 0; i < keys.length && i < maxItems; i++) {
    const key = keys[i];
    out[key] = obj[key];
  }
  return out;
}

function estimateJsonChars(value) {
  try {
    return JSON.stringify(value).length;
  } catch (e) {
    return null;
  }
}

function trimFundamentalsPayload(payload, periodsLimit, listLimit) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;

  let out = payload;
  try {
    out = JSON.parse(JSON.stringify(payload));
  } catch (e) {
    return payload;
  }

  if (out.Financials && typeof out.Financials === 'object') {
    const financialBlocks = Object.keys(out.Financials);
    for (let i = 0; i < financialBlocks.length; i++) {
      const block = out.Financials[financialBlocks[i]];
      if (!block || typeof block !== 'object') continue;
      if (block.yearly && typeof block.yearly === 'object' && !Array.isArray(block.yearly)) {
        block.yearly = capObjectByDateKey(block.yearly, periodsLimit);
      }
      if (block.quarterly && typeof block.quarterly === 'object' && !Array.isArray(block.quarterly)) {
        block.quarterly = capObjectByDateKey(block.quarterly, periodsLimit);
      }
    }
  }

  if (out.Earnings && typeof out.Earnings === 'object') {
    if (Array.isArray(out.Earnings.History)) out.Earnings.History = capArray(out.Earnings.History, periodsLimit);
    else if (out.Earnings.History && typeof out.Earnings.History === 'object') out.Earnings.History = capObjectByDateKey(out.Earnings.History, periodsLimit);
    if (Array.isArray(out.Earnings.Trend)) out.Earnings.Trend = capArray(out.Earnings.Trend, periodsLimit);
  }

  if (out.outstandingShares && typeof out.outstandingShares === 'object') {
    if (Array.isArray(out.outstandingShares.annual)) out.outstandingShares.annual = capArray(out.outstandingShares.annual, periodsLimit);
    if (Array.isArray(out.outstandingShares.quarterly)) out.outstandingShares.quarterly = capArray(out.outstandingShares.quarterly, periodsLimit);
  }

  if (Array.isArray(out.Holders)) out.Holders = capArray(out.Holders, listLimit);
  if (Array.isArray(out.InsiderTransactions)) out.InsiderTransactions = capArray(out.InsiderTransactions, listLimit);
  if (out.InsiderTransactions && Array.isArray(out.InsiderTransactions.transactions)) {
    out.InsiderTransactions.transactions = capArray(out.InsiderTransactions.transactions, listLimit);
  }

  return out;
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
  const availableTopLevelKeys = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.keys(raw).sort()
    : [];

  let fields = [];
  if (fieldsInput) {
    const parsed = fieldsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const useAll = parsed.some((v) => v.toLowerCase() === 'all' || v === '*');
    if (!useAll) {
      const unknownFields = [];
      const canonical = [];
      const seen = {};
      for (let i = 0; i < parsed.length; i++) {
        const lower = parsed[i].toLowerCase();
        const mapped = allowedFieldsMap[lower];
        if (!mapped) {
          unknownFields.push(parsed[i]);
          continue;
        }
        if (!seen[mapped]) {
          seen[mapped] = true;
          canonical.push(mapped);
        }
      }
      if (unknownFields.length > 0) {
        return {
          error: true,
          message: 'Unknown fields value(s) for fundamentals.',
          details: {
            unknownFields,
            allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
            availableTopLevelKeys,
          },
        };
      }
      fields = canonical;
    }
  } else if (fieldsPresetInput && fieldsPresetInput !== 'full') {
    fields = FIELDS_PRESET_MAP[fieldsPresetInput].slice();
  }

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

  const truncationNotes = [];
  let rawPayloadChars = null;
  let responseFormat = formatInput;
  let dataOut = summary;

  if (formatInput === 'raw') {
    const selectedSizeChars = estimateJsonChars(selected);
    let trimmed = trimFundamentalsPayload(selected, periodsLimit, listLimit);
    let trimmedSizeChars = estimateJsonChars(trimmed);

    if (Number.isFinite(selectedSizeChars) && Number.isFinite(trimmedSizeChars) && trimmedSizeChars < selectedSizeChars) {
      truncationNotes.push('Raw payload trimmed for model consumption (period/list caps applied).');
    }

    if (Number.isFinite(trimmedSizeChars) && trimmedSizeChars > maxOutputChars) {
      trimmed = trimFundamentalsPayload(trimmed, Math.min(periodsLimit, 4), Math.min(listLimit, 20));
      trimmedSizeChars = estimateJsonChars(trimmed);
      truncationNotes.push('Applied aggressive second-pass trimming to fit response size constraints.');
    }

    if (Number.isFinite(trimmedSizeChars) && trimmedSizeChars > maxOutputChars) {
      responseFormat = 'summary_fallback';
      dataOut = summary;
      truncationNotes.push(`Raw payload still exceeded ${maxOutputChars} chars; returned summary instead.`);
    } else {
      responseFormat = 'raw';
      dataOut = trimmed;
      rawPayloadChars = trimmedSizeChars;
    }
  } else {
    dataOut = summary;
  }

  return {
    data: dataOut,
    summary,
    endpointDiagnostics: {
      endpoint: '/api/fundamentals/{symbol}',
      symbol,
      requestedFields: fields,
      fieldsPreset: fieldsPresetInput || null,
      allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
      availableTopLevelKeys,
      responseType: Array.isArray(raw) ? 'array' : typeof raw,
      responseFormat,
      sizeControls: {
        periodsLimit,
        listLimit,
        maxOutputChars,
        rawPayloadChars,
        truncated: truncationNotes.length > 0,
        truncationNotes,
      },
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
      generatedAt: new Date().toISOString(),
      parameters: { symbol, format: responseFormat, fields, fieldsPreset: fieldsPresetInput || null },
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
