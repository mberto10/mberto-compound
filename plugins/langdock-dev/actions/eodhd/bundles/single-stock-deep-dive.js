// name = Single Stock Deep Dive
// description = Produces a comprehensive single-stock dossier combining fundamentals, price action, technical state, catalysts, and sentiment context.
//
// symbol = EODHD symbol (e.g. AAPL.US) (required)
// benchmarkSymbol = Optional benchmark symbol for relative performance (no default)
// lookbackDays = EOD lookback window in days (default: 365, min: 90, max: 1500)
// includeNews = Include news enrichment (default: true)
// newsDays = News lookback days (default: 30, min: 1, max: 365)
// includeCalendar = Include earnings/dividends/splits timeline (default: true)
// calendarBackDays = Calendar lookback days (default: 60, min: 7, max: 365)
// calendarForwardDays = Calendar forward window days (default: 180, min: 7, max: 365)
// includeTechnicals = Include RSI and trend assessment (default: true)
// rsiPeriod = RSI period (default: 14, min: 2, max: 50)
// newsLimit = News items limit (default: 30, min: 1, max: 100)
// outputMode = compact|full (default: compact)

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

function covariance(valuesA, valuesB) {
  if (!Array.isArray(valuesA) || !Array.isArray(valuesB)) return null;
  if (valuesA.length !== valuesB.length || valuesA.length < 2) return null;
  const mA = mean(valuesA);
  const mB = mean(valuesB);
  let sum = 0;
  for (let i = 0; i < valuesA.length; i++) {
    sum += (valuesA[i] - mA) * (valuesB[i] - mB);
  }
  return sum / (valuesA.length - 1);
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

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getFirstNumber(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (let i = 0; i < keys.length; i++) {
    const v = safeNumber(obj[keys[i]]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}

function normalizeEod(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = raw.map((r) => ({
    date: (r.date || '').toString(),
    open: safeNumber(r.open),
    high: safeNumber(r.high),
    low: safeNumber(r.low),
    close: safeNumber(r.close),
    adjustedClose: safeNumber(r.adjusted_close),
    volume: safeNumber(r.volume),
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

function computeReturnByOffset(closes, offset) {
  if (!Array.isArray(closes) || closes.length <= offset) return null;
  const latest = closes[closes.length - 1];
  const base = closes[closes.length - 1 - offset];
  return pctChange(base, latest);
}

function computeAnnualizedVol(closes, lookbackDays) {
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
  const s = stddev(logReturns);
  if (!Number.isFinite(s)) return null;
  return s * Math.sqrt(252) * 100;
}

function sma(values, window) {
  if (!Array.isArray(values) || values.length < window) return null;
  const slice = values.slice(values.length - window);
  const avg = mean(slice);
  return Number.isFinite(avg) ? avg : null;
}

function classifyTrend(close, sma20, sma50, sma200) {
  if (!Number.isFinite(close)) return 'unknown';
  if (Number.isFinite(sma20) && Number.isFinite(sma50) && Number.isFinite(sma200)) {
    if (close > sma20 && sma20 > sma50 && sma50 > sma200) return 'strong-uptrend';
    if (close < sma20 && sma20 < sma50 && sma50 < sma200) return 'strong-downtrend';
  }
  if (Number.isFinite(sma20) && Number.isFinite(sma50)) {
    if (close > sma20 && sma20 > sma50) return 'uptrend';
    if (close < sma20 && sma20 < sma50) return 'downtrend';
  }
  return 'mixed';
}

function latestDatedRecord(mapObject) {
  if (!mapObject || typeof mapObject !== 'object') return null;
  const keys = Object.keys(mapObject).sort();
  if (keys.length === 0) return null;
  const latestKey = keys[keys.length - 1];
  const row = mapObject[latestKey];
  if (!row || typeof row !== 'object') return null;
  return { date: latestKey, row };
}

function extractFinancialSnapshot(fundamentals) {
  const result = {
    profitability: {},
    growth: {},
    valuation: {},
    balanceSheet: {},
    cashFlow: {},
  };

  const highlights = (fundamentals && fundamentals.Highlights) || {};
  const valuation = (fundamentals && fundamentals.Valuation) || {};
  const financials = (fundamentals && fundamentals.Financials) || {};
  const bsYearly = financials.Balance_Sheet && financials.Balance_Sheet.yearly ? financials.Balance_Sheet.yearly : null;
  const cfYearly = financials.Cash_Flow && financials.Cash_Flow.yearly ? financials.Cash_Flow.yearly : null;
  const isYearly = financials.Income_Statement && financials.Income_Statement.yearly ? financials.Income_Statement.yearly : null;

  result.profitability.profitMargin = getFirstNumber(highlights, ['ProfitMargin', 'ProfitMarginTTM']);
  result.profitability.operatingMargin = getFirstNumber(highlights, ['OperatingMarginTTM', 'OperatingMargin']);
  result.profitability.returnOnEquity = getFirstNumber(highlights, ['ReturnOnEquityTTM', 'ReturnOnEquity']);
  result.profitability.returnOnAssets = getFirstNumber(highlights, ['ReturnOnAssetsTTM', 'ReturnOnAssets']);

  result.growth.revenueGrowthYoY = getFirstNumber(highlights, ['QuarterlyRevenueGrowthYOY', 'RevenueGrowthYOY']);
  result.growth.epsGrowthYoY = getFirstNumber(highlights, ['QuarterlyEarningsGrowthYOY', 'EarningsGrowthYOY']);

  result.valuation.pe = getFirstNumber(valuation, ['TrailingPE', 'ForwardPE', 'PERatio', 'PriceEarningsRatio']);
  result.valuation.peg = getFirstNumber(valuation, ['PEGRatio']);
  result.valuation.priceToBook = getFirstNumber(valuation, ['PriceBookMRQ', 'PriceBook']);
  result.valuation.priceToSales = getFirstNumber(valuation, ['PriceSalesTTM', 'PriceSales']);
  result.valuation.evEbitda = getFirstNumber(valuation, ['EnterpriseValueEbitda', 'EVToEBITDA', 'EnterpriseValueOverEBITDA']);

  const latestBS = latestDatedRecord(bsYearly);
  if (latestBS) {
    const bs = latestBS.row;
    const totalDebt = getFirstNumber(bs, ['totalDebt', 'TotalDebt']);
    const equity = getFirstNumber(bs, ['totalStockholderEquity', 'TotalStockholderEquity', 'totalEquity', 'TotalEquity']);
    const totalAssets = getFirstNumber(bs, ['totalAssets', 'TotalAssets']);
    const totalCurrentAssets = getFirstNumber(bs, ['totalCurrentAssets', 'TotalCurrentAssets']);
    const totalCurrentLiabilities = getFirstNumber(bs, ['totalCurrentLiabilities', 'TotalCurrentLiabilities']);
    result.balanceSheet.asOfDate = latestBS.date;
    result.balanceSheet.totalDebt = totalDebt;
    result.balanceSheet.totalEquity = equity;
    result.balanceSheet.totalAssets = totalAssets;
    result.balanceSheet.debtToEquity = Number.isFinite(totalDebt) && Number.isFinite(equity) && equity !== 0 ? totalDebt / equity : null;
    result.balanceSheet.debtToAssets = Number.isFinite(totalDebt) && Number.isFinite(totalAssets) && totalAssets !== 0 ? totalDebt / totalAssets : null;
    result.balanceSheet.currentRatio = Number.isFinite(totalCurrentAssets) && Number.isFinite(totalCurrentLiabilities) && totalCurrentLiabilities !== 0
      ? totalCurrentAssets / totalCurrentLiabilities
      : null;
  }

  const latestCF = latestDatedRecord(cfYearly);
  if (latestCF) {
    const cf = latestCF.row;
    const operatingCF = getFirstNumber(cf, ['totalCashFromOperatingActivities', 'TotalCashFromOperatingActivities', 'operatingCashFlow']);
    const capexRaw = getFirstNumber(cf, ['capitalExpenditures', 'CapitalExpenditures']);
    const capexAbs = Number.isFinite(capexRaw) ? Math.abs(capexRaw) : null;
    result.cashFlow.asOfDate = latestCF.date;
    result.cashFlow.operatingCashFlow = operatingCF;
    result.cashFlow.capex = capexAbs;
    result.cashFlow.freeCashFlow = Number.isFinite(operatingCF) && Number.isFinite(capexAbs) ? operatingCF - capexAbs : null;
  }

  const latestIS = latestDatedRecord(isYearly);
  if (latestIS) {
    const isRow = latestIS.row;
    const revenue = getFirstNumber(isRow, ['totalRevenue', 'TotalRevenue', 'revenue']);
    result.growth.latestAnnualRevenue = revenue;
    if (Number.isFinite(result.cashFlow.freeCashFlow) && Number.isFinite(revenue) && revenue !== 0) {
      result.cashFlow.freeCashFlowMargin = result.cashFlow.freeCashFlow / revenue;
    }
  }

  return result;
}

function extractSentimentStats(payload) {
  const values = [];

  function scan(node) {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) scan(node[i]);
      return;
    }
    if (typeof node !== 'object') return;

    const direct = [
      safeNumber(node.sentiment),
      safeNumber(node.sentiment_score),
      safeNumber(node.score),
      safeNumber(node.normalized),
      safeNumber(node.value),
    ];
    for (let i = 0; i < direct.length; i++) {
      if (Number.isFinite(direct[i])) values.push(direct[i]);
    }

    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const child = node[key];
      if (typeof child === 'object') scan(child);
    }
  }

  scan(payload);

  if (values.length === 0) return { count: 0, average: null, median: null, min: null, max: null };
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    count: values.length,
    average: mean(values),
    median: medianValue,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function normalizeNewsItems(rawNews, maxItems) {
  const items = Array.isArray(rawNews) ? rawNews : [];
  return items.slice(0, maxItems).map((item) => ({
    date: item.date || null,
    title: item.title || null,
    source: item.source || null,
    link: item.link || null,
    symbols: item.symbols || null,
    tags: item.tags || null,
  }));
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

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
const benchmarkSymbol = (data.input.benchmarkSymbol || '').toString().trim().toUpperCase();
const lookbackDays = clampNumber(data.input.lookbackDays, 365, 90, 1500);
const includeNews = asBool(data.input.includeNews, true);
const newsDays = clampNumber(data.input.newsDays, 30, 1, 365);
const includeCalendar = asBool(data.input.includeCalendar, true);
const calendarBackDays = clampNumber(data.input.calendarBackDays, 60, 7, 365);
const calendarForwardDays = clampNumber(data.input.calendarForwardDays, 180, 7, 365);
const includeTechnicals = asBool(data.input.includeTechnicals, true);
const rsiPeriod = clampNumber(data.input.rsiPeriod, 14, 2, 50);
const newsLimit = clampNumber(data.input.newsLimit, 30, 1, 100);
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

if (!symbol) return { error: true, message: 'symbol is required' };
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };

const diagnostics = {
  calls: {
    fundamentals: 0,
    eod: 0,
    benchmarkEod: 0,
    technical: 0,
    news: 0,
    sentiment: 0,
    calendarEarnings: 0,
    calendarDividends: 0,
    calendarSplits: 0,
  },
  errors: [],
};

const riskFlags = [];

try {
  const today = formatDate(new Date());
  const fromEod = dateDaysAgo(lookbackDays + 40);
  const fromNews = dateDaysAgo(newsDays);
  const calendarFrom = dateDaysAgo(calendarBackDays);
  const calendarTo = dateDaysAhead(calendarForwardDays);

  let fundamentals = null;
  try {
    const fParams = [];
    addParam(fParams, 'api_token', apiKey);
    addParam(fParams, 'fmt', 'json');
    const fUrl = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?${fParams.join('&')}`;
    diagnostics.calls.fundamentals += 1;
    fundamentals = await fetchJson(fUrl, 'fundamentals');
  } catch (e) {
    diagnostics.errors.push({ stage: 'fundamentals', status: e.status || null, message: e.message || 'fundamentals failed' });
    riskFlags.push('Fundamentals endpoint failed; valuation and accounting sections may be incomplete.');
  }

  const eodParams = [];
  addParam(eodParams, 'api_token', apiKey);
  addParam(eodParams, 'fmt', 'json');
  addParam(eodParams, 'period', 'd');
  addParam(eodParams, 'order', 'a');
  addParam(eodParams, 'from', fromEod);
  addParam(eodParams, 'to', today);
  const eodUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eodParams.join('&')}`;
  diagnostics.calls.eod += 1;
  const eodRaw = await fetchJson(eodUrl, 'eod');
  const eodRows = normalizeEod(eodRaw);
  if (eodRows.length < 2) {
    return { error: true, message: 'Insufficient EOD history for deep dive', details: { symbol, points: eodRows.length } };
  }

  let benchmarkRows = [];
  if (benchmarkSymbol && benchmarkSymbol !== symbol) {
    try {
      const bParams = [];
      addParam(bParams, 'api_token', apiKey);
      addParam(bParams, 'fmt', 'json');
      addParam(bParams, 'period', 'd');
      addParam(bParams, 'order', 'a');
      addParam(bParams, 'from', fromEod);
      addParam(bParams, 'to', today);
      const bUrl = `https://eodhd.com/api/eod/${encodeURIComponent(benchmarkSymbol)}?${bParams.join('&')}`;
      diagnostics.calls.benchmarkEod += 1;
      const bRaw = await fetchJson(bUrl, 'benchmark-eod');
      benchmarkRows = normalizeEod(bRaw);
      if (benchmarkRows.length < 2) {
        benchmarkRows = [];
        riskFlags.push('Benchmark EOD history insufficient; relative performance omitted.');
      }
    } catch (e) {
      diagnostics.errors.push({ stage: 'benchmarkEod', status: e.status || null, message: e.message || 'benchmark eod failed' });
      riskFlags.push('Benchmark fetch failed; relative performance omitted.');
    }
  }

  let rsiValue = null;
  if (includeTechnicals) {
    try {
      const tParams = [];
      addParam(tParams, 'api_token', apiKey);
      addParam(tParams, 'fmt', 'json');
      addParam(tParams, 'function', 'rsi');
      addParam(tParams, 'period', rsiPeriod);
      addParam(tParams, 'order', 'd');
      addParam(tParams, 'from', fromEod);
      addParam(tParams, 'to', today);
      const tUrl = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?${tParams.join('&')}`;
      diagnostics.calls.technical += 1;
      const tRaw = await fetchJson(tUrl, 'technical-rsi');
      rsiValue = extractIndicatorValue(tRaw);
    } catch (e) {
      diagnostics.errors.push({ stage: 'technical', status: e.status || null, message: e.message || 'technical failed' });
      riskFlags.push('Technical indicator fetch failed; RSI omitted.');
    }
  }

  let newsItems = [];
  if (includeNews) {
    try {
      const nParams = [];
      addParam(nParams, 'api_token', apiKey);
      addParam(nParams, 'fmt', 'json');
      addParam(nParams, 's', symbol);
      addParam(nParams, 'from', fromNews);
      addParam(nParams, 'to', today);
      addParam(nParams, 'limit', newsLimit);
      const nUrl = `https://eodhd.com/api/news?${nParams.join('&')}`;
      diagnostics.calls.news += 1;
      const nRaw = await fetchJson(nUrl, 'news');
      newsItems = normalizeNewsItems(nRaw, newsLimit);
    } catch (e) {
      diagnostics.errors.push({ stage: 'news', status: e.status || null, message: e.message || 'news failed' });
      riskFlags.push('News fetch failed; catalyst headlines omitted.');
    }
  }

  let sentimentStats = { count: 0, average: null, median: null, min: null, max: null };
  if (includeNews) {
    try {
      const sParams = [];
      addParam(sParams, 'api_token', apiKey);
      addParam(sParams, 'fmt', 'json');
      addParam(sParams, 's', symbol);
      addParam(sParams, 'from', fromNews);
      addParam(sParams, 'to', today);
      const sUrl = `https://eodhd.com/api/sentiments?${sParams.join('&')}`;
      diagnostics.calls.sentiment += 1;
      const sRaw = await fetchJson(sUrl, 'sentiments');
      sentimentStats = extractSentimentStats(sRaw);
    } catch (e) {
      diagnostics.errors.push({ stage: 'sentiment', status: e.status || null, message: e.message || 'sentiment failed' });
      riskFlags.push('Sentiment endpoint failed; sentiment score omitted.');
    }
  }

  const calendarTimeline = {
    earnings: [],
    dividends: [],
    splits: [],
  };
  if (includeCalendar) {
    const calendarConfigs = [
      { key: 'earnings', path: 'earnings', counter: 'calendarEarnings' },
      { key: 'dividends', path: 'dividends', counter: 'calendarDividends' },
      { key: 'splits', path: 'splits', counter: 'calendarSplits' },
    ];
    for (let i = 0; i < calendarConfigs.length; i++) {
      const cfg = calendarConfigs[i];
      try {
        const cParams = [];
        addParam(cParams, 'api_token', apiKey);
        addParam(cParams, 'fmt', 'json');
        addParam(cParams, 'from', calendarFrom);
        addParam(cParams, 'to', calendarTo);
        addParam(cParams, 'symbols', symbol);
        const cUrl = `https://eodhd.com/api/calendar/${cfg.path}?${cParams.join('&')}`;
        diagnostics.calls[cfg.counter] += 1;
        const cRaw = await fetchJson(cUrl, `calendar-${cfg.path}`);
        const items = Array.isArray(cRaw) ? cRaw : (Array.isArray(cRaw.items) ? cRaw.items : []);
        calendarTimeline[cfg.key] = items.slice(0, 20).map((item) => ({
          date: item.date || item.report_date || item.exDate || null,
          type: cfg.key,
          title: item.title || item.code || item.symbol || null,
          payload: item,
        }));
      } catch (e) {
        diagnostics.errors.push({ stage: `calendar-${cfg.path}`, status: e.status || null, message: e.message || `calendar ${cfg.path} failed` });
        riskFlags.push(`Calendar ${cfg.path} fetch failed.`);
      }
    }
  }

  const closes = eodRows.map((r) => r.close).filter((v) => Number.isFinite(v));
  const highs = eodRows.map((r) => r.high).filter((v) => Number.isFinite(v));
  const lows = eodRows.map((r) => r.low).filter((v) => Number.isFinite(v));
  const latest = eodRows[eodRows.length - 1];
  const prev = eodRows[eodRows.length - 2];

  const return1d = pctChange(prev.close, latest.close);
  const return5d = computeReturnByOffset(closes, 5);
  const return20d = computeReturnByOffset(closes, 20);
  const return3m = computeReturnByOffset(closes, 63);
  const return6m = computeReturnByOffset(closes, 126);
  const return12m = computeReturnByOffset(closes, 252);
  const vol20 = computeAnnualizedVol(closes, 20);
  const vol60 = computeAnnualizedVol(closes, 60);

  const highs52wSlice = highs.slice(Math.max(0, highs.length - 252));
  const lows52wSlice = lows.slice(Math.max(0, lows.length - 252));
  const high52w = highs52wSlice.length ? Math.max.apply(null, highs52wSlice) : null;
  const low52w = lows52wSlice.length ? Math.min.apply(null, lows52wSlice) : null;
  const distanceFrom52wHighPct = Number.isFinite(high52w) && high52w !== 0 ? ((latest.close - high52w) / high52w) * 100 : null;
  const distanceFrom52wLowPct = Number.isFinite(low52w) && low52w !== 0 ? ((latest.close - low52w) / low52w) * 100 : null;

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const trendState = classifyTrend(latest.close, sma20, sma50, sma200);

  let relativePerformance = null;
  if (benchmarkRows.length >= 2) {
    const benchmarkByDate = {};
    for (let i = 0; i < benchmarkRows.length; i++) {
      benchmarkByDate[benchmarkRows[i].date] = benchmarkRows[i].close;
    }
    const alignedSymbolReturns = [];
    const alignedBenchmarkReturns = [];
    for (let i = 1; i < eodRows.length; i++) {
      const curr = eodRows[i];
      const prevRow = eodRows[i - 1];
      const bCurr = benchmarkByDate[curr.date];
      const bPrev = benchmarkByDate[prevRow.date];
      if (!Number.isFinite(curr.close) || !Number.isFinite(prevRow.close) || !Number.isFinite(bCurr) || !Number.isFinite(bPrev)) continue;
      if (prevRow.close <= 0 || bPrev <= 0) continue;
      alignedSymbolReturns.push(Math.log(curr.close / prevRow.close));
      alignedBenchmarkReturns.push(Math.log(bCurr / bPrev));
    }

    const betaWindow = 60;
    const betaSymbolReturns = alignedSymbolReturns.slice(Math.max(0, alignedSymbolReturns.length - betaWindow));
    const betaBenchmarkReturns = alignedBenchmarkReturns.slice(Math.max(0, alignedBenchmarkReturns.length - betaWindow));
    const cov = covariance(betaSymbolReturns, betaBenchmarkReturns);
    const benchVar = stddev(betaBenchmarkReturns);
    const benchVariance = Number.isFinite(benchVar) ? benchVar * benchVar : null;
    const beta = Number.isFinite(cov) && Number.isFinite(benchVariance) && benchVariance > 0 ? cov / benchVariance : null;

    const benchmarkCloses = benchmarkRows.map((r) => r.close).filter((v) => Number.isFinite(v));
    const benchmarkReturn1m = computeReturnByOffset(benchmarkCloses, 20);
    const benchmarkReturn3m = computeReturnByOffset(benchmarkCloses, 63);

    relativePerformance = {
      benchmarkSymbol,
      beta60dApprox: round(beta, 3),
      return1mExcessPct: Number.isFinite(return20d) && Number.isFinite(benchmarkReturn1m) ? round(return20d - benchmarkReturn1m, 3) : null,
      return3mExcessPct: Number.isFinite(return3m) && Number.isFinite(benchmarkReturn3m) ? round(return3m - benchmarkReturn3m, 3) : null,
    };
  }

  const fundamentalSnapshot = extractFinancialSnapshot(fundamentals || {});
  const general = (fundamentals && fundamentals.General) || {};
  const highlights = (fundamentals && fundamentals.Highlights) || {};

  const valuationNarrative = [];
  if (Number.isFinite(fundamentalSnapshot.valuation.pe)) valuationNarrative.push(`PE ${round(fundamentalSnapshot.valuation.pe, 2)}`);
  if (Number.isFinite(fundamentalSnapshot.valuation.priceToBook)) valuationNarrative.push(`P/B ${round(fundamentalSnapshot.valuation.priceToBook, 2)}`);
  if (Number.isFinite(fundamentalSnapshot.valuation.evEbitda)) valuationNarrative.push(`EV/EBITDA ${round(fundamentalSnapshot.valuation.evEbitda, 2)}`);

  const qualityFlags = [];
  if (Number.isFinite(fundamentalSnapshot.profitability.returnOnEquity) && fundamentalSnapshot.profitability.returnOnEquity > 0.15) qualityFlags.push('High ROE');
  if (Number.isFinite(fundamentalSnapshot.profitability.profitMargin) && fundamentalSnapshot.profitability.profitMargin > 0.15) qualityFlags.push('Strong profit margin');
  if (Number.isFinite(fundamentalSnapshot.balanceSheet.debtToEquity) && fundamentalSnapshot.balanceSheet.debtToEquity > 2) qualityFlags.push('Elevated leverage');
  if (Number.isFinite(fundamentalSnapshot.cashFlow.freeCashFlow) && fundamentalSnapshot.cashFlow.freeCashFlow < 0) qualityFlags.push('Negative free cash flow');
  if (Number.isFinite(fundamentalSnapshot.growth.revenueGrowthYoY) && fundamentalSnapshot.growth.revenueGrowthYoY < 0) qualityFlags.push('Negative revenue growth');

  const momentumState = Number.isFinite(rsiValue)
    ? (rsiValue >= 70 ? 'overbought' : (rsiValue <= 30 ? 'oversold' : 'neutral'))
    : 'unknown';

  const keyTakeaways = [];
  keyTakeaways.push(`Latest close ${round(latest.close, 2)} with 1D move ${round(return1d, 2)}%, 1M move ${round(return20d, 2)}%, 12M move ${round(return12m, 2)}%.`);
  keyTakeaways.push(`Trend state: ${trendState}${Number.isFinite(rsiValue) ? `, RSI ${round(rsiValue, 1)} (${momentumState})` : ''}.`);
  if (valuationNarrative.length > 0) keyTakeaways.push(`Valuation snapshot: ${valuationNarrative.join(', ')}.`);
  if (qualityFlags.length > 0) keyTakeaways.push(`Fundamental flags: ${qualityFlags.join('; ')}.`);
  if (relativePerformance && Number.isFinite(relativePerformance.return3mExcessPct)) {
    keyTakeaways.push(`3M excess return vs ${benchmarkSymbol}: ${round(relativePerformance.return3mExcessPct, 2)}%.`);
  }
  if (newsItems.length > 0) {
    keyTakeaways.push(`Recent coverage: ${newsItems.length} news items in the last ${newsDays} days.`);
  }

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed; see endpointDiagnostics.errors.`);
  }
  if (eodRows.length < 252) {
    riskFlags.push('Less than 252 EOD points available; 12M and 52-week analytics may be less robust.');
  }
  if (!fundamentals) {
    riskFlags.push('Fundamentals unavailable; accounting/valuation sections are partial.');
  }

  const compactNestedCap = 3;
  const headlineLimit = outputMode === 'compact' ? compactNestedCap : 8;
  const catalystItemLimit = outputMode === 'compact' ? compactNestedCap : 10;
  const topHeadlines = newsItems.slice(0, headlineLimit).map((item) => ({
    date: item.date || null,
    title: item.title || null,
    source: item.source || null,
    link: item.link || null,
  }));
  const upcomingEarnings = calendarTimeline.earnings.slice(0, catalystItemLimit).map((item) => ({
    date: item.date || null,
    title: item.title || null,
    type: item.type || 'earnings',
  }));
  const upcomingDividends = calendarTimeline.dividends.slice(0, catalystItemLimit).map((item) => ({
    date: item.date || null,
    title: item.title || null,
    type: item.type || 'dividends',
  }));
  const upcomingSplits = calendarTimeline.splits.slice(0, catalystItemLimit).map((item) => ({
    date: item.date || null,
    title: item.title || null,
    type: item.type || 'splits',
  }));

  const truncationNotes = [];
  if (newsItems.length > topHeadlines.length) {
    truncationNotes.push(`Top headlines truncated to ${topHeadlines.length} rows.`);
  }
  if (calendarTimeline.earnings.length > upcomingEarnings.length) {
    truncationNotes.push(`Earnings timeline truncated to ${upcomingEarnings.length} rows.`);
  }
  if (calendarTimeline.dividends.length > upcomingDividends.length) {
    truncationNotes.push(`Dividends timeline truncated to ${upcomingDividends.length} rows.`);
  }
  if (calendarTimeline.splits.length > upcomingSplits.length) {
    truncationNotes.push(`Splits timeline truncated to ${upcomingSplits.length} rows.`);
  }
  const endpointDiagnostics = Object.assign({}, diagnostics, {
    outputMode,
    truncated: truncationNotes.length > 0,
    truncationNotes,
  });

  return {
    headline_summary: {
      symbol,
      companyName: general.Name || general.Code || symbol,
      sector: general.Sector || null,
      industry: general.Industry || null,
      trendState,
      momentumState,
      latestClose: round(latest.close, 4),
      return1dPct: round(return1d, 3),
      return1mPct: round(return20d, 3),
      return12mPct: round(return12m, 3),
    },
    company_profile: {
      symbol,
      benchmarkSymbol: benchmarkSymbol || null,
      name: general.Name || null,
      exchange: general.Exchange || null,
      country: general.CountryName || general.Country || null,
      sector: general.Sector || null,
      industry: general.Industry || null,
      currency: general.CurrencyCode || null,
      marketCap: safeNumber(highlights.MarketCapitalization),
      sharesOutstanding: safeNumber(highlights.SharesOutstanding),
    },
    price_action: {
      asOfDate: latest.date,
      latestClose: round(latest.close, 4),
      previousClose: round(prev.close, 4),
      return1dPct: round(return1d, 3),
      return5dPct: round(return5d, 3),
      return1mPct: round(return20d, 3),
      return3mPct: round(return3m, 3),
      return6mPct: round(return6m, 3),
      return12mPct: round(return12m, 3),
      annualizedVol20dPct: round(vol20, 3),
      annualizedVol60dPct: round(vol60, 3),
      high52w: round(high52w, 4),
      low52w: round(low52w, 4),
      distanceFrom52wHighPct: round(distanceFrom52wHighPct, 3),
      distanceFrom52wLowPct: round(distanceFrom52wLowPct, 3),
      averageVolume20d: round(mean(eodRows.slice(Math.max(0, eodRows.length - 20)).map((r) => r.volume).filter((v) => Number.isFinite(v))), 2),
    },
    technicals: {
      includeTechnicals,
      rsiPeriod,
      rsi: round(rsiValue, 3),
      momentumState,
      sma20: round(sma20, 4),
      sma50: round(sma50, 4),
      sma200: round(sma200, 4),
      trendState,
    },
    valuation_and_fundamentals: {
      valuation: {
        pe: round(fundamentalSnapshot.valuation.pe, 4),
        peg: round(fundamentalSnapshot.valuation.peg, 4),
        priceToBook: round(fundamentalSnapshot.valuation.priceToBook, 4),
        priceToSales: round(fundamentalSnapshot.valuation.priceToSales, 4),
        evEbitda: round(fundamentalSnapshot.valuation.evEbitda, 4),
      },
      profitability: {
        profitMargin: round(fundamentalSnapshot.profitability.profitMargin, 6),
        operatingMargin: round(fundamentalSnapshot.profitability.operatingMargin, 6),
        returnOnEquity: round(fundamentalSnapshot.profitability.returnOnEquity, 6),
        returnOnAssets: round(fundamentalSnapshot.profitability.returnOnAssets, 6),
      },
      growth: {
        revenueGrowthYoY: round(fundamentalSnapshot.growth.revenueGrowthYoY, 6),
        epsGrowthYoY: round(fundamentalSnapshot.growth.epsGrowthYoY, 6),
        latestAnnualRevenue: round(fundamentalSnapshot.growth.latestAnnualRevenue, 2),
      },
      balanceSheet: {
        asOfDate: fundamentalSnapshot.balanceSheet.asOfDate || null,
        totalDebt: round(fundamentalSnapshot.balanceSheet.totalDebt, 2),
        totalEquity: round(fundamentalSnapshot.balanceSheet.totalEquity, 2),
        totalAssets: round(fundamentalSnapshot.balanceSheet.totalAssets, 2),
        debtToEquity: round(fundamentalSnapshot.balanceSheet.debtToEquity, 6),
        debtToAssets: round(fundamentalSnapshot.balanceSheet.debtToAssets, 6),
        currentRatio: round(fundamentalSnapshot.balanceSheet.currentRatio, 6),
      },
      cashFlow: {
        asOfDate: fundamentalSnapshot.cashFlow.asOfDate || null,
        operatingCashFlow: round(fundamentalSnapshot.cashFlow.operatingCashFlow, 2),
        capex: round(fundamentalSnapshot.cashFlow.capex, 2),
        freeCashFlow: round(fundamentalSnapshot.cashFlow.freeCashFlow, 2),
        freeCashFlowMargin: round(fundamentalSnapshot.cashFlow.freeCashFlowMargin, 6),
      },
      qualityFlags,
    },
    relative_performance: relativePerformance,
    sentiment_and_news: {
      newsLookbackDays: newsDays,
      articleCount: newsItems.length,
      sentiment: {
        sampleCount: sentimentStats.count,
        average: round(sentimentStats.average, 6),
        median: round(sentimentStats.median, 6),
        min: round(sentimentStats.min, 6),
        max: round(sentimentStats.max, 6),
      },
    },
    catalyst_timeline: {
      earningsCount: calendarTimeline.earnings.length,
      dividendsCount: calendarTimeline.dividends.length,
      splitsCount: calendarTimeline.splits.length,
    },
    tables: {
      topHeadlines,
      upcomingEarnings,
      upcomingDividends,
      upcomingSplits,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics,
    calculation_notes: {
      returnXPct: '(latest_close - historical_close) / historical_close * 100',
      annualizedVolPct: 'stdev(log daily returns) * sqrt(252) * 100',
      distanceFrom52wHighPct: '(latest_close - 52w_high) / 52w_high * 100',
      distanceFrom52wLowPct: '(latest_close - 52w_low) / 52w_low * 100',
      beta60dApprox: 'covariance(symbol_log_returns, benchmark_log_returns) / variance(benchmark_log_returns)',
      freeCashFlow: 'operating_cash_flow - abs(capex)',
      momentumState: 'overbought RSI>=70, oversold RSI<=30, else neutral',
      trendState: 'derived from close vs SMA20/SMA50/SMA200 hierarchy',
    },
    metadata: {
      source: 'EODHD bundle action: single_stock_deep_dive',
      actionType: 'summary',
      pairedAction: 'single_stock_deep_dive_details',
      generatedAt: new Date().toISOString(),
      parameters: {
        symbol,
        benchmarkSymbol,
        lookbackDays,
        includeNews,
        newsDays,
        includeCalendar,
        calendarBackDays,
        calendarForwardDays,
        includeTechnicals,
        rsiPeriod,
        outputMode,
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'single_stock_deep_dive failed',
    details: error.message || String(error),
  };
}
