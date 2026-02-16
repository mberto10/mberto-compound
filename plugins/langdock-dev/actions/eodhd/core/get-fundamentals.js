// name = Get Fundamentals
// description = Fetches EODHD fundamentals for one symbol with optional top-level field selection and compact summary.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// fieldsPreset = Optional beginner preset: profile|valuation|financials|ownership|technical_snapshot|corporate_actions|full
// fields = Optional comma-separated top-level keys to return. Allowed: General,Highlights,Valuation,SharesStats,SplitsDividends,Technicals,Holders,InsiderTransactions,ESGScores,outstandingShares,Earnings,Financials.
// format = raw|summary (default: summary)
// maxPeriods = Optional cap for yearly/quarterly history blocks in raw output (default: no cap, min: 1, max: 120)

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
const fieldsPresetInput = (data.input.fieldsPreset || data.input.fields_preset || '').toString().trim().toLowerCase();

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
const maxPeriodsRaw = data.input.maxPeriods !== undefined ? data.input.maxPeriods : data.input.max_periods;
const hasMaxPeriodsInput = maxPeriodsRaw !== undefined && maxPeriodsRaw !== null && String(maxPeriodsRaw).trim() !== '';
const maxPeriods = hasMaxPeriodsInput ? clampNumber(maxPeriodsRaw, 8, 1, 120) : null;

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

function limitPeriodMap(periodMap, maxPeriods) {
  if (!periodMap || typeof periodMap !== 'object' || Array.isArray(periodMap)) return periodMap;
  const keys = Object.keys(periodMap).sort().reverse();
  const out = {};
  for (let i = 0; i < keys.length && i < maxPeriods; i++) {
    out[keys[i]] = periodMap[keys[i]];
  }
  return out;
}

function applyMaxPeriodsToRaw(rawBlock, maxPeriods) {
  if (!maxPeriods || !rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) return rawBlock;
  let out = rawBlock;
  try {
    out = JSON.parse(JSON.stringify(rawBlock));
  } catch (e) {
    return rawBlock;
  }

  if (out.Financials && typeof out.Financials === 'object') {
    const blocks = Object.keys(out.Financials);
    for (let i = 0; i < blocks.length; i++) {
      const section = out.Financials[blocks[i]];
      if (!section || typeof section !== 'object') continue;
      if (section.yearly && typeof section.yearly === 'object' && !Array.isArray(section.yearly)) {
        section.yearly = limitPeriodMap(section.yearly, maxPeriods);
      }
      if (section.quarterly && typeof section.quarterly === 'object' && !Array.isArray(section.quarterly)) {
        section.quarterly = limitPeriodMap(section.quarterly, maxPeriods);
      }
    }
  }

  if (out.Earnings && typeof out.Earnings === 'object') {
    if (out.Earnings.History && typeof out.Earnings.History === 'object' && !Array.isArray(out.Earnings.History)) {
      out.Earnings.History = limitPeriodMap(out.Earnings.History, maxPeriods);
    }
    if (Array.isArray(out.Earnings.History)) out.Earnings.History = out.Earnings.History.slice(0, maxPeriods);
    if (Array.isArray(out.Earnings.Trend)) out.Earnings.Trend = out.Earnings.Trend.slice(0, maxPeriods);
  }

  if (out.outstandingShares && typeof out.outstandingShares === 'object') {
    if (Array.isArray(out.outstandingShares.annual)) out.outstandingShares.annual = out.outstandingShares.annual.slice(0, maxPeriods);
    if (Array.isArray(out.outstandingShares.quarterly)) out.outstandingShares.quarterly = out.outstandingShares.quarterly.slice(0, maxPeriods);
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
          },
        };
      }
      fields = canonical;
    }
  } else if (fieldsPresetInput && fieldsPresetInput !== 'full') {
    fields = FIELDS_PRESET_MAP[fieldsPresetInput].slice();
  }

  let apiFilterKeys = [];
  if (formatInput === 'summary') {
    apiFilterKeys = ['General', 'Highlights', 'Valuation', 'SharesStats', 'Technicals'];
  } else if (formatInput === 'raw' && fields.length > 0) {
    apiFilterKeys = fields.slice();
  }

  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  if (apiFilterKeys.length > 0) addParam(params, 'filter', apiFilterKeys.join(','));
  const url = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?${params.join('&')}`;

  let raw = await fetchJson(url, 'fundamentals');
  if (
    apiFilterKeys.length === 1 &&
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    !Object.prototype.hasOwnProperty.call(raw, apiFilterKeys[0])
  ) {
    const wrapped = {};
    wrapped[apiFilterKeys[0]] = raw;
    raw = wrapped;
  }
  const availableTopLevelKeys = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.keys(raw).sort()
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
  if (formatInput === 'raw' && Number.isFinite(maxPeriods)) {
    selected = applyMaxPeriodsToRaw(selected, maxPeriods);
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
      fieldsPreset: fieldsPresetInput || null,
      apiFilterKeys,
      allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
      availableTopLevelKeys,
      responseType: Array.isArray(raw) ? 'array' : typeof raw,
      maxPeriods,
      periodsCapped: formatInput === 'raw' && Number.isFinite(maxPeriods),
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
      generatedAt: new Date().toISOString(),
      parameters: { symbol, format: formatInput, fields, fieldsPreset: fieldsPresetInput || null, maxPeriods },
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
