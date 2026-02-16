# EODHD Actions (Unified Folder)

All EODHD Langdock actions are consolidated here.

## Structure

```text
actions/eodhd/
├── core/      # Atomic single-endpoint actions
└── bundles/   # Composite multi-endpoint editorial actions
```

## Coverage Overview

### Core Atomic Actions (`./core/`)

Atomic wrappers are reusable building blocks for assistants and bundles.

| Action | File | Endpoint Scope |
|---|---|---|
| `get_fundamentals` | `core/get-fundamentals.js` | `/api/fundamentals/{symbol}` |
| `run_screener` | `core/run-screener.js` | `/api/screener` |
| `get_technical_indicator` | `core/get-technical-indicator.js` | `/api/technical/{symbol}` |
| `get_calendar_events` | `core/get-calendar-events.js` | `/api/calendar/{type}` |
| `get_news_sentiment` | `core/get-news-sentiment.js` | `/api/news` |
| `get_real_time_quote` | `core/get-real-time-quote.js` | `/api/real-time/{symbol}` |

Input vocabulary reference (allowed/common values) is documented in:

- `core/README.md` under `Input Vocabularies`
- Every core action supports `help=true` for a no-API-call usage guide.

Already available in your Langdock workspace:

- `search_instruments`
- `get_eod_prices`
- `get_intraday_prices`

### Bundle Composite Actions (`./bundles/`)

Editorial-grade actions combining multiple EODHD endpoints.

Summary actions:

| Action | File | Purpose |
|---|---|---|
| `daily_market_overview` | `bundles/daily-market-overview.js` | Broad market top-gainers/top-losers without explicit symbols |
| `daily_market_pulse_universe` | `bundles/daily-market-pulse-universe.js` | Fixed-universe daily market pulse |
| `earnings_reaction_brief` | `bundles/earnings-reaction-brief.js` | Earnings reaction analysis |
| `single_stock_deep_dive` | `bundles/single-stock-deep-dive.js` | Concise single-stock thesis dossier |
| `event_risk_next_session` | `bundles/event-risk-next-session.js` | Next-session event risk ranking summary |
| `sector_rotation_monitor` | `bundles/sector-rotation-monitor.js` | Sector leadership and rotation summary |
| `screen_to_story` | `bundles/screen-to-story.js` | Screener-to-editorial shortlist summary |
| `valuation_vs_momentum_conflicts` | `bundles/valuation-vs-momentum-conflicts.js` | Valuation vs momentum conflict bucket summary |

Details actions:

| Action | File | Purpose |
|---|---|---|
| `daily_market_overview_details` | `bundles/daily-market-overview-details.js` | Full universe-level market overview detail tables |
| `daily_market_pulse_universe_details` | `bundles/daily-market-pulse-universe-details.js` | Full per-symbol detail rows for explicit universe pulse |
| `earnings_reaction_brief_details` | `bundles/earnings-reaction-brief-details.js` | Full earnings reaction table with detailed enrichment |
| `single_stock_deep_dive_details` | `bundles/single-stock-deep-dive-details.js` | Full detailed deep-dive tables (news/catalysts) |
| `event_risk_next_session_details` | `bundles/event-risk-next-session-details.js` | Full ranked risk table with bounded per-symbol context |
| `sector_rotation_monitor_details` | `bundles/sector-rotation-monitor-details.js` | Expanded sector metric table output |
| `screen_to_story_details` | `bundles/screen-to-story-details.js` | Full ranked candidate universe with score decomposition |
| `valuation_vs_momentum_conflicts_details` | `bundles/valuation-vs-momentum-conflicts-details.js` | Full ranked setup table and complete bucket outputs |

## Shared Conventions

- Auth: accepts `auth.apiKey`, `auth.apiToken`, `auth.api_key`, `auth.api_token`, or `auth.eodhdApiKey` (mapped to EODHD `api_token`).
- No hardcoded default symbols.
- Sequential `await ld.request(...)` calls (Langdock runtime compatible).
- Avoid `URLSearchParams`; use manual query-string encoding.
- Explicit outputs with diagnostics for reliability.
- Core actions are tuned for compact agent-consumable outputs by default; switch to `outputMode: \"full\"` only when needed.
- Bundle summary actions default to `outputMode: \"compact\"`; detail actions default to `outputMode: \"full\"`.
- Legacy `daily_market_pulse` is retired in favor of `daily_market_overview` and `daily_market_pulse_universe`.
