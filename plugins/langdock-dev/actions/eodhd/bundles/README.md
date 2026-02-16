# EODHD Bundle Actions

Editorial-grade Langdock actions that orchestrate multiple EODHD endpoints into fixed, repeatable analyses.

## Actions

| Action | File | Purpose | Status |
|---|---|---|---|
| `daily_market_overview` | `daily-market-overview.js` | Broad market top-gainers/losers overview without requiring explicit symbols | Testing |
| `daily_market_pulse_universe` | `daily-market-pulse-universe.js` | Daily market pulse for a fixed user-provided symbol universe | Testing |
| `daily_market_pulse` | `daily-market-pulse.js` | Legacy mixed-mode action (kept for compatibility) | Testing |
| `earnings_reaction_brief` | `earnings-reaction-brief.js` | Earnings-window winners/losers with reaction classes and catalyst headlines | Testing |
| `single_stock_deep_dive` | `single-stock-deep-dive.js` | Full single-stock dossier: fundamentals, price action, technicals, catalysts, and sentiment | Testing |
| `event_risk_next_session` | `event-risk-next-session.js` | Next-session risk ranking using calendar events, price behavior, and headline intensity | Testing |
| `sector_rotation_monitor` | `sector-rotation-monitor.js` | Sector leadership and rotation monitor using screener-derived sector groups only | Testing |
| `screen_to_story` | `screen-to-story.js` | Screener-to-editorial shortlist with composite scoring and rationale generation | Testing |
| `valuation_vs_momentum_conflicts` | `valuation-vs-momentum-conflicts.js` | Rich/cheap valuation regimes versus momentum state with ranked conflict buckets | Testing |

## Design Rules

- Deterministic output sections (`headline_summary`, `tables`, `key_takeaways`, `risk_flags`)
- Sequential endpoint calls for runtime stability
- Partial-failure tolerance with explicit diagnostics
- No hidden calculations; formulas documented in output

## Authentication

Use `apiKey` in Langdock auth and pass to EODHD as `api_token` query parameter.

## Symbol Policy

- No action uses hardcoded default symbols.
- Any symbol universe must come from user inputs or live endpoint results.
- Preferred split for market pulse use cases:
  - Use `daily_market_overview` when you do not want to provide symbols.
  - Use `daily_market_pulse_universe` when you want a fixed explicit symbol universe.
