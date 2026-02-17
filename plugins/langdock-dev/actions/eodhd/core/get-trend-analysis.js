// name = Get Trend Analysis
// description = Analyzes trend state (SMAs) and momentum (RSI) for a symbol.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
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

function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function round(v, d) {
    if (!Number.isFinite(v)) return null;
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
}

function mean(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function formatDate(d) {
    return d.toISOString().slice(0, 10);
}

function dateDaysAgo(days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return formatDate(d);
}

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_trend_analysis',
            decisionGuide: {
                whenToUse: 'Use this to determines trend direction (SMAs) and momentum (RSI) in one call.',
                quickChoice: { symbol: 'NVDA.US' },
            },
            outputModeOptions: ['compact', 'full'],
        },
        metadata: {
            source: 'EODHD atomic action: get_trend_analysis',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

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
    // We need ~300 days for SMA200 calculation
    const from = dateDaysAgo(365);
    const to = formatDate(new Date());

    // Parallel fetch: EOD for SMAs, RSI for momentum
    const eodUrl = `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}?api_token=${apiKey}&fmt=json&period=d&order=a&from=${from}&to=${to}`;
    const rsiUrl = `https://eodhd.com/api/technical/${encodeURIComponent(symbol)}?api_token=${apiKey}&fmt=json&function=rsi&period=14&order=d&from=${from}&to=${to}`;

    const [eodRaw, rsiRaw] = await Promise.all([
        fetchJson(eodUrl, 'eod'),
        fetchJson(rsiUrl, 'rsi')
    ]);

    if (!Array.isArray(eodRaw) || eodRaw.length < 50) {
        return { error: true, message: 'Insufficient price history for trend analysis.' };
    }

    const closes = eodRaw
        .filter(r => r.date && r.close !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(r => safeNum(r.close));

    const latestClose = closes[closes.length - 1];

    const sma = (win) => (closes.length < win ? null : mean(closes.slice(-win)));
    const sma20 = sma(20);
    const sma50 = sma(50);
    const sma200 = sma(200);

    let trendState = 'mixed';
    if (sma20 && sma50 && sma200) {
        if (latestClose > sma20 && sma20 > sma50 && sma50 > sma200) trendState = 'strong-uptrend';
        else if (latestClose < sma20 && sma20 < sma50 && sma50 < sma200) trendState = 'strong-downtrend';
        else if (latestClose > sma20 && sma20 > sma50) trendState = 'uptrend';
        else if (latestClose < sma20 && sma20 < sma50) trendState = 'downtrend';
    }

    // RSI is returned descending by date usually, check first item
    const rsiValue = Array.isArray(rsiRaw) ? (safeNum(rsiRaw[0]?.rsi) || safeNum(rsiRaw[0]?.value) || safeNum(rsiRaw[rsiRaw.length - 1]?.rsi)) : null;
    const momentumState = rsiValue ? (rsiValue >= 70 ? 'overbought' : rsiValue <= 30 ? 'oversold' : 'neutral') : 'unknown';

    return {
        data: {
            symbol,
            asOfDate: to,
            latestClose: round(latestClose, 4),
            trendState,
            momentumState,
            indicators: {
                sma20: round(sma20, 2),
                sma50: round(sma50, 2),
                sma200: round(sma200, 2),
                rsi14: round(rsiValue, 2)
            }
        },
        metadata: {
            source: 'EODHD atomic action: get_trend_analysis',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_trend_analysis failed',
        details: err.message || String(err),
    };
}
