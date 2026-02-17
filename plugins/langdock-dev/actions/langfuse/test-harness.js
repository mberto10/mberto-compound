#!/usr/bin/env node
/**
 * Test harness for Langfuse Langdock actions.
 * Mocks ld.request() and data objects, then eval()s each action script.
 *
 * The real Langfuse API returns score IDs (strings) in the /api/public/traces
 * response.  Score objects are fetched separately via /api/public/scores.
 * The mock request handler therefore serves TWO endpoints:
 *   - /api/public/traces  → trace objects (scores are ID strings)
 *   - /api/public/scores  → score objects with traceId (supports ?traceId= filtering)
 */

const fs = require('fs');
const path = require('path');

// ── Utilities ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log('  FAIL: ' + label);
  }
}

function section(name) {
  console.log('\n━━━ ' + name + ' ━━━');
}

// ── Mock helpers ───────────────────────────────────────────────────────

var SCORE_COUNTER = 0;

function makeScoreObjects(traceId, overrideScores) {
  var defaults = [
    { name: 'readability-cohesion', value: 0.85, comment: 'Good flow' },
    { name: 'fact-opinion-differentiation-grader', value: 0.9 },
    { name: 'factual-accuracy-contextual', value: 0.8 },
    { name: 'classification', value: 0.95 },
    { name: 'language_correctness', value: 0.88 },
  ];
  var raw = overrideScores || defaults;
  return raw.map(function (s) {
    return {
      id: 'score-' + (SCORE_COUNTER++),
      traceId: traceId,
      name: s.name,
      value: s.value,
      comment: s.comment || null,
    };
  });
}

function makeMockTrace(overrides) {
  var id = (overrides && overrides.id) || ('trace-' + Math.random().toString(36).slice(2, 8));
  var defaults = {
    id: id,
    timestamp: '2026-02-15T10:00:00.000Z',
    name: 'news-summarization-workflow',
    tags: ['genre:tech'],
    // The traces endpoint returns score IDs, not objects
    scores: ['sid-1', 'sid-2', 'sid-3', 'sid-4', 'sid-5'],
    metadata: {
      performance: {
        genre: 'tech',
        final_grades: {
          factual_accuracy: true,
          relevance: true,
          reading_quality: true,
          output_format: true,
        },
      },
    },
  };
  return Object.assign({}, defaults, overrides);
}

function makeOutlierTrace(id) {
  return makeMockTrace({
    id: id || 'outlier-trace',
    scores: ['sid-o1', 'sid-o2', 'sid-o3', 'sid-o4', 'sid-o5'],
    metadata: {
      performance: {
        genre: 'politics',
        final_grades: {
          factual_accuracy: false,
          relevance: true,
          reading_quality: false,
          output_format: true,
        },
      },
    },
    tags: ['genre:politics'],
  });
}

var OUTLIER_SCORES = [
  { name: 'readability-cohesion', value: 0.2, comment: 'Very poor' },
  { name: 'fact-opinion-differentiation-grader', value: 0.3 },
  { name: 'factual-accuracy-contextual', value: 0.1 },
  { name: 'classification', value: 0.4 },
  { name: 'language_correctness', value: 0.25 },
];

var HIGH_SCORES = [
  { name: 'readability-cohesion', value: 1.8, comment: 'Suspicious' },
  { name: 'classification', value: 0.9 },
];

function makeHighScoreTrace() {
  return makeMockTrace({ id: 'high-score-trace', scores: ['sid-h1', 'sid-h2'] });
}

/**
 * Build a mock router that serves both /traces and /scores.
 *
 * tracePages: array of arrays of trace objects per page
 * scoreMap:   { traceId: [scoreObj, ...] } — all score objects for the window
 * totalTracePages: total pages value for meta
 */
