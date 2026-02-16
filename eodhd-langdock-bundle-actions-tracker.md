# EODHD Langdock Bundle Actions Tracker

Last updated: 2026-02-16  
Purpose: tracking device for summary/detail bundle rollout, testing, and editorial analysis coverage.

## Status legend

- `PLANNED` = defined but not started
- `BUILDING` = action code in progress
- `TESTING` = action exists, validation running
- `LIVE` = approved for assistant usage
- `RETIRED` = intentionally removed from active usage

## Action Matrix

### Summary Actions

| ID | Action | File | Role | Connected Analyses | Status |
|---|---|---|---|---|---|
| BA-01A | `daily_market_overview` | `plugins/langdock-dev/actions/eodhd/bundles/daily-market-overview.js` | Market-wide overview without explicit symbols | A1, A2, A7 | TESTING |
| BA-01B | `daily_market_pulse_universe` | `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse-universe.js` | Fixed-universe daily pulse | A1, A2, A4, A8 | TESTING |
| BA-02 | `earnings_reaction_brief` | `plugins/langdock-dev/actions/eodhd/bundles/earnings-reaction-brief.js` | Earnings reaction summary | A5, A6, A9, B17 | TESTING |
| BA-03 | `single_stock_deep_dive` | `plugins/langdock-dev/actions/eodhd/bundles/single-stock-deep-dive.js` | Concise stock thesis dossier | B10, B12, B13, B14, B15, B16, B17 | TESTING |
| BA-04 | `sector_rotation_monitor` | `plugins/langdock-dev/actions/eodhd/bundles/sector-rotation-monitor.js` | Sector leadership summary | A3, A7, A8 | TESTING |
| BA-05 | `screen_to_story` | `plugins/langdock-dev/actions/eodhd/bundles/screen-to-story.js` | Shortlist generation summary | B11, B15, B18 | TESTING |
| BA-06 | `event_risk_next_session` | `plugins/langdock-dev/actions/eodhd/bundles/event-risk-next-session.js` | Next-session event risk summary | A9, B17 | TESTING |
| BA-07 | `valuation_vs_momentum_conflicts` | `plugins/langdock-dev/actions/eodhd/bundles/valuation-vs-momentum-conflicts.js` | Setup bucket summary | B11, B16 | TESTING |

### Details Actions

| ID | Action | File | Role | Paired Summary | Status |
|---|---|---|---|---|---|
| BA-01A-D | `daily_market_overview_details` | `plugins/langdock-dev/actions/eodhd/bundles/daily-market-overview-details.js` | Full universe-level overview tables | `daily_market_overview` | TESTING |
| BA-01B-D | `daily_market_pulse_universe_details` | `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse-universe-details.js` | Full explicit-universe symbol tables | `daily_market_pulse_universe` | TESTING |
| BA-02-D | `earnings_reaction_brief_details` | `plugins/langdock-dev/actions/eodhd/bundles/earnings-reaction-brief-details.js` | Full reaction table | `earnings_reaction_brief` | TESTING |
| BA-03-D | `single_stock_deep_dive_details` | `plugins/langdock-dev/actions/eodhd/bundles/single-stock-deep-dive-details.js` | Full deep-dive detail tables | `single_stock_deep_dive` | TESTING |
| BA-04-D | `sector_rotation_monitor_details` | `plugins/langdock-dev/actions/eodhd/bundles/sector-rotation-monitor-details.js` | Expanded sector metrics | `sector_rotation_monitor` | TESTING |
| BA-05-D | `screen_to_story_details` | `plugins/langdock-dev/actions/eodhd/bundles/screen-to-story-details.js` | Full ranked candidates and decomposition | `screen_to_story` | TESTING |
| BA-06-D | `event_risk_next_session_details` | `plugins/langdock-dev/actions/eodhd/bundles/event-risk-next-session-details.js` | Full ranked risk table | `event_risk_next_session` | TESTING |
| BA-07-D | `valuation_vs_momentum_conflicts_details` | `plugins/langdock-dev/actions/eodhd/bundles/valuation-vs-momentum-conflicts-details.js` | Full ranked setup table | `valuation_vs_momentum_conflicts` | TESTING |

### Retired

| ID | Action | File | Reason | Status |
|---|---|---|---|---|
| BA-01 | `daily_market_pulse` | `plugins/langdock-dev/actions/eodhd/bundles/daily-market-pulse.js` | Replaced by explicit split: overview + universe | RETIRED |

## Output/Contract Progress

- [x] All active summary actions expose `outputMode` (`compact` default)
- [x] All details actions expose `outputMode` (`full` default)
- [x] Metadata cross-linking (`actionType`, `pairedAction`) added
- [x] Truncation diagnostics (`truncated`, `truncationNotes`) added
- [x] Heavy duplicated datasets removed from summary actions
- [x] Companion details actions created for heavy data access

## Validation Checklist

### Static/Contract

- [x] Parse/execute smoke for all summary + details bundle files
- [x] Validate each active action accepts `outputMode`
- [x] Validate required top-level sections exist

### Size/Duplication

- [x] Compact payload representative checks (`<= 35KB` target)
- [x] Full summary payload representative checks (`<= 120KB` target)
- [x] Duplication scan across table payloads

### Functional

- [x] Mock happy-path per summary action
- [x] Mock happy-path per details action
- [ ] Mock partial-failure behavior per action

### Live EODHD

- [ ] Representative live smoke: each summary action (`compact` + `full`)
- [ ] Representative live smoke: each details action (`full`)
- [ ] Confirm no unintended payload explosions

## Analysis Catalog (unchanged)

| Analysis ID | Analysis Name | Audience |
|---|---|---|
| A1 | Market Pulse Scoreboard | Podcast |
| A2 | Open-to-Close Narrative | Podcast |
| A3 | Sector Rotation Snapshot | Podcast |
| A4 | Breakout/Breakdown Watchlist | Podcast |
| A5 | Earnings Reaction Radar | Podcast |
| A6 | News Impact Attribution | Podcast |
| A7 | Volatility Regime Check | Podcast |
| A8 | Momentum vs Mean-Reversion Board | Podcast |
| A9 | Event Risk for Next Session | Podcast |
| B10 | Fundamental Quality Snapshot | Deep Dive |
| B11 | Valuation Dislocation vs Peers | Deep Dive |
| B12 | Growth Durability Profile | Deep Dive |
| B13 | Profitability Decomposition | Deep Dive |
| B14 | Balance-Sheet Stress Test | Deep Dive |
| B15 | Sentiment vs Fundamentals Divergence | Deep Dive |
| B16 | Technical-Value Confluence Setup | Deep Dive |
| B17 | Event-Driven Dossier | Deep Dive |
| B18 | Screener-to-Thesis Pipeline | Deep Dive |
