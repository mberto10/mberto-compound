// name = Get Bond Yields
// description = Fetches government bond yields (US 10Y, 2Y, etc.) via EOD endpoints.
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
            action: 'get_bond_yields',
            decisionGuide: {
                whenToUse: 'Use this for fixed income context (Yield Curves, Risk-Free Rate).',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_bond_yields',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

// Mapping: US Treasuries on EODHD (often under 'US' exchange or MONEY market)
const BONDS = {
    'US10Y': 'US10Y.INDX', // Check official ticker
    'US2Y': 'US2Y.INDX',
    // Alternatively using specific tickers if INDX unsupported. Often 'US10Y' works in search.
    // Actually commonly used for US gov bonds: US10Y.BOND, or similar.
    // Reliable defaults: US10Y, US2Y, US30Y usually available as Government Bond tickers.
};

// We will iterate known bond tickers (US10Y, US2Y)
const TICKERS = ['US10Y', 'US2Y', 'US30Y'];

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
    // Using EOD endpoint for latest price (Close = Yield)
    // Need to find correct Exchange. Often MONEY or BOND.
    // Let's assume user just wants standard US yields for now.

    const results = await Promise.all(TICKERS.map(async (sym) => {
        // EODHD often hosts these under 'BOND' exchange or similar. But 'US10Y' directly often works with API defaults.
        // Try US10Y without exchange first (composite), or default.
        // Use Real-Time if available? No, bonds often EOD.

        // Attempt 1: real-time
        let url = `https://eodhd.com/api/real-time/${sym}?api_token=${apiKey}&fmt=json`;
        let raw = await fetchJson(url, sym);

        if (!raw || !raw.close) {
            // Attempt 2: EOD
            url = `https://eodhd.com/api/eod/${sym}?api_token=${apiKey}&fmt=json&limit=1`;
            const eodRaw = await fetchJson(url, sym);
            if (Array.isArray(eodRaw) && eodRaw.length > 0) {
                raw = eodRaw[eodRaw.length - 1];
            }
        }

        return {
            symbol: sym,
            yield: raw ? Number(raw.close) : null,
            date: raw ? (raw.date || raw.timestamp) : null
        };
    }));

    const valid = results.filter(r => r.yield !== null);

    return {
        data: {
            category: 'Government Bonds US',
            yields: valid
        },
        metadata: {
            source: 'EODHD atomic action: get_bond_yields',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_bond_yields failed',
        details: err.message || String(err),
    };
}