function buildMockRouter(tracePages, scoreMap, totalTracePages) {
  var tp = totalTracePages !== undefined ? totalTracePages : tracePages.length;
  // Flatten all scores into a single array for /scores pagination
  var allScores = [];
  var tids = Object.keys(scoreMap || {});
  for (var k = 0; k < tids.length; k++) {
    var arr = scoreMap[tids[k]];
    for (var j = 0; j < arr.length; j++) allScores.push(arr[j]);
  }

  return function (opts) {
    var url = opts.url;
    if (url.indexOf('/api/public/scores') !== -1) {
      // Check for traceId filter (used by get-trace-scores)
      var traceIdMatch = url.match(/[?&]traceId=([^&]+)/);
      var filteredScores = allScores;
      if (traceIdMatch) {
        var filterTid = decodeURIComponent(traceIdMatch[1]);
        filteredScores = allScores.filter(function (s) { return s.traceId === filterTid; });
      }
      // Parse page from URL
      var pageMatch = url.match(/[?&]page=(\d+)/);
      var pg = pageMatch ? Number(pageMatch[1]) : 1;
      var start = (pg - 1) * 100;
      var slice = filteredScores.slice(start, start + 100);
      return {
        status: 200,
        json: {
          data: slice,
          meta: { page: pg, totalPages: Math.ceil(filteredScores.length / 100) || 1, totalItems: filteredScores.length },
        },
      };
    }
    if (url.indexOf('/api/public/traces') !== -1) {
      var pageMatch2 = url.match(/[?&]page=(\d+)/);
      var pg2 = pageMatch2 ? Number(pageMatch2[1]) : 1;
      var idx = pg2 - 1;
      var data = (idx >= 0 && idx < tracePages.length) ? tracePages[idx] : [];
      return {
        status: 200,
        json: {
          data: data,
          meta: { page: pg2, totalPages: tp, totalItems: data.length * tp },
        },
      };
    }
    return { status: 404, json: { error: 'Unknown endpoint' } };
  };
}

/**
 * Convenience: single page of traces + auto-build scoreMap from trace IDs.
 * customScores: optional { traceId: [...scoreOverrides] }
 */
function simpleMock(traces, customScores, totalPages) {
  var scoreMap = {};
  for (var i = 0; i < traces.length; i++) {
    var tid = traces[i].id;
    if (customScores && customScores[tid]) {
      scoreMap[tid] = makeScoreObjects(tid, customScores[tid]);
    } else {
      scoreMap[tid] = makeScoreObjects(tid);
    }
  }
  return buildMockRouter([traces], scoreMap, totalPages || 1);
}

function errorMock(status) {
  return function () {
    return { status: status, json: { error: 'Mocked error' } };
  };
}

function emptyMock() {
  return buildMockRouter([[]], {}, 1);
}

/**
 * Run a Langdock action script with mocked globals.
 */
async function runAction(scriptPath, dataObj, routerFn) {
  var code = fs.readFileSync(scriptPath, 'utf8');
  var requestLog = [];

  var ld = {
    request: async function (opts) {
      requestLog.push(opts);
      return routerFn(opts);
    },
  };

  var wrapped = '(async function(data, ld) {\n' + code + '\n})';
  var fn = eval(wrapped);
  var result = await fn(dataObj, ld);
  return { result: result, requestLog: requestLog };
}

// ── Test suites ────────────────────────────────────────────────────────

var CORE_PATH = path.join(__dirname, 'core/get-traces.js');
var SCORES_PATH = path.join(__dirname, 'core/get-trace-scores.js');
var SUMMARY_PATH = path.join(__dirname, 'bundles/workflow-dashboard.js');
var DETAILS_PATH = path.join(__dirname, 'bundles/workflow-dashboard-details.js');

