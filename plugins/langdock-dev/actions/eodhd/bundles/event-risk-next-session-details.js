// name = Event Risk Next Session Details
// description = Returns detailed ranked event risk tables with bounded symbol-level event/headline context.
//
// symbols = Optional comma-separated symbols to prioritize (e.g. AAPL.US,MSFT.US)
// from = Start date YYYY-MM-DD (default: today)
// to = End date YYYY-MM-DD (default: +2 days)
// daysAhead = Used when to not provided (default: 2, min: 1, max: 14)
// includeIpos = Include IPO events (default: false)
// includeTrends = Include trends events if available (default: false)
// includeNews = Include recent headlines (default: true)
// newsLookbackDays = News lookback in days (default: 3, min: 1, max: 30)
// newsLimit = Maximum news items to fetch (default: 60, min: 1, max: 200)
// maxSymbols = Maximum symbols to score (default: 40, min: 5, max: 100)
// outputMode = compact|full (default: full)
// resultLimit = Max rows in ranked risk tables (default: compact=25, full=100, min: 1, max: 300)
// headlineLimitPerSymbol = Max headlines kept per symbol (default: 5, min: 1, max: 20)
// eventLimitPerSymbol = Max events kept per symbol (default: 6, min: 1, max: 30)

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

function round(value, decimals) {
  if (!Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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

function pctChange(fromValue, toValue) {
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === 0) return null;
  return ((toValue - fromValue) / fromValue) * 100;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function dateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return formatDate(d);
}

function dateDaysAhead(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
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

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function extractEventSymbol(event) {
  const direct = (event.code || event.Code || event.symbol || event.Symbol || event.ticker || '').toString().trim().toUpperCase();
  if (direct.indexOf('.') !== -1) return direct;
  const exchange = (event.exchange || event.Exchange || event.exchangeCode || '').toString().trim().toUpperCase();
  if (direct && exchange) return direct + '.' + exchange;
  if (direct) return direct;
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

function annualizedVol20(closes) {
  if (!Array.isArray(closes) || closes.length < 22) return null;
  const last = closes.slice(-21);
  const logReturns = [];
  for (let i = 1; i < last.length; i++) {
    const prev = last[i - 1];
    const curr = last[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0 || curr <= 0) continue;
    logReturns.push(Math.log(curr / prev));
  }
  const s = stddev(logReturns);
  if (!Number.isFinite(s)) return null;
  return s * Math.sqrt(252) * 100;
}

function scoreRisk(eventTypes, dailyMovePct, vol20Pct, headlineCount) {
  let score = 0;
  for (let i = 0; i < eventTypes.length; i++) {
    const t = eventTypes[i];
    if (t === 'earnings') score += 3;
    else if (t === 'splits') score += 2;
    else if (t === 'ipos') score += 3;
    else if (t === 'dividends') score += 1;
    else if (t === 'trends') score += 1;
  }
  if (Number.isFinite(vol20Pct)) {
    if (vol20Pct >= 60) score += 2;
    else if (vol20Pct >= 40) score += 1;
  }
  if (Number.isFinite(dailyMovePct)) {
    const absMove = Math.abs(dailyMovePct);
    if (absMove >= 5) score += 2;
    else if (absMove >= 3) score += 1;
  }
  if (headlineCount >= 5) score += 2;
  else if (headlineCount >= 2) score += 1;
  return score;
}

function classifyRisk(score) {
  if (!Number.isFinite(score)) return 'unknown';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
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

const inputSymbols = (data.input.symbols || '').toString().trim();
const fromInput = (data.input.from || '').toString().trim();
const toInput = (data.input.to || '').toString().trim();
const daysAhead = clampNumber(data.input.daysAhead, 2, 1, 14);
const includeIpos = asBool(data.input.includeIpos, false);
const includeTrends = asBool(data.input.includeTrends, false);
const includeNews = asBool(data.input.includeNews, true);
const newsLookbackDays = clampNumber(data.input.newsLookbackDays, 3, 1, 30);
const newsLimit = clampNumber(data.input.newsLimit, 60, 1, 200);
const maxSymbols = clampNumber(data.input.maxSymbols, 40, 5, 100);
const outputMode = (data.input.outputMode || 'full').toString().trim().toLowerCase();
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };
const resultLimit = clampNumber(data.input.resultLimit, outputMode === 'compact' ? 25 : 100, 1, 300);
const headlineLimitPerSymbol = clampNumber(data.input.headlineLimitPerSymbol, 5, 1, 20);
const eventLimitPerSymbol = clampNumber(data.input.eventLimitPerSymbol, 6, 1, 30);

const from = fromInput || formatDate(new Date());
const to = toInput || dateDaysAhead(daysAhead);
const newsFrom = dateDaysAgo(newsLookbackDays);
const priceFrom = dateDaysAgo(50);
const explicitSymbols = dedupeSymbols(inputSymbols ? inputSymbols.split(',').map((s) => s.trim()) : []);

const diagnostics = {
  calls: {
    calendarEarnings: 0,
    calendarDividends: 0,
    calendarSplits: 0,
    calendarIpos: 0,
    calendarTrends: 0,
    eod: 0,
    news: 0,
  },
  errors: [],
};

const riskFlags = [];

try {
  const eventBuckets = {
    earnings: [],
    dividends: [],
    splits: [],
    ipos: [],
    trends: [],
  };

  const calendars = [
    { key: 'earnings', path: 'earnings', counter: 'calendarEarnings', enabled: true },
    { key: 'dividends', path: 'dividends', counter: 'calendarDividends', enabled: true },
    { key: 'splits', path: 'splits', counter: 'calendarSplits', enabled: true },
    { key: 'ipos', path: 'ipos', counter: 'calendarIpos', enabled: includeIpos },
    { key: 'trends', path: 'trends', counter: 'calendarTrends', enabled: includeTrends },
  ];

  for (let i = 0; i < calendars.length; i++) {
    const cfg = calendars[i];
    if (!cfg.enabled) continue;
    try {
      const params = [];
      addParam(params, 'api_token', apiKey);
      addParam(params, 'fmt', 'json');
      addParam(params, 'from', from);
      addParam(params, 'to', to);
      if (explicitSymbols.length > 0) addParam(params, 'symbols', explicitSymbols.join(','));
      const url = `https://eodhd.com/api/calendar/${cfg.path}?${params.join('&')}`;
      diagnostics.calls[cfg.counter] += 1;
      const raw = await fetchJson(url, `calendar-${cfg.path}`);
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw.items) ? raw.items : []);
      eventBuckets[cfg.key] = items.map((item) => ({
        date: item.date || item.report_date || item.exDate || null,
        symbol: extractEventSymbol(item),
        type: cfg.key,
        payload: item,
      }));
    } catch (e) {
      diagnostics.errors.push({ stage: `calendar-${cfg.path}`, status: e.status || null, message: e.message || `calendar ${cfg.path} failed` });
      riskFlags.push(`Calendar ${cfg.path} endpoint failed.`);
    }
  }

  const allEvents = [].concat(
    eventBuckets.earnings,
    eventBuckets.dividends,
    eventBuckets.splits,
    eventBuckets.ipos,
    eventBuckets.trends
  );

  const eventSymbols = dedupeSymbols(allEvents.map((e) => e.symbol).filter(Boolean));
  let universe = dedupeSymbols([].concat(explicitSymbols, eventSymbols));
  if (universe.length > maxSymbols) {
    riskFlags.push(`Symbol universe truncated from ${universe.length} to ${maxSymbols} (maxSymbols limit).`);
    universe = universe.slice(0, maxSymbols);
  }

  const newsBySymbol = {};
  if (includeNews && universe.length > 0) {
    try {
      const nParams = [];
      addParam(nParams, 'api_token', apiKey);
      addParam(nParams, 'fmt', 'json');
      addParam(nParams, 's', universe.join(','));
      addParam(nParams, 'from', newsFrom);
      addParam(nParams, 'to', to);
      addParam(nParams, 'limit', newsLimit);
      const nUrl = `https://eodhd.com/api/news?${nParams.join('&')}`;
      diagnostics.calls.news += 1;
      const nRaw = await fetchJson(nUrl, 'news');
      const newsItems = Array.isArray(nRaw) ? nRaw : [];

      for (let i = 0; i < newsItems.length; i++) {
        const item = newsItems[i] || {};
        const symbols = Array.isArray(item.symbols)
          ? item.symbols
          : String(item.symbols || '').split(',');
        const normalized = dedupeSymbols(symbols.map((s) => String(s).trim()));
        for (let j = 0; j < normalized.length; j++) {
          const s = normalized[j];
          if (!newsBySymbol[s]) newsBySymbol[s] = [];
          if (newsBySymbol[s].length < headlineLimitPerSymbol) {
            newsBySymbol[s].push({
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
      riskFlags.push('News endpoint failed; event risk scores will not include headline intensity.');
    }
  }

  const eventsBySymbol = {};
  for (let i = 0; i < allEvents.length; i++) {
    const ev = allEvents[i];
    if (!ev.symbol) continue;
    if (!eventsBySymbol[ev.symbol]) eventsBySymbol[ev.symbol] = [];
    eventsBySymbol[ev.symbol].push(ev);
  }

  const scored = [];
  for (let i = 0; i < universe.length; i++) {
    const symbol = universe[i];
    const symbolEvents = eventsBySymbol[symbol] || [];
    const eventTypes = dedupeSymbols(symbolEvents.map((e) => e.type.toUpperCase())).map((x) => x.toLowerCase());

    let dailyMovePct = null;
    let vol20Pct = null;

    try {
      const pParams = [];
      addParam(pParams, 'api_token', apiKey);
      addParam(pParams, 'fmt', 'json');
      addParam(pParams, 'period', 'd');
      addParam(pParams, 'order', 'a');
      addParam(pParams, 'from', priceFrom);
      addParam(pParams, 'to', to);
      const pUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${pParams.join('&')}`;
      diagnostics.calls.eod += 1;
      const pRaw = await fetchJson(pUrl, `eod:${symbol}`);
      const rows = normalizeEod(pRaw);
      if (rows.length >= 2) {
        const latest = rows[rows.length - 1].close;
        const prev = rows[rows.length - 2].close;
        dailyMovePct = pctChange(prev, latest);
      }
      const closes = rows.map((r) => r.close);
      vol20Pct = annualizedVol20(closes);
    } catch (e) {
      diagnostics.errors.push({ stage: 'eod', symbol, status: e.status || null, message: e.message || 'eod failed' });
      riskFlags.push(`Price data fetch failed for ${symbol}.`);
    }

    const headlines = newsBySymbol[symbol] || [];
    const headlineCount = headlines.length;
    const riskScore = scoreRisk(eventTypes, dailyMovePct, vol20Pct, headlineCount);
    const riskLevel = classifyRisk(riskScore);

    scored.push({
      symbol,
      riskLevel,
      riskScore,
      eventTypes,
      eventCount: symbolEvents.length,
      nextEvents: symbolEvents.slice(0, eventLimitPerSymbol),
      dailyMovePct: round(dailyMovePct, 3),
      annualizedVol20dPct: round(vol20Pct, 3),
      headlineCount,
      topHeadlines: headlines,
    });
  }

  scored.sort((a, b) => b.riskScore - a.riskScore || (b.eventCount - a.eventCount));

  const highRisk = scored.filter((s) => s.riskLevel === 'high');
  const mediumRisk = scored.filter((s) => s.riskLevel === 'medium');
  const lowRisk = scored.filter((s) => s.riskLevel === 'low');
  const rankedRiskTable = scored.slice(0, resultLimit);
  const highRiskRows = highRisk.slice(0, resultLimit);
  const mediumRiskRows = mediumRisk.slice(0, resultLimit);
  const lowRiskRows = lowRisk.slice(0, resultLimit);

  const keyTakeaways = [];
  keyTakeaways.push(`Window ${from} to ${to}: ${allEvents.length} total events across ${universe.length} tracked symbols.`);
  keyTakeaways.push(`Risk mix: ${highRisk.length} high, ${mediumRisk.length} medium, ${lowRisk.length} low.`);
  if (highRisk.length > 0) {
    keyTakeaways.push(`Highest-risk symbol: ${highRisk[0].symbol} (score ${highRisk[0].riskScore}, events: ${highRisk[0].eventTypes.join(', ') || 'none'}).`);
  }

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed. See endpointDiagnostics.errors.`);
  }
  if (allEvents.length === 0) {
    riskFlags.push('No calendar events found for the selected window/filters.');
  }

  const truncationNotes = [];
  if (scored.length > rankedRiskTable.length) {
    truncationNotes.push(`rankedRiskTable truncated to ${rankedRiskTable.length} rows.`);
  }
  const endpointDiagnostics = Object.assign({}, diagnostics, {
    outputMode,
    truncated: truncationNotes.length > 0,
    truncationNotes,
  });

  return {
    headline_summary: {
      from,
      to,
      trackedSymbols: universe.length,
      totalEvents: allEvents.length,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      lowRiskCount: lowRisk.length,
      topRiskSymbol: scored[0] ? { symbol: scored[0].symbol, riskLevel: scored[0].riskLevel, riskScore: scored[0].riskScore } : null,
    },
    event_overview: {
      earnings: eventBuckets.earnings.length,
      dividends: eventBuckets.dividends.length,
      splits: eventBuckets.splits.length,
      ipos: eventBuckets.ipos.length,
      trends: eventBuckets.trends.length,
    },
    tables: {
      rankedRiskTable,
      highRisk: highRiskRows,
      mediumRisk: mediumRiskRows,
      lowRisk: lowRiskRows,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
    calculation_notes: {
      riskScore: 'event-weight + volatility-weight + daily-move-weight + headline-intensity-weight',
      eventWeights: 'earnings=3, splits=2, ipos=3, dividends=1, trends=1',
      volatilityWeights: 'vol20>=60 => +2, vol20>=40 => +1',
      dailyMoveWeights: '|1d move|>=5 => +2, |1d move|>=3 => +1',
      headlineWeights: 'headlineCount>=5 => +2, >=2 => +1',
      riskLevels: 'high>=6, medium>=3, low<3',
      annualizedVol20dPct: 'stdev(log daily returns over last 20 sessions) * sqrt(252) * 100',
    },
    metadata: {
      source: 'EODHD bundle action: event_risk_next_session_details',
      actionType: 'details',
      pairedAction: 'event_risk_next_session',
      generatedAt: new Date().toISOString(),
      parameters: {
        explicitSymbols,
        daysAhead,
        includeIpos,
        includeTrends,
        includeNews,
        newsLookbackDays,
        newsLimit,
        maxSymbols,
        resultLimit,
        headlineLimitPerSymbol,
        eventLimitPerSymbol,
        outputMode,
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'event_risk_next_session_details failed',
    details: error.message || String(error),
  };
}
