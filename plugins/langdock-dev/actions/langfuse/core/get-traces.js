// name = Get Traces
// description = Fetches Langfuse traces with pagination, scores, and metadata extraction. Supports date windows and tag filtering.
//
// help = true|false (optional, default false). If true, returns a decision guide and exits.
// windowPreset = Optional date shortcut: last_24h|last_7d|last_30d
// from = Optional start date YYYY-MM-DD or ISO (overrides windowPreset)
// to = Optional end date YYYY-MM-DD or ISO (overrides windowPreset)
// tags = Optional comma-separated tags to filter by (e.g. genre:tech,genre:politics)
// pageLimit = Maximum API pages to fetch, each page has up to 100 traces (default: 10, min: 1, max: 100)
// outputMode = compact|full (default: compact)

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === false) return value;
  var normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

function clampNumber(value, fallback, minValue, maxValue) {
  var n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), minValue), maxValue);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function shiftDays(baseDate, days) {
  var d = new Date(baseDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

function base64Encode(str) {
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var out = '';
  for (var i = 0; i < str.length; i += 3) {
    var a = str.charCodeAt(i);
    var b = (i + 1 < str.length) ? str.charCodeAt(i + 1) : 0;
    var c = (i + 2 < str.length) ? str.charCodeAt(i + 2) : 0;
    var triplet = (a << 16) | (b << 8) | c;
    var remaining = str.length - i;
    out += CHARS[(triplet >> 18) & 63];
    out += CHARS[(triplet >> 12) & 63];
    out += remaining < 2 ? '=' : CHARS[(triplet >> 6) & 63];
    out += remaining < 3 ? '=' : CHARS[triplet & 63];
  }
  return out;
}

function toIsoTimestamp(dateStr) {
  if (!dateStr) return null;
  var s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00.000Z';
  var d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toEndOfDayIso(dateStr) {
  if (!dateStr) return null;
  var s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T23:59:59.999Z';
  var d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function extractGenre(trace) {
  var tags = Array.isArray(trace.tags) ? trace.tags : [];
  for (var i = 0; i < tags.length; i++) {
    var tag = String(tags[i]);
    if (tag.indexOf('genre:') === 0) return tag.slice(6);
  }
  var meta = trace.metadata || {};
  var perf = meta.performance || meta;
  if (perf.genre) return String(perf.genre);
  return null;
}

function round(value, decimals) {
  if (!Number.isFinite(value)) return null;
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function computeMeanScore(scores) {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  var sum = 0;
  var count = 0;
  for (var i = 0; i < scores.length; i++) {
    var v = Number(scores[i].value);
    if (Number.isFinite(v)) { sum += v; count++; }
  }
  return count > 0 ? sum / count : null;
}

async function fetchJson(url, headers, label) {
  var response = await ld.request({
    url: url,
    method: 'GET',
    headers: headers,
    body: null,
  });
  if (response.status < 200 || response.status >= 300) {
    var err = new Error(label + ' request failed (HTTP ' + response.status + ')');
    err.status = response.status;
    err.details = response.json || null;
    throw err;
  }
  return response.json;
}

// Fetch all scores in the window via /api/public/scores, paginated.
// Returns a map: traceId -> [{ name, value, comment }]
async function fetchAllScores(headers, fromIso, toIso, pageLimit) {
  var scoresByTrace = {};
  var page = 1;
  while (page <= pageLimit) {
    var params = ['page=' + page, 'limit=100'];
    if (fromIso) params.push('fromTimestamp=' + encodeURIComponent(fromIso));
    if (toIso) params.push('toTimestamp=' + encodeURIComponent(toIso));
    var url = LANGFUSE_HOST + '/api/public/scores?' + params.join('&');
    var result = await fetchJson(url, headers, 'scores-page-' + page);
    var items = Array.isArray(result.data) ? result.data : [];
    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var tid = s.traceId;
      if (!tid) continue;
      if (!scoresByTrace[tid]) scoresByTrace[tid] = [];
      scoresByTrace[tid].push({
        name: s.name || null,
        value: Number.isFinite(Number(s.value)) ? Number(s.value) : null,
        comment: s.comment || null,
      });
    }
    var meta = result.meta || {};
    var tp = Number(meta.totalPages);
    if (items.length < 100) break;
    if (Number.isFinite(tp) && page >= tp) break;
    page++;
  }
  return scoresByTrace;
}

function normalizeTrace(trace, scoreObjs, outputMode) {
  var scores = Array.isArray(scoreObjs) ? scoreObjs : [];
  var meanScore = round(computeMeanScore(scores), 4);
  var row = {
    traceId: trace.id || null,
    timestamp: trace.timestamp || null,
    name: trace.name || null,
    genre: extractGenre(trace),
    metadata: trace.metadata || null,
    tags: Array.isArray(trace.tags) ? trace.tags : [],
    scores: scores,
    meanScore: meanScore,
  };
  if (outputMode === 'compact') {
    row.scores = scores.map(function (s) {
      return { name: s.name, value: s.value };
    });
    delete row.metadata;
  }
  return row;
}

var WINDOW_PRESETS = ['last_24h', 'last_7d', 'last_30d'];
var LANGFUSE_HOST = 'https://cloud.langfuse.com';

var help = asBool(data.input.help, false);

if (help) {
  return {
    data: {
      action: 'get_traces',
      decisionGuide: {
        whenToUse: 'Use this to fetch raw Langfuse traces with their scores and metadata.',
        firstDecision: 'Set a windowPreset for quick date ranges, or use from/to for custom ranges.',
        quickChoices: [
          { goal: 'Last 24h overview', use: { windowPreset: 'last_24h' } },
          { goal: 'Last 7 days', use: { windowPreset: 'last_7d' } },
          { goal: 'Filter by genre tag', use: { windowPreset: 'last_7d', tags: 'genre:tech' } },
          { goal: 'Full trace data', use: { windowPreset: 'last_7d', outputMode: 'full' } },
        ],
      },
      windowPresetOptions: WINDOW_PRESETS,
      outputModeOptions: ['compact', 'full'],
      pageInfo: 'Each API page returns up to 100 traces. pageLimit controls max pages fetched.',
    },
    endpointDiagnostics: { endpoint: '/api/public/traces', helpOnly: true },
    metadata: {
      source: 'Langfuse atomic action: get_traces',
      generatedAt: new Date().toISOString(),
    },
  };
}

var auth = (data && data.auth) ? data.auth : {};
var publicKey = (
  auth.langfusePublicKey ||
  auth.langfuse_public_key ||
  auth.publicKey ||
  auth.public_key ||
  ''
).toString().trim();
var secretKey = (
  auth.langfuseSecretKey ||
  auth.langfuse_secret_key ||
  auth.secretKey ||
  auth.secret_key ||
  ''
).toString().trim();

if (!publicKey || !secretKey) {
  return {
    error: true,
    message: 'Missing Langfuse credentials. Set auth.langfusePublicKey and auth.langfuseSecretKey.',
  };
}

var authHeader = 'Basic ' + base64Encode(publicKey + ':' + secretKey);
var headers = { Accept: 'application/json', Authorization: authHeader };

var windowPreset = (data.input.windowPreset || '').toString().trim().toLowerCase();
var outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();
var fromInput = (data.input.from || '').toString().trim();
var toInput = (data.input.to || '').toString().trim();
var tagsInput = (data.input.tags || '').toString().trim();
var pageLimit = clampNumber(data.input.pageLimit, 10, 1, 100);

if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'outputMode must be compact or full.' };
}

var fromDate = fromInput;
var toDate = toInput;

if (windowPreset && !fromInput && !toInput) {
  if (WINDOW_PRESETS.indexOf(windowPreset) === -1) {
    return {
      error: true,
      message: 'Unknown windowPreset.',
      details: { windowPreset: windowPreset, allowed: WINDOW_PRESETS },
    };
  }
  var today = formatDate(new Date());
  if (windowPreset === 'last_24h') {
    fromDate = shiftDays(today, -1);
    toDate = today;
  } else if (windowPreset === 'last_7d') {
    fromDate = shiftDays(today, -7);
    toDate = today;
  } else if (windowPreset === 'last_30d') {
    fromDate = shiftDays(today, -30);
    toDate = today;
  }
}

var fromIso = toIsoTimestamp(fromDate);
var toIso = toEndOfDayIso(toDate);

var filterTags = tagsInput ? tagsInput.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];

try {
  var allTraces = [];
  var page = 1;
  var totalPages = null;
  var wasTruncated = false;

  while (page <= pageLimit) {
    var params = [];
    params.push('page=' + page);
    params.push('limit=100');
    if (fromIso) params.push('fromTimestamp=' + encodeURIComponent(fromIso));
    if (toIso) params.push('toTimestamp=' + encodeURIComponent(toIso));
    for (var t = 0; t < filterTags.length; t++) {
      params.push('tags=' + encodeURIComponent(filterTags[t]));
    }

    var url = LANGFUSE_HOST + '/api/public/traces?' + params.join('&');
    var result = await fetchJson(url, headers, 'traces-page-' + page);

    var traces = Array.isArray(result.data) ? result.data : [];
    for (var i = 0; i < traces.length; i++) {
      allTraces.push(traces[i]);
    }

    var meta = result.meta || {};
    if (totalPages === null && Number.isFinite(Number(meta.totalPages))) {
      totalPages = Number(meta.totalPages);
    }

    if (traces.length < 100) break;
    if (totalPages !== null && page >= totalPages) break;
    page++;
  }

  if (totalPages !== null && page < totalPages) {
    wasTruncated = true;
  }

  // Fetch scores separately via /api/public/scores and join by traceId
  var scoresByTrace = await fetchAllScores(headers, fromIso, toIso, pageLimit);

  var rows = allTraces.map(function (trace) {
    var traceScores = scoresByTrace[trace.id] || [];
    return normalizeTrace(trace, traceScores, outputMode);
  });

  return {
    data: {
      count: rows.length,
      rows: rows,
    },
    endpointDiagnostics: {
      endpoint: '/api/public/traces + /api/public/scores',
      parameters: {
        fromTimestamp: fromIso || null,
        toTimestamp: toIso || null,
        tags: filterTags.length > 0 ? filterTags : null,
        windowPreset: windowPreset || null,
        outputMode: outputMode,
        pageLimit: pageLimit,
        pagesFetched: page,
        totalPages: totalPages,
        wasTruncated: wasTruncated,
      },
    },
    metadata: {
      source: 'Langfuse atomic action: get_traces',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_traces failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}
