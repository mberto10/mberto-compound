# EODHD Langdock Bundle Actions Tracker

Last updated: 2026-02-11 (BA-01A/BA-01B mock validation passed)  
Purpose: tracking device for planning, building, testing, and shipping bundle actions with clear linkage to editorial analyses.

## Status legend

- `PLANNED` = defined but not started
- `SPEC_READY` = inputs/outputs/fallbacks agreed
- `BUILDING` = action code being generated
- `TESTING` = action exists, test cases running
- `LIVE` = approved for assistant usage

## Bundle Actions Backlog (Build Order)

| ID | Bundle Action | Primary Use Case | Connected Analyses | Required Base Actions | Feasibility | Priority | Status |
|---|---|---|---|---|---|---|---|
| BA-01A | `daily_market_overview` | Broad market top-gainers/losers overview without explicit symbols | A1, A2, A7 | `run_screener`, `get_eod_prices` | High | P0 | TESTING |
| BA-01B | `daily_market_pulse_universe` | Daily pulse for a fixed user-provided symbol universe | A1, A2, A4, A8 | `get_eod_prices` | High | P0 | TESTING |
| BA-01 | `daily_market_pulse` (legacy) | Legacy mixed-mode action retained for compatibility | A1, A2, A3, A4, A7, A8 | `run_screener`, `get_eod_prices`, `get_intraday_prices`, `get_technical_indicator`, `search_instruments` | High | P0 | TESTING |
| BA-02 | `earnings_reaction_brief` | Daily podcast earnings move/catalyst segment | A5, A6, A9, B17 | `get_calendar_events`, `get_eod_prices`, `get_intraday_prices`, `get_news_sentiment` | High | P0 | TESTING |
| BA-03 | `single_stock_deep_dive` | Deep fundamental + market narrative dossier | B10, B12, B13, B14, B15, B16, B17 | `get_fundamentals`, `get_eod_prices`, `get_technical_indicator`, `get_news_sentiment`, `get_calendar_events` | High | P0 | TESTING |
| BA-04 | `sector_rotation_monitor` | “Where is leadership moving?” analysis | A3, A7, A8 | `run_screener`, `get_eod_prices`, `get_technical_indicator` | High | P1 | TESTING |
| BA-05 | `screen_to_story` | From factor/theme screen to publishable shortlist | B11, B15, B18 | `run_screener`, `get_fundamentals`, `get_news_sentiment`, `get_technical_indicator` | Medium-High | P1 | TESTING |
| BA-06 | `event_risk_next_session` | Next-session prep module | A9, B17 | `get_calendar_events`, `get_news_sentiment`, `get_eod_prices` | High | P2 | TESTING |
| BA-07 | `valuation_vs_momentum_conflicts` | Find rich+weak / cheap+strong setups | B11, B16 | `get_fundamentals`, `get_eod_prices`, `get_technical_indicator`, `run_screener` | Medium | P2 | TESTING |

## Analysis Catalog and Bundle Mapping

