// name = Get Market Movers
// description = Fetches top gainers, losers, and most active stocks using the EODHD Screener.
//
// limit = Number of results per category (default: 10, min: 5, max: 20)
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

function clamp(v, min, max) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;
}

function round(v, d) {
    if (!Number.isFinite(v)) return null;
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
}

function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_market_movers',
            decisionGuide: {
                whenToUse: 'Use this to get a snapshot of market activity (Gainers/Losers/Volume).',
            },
            outputModeOptions: ['compact', 'full'],
        },
        endpointDiagnostics: {
            endpoint: '/api/screener',
            helpOnly: true,
        },
        metadata: {
            source: 'EODHD atomic action: get_market_movers',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const limit = clamp(data.input.limit, 5, 20);
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

async function getCategory(sortParams) {
    const params = [
        `api_token=${apiKey}`,
        'fmt=json',
        `limit=${limit}`,
        `sort=${sortParams}`,
        'filters=[["market_capitalization",">",1000000000],["exchange","=","us"]]' // Hardcoded to US > 1B for relevance
    ];
    const url = `https://eodhd.com/api/screener?${params.join('&')}`;
    const raw = await fetchJson(url, 'screener');
    if (!raw || !Array.isArray(raw.data)) return [];

    return raw.data.map(r => ({
        symbol: r.code,
        name: r.name,
        close: safeNum(r.close || r.adjusted_close),
        changePct: safeNum(r.refund_1d_p || r.change_p), // refund_1d_p is what screener sometimes returns for % chg
        volume: safeNum(r.volume),
        marketCap: safeNum(r.market_capitalization)
    })).filter(r => r.symbol && r.changePct !== null);
}

try {
    const [gainers, losers, active] = await Promise.all([
        getCategory('refund_1d_p.desc'),
        getCategory('refund_1d_p.asc'),
        getCategory('volume.desc') // High volume
    ]);

    return {
        data: {
            gainers: gainers.map(r => ({ ...r, changePct: round(r.changePct, 2) })),
            losers: losers.map(r => ({ ...r, changePct: round(r.changePct, 2) })),
            active: active.map(r => ({ ...r, changePct: round(r.changePct, 2) })),
        },
        metadata: {
            source: 'EODHD atomic action: get_market_movers',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_market_movers failed',
        details: err.message || String(err),
    };
}
