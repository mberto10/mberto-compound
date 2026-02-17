// name = Valuation Vs Momentum Conflicts
// description = Detects cheap/expensive valuation regimes against momentum state and ranks convergence/conflict setups.
//
// symbols = Optional comma-separated symbols to analyze (e.g. AAPL.US,MSFT.US)
// screener_filters = Optional screener filters JSON string (required if symbols not provided)
// screener_signals = Optional screener signals (required if symbols not provided)
// screener_sort = Screener sort expression (default: market_capitalization.desc)
// candidate_limit = Maximum symbols to analyze (default: 30, min: 5, max: 120)
// lookback_days = EOD lookback days (default: 180, min: 60, max: 1500)
// include_technicals = Include RSI confirmation (default: true)
// rsi_period = RSI period (default: 14, min: 2, max: 50)
// result_limit = Rows per output bucket (default: 10, min: 3, max: 30)
// pe_cheap_threshold = Cheap PE threshold (default: 15)
// pe_expensive_threshold = Expensive PE threshold (default: 30)
// pb_cheap_threshold = Cheap P/B threshold (default: 2)
// pb_expensive_threshold = Expensive P/B threshold (default: 5)
// output_mode = compact|full (default: compact)
// canonical input naming uses snake_case. Legacy camelCase aliases are supported for compatibility.

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

function deprecationWarnings(inputCompatibility) {
  if (!inputCompatibility || inputCompatibility.length === 0) return [];
  return ['Deprecated legacy input key(s) used: ' + inputCompatibility.join(', ') + '. Use snake_case canonical names when possible.'];
}

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
  return Math.min(Math.max(n, minValue), maxValue);
}

function round(value, decimals) {
  if (!Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pctChange(fromValue, toValue) {
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === 0) return null;
  return ((toValue - fromValue) / fromValue) * 100;
}

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return formatDate(d);
}

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  params.push(key + '=' + encodeURIComponent(str));
}

function dedupeSymbols(symbols) {
  const seen = {};
  const out = [];
  for (let i = 0; i < symbols.length; i++) {
    const s = (symbols[i] || '').toString().trim().toUpperCase();
    if (!s || seen[s]) continue;
    seen[s] = true;
    out.push(s);
  }
  return out;
}

function extractSymbol(row) {
  const code = (row.code || row.Code || row.ticker || '').toString().trim().toUpperCase();
  if (!code) return null;
  if (code.indexOf('.') !== -1) return code;
  const exchange = (row.exchange || row.Exchange || '').toString().trim().toUpperCase();
  if (exchange) return code + '.' + exchange;
  return null;
}

function normalizeEod(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => ({
    date: (r.date || '').toString(),
    close: safeNumber(r.close),
  })).filter((r) => r.date && Number.isFinite(r.close));
  rows.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));
  return rows;
}

function sma(values, window) {
  if (!Array.isArray(values) || values.length < window) return null;
  const slice = values.slice(values.length - window);
  return mean(slice);
}