| Analysis ID | Analysis Name | Audience | Primary Bundle | Secondary Bundle(s) | Key Endpoints / Base Actions | Status |
|---|---|---|---|---|---|---|
| A1 | Market Pulse Scoreboard | Podcast | BA-01 | BA-04 | Screener, EOD | PLANNED |
| A2 | Open-to-Close Narrative | Podcast | BA-01 | BA-02 | EOD, Intraday | PLANNED |
| A3 | Sector Rotation Snapshot | Podcast | BA-04 | BA-01 | Screener, EOD | PLANNED |
| A4 | Breakout/Breakdown Watchlist | Podcast | BA-01 | BA-04 | Technical, EOD | PLANNED |
| A5 | Earnings Reaction Radar | Podcast | BA-02 | BA-06 | Calendar, EOD, Intraday, News | PLANNED |
| A6 | News Impact Attribution | Podcast | BA-02 | BA-01 | News, EOD | PLANNED |
| A7 | Volatility Regime Check | Podcast | BA-01 | BA-04 | EOD, Intraday, Technical | PLANNED |
| A8 | Momentum vs Mean-Reversion Board | Podcast | BA-01 | BA-04 | Technical, EOD, Screener | PLANNED |
| A9 | Event Risk for Next Session | Podcast | BA-06 | BA-02 | Calendar, News | PLANNED |
| B10 | Fundamental Quality Snapshot | Deep Dive | BA-03 | - | Fundamentals | PLANNED |
| B11 | Valuation Dislocation vs Peers | Deep Dive | BA-05 | BA-07 | Screener, Fundamentals | PLANNED |
| B12 | Growth Durability Profile | Deep Dive | BA-03 | - | Fundamentals, Calendar | PLANNED |
| B13 | Profitability Decomposition | Deep Dive | BA-03 | - | Fundamentals | PLANNED |
| B14 | Balance-Sheet Stress Test | Deep Dive | BA-03 | - | Fundamentals | PLANNED |
| B15 | Sentiment vs Fundamentals Divergence | Deep Dive | BA-05 | BA-03 | News, Fundamentals, EOD | PLANNED |
| B16 | Technical-Value Confluence Setup | Deep Dive | BA-03 | BA-07 | Fundamentals, Technical, EOD | PLANNED |
| B17 | Event-Driven Dossier | Deep Dive | BA-03 | BA-02, BA-06 | Calendar, EOD, News | PLANNED |
| B18 | Screener-to-Thesis Pipeline | Deep Dive | BA-05 | - | Screener, Fundamentals, Technical, News | PLANNED |

## Build Checklist (Systematic Execution)

### Phase 1 (P0)

- [x] BA-01 `daily_market_pulse` spec finalized
- [x] BA-01 code generated with action builder
- [ ] BA-01 tested on 3 symbols + 2 date windows
- [x] BA-02 `earnings_reaction_brief` spec finalized
- [x] BA-02 code generated with action builder
- [ ] BA-02 tested on latest earnings window
- [x] BA-03 `single_stock_deep_dive` spec finalized
- [x] BA-03 code generated with action builder
- [ ] BA-03 tested on 3 stocks (large cap, mid cap, ADR)

### Phase 2 (P1)

- [ ] BA-04 `sector_rotation_monitor` built and tested
- [ ] BA-05 `screen_to_story` built and tested

### Phase 3 (P2)

- [ ] BA-06 `event_risk_next_session` built and tested
- [ ] BA-07 `valuation_vs_momentum_conflicts` built and tested

## Per-Bundle Implementation Card (Template)

Copy for each BA during build:

### `<bundle_action_name>`

- Status: `PLANNED`
- Owner: `TBD`
- Inputs (required/optional):
  - `...`
- Output schema:
  - `headline_summary`
  - `tables[]`
  - `key_takeaways[]`
  - `risk_flags[]`
- Endpoint sequence:
  1. `...`
  2. `...`
  3. `...`
- Error/fallback behavior:
  - If endpoint X fails: `...`
  - Partial-output rule: `...`
- Test cases:
  1. `...`
  2. `...`
  3. `...`

## Active Implementation Cards

### `daily_market_pulse` (BA-01)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse.js`
- Inputs (required/optional):
  - Required: `auth.apiKey`
  - Optional: `symbols`, `maxSymbols`, `topN`, `lookbackDays`, `includeIntraday`, `intradayInterval`, `includeTechnicals`, `rsiPeriod`, `screenerFilters`, `screenerSignals`, `screenerLimit`
- Output schema:
  - `headline_summary`
  - `market_breadth`
  - `market_volatility`
  - `tables.topGainers`
  - `tables.topLosers`
  - `tables.topMoversAbs`
  - `tables.symbolSnapshots`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Optional screener enrichment (`/api/screener`)
  2. Per symbol EOD fetch (`/api/eod/{symbol}`)
  3. Optional per symbol intraday fetch (`/api/intraday/{symbol}`)
  4. Optional per symbol RSI fetch (`/api/technical/{symbol}`)
- Error/fallback behavior:
  - Screener failure -> continue with explicit symbol universe only.
  - If no explicit symbols and screener resolution fails/returns none -> hard fail (no default symbols allowed).
  - Symbol-level EOD failure -> keep action alive; exclude symbol from rankings; log diagnostics.
  - Intraday/technical failure -> keep symbol snapshot with warnings; do not block final output.
  - If all symbols incomplete -> diagnostic-only response with explicit risk flag.
