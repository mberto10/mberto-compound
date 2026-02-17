// name = Scan Event Risks
// description = Scans for upcoming high-impact events (earnings, splits) for a list of symbols or broad market.
//
// symbols = Optional comma-separated symbols to check (e.g. AAPL.US,MSFT.US)
// daysAhead = Number of days to scan ahead (default: 7, min: 1, max: 30)
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

function clamp(v, min, max) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;
}

function formatDate(d) {
    return d.toISOString().slice(0, 10);
}

const help = asBool(data.input.help, false);
if (help) {
    return {
        data: {
            action: 'scan_event_risks',
            decisionGuide: {
                whenToUse: 'Use this to find upcoming earnings, splits, or dividends for specific stocks.',
            },
            outputModeOptions: ['compact', 'full'],
        },
        metadata: {
            source: 'EODHD atomic action: scan_event_risks',
            generatedAt: new Date().toISOString(),
        },
    };
}

const auth = (data && data.auth) ? data.auth : {};
const apiKey = (auth.apiKey || auth.api_key || auth.apiToken || auth.api_token || auth.eodhdApiKey || auth.EODHD_API_KEY || '').toString().trim();
if (!apiKey) return { error: true, message: 'Missing auth credential.' };

const symbolsInput = (data.input.symbols || '').toString().trim();
const daysAhead = clamp(data.input.daysAhead, 7, 30);
const outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

async function fetchJson(url, label) {
    try {
        const res = await ld.request({ url, method: 'GET', headers: { Accept: 'application/json' } });
        if (res.status === 404 || res.status === 422) return null;
        if (res.status < 200 || res.status >= 300) return null; // Swallow errors
        return res.json;
    } catch (err) {
        return null;
    }
}

try {
    const from = formatDate(new Date());
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + daysAhead);
    const to = formatDate(toDate);

    // If symbols provided, we limit the calendar call.
    // BUT the EODHD calendar API 'symbols' param is sometimes restrictive or specific.
    // It's often better to fetch a wider range or rely on the API filter.

    const typeCalls = [
        { type: 'earnings', url: `https://eodhd.com/api/calendar/earnings?api_token=${apiKey}&fmt=json&from=${from}&to=${to}` },
        { type: 'splits', url: `https://eodhd.com/api/calendar/splits?api_token=${apiKey}&fmt=json&from=${from}&to=${to}` },
        { type: 'ipos', url: `https://eodhd.com/api/calendar/ipos?api_token=${apiKey}&fmt=json&from=${from}&to=${to}` }
    ];

    if (symbolsInput) {
        typeCalls.forEach(c => c.url += `&symbols=${symbolsInput}`);
    }

    const results = await Promise.all(typeCalls.map(async (c) => {
        const raw = await fetchJson(c.url, c.type);
        const items = raw ? (Array.isArray(raw) ? raw : (raw.earnings || raw.splits || raw.ipos || [])) : [];
        return items.map(i => ({
            type: c.type,
            symbol: i.code || i.symbol,
            date: i.report_date || i.date,
            details: i
        }));
    }));

    const allEvents = results.flat();
    // Filter by symbol if we did client-side filtering (API sometimes ignores symbols param for some calendars)
    const targetSymbols = symbolsInput ? symbolsInput.split(',').map(s => s.trim().toUpperCase()) : null;

    const filtered = targetSymbols
        ? allEvents.filter(e => targetSymbols.some(t => e.symbol && e.symbol.includes(t)))
        : allEvents;

    filtered.sort((a, b) => a.date.localeCompare(b.date));

    return {
        data: {
            events: filtered.slice(0, 50).map(e => ({
                type: e.type,
                symbol: e.symbol,
                date: e.date,
                // sparse details for compact
                info: outputMode === 'full' ? e.details : undefined
            })),
            count: filtered.length
        },
        metadata: {
            source: 'EODHD atomic action: scan_event_risks',
            generatedAt: new Date().toISOString(),
        }
    };

} catch (err) {
    return {
        error: true,
        message: 'scan_event_risks failed',
        details: err.message || String(err),
    };
}
