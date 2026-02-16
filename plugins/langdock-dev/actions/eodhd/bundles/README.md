# EODHD Bundle Actions

Editorial-grade Langdock actions that orchestrate multiple EODHD endpoints into fixed, repeatable analyses.

## Summary Actions

| Action | File | Purpose | Status |
|---|---|---|---|
| `daily_market_overview` | `daily-market-overview.js` | Broad market top-gainers/losers overview without requiring explicit symbols | Testing |
| `daily_market_pulse_universe` | `daily-market-pulse-universe.js` | Daily market pulse for a fixed user-provided symbol universe | Testing |
| `earnings_reaction_brief` | `earnings-reaction-brief.js` | Earnings-window winners/losers with reaction classes and catalyst headlines | Testing |
| `single_stock_deep_dive` | `single-stock-deep-dive.js` | Full single-stock dossier: fundamentals, price action, technicals, catalysts, and sentiment | Testing |
| `event_risk_next_session` | `event-risk-next-session.js` | Next-session risk ranking using calendar events, price behavior, and headline intensity | Testing |
| `sector_rotation_monitor` | `sector-rotation-monitor.js` | Sector leadership and rotation monitor using screener-derived sector groups only | Testing |
| `screen_to_story` | `screen-to-story.js` | Screener-to-editorial shortlist with composite scoring and rationale generation | Testing |
| `valuation_vs_momentum_conflicts` | `valuation-vs-momentum-conflicts.js` | Rich/cheap valuation regimes versus momentum state with ranked conflict buckets | Testing |

## Details Actions

| Action | File | Purpose | Status |
|---|---|---|---|
| `daily_market_overview_details` | `daily-market-overview-details.js` | Full universe-level market overview tables including per-symbol snapshots | Testing |
| `daily_market_pulse_universe_details` | `daily-market-pulse-universe-details.js` | Full per-symbol detail rows for explicit-universe daily pulse | Testing |
| `earnings_reaction_brief_details` | `earnings-reaction-brief-details.js` | Full earnings reaction table with symbol-level enrichment | Testing |
| `single_stock_deep_dive_details` | `single-stock-deep-dive-details.js` | Full detailed dossier tables (news set and catalyst timeline) | Testing |
| `sector_rotation_monitor_details` | `sector-rotation-monitor-details.js` | Expanded sector metric tables for rotation analysis | Testing |
| `screen_to_story_details` | `screen-to-story-details.js` | Full ranked candidate universe and score decomposition | Testing |
| `event_risk_next_session_details` | `event-risk-next-session-details.js` | Detailed ranked event-risk table with bounded per-symbol context | Testing |
| `valuation_vs_momentum_conflicts_details` | `valuation-vs-momentum-conflicts-details.js` | Full ranked setup table and complete bucket breakdowns | Testing |

## Design Rules

- Deterministic output sections (`headline_summary`, `tables`, `key_takeaways`, `risk_flags`, `endpointDiagnostics`, `metadata`)
- Sequential endpoint calls for runtime stability
- Partial-failure tolerance with explicit diagnostics
- No hidden calculations; formulas documented in output
- All bundles support `outputMode`:
  - summary actions default to `compact`
  - details actions default to `full`

## Authentication

Use any of `apiKey`, `apiToken`, `api_key`, `api_token`, or `eodhdApiKey` in Langdock auth and pass to EODHD as `api_token`.

## Symbol Policy

- No action uses hardcoded default symbols.
- Any symbol universe must come from user inputs or live endpoint results.
- Preferred split for market pulse use cases:
  - Use `daily_market_overview` when you do not want to provide symbols.
  - Use `daily_market_pulse_universe` when you want a fixed explicit symbol universe.
- `daily_market_pulse` is retired and replaced by the overview/universe split.
