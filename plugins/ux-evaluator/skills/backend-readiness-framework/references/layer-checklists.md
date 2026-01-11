# Backend Readiness Layer Checklists

## 1. Infrastructure Reality
- Database tables/collections exist and are migrated
- Auth creates persistent user records
- API endpoints exist and read/write real data
- External integrations wired (billing, email, storage, etc.)
- State persists across refreshes

## 2. Security Readiness
- AuthZ enforced at backend (role/ownership checks)
- Input validation & sanitization
- Secrets managed via env/secret store
- Audit logs for sensitive actions
- Secure error responses (no stack traces to users)

## 3. Performance & Scalability
- Baseline latency targets per endpoint
- Queries indexed and efficient
- Caching or pagination for large datasets
- Rate limiting for heavy endpoints
- Load test coverage for critical flows

## 4. Reliability & Resilience
- Retries with backoff for flaky deps
- Circuit breakers or graceful fallbacks
- Idempotent writes where relevant
- Timeout settings for external calls
- Dead-letter queues for background jobs

## 5. Observability & Operability
- Structured logs with request IDs
- Traces across services
- Metrics for latency/error/throughput
- Health checks (liveness/readiness)
- Alerting for SLO breaches

## 6. Data Integrity & Lifecycle
- Schema validation at API boundary
- Migrations tracked and reproducible
- Backups and restore verification
- Data retention and deletion policy
- Idempotency for retries
