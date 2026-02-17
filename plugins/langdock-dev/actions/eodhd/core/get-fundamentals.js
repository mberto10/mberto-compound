// name = Get Fundamentals
// description = Fetches EODHD fundamentals for one symbol with optional top-level field selection and compact summary.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// fields_preset = Optional beginner preset: profile|valuation|financials|ownership|technical_snapshot|corporate_actions|full
// fields = Optional comma-separated top-level keys to return. Allowed: General,Highlights,Valuation,SharesStats,SplitsDividends,Technicals,Holders,InsiderTransactions,ESGScores,outstandingShares,Earnings,Financials.
// max_periods = Required max historical periods for period-based fundamentals containers (min: 1, max: 40)
// canonical input naming uses snake_case. Legacy aliases are still supported for compatibility.

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === false) return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

function trimInput(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function recordLegacyAliasUsage(usageList, key) {
  if (usageList.indexOf(key) === -1) usageList.push(key);
}

function getCanonicalInput(input, canonicalKey, aliases, fallback, legacyUsage) {
  const canonicalRaw = trimInput(input[canonicalKey]);
  const aliasValues = {};
  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i];
    const aliasRaw = trimInput(input[alias]);
    if (aliasRaw !== '') {
      aliasValues[alias] = aliasRaw;
      if (legacyUsage) recordLegacyAliasUsage(legacyUsage, alias);
    }
  }
  if (canonicalRaw !== '') return canonicalRaw;
  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i];
    if (aliasValues[alias] !== undefined) return aliasValues[alias];
  }
  return fallback;
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

const SUMMARY_FILTER_FIELDS = ['General', 'Highlights', 'Valuation', 'SharesStats', 'Technicals'];

const FIELDS_PRESET_MAP = {
  profile: ['General', 'SharesStats'],
  valuation: ['Highlights', 'Valuation'],
  financials: ['Financials', 'Earnings', 'Highlights'],
  ownership: ['Holders', 'InsiderTransactions', 'SharesStats'],
  technical_snapshot: ['Technicals', 'Highlights'],
  corporate_actions: ['SplitsDividends', 'outstandingShares'],
  full: [],
};

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

function isPeriodKey(key) {
  if (!key) return false;
  return (
    /^\d{4}$/.test(key) ||
    /^\d{4}-\d{2}$/.test(key) ||
    /^\d{4}-\d{2}-\d{2}$/.test(key) ||
    /^\d{4}Q[1-4]$/i.test(key) ||
    /^Q[1-4]\s?\d{4}$/i.test(key)
  );
}

function periodKeyRank(key) {
  if (/^\d{4}$/.test(key)) return Number(key) * 10000;
  if (/^\d{4}-\d{2}$/.test(key)) {
    const parts = key.split('-');
    return Number(parts[0]) * 10000 + Number(parts[1]) * 100;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const parts = key.split('-');
    return Number(parts[0]) * 10000 + Number(parts[1]) * 100 + Number(parts[2]);
  }
  if (/^\d{4}Q[1-4]$/i.test(key)) {
    const year = Number(key.slice(0, 4));
    const quarter = Number(key.slice(5));
    return year * 10 + quarter;
  }
  if (/^Q[1-4]\s?\d{4}$/i.test(key)) {
    const quarter = Number(key.charAt(1));
    const year = Number(key.replace(/^Q[1-4]\s?/i, ''));
    return year * 10 + quarter;
  }
  return null;
}

function looksLikePeriodObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length < 2) return false;
  let periodKeyCount = 0;
  for (let i = 0; i < keys.length; i++) {
    if (isPeriodKey(keys[i])) periodKeyCount++;
  }
  return periodKeyCount >= Math.max(2, Math.ceil(keys.length * 0.6));
}

