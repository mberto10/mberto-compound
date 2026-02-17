// name = Get Price Action
// description = Fetches price action metrics (returns, volatility, 52w range) for a symbol.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// lookbackDays = Optional lookback window for stats (default: 365, min: 30, max: 1500)
// outputMode = compact|full (default: compact)
// help = true|false (optional, default false). If true, returns a decision guide and exits.

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

function formatDate(d) {
    return d.toISOString().slice(0, 10);
}

function dateDaysAgo(days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return formatDate(d);
}

function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function round(v, d) {
    if (!Number.isFinite(v)) return null;
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
}

function pctChange(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return null;
    return ((b - a) / a) * 100;
}

function mean(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1));
}

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_price_action',
            decisionGuide: {
                whenToUse: 'Use this to get performance metrics (1D, 1M, YTD returns) and volatility stats.',
                quickChoice: { symbol: 'AAPL.US' },
            },
            outputModeOptions: ['compact', 'full'],
        },
        endpointDiagnostics: {
            endpoint: '/api/eod/{symbol}',
            helpOnly: true,
        },
        metadata: {
            source: 'EODHD atomic action: get_price_action',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

const lookbackDays = clampNumber(data.input.lookbackDays, 365, 30, 1500);
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();
if (outputMode !== 'compact' && outputMode !== 'full') return { error: true, message: 'outputMode must be compact or full.' };

async function fetchJson(url, label) {
    try {
        const res = await ld.request({ url, method: 'GET', headers: { Accept: 'application/json' } });
        if (res.status === 404 || res.status === 422) return null;
        if (res.status < 200 || res.status >= 300) {
            const err = new Error(label + ' request failed');
            err.status = res.status;
            err.details = res.json || null;
            throw err;
        }
        return res.json;
    } catch (err) {
        if (err.status === 404 || err.status === 422) return null;
        throw err;
    }
}

try {
    const from = dateDaysAgo(lookbackDays + 30); // Buffer for MA/Vol calculations
    const to = formatDate(new Date());

    const url = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?api_token=${apiKey}&fmt=json&period=d&order=a&from=${from}&to=${to}`;
    const raw = await fetchJson(url, 'eod');

    if (!Array.isArray(raw) || raw.length < 2) {
        return { error: true, message: 'Insufficient EOD history for price action analysis.' };
    }

    const rows = raw
        .map(r => ({ date: r.date, close: safeNum(r.close), volume: safeNum(r.volume), high: safeNum(r.high), low: safeNum(r.low) }))
        .filter(r => r.date && r.close !== null)
        .sort((a, b) => a.date.localeCompare(b.date));

    const latest = rows[rows.length - 1];
    const prev = rows[rows.length - 2];
    const closes = rows.map(r => r.close);

    const ret = (days) => {
        const idx = Math.max(0, rows.length - 1 - days);
        return pctChange(rows[idx].close, latest.close);
    };

    const vol = (days) => {
        const slice = closes.slice(-days - 1);
        if (slice.length < 3) return null;
        const rets = slice.slice(1).map((c, i) => Math.log(c / slice[i]));
        return stddev(rets) * Math.sqrt(252) * 100;
    };

    const highs252 = rows.slice(-252).map(r => r.high).filter(v => v !== null);
    const lows252 = rows.slice(-252).map(r => r.low).filter(v => v !== null);
    const high52w = highs252.length ? Math.max(...highs252) : null;
    const low52w = lows252.length ? Math.min(...lows252) : null;

    const result = {
        symbol,
        asOfDate: latest.date,
        latestClose: round(latest.close, 4),
        previousClose: round(prev.close, 4),
        returns: {
            '1d': round(ret(1), 2),
            '5d': round(ret(5), 2),
            '1m': round(ret(20), 2),
            '3m': round(ret(63), 2),
            '6m': round(ret(126), 2),
            '1y': round(ret(252), 2),
        },
        volatility: {
            '20d_annualized': round(vol(20), 2),
            '60d_annualized': round(vol(60), 2),
        },
        range52w: {
            high: round(high52w, 4),
            low: round(low52w, 4),
            distanceFromHighPct: round(pctChange(high52w, latest.close), 2),
            distanceFromLowPct: round(pctChange(low52w, latest.close), 2),
        },
        volume: {
            average20d: round(mean(rows.slice(-20).map(r => r.volume).filter(v => v !== null)), 0),
            latest: latest.volume,
        }
    };

    if (outputMode === 'full') {
        result.rows = rows.slice(-lookbackDays);
    }

    return {
        data: result,
        metadata: {
            source: 'EODHD atomic action: get_price_action',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_price_action failed',
        details: err.message || String(err),
    };
}
