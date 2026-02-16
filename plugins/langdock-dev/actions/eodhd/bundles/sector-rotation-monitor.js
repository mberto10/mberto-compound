// name = Sector Rotation Monitor
// description = Monitors sector leadership and rotation using screener-derived sector groups.
//
// screenerFilters = Optional screener filters JSON string
// screenerSignals = Optional screener signals (comma-separated)
// screenerLimit = Maximum screener rows to inspect (default: 250, min: 50, max: 1000)
// symbolsPerSector = Number of symbols per sector for aggregation (default: 5, min: 2, max: 15)
// lookbackDays = EOD lookback days (default: 180, min: 60, max: 1500)
// topSectors = Number of top/bottom sectors shown (default: 5, min: 1, max: 11)
// includeTechnicals = Include sector RSI proxy (default: true)
// rsiPeriod = RSI period for proxy symbol (default: 14, min: 2, max: 50)

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

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeSectorName(name) {
  const raw = (name || '').toString().trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'technology' || lower === 'information technology') return 'Information Technology';
  if (lower === 'communication services' || lower === 'communications') return 'Communication Services';
  if (lower === 'consumer cyclical' || lower === 'consumer discretionary') return 'Consumer Discretionary';
  if (lower === 'consumer defensive' || lower === 'consumer staples') return 'Consumer Staples';
  if (lower === 'healthcare' || lower === 'health care') return 'Health Care';
  if (lower === 'real estate') return 'Real Estate';
  if (lower === 'financial' || lower === 'financial services' || lower === 'financials') return 'Financials';
  if (lower === 'industrials' || lower === 'industrial') return 'Industrials';
  if (lower === 'energy') return 'Energy';
  if (lower === 'utilities') return 'Utilities';
  if (lower === 'materials' || lower === 'basic materials') return 'Materials';
  return raw;
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