- Verification run:
  1. Mock success-path execution (complete output sections verified): passed
  2. Mock partial-failure execution (risk flag + non-fatal behavior): passed
  3. Live EODHD validation on 3 symbols + 2 date windows: pending

### `daily_market_overview` (BA-01A)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/daily-market-overview.js`
- Inputs (required/optional):
  - Required: `asOfDate`, `auth.apiKey`
  - Optional: `universeLimit`, `topN`, `lookbackDays`
- Output schema:
  - `headline_summary`
  - `market_breadth`
  - `tables.topGainers`
  - `tables.topLosers`
  - `tables.topMoversAbs`
  - `tables.topVolume`
  - `tables.symbolSnapshots`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Screener pull (`/api/screener`)
  2. Per symbol EOD pulls (`/api/eod/{symbol}`)
- Error/fallback behavior:
  - Screener empty/failure -> hard fail.
  - Symbol-level EOD failure -> partial output using remaining symbols.
  - No default symbols at any point.
- Verification run:
  1. Mock success-path execution: passed
  2. Mock degraded execution: passed
  3. Live validation: pending

### `daily_market_pulse_universe` (BA-01B)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse-universe.js`
- Inputs (required/optional):
  - Required: `symbols`, `asOfDate`, `auth.apiKey`
  - Optional: `topN`, `lookbackDays`
- Output schema:
  - `headline_summary`
  - `market_breadth`
  - `tables.topGainers`
  - `tables.topLosers`
  - `tables.topMoversAbs`
  - `tables.symbolSnapshots`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Per symbol EOD pulls (`/api/eod/{symbol}`)
- Error/fallback behavior:
  - Missing/invalid `symbols` -> hard fail.
  - Symbol-level EOD failure -> partial output using remaining symbols.
  - No default symbols at any point.
- Verification run:
  1. Mock success-path execution: passed
  2. Mock degraded execution: passed
  3. Live validation: pending

### `earnings_reaction_brief` (BA-02)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/earnings-reaction-brief.js`
- Inputs (required/optional):
  - Required: `auth.apiKey`
  - Optional: `from`, `to`, `symbols`, `maxSymbols`, `topN`, `includeIntraday`, `intradayInterval`, `includeNews`, `newsLimit`, `minAbsMovePct`
- Output schema:
  - `headline_summary`
  - `tables.reactionTable`
  - `tables.topPositiveReactions`
  - `tables.topNegativeReactions`
  - `tables.mutedReactions`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Earnings calendar pull (`/api/calendar/earnings`)
  2. Per symbol EOD pull (`/api/eod/{symbol}`)
  3. Optional per symbol intraday pull (`/api/intraday/{symbol}`)
  4. Optional pooled news pull (`/api/news`)
- Error/fallback behavior:
  - No earnings symbols -> structured empty response (not hard fail).
  - Symbol-level EOD failure -> row marked incomplete, output still returned.
  - Intraday/news failures -> warnings + risk flags, no hard fail.
  - Full call-level failure -> `error: true` with details.
- Verification run:
  1. Mock success-path execution (2 symbols, winners/losers table): passed
  2. Mock partial-failure execution (EOD 500 on one symbol): passed
  3. Live earnings-window validation against EODHD: pending

### `single_stock_deep_dive` (BA-03)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/single-stock-deep-dive.js`
- Inputs (required/optional):
  - Required: `symbol`, `auth.apiKey`
  - Optional: `benchmarkSymbol`, `lookbackDays`, `includeNews`, `newsDays`, `includeCalendar`, `calendarBackDays`, `calendarForwardDays`, `includeTechnicals`, `rsiPeriod`, `newsLimit`
- Output schema:
  - `headline_summary`
  - `company_profile`
  - `price_action`
  - `technicals`
  - `valuation_and_fundamentals`
  - `relative_performance`
  - `sentiment_and_news`
  - `catalyst_timeline`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Fundamentals pull (`/api/fundamentals/{symbol}`)
  2. Symbol EOD pull (`/api/eod/{symbol}`)
  3. Optional benchmark EOD pull (`/api/eod/{benchmarkSymbol}`)
  4. Optional RSI pull (`/api/technical/{symbol}`)
  5. Optional news pull (`/api/news`)
  6. Optional sentiment pull (`/api/sentiments`)
  7. Optional calendar pulls (`/api/calendar/earnings|dividends|splits`)
