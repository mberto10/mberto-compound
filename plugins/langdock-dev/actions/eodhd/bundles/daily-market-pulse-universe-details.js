// name = Daily Market Pulse Universe Details
// description = Returns detailed per-symbol tables for a fixed input universe pulse run.
//
// symbols = Comma-separated symbols (required, e.g. AAPL.US,MSFT.US,NVDA.US)
// as_of_date = Analysis date in YYYY-MM-DD (required)
// top_n = Number of top gainers/losers/movers to return (default: 5, min: 1, max: 30)
// lookback_days = EOD lookback window for volatility and context (default: 90, min: 20, max: 365)
// output_mode = compact|full (default: full)
// table_limit = Max rows for detail tables (default: compact=50, full=300, min: 1, max: 1000)
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

function pctChange(fromValue, toValue) {
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === 0) return null;
  return ((toValue - fromValue) / fromValue) * 100;
}

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stddev(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (!str) return;
  params.push(key + '=' + encodeURIComponent(str));
}

function isValidDateString(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

function dateDaysAgo(fromDate, days) {
  const d = new Date(fromDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
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

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeEod(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => ({
    date: (r.date || '').toString(),
    close: safeNumber(r.close),
    volume: safeNumber(r.volume),
  })).filter((r) => r.date && Number.isFinite(r.close));
  rows.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));
  return rows;
}

function annualizedVol20FromRows(rows, idx) {
  if (!Array.isArray(rows) || idx < 21) return null;
  const closes = rows.slice(idx - 20, idx + 1).map((r) => r.close);
  const logReturns = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0 || curr <= 0) continue;
    logReturns.push(Math.log(curr / prev));
  }
  const s = stddev(logReturns);
  if (!Number.isFinite(s)) return null;
  return s * Math.sqrt(252) * 100;
}

function findAsOfIndex(rows, asOfDate) {
  let idx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].date <= asOfDate) idx = i;
    else break;
  }
  return idx;
}

