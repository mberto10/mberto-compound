// name = Earnings Reaction Brief
// description = Produces a newsroom-ready earnings reaction brief with movers, reaction classification, and catalyst headlines.
//
// from = Start date YYYY-MM-DD (default: 3 days ago)
// to = End date YYYY-MM-DD (default: today)
// symbols = Optional comma-separated symbols to constrain analysis
// maxSymbols = Maximum symbols to analyze (default: 20, max: 50)
// topN = Number of top winners/losers to return (default: 5, max: 20)
// includeIntraday = Include intraday reaction signal (default: true)
// intradayInterval = 1m|5m|1h (default: 5m)
// includeNews = Include catalyst headlines from news endpoint (default: true)
// newsLimit = Maximum total news items to fetch (default: 40, max: 100)
// minAbsMovePct = Minimum absolute daily move to classify as strong reaction (default: 2.0)

const apiKey = (data.auth.apiKey || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth.apiKey' };

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

function normalizeEod(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => ({
    date: (r.date || '').toString(),
    close: Number(r.close),
    volume: Number(r.volume),
  })).filter((r) => r.date && Number.isFinite(r.close));
  rows.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));
  return rows;
}

function normalizeIntraday(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => {
    const ts = Number(r.timestamp);
    const dt = (r.datetime || '').toString();
    const timeKey = Number.isFinite(ts) ? ts : Date.parse(dt);
    return {
      timeKey: Number.isFinite(timeKey) ? timeKey : null,
      open: Number(r.open),
      close: Number(r.close),
      high: Number(r.high),
      low: Number(r.low),
    };
  }).filter((r) => r.timeKey !== null && Number.isFinite(r.open) && Number.isFinite(r.close));
  rows.sort((a, b) => a.timeKey - b.timeKey);
  return rows;
}

function normalizeNewsSymbols(rawSymbols) {
  if (!rawSymbols) return [];
  if (Array.isArray(rawSymbols)) {
    return rawSymbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
  }
  return String(rawSymbols).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
}