function sortPeriodKeysDescending(keys) {
  return keys.slice().sort((a, b) => {
    const ra = periodKeyRank(a);
    const rb = periodKeyRank(b);
    if (ra !== null && rb !== null && ra !== rb) return rb - ra;
    if (ra !== null && rb === null) return -1;
    if (ra === null && rb !== null) return 1;
    if (a < b) return 1;
    if (a > b) return -1;
    return 0;
  });
}

function looksLikePeriodArray(arr, parentKey) {
  if (!Array.isArray(arr) || arr.length < 2) return false;
  const key = (parentKey || '').toLowerCase();
  if (key === 'trend' || key === 'history' || key === 'annual' || key === 'yearly' || key === 'quarterly' || key === 'quarters') {
    return true;
  }
  const first = arr[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false;
  return !!(
    first.date ||
    first.fiscalDateEnding ||
    first.reportDate ||
    first.period ||
    first.calendarDate
  );
}

function applyPeriodLimit(payload, maxPeriods, parentKey) {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) {
    const mapped = payload.map((item) => applyPeriodLimit(item, maxPeriods, parentKey));
    if (looksLikePeriodArray(mapped, parentKey)) return mapped.slice(0, maxPeriods);
    return mapped;
  }
  if (typeof payload !== 'object') return payload;

  const out = {};
  const keys = Object.keys(payload);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    out[key] = applyPeriodLimit(payload[key], maxPeriods, key);
  }

  if (!looksLikePeriodObject(out)) return out;
  const orderedKeys = sortPeriodKeysDescending(Object.keys(out));
  const limitedKeys = orderedKeys.slice(0, maxPeriods);
  const trimmed = {};
  for (let i = 0; i < limitedKeys.length; i++) {
    const key = limitedKeys[i];
    trimmed[key] = out[key];
  }
  return trimmed;
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

function deprecationWarnings(inputCompatibility) {
  if (!inputCompatibility || inputCompatibility.length === 0) return [];
  return ['Deprecated legacy input key(s) used: ' + inputCompatibility.join(', ') + '. Use snake_case canonical names when possible.'];
}

const INPUT_ALIASES = {
  fields_preset: ['fieldsPreset'],
  max_periods: ['maxPeriods', 'periods'],
};

const input = (data && data.input) ? data.input : {};
const inputCompatibility = [];
const help = asBool(getCanonicalInput(input, 'help', [], false, inputCompatibility), false);
const fieldsPresetInput = getCanonicalInput(input, 'fields_preset', INPUT_ALIASES.fields_preset, '', inputCompatibility).toLowerCase();
const fieldsInput = getCanonicalInput(input, 'fields', [], '', inputCompatibility);
const maxPeriodsInput = getCanonicalInput(input, 'max_periods', INPUT_ALIASES.max_periods, null, inputCompatibility);
if (maxPeriodsInput === null) {
  return {
    error: true,
    message: 'maxPeriods is required (supported aliases: max_periods, periods).',
    details: { maxPeriods: null },
  };
}
const parsedPeriods = Number(maxPeriodsInput);
if (!Number.isFinite(parsedPeriods) || Math.trunc(parsedPeriods) !== parsedPeriods || parsedPeriods < 1 || parsedPeriods > 40) {
  return {
    error: true,
    message: 'maxPeriods must be an integer between 1 and 40.',
    details: { maxPeriods: maxPeriodsInput },
  };
}
const periods = parsedPeriods;