function getFirstNumber(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (let i = 0; i < keys.length; i++) {
    const v = safeNumber(obj[keys[i]]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}

function extractIndicatorValue(payload) {
  if (Number.isFinite(payload)) return payload;
  if (Array.isArray(payload) && payload.length > 0 && payload[0] && typeof payload[0] === 'object') {
    const first = payload[0];
    const blocked = { date: true, datetime: true, timestamp: true, gmtoffset: true, open: true, high: true, low: true, close: true, volume: true };
    const keys = Object.keys(first);
    for (let i = 0; i < keys.length; i++) {
      if (blocked[keys[i]]) continue;
      const v = safeNumber(first[keys[i]]);
      if (Number.isFinite(v)) return v;
    }
  }
  if (payload && typeof payload === 'object') {
    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
      const v = safeNumber(payload[keys[i]]);
      if (Number.isFinite(v)) return v;
    }
  }
  return null;
}

function classifyValuation(pe, pb, peCheap, peExpensive, pbCheap, pbExpensive) {
  const cheapVotes = (Number.isFinite(pe) && pe <= peCheap ? 1 : 0) + (Number.isFinite(pb) && pb <= pbCheap ? 1 : 0);
  const expensiveVotes = (Number.isFinite(pe) && pe >= peExpensive ? 1 : 0) + (Number.isFinite(pb) && pb >= pbExpensive ? 1 : 0);
  if (cheapVotes > expensiveVotes && cheapVotes > 0) return 'cheap';
  if (expensiveVotes > cheapVotes && expensiveVotes > 0) return 'expensive';
  if (cheapVotes > 0 && expensiveVotes === 0) return 'cheap';
  if (expensiveVotes > 0 && cheapVotes === 0) return 'expensive';
  return 'fair';
}

function classifyMomentum(return1mPct, close, sma50, rsi) {
  if (!Number.isFinite(return1mPct) || !Number.isFinite(close) || !Number.isFinite(sma50)) return 'neutral';
  const aboveTrend = close > sma50;
  const belowTrend = close < sma50;
  const rsiBull = !Number.isFinite(rsi) || rsi >= 55;
  const rsiBear = !Number.isFinite(rsi) || rsi <= 45;
  if (return1mPct >= 8 && aboveTrend && rsiBull) return 'strong';
  if (return1mPct <= -8 && belowTrend && rsiBear) return 'weak';
  return 'neutral';
}

function setupType(valuationClass, momentumClass) {
  if (valuationClass === 'cheap' && momentumClass === 'strong') return 'bullish-convergence';
  if (valuationClass === 'expensive' && momentumClass === 'weak') return 'bearish-convergence';
  if (valuationClass === 'expensive' && momentumClass === 'strong') return 'conflict-expensive-strong';
  if (valuationClass === 'cheap' && momentumClass === 'weak') return 'conflict-cheap-weak';
  return 'unclassified';
}

async function fetchJson(url, label) {
  try {
    const response = await ld.request({
      url,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      body: null,
    });
    if (response.status === 404 || response.status === 422) return null;
    if (response.status < 200 || response.status >= 300) {
      const err = new Error(label + ' request failed');
      err.status = response.status;
      err.details = response.json || null;
      throw err;
    }
    return response.json;
  } catch (e) {
    if (e.status === 404 || e.status === 422) return null;
    throw e;
  }
}

const input = (data && data.input) ? data.input : {};
const inputCompatibility = [];
const INPUT_ALIASES = {
  screener_filters: ['screenerFilters'],
  screener_signals: ['screenerSignals'],
  screener_sort: ['screenerSort'],
  candidate_limit: ['candidateLimit'],
  lookback_days: ['lookbackDays'],
  include_technicals: ['includeTechnicals'],
  rsi_period: ['rsiPeriod'],
  result_limit: ['resultLimit'],
  pe_cheap_threshold: ['peCheapThreshold'],
  pe_expensive_threshold: ['peExpensiveThreshold'],
  pb_cheap_threshold: ['pbCheapThreshold'],
  pb_expensive_threshold: ['pbExpensiveThreshold'],
  output_mode: ['outputMode'],
};

const inputSymbols = getCanonicalInput(input, 'symbols', [], '', inputCompatibility);
const screenerFilters = getCanonicalInput(input, 'screener_filters', INPUT_ALIASES.screener_filters, '', inputCompatibility);
const screenerSignals = getCanonicalInput(input, 'screener_signals', INPUT_ALIASES.screener_signals, '', inputCompatibility);
const screenerSort = getCanonicalInput(input, 'screener_sort', INPUT_ALIASES.screener_sort, 'market_capitalization.desc', inputCompatibility);
const candidateLimit = clampNumber(getCanonicalInput(input, 'candidate_limit', INPUT_ALIASES.candidate_limit, 30, inputCompatibility), 30, 5, 120);
const lookbackDays = clampNumber(getCanonicalInput(input, 'lookback_days', INPUT_ALIASES.lookback_days, 180, inputCompatibility), 180, 60, 1500);
const includeTechnicals = asBool(getCanonicalInput(input, 'include_technicals', INPUT_ALIASES.include_technicals, true, inputCompatibility), true);
const rsiPeriod = clampNumber(getCanonicalInput(input, 'rsi_period', INPUT_ALIASES.rsi_period, 14, inputCompatibility), 14, 2, 50);
const resultLimit = clampNumber(getCanonicalInput(input, 'result_limit', INPUT_ALIASES.result_limit, 10, inputCompatibility), 10, 3, 30);
const peCheapThreshold = clampNumber(getCanonicalInput(input, 'pe_cheap_threshold', INPUT_ALIASES.pe_cheap_threshold, 15, inputCompatibility), 15, 1, 100);
const peExpensiveThreshold = clampNumber(getCanonicalInput(input, 'pe_expensive_threshold', INPUT_ALIASES.pe_expensive_threshold, 30, inputCompatibility), 30, 2, 200);
const pbCheapThreshold = clampNumber(getCanonicalInput(input, 'pb_cheap_threshold', INPUT_ALIASES.pb_cheap_threshold, 2, inputCompatibility), 2, 0.1, 30);
const pbExpensiveThreshold = clampNumber(getCanonicalInput(input, 'pb_expensive_threshold', INPUT_ALIASES.pb_expensive_threshold, 5, inputCompatibility), 5, 0.2, 50);
const outputMode = getCanonicalInput(input, 'output_mode', INPUT_ALIASES.output_mode, 'compact', inputCompatibility).toLowerCase();
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'output_mode must be compact or full.' };

