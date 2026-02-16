// name = Screen To Story Details
// description = Returns full ranked candidate tables and score decomposition for screen-to-story runs.
//
// screenerFilters = Screener filters JSON string (optional if screenerSignals provided)
// screenerSignals = Screener signals (comma-separated, optional if screenerFilters provided)
// screenerSort = Screener sort expression (default: market_capitalization.desc)
// candidateLimit = Maximum symbols from screener to analyze (default: 25, min: 5, max: 100)
// shortlistSize = Number of ranked ideas to return (default: 8, min: 3, max: 20)
// lookbackDays = EOD lookback days for momentum/volatility (default: 120, min: 40, max: 1500)
// includeTechnicals = Include RSI enrichment (default: true)
// rsiPeriod = RSI period (default: 14, min: 2, max: 50)
// includeNews = Include news intensity/rationale (default: true)
// newsDays = News lookback days (default: 7, min: 1, max: 60)
// newsLimit = Max news items to fetch (default: 100, min: 1, max: 250)
// outputMode = compact|full (default: full)
// tableLimit = Max rows for full ranked candidate tables (default: compact=50, full=200, min: 1, max: 500)

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

function clamp(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
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

function stddev(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function annualizedVol20(closes) {
  if (!Array.isArray(closes) || closes.length < 22) return null;
  const slice = closes.slice(-21);
  const logReturns = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1];
    const curr = slice[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0 || curr <= 0) continue;
    logReturns.push(Math.log(curr / prev));
  }
  const s = stddev(logReturns);
  if (!Number.isFinite(s)) return null;
  return s * Math.sqrt(252) * 100;
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

function getFirstNumber(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (let i = 0; i < keys.length; i++) {
    const v = safeNumber(obj[keys[i]]);
    if (Number.isFinite(v)) return v;
  }
  return null;
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

const screenerFilters = (data.input.screenerFilters || '').toString().trim();
const screenerSignals = (data.input.screenerSignals || '').toString().trim();
const screenerSort = (data.input.screenerSort || 'market_capitalization.desc').toString().trim();
const candidateLimit = clampNumber(data.input.candidateLimit, 25, 5, 100);
const shortlistSize = clampNumber(data.input.shortlistSize, 8, 3, 20);
const lookbackDays = clampNumber(data.input.lookbackDays, 120, 40, 1500);
const includeTechnicals = asBool(data.input.includeTechnicals, true);
const rsiPeriod = clampNumber(data.input.rsiPeriod, 14, 2, 50);
const includeNews = asBool(data.input.includeNews, true);
const newsDays = clampNumber(data.input.newsDays, 7, 1, 60);
const newsLimit = clampNumber(data.input.newsLimit, 100, 1, 250);
const outputMode = (data.input.outputMode || 'full').toString().trim().toLowerCase();
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };
const tableLimit = clampNumber(data.input.tableLimit, outputMode === 'compact' ? 50 : 200, 1, 500);

if (!screenerFilters && !screenerSignals) {
  return { error: true, message: 'Provide screenerFilters or screenerSignals for screen_to_story.' };
}

let parsedFilters = null;
if (screenerFilters) {
  try {
    parsedFilters = JSON.parse(screenerFilters);
  } catch (e) {
    return { error: true, message: 'screenerFilters must be valid JSON', details: e.message };
  }
}

const diagnostics = {
  calls: {
    screener: 0,
    fundamentals: 0,
    eod: 0,
    technical: 0,
    news: 0,
  },
  errors: [],
};
const riskFlags = [];

try {
  const toDate = formatDate(new Date());
  const fromEod = dateDaysAgo(lookbackDays + 20);
  const fromNews = dateDaysAgo(newsDays);

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
  const screenerRows = Array.isArray(sRaw) ? sRaw : (Array.isArray(sRaw.data) ? sRaw.data : (Array.isArray(sRaw.results) ? sRaw.results : []));
  if (screenerRows.length === 0) {
    return { error: true, message: 'Screener returned no candidates for supplied filters/signals.' };
  }

  const candidates = [];
  for (let i = 0; i < screenerRows.length; i++) {
    const row = screenerRows[i] || {};
    const symbol = extractSymbol(row);
    if (!symbol) continue;
    candidates.push({
      symbol,
      sector: (row.sector || row.Sector || null),
      marketCap: safeNumber(row.market_capitalization || row.MarketCapitalization || row.marketCap),
    });
  }

  const dedupedSymbols = dedupeSymbols(candidates.map((c) => c.symbol)).slice(0, candidateLimit);
  const candidateMap = {};
  for (let i = 0; i < candidates.length; i++) {
    if (!candidateMap[candidates[i].symbol]) candidateMap[candidates[i].symbol] = candidates[i];
  }

  const newsBySymbol = {};
  if (includeNews && dedupedSymbols.length > 0) {
    try {
      const nParams = [];
      addParam(nParams, 'api_token', apiKey);
      addParam(nParams, 'fmt', 'json');
      addParam(nParams, 's', dedupedSymbols.join(','));
      addParam(nParams, 'from', fromNews);
      addParam(nParams, 'to', toDate);
      addParam(nParams, 'limit', newsLimit);
      const nUrl = `https://eodhd.com/api/news?${nParams.join('&')}`;
      diagnostics.calls.news += 1;
      const nRaw = await fetchJson(nUrl, 'news');
      const newsItems = Array.isArray(nRaw) ? nRaw : [];
      for (let i = 0; i < newsItems.length; i++) {
        const item = newsItems[i] || {};
        const symbols = Array.isArray(item.symbols) ? item.symbols : String(item.symbols || '').split(',');
        const normalized = dedupeSymbols(symbols.map((s) => String(s).trim()));
        for (let j = 0; j < normalized.length; j++) {
          const sym = normalized[j];
          if (!newsBySymbol[sym]) newsBySymbol[sym] = [];
          if (newsBySymbol[sym].length < 4) {
            newsBySymbol[sym].push({
              date: item.date || null,
              title: item.title || null,
              source: item.source || null,
              link: item.link || null,
            });
          }
        }
      }
    } catch (e) {
      diagnostics.errors.push({ stage: 'news', status: e.status || null, message: e.message || 'news failed' });
      riskFlags.push('News enrichment failed; narrative score uses price/fundamental data only.');
    }
  }

  const scoredCandidates = [];
  for (let i = 0; i < dedupedSymbols.length; i++) {
    const symbol = dedupedSymbols[i];
    const base = candidateMap[symbol] || { symbol, sector: null, marketCap: null };
    const entry = {
      symbol,
      sector: base.sector || null,
      marketCap: base.marketCap,
      metrics: {},
      scores: {},
      compositeScore: null,
      whyNow: [],
      risks: [],
      headlines: newsBySymbol[symbol] || [],
    };

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
      addParam(eParams, 'from', fromEod);
      addParam(eParams, 'to', toDate);
      const eUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eParams.join('&')}`;
      diagnostics.calls.eod += 1;
      const eRaw = await fetchJson(eUrl, `eod:${symbol}`);
      eodRows = normalizeEod(eRaw);
    } catch (e) {
      diagnostics.errors.push({ stage: 'eod', symbol, status: e.status || null, message: e.message || 'eod failed' });
    }

    if (eodRows.length < 22) {
      entry.risks.push('Insufficient EOD history for robust momentum/volatility scoring.');
      continue;
    }

    const closes = eodRows.map((r) => r.close);
    const latest = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const close20 = closes[closes.length - 21];
    const return1d = pctChange(prev, latest);
    const return1m = pctChange(close20, latest);
    const vol20 = annualizedVol20(closes);

    let rsi = null;
    if (includeTechnicals) {
      try {
        const tParams = [];
        addParam(tParams, 'api_token', apiKey);
        addParam(tParams, 'fmt', 'json');
        addParam(tParams, 'function', 'rsi');
        addParam(tParams, 'period', rsiPeriod);
        addParam(tParams, 'order', 'd');
        addParam(tParams, 'from', fromEod);
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
    const roe = getFirstNumber(highlights, ['ReturnOnEquityTTM', 'ReturnOnEquity']);
    const profitMargin = getFirstNumber(highlights, ['ProfitMargin', 'ProfitMarginTTM']);
    const revenueGrowth = getFirstNumber(highlights, ['QuarterlyRevenueGrowthYOY', 'RevenueGrowthYOY']);

    let valueScore = 50;
    if (Number.isFinite(pe)) valueScore += clamp((20 - pe) * 2.0, -35, 35);
    if (Number.isFinite(pb)) valueScore += clamp((3 - pb) * 8.0, -25, 25);
    valueScore = clamp(valueScore, 0, 100);

    let qualityScore = 50;
    if (Number.isFinite(roe)) qualityScore += clamp((roe - 0.12) * 200, -30, 30);
    if (Number.isFinite(profitMargin)) qualityScore += clamp((profitMargin - 0.1) * 200, -20, 20);
    if (Number.isFinite(revenueGrowth)) qualityScore += clamp(revenueGrowth * 150, -20, 20);
    qualityScore = clamp(qualityScore, 0, 100);

    let momentumScore = 50;
    if (Number.isFinite(return1m)) momentumScore += clamp(return1m * 1.8, -35, 35);
    if (Number.isFinite(rsi)) {
      if (rsi >= 55 && rsi <= 70) momentumScore += 10;
      if (rsi < 35) momentumScore -= 10;
    }
    momentumScore = clamp(momentumScore, 0, 100);

    let narrativeScore = 40;
    const headlineCount = entry.headlines.length;
    narrativeScore += Math.min(headlineCount * 8, 40);
    narrativeScore = clamp(narrativeScore, 0, 100);

    const composite = (qualityScore * 0.35) + (momentumScore * 0.35) + (valueScore * 0.2) + (narrativeScore * 0.1);

    if (Number.isFinite(return1m) && return1m > 8) entry.whyNow.push('Strong 1M momentum');
    if (Number.isFinite(rsi) && rsi >= 55 && rsi <= 70) entry.whyNow.push('Constructive RSI regime');
    if (Number.isFinite(valueScore) && valueScore >= 65) entry.whyNow.push('Valuation score above threshold');
    if (Number.isFinite(qualityScore) && qualityScore >= 65) entry.whyNow.push('Quality metrics above threshold');
    if (headlineCount >= 2) entry.whyNow.push('Elevated news flow supports story angle');
    if (entry.whyNow.length === 0) entry.whyNow.push('Balanced setup without extreme factor exposure');

    if (Number.isFinite(return1m) && return1m < -8) entry.risks.push('Negative 1M momentum');
    if (Number.isFinite(rsi) && rsi >= 75) entry.risks.push('Potentially overextended RSI');
    if (Number.isFinite(vol20) && vol20 >= 60) entry.risks.push('High realized volatility');
    if (Number.isFinite(valueScore) && valueScore <= 35) entry.risks.push('Valuation appears rich vs simple model');
    if (entry.risks.length === 0) entry.risks.push('No major quantitative red flags in current snapshot');

    entry.metrics = {
      return1dPct: round(return1d, 3),
      return1mPct: round(return1m, 3),
      vol20Pct: round(vol20, 3),
      rsi: round(rsi, 3),
      pe: round(pe, 3),
      pb: round(pb, 3),
      roe: round(roe, 6),
      profitMargin: round(profitMargin, 6),
      revenueGrowthYoY: round(revenueGrowth, 6),
      headlineCount,
    };
    entry.scores = {
      value: round(valueScore, 2),
      quality: round(qualityScore, 2),
      momentum: round(momentumScore, 2),
      narrative: round(narrativeScore, 2),
    };
    entry.compositeScore = round(composite, 2);
    scoredCandidates.push(entry);
  }

  if (scoredCandidates.length === 0) {
    return { error: true, message: 'No candidates produced usable scoring output.' };
  }

  scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
  const fullRankedCandidates = scoredCandidates.slice(0, tableLimit);
  let shortlist = fullRankedCandidates.slice(0, shortlistSize);
  if (shortlist.length === fullRankedCandidates.length) shortlist = [];
  const rejected = shortlist.length === 0 ? [] : fullRankedCandidates.slice(shortlistSize);

  const keyTakeaways = [];
  keyTakeaways.push(`Screen generated ${scoredCandidates.length} scored candidates; shortlist contains ${shortlist.length}.`);
  const topIdeaRow = shortlist[0] || fullRankedCandidates[0] || null;
  if (topIdeaRow) keyTakeaways.push(`Top idea: ${topIdeaRow.symbol} (composite ${topIdeaRow.compositeScore}).`);
  if (shortlist.length > 0) keyTakeaways.push(`Median shortlist composite score: ${round(mean(shortlist.map((x) => x.compositeScore)), 2)}.`);

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed; results are based on partial enrichment for affected symbols.`);
  }

  const truncationNotes = [];
  if (scoredCandidates.length > fullRankedCandidates.length) {
    truncationNotes.push(`fullRankedCandidates truncated to ${fullRankedCandidates.length} rows.`);
  }
  if (shortlist.length === 0 && fullRankedCandidates.length > 0) {
    truncationNotes.push('shortlist and outsideShortlist omitted because they would duplicate fullRankedCandidates.');
  }
  const endpointDiagnostics = Object.assign({}, diagnostics, {
    outputMode,
    truncated: truncationNotes.length > 0,
    truncationNotes,
  });

  return {
    headline_summary: {
      candidatesAnalyzed: scoredCandidates.length,
      shortlistSize: shortlist.length,
      topIdea: topIdeaRow ? { symbol: topIdeaRow.symbol, compositeScore: topIdeaRow.compositeScore } : null,
      screenerSort,
    },
    tables: {
      shortlist,
      fullRankedCandidates,
      outsideShortlist: rejected,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
    scoring_model: {
      weights: {
        quality: 0.35,
        momentum: 0.35,
        value: 0.2,
        narrative: 0.1,
      },
      scoreRanges: 'Each subscore normalized to [0,100]. Composite is weighted sum.',
    },
    calculation_notes: {
      return1mPct: '(latest_close - close_20_sessions_ago) / close_20_sessions_ago * 100',
      annualizedVol20dPct: 'stdev(log daily returns over last 20 sessions) * sqrt(252) * 100',
      valueScore: 'heuristic from PE and P/B relative to anchor levels',
      qualityScore: 'heuristic from ROE, profit margin, and revenue growth',
      momentumScore: 'heuristic from 1M return and RSI regime',
      narrativeScore: 'heuristic from recent headline intensity',
    },
    metadata: {
      source: 'EODHD bundle action: screen_to_story_details',
      actionType: 'details',
      pairedAction: 'screen_to_story',
      generatedAt: new Date().toISOString(),
      parameters: {
        candidateLimit,
        shortlistSize,
        lookbackDays,
        includeTechnicals,
        rsiPeriod,
        includeNews,
        newsDays,
        newsLimit,
        screenerFiltersProvided: Boolean(parsedFilters),
        screenerSignals: screenerSignals || null,
        outputMode,
        tableLimit,
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'screen_to_story_details failed',
    details: error.message || String(error),
  };
}