function sameRows(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

async function fetchJson(url, label) {
  const response = await ld.request({
    url,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
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

const input = (data && data.input) ? data.input : {};
const inputCompatibility = [];
const INPUT_ALIASES = {
  as_of_date: ['asOfDate'],
  top_n: ['topN'],
  lookback_days: ['lookbackDays'],
  output_mode: ['outputMode'],
  table_limit: ['tableLimit'],
};

const symbolsInput = getCanonicalInput(input, 'symbols', [], '', inputCompatibility);
const asOfDate = getCanonicalInput(input, 'as_of_date', INPUT_ALIASES.as_of_date, '', inputCompatibility);
const topN = clampNumber(getCanonicalInput(input, 'top_n', INPUT_ALIASES.top_n, 5, inputCompatibility), 5, 1, 30);
const lookbackDays = clampNumber(getCanonicalInput(input, 'lookback_days', INPUT_ALIASES.lookback_days, 90, inputCompatibility), 90, 20, 365);
const outputMode = getCanonicalInput(input, 'output_mode', INPUT_ALIASES.output_mode, 'full', inputCompatibility).toLowerCase();
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'output_mode must be compact or full.' };
const tableLimit = clampNumber(getCanonicalInput(input, 'table_limit', INPUT_ALIASES.table_limit, outputMode === 'compact' ? 50 : 300, inputCompatibility), outputMode === 'compact' ? 50 : 300, 1, 1000);

if (!symbolsInput) return { error: true, message: 'symbols is required. Provide comma-separated symbols.' };
if (!asOfDate) return { error: true, message: 'as_of_date is required (YYYY-MM-DD).' };
if (!isValidDateString(asOfDate)) return { error: true, message: 'Invalid as_of_date format. Use YYYY-MM-DD.' };

const symbols = dedupeSymbols(symbolsInput.split(',').map((s) => s.trim()).filter(Boolean));
if (symbols.length === 0) return { error: true, message: 'No valid symbols after parsing input.' };

const diagnostics = {
  calls: { eod: 0 },
  errors: [],
};
const riskFlags = [];

try {
  const fromDate = dateDaysAgo(asOfDate, lookbackDays + 20);
  const snapshots = [];

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    try {
      const eParams = [];
      addParam(eParams, 'api_token', apiKey);
      addParam(eParams, 'fmt', 'json');
      addParam(eParams, 'period', 'd');
      addParam(eParams, 'order', 'a');
      addParam(eParams, 'from', fromDate);
      addParam(eParams, 'to', asOfDate);
      const eUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eParams.join('&')}`;
      diagnostics.calls.eod += 1;
      const eRaw = await fetchJson(eUrl, `eod:${symbol}`);
      const rows = normalizeEod(eRaw);
      const asOfIdx = findAsOfIndex(rows, asOfDate);
      if (asOfIdx < 1) continue;

      const latest = rows[asOfIdx];
      const prev = rows[asOfIdx - 1];
      const return1d = pctChange(prev.close, latest.close);
      const return5d = asOfIdx >= 5 ? pctChange(rows[asOfIdx - 5].close, latest.close) : null;
      const return20d = asOfIdx >= 20 ? pctChange(rows[asOfIdx - 20].close, latest.close) : null;
      const vol20 = annualizedVol20FromRows(rows, asOfIdx);

      snapshots.push({
        symbol,
        asOfDate: latest.date,
        close: round(latest.close, 4),
        previousClose: round(prev.close, 4),
        return1dPct: round(return1d, 3),
        return5dPct: round(return5d, 3),
        return20dPct: round(return20d, 3),
        vol20Pct: round(vol20, 3),
        volume: safeNumber(latest.volume),
      });
    } catch (e) {
      diagnostics.errors.push({ stage: 'eod', symbol, status: e.status || null, message: e.message || 'eod failed' });
    }
  }

  if (snapshots.length === 0) {
    return { error: true, message: 'No symbols had sufficient EOD data for the requested date.', details: diagnostics };
  }

  const validReturns = snapshots.filter((r) => Number.isFinite(r.return1dPct));
  const sortedByReturn = validReturns.slice().sort((a, b) => b.return1dPct - a.return1dPct);
  const topTableLimit = outputMode === 'compact' ? Math.min(topN, 10) : topN;
  const topGainers = sortedByReturn.slice(0, topTableLimit);
  const topLosers = sortedByReturn.slice(-topTableLimit).reverse();
  const topMoversAbsRaw = validReturns.slice().sort((a, b) => Math.abs(b.return1dPct) - Math.abs(a.return1dPct)).slice(0, topTableLimit);
  const topMoversAbs = (sameRows(topMoversAbsRaw, topGainers) || sameRows(topMoversAbsRaw, topLosers)) ? [] : topMoversAbsRaw;
  const symbolSnapshots = snapshots.slice(0, tableLimit);

  const advancers = validReturns.filter((r) => r.return1dPct > 0.05).length;
  const decliners = validReturns.filter((r) => r.return1dPct < -0.05).length;
  const unchanged = validReturns.length - advancers - decliners;
  const breadthPct = validReturns.length ? (advancers / validReturns.length) * 100 : null;
  const medianReturn = median(validReturns.map((r) => r.return1dPct));

  const keyTakeaways = [];
  keyTakeaways.push(`Universe size: ${snapshots.length} symbols from explicit input.`);
  keyTakeaways.push(`Breadth on ${asOfDate}: ${advancers} advancers / ${decliners} decliners / ${unchanged} flat.`);
  if (topGainers.length > 0) keyTakeaways.push(`Top gainer: ${topGainers[0].symbol} (${round(topGainers[0].return1dPct, 2)}%).`);
  if (topLosers.length > 0) keyTakeaways.push(`Top loser: ${topLosers[0].symbol} (${round(topLosers[0].return1dPct, 2)}%).`);

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed; rankings are based on available symbols.`);
  }

  const truncationNotes = [];
  if (outputMode === 'compact' && topN > 10) {
    truncationNotes.push('Compact mode capped leaderboard tables to 10 rows.');
  }
  if (topMoversAbs.length === 0 && topMoversAbsRaw.length > 0) {
    truncationNotes.push('topMoversAbs omitted because it duplicated topGainers/topLosers for this dataset.');
  }
  if (snapshots.length > symbolSnapshots.length) {
    truncationNotes.push(`symbolSnapshots truncated to ${symbolSnapshots.length} rows.`);
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
      asOfDate,
      analyzedSymbols: snapshots.length,
      breadthPct: round(breadthPct, 2),
      medianReturn1dPct: round(medianReturn, 3),
      topGainer: topGainers[0] ? { symbol: topGainers[0].symbol, return1dPct: topGainers[0].return1dPct } : null,
      topLoser: topLosers[0] ? { symbol: topLosers[0].symbol, return1dPct: topLosers[0].return1dPct } : null,
    },
    market_breadth: {
      advancers,
      decliners,
      unchanged,
      breadthPct: round(breadthPct, 2),
      medianReturn1dPct: round(medianReturn, 3),
    },
    tables: {
      topGainers,
      topLosers,
      topMoversAbs,
      symbolSnapshots,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
    calculation_notes: {
      return1dPct: '(asOf_close - previous_close) / previous_close * 100',
      return5dPct: '(asOf_close - close_5_sessions_ago) / close_5_sessions_ago * 100',
      return20dPct: '(asOf_close - close_20_sessions_ago) / close_20_sessions_ago * 100',
      breadthPct: 'advancers / analyzed_symbols * 100',
      annualizedVol20dPct: 'stdev(log daily returns over 20 sessions) * sqrt(252) * 100',
    },
    metadata: {
      source: 'EODHD bundle action: daily_market_pulse_universe_details',
      actionType: 'details',
      pairedAction: 'daily_market_pulse_universe',
      generatedAt: new Date().toISOString(),
      parameters: { asOfDate, topN, lookbackDays, symbols, outputMode, tableLimit },
      inputCompatibility,
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'daily_market_pulse_universe_details failed',
    details: error.message || String(error),
  };
}
