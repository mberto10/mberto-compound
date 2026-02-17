// name = Get Sector Performance
// description = Calculates 1D and 1M performance for US sectors by sampling constituents.
//
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

function round(v, d) {
    if (!Number.isFinite(v)) return null;
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
}

function mean(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function safeNum(v) {
    return Number.isFinite(Number(v)) ? Number(v) : null;
}

function pctChange(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return null;
    return ((b - a) / a) * 100;
}

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_sector_performance',
            decisionGuide: {
                whenToUse: 'Use this to see which sectors are leading or lagging (1D, 1M).',
            },
            outputModeOptions: ['compact', 'full'],
        },
        metadata: {
            source: 'EODHD atomic action: get_sector_performance',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

async function fetchJson(url, label) {
    try {
        const res = await ld.request({ url, method: 'GET', headers: { Accept: 'application/json' } });
        if (res.status === 404 || res.status === 422) return null;
        if (res.status < 200 || res.status >= 300) {
            // Return null on failure to allow partial results
            return null;
        }
        return res.json;
    } catch (err) {
        if (err.status === 404 || err.status === 422) return null;
        return null; // Swallow errors for robust aggregation
    }
}

// Helper to get representative ETF performance as proxy for sector
// Using ETFs is faster and cheaper than aggregating 500 stocks.
// Mapping: Sector -> ETF Symbol
const SECTOR_ETFS = {
    'Technology': 'XLK.US',
    'Health Care': 'XLV.US',
    'Financials': 'XLF.US',
    'Real Estate': 'XLRE.US',
    'Energy': 'XLE.US',
    'Materials': 'XLB.US',
    'Consumer Discretionary': 'XLY.US',
    'Industrials': 'XLI.US',
    'Utilities': 'XLU.US',
    'Consumer Staples': 'XLP.US',
    'Communication Services': 'XLC.US',
};

try {
    const sectors = Object.keys(SECTOR_ETFS);
    const etfSymbols = Object.values(SECTOR_ETFS);
    const from = new Date();
    from.setMonth(from.getMonth() - 2); // 2 months back for 1M calc + buffer
    const fromStr = from.toISOString().slice(0, 10);

    // Bulk fetch EOD for ETFs? Or real-time?
    // Let's use individual EOD fetch parallelized for simplicity and reliability.

    const results = await Promise.all(sectors.map(async (sector) => {
        const sym = SECTOR_ETFS[sector];
        const url = `https://eodhd.com/api/eod/${sym}?api_token=${apiKey}&fmt=json&from=${fromStr}&period=d&order=a`;
        const rows = await fetchJson(url, sym);

        if (!Array.isArray(rows) || rows.length < 5) return null;

        // Sort just in case
        rows.sort((a, b) => a.date.localeCompare(b.date));

        const latest = rows[rows.length - 1];
        const prev = rows[rows.length - 2];
        const monthAgo = rows[rows.length - 22]; // approx 1 month trading days

        const close = safeNum(latest.close);
        const prevClose = safeNum(prev.close);
        const monthClose = monthAgo ? safeNum(monthAgo.close) : null;

        return {
            sector,
            etf: sym,
            price: close,
            return1d: pctChange(prevClose, close),
            return1m: monthClose ? pctChange(monthClose, close) : null
        };
    }));

    const valid = results.filter(Boolean);
    valid.sort((a, b) => b.return1d - a.return1d); // Sort by 1D perf

    return {
        data: valid.map(r => ({
            sector: r.sector,
            etf: r.etf,
            return1dPct: round(r.return1d, 2),
            return1mPct: round(r.return1m, 2)
        })),
        metadata: {
            source: 'EODHD atomic action: get_sector_performance',
            generatedAt: new Date().toISOString(),
            note: 'Performance proxies via Sector SPDR ETFs'
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_sector_performance failed',
        details: err.message || String(err),
    };
}
