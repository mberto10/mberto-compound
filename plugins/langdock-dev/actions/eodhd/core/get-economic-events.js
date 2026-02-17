// name = Get Economic Events
// description = Fetches economic calendar events (CPI, Fed, Jobless Claims) for major economies.
//
// country = ISO country code (default: US)
// from = Start date YYYY-MM-DD (optional, default: today)
// to = End date YYYY-MM-DD (optional, default: +7 days)
// comparison = potential|actual|consensus (optional filter)
// offset = Pagination offset (default: 0)
// limit = Max items (default: 50)
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
            action: 'get_economic_events',
            decisionGuide: {
                whenToUse: 'Use this to find macro catalysts like Inflation, GDP, or Central Bank meetings.',
            },
            countryOptions: ['US', 'EU', 'CN', 'JP', 'UK', 'DE'],
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_economic_events',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const country = (data.input.country || 'US').toString().trim().toUpperCase();
const from = (data.input.from || '').toString().trim();
const to = (data.input.to || '').toString().trim();
const limit = Number(data.input.limit) || 50;
const offset = Number(data.input.offset) || 0;
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
    const params = [
        `api_token=${apiKey}`,
        'fmt=json',
        `limit=${limit}`,
        `offset=${offset}`
    ];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);

    // Note: EODHD economic-events endpoint usually takes country (or 'code') ISO
    // Docs: /api/economic-events?api_token=...&country=US
    if (country) params.push(`country=${country}`);

    const url = `https://eodhd.com/api/economic-events?${params.join('&')}`;
    const raw = await fetchJson(url, 'economic-events');

    if (!Array.isArray(raw)) {
        return { error: true, message: 'No economic events returned.' };
    }

    // Filter high impact if compact
    const resultRows = outputMode === 'compact'
        ? raw.filter(e => (e.importance || 0) >= 2 || (e.event || '').toLowerCase().includes('interest rate') || (e.event || '').toLowerCase().includes('gdp') || (e.event || '').toLowerCase().includes('cpi'))
        : raw;

    return {
        data: {
            country,
            count: resultRows.length,
            events: resultRows.map(e => ({
                type: e.type,
                comparison: e.comparison,
                country: e.country,
                date: e.date,
                actual: e.actual,
                previous: e.previous,
                estimate: e.estimate,
                change: e.change,
                changePct: e.change_p,
                importance: e.importance
            }))
        },
        metadata: {
            source: 'EODHD atomic action: get_economic_events',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_economic_events failed',
        details: err.message || String(err),
    };
}
