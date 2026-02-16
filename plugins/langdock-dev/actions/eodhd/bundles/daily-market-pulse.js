// name = Daily Market Pulse
// description = Builds a newsroom-ready daily market summary with breadth, movers, momentum, and volatility checks.
//
// symbols = Optional comma-separated symbols (e.g. 'AAPL.US,MSFT.US'; required unless screenerFilters or screenerSignals is provided)
// maxSymbols = Maximum symbols to analyze after all inputs are combined (default: 15, max: 50)
// topN = Number of top gainers/losers/movers to return (default: 5, max: 20)
// lookbackDays = Lookback for volatility/momentum calculations (default: 20, min: 5, max: 120)
// includeIntraday = Include intraday move/range analysis (default: true)
// intradayInterval = Intraday interval: 1m|5m|1h (default: 5m)
// includeTechnicals = Include RSI pull from technical endpoint (default: true)
// rsiPeriod = RSI period if includeTechnicals=true (default: 14)
// screenerFilters = Optional screener filters JSON string
// screenerSignals = Optional screener signals (comma-separated)
// screenerLimit = Max symbols from screener enrichment (default: 20, max: 100)

const apiKey = (data.auth.apiKey || '').toString().trim();

if (!apiKey) {
  return { error: true, message: 'Missing auth.apiKey' };
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

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function stddev(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function dateDaysAgo(days) {
  const d = new Date();
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

function addParam(params, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value);
  if (str.trim() === '') return;
  params.push(key + '=' + encodeURIComponent(str));
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

function normalizeEod(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => ({
    date: (r.date || '').toString(),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    adjustedClose: Number(r.adjusted_close),
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
      datetime: dt || null,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
    };
  }).filter((r) => r.timeKey !== null && Number.isFinite(r.close) && Number.isFinite(r.open));

  rows.sort((a, b) => a.timeKey - b.timeKey);
  return rows;
}

function sma(values, window) {
  if (!Array.isArray(values) || values.length < window) return null;
  const slice = values.slice(values.length - window);
  const avg = mean(slice);
  return Number.isFinite(avg) ? avg : null;
}

function annualizedVolatilityFromCloses(closes, lookbackDays) {
  if (!Array.isArray(closes) || closes.length < 3) return null;
  const lookbackCloses = closes.slice(Math.max(0, closes.length - (lookbackDays + 1)));
  if (lookbackCloses.length < 3) return null;

  const logReturns = [];
  for (let i = 1; i < lookbackCloses.length; i++) {
    const prev = lookbackCloses[i - 1];
    const curr = lookbackCloses[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0 || curr <= 0) continue;
    logReturns.push(Math.log(curr / prev));
  }

  const dailyStd = stddev(logReturns);
  if (!Number.isFinite(dailyStd)) return null;
  return dailyStd * Math.sqrt(252) * 100;
}

function extractIndicatorValue(payload) {
  if (Number.isFinite(payload)) return payload;

  if (Array.isArray(payload) && payload.length > 0 && payload[0] && typeof payload[0] === 'object') {
    const first = payload[0];
    const blocked = { date: true, datetime: true, timestamp: true, gmtoffset: true, open: true, high: true, low: true, close: true, volume: true };
    const keys = Object.keys(first);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (blocked[key]) continue;
      const value = Number(first[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  if (payload && typeof payload === 'object') {
    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
      const value = Number(payload[keys[i]]);
      if (Number.isFinite(value)) return value;
    }
  }

  return null;
}

function classifyRegime(breadthPct, medianDailyMove) {
  if (!Number.isFinite(breadthPct) || !Number.isFinite(medianDailyMove)) {
    return { label: 'insufficient-data', confidence: 'low' };
  }
  if (breadthPct >= 60 && medianDailyMove > 0) return { label: 'risk-on', confidence: 'high' };
  if (breadthPct <= 40 && medianDailyMove < 0) return { label: 'risk-off', confidence: 'high' };
  if (medianDailyMove > 0) return { label: 'mixed-positive', confidence: 'medium' };
  if (medianDailyMove < 0) return { label: 'mixed-negative', confidence: 'medium' };
  return { label: 'flat', confidence: 'low' };
}

const inputSymbols = (data.input.symbols || '').toString().trim();
const maxSymbols = clampNumber(data.input.maxSymbols, 15, 5, 50);
const topN = clampNumber(data.input.topN, 5, 1, 20);
const lookbackDays = clampNumber(data.input.lookbackDays, 20, 5, 120);
const includeIntraday = asBool(data.input.includeIntraday, true);
const intradayInterval = (data.input.intradayInterval || '5m').toString().trim().toLowerCase();
const includeTechnicals = asBool(data.input.includeTechnicals, true);
const rsiPeriod = clampNumber(data.input.rsiPeriod, 14, 2, 50);
const screenerFilters = (data.input.screenerFilters || '').toString().trim();
const screenerSignals = (data.input.screenerSignals || '').toString().trim();
const screenerLimit = clampNumber(data.input.screenerLimit, 20, 1, 100);

if (intradayInterval !== '1m' && intradayInterval !== '5m' && intradayInterval !== '1h') {
  return { error: true, message: 'intradayInterval must be 1m, 5m, or 1h' };
}

let parsedScreenerFilters = null;
if (screenerFilters) {
  try {
    parsedScreenerFilters = JSON.parse(screenerFilters);
  } catch (e) {
    return { error: true, message: 'screenerFilters must be valid JSON', details: e.message };
  }
}

const explicitSymbols = dedupeSymbols(
  inputSymbols
    ? inputSymbols.split(',').map((s) => s.trim()).filter(Boolean)
    : []
);

if (explicitSymbols.length === 0 && !parsedScreenerFilters && !screenerSignals) {
  return {
    error: true,
    message: 'Provide symbols or screenerFilters/screenerSignals. No default symbol universe is used.',
  };
}

const diagnostics = {
  screener: {
    attempted: false,
    success: false,
    requestedLimit: screenerLimit,
    returnedRows: 0,
    extractedSymbols: 0,
  },
  calls: {
    eod: 0,
    intraday: 0,
    technical: 0,
  },
  errors: [],
};

const riskFlags = [];

try {
  let screenedSymbols = [];

  if (parsedScreenerFilters || screenerSignals) {
    diagnostics.screener.attempted = true;
    try {
      const screenerParams = [];
      addParam(screenerParams, 'api_token', apiKey);
      addParam(screenerParams, 'fmt', 'json');
      addParam(screenerParams, 'sort', 'market_capitalization.desc');
      addParam(screenerParams, 'limit', screenerLimit);
      addParam(screenerParams, 'offset', 0);
      if (parsedScreenerFilters) addParam(screenerParams, 'filters', JSON.stringify(parsedScreenerFilters));
      if (screenerSignals) addParam(screenerParams, 'signals', screenerSignals);

      const screenerUrl = `https://eodhd.com/api/screener?${screenerParams.join('&')}`;
      const screenerJson = await fetchJson(screenerUrl, 'screener');

      const screenerRows = Array.isArray(screenerJson)
        ? screenerJson
        : (Array.isArray(screenerJson.data) ? screenerJson.data : (Array.isArray(screenerJson.results) ? screenerJson.results : []));

      diagnostics.screener.success = true;
      diagnostics.screener.returnedRows = screenerRows.length;

      screenedSymbols = screenerRows.map((row) => {
        const code = (row.code || row.Code || '').toString().trim().toUpperCase();
        const exchange = (row.exchange || row.Exchange || '').toString().trim().toUpperCase();
        if (!code) return null;
        if (code.indexOf('.') !== -1) return code;
        if (exchange) return code + '.' + exchange;
        return null;
      }).filter(Boolean);

      screenedSymbols = dedupeSymbols(screenedSymbols);
      diagnostics.screener.extractedSymbols = screenedSymbols.length;
    } catch (e) {
      diagnostics.errors.push({
        stage: 'screener',
        status: e.status || null,
        message: e.message || 'screener failed',
      });
      riskFlags.push('Screener enrichment failed; continuing with explicit symbol universe only.');
    }
  }

  let universe = dedupeSymbols([].concat(explicitSymbols, screenedSymbols));
  if (universe.length === 0) {
    return {
      error: true,
      message: 'No symbols available after input/screener resolution. No default symbols are used.',
      details: diagnostics,
    };
  }

  if (universe.length > maxSymbols) {
    riskFlags.push(`Symbol universe truncated from ${universe.length} to ${maxSymbols} (maxSymbols limit).`);
    universe = universe.slice(0, maxSymbols);
  }

  const symbolResults = [];
  const today = new Date().toISOString().slice(0, 10);
  const eodFromDate = dateDaysAgo(Math.max(lookbackDays + 30, 45));
  const intradayFromUnix = Math.floor(Date.now() / 1000) - (48 * 3600);
  const intradayToUnix = Math.floor(Date.now() / 1000);

  for (let i = 0; i < universe.length; i++) {
    const symbol = universe[i];
    const item = {
      symbol,
      status: 'ok',
      dailyChangePct: null,
      return5dPct: null,
      return20dPct: null,
      annualizedVolPct: null,
      close: null,
      previousClose: null,
      intradayMovePct: null,
      intradayRangePct: null,
      rsi: null,
      sma20: null,
      sma50: null,
      trendState: 'unknown',
      momentumState: 'unknown',
      dataPoints: {
        eod: 0,
        intraday: 0,
      },
      warnings: [],
    };

    try {
      const eodParams = [];
      addParam(eodParams, 'api_token', apiKey);
      addParam(eodParams, 'fmt', 'json');
      addParam(eodParams, 'period', 'd');
      addParam(eodParams, 'order', 'a');
      addParam(eodParams, 'from', eodFromDate);
      addParam(eodParams, 'to', today);
      const eodUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eodParams.join('&')}`;

      diagnostics.calls.eod += 1;
      const eodRaw = await fetchJson(eodUrl, `eod:${symbol}`);
      const eodRows = normalizeEod(eodRaw);
      item.dataPoints.eod = eodRows.length;

      if (eodRows.length < 2) {
        item.status = 'error';
        item.warnings.push('Insufficient EOD history (need at least 2 data points).');
      } else {
        const closes = eodRows.map((r) => r.close).filter((v) => Number.isFinite(v));
        const latest = eodRows[eodRows.length - 1];
        const prev = eodRows[eodRows.length - 2];

        item.close = latest.close;
        item.previousClose = prev.close;
        item.dailyChangePct = pctChange(prev.close, latest.close);

        if (eodRows.length >= 6) {
          item.return5dPct = pctChange(eodRows[eodRows.length - 6].close, latest.close);
        }
        if (eodRows.length >= 21) {
          item.return20dPct = pctChange(eodRows[eodRows.length - 21].close, latest.close);
        }

        item.sma20 = sma(closes, 20);
        item.sma50 = sma(closes, 50);
        item.annualizedVolPct = annualizedVolatilityFromCloses(closes, lookbackDays);

        if (Number.isFinite(item.close) && Number.isFinite(item.sma20) && Number.isFinite(item.sma50)) {
          if (item.close > item.sma20 && item.sma20 > item.sma50) item.trendState = 'bullish';
          else if (item.close < item.sma20 && item.sma20 < item.sma50) item.trendState = 'bearish';
          else item.trendState = 'mixed';
        }
      }
    } catch (e) {
      item.status = 'error';
      item.warnings.push('EOD fetch failed.');
      diagnostics.errors.push({
        stage: 'eod',
        symbol,
        status: e.status || null,
        message: e.message || 'eod failed',
      });
    }

    if (item.status === 'ok' && includeIntraday) {
      try {
        const intraParams = [];
        addParam(intraParams, 'api_token', apiKey);
        addParam(intraParams, 'fmt', 'json');
        addParam(intraParams, 'interval', intradayInterval);
        addParam(intraParams, 'from', intradayFromUnix);
        addParam(intraParams, 'to', intradayToUnix);
        const intraUrl = `https://eodhd.com/api/intraday/${encodeURIComponent(symbol)}?${intraParams.join('&')}`;

        diagnostics.calls.intraday += 1;
        const intraRaw = await fetchJson(intraUrl, `intraday:${symbol}`);
        const intraRows = normalizeIntraday(intraRaw);
        item.dataPoints.intraday = intraRows.length;

        if (intraRows.length >= 2) {
          const first = intraRows[0];
          const last = intraRows[intraRows.length - 1];
          const highs = intraRows.map((r) => r.high).filter((v) => Number.isFinite(v));
          const lows = intraRows.map((r) => r.low).filter((v) => Number.isFinite(v));
          const maxHigh = highs.length ? Math.max.apply(null, highs) : null;
          const minLow = lows.length ? Math.min.apply(null, lows) : null;

          item.intradayMovePct = pctChange(first.open, last.close);
          if (Number.isFinite(maxHigh) && Number.isFinite(minLow) && Number.isFinite(first.open) && first.open !== 0) {
            item.intradayRangePct = ((maxHigh - minLow) / first.open) * 100;
          }
        } else {
          item.warnings.push('Insufficient intraday data points.');
        }
      } catch (e) {
        item.warnings.push('Intraday fetch failed.');
        diagnostics.errors.push({
          stage: 'intraday',
          symbol,
          status: e.status || null,
          message: e.message || 'intraday failed',
        });
      }
    }

    if (item.status === 'ok' && includeTechnicals) {
      try {
        const techParams = [];
        addParam(techParams, 'api_token', apiKey);
        addParam(techParams, 'fmt', 'json');
        addParam(techParams, 'function', 'rsi');
        addParam(techParams, 'period', rsiPeriod);
        addParam(techParams, 'order', 'd');
        addParam(techParams, 'from', eodFromDate);
        addParam(techParams, 'to', today);
        const techUrl = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?${techParams.join('&')}`;

        diagnostics.calls.technical += 1;
        const techRaw = await fetchJson(techUrl, `technical:${symbol}`);
        item.rsi = extractIndicatorValue(techRaw);

        if (Number.isFinite(item.rsi)) {
          if (item.rsi >= 70) item.momentumState = 'overbought';
          else if (item.rsi <= 30) item.momentumState = 'oversold';
          else item.momentumState = 'neutral';
        }
      } catch (e) {
        item.warnings.push('RSI fetch failed.');
        diagnostics.errors.push({
          stage: 'technical',
          symbol,
          status: e.status || null,
          message: e.message || 'technical failed',
        });
      }
    }

    item.dailyChangePct = round(item.dailyChangePct, 3);
    item.return5dPct = round(item.return5dPct, 3);
    item.return20dPct = round(item.return20dPct, 3);
    item.annualizedVolPct = round(item.annualizedVolPct, 3);
    item.intradayMovePct = round(item.intradayMovePct, 3);
    item.intradayRangePct = round(item.intradayRangePct, 3);
    item.rsi = round(item.rsi, 3);
    item.sma20 = round(item.sma20, 4);
    item.sma50 = round(item.sma50, 4);
    item.close = round(item.close, 4);
    item.previousClose = round(item.previousClose, 4);

    symbolResults.push(item);
  }

  const complete = symbolResults.filter((r) => r.status === 'ok' && Number.isFinite(r.dailyChangePct));
  const incompleteCount = symbolResults.length - complete.length;
  if (incompleteCount > 0) {
    riskFlags.push(`${incompleteCount} symbol(s) had incomplete data and were excluded from breadth/mover rankings.`);
  }

  const advancers = complete.filter((r) => r.dailyChangePct > 0.05).length;
  const decliners = complete.filter((r) => r.dailyChangePct < -0.05).length;
  const unchanged = complete.length - advancers - decliners;
  const breadthPct = complete.length > 0 ? (advancers / complete.length) * 100 : null;
  const medianDailyMove = median(complete.map((r) => r.dailyChangePct).filter((v) => Number.isFinite(v)));
  const regime = classifyRegime(breadthPct, medianDailyMove);

  const sortedByDaily = complete.slice().sort((a, b) => b.dailyChangePct - a.dailyChangePct);
  const topGainers = sortedByDaily.slice(0, topN);
  const topLosers = sortedByDaily.slice(-topN).reverse();
  const topMoversAbs = complete.slice().sort((a, b) => Math.abs(b.dailyChangePct) - Math.abs(a.dailyChangePct)).slice(0, topN);

  const intradayValid = complete.filter((r) => Number.isFinite(r.intradayMovePct));
  const avgIntradayMove = mean(intradayValid.map((r) => r.intradayMovePct));
  const avgIntradayRange = mean(intradayValid.map((r) => r.intradayRangePct).filter((v) => Number.isFinite(v)));
  const medianVol = median(complete.map((r) => r.annualizedVolPct).filter((v) => Number.isFinite(v)));

  const keyTakeaways = [];
  keyTakeaways.push(
    `Breadth: ${advancers} advancers vs ${decliners} decliners out of ${complete.length} analyzed symbols (${round(breadthPct, 1)}% advancing).`
  );
  if (topGainers.length > 0) {
    keyTakeaways.push(`Top gainer: ${topGainers[0].symbol} (${round(topGainers[0].dailyChangePct, 2)}%).`);
  }
  if (topLosers.length > 0) {
    keyTakeaways.push(`Top loser: ${topLosers[0].symbol} (${round(topLosers[0].dailyChangePct, 2)}%).`);
  }
  if (Number.isFinite(avgIntradayMove)) {
    keyTakeaways.push(`Average intraday move: ${round(avgIntradayMove, 2)}% (${intradayInterval} bars).`);
  }
  if (Number.isFinite(medianVol)) {
    keyTakeaways.push(`Median annualized realized volatility (${lookbackDays}d): ${round(medianVol, 2)}%.`);
  }

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed. Review endpointDiagnostics.errors.`);
  }
  if (complete.length === 0) {
    riskFlags.push('No symbols returned complete data; output is diagnostic only.');
  }

  return {
    headline_summary: {
      regime: regime.label,
      confidence: regime.confidence,
      analyzedSymbols: complete.length,
      requestedSymbols: universe.length,
      breadthText: `${advancers} up / ${decliners} down / ${unchanged} flat`,
      topGainer: topGainers.length ? { symbol: topGainers[0].symbol, dailyChangePct: topGainers[0].dailyChangePct } : null,
      topLoser: topLosers.length ? { symbol: topLosers[0].symbol, dailyChangePct: topLosers[0].dailyChangePct } : null,
    },
    market_breadth: {
      advancers,
      decliners,
      unchanged,
      breadthPct: round(breadthPct, 2),
      medianDailyMovePct: round(medianDailyMove, 3),
    },
    market_volatility: {
      lookbackDays,
      medianAnnualizedVolPct: round(medianVol, 3),
      avgIntradayMovePct: round(avgIntradayMove, 3),
      avgIntradayRangePct: round(avgIntradayRange, 3),
      intradaySymbolsCount: intradayValid.length,
    },
    tables: {
      topGainers,
      topLosers,
      topMoversAbs,
      symbolSnapshots: symbolResults,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics: diagnostics,
    calculation_notes: {
      dailyChangePct: '(latest_close - previous_close) / previous_close * 100',
      return5dPct: '(latest_close - close_5_days_ago) / close_5_days_ago * 100',
      return20dPct: '(latest_close - close_20_days_ago) / close_20_days_ago * 100',
      annualizedVolPct: 'stdev(log daily returns over lookback) * sqrt(252) * 100',
      intradayMovePct: '(last_intraday_close - first_intraday_open) / first_intraday_open * 100',
      intradayRangePct: '(intraday_max_high - intraday_min_low) / first_intraday_open * 100',
      trendState: 'bullish if close > SMA20 > SMA50; bearish if close < SMA20 < SMA50; else mixed',
      momentumState: 'overbought RSI>=70, oversold RSI<=30, else neutral',
    },
    metadata: {
      source: 'EODHD bundle action: daily_market_pulse',
      generatedAt: new Date().toISOString(),
      inputUniverse: universe,
      parameters: {
        maxSymbols,
        topN,
        lookbackDays,
        includeIntraday,
        intradayInterval,
        includeTechnicals,
        rsiPeriod,
        screenerSignals: screenerSignals || null,
        screenerFiltersProvided: Boolean(parsedScreenerFilters),
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'daily_market_pulse failed',
    details: error.message || String(error),
  };
}
