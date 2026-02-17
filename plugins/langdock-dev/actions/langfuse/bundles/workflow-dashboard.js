// name = Workflow Dashboard
// description = Produces a compact health dashboard for the news-summarization-workflow: score stats, genre split, and outliers.
//
// windowPreset = Date shortcut: last_24h|last_7d|last_30d (default: last_7d)
// from = Optional start date YYYY-MM-DD or ISO (overrides windowPreset)
// to = Optional end date YYYY-MM-DD or ISO (overrides windowPreset)
// pageLimit = Max API pages to fetch, 100 traces each (default: 10, min: 1, max: 100)
// outlierCount = Max outliers to return (default: 10, min: 0, max: 100)
// outlierScoreThreshold = Traces with mean score below this are outliers (default: 0.7)
// outputMode = compact|full (default: compact)

// --- Helpers ---

function clampNumber(value, fallback, minValue, maxValue) {
  var n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, minValue), maxValue);
}

function round(value, decimals) {
  if (!Number.isFinite(value)) return null;
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  var idx = (p / 100) * (sorted.length - 1);
  var lo = Math.floor(idx);
  var hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
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

// --- Known evaluators ---
var KNOWN_SCORES = [
  'readability-cohesion',
  'fact-opinion-differentiation-grader',
  'factual-accuracy-contextual',
  'classification',
  'language_correctness',
];

var WINDOW_PRESETS = ['last_24h', 'last_7d', 'last_30d'];
var LANGFUSE_HOST = 'https://cloud.langfuse.com';

// --- Parse inputs ---
var auth = (data && data.auth) ? data.auth : {};
var publicKey = (
  auth.langfusePublicKey || auth.langfuse_public_key || auth.publicKey || auth.public_key || ''
).toString().trim();
var secretKey = (
  auth.langfuseSecretKey || auth.langfuse_secret_key || auth.secretKey || auth.secret_key || ''
).toString().trim();

if (!publicKey || !secretKey) {
  return { error: true, message: 'Missing Langfuse credentials. Set auth.langfusePublicKey and auth.langfuseSecretKey.' };
}

var authHeader = 'Basic ' + base64Encode(publicKey + ':' + secretKey);
var headers = { Accept: 'application/json', Authorization: authHeader };

var windowPreset = (data.input.windowPreset || 'last_7d').toString().trim().toLowerCase();
var fromInput = (data.input.from || '').toString().trim();
var toInput = (data.input.to || '').toString().trim();
var pageLimit = clampNumber(data.input.pageLimit, 10, 1, 100);
var outlierCount = clampNumber(data.input.outlierCount, 10, 0, 100);
var outlierScoreThreshold = clampNumber(data.input.outlierScoreThreshold, 0.7, 0, 2);
var outputMode = (data.input.outputMode || 'compact').toString().trim().toLowerCase();

if (outputMode !== 'compact' && outputMode !== 'full') {
  return { error: true, message: 'outputMode must be compact or full.' };
}

var fromDate = fromInput;
var toDate = toInput;

if (!fromInput && !toInput) {
  if (WINDOW_PRESETS.indexOf(windowPreset) === -1) {
    return { error: true, message: 'Unknown windowPreset.', details: { windowPreset: windowPreset, allowed: WINDOW_PRESETS } };
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

// --- Fetch all traces with pagination ---
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

  var riskFlags = [];

  // --- Zero-trace early return ---
  if (allTraces.length === 0) {
    return {
      headline_summary: {
        window: { from: fromDate || null, to: toDate || null },
        totalTraces: 0,
        successRate: null,
        meanCompositeScore: null,
        outlierCount: 0,
      },
      tables: {
        genreSplit: [],
        scoreStats: [],
        negativeOutliers: [],
      },
      key_takeaways: ['No traces found in the selected window.'],
      risk_flags: wasTruncated ? ['Window was truncated by pageLimit.'] : [],
      endpointDiagnostics: {
        endpoint: '/api/public/traces + /api/public/scores',
        pagesFetched: page,
        totalPages: totalPages,
        wasTruncated: wasTruncated,
        outputMode: outputMode,
      },
      metadata: {
        source: 'Langfuse bundle action: workflow_dashboard',
        actionType: 'summary',
        pairedAction: 'workflow_dashboard_details',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  if (wasTruncated) {
    riskFlags.push('Window truncated at pageLimit=' + pageLimit + '. Not all traces were fetched (totalPages=' + totalPages + ').');
  }

  // --- Extract scores, genres, grades ---
  var genreCounts = {};
  var genreScoreSums = {};
  var genreScoreCounts = {};

  // Score accumulators keyed by score name
  var scoreAccum = {};
  for (var si = 0; si < KNOWN_SCORES.length; si++) {
    scoreAccum[KNOWN_SCORES[si]] = { values: [], count: 0 };
  }

  var allMeanScores = [];
  var hasScoreAbove1_5 = false;

  for (var ti = 0; ti < allTraces.length; ti++) {
    var trace = allTraces[ti];
    var genre = extractGenre(trace);
    var genreKey = genre || '_unknown';

    genreCounts[genreKey] = (genreCounts[genreKey] || 0) + 1;

    // Get joined scores for this trace
    var scores = scoresByTrace[trace.id] || [];
    var traceScoreSum = 0;
    var traceScoreCount = 0;

    for (var sci = 0; sci < scores.length; sci++) {
      var s = scores[sci];
      var v = Number(s.value);
      if (!Number.isFinite(v)) continue;

      if (v > 1.5) hasScoreAbove1_5 = true;

      var sName = s.name || '';
      if (scoreAccum[sName]) {
        scoreAccum[sName].values.push(v);
        scoreAccum[sName].count++;
      }

      traceScoreSum += v;
      traceScoreCount++;
    }

    var traceMean = traceScoreCount > 0 ? traceScoreSum / traceScoreCount : null;
    if (traceMean !== null) {
      allMeanScores.push({ idx: ti, mean: traceMean });
      genreScoreSums[genreKey] = (genreScoreSums[genreKey] || 0) + traceMean;
      genreScoreCounts[genreKey] = (genreScoreCounts[genreKey] || 0) + 1;
    }

  }

  if (hasScoreAbove1_5) {
    riskFlags.push('Score values > 1.5 detected — verify scoring scale is [0, 1].');
  }

  // --- Build genre split table ---
  var genreKeys = Object.keys(genreCounts);
  genreKeys.sort(function (a, b) { return genreCounts[b] - genreCounts[a]; });
  var genreSplit = genreKeys.map(function (gk) {
    var cnt = genreCounts[gk];
    var meanScore = genreScoreCounts[gk] ? round(genreScoreSums[gk] / genreScoreCounts[gk], 4) : null;
    return {
      genre: gk === '_unknown' ? null : gk,
      count: cnt,
      pct: round((cnt / allTraces.length) * 100, 1),
      meanScore: meanScore,
    };
  });

  // --- Build score stats table ---
  var scoreStats = [];
  for (var ski = 0; ski < KNOWN_SCORES.length; ski++) {
    var scoreName = KNOWN_SCORES[ski];
    var acc = scoreAccum[scoreName];
    if (acc.count === 0) {
      scoreStats.push({ scoreName: scoreName, count: 0, mean: null, min: null, max: null, p25: null, p75: null });
      continue;
    }
    var vals = acc.values.slice().sort(function (a, b) { return a - b; });
    scoreStats.push({
      scoreName: scoreName,
      count: acc.count,
      mean: round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length, 4),
      min: round(vals[0], 4),
      max: round(vals[vals.length - 1], 4),
      p25: round(percentile(vals, 25), 4),
      p75: round(percentile(vals, 75), 4),
    });
  }

  // --- Outlier detection ---
  var outlierCandidates = allMeanScores.filter(function (item) {
    return item.mean < outlierScoreThreshold;
  });
  outlierCandidates.sort(function (a, b) { return a.mean - b.mean; });
  var outlierSlice = outlierCandidates.slice(0, outlierCount);

  var negativeOutliers = outlierSlice.map(function (item) {
    var trace = allTraces[item.idx];
    var scores = scoresByTrace[trace.id] || [];
    var lowest = null;
    for (var oi = 0; oi < scores.length; oi++) {
      var sv = Number(scores[oi].value);
      if (Number.isFinite(sv) && (lowest === null || sv < lowest.value)) {
        lowest = { name: scores[oi].name || null, value: sv };
      }
    }
    return {
      traceId: trace.id || null,
      timestamp: trace.timestamp || null,
      genre: extractGenre(trace),
      meanScore: round(item.mean, 4),
      lowestScore: lowest,
    };
  });

  // --- Headline summary ---
  var overallMean = allMeanScores.length > 0
    ? round(allMeanScores.reduce(function (s, item) { return s + item.mean; }, 0) / allMeanScores.length, 4)
    : null;

  var successCount = 0;
  for (var suc = 0; suc < allMeanScores.length; suc++) {
    if (allMeanScores[suc].mean >= outlierScoreThreshold) successCount++;
  }
  var successRate = allMeanScores.length > 0 ? round((successCount / allMeanScores.length) * 100, 1) : null;

  // --- Key takeaways ---
  var keyTakeaways = [];
  keyTakeaways.push(allTraces.length + ' traces analyzed over ' + (fromDate || '?') + ' to ' + (toDate || '?') + '.');
  if (overallMean !== null) {
    keyTakeaways.push('Mean composite score: ' + overallMean + ' (threshold: ' + outlierScoreThreshold + ').');
  }
  if (successRate !== null) {
    keyTakeaways.push('Success rate (above threshold): ' + successRate + '%.');
  }
  if (negativeOutliers.length > 0) {
    keyTakeaways.push(negativeOutliers.length + ' outlier trace(s) below threshold of ' + outlierScoreThreshold + '.');
  }
  if (genreSplit.length > 1) {
    keyTakeaways.push('Genre distribution: ' + genreSplit.map(function (g) { return (g.genre || 'unknown') + ' (' + g.pct + '%)'; }).join(', ') + '.');
  }

  return {
    headline_summary: {
      window: { from: fromDate || null, to: toDate || null },
      totalTraces: allTraces.length,
      successRate: successRate,
      meanCompositeScore: overallMean,
      outlierCount: negativeOutliers.length,
    },
    tables: {
      genreSplit: genreSplit,
      scoreStats: scoreStats,
      negativeOutliers: negativeOutliers,
    },
    key_takeaways: keyTakeaways,
    risk_flags: riskFlags,
    endpointDiagnostics: {
      endpoint: '/api/public/traces + /api/public/scores',
      pagesFetched: page,
      totalPages: totalPages,
      wasTruncated: wasTruncated,
      outputMode: outputMode,
    },
    metadata: {
      source: 'Langfuse bundle action: workflow_dashboard',
      actionType: 'summary',
      pairedAction: 'workflow_dashboard_details',
      generatedAt: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: 'workflow_dashboard failed',
    details: error.message || String(error),
    status: error.status || null,
  };
}
