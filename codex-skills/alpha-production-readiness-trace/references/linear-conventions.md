# Linear Conventions

Use these conventions when Linear MCP is available.
Create exactly one Linear project per run.
Document findings in the project description and create one issue per gap or implementation recommendation.

## Project Naming

```
Alpha Readiness: [Product] - [Flow(s)] - [YYYY-MM-DD]
```

## Project Description Template

```
Alpha Production Readiness

Verdict: [Ready | Ready with Conditions | Not Ready]
Flows: [Flow 1], [Flow 2]
Date: [Timestamp]

Readiness Gates Summary
- Core value flow is real: [Pass/Partial/Fail]
- Identity and access are real: [Pass/Partial/Fail]
- Error transparency: [Pass/Partial/Fail]
- Safe side effects: [Pass/Partial/Fail]
- Core integrations are real: [Pass/Partial/Fail]
- Persistence survives refresh: [Pass/Partial/Fail]

Top Blockers
1. [Gap + evidence]
2. [Gap + evidence]
3. [Gap + evidence]

Evidence
- Report: [path]
- Key screenshots/logs: [paths]
```

## Issue Template (one per gap)

Title
```
[Gap Type]: [Short actionable fix]
```

Description
```
## Flow
[Flow name]

## Observation
[What happened in the UI]

## Expected
[What should have happened per flow contract]

## Evidence
- UI: [screenshot/path]
- Network: [endpoint + status]
- Backend: [file:line]
- Persistence/Integration: [table/service]

## Impact
[User impact and alpha gate affected]

## Recommendation
[Specific fix or implementation steps]
```

## Labels (optional)
Use labels that match gap taxonomy when available:
- alpha-readiness
- missing-persistence
- auth-gap
- integration-gap
- ui-facade
- error-handling
- data-integrity
```