- Error/fallback behavior:
  - EOD core data failure -> hard fail (prevents unreliable dossier).
  - Fundamentals/news/technical/calendar failures -> partial output with explicit risk flags.
  - Benchmark failure -> omit relative performance only.
- Verification run:
  1. Mock success-path execution (complete output sections): passed
  2. Mock degraded execution (multiple endpoint failures): passed
  3. Live validation on 3 stock archetypes (large cap, mid cap, ADR): pending

### `event_risk_next_session` (BA-06)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/event-risk-next-session.js`
- Inputs (required/optional):
  - Required: `auth.apiKey`
  - Optional: `symbols`, `from`, `to`, `daysAhead`, `includeIpos`, `includeTrends`, `includeNews`, `newsLookbackDays`, `newsLimit`, `maxSymbols`
- Output schema:
  - `headline_summary`
  - `event_overview`
  - `tables.rankedRiskTable`
  - `tables.highRisk`
  - `tables.mediumRisk`
  - `tables.lowRisk`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Calendar pulls (`/api/calendar/earnings|dividends|splits` + optional `ipos|trends`)
  2. Per symbol EOD pull (`/api/eod/{symbol}`)
  3. Optional pooled news pull (`/api/news`)
- Error/fallback behavior:
  - Calendar endpoint failures are non-fatal; output includes diagnostics and risk flags.
  - Price endpoint failures are non-fatal per symbol; symbol can still appear with event-only risk.
  - News failure removes headline-intensity weight but preserves event/volatility scoring.
- Verification run:
  1. Mock success-path execution (calendar + eod + news): passed
  2. Mock degraded execution (calendar/eod/news failures): passed
  3. Live next-session window validation: pending

### `sector_rotation_monitor` (BA-04)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/sector-rotation-monitor.js`
- Inputs (required/optional):
  - Required: `auth.apiKey`
  - Optional: `screenerFilters`, `screenerSignals`, `screenerLimit`, `symbolsPerSector`, `lookbackDays`, `topSectors`, `includeTechnicals`, `rsiPeriod`
- Output schema:
  - `headline_summary`
  - `rotation_summary`
  - `tables.sectorMetrics`
  - `tables.topLeaders1d`
  - `tables.bottomLaggers1d`
  - `tables.topLeaders1m`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `calculation_notes`
- Endpoint sequence:
  1. Screener pull (`/api/screener`)
  2. Per-sector member EOD pulls (`/api/eod/{symbol}`)
  3. Optional per-sector RSI proxy (`/api/technical/{symbol}`)
- Error/fallback behavior:
  - Screener failure -> hard fail (no default symbol fallback).
  - Insufficient sector metadata in screener -> hard fail with diagnostics.
  - Member-level EOD failures -> continue with remaining members/sectors.
  - Technical failures -> RSI proxy omitted; sector metrics preserved.
  - If no sector has usable data -> hard fail to avoid misleading output.
- Verification run:
  1. Mock screener-sector mode execution: passed
  2. Mock no-default-symbol enforcement (screener failure/insufficient metadata): passed
  3. Live validation against sector universe: pending

### `screen_to_story` (BA-05)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/screen-to-story.js`
- Inputs (required/optional):
  - Required: `auth.apiKey` and at least one of `screenerFilters`/`screenerSignals`
  - Optional: `screenerSort`, `candidateLimit`, `shortlistSize`, `lookbackDays`, `includeTechnicals`, `rsiPeriod`, `includeNews`, `newsDays`, `newsLimit`
- Output schema:
  - `headline_summary`
  - `tables.shortlist`
  - `tables.fullRankedCandidates`
  - `tables.outsideShortlist`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `scoring_model`
  - `calculation_notes`
- Endpoint sequence:
  1. Screener pull (`/api/screener`)
  2. Per symbol fundamentals pull (`/api/fundamentals/{symbol}`)
  3. Per symbol EOD pull (`/api/eod/{symbol}`)
  4. Optional per symbol RSI pull (`/api/technical/{symbol}`)
  5. Optional pooled news pull (`/api/news`)
