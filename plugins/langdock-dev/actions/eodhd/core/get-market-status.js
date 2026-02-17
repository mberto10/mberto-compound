// name = Get Market Status
// description = Fetches current market status (price, change, volume) for a list of symbols using real-time data.
// 
// symbols = Comma-separated list of EODHD symbols (e.g., AAPL.US,MSFT.US) (required)
// outputMode = compact|full (default: compact)

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (
    auth.apiKey ||
    auth.api_key ||
    auth.apiToken ||
    auth.api_token ||
    auth.eodhdApiKey ||
    auth.EODHD_API_KEY ||
    ''
).toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbolsInput = (data.input.symbols || '').toString().trim();
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

if (!symbolsInput) return { error: true, message: 'symbols argument is required.' };

function safeNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

async function fetchJson(url) {
    const response = await ld.request({
        url,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        body: null,
    });
    if (response.status < 200 || response.status >= 300) {
        // Return null for individual failures so we can handle partial success
        return null;
    }
    return response.json;
}

const symbols = symbolsInput.split(',').map(s => s.trim()).filter(Boolean);
if (symbols.length === 0) return { error: true, message: 'No valid symbols provided.' };

// EODHD real-time endpoint supports bulk via ?s=SYMBOL1,SYMBOL2,...
// endpoint: /api/real-time/FIRST_SYMBOL?s=REMAINING_SYMBOLS&...

// However, for simplicity and robustness with the "real-time" endpoint which might behave differently 
// than EOD for bulk, we will start with the official bulk syntax if supported, or individual requests loops.
// Doc says: https://eodhd.com/api/real-time/AAPL.US?s=VTI.US,EUR.FOREX&fmt=json

const firstSymbol = symbols[0];
const remainingSymbols = symbols.slice(1);
let url = `https://eodhd.com/api/real-time/${encodeURIComponent(firstSymbol)}?api_token=${apiKey}&fmt=json`;
if (remainingSymbols.length > 0) {
    url += `&s=${remainingSymbols.map(encodeURIComponent).join(',')}`;
}

try {
    // The endpoint returns a single object if 1 symbol, or an array if multiple
    const raw = await fetchJson(url);

    if (!raw) return { error: true, message: 'Request failed.' };

    let rows = [];
    if (Array.isArray(raw)) {
        rows = raw;
    } else {
        rows = [raw]; // Single object
    }

    // Normalize
    const normalized = rows.map(r => ({
        symbol: r.code ? r.code : (r.symbol || 'Unknown'),
        price: safeNumber(r.close),
        change: safeNumber(r.change),
        changePct: safeNumber(r.change_p),
        volume: safeNumber(r.volume),
        timestamp: safeNumber(r.timestamp),
        gmtoffset: safeNumber(r.gmtoffset)
    }));

    return {
        data: {
            count: normalized.length,
            rows: normalized
        },
        metadata: {
            source: 'EODHD atomic action: get_market_status',
            endpoint: '/api/real-time',
            timestamp: new Date().toISOString() // capture time of execution
        }
    };

} catch (error) {
    return {
        error: true,
        message: 'get_market_status failed',
        details: error.message || String(error)
    };
}