if (help) {
  return {
    data: {
      action: 'get_fundamentals',
      decisionGuide: {
        whenToUse: 'Use this when you need company profile, valuation, ownership, or accounting fundamentals for one symbol.',
        quickChoices: [
          { goal: 'Quick company snapshot', use: { symbol: 'AAPL.US', maxPeriods: 4 } },
          { goal: 'Valuation payload', use: { symbol: 'AAPL.US', fieldsPreset: 'valuation', maxPeriods: 4 } },
          { goal: 'Financial statement deep dive', use: { symbol: 'AAPL.US', fieldsPreset: 'financials', maxPeriods: 4 } },
        ],
      },
      allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
      fieldsPresetMap: FIELDS_PRESET_MAP,
      migrationNote: {
        canonicalInputs: ['fields_preset', 'max_periods'],
        legacyAliases: ['fieldsPreset', 'maxPeriods', 'periods'],
      },
    },
    endpointDiagnostics: {
      endpoint: '/api/fundamentals/{symbol}',
      helpOnly: true,
      aliasWarnings: deprecationWarnings(inputCompatibility),
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
      generatedAt: new Date().toISOString(),
      inputCompatibility,
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

const symbol = getCanonicalInput(input, 'symbol', [], '', inputCompatibility).toUpperCase();

if (!symbol) return { error: true, message: 'symbol is required.' };
if (fieldsPresetInput && !Object.prototype.hasOwnProperty.call(FIELDS_PRESET_MAP, fieldsPresetInput)) {
  return {
    error: true,
    message: 'Unknown fields_preset value.',
    details: {
      fields_preset: fieldsPresetInput,
      allowedFieldsPresets: Object.keys(FIELDS_PRESET_MAP),
    },
  };
}
if (fieldsPresetInput === 'full') {
  return {
    error: true,
    message: 'fieldsPreset=full is not supported. Choose a bounded preset or explicit fields.',
    details: { fieldsPreset: fieldsPresetInput },
  };
}

const allowedFieldsMap = {};
for (let i = 0; i < ALLOWED_TOP_LEVEL_FIELDS.length; i++) {
  const key = ALLOWED_TOP_LEVEL_FIELDS[i];
  allowedFieldsMap[key.toLowerCase()] = key;
}

let fields = [];
if (fieldsInput) {
  const parsed = fieldsInput.split(',').map((s) => s.trim()).filter(Boolean);
  const useAll = parsed.some((v) => v.toLowerCase() === 'all' || v === '*');
  if (useAll) {
    return {
      error: true,
      message: 'fields=all/* is not supported. Choose explicit bounded fields.',
      details: { fields: parsed },
    };
  }
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
} else if (fieldsPresetInput && fieldsPresetInput !== 'full') {
  fields = FIELDS_PRESET_MAP[fieldsPresetInput].slice();
}

try {
  const params = [];
  addParam(params, 'api_token', apiKey);
  addParam(params, 'fmt', 'json');
  const requestFilterFields = fields.length > 0 ? fields : SUMMARY_FILTER_FIELDS;
  if (requestFilterFields.length > 0) {
    addParam(params, 'filter', requestFilterFields.join(','));
  }
  const url = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?${params.join('&')}`;

  const raw = await fetchJson(url, 'fundamentals');
  const availableTopLevelKeys = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.keys(raw).sort()
    : [];

  let selected = {};
  for (let i = 0; i < requestFilterFields.length; i++) {
    const key = requestFilterFields[i];
    if (raw && Object.prototype.hasOwnProperty.call(raw, key)) {
      selected[key] = raw[key];
    }
  }
  selected = applyPeriodLimit(selected, periods, '');

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

  const hasExplicitFieldSelection = !!(fieldsInput || fieldsPresetInput);

  return {
    data: hasExplicitFieldSelection ? selected : summary,
    summary,
    endpointDiagnostics: {
      endpoint: '/api/fundamentals/{symbol}',
      symbol,
      requestFilterFields,
      requestedFields: fields,
      fieldsPreset: fieldsPresetInput || null,
      periods: periods || null,
      allowedFields: ALLOWED_TOP_LEVEL_FIELDS,
      availableTopLevelKeys,
      responseType: Array.isArray(raw) ? 'array' : typeof raw,
      aliasWarnings: deprecationWarnings(inputCompatibility),
      inputCompatibility,
    },
    metadata: {
      source: 'EODHD atomic action: get_fundamentals',
      generatedAt: new Date().toISOString(),
      parameters: {
        symbol,
        fields,
        fields_preset: fieldsPresetInput || null,
        max_periods: periods || null,
      },
      inputCompatibility,
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
