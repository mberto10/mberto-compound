# Backend Readiness Audit: [Flow Name]

## Executive Summary
[One paragraph: Is this flow production-ready across backend layers?]

## Readiness Score: X/100

| Layer | Status | Evidence |
|-------|--------|----------|
| Infrastructure Reality | Connected/Partial/Missing | [Evidence] |
| Security Readiness | Pass/Partial/Fail | [Evidence] |
| Performance & Scalability | Pass/Partial/Fail | [Evidence] |
| Reliability & Resilience | Pass/Partial/Fail | [Evidence] |
| Observability & Operability | Pass/Partial/Fail | [Evidence] |
| Data Integrity & Lifecycle | Pass/Partial/Fail | [Evidence] |

## Detailed Findings

### [Finding Title]
**Layer:** [Infrastructure/Security/Performance/Reliability/Observability/Data Integrity]
**Severity:** [Critical/High/Medium/Low]
**Status:** [Missing/Partial/Stubbed]

**What Users See:**
[User-facing behavior]

**What Actually Happens:**
[Backend behavior]

**Evidence:**
[File paths, endpoints, logs]

**Fix Steps:**
[Concrete changes]

---

## Implementation Checklist

### Infrastructure Reality
- [ ] Database tables/collections exist
- [ ] Auth persistence verified
- [ ] API endpoints real (no mock data)
- [ ] Integrations wired

### Security Readiness
- [ ] AuthZ enforcement
- [ ] Input validation
- [ ] Secrets in env/secret store
- [ ] Audit logs

### Performance & Scalability
- [ ] Latency baselines
- [ ] Query/index review
- [ ] Load tests
- [ ] Pagination/caching

### Reliability & Resilience
- [ ] Retries + backoff
- [ ] Circuit breakers/fallbacks
- [ ] Timeouts
- [ ] Idempotent writes

### Observability & Operability
- [ ] Logs with request IDs
- [ ] Traces
- [ ] Metrics + alerts
- [ ] Health checks

### Data Integrity & Lifecycle
- [ ] Schema validation
- [ ] Migration verification
- [ ] Backup/restore
- [ ] Data retention/deletion
