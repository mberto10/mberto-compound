// name = Get Analyst Ratings
// description = Fetches analyst consensus ratings (Buy/Seel/Hold) and price targets.
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
            action: 'get_analyst_ratings',
            decisionGuide: {
                whenToUse: 'Use this to see what Wall Street thinks (Consensus, Target Price).',
            },
            outputModeOptions: ['compact', 'full']
        },
        metadata: {
            source: 'EODHD atomic action: get_analyst_ratings',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbol = (data.input.symbol || '').toString().trim().toUpperCase();
if (!symbol) return { error: true, message: 'symbol is required.' };

// No special params needed usually, captured in Fundamentals > AnalystRatings
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
    const url = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}?api_token=${apiKey}&fmt=json`;
    const raw = await fetchJson(url, 'fundamentals-analyst');

    if (!raw || !raw.AnalystRatings) {
        return { error: true, message: 'No AnalystRatings data found.' };
    }

    const ratings = raw.AnalystRatings; // { Rating, TargetPrice, StrongBuy, Buy, Hold, Sell, StrongSell }

    return {
        data: {
            symbol,
            consensus: ratings.Rating,
            targetPrice: ratings.TargetPrice,
            breakdown: {
                strongBuy: ratings.StrongBuy,
                buy: ratings.Buy,
                hold: ratings.Hold,
                sell: ratings.Sell,
                strongSell: ratings.StrongSell
            }
        },
        metadata: {
            source: 'EODHD atomic action: get_analyst_ratings',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'get_analyst_ratings failed',
        details: err.message || String(err),
    };
}
