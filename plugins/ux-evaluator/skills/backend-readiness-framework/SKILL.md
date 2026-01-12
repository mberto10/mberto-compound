---
name: Backend Readiness Framework
description: Systematic methodology for backend production readiness audits that extend infrastructure checks with security, performance, reliability, observability, and data integrity layers.
version: 0.1.0
---

# Backend Readiness Framework

Systematic methodology for evaluating backend production readiness by walking user flows end-to-end and verifying each critical backend layer.

**Core principle:** Verify that the backend delivers durable, secure, observable value for the same user flows validated in UX evaluation.

## Readiness Layers

1. **Infrastructure Reality** - Database, auth persistence, API endpoints, integrations, state durability
2. **Security Readiness** - AuthZ enforcement, input validation, secrets handling, audit trails
3. **Performance & Scalability** - Latency budgets, query efficiency, load tolerance, caching
4. **Reliability & Resilience** - Retries, rate limiting, circuit breakers, graceful degradation
5. **Observability & Operability** - Logs, metrics, traces, health checks, alerting
6. **Data Integrity & Lifecycle** - Schema validation, migrations, idempotency, backups/restore

## Evaluation Workflow

### Step 1: Establish Flow Context

Use the same flow selected for dogfooding/technical debugging.
Document:
- Flow name
- Entry point URL
- Core success criteria (what must persist or complete)

### Step 2: Trace the Backend Chain

For each user action, trace:
```
User Action → Frontend Handler → API Call → Backend → Database/Service
```
Confirm each link exists and is wired to real infrastructure.

### Step 3: Evaluate Each Layer

Use layer-specific checklists (see references) to confirm:
- Evidence in code/config
- Runtime behavior (if a dev environment is available)
- Gaps or stubs

### Step 4: Record Findings

For each issue:
```
ISSUE: [Short title]
LAYER: [Infrastructure/Security/Performance/...] 
SEVERITY: [Critical/High/Medium/Low]
STATUS: [Missing/Partial/Stubbed]
EVIDENCE: [File paths, endpoints, logs]
FIX: [Concrete steps]
```

### Step 5: Generate Report

Use the template in `references/report-template.md` to provide:
- Overall readiness score
- Layer-by-layer status
- Detailed findings
- Implementation checklist

## Severity Guidelines

- **Critical**: Blocks core flow or risks data loss/security breach
- **High**: Materially degrades reliability or user trust
- **Medium**: Notable operational risk or friction
- **Low**: Nice-to-have hardening

## Outputs

- `backend-readiness-audit-[flow].md` report
- Optional Linear issues grouped by layer and severity

## References

- `references/layer-checklists.md`
- `references/report-template.md`
- `references/scoring-guidance.md`