async function testCore() {
  section('Core: get-traces.js');

  // 1. Help mode
  {
    var r = await runAction(CORE_PATH, { input: { help: true }, auth: {} }, emptyMock());
    assert(r.result.data && r.result.data.action === 'get_traces', 'help: action name');
    assert(r.result.data.decisionGuide, 'help: decisionGuide');
    assert(r.result.endpointDiagnostics.helpOnly === true, 'help: helpOnly');
    console.log('  help mode: OK');
  }

  // 2. Missing auth
  {
    var r = await runAction(CORE_PATH, { input: {}, auth: {} }, emptyMock());
    assert(r.result.error === true, 'missing auth: error');
    console.log('  missing auth: OK');
  }

  // 3. Invalid windowPreset
  {
    var r = await runAction(CORE_PATH, { input: { windowPreset: 'last_999d' }, auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' } }, emptyMock());
    assert(r.result.error === true, 'invalid windowPreset: error');
    console.log('  invalid windowPreset: OK');
  }

  // 4. Invalid outputMode
  {
    var r = await runAction(CORE_PATH, { input: { outputMode: 'verbose' }, auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' } }, emptyMock());
    assert(r.result.error === true, 'invalid outputMode: error');
    console.log('  invalid outputMode: OK');
  }

  // 5. Empty result set
  {
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, emptyMock());
    assert(!r.result.error, 'empty: no error');
    assert(r.result.data.count === 0, 'empty: count=0');
    // Should have called traces AND scores endpoints
    var tracesCalls = r.requestLog.filter(function (l) { return l.url.indexOf('/traces') !== -1; });
    var scoresCalls = r.requestLog.filter(function (l) { return l.url.indexOf('/scores') !== -1; });
    assert(tracesCalls.length === 1, 'empty: 1 traces call');
    assert(scoresCalls.length === 1, 'empty: 1 scores call');
    var authHeader = r.requestLog[0].headers.Authorization;
    assert(authHeader && authHeader.indexOf('Basic ') === 0, 'empty: Basic auth header');
    console.log('  empty result set: OK');
  }

  // 6. Normal traces — scores joined from /scores endpoint
  {
    var traces = [makeMockTrace({ id: 't1' }), makeMockTrace({ id: 't2', tags: ['genre:politics'] })];
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_7d', outputMode: 'full' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));

    assert(!r.result.error, 'normal: no error');
    assert(r.result.data.count === 2, 'normal: count=2');
    var row0 = r.result.data.rows[0];
    assert(row0.traceId === 't1', 'normal: row traceId');
    assert(row0.genre === 'tech', 'normal: genre from tag');
    assert(row0.scores.length === 5, 'normal: 5 scores joined');
    assert(row0.scores[0].name === 'readability-cohesion', 'normal: score name');
    assert(row0.scores[0].value === 0.85, 'normal: score value');
    assert(row0.scores[0].comment === 'Good flow', 'normal: score comment in full mode');
    assert(row0.meanScore !== null, 'normal: meanScore');
    assert(row0.metadata !== undefined, 'normal: metadata in full');
    console.log('  normal traces (full, scores joined): OK');
  }

  // 7. Compact mode strips metadata and comments
  {
    var traces = [makeMockTrace({ id: 'c1' })];
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_7d', outputMode: 'compact' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    var row = r.result.data.rows[0];
    assert(row.metadata === undefined, 'compact: no metadata');
    assert(row.scores[0].comment === undefined, 'compact: no comment');
    console.log('  compact mode: OK');
  }

  // 8. Pagination — multi-page traces + scores
  {
    var page1Traces = [];
    for (var i = 0; i < 100; i++) page1Traces.push(makeMockTrace({ id: 'p1-' + i }));
    var page2Traces = [makeMockTrace({ id: 'p2-0' })];
    var scoreMap = {};
    for (var j = 0; j < page1Traces.length; j++) scoreMap[page1Traces[j].id] = makeScoreObjects(page1Traces[j].id);
    scoreMap['p2-0'] = makeScoreObjects('p2-0');
    var router = buildMockRouter([page1Traces, page2Traces], scoreMap, 2);

    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_7d', pageLimit: 5 },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(!r.result.error, 'pagination: no error');
    assert(r.result.data.count === 101, 'pagination: 101 traces');
    assert(r.result.data.rows[0].scores.length === 5, 'pagination: scores joined');
    assert(r.result.endpointDiagnostics.parameters.wasTruncated === false, 'pagination: not truncated');
    console.log('  pagination: OK');
  }

  // 9. Pagination truncation
  {
    var page1 = [];
    for (var i = 0; i < 100; i++) page1.push(makeMockTrace({ id: 'tr-' + i }));
    var scoreMap = {};
    for (var j = 0; j < page1.length; j++) scoreMap[page1[j].id] = makeScoreObjects(page1[j].id);
    var router = buildMockRouter([page1], scoreMap, 5);

    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_7d', pageLimit: 1 },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(r.result.endpointDiagnostics.parameters.wasTruncated === true, 'truncation: detected');
    console.log('  pagination truncation: OK');
  }

  // 10. Tag filtering
  {
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_24h', tags: 'genre:tech,genre:politics' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, emptyMock());
    var tracesUrl = r.requestLog.find(function (l) { return l.url.indexOf('/traces') !== -1; }).url;
    assert(tracesUrl.indexOf('tags=') !== -1, 'tags: param in URL');
    assert(tracesUrl.indexOf(encodeURIComponent('genre:tech')) !== -1, 'tags: genre:tech encoded');
    console.log('  tag filtering: OK');
  }

  // 11. API error
  {
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, errorMock(401));
    assert(r.result.error === true, 'API error: error flag');
    assert(r.result.status === 401, 'API error: status 401');
    console.log('  API error handling: OK');
  }

  // 12. Base64 encoding correctness
  {
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'testpublic', langfuseSecretKey: 'testsecret' },
    }, emptyMock());
    var authH = r.requestLog[0].headers.Authorization;
    var expected = 'Basic ' + Buffer.from('testpublic:testsecret').toString('base64');
    assert(authH === expected, 'base64: matches Buffer.from');
    console.log('  base64 encoding: OK');
  }

  // 13. Custom from/to
  {
    var r = await runAction(CORE_PATH, {
      input: { windowPreset: 'last_24h', from: '2026-01-01', to: '2026-01-15' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, emptyMock());
    var tracesUrl = r.requestLog.find(function (l) { return l.url.indexOf('/traces') !== -1; }).url;
    assert(tracesUrl.indexOf('2026-01-01') !== -1, 'custom dates: from in URL');
    assert(tracesUrl.indexOf('2026-01-15') !== -1, 'custom dates: to in URL');
    console.log('  custom from/to: OK');
  }
}

async function testDashboardSummary() {
  section('Bundle: workflow-dashboard.js (summary)');

  // 1. Missing auth
  {
    var r = await runAction(SUMMARY_PATH, { input: {}, auth: {} }, emptyMock());
    assert(r.result.error === true, 'auth: error');
    console.log('  missing auth: OK');
  }

  // 2. Zero traces
  {
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, emptyMock());
    assert(!r.result.error, 'zero: no error');
    assert(r.result.headline_summary.totalTraces === 0, 'zero: totalTraces=0');
    assert(r.result.tables.genreSplit.length === 0, 'zero: empty genreSplit');
    assert(r.result.key_takeaways[0].indexOf('No traces') !== -1, 'zero: takeaway');
    console.log('  zero traces: OK');
  }

  // 3. Normal dashboard with mixed genres + outlier
  {
    var traces = [
      makeMockTrace({ id: 't1', tags: ['genre:tech'] }),
      makeMockTrace({ id: 't2', tags: ['genre:tech'] }),
      makeMockTrace({ id: 't3', tags: ['genre:politics'] }),
      makeOutlierTrace('t4'),
    ];
    var customScores = {};
    customScores['t4'] = OUTLIER_SCORES;
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));

    var res = r.result;
    assert(!res.error, 'dashboard: no error');
    assert(res.headline_summary.totalTraces === 4, 'dashboard: totalTraces=4');
    assert(res.headline_summary.meanCompositeScore !== null, 'dashboard: meanCompositeScore');
    assert(res.headline_summary.successRate !== null, 'dashboard: successRate');

    // Genre split
    var gs = res.tables.genreSplit;
    assert(gs.length >= 2, 'dashboard: 2+ genres');
    var techRow = gs.find(function (r) { return r.genre === 'tech'; });
    assert(techRow && techRow.count === 2, 'dashboard: tech count=2');

    // Score stats
    assert(res.tables.scoreStats.length === 5, 'dashboard: 5 score stats');
    var rc = res.tables.scoreStats.find(function (s) { return s.scoreName === 'readability-cohesion'; });
    assert(rc && rc.count === 4, 'dashboard: readability count=4');
    assert(rc.mean !== null && rc.p25 !== null && rc.p75 !== null, 'dashboard: stats populated');

    // No internalGradeStats
    assert(res.tables.internalGradeStats === undefined, 'dashboard: no internalGradeStats');

    // Outliers
    assert(res.tables.negativeOutliers.length >= 1, 'dashboard: has outliers');
    var outlier = res.tables.negativeOutliers[0];
    assert(outlier.traceId === 't4', 'dashboard: outlier is t4');
    assert(outlier.meanScore < 0.7, 'dashboard: outlier below threshold');
    assert(outlier.lowestScore && outlier.lowestScore.name, 'dashboard: outlier lowestScore');
    assert(outlier.failedGrades === undefined, 'dashboard: no failedGrades');

    // Takeaways & metadata
    assert(res.key_takeaways.length >= 3, 'dashboard: 3+ takeaways');
    assert(res.metadata.pairedAction === 'workflow_dashboard_details', 'dashboard: pairedAction');

    // Verify /scores endpoint was called
    var scoresCalls = r.requestLog.filter(function (l) { return l.url.indexOf('/scores') !== -1; });
    assert(scoresCalls.length >= 1, 'dashboard: /scores endpoint called');

    console.log('  normal dashboard: OK');
  }

  // 4. Scale guard risk flag
  {
    var traces = [makeHighScoreTrace()];
    var customScores = {};
    customScores['high-score-trace'] = HIGH_SCORES;
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));
    assert(r.result.risk_flags.some(function (f) { return f.indexOf('1.5') !== -1; }), 'scale: risk flag');
    console.log('  scale guard: OK');
  }

  // 5. Truncation risk flag
  {
    var page1 = [];
    for (var i = 0; i < 100; i++) page1.push(makeMockTrace({ id: 'pg-' + i }));
    var scoreMap = {};
    for (var j = 0; j < page1.length; j++) scoreMap[page1[j].id] = makeScoreObjects(page1[j].id);
    var router = buildMockRouter([page1], scoreMap, 5);
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_7d', pageLimit: 1 },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(r.result.risk_flags.some(function (f) { return f.indexOf('truncated') !== -1; }), 'truncation: flag');
    console.log('  truncation flag: OK');
  }

  // 6. Single trace
  {
    var traces = [makeMockTrace({ id: 'single' })];
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    assert(r.result.headline_summary.totalTraces === 1, 'single: totalTraces=1');
    assert(r.result.tables.negativeOutliers.length === 0, 'single: no outliers');
    console.log('  single trace: OK');
  }

  // 7. Outlier cap
  {
    var traces = [];
    var customScores = {};
    for (var j = 0; j < 20; j++) {
      traces.push(makeOutlierTrace('out-' + j));
      customScores['out-' + j] = OUTLIER_SCORES;
    }
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_7d', outlierCount: 5 },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));
    assert(r.result.tables.negativeOutliers.length === 5, 'cap: outlierCount=5');
    console.log('  outlier cap: OK');
  }

  // 8. API error
  {
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, errorMock(403));
    assert(r.result.error === true, 'API error: flag');
    console.log('  API error: OK');
  }

  // 9. Genre fallback to metadata
  {
    var traces = [makeMockTrace({ id: 'meta-genre', tags: [] })];
    var r = await runAction(SUMMARY_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    var gs = r.result.tables.genreSplit;
    assert(gs.length === 1 && gs[0].genre === 'tech', 'fallback: genre from metadata');
    console.log('  genre fallback: OK');
  }
}

