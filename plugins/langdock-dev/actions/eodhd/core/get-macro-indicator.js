// name = Get Macro Indicator
// description = Fetches historical macro data (GDP, Inflation, etc.) for a country.
//
// country = ISO country code (default: USA)
// indicator = indicator code (e.g. gdp_current_usd, inflation_consumer_prices_annual)
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
            action: 'get_macro_indicator',
            decisionGuide: {
                whenToUse: 'Use this for long-term macro analysis (10y+ trends).',
            },
            commonIndicators: ['gdp_current_usd', 'inflation_consumer_prices_annual', 'population_total', 'unemployment_total'],
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_macro_indicator',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const country = (data.input.country || 'USA').toString().trim().toUpperCase();
const indicator = (data.input.indicator || '').toString().trim().toLowerCase();
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

if (!indicator) return { error: true, message: 'indicator is required (e.g. gdp_current_usd).' };

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
    const params = [
        `api_token=${apiKey}`,
        'fmt=json',
        `indicator=${indicator}`
    ];

    const url = `https://eodhd.com/api/macro-indicator/${encodeURIComponent(country)}?${params.join('&')}`;
    const raw = await fetchJson(url, 'macro-indicator');

    if (!Array.isArray(raw)) {
        return { error: true, message: 'No macro data returned (check country/indicator code).' };
    }

    // EODHD macro data is simple array of { Date, Value, Period } usually
    // Sort descending by date
    raw.sort((a, b) => b.Date.localeCompare(a.Date)); // Usually YYYY-MM-DD

    const resultRows = outputMode === 'compact' ? raw.slice(0, 20) : raw;

    return {
        data: {
            country,
            indicator,
            latestValue: raw[0]?.Value,
            latestDate: raw[0]?.Date,
            history: resultRows.map(r => ({ date: r.Date, value: r.Value, period: r.Period }))
        },
        metadata: {
            source: 'EODHD atomic action: get_macro_indicator',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_macro_indicator failed',
        details: err.message || String(err),
    };
}
