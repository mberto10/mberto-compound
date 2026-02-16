# EODHD Atomic Actions Tracker

Last updated: 2026-02-16  
Purpose: source of truth for single-endpoint EODHD Langdock actions and rollout status.

## Status Legend

- `EXISTING_UI` = already configured in your Langdock workspace
- `IMPLEMENTED_REPO` = action file created in repository
- `TESTING` = action logic validated with local mock harness
- `LIVE_PENDING` = ready to wire/import to Langdock UI
- `PLANNED` = not yet implemented

## Updated Atomic Catalog

| ID | Action Name | Scope | Status | File |
|---|---|---|---|---|
| AC-01 | `search_instruments` | Instrument discovery | EXISTING_UI | External (already in your Langdock setup) |
| AC-02 | `get_eod_prices` | EOD OHLCV history | EXISTING_UI | External (already in your Langdock setup) |
| AC-03 | `get_intraday_prices` | Intraday OHLCV bars | EXISTING_UI | External (already in your Langdock setup) |
| AC-04 | `get_fundamentals` | Fundamentals endpoint wrapper | TESTING | `plugins/langdock-dev/actions/eodhd/core/get-fundamentals.js` |
| AC-05 | `run_screener` | Screener endpoint wrapper | TESTING | `plugins/langdock-dev/actions/eodhd/core/run-screener.js` |
| AC-06 | `get_technical_indicator` | Technical endpoint wrapper | TESTING | `plugins/langdock-dev/actions/eodhd/core/get-technical-indicator.js` |
| AC-07 | `get_calendar_events` | Calendar endpoint wrapper | TESTING | `plugins/langdock-dev/actions/eodhd/core/get-calendar-events.js` |
| AC-08 | `get_news_sentiment` | News endpoint wrapper | TESTING | `plugins/langdock-dev/actions/eodhd/core/get-news-sentiment.js` |
| AC-09 | `get_real_time_quote` | Real-time quote endpoint | TESTING | `plugins/langdock-dev/actions/eodhd/core/get-real-time-quote.js` |
| AC-10 | `get_exchange_symbols` | Exchange symbol list | PLANNED | Not implemented |
| AC-11 | `get_dividends` | Dividends history endpoint | PLANNED | Not implemented |
| AC-12 | `get_splits` | Splits history endpoint | PLANNED | Not implemented |

## Build Notes

- Authentication convention is standardized to `auth.apiKey` -> `api_token`.
- Symbol defaults are intentionally not hardcoded.
- Query parameters are manually encoded (no `URLSearchParams`) for Langdock runtime compatibility.
- Each action returns deterministic blocks:
  - `data`
  - `endpointDiagnostics`
  - `metadata`
- Input contract cleanup in progress for core EODHD actions:
  - Canonical snake_case names in docs and parser precedence.
  - Backward-compatible legacy camelCase aliases retained temporarily via `metadata.inputCompatibility`.
