// name = Get Commodity Prices
// description = Fetches spot/futures prices for commodities (Gold, Oil, etc.).
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

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_commodity_prices',
            decisionGuide: {
                whenToUse: 'Use this for raw material trends (Gold, WTI Oil).',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_commodity_prices',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

// Common Commodities (Tickers vary by provider, EODHD uses COMM pseudo-exchange or FOREX/CFD)
// Gold: XAU/USD (Forex) or GC (Futures)
// Oil: WTI, BRENT
const COMMODITIES = [
    { name: 'Gold', ticker: 'XAUUSD.FOREX' }, // Spot Gold
    { name: 'Silver', ticker: 'XAGUSD.FOREX' },
    { name: 'WTI Oil', ticker: 'WTI.COMM' }, // Depends on EODHD mapping
    { name: 'Brent Oil', ticker: 'BRENT.COMM' }
];

async function fetchJson(url, label) {
    try {
        const res = await ld.request({ url, method: 'GET', headers: { Accept: 'application/json' } });
        if (res.status === 404 || res.status === 422) return null;
        if (res.status < 200 || res.status >= 300) return null;
        return res.json;
    } catch (err) {
        return null;
    }
}

try {
    const results = await Promise.all(COMMODITIES.map(async (c) => {
        // Try Real-Time/Live
        const url = `https://eodhd.com/api/real-time/${c.ticker}?api_token=${apiKey}&fmt=json`;
        const raw = await fetchJson(url, c.ticker);

        return {
            name: c.name,
            symbol: c.ticker,
            price: raw ? Number(raw.close) : null,
            changePct: raw ? Number(raw.change_p) : null,
            date: raw ? (raw.date || raw.timestamp) : null
        };
    }));

    const valid = results.filter(r => r.price !== null);

    return {
        data: {
            commodities: valid
        },
        metadata: {
            source: 'EODHD atomic action: get_commodity_prices',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_commodity_prices failed',
        details: err.message || String(err),
    };
}