function computeAnnualizedVol20(closes) {
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
const screenerLimit = clampNumber(data.input.screenerLimit, 250, 50, 1000);
const symbolsPerSector = clampNumber(data.input.symbolsPerSector, 5, 2, 15);
const lookbackDays = clampNumber(data.input.lookbackDays, 180, 60, 1500);
const topSectors = clampNumber(data.input.topSectors, 5, 1, 11);
const includeTechnicals = asBool(data.input.includeTechnicals, true);
const rsiPeriod = clampNumber(data.input.rsiPeriod, 14, 2, 50);

let parsedFilters = null;
if (screenerFilters) {
  try {
    parsedFilters = JSON.parse(screenerFilters);
  } catch (e) {
    return { error: true, message: 'screenerFilters must be valid JSON', details: e.message };
  }
}

const diagnostics = {
  mode: 'screener',
  calls: {
    screener: 0,
    eod: 0,
    technical: 0,
  },
  errors: [],
};

const riskFlags = [];

try {
  const today = formatDate(new Date());
  const fromDate = dateDaysAgo(lookbackDays + 30);

  let sectorConstituents = {};
  let screenerRows = [];

  const sParams = [];
  addParam(sParams, 'api_token', apiKey);
  addParam(sParams, 'fmt', 'json');
  addParam(sParams, 'sort', 'market_capitalization.desc');
  addParam(sParams, 'limit', screenerLimit);
  addParam(sParams, 'offset', 0);
  if (parsedFilters) addParam(sParams, 'filters', JSON.stringify(parsedFilters));
  if (screenerSignals) addParam(sParams, 'signals', screenerSignals);
  const sUrl = `https://eodhd.com/api/screener?${sParams.join('&')}`;
  diagnostics.calls.screener += 1;
  const sRaw = await fetchJson(sUrl, 'screener');
  screenerRows = Array.isArray(sRaw) ? sRaw : (Array.isArray(sRaw.data) ? sRaw.data : (Array.isArray(sRaw.results) ? sRaw.results : []));

  for (let i = 0; i < screenerRows.length; i++) {
    const row = screenerRows[i] || {};
    const sector = normalizeSectorName(row.sector || row.Sector || row.gic_sector || row.gics_sector || row.industry_sector);
    const symbol = extractSymbol(row);
    if (!sector || !symbol) continue;
    const marketCap = safeNumber(row.market_capitalization || row.MarketCapitalization || row.marketCap);
    if (!sectorConstituents[sector]) sectorConstituents[sector] = [];
    sectorConstituents[sector].push({ symbol, marketCap: Number.isFinite(marketCap) ? marketCap : 0 });
  }

  const sectorNames = Object.keys(sectorConstituents);
  const hasScreenerCoverage = sectorNames.length >= 4;
  if (!hasScreenerCoverage) {
    return {
      error: true,
      message: 'Insufficient sector metadata in screener response. No default ETF sector symbols are used.',
      details: {
        detectedSectors: sectorNames,
        screenerRows: screenerRows.length,
      },
    };
  }

  const sectorMetrics = [];
  const sectorNamesFinal = Object.keys(sectorConstituents).sort();
  for (let i = 0; i < sectorNamesFinal.length; i++) {
    const sector = sectorNamesFinal[i];
    let members = sectorConstituents[sector].slice();
    members.sort((a, b) => b.marketCap - a.marketCap);
    members = members.slice(0, symbolsPerSector);

    const memberRows = [];
    for (let j = 0; j < members.length; j++) {
      const symbol = members[j].symbol;
      try {
        const eParams = [];
        addParam(eParams, 'api_token', apiKey);
        addParam(eParams, 'fmt', 'json');
        addParam(eParams, 'period', 'd');
        addParam(eParams, 'order', 'a');
        addParam(eParams, 'from', fromDate);
        addParam(eParams, 'to', today);
        const eUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?${eParams.join('&')}`;
        diagnostics.calls.eod += 1;
        const eRaw = await fetchJson(eUrl, `eod:${symbol}`);
        const eRows = normalizeEod(eRaw);
        if (eRows.length < 22) continue;

        const closes = eRows.map((r) => r.close);
        const latest = closes[closes.length - 1];
        const prev = closes[closes.length - 2];
        const close20 = closes[closes.length - 21];

        memberRows.push({
          symbol,
          return1dPct: pctChange(prev, latest),
          return1mPct: pctChange(close20, latest),
          vol20Pct: computeAnnualizedVol20(closes),
        });
      } catch (e) {
        diagnostics.errors.push({ stage: 'eod', symbol, status: e.status || null, message: e.message || 'eod failed' });
      }
    }

    if (memberRows.length === 0) {
      riskFlags.push(`No usable price history for sector ${sector}.`);
      continue;
    }

    let rsiProxy = null;
    if (includeTechnicals) {
      const proxySymbol = memberRows[0].symbol;
      try {
        const tParams = [];
        addParam(tParams, 'api_token', apiKey);
        addParam(tParams, 'fmt', 'json');
        addParam(tParams, 'function', 'rsi');
        addParam(tParams, 'period', rsiPeriod);
        addParam(tParams, 'order', 'd');
        addParam(tParams, 'from', fromDate);
        addParam(tParams, 'to', today);
        const tUrl = `https://eodhd.com/api/technical/${encodeURIComponent(proxySymbol)}?${tParams.join('&')}`;
        diagnostics.calls.technical += 1;
        const tRaw = await fetchJson(tUrl, `technical:${proxySymbol}`);
        rsiProxy = extractIndicatorValue(tRaw);
      } catch (e) {
        diagnostics.errors.push({ stage: 'technical', symbol: proxySymbol, status: e.status || null, message: e.message || 'technical failed' });
      }
    }

    const returns1d = memberRows.map((r) => r.return1dPct).filter((v) => Number.isFinite(v));
    const returns1m = memberRows.map((r) => r.return1mPct).filter((v) => Number.isFinite(v));
    const vols = memberRows.map((r) => r.vol20Pct).filter((v) => Number.isFinite(v));
    const advancers = memberRows.filter((r) => Number.isFinite(r.return1dPct) && r.return1dPct > 0).length;

    const leader = memberRows.slice().sort((a, b) => b.return1dPct - a.return1dPct)[0];
    const laggard = memberRows.slice().sort((a, b) => a.return1dPct - b.return1dPct)[0];

    sectorMetrics.push({
      sector,
      memberCount: memberRows.length,
      representativeSymbol: memberRows[0].symbol,
      avgReturn1dPct: round(mean(returns1d), 3),
      medianReturn1dPct: round(median(returns1d), 3),
      avgReturn1mPct: round(mean(returns1m), 3),
      medianReturn1mPct: round(median(returns1m), 3),
      advancerPct: round((advancers / memberRows.length) * 100, 2),
      medianVol20Pct: round(median(vols), 3),
      rsiProxy: round(rsiProxy, 3),
      leader,
      laggard,
      members: memberRows,
    });
  }

  if (sectorMetrics.length === 0) {
    return {
      error: true,
      message: 'No sectors produced usable metrics',
      details: { diagnostics, riskFlags },
    };
  }

  const by1d = sectorMetrics.slice().sort((a, b) => b.avgReturn1dPct - a.avgReturn1dPct);
  const by1m = sectorMetrics.slice().sort((a, b) => b.avgReturn1mPct - a.avgReturn1mPct);
  const topLeaders1d = by1d.slice(0, topSectors);
  const bottomLaggers1d = by1d.slice(-topSectors).reverse();
  const topLeaders1m = by1m.slice(0, topSectors);

  const dayLeaderSet = {};
  for (let i = 0; i < topLeaders1d.length; i++) dayLeaderSet[topLeaders1d[i].sector] = true;
  const monthLeaderSet = {};
  for (let i = 0; i < topLeaders1m.length; i++) monthLeaderSet[topLeaders1m[i].sector] = true;

  const newLeaders = [];
  const fadingLeaders = [];
  for (let i = 0; i < topLeaders1d.length; i++) {
    const s = topLeaders1d[i].sector;
    if (!monthLeaderSet[s]) newLeaders.push(s);
  }
  for (let i = 0; i < topLeaders1m.length; i++) {
    const s = topLeaders1m[i].sector;
    if (!dayLeaderSet[s]) fadingLeaders.push(s);
  }

  const cyclical = {
    'Communication Services': true,
    'Consumer Discretionary': true,
    'Energy': true,
    'Financials': true,
    'Industrials': true,
    'Information Technology': true,
    'Materials': true,
  };
  const defensive = {
    'Consumer Staples': true,
    'Health Care': true,
    'Utilities': true,
    'Real Estate': true,
  };

  const cyclicalReturns = [];
  const defensiveReturns = [];
  for (let i = 0; i < sectorMetrics.length; i++) {
    const row = sectorMetrics[i];
    if (!Number.isFinite(row.avgReturn1dPct)) continue;
    if (cyclical[row.sector]) cyclicalReturns.push(row.avgReturn1dPct);
    if (defensive[row.sector]) defensiveReturns.push(row.avgReturn1dPct);
  }
  const cyclicalAvg = mean(cyclicalReturns);
  const defensiveAvg = mean(defensiveReturns);
  const tiltSpread = Number.isFinite(cyclicalAvg) && Number.isFinite(defensiveAvg) ? cyclicalAvg - defensiveAvg : null;
  let marketTilt = 'mixed';
  if (Number.isFinite(tiltSpread)) {
    if (tiltSpread >= 0.4) marketTilt = 'risk-on';
    else if (tiltSpread <= -0.4) marketTilt = 'risk-off';
  }

  const keyTakeaways = [];
  keyTakeaways.push(`Top daily sector leader: ${topLeaders1d[0].sector} (${round(topLeaders1d[0].avgReturn1dPct, 2)}%).`);
  keyTakeaways.push(`Top 1M sector leader: ${topLeaders1m[0].sector} (${round(topLeaders1m[0].avgReturn1mPct, 2)}%).`);
  keyTakeaways.push(`Rotation tilt: ${marketTilt}${Number.isFinite(tiltSpread) ? ` (cyclical-defensive spread ${round(tiltSpread, 2)}%)` : ''}.`);
  if (newLeaders.length > 0) keyTakeaways.push(`Emerging short-term leaders vs 1M trend: ${newLeaders.join(', ')}.`);
  if (fadingLeaders.length > 0) keyTakeaways.push(`Sectors fading from leadership vs 1M baseline: ${fadingLeaders.join(', ')}.`);

  if (diagnostics.errors.length > 0) {
    riskFlags.push(`${diagnostics.errors.length} endpoint call(s) failed. See endpointDiagnostics.errors.`);
  }

  return {
    headline_summary: {
      mode: diagnostics.mode,
      sectorCount: sectorMetrics.length,
      topDailyLeader: topLeaders1d[0] ? { sector: topLeaders1d[0].sector, avgReturn1dPct: topLeaders1d[0].avgReturn1dPct } : null,
      topMonthlyLeader: topLeaders1m[0] ? { sector: topLeaders1m[0].sector, avgReturn1mPct: topLeaders1m[0].avgReturn1mPct } : null,
      marketTilt,
      tiltSpreadPct: round(tiltSpread, 3),
    },
    rotation_summary: {
      newLeaders,
      fadingLeaders,
      dayLeaders: topLeaders1d.map((x) => x.sector),
      monthLeaders: topLeaders1m.map((x) => x.sector),
    },
    tables: {
      sectorMetrics,
      topLeaders1d,
      bottomLaggers1d,
      topLeaders1m,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics: diagnostics,
    calculation_notes: {
      avgReturn1dPct: 'mean of constituent 1D returns within sector',
      avgReturn1mPct: 'mean of constituent ~1M returns (20 sessions) within sector',
      advancerPct: 'constituents with positive 1D return / constituents analyzed * 100',
      medianVol20Pct: 'median of annualized 20-day realized vol across constituents',
      tiltSpreadPct: 'avg cyclical 1D return - avg defensive 1D return',
      marketTilt: 'risk-on if tiltSpread>=0.4, risk-off if <=-0.4, else mixed',
    },
    metadata: {
      source: 'EODHD bundle action: sector_rotation_monitor',
      generatedAt: new Date().toISOString(),
      parameters: {
        screenerLimit,
        symbolsPerSector,
        lookbackDays,
        topSectors,
        includeTechnicals,
        rsiPeriod,
        screenerSignals: screenerSignals || null,
        screenerFiltersProvided: Boolean(parsedFilters),
      },
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'sector_rotation_monitor failed',
    details: error.message || String(error),
  };
}
