# EODHD Core Atomic Actions

Single-endpoint Langdock actions for EODHD. These are building blocks for bundle/composite analyses.

## Coverage Map

### Already set up by you (existing in Langdock)

| Action | Purpose |
|---|---|
| `search_instruments` | Symbol/instrument lookup by query |
| `get_eod_prices` | End-of-day OHLCV history |
| `get_intraday_prices` | Intraday OHLCV candles |

### Implemented in this update (new files here)

| Action | File | Purpose |
|---|---|---|
| `get_fundamentals` | `get-fundamentals.js` | Raw + summarized fundamentals payload for one symbol |
| `run_screener` | `run-screener.js` | Parameterized screener query with optional filters/signals |
| `get_technical_indicator` | `get-technical-indicator.js` | Technical endpoint wrapper (RSI/SMA/etc.) |
| `get_calendar_events` | `get-calendar-events.js` | Calendar endpoint wrapper (earnings/dividends/splits/IPOs/economic events) |
| `get_news_sentiment` | `get-news-sentiment.js` | News endpoint wrapper with optional symbol/date filters |
| `get_real_time_quote` | `get-real-time-quote.js` | Real-time quote snapshot endpoint wrapper |

## Conventions

- Auth input: accepts `auth.apiKey`, `auth.apiToken`, `auth.api_key`, `auth.api_token`, or `auth.eodhdApiKey` (mapped to EODHD `api_token`).
- No hardcoded default symbols.
- Sequential `await ld.request(...)` usage for Langdock runtime compatibility.
- All core actions support `help=true` to return a decision guide without calling EODHD.
- Core actions default to compact/agent-friendly output. Use `outputMode: "full"` only when raw payload is explicitly needed.
- Deterministic output shape:
  - `data`
  - `endpointDiagnostics`
  - `metadata`

## Input naming and alias policy

- Canonical inputs are documented as snake_case.
- Backward-compatible camelCase aliases are accepted during migration.
- When a legacy alias is used, action metadata returns `inputCompatibility` and endpoint diagnostics include `aliasWarnings`.
- Canonical vs legacy precedence: canonical input value wins when both are provided.

### EODHD core canonical/legacy map

- `get_fundamentals`: `fields_preset`, `max_periods` (`fieldsPreset`, `maxPeriods`, `periods`)
- `run_screener`: `output_mode`, `result_limit` (`outputMode`, `resultLimit`)
- `get_technical_indicator`: `analysis_type`, `max_points`, `output_mode` (`analysisType`, `maxPoints`, `maxPeriods`, `max_periods`, `outputMode`)
- `get_calendar_events`: `calendar_type`, `window_preset`, `output_mode`, `result_limit` (`calendarType`, `windowPreset`, `outputMode`, `resultLimit`)
- `get_news_sentiment`: `window_preset`, `output_mode`, `content_max_chars`, `result_limit` (`windowPreset`, `outputMode`, `contentMaxChars`, `resultLimit`)
- `get_real_time_quote`: `output_mode` (`outputMode`)

## Quick Decision Matrix

| If your goal is... | Use action | Starter input |
|---|---|---|
| Find a universe to analyze | `run_screener` | `{ "preset": "market_leaders" }` |
| Check movers quickly | `run_screener` | `{ "preset": "top_gainers" }` or `{ "preset": "top_losers" }` |
| Get company valuation/profile facts | `get_fundamentals` | `{ "symbol": "AAPL.US", "fields_preset": "valuation" }` |
| Pull accounting statements | `get_fundamentals` | `{ "symbol": "AAPL.US", "fields_preset": "financials" }` |
| Check momentum/trend/volatility indicator | `get_technical_indicator` | `{ "symbol": "AAPL.US", "analysis_type": "momentum" }` |
| Get upcoming catalysts | `get_calendar_events` | `{ "calendar_type": "earnings", "window_preset": "next_7d" }` |
| Fetch recent headlines | `get_news_sentiment` | `{ "symbols": "AAPL.US,MSFT.US", "window_preset": "last_7d" }` |
| Get current quote snapshot | `get_real_time_quote` | `{ "symbol": "AAPL.US" }` |

If you are unsure which inputs to choose, call the same action first with `{ "help": true }`.

## Input Vocabularies

- `get_fundamentals.fields` allowed keys:
  - `General`
  - `Highlights`
  - `Valuation`
  - `SharesStats`
  - `SplitsDividends`
  - `Technicals`
  - `Holders`
  - `InsiderTransactions`
  - `ESGScores`
  - `outstandingShares`
  - `Earnings`
  - `Financials`
- `get_calendar_events.calendar_type` allowed values:
  - `earnings`
  - `dividends`
  - `splits`
  - `ipos`
  - `economic_events`
- `get_technical_indicator.function` common values:
  - `rsi`
  - `sma`
  - `ema`
  - `wma`
  - `macd`
  - `atr`
  - `adx`
  - `stochastic`
  - `cci`
  - `williams`
  - `mfi`
  - `bbands`
- `run_screener.sort` common values:
  - `market_capitalization.desc`
  - `market_capitalization.asc`
  - `name.asc`
  - `name.desc`
  - `volume.desc`
  - `change_p.desc`
- `run_screener.preset` beginner values:
  - `market_leaders`
  - `top_gainers`
  - `top_losers`
  - `oversold`
  - `overbought`
  - `high_volume`
- `get_technical_indicator.analysis_type` beginner values:
  - `momentum`
  - `trend_short`
  - `trend_medium`
  - `trend_strength`
  - `volatility`
  - `mean_reversion`
- `get_calendar_events.window_preset` values:
  - `today`
  - `next_7d`
  - `next_30d`
  - `last_7d`
  - `last_30d`
- `get_news_sentiment.window_preset` values:
  - `today`
  - `last_7d`
  - `last_30d`
