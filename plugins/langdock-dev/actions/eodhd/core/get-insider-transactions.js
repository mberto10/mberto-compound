// name = Get Insider Transactions
// description = Fetches recent insider buying and selling activity for a symbol.
//
// symbol = EODHD symbol (required, e.g. AAPL.US)
// from = Start date YYYY-MM-DD (optional, default: 6 months ago)
// to = End date YYYY-MM-DD (optional, default: today)
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
            action: 'get_insider_transactions',
            decisionGuide: {
                whenToUse: 'Use this to see if executives are buying or selling stock.',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_insider_transactions',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

const limit = Number(data.input.limit) || 50;
const from = (data.input.from || '').toString().trim();
const to = (data.input.to || '').toString().trim();
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
        `limit=${limit}`
    ];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);

    // Endpoint: /api/insider-transactions?code=AAPL.US or ?code=AAPL (EODHD usually wants pure code or Code.Exchange? Let's try code=SYMBOL)
    // Actually, EODHD doc: /api/insider-transactions?api_token=...&code=AAPL.US
    params.push(`code=${symbol}`);

    const url = `https://eodhd.com/api/insider-transactions?${params.join('&')}`;
    const raw = await fetchJson(url, 'insider-transactions');

    if (!Array.isArray(raw)) {
        return { error: true, message: 'No insider transactions found.' };
    }

    // Calculate net flow if meaningful
    const buyVol = raw.filter(t => (t.code || '').includes('Buy') || (t.transactionCode || '').includes('Buy') || (t.transactionCode || '').includes('P')).reduce((a, b) => a + (Number(b.transactionAmount) || 0), 0);
    const sellVol = raw.filter(t => (t.code || '').includes('Sell') || (t.transactionCode || '').includes('Sell') || (t.transactionCode || '').includes('S')).reduce((a, b) => a + (Number(b.transactionAmount) || 0), 0);

    const rows = raw.map(t => ({
        date: t.date || t.transactionDate,
        owner: t.ownerName || t.reportingName,
        type: t.code || t.transactionCode, // P = Purchase, S = Sale usually, or explicit 'Buy'/'Sell'
        shares: Number(t.transactionAmount),
        price: Number(t.price || t.transactionPrice),
        value: Number(t.transactionAmount) * Number(t.price || t.transactionPrice)
    }));

    // Compact: filter out very small transactions? or just top N?
    const resultRows = outputMode === 'compact' ? rows.slice(0, 10) : rows;

    return {
        data: {
            symbol,
            count: raw.length,
            netFlow_shares: buyVol - sellVol,
            transactions: resultRows
        },
        metadata: {
            source: 'EODHD atomic action: get_insider_transactions',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_insider_transactions failed',
        details: err.message || String(err),
    };
}
