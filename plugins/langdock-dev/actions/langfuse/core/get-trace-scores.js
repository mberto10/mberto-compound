// name = Get Trace Scores
// description = Fetches full score objects (with evaluator comments) for one or more trace IDs. Useful for drilling into outliers flagged by the dashboard.
//
// traceIds = Comma-separated trace IDs (required)
// scoreName = Optional: filter to a single evaluator name (e.g. fact-opinion-differentiation-grader)
// outputMode = compact|full (default: full). compact strips comments.
// help = true|false (optional, default false). If true, returns a decision guide and exits.

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === false) return value;
  var normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

function round(value, decimals) {
  if (!Number.isFinite(value)) return null;
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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

var LANGFUSE_HOST = 'https://cloud.langfuse.com';

var help = asBool(data.input.help, false);

if (help) {
  return {
    data: {
      action: 'get_trace_scores',
      decisionGuide: {
        whenToUse: 'Use this to drill into outlier traces and see the full evaluator commentary explaining why a score is low.',
        firstDecision: 'Pass one or more traceIds (comma-separated). Optionally filter to a single evaluator with scoreName.',
        quickChoices: [
          { goal: 'All scores for one trace', use: { traceIds: '<traceId>' } },
          { goal: 'All scores for multiple traces', use: { traceIds: '<id1>,<id2>,<id3>' } },
          { goal: 'Single evaluator drill-down', use: { traceIds: '<traceId>', scoreName: 'readability-cohesion' } },
          { goal: 'Compact (no comments)', use: { traceIds: '<traceId>', outputMode: 'compact' } },
        ],
      },
      outputModeOptions: ['compact', 'full'],
    },
    endpointDiagnostics: { endpoint: '/api/public/scores', helpOnly: true },
    metadata: {
      source: 'Langfuse atomic action: get_trace_scores',
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

var traceIdsRaw = (data.input.traceIds || '').toString().trim();
var scoreNameFilter = (data.input.scoreName || '').toString().trim() || null;
var outputMode = (data.input.outputMode || 'full').toString().trim().toLowerCase();

if (!traceIdsRaw) {
  return { error: true, message: 'traceIds is required. Provide one or more comma-separated trace IDs.' };
}

if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'outputMode must be compact or full.' };
}

var traceIds = traceIdsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean);

if (traceIds.length === 0) {
  return { error: true, message: 'traceIds is empty after parsing. Provide at least one trace ID.' };
}

try {
  var traces = [];
  var totalApiFetches = 0;

  for (var ti = 0; ti < traceIds.length; ti++) {
    var tid = traceIds[ti];
    var allScores = [];
    var page = 1;

    while (page <= 10) {
      var params = ['traceId=' + encodeURIComponent(tid), 'limit=100', 'page=' + page];
      var url = LANGFUSE_HOST + '/api/public/scores?' + params.join('&');
      var result = await fetchJson(url, headers, 'scores-trace-' + tid + '-page-' + page);
      totalApiFetches++;

      var items = Array.isArray(result.data) ? result.data : [];
      for (var si = 0; si < items.length; si++) {
        var s = items[si];
        var scoreObj = {
          name: s.name || null,
          value: Number.isFinite(Number(s.value)) ? Number(s.value) : null,
        };
        if (outputMode === 'full') {
          scoreObj.comment = s.comment || null;
        }
        allScores.push(scoreObj);
      }

      var meta = result.meta || {};
      var tp = Number(meta.totalPages);
      if (items.length < 100) break;
      if (Number.isFinite(tp) && page >= tp) break;
      page++;
    }

    // Apply scoreName filter
    var filtered = allScores;
    if (scoreNameFilter) {
      filtered = allScores.filter(function (s) { return s.name === scoreNameFilter; });
    }

    // Compute mean and find lowest
    var sum = 0;
    var count = 0;
    var lowest = null;
    for (var fi = 0; fi < filtered.length; fi++) {
      var v = filtered[fi].value;
      if (Number.isFinite(v)) {
        sum += v;
        count++;
        if (lowest === null || v < lowest.value) {
          lowest = { name: filtered[fi].name, value: v };
        }
      }
    }

    traces.push({
      traceId: tid,
      scores: filtered,
      meanScore: count > 0 ? round(sum / count, 4) : null,
      lowestScore: lowest,
    });
  }

  return {
    data: {
      count: traces.length,
      traces: traces,
    },
    endpointDiagnostics: {
      endpoint: '/api/public/scores',
      traceIdCount: traceIds.length,
      scoreNameFilter: scoreNameFilter,
      outputMode: outputMode,
      totalApiFetches: totalApiFetches,
    },
    metadata: {
      source: 'Langfuse atomic action: get_trace_scores',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'get_trace_scores failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}
