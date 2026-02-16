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

- Auth input: `auth.apiKey` (mapped to EODHD `api_token`).
- No hardcoded default symbols.
- Sequential `await ld.request(...)` usage for Langdock runtime compatibility.
- Deterministic output shape:
  - `data`
  - `endpointDiagnostics`
  - `metadata`

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
- `get_calendar_events.calendarType` allowed values:
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
