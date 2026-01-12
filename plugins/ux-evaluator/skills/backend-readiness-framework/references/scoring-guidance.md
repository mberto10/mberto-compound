# Backend Readiness Scoring Guidance

## Scoring Overview

Assign each layer a score from 0-100, then compute a weighted average.
Suggested weights:
- Infrastructure Reality: 30%
- Security Readiness: 20%
- Reliability & Resilience: 15%
- Performance & Scalability: 15%
- Observability & Operability: 10%
- Data Integrity & Lifecycle: 10%

## Severity Mapping

- Critical findings reduce layer score by 25+ points
- High findings reduce layer score by 10-20 points
- Medium findings reduce layer score by 5-10 points
- Low findings reduce layer score by 1-5 points

## Status Guidance

- **Connected/Pass:** Evidence of real implementation + runtime verification
- **Partial:** Some pieces implemented, but missing critical elements
- **Missing:** UI/contract exists but backend layer is absent
- **Stubbed:** Mock data or placeholder logic

## Example

If Infrastructure Reality has two critical gaps (missing persistence, stubbed API), score 30/100.
If Security Readiness has one high gap (missing authz checks), score 70/100.
