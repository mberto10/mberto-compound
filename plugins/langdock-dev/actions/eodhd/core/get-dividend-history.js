// name = Get Dividend History
// description = Fetches detailed dividend payout history and current yield.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// from = Start date YYYY-MM-DD
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
            action: 'get_dividend_history',
            decisionGuide: {
                whenToUse: 'Use this for income analysis (Yield, Growth, payout dates).',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_dividend_history',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

const from = (data.input.from || '').toString().trim();
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
    // Use /api/div/ endpoint which is specific for dividends
    const params = [`api_token=${apiKey}`, 'fmt=json'];
    if (from) params.push(`from=${from}`);

    const url = `https://eodhd.com/api/div/${encodeURIComponent(symbol)}?${params.join('&')}`;
    const raw = await fetchJson(url, 'dividends');

    if (!Array.isArray(raw)) {
        return { error: true, message: 'No dividend history found (or not a dividend stock).' };
    }

    // Calculate generic stats
    // Sort desc
    raw.sort((a, b) => b.date.localeCompare(a.date));

    // TTM Yield approximation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearStr = oneYearAgo.toISOString().slice(0, 10);

    const divTTM = raw.filter(d => d.date >= oneYearStr).reduce((a, b) => a + (Number(b.value) || 0), 0);

    const rows = raw.map(d => ({
        date: d.date,       // Ex-Div Date usually
        paymentDate: d.paymentDate, // Some endpoints return this
        value: Number(d.value),
        unadjustedValue: Number(d.unadjustedValue),
        currency: d.currency
    }));

    const resultRows = outputMode === 'compact' ? rows.slice(0, 12) : rows;

    return {
        data: {
            symbol,
            ttmPayout: divTTM,
            latest: rows[0],
            history: resultRows
        },
        metadata: {
            source: 'EODHD atomic action: get_dividend_history',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_dividend_history failed',
        details: err.message || String(err),
    };
}