async function testDashboardDetails() {
  section('Bundle: workflow-dashboard-details.js');

  // 1. Default outputMode is full
  {
    var traces = [makeMockTrace({ id: 'd1' }), makeOutlierTrace('d2')];
    var customScores = {};
    customScores['d2'] = OUTLIER_SCORES;
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));
    assert(!r.result.error, 'details: no error');
    assert(r.result.endpointDiagnostics.outputMode === 'full', 'details: default full');
    console.log('  default outputMode=full: OK');
  }

  // 2. Histograms
  {
    var traces = [];
    for (var i = 0; i < 15; i++) traces.push(makeMockTrace({ id: 'hist-' + i }));
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    var rc = r.result.tables.scoreStats.find(function (s) { return s.scoreName === 'readability-cohesion'; });
    assert(rc.histogram && rc.histogram.length > 0, 'histogram: present');
    assert(rc.histogram[0].rangeMin !== undefined, 'histogram: rangeMin');
    var histSum = rc.histogram.reduce(function (s, b) { return s + b.count; }, 0);
    assert(histSum === rc.count, 'histogram: sum=' + histSum + ' total=' + rc.count);
    console.log('  histograms: OK');
  }

  // 3. byGenre breakdown
  {
    var traces = [
      makeMockTrace({ id: 'bg1', tags: ['genre:tech'] }),
      makeMockTrace({ id: 'bg2', tags: ['genre:politics'] }),
    ];
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    var rc = r.result.tables.scoreStats.find(function (s) { return s.scoreName === 'readability-cohesion'; });
    assert(rc.byGenre && Object.keys(rc.byGenre).length === 2, 'byGenre: 2 entries');
    assert(rc.byGenre.tech && rc.byGenre.tech.count === 1, 'byGenre: tech');
    assert(rc.byGenre.politics && rc.byGenre.politics.count === 1, 'byGenre: politics');
    console.log('  byGenre: OK');
  }

  // 4. traceRoster in full mode
  {
    var traces = [makeMockTrace({ id: 'roster-1' }), makeMockTrace({ id: 'roster-2' })];
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d', outputMode: 'full' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    assert(Array.isArray(r.result.traceRoster), 'roster: is array');
    assert(r.result.traceRoster.length === 2, 'roster: 2 entries');
    assert(r.result.traceRoster[0].traceId === 'roster-1', 'roster: traceId');
    assert(r.result.traceRoster[0].meanScore !== null, 'roster: meanScore');
    assert(Array.isArray(r.result.traceRoster[0].scores), 'roster: scores array');
    assert(r.result.traceRoster[0].scores.length === 5, 'roster: 5 scores');
    console.log('  traceRoster (full): OK');
  }

  // 5. traceRoster absent in compact
  {
    var traces = [makeMockTrace({ id: 'c1' })];
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d', outputMode: 'compact' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    assert(r.result.traceRoster === undefined, 'compact: no roster');
    console.log('  traceRoster absent in compact: OK');
  }

  // 6. Outliers include full scores with comments
  {
    var traces = [makeOutlierTrace('det-outlier')];
    var customScores = {};
    customScores['det-outlier'] = OUTLIER_SCORES;
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));
    assert(r.result.tables.negativeOutliers.length === 1, 'outlier: count');
    var outlier = r.result.tables.negativeOutliers[0];
    assert(Array.isArray(outlier.scores), 'outlier: scores array');
    assert(outlier.scores.length === 5, 'outlier: 5 scores');
    assert(outlier.scores[0].comment !== undefined, 'outlier: comment field');
    console.log('  outlier full scores: OK');
  }

  // 7. Default outlierCount=50
  {
    var traces = [];
    var customScores = {};
    for (var j = 0; j < 60; j++) {
      traces.push(makeOutlierTrace('mass-' + j));
      customScores['mass-' + j] = OUTLIER_SCORES;
    }
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces, customScores));
    assert(r.result.tables.negativeOutliers.length === 50, 'outlierCount: capped at 50');
    console.log('  default outlierCount=50: OK');
  }

  // 8. Zero traces
  {
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_24h' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, emptyMock());
    assert(r.result.headline_summary.totalTraces === 0, 'zero: totalTraces=0');
    assert(Array.isArray(r.result.traceRoster) && r.result.traceRoster.length === 0, 'zero: empty roster');
    console.log('  zero traces: OK');
  }

  // 9. Metadata
  {
    var traces = [makeMockTrace({ id: 'meta-1' })];
    var r = await runAction(DETAILS_PATH, {
      input: { windowPreset: 'last_7d' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, simpleMock(traces));
    assert(r.result.metadata.pairedAction === 'workflow_dashboard', 'meta: pairedAction');
    assert(r.result.metadata.actionType === 'details', 'meta: actionType');
    console.log('  metadata: OK');
  }
}

async function testTraceScores() {
  section('Core: get-trace-scores.js');

  // 1. Help mode
  {
    var r = await runAction(SCORES_PATH, { input: { help: true }, auth: {} }, emptyMock());
    assert(r.result.data && r.result.data.action === 'get_trace_scores', 'help: action name');
    assert(r.result.data.decisionGuide, 'help: decisionGuide');
    assert(r.result.endpointDiagnostics.helpOnly === true, 'help: helpOnly');
    console.log('  help mode: OK');
  }

  // 2. Missing auth
  {
    var r = await runAction(SCORES_PATH, { input: { traceIds: 'abc' }, auth: {} }, emptyMock());
    assert(r.result.error === true, 'missing auth: error');
    console.log('  missing auth: OK');
  }

  // 3. Empty traceIds
  {
    var r = await runAction(SCORES_PATH, { input: { traceIds: '' }, auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' } }, emptyMock());
    assert(r.result.error === true, 'empty traceIds: error');
    console.log('  empty traceIds: OK');
  }

  // 4. Single trace — full mode (default)
  {
    var traces = [makeMockTrace({ id: 'st1' })];
    var router = simpleMock(traces);
    var r = await runAction(SCORES_PATH, {
      input: { traceIds: 'st1' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(!r.result.error, 'single: no error');
    assert(r.result.data.count === 1, 'single: count=1');
    var t = r.result.data.traces[0];
    assert(t.traceId === 'st1', 'single: traceId');
    assert(t.scores.length === 5, 'single: 5 scores');
    assert(t.scores[0].comment !== undefined, 'single: comment present in full mode');
    assert(t.meanScore !== null, 'single: meanScore');
    assert(t.lowestScore && t.lowestScore.name, 'single: lowestScore');
    console.log('  single trace (full): OK');
  }

  // 5. Multi trace
  {
    var traces = [makeMockTrace({ id: 'mt1' }), makeOutlierTrace('mt2')];
    var customScores = {};
    customScores['mt2'] = OUTLIER_SCORES;
    var router = simpleMock(traces, customScores);
    var r = await runAction(SCORES_PATH, {
      input: { traceIds: 'mt1,mt2' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(!r.result.error, 'multi: no error');
    assert(r.result.data.count === 2, 'multi: count=2');
    assert(r.result.data.traces[0].traceId === 'mt1', 'multi: first trace');
    assert(r.result.data.traces[1].traceId === 'mt2', 'multi: second trace');
    assert(r.result.data.traces[1].scores[0].comment === 'Very poor', 'multi: outlier comment');
    console.log('  multi trace: OK');
  }

  // 6. scoreName filter
  {
    var traces = [makeMockTrace({ id: 'sf1' })];
    var router = simpleMock(traces);
    var r = await runAction(SCORES_PATH, {
      input: { traceIds: 'sf1', scoreName: 'readability-cohesion' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(!r.result.error, 'filter: no error');
    var t = r.result.data.traces[0];
    assert(t.scores.length === 1, 'filter: 1 score');
    assert(t.scores[0].name === 'readability-cohesion', 'filter: correct name');
    assert(r.result.endpointDiagnostics.scoreNameFilter === 'readability-cohesion', 'filter: in diagnostics');
    console.log('  scoreName filter: OK');
  }

  // 7. Compact mode strips comments
  {
    var traces = [makeMockTrace({ id: 'cm1' })];
    var router = simpleMock(traces);
    var r = await runAction(SCORES_PATH, {
      input: { traceIds: 'cm1', outputMode: 'compact' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, router);
    assert(!r.result.error, 'compact: no error');
    var t = r.result.data.traces[0];
    assert(t.scores[0].comment === undefined, 'compact: no comment');
    assert(t.scores[0].name !== undefined, 'compact: name present');
    assert(t.scores[0].value !== undefined, 'compact: value present');
    console.log('  compact mode: OK');
  }

  // 8. API error
  {
    var r = await runAction(SCORES_PATH, {
      input: { traceIds: 'err1' },
      auth: { langfusePublicKey: 'pk', langfuseSecretKey: 'sk' },
    }, errorMock(500));
    assert(r.result.error === true, 'API error: flag');
    assert(r.result.status === 500, 'API error: status');
    console.log('  API error: OK');
  }
}

// ── Run ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Langfuse Langdock Actions — Test Harness (v3: trace-scores + grade removal)\n');

  await testCore();
  await testTraceScores();
  await testDashboardSummary();
  await testDashboardDetails();

  console.log('\n════════════════════════════════════════');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (var i = 0; i < failures.length; i++) {
      console.log('  - ' + failures[i]);
    }
  }
  console.log('════════════════════════════════════════');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function (err) {
  console.error('Harness crashed:', err);
  process.exit(2);
});
