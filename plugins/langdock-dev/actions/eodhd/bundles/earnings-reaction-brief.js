// name = Earnings Reaction Brief
// description = Produces a newsroom-ready earnings reaction brief with movers, reaction classification, and catalyst headlines.
//
// from = Start date YYYY-MM-DD (default: 3 days ago)
// to = End date YYYY-MM-DD (default: today)
// symbols = Optional comma-separated symbols to constrain analysis
// max_symbols = Maximum symbols to analyze (default: 20, max: 50)
// top_n = Number of top winners/losers to return (default: 5, max: 20)
// include_intraday = Include intraday reaction signal (default: true)
// intraday_interval = 1m|5m|1h (default: 5m)
// include_news = Include catalyst headlines from news endpoint (default: true)
// news_limit = Maximum total news items to fetch (default: 40, max: 100)
// min_abs_move_pct = Minimum absolute daily move to classify as strong reaction (default: 2.0)
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

function dateDaysBefore(dateStr, days) {
  const base = new Date(String(dateStr || '').trim() + 'T00:00:00Z');
  if (!Number.isFinite(base.getTime())) return dateDaysAgo(days);
  base.setUTCDate(base.getUTCDate() - days);
  return formatDate(base);
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

const input = (data && data.input) ? data.input : {};
const inputCompatibility = [];
const INPUT_ALIASES = {
  max_symbols: ['maxSymbols'],
  top_n: ['topN'],
  include_intraday: ['includeIntraday'],
  intraday_interval: ['intradayInterval'],
  include_news: ['includeNews'],
  news_limit: ['newsLimit'],
  min_abs_move_pct: ['minAbsMovePct'],
  output_mode: ['outputMode'],
};

const from = getCanonicalInput(input, 'from', [], dateDaysAgo(3), inputCompatibility);
const to = getCanonicalInput(input, 'to', [], formatDate(new Date()), inputCompatibility);
const symbolsInput = getCanonicalInput(input, 'symbols', [], '', inputCompatibility);
const maxSymbols = clampNumber(getCanonicalInput(input, 'max_symbols', INPUT_ALIASES.max_symbols, 20, inputCompatibility), 20, 1, 50);
const topN = clampNumber(getCanonicalInput(input, 'top_n', INPUT_ALIASES.top_n, 5, inputCompatibility), 5, 1, 20);
const includeIntraday = asBool(getCanonicalInput(input, 'include_intraday', INPUT_ALIASES.include_intraday, true, inputCompatibility), true);
const intradayInterval = getCanonicalInput(input, 'intraday_interval', INPUT_ALIASES.intraday_interval, '5m', inputCompatibility).toLowerCase();
const includeNews = asBool(getCanonicalInput(input, 'include_news', INPUT_ALIASES.include_news, true, inputCompatibility), true);
const newsLimit = clampNumber(getCanonicalInput(input, 'news_limit', INPUT_ALIASES.news_limit, 40, inputCompatibility), 40, 1, 100);
const minAbsMovePct = clampNumber(getCanonicalInput(input, 'min_abs_move_pct', INPUT_ALIASES.min_abs_move_pct, 2.0, inputCompatibility), 2.0, 0.1, 20);
const outputMode = getCanonicalInput(input, 'output_mode', INPUT_ALIASES.output_mode, 'compact', inputCompatibility).toLowerCase();
const eodFrom = dateDaysBefore(from, 40);

if (intradayInterval !== '1m' && intradayInterval !== '5m' && intradayInterval !== '1h') {
  return { error: true, message: 'intraday_interval must be 1m, 5m, or 1h' };
}
if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'output_mode must be compact or full.' };
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
    const endpointDiagnostics = Object.assign({}, diagnostics, {
      outputMode,
      truncated: false,
      truncationNotes: [],
    });
    return {
      headline_summary: {
        message: 'No earnings symbols found for the requested window.',
        from,
        to,
      },
      tables: {
        topPositiveReactions: [],
        topNegativeReactions: [],
        mutedReactions: [],
      },
      key_takeaways: ['No earnings events matched the selected filters/date range.'],
      risk_flags: ['No symbols available for analysis.'],
      endpointDiagnostics,
      metadata: {
        source: 'EODHD bundle action: earnings_reaction_brief',
        actionType: 'summary',
        pairedAction: 'earnings_reaction_brief_details',
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
      addParam(eodParams, 'from', eodFrom);
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
  const positive = sorted.filter((r) => Number.isFinite(r.dailyMovePct) && r.dailyMovePct > 0);
  const negative = sorted
    .filter((r) => Number.isFinite(r.dailyMovePct) && r.dailyMovePct < 0)
    .sort((a, b) => a.dailyMovePct - b.dailyMovePct);
  const compactTableCap = 10;
  const tableLimit = outputMode === 'compact' ? Math.min(topN, compactTableCap) : topN;
  const topPositiveReactions = positive.slice(0, tableLimit);
  const topNegativeReactions = negative.slice(0, tableLimit);
  const excluded = {};
  for (let i = 0; i < topPositiveReactions.length; i++) excluded[topPositiveReactions[i].symbol] = true;
  for (let i = 0; i < topNegativeReactions.length; i++) excluded[topNegativeReactions[i].symbol] = true;
  const mutedReactions = validRows.filter((r) => r.reactionClass === 'muted' && !excluded[r.symbol]).slice(0, tableLimit);

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

  const truncationNotes = [];
  if (outputMode === 'compact' && topN > compactTableCap) {
    truncationNotes.push(`Compact mode capped leaderboard tables to ${compactTableCap} rows each.`);
  }
  if (reactionTable.length > topPositiveReactions.length + topNegativeReactions.length + mutedReactions.length) {
    truncationNotes.push('Summary output omits full reactionTable; use earnings_reaction_brief_details for complete symbol-level reactions.');
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
      window: { from, to },
      analyzedSymbols: validRows.length,
      totalSymbols: reactionTable.length,
      strongReactions: strongCount,
      thresholdPct: minAbsMovePct,
      topPositive: topPositiveReactions[0] ? { symbol: topPositiveReactions[0].symbol, dailyMovePct: topPositiveReactions[0].dailyMovePct } : null,
      topNegative: topNegativeReactions[0] ? { symbol: topNegativeReactions[0].symbol, dailyMovePct: topNegativeReactions[0].dailyMovePct } : null,
    },
    tables: {
      topPositiveReactions,
      topNegativeReactions,
      mutedReactions,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
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
      actionType: 'summary',
      pairedAction: 'earnings_reaction_brief_details',
      generatedAt: new Date().toISOString(),
      universe,
      parameters: {
        topN,
        includeIntraday,
        intradayInterval,
        includeNews,
        newsLimit,
        minAbsMovePct,
        outputMode,
      },
      inputCompatibility,
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'earnings_reaction_brief failed',
    details: error.message || String(error),
  };
}
