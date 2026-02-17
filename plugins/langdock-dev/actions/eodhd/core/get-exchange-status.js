// name = Get Exchange Status
// description = Checks if a specific exchange is currently open or closed (market hours).
//
// exchange = Exchange code (default: US)
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
            action: 'get_exchange_status',
            decisionGuide: {
                whenToUse: 'Use this to check if the market is open (Trading Hours, Holidays).',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_exchange_status',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const exchange = (data.input.exchange || 'US').toString().trim().toUpperCase();

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
    // Use /api/exchange-details/US
    const url = `https://eodhd.com/api/exchange-details/${encodeURIComponent(exchange)}?api_token=${apiKey}&fmt=json`;
    const raw = await fetchJson(url, 'exchange-details');

    if (!raw) {
        return { error: true, message: 'Exchange details not found.' };
    }

    // Raw fields: Name, Country, Currency, Timezone, isOpen, TradingHours, ActiveTickers

    return {
        data: {
            code: raw.Code,
            name: raw.Name,
            country: raw.Country,
            isOpen: raw.isOpen,
            timezone: raw.Timezone,
            tradingHours: raw.TradingHours,
            activeTickers: raw.ActiveTickers
        },
        metadata: {
            source: 'EODHD atomic action: get_exchange_status',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_exchange_status failed',
        details: err.message || String(err),
    };
}