function extractEarningsSymbol(event) {
  const code = (event.code || event.Code || event.symbol || event.Symbol || event.ticker || '').toString().trim().toUpperCase();
  if (code.indexOf('.') !== -1) return code;
  const exchange = (event.exchange || event.Exchange || event.exchangeCode || '').toString().trim().toUpperCase();
  if (code && exchange) return code + '.' + exchange;
  if (code) return code;
  return null;
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function classifyReaction(dailyMovePct, threshold) {
  if (!Number.isFinite(dailyMovePct)) return 'unknown';
  const absMove = Math.abs(dailyMovePct);
  if (absMove >= Math.max(5, threshold * 2)) return dailyMovePct > 0 ? 'very-strong-positive' : 'very-strong-negative';
  if (absMove >= threshold) return dailyMovePct > 0 ? 'strong-positive' : 'strong-negative';
  if (absMove >= threshold * 0.5) return dailyMovePct > 0 ? 'moderate-positive' : 'moderate-negative';
  return 'muted';
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

const from = (data.input.from || dateDaysAgo(3)).toString().trim();
const to = (data.input.to || formatDate(new Date())).toString().trim();
const symbolsInput = (data.input.symbols || '').toString().trim();
const maxSymbols = clampNumber(data.input.maxSymbols, 20, 1, 50);
const topN = clampNumber(data.input.topN, 5, 1, 20);
const includeIntraday = asBool(data.input.includeIntraday, true);
const intradayInterval = (data.input.intradayInterval || '5m').toString().trim().toLowerCase();
const includeNews = asBool(data.input.includeNews, true);
const newsLimit = clampNumber(data.input.newsLimit, 40, 1, 100);
const minAbsMovePct = clampNumber(data.input.minAbsMovePct, 2.0, 0.1, 20);

if (intradayInterval !== '1m' && intradayInterval !== '5m' && intradayInterval !== '1h') {
  return { error: true, message: 'intradayInterval must be 1m, 5m, or 1h' };
}

const diagnostics = {
  calls: {
    calendar: 0,
    eod: 0,
    intraday: 0,
    news: 0,
  },
  errors: [],
};

const riskFlags = [];

try {
  const explicitSymbols = dedupeSymbols(
    symbolsInput ? symbolsInput.split(',').map((s) => s.trim()).filter(Boolean) : []
  );

  const calendarParams = [];
  addParam(calendarParams, 'api_token', apiKey);
  addParam(calendarParams, 'fmt', 'json');
  addParam(calendarParams, 'from', from);
  addParam(calendarParams, 'to', to);
  if (explicitSymbols.length > 0) addParam(calendarParams, 'symbols', explicitSymbols.join(','));
  const calendarUrl = `https://eodhd.com/api/calendar/earnings?${calendarParams.join('&')}`;

  diagnostics.calls.calendar += 1;
  const calendarRaw = await fetchJson(calendarUrl, 'calendar-earnings');
  const earningsEvents = Array.isArray(calendarRaw)
    ? calendarRaw
    : (Array.isArray(calendarRaw.earnings) ? calendarRaw.earnings : (Array.isArray(calendarRaw.items) ? calendarRaw.items : []));

  let symbolsFromEvents = earningsEvents.map(extractEarningsSymbol).filter(Boolean);
  symbolsFromEvents = dedupeSymbols(symbolsFromEvents);

  let universe = dedupeSymbols([].concat(explicitSymbols, symbolsFromEvents));
  if (universe.length === 0) {
    return {
      headline_summary: {
        message: 'No earnings symbols found for the requested window.',
        from,
        to,
      },
      tables: {
        reactionTable: [],
        topPositiveReactions: [],
        topNegativeReactions: [],
        mutedReactions: [],
      },
      key_takeaways: ['No earnings events matched the selected filters/date range.'],
      risk_flags: ['No symbols available for analysis.'],
      endpointDiagnostics: diagnostics,
      metadata: {
        source: 'EODHD bundle action: earnings_reaction_brief',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  if (universe.length > maxSymbols) {
    riskFlags.push(`Symbol universe truncated from ${universe.length} to ${maxSymbols} (maxSymbols limit).`);
    universe = universe.slice(0, maxSymbols);
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const intradayFromUnix = nowUnix - (48 * 3600);
  const reactionTable = [];

  for (let i = 0; i < universe.length; i++) {
    const symbol = universe[i];
    const row = {
      symbol,
      status: 'ok',
      reportDate: null,
      beforeClose: null,
      afterClose: null,
      dailyMovePct: null,
      move5dPct: null,
      intradayMovePct: null,
      intradayRangePct: null,
      epsActual: null,
      epsEstimate: null,
      epsSurprisePct: null,
      reactionClass: 'unknown',
      catalystHeadlines: [],
      warnings: [],
    };

    const matchingEvent = earningsEvents.find((ev) => extractEarningsSymbol(ev) === symbol) || null;
    if (matchingEvent) {
      row.reportDate = matchingEvent.date || matchingEvent.report_date || matchingEvent.reportDate || null;
      row.epsActual = safeNumber(matchingEvent.epsActual ?? matchingEvent.eps_actual ?? matchingEvent.eps);
      row.epsEstimate = safeNumber(matchingEvent.epsEstimate ?? matchingEvent.eps_estimate ?? matchingEvent.epsConsensus);
      if (Number.isFinite(row.epsActual) && Number.isFinite(row.epsEstimate) && row.epsEstimate !== 0) {
        row.epsSurprisePct = pctChange(row.epsEstimate, row.epsActual);
      }
    }

    try {
      const eodParams = [];
      addParam(eodParams, 'api_token', apiKey);
      addParam(eodParams, 'fmt', 'json');
      addParam(eodParams, 'period', 'd');
      addParam(eodParams, 'order', 'a');
      addParam(eodParams, 'from', dateDaysAgo(40));
      addParam(eodParams, 'to', to);
      const eodUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eodParams.join('&')}`;
      diagnostics.calls.eod += 1;
      const eodRaw = await fetchJson(eodUrl, `eod:${symbol}`);
      const eodRows = normalizeEod(eodRaw);

      if (eodRows.length < 2) {
        row.status = 'error';
        row.warnings.push('Insufficient EOD data for reaction calculations.');
      } else {
        const latest = eodRows[eodRows.length - 1];
        const prev = eodRows[eodRows.length - 2];
        row.beforeClose = prev.close;
        row.afterClose = latest.close;
        row.dailyMovePct = pctChange(prev.close, latest.close);
        if (eodRows.length >= 6) {
          row.move5dPct = pctChange(eodRows[eodRows.length - 6].close, latest.close);
        }
      }
    } catch (e) {
      row.status = 'error';
      row.warnings.push('EOD fetch failed.');
      diagnostics.errors.push({
        stage: 'eod',
        symbol,
        status: e.status || null,
        message: e.message || 'eod failed',
      });
    }

    if (row.status === 'ok' && includeIntraday) {
      try {
        const iParams = [];
        addParam(iParams, 'api_token', apiKey);
        addParam(iParams, 'fmt', 'json');
        addParam(iParams, 'interval', intradayInterval);
        addParam(iParams, 'from', intradayFromUnix);
        addParam(iParams, 'to', nowUnix);
        const iUrl = `https://eodhd.com/api/intraday/${encodeURIComponent(symbol)}?${iParams.join('&')}`;
        diagnostics.calls.intraday += 1;
        const iRaw = await fetchJson(iUrl, `intraday:${symbol}`);
        const iRows = normalizeIntraday(iRaw);
        if (iRows.length >= 2) {
          const first = iRows[0];
          const last = iRows[iRows.length - 1];
          const highs = iRows.map((x) => x.high).filter((v) => Number.isFinite(v));
          const lows = iRows.map((x) => x.low).filter((v) => Number.isFinite(v));
          const maxHigh = highs.length ? Math.max.apply(null, highs) : null;
          const minLow = lows.length ? Math.min.apply(null, lows) : null;
          row.intradayMovePct = pctChange(first.open, last.close);
          if (Number.isFinite(maxHigh) && Number.isFinite(minLow) && Number.isFinite(first.open) && first.open !== 0) {
            row.intradayRangePct = ((maxHigh - minLow) / first.open) * 100;
          }
        } else {
          row.warnings.push('Insufficient intraday data points.');
        }
      } catch (e) {
        row.warnings.push('Intraday fetch failed.');
        diagnostics.errors.push({
          stage: 'intraday',
          symbol,
          status: e.status || null,
          message: e.message || 'intraday failed',
        });
      }
    }

    row.dailyMovePct = round(row.dailyMovePct, 3);
    row.move5dPct = round(row.move5dPct, 3);
    row.intradayMovePct = round(row.intradayMovePct, 3);
    row.intradayRangePct = round(row.intradayRangePct, 3);
    row.beforeClose = round(row.beforeClose, 4);
    row.afterClose = round(row.afterClose, 4);
    row.epsSurprisePct = round(row.epsSurprisePct, 3);
    row.reactionClass = classifyReaction(row.dailyMovePct, minAbsMovePct);

    reactionTable.push(row);
  }

  if (includeNews) {
    try {
      const nParams = [];
      addParam(nParams, 'api_token', apiKey);
      addParam(nParams, 'fmt', 'json');
      addParam(nParams, 's', universe.join(','));
      addParam(nParams, 'from', from);
      addParam(nParams, 'to', to);
      addParam(nParams, 'limit', newsLimit);
      const nUrl = `https://eodhd.com/api/news?${nParams.join('&')}`;
      diagnostics.calls.news += 1;
      const nRaw = await fetchJson(nUrl, 'news');
      const newsItems = Array.isArray(nRaw) ? nRaw : [];

      const headlinesBySymbol = {};
      for (let i = 0; i < newsItems.length; i++) {
        const item = newsItems[i] || {};
        const itemSymbols = normalizeNewsSymbols(item.symbols);
        for (let j = 0; j < itemSymbols.length; j++) {
          const s = itemSymbols[j];
          if (!headlinesBySymbol[s]) headlinesBySymbol[s] = [];
          if (headlinesBySymbol[s].length < 3) {
            headlinesBySymbol[s].push({
              date: item.date || null,
              title: item.title || null,
              link: item.link || null,
              source: item.source || null,
            });
          }
        }
      }

      for (let i = 0; i < reactionTable.length; i++) {
        const s = reactionTable[i].symbol;
        reactionTable[i].catalystHeadlines = headlinesBySymbol[s] || [];
      }
    } catch (e) {
      riskFlags.push('News enrichment failed; reaction brief generated without catalyst headlines.');
      diagnostics.errors.push({
        stage: 'news',
        status: e.status || null,
        message: e.message || 'news failed',
      });
    }
  }

  const validRows = reactionTable.filter((r) => r.status === 'ok' && Number.isFinite(r.dailyMovePct));
  if (validRows.length === 0) riskFlags.push('No symbols had complete EOD reaction calculations.');
  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed. See endpointDiagnostics.errors.`);
  }

  const sorted = validRows.slice().sort((a, b) => b.dailyMovePct - a.dailyMovePct);
  const topPositiveReactions = sorted.slice(0, topN);
  const topNegativeReactions = sorted.slice(-topN).reverse();
  const mutedReactions = validRows.filter((r) => r.reactionClass === 'muted').slice(0, topN);

  const strongCount = validRows.filter((r) => {
    const absMove = Math.abs(r.dailyMovePct);
    return Number.isFinite(absMove) && absMove >= minAbsMovePct;
  }).length;

  const keyTakeaways = [];
  keyTakeaways.push(`Analyzed ${validRows.length}/${reactionTable.length} earnings symbols with complete daily reaction metrics.`);
  keyTakeaways.push(`${strongCount} symbol(s) moved by at least ${minAbsMovePct}% after earnings.`);
  if (topPositiveReactions.length > 0) {
    keyTakeaways.push(`Strongest positive reaction: ${topPositiveReactions[0].symbol} (${round(topPositiveReactions[0].dailyMovePct, 2)}%).`);
  }
  if (topNegativeReactions.length > 0) {
    keyTakeaways.push(`Strongest negative reaction: ${topNegativeReactions[0].symbol} (${round(topNegativeReactions[0].dailyMovePct, 2)}%).`);
  }

  return {
    headline_summary: {
      window: { from, to },
      analyzedSymbols: validRows.length,
      totalSymbols: reactionTable.length,
      strongReactions: strongCount,
      thresholdPct: minAbsMovePct,
      topPositive: topPositiveReactions[0] ? { symbol: topPositiveReactions[0].symbol, dailyMovePct: topPositiveReactions[0].dailyMovePct } : null,
      topNegative: topNegativeReactions[0] ? { symbol: topNegativeReactions[0].symbol, dailyMovePct: topNegativeReactions[0].dailyMovePct } : null,
    },
    tables: {
      reactionTable,
      topPositiveReactions,
      topNegativeReactions,
      mutedReactions,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics: diagnostics,
    calculation_notes: {
      dailyMovePct: '(latest_close - previous_close) / previous_close * 100',
      move5dPct: '(latest_close - close_5_days_ago) / close_5_days_ago * 100',
      intradayMovePct: '(last_intraday_close - first_intraday_open) / first_intraday_open * 100',
      intradayRangePct: '(intraday_max_high - intraday_min_low) / first_intraday_open * 100',
      epsSurprisePct: '(eps_actual - eps_estimate) / eps_estimate * 100',
      reactionClass: `Strong reaction threshold = minAbsMovePct (${minAbsMovePct}%)`,
    },
    metadata: {
      source: 'EODHD bundle action: earnings_reaction_brief',
      generatedAt: new Date().toISOString(),
      universe,
      parameters: {
        topN,
        includeIntraday,
        intradayInterval,
        includeNews,
        newsLimit,
        minAbsMovePct,
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'earnings_reaction_brief failed',
    details: error.message || String(error),
  };
}
