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

| Action | File | Purpose |
|---|---|---|
| `daily_market_overview` | `bundles/daily-market-overview.js` | Broad market top-gainers/top-losers without explicit symbols |
| `daily_market_pulse_universe` | `bundles/daily-market-pulse-universe.js` | Fixed-universe daily market pulse |
| `daily_market_pulse` (legacy) | `bundles/daily-market-pulse.js` | Legacy mixed-mode market pulse |
| `earnings_reaction_brief` | `bundles/earnings-reaction-brief.js` | Earnings reaction analysis |
| `single_stock_deep_dive` | `bundles/single-stock-deep-dive.js` | Full single-stock dossier |
| `event_risk_next_session` | `bundles/event-risk-next-session.js` | Next-session event risk ranking |
| `sector_rotation_monitor` | `bundles/sector-rotation-monitor.js` | Sector leadership and rotation |
| `screen_to_story` | `bundles/screen-to-story.js` | Screener-to-editorial shortlist |
| `valuation_vs_momentum_conflicts` | `bundles/valuation-vs-momentum-conflicts.js` | Valuation vs momentum conflict scoring |

## Shared Conventions

- Auth: `auth.apiKey` mapped to EODHD `api_token`.
- No hardcoded default symbols.
- Sequential `await ld.request(...)` calls (Langdock runtime compatible).
- Avoid `URLSearchParams`; use manual query-string encoding.
- Explicit outputs with diagnostics for reliability.
