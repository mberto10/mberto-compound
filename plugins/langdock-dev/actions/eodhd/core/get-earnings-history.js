// name = Get Earnings History
// description = Fetches historical earnings surprises and future estimates for a symbol.
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

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'get_earnings_history',
            decisionGuide: {
                whenToUse: 'Use this to analyze beat/miss history and upcoming earnings dates.',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_earnings_history',
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
    // Fundamentals endpoint includes 'Earnings' field with History and Trend
    const url = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?api_token=${apiKey}&fmt=json`;
    const raw = await fetchJson(url, 'fundamentals-earnings');

    if (!raw || !raw.Earnings) {
        return { error: true, message: 'No Earnings data found in Fundamentals.' };
    }

    const history = raw.Earnings.History || {};
    const trend = raw.Earnings.Trend || {};

    // Convert object map to array if necessary (EODHD returns { "2023-09-30": {...}, ... })
    const historyArray = Object.keys(history).map(date => ({
        date,
        ...history[date]
    })).sort((a, b) => b.date.localeCompare(a.date)); // Descending

    const trendArray = Object.keys(trend).map(date => ({
        date,
        ...trend[date]
    })).sort((a, b) => b.date.localeCompare(a.date));

    const resultRows = outputMode === 'compact' ? historyArray.slice(0, 8) : historyArray;

    return {
        data: {
            symbol,
            lastReport: resultRows[0],
            history: resultRows,
            estimates: trendArray.slice(0, 4) // Next few quarters
        },
        metadata: {
            source: 'EODHD atomic action: get_earnings_history',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_earnings_history failed',
        details: err.message || String(err),
    };
}