let parsedFilters = null;
if (screenerFilters) {
  try {
    parsedFilters = JSON.parse(screenerFilters);
  } catch (e) {
    return { error: true, message: 'screenerFilters must be valid JSON', details: e.message };
  }
}

const explicitSymbols = dedupeSymbols(inputSymbols ? inputSymbols.split(',').map((s) => s.trim()) : []);
if (explicitSymbols.length === 0 && !parsedFilters && !screenerSignals) {
  return { error: true, message: 'Provide symbols or screener filters/signals.' };
}

const diagnostics = {
  calls: {
    screener: 0,
    fundamentals: 0,
    eod: 0,
    technical: 0,
  },
  errors: [],
};
const riskFlags = [];

try {
  let universe = explicitSymbols.slice();
  if (universe.length === 0) {
    const sParams = [];
    addParam(sParams, 'api_token', apiKey);
    addParam(sParams, 'fmt', 'json');
    addParam(sParams, 'sort', screenerSort);
    addParam(sParams, 'limit', candidateLimit);
    addParam(sParams, 'offset', 0);
    if (parsedFilters) addParam(sParams, 'filters', JSON.stringify(parsedFilters));
    if (screenerSignals) addParam(sParams, 'signals', screenerSignals);
    const sUrl = `https://eodhd.com/api/screener?${sParams.join('&')}`;
    diagnostics.calls.screener += 1;
    const sRaw = await fetchJson(sUrl, 'screener');
    const rows = Array.isArray(sRaw) ? sRaw : (Array.isArray(sRaw.data) ? sRaw.data : (Array.isArray(sRaw.results) ? sRaw.results : []));
    universe = dedupeSymbols(rows.map(extractSymbol).filter(Boolean)).slice(0, candidateLimit);
  }

  if (universe.length === 0) {
    return { error: true, message: 'No symbols available for analysis.' };
  }

  const toDate = formatDate(new Date());
  const fromDate = dateDaysAgo(lookbackDays + 20);
  const rows = [];

  for (let i = 0; i < universe.length; i++) {
    const symbol = universe[i];
    let fundamentals = null;
    try {
      const fParams = [];
      addParam(fParams, 'api_token', apiKey);
      addParam(fParams, 'fmt', 'json');
      const fUrl = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?${fParams.join('&')}`;
      diagnostics.calls.fundamentals += 1;
      fundamentals = await fetchJson(fUrl, `fundamentals:${symbol}`);
    } catch (e) {
      diagnostics.errors.push({ stage: 'fundamentals', symbol, status: e.status || null, message: e.message || 'fundamentals failed' });
    }

    let eodRows = [];
    try {
      const eParams = [];
      addParam(eParams, 'api_token', apiKey);
      addParam(eParams, 'fmt', 'json');
      addParam(eParams, 'period', 'd');
      addParam(eParams, 'order', 'a');
      addParam(eParams, 'from', fromDate);
      addParam(eParams, 'to', toDate);
      const eUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eParams.join('&')}`;
      diagnostics.calls.eod += 1;
      const eRaw = await fetchJson(eUrl, `eod:${symbol}`);
      eodRows = normalizeEod(eRaw);
    } catch (e) {
      diagnostics.errors.push({ stage: 'eod', symbol, status: e.status || null, message: e.message || 'eod failed' });
      continue;
    }
    if (eodRows.length < 55) continue;

    let rsi = null;
    if (includeTechnicals) {
      try {
        const tParams = [];
        addParam(tParams, 'api_token', apiKey);
        addParam(tParams, 'fmt', 'json');
        addParam(tParams, 'function', 'rsi');
        addParam(tParams, 'period', rsiPeriod);
        addParam(tParams, 'order', 'd');
        addParam(tParams, 'from', fromDate);
        addParam(tParams, 'to', toDate);
        const tUrl = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?${tParams.join('&')}`;
        diagnostics.calls.technical += 1;
        const tRaw = await fetchJson(tUrl, `technical:${symbol}`);
        rsi = extractIndicatorValue(tRaw);
      } catch (e) {
        diagnostics.errors.push({ stage: 'technical', symbol, status: e.status || null, message: e.message || 'technical failed' });
      }
    }

    const highlights = (fundamentals && fundamentals.Highlights) || {};
    const valuation = (fundamentals && fundamentals.Valuation) || {};
    const pe = getFirstNumber(valuation, ['TrailingPE', 'ForwardPE', 'PERatio', 'PriceEarningsRatio']);
    const pb = getFirstNumber(valuation, ['PriceBookMRQ', 'PriceBook']);

    const closes = eodRows.map((r) => r.close);
    const close = closes[closes.length - 1];
    const close20 = closes[closes.length - 21];
    const return1m = pctChange(close20, close);
    const sma50 = sma(closes, 50);

    const valuationClass = classifyValuation(pe, pb, peCheapThreshold, peExpensiveThreshold, pbCheapThreshold, pbExpensiveThreshold);
    const momentumClass = classifyMomentum(return1m, close, sma50, rsi);
    const type = setupType(valuationClass, momentumClass);

    const cheapStretch = Math.max(0, Number.isFinite(pe) ? (peCheapThreshold - pe) : 0) * 1.5
      + Math.max(0, Number.isFinite(pb) ? (pbCheapThreshold - pb) : 0) * 8;
    const expensiveStretch = Math.max(0, Number.isFinite(pe) ? (pe - peExpensiveThreshold) : 0) * 1.2
      + Math.max(0, Number.isFinite(pb) ? (pb - pbExpensiveThreshold) : 0) * 8;
    const momentumStretch = Math.abs(Number.isFinite(return1m) ? return1m : 0) + Math.abs(Number.isFinite(rsi) ? (rsi - 50) : 0) * 0.3;
    const convictionScore = round((type === 'bullish-convergence' || type === 'conflict-cheap-weak' ? cheapStretch : expensiveStretch) + momentumStretch, 3);

    const why = [];
    if (valuationClass === 'cheap') why.push('Valuation screens cheap');
    if (valuationClass === 'expensive') why.push('Valuation screens expensive');
    if (momentumClass === 'strong') why.push('Momentum regime is strong');
    if (momentumClass === 'weak') why.push('Momentum regime is weak');
    if (Number.isFinite(return1m)) why.push(`1M return ${round(return1m, 2)}%`);

    rows.push({
      symbol,
      valuationClass,
      momentumClass,
      setupType: type,
      convictionScore,
      metrics: {
        close: round(close, 4),
        return1mPct: round(return1m, 3),
        sma50: round(sma50, 4),
        rsi: round(rsi, 3),
        pe: round(pe, 3),
        pb: round(pb, 3),
        roe: round(getFirstNumber(highlights, ['ReturnOnEquityTTM', 'ReturnOnEquity']), 6),
        profitMargin: round(getFirstNumber(highlights, ['ProfitMargin', 'ProfitMarginTTM']), 6),
      },
      why,
    });
  }

  if (rows.length === 0) {
    return { error: true, message: 'No symbols produced usable valuation/momentum metrics.' };
  }

  rows.sort((a, b) => b.convictionScore - a.convictionScore);

  const compactTableCap = 10;
  const tableLimit = outputMode === 'compact' ? Math.min(resultLimit, compactTableCap) : resultLimit;
  const bullishConvergence = rows.filter((r) => r.setupType === 'bullish-convergence').slice(0, tableLimit);
  const bearishConvergence = rows.filter((r) => r.setupType === 'bearish-convergence').slice(0, tableLimit);
  const conflictExpensiveStrong = rows.filter((r) => r.setupType === 'conflict-expensive-strong').slice(0, tableLimit);
  const conflictCheapWeak = rows.filter((r) => r.setupType === 'conflict-cheap-weak').slice(0, tableLimit);
  const neutralOrOther = rows.filter((r) => r.setupType === 'unclassified').slice(0, tableLimit);

  const keyTakeaways = [];
  keyTakeaways.push(`Analyzed ${rows.length} symbols for valuation-momentum relationship.`);
  keyTakeaways.push(`Bullish convergence candidates: ${bullishConvergence.length}; bearish convergence candidates: ${bearishConvergence.length}.`);
  keyTakeaways.push(`Conflict buckets -> expensive+strong: ${conflictExpensiveStrong.length}, cheap+weak: ${conflictCheapWeak.length}.`);
  if (rows.length > 0) keyTakeaways.push(`Top conviction setup: ${rows[0].symbol} (${rows[0].setupType}, score ${rows[0].convictionScore}).`);

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed; affected symbols may have partial metrics.`);
  }

  const truncationNotes = [];
  if (outputMode === 'compact' && resultLimit > compactTableCap) {
    truncationNotes.push(`Compact mode capped bucket tables to ${compactTableCap} rows each.`);
  }
  if (rows.length > tableLimit) {
    truncationNotes.push(`Summary output omits ${rows.length - tableLimit} additional ranked setups; use valuation_vs_momentum_conflicts_details for full ranking.`);
  }
  const endpointDiagnostics = Object.assign({}, diagnostics, {
    outputMode,
    truncated: truncationNotes.length > 0,
    truncationNotes,
    aliasWarnings: deprecationWarnings(inputCompatibility),
    inputCompatibility,
  });

  return {
    headline_summary: {
      symbolsAnalyzed: rows.length,
      topSetup: rows[0] ? { symbol: rows[0].symbol, setupType: rows[0].setupType, convictionScore: rows[0].convictionScore } : null,
      bucketCounts: {
        bullishConvergence: bullishConvergence.length,
        bearishConvergence: bearishConvergence.length,
        conflictExpensiveStrong: conflictExpensiveStrong.length,
        conflictCheapWeak: conflictCheapWeak.length,
      },
    },
    tables: {
      bullishConvergence,
      bearishConvergence,
      conflictExpensiveStrong,
      conflictCheapWeak,
      neutralOrOther,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
    classification_model: {
      valuation: {
        cheap: `PE<=${peCheapThreshold} or P/B<=${pbCheapThreshold}`,
        expensive: `PE>=${peExpensiveThreshold} or P/B>=${pbExpensiveThreshold}`,
      },
      momentum: {
        strong: '1M return>=8%, close>SMA50, RSI>=55 (if available)',
        weak: '1M return<=-8%, close<SMA50, RSI<=45 (if available)',
      },
    },
    calculation_notes: {
      return1mPct: '(latest_close - close_20_sessions_ago) / close_20_sessions_ago * 100',
      setupType: 'combination of valuationClass and momentumClass',
      convictionScore: 'valuation stretch beyond thresholds + momentum magnitude',
    },
    metadata: {
      source: 'EODHD bundle action: valuation_vs_momentum_conflicts',
      actionType: 'summary',
      pairedAction: 'valuation_vs_momentum_conflicts_details',
      generatedAt: new Date().toISOString(),
      parameters: {
        candidateLimit,
        lookbackDays,
        includeTechnicals,
        rsiPeriod,
        resultLimit,
        peCheapThreshold,
        peExpensiveThreshold,
        pbCheapThreshold,
        pbExpensiveThreshold,
        explicitSymbols,
        screenerFiltersProvided: Boolean(parsedFilters),
        screenerSignals: screenerSignals || null,
        outputMode,
      },
      inputCompatibility,
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'valuation_vs_momentum_conflicts failed',
    details: error.message || String(error),
  };
}