- Error/fallback behavior:
  - Screener empty -> hard fail with explicit message.
  - Symbol-level enrichment failures -> partial scoring with diagnostics.
  - News failure -> narrative score degrades gracefully.
- Verification run:
  1. Mock success-path execution (shortlist + ranked table): passed
  2. Mock degraded execution (fundamentals/news/technical failures): passed
  3. Live screen validation: pending

### `valuation_vs_momentum_conflicts` (BA-07)

- Status: `TESTING`
- Owner: `Codex + Max`
- Implementation file:
  - `plugins/langdock-dev/actions/eodhd/bundles/valuation-vs-momentum-conflicts.js`
- Inputs (required/optional):
  - Required: `auth.apiKey` and either `symbols` or screener inputs
  - Optional: `screenerFilters`, `screenerSignals`, `screenerSort`, `candidateLimit`, `lookbackDays`, `includeTechnicals`, `rsiPeriod`, `resultLimit`, valuation thresholds
- Output schema:
  - `headline_summary`
  - `tables.fullRanked`
  - `tables.bullishConvergence`
  - `tables.bearishConvergence`
  - `tables.conflictExpensiveStrong`
  - `tables.conflictCheapWeak`
  - `tables.neutralOrOther`
  - `key_takeaways`
  - `risk_flags`
  - `endpointDiagnostics`
  - `classification_model`
  - `calculation_notes`
- Endpoint sequence:
  1. Optional screener pull (`/api/screener`) when symbols not explicitly provided
  2. Per symbol fundamentals pull (`/api/fundamentals/{symbol}`)
  3. Per symbol EOD pull (`/api/eod/{symbol}`)
  4. Optional per symbol RSI pull (`/api/technical/{symbol}`)
- Error/fallback behavior:
  - Missing candidate universe -> hard fail.
  - Symbol-level endpoint failures -> skip/partial rows with diagnostics.
  - Missing RSI -> momentum classification still works with return+trend.
- Verification run:
  1. Mock success-path execution (all convergence/conflict buckets): passed
  2. Mock degraded execution (fundamentals/technical failures): passed
  3. Live validation against real screens: pending

## Notes / Decisions Log

- Use one integration (`EODHD Research`) with multiple base actions + bundle actions.
- Keep bundle actions deterministic with fixed output sections for editorial workflows.
- Prefer sequential endpoint calls inside bundle actions unless parallelism is explicitly required and proven stable in Langdock runtime.
- BA-01 added at `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse.js`.
- BA-01 uses defensive calculations and explicit `calculation_notes` to make editorial outputs auditable.
- BA-02 added at `plugins/langdock-dev/actions/eodhd/bundles/earnings-reaction-brief.js`.
- BA-02 includes explicit reaction classification thresholding and non-fatal fallback handling for endpoint degradation.
- BA-03 added at `plugins/langdock-dev/actions/eodhd/bundles/single-stock-deep-dive.js`.
- BA-03 treats EOD history as critical path and all enrichment endpoints as non-fatal with auditable risk flags.
- BA-06 added at `plugins/langdock-dev/actions/eodhd/bundles/event-risk-next-session.js`.
- BA-06 risk scoring is explicit and auditable (event weights + volatility + move + headline intensity).
- BA-04 added at `plugins/langdock-dev/actions/eodhd/bundles/sector-rotation-monitor.js`.
- BA-04 includes deterministic screener->sector aggregation with strict no-default-symbol policy.
- BA-05 added at `plugins/langdock-dev/actions/eodhd/bundles/screen-to-story.js`.
- BA-05 provides deterministic composite scoring (quality/momentum/value/narrative) with explicit weights.
- BA-07 added at `plugins/langdock-dev/actions/eodhd/bundles/valuation-vs-momentum-conflicts.js`.
- BA-07 provides explicit bucketization of valuation/momentum setups and auditable classification thresholds.
- No-default-symbol policy enforced:
  - BA-01 removes hardcoded default symbol basket.
  - BA-03 removes default benchmark symbol.
  - BA-04 removes ETF fallback symbol basket and now hard-fails when screener sector coverage is insufficient.
- BA-01 split into two explicit workflows:
  - `daily_market_overview` (no explicit symbols input, screener-derived universe)
  - `daily_market_pulse_universe` (fixed explicit symbols input)
