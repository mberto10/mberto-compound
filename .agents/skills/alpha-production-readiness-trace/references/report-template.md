# Alpha Readiness Report Template

```
# Alpha Production Readiness Report

Product: [Name]
Flows evaluated: [List]
Date: [Timestamp]

## Verdict
- Ready / Ready with Conditions / Not Ready
- Rationale: [One paragraph]

## Readiness Gates
| Gate | Status | Evidence |
|------|--------|----------|
| Core value flow is real | Pass/Partial/Fail | [Evidence] |
| Identity and access are real | Pass/Partial/Fail | [Evidence] |
| Error transparency | Pass/Partial/Fail | [Evidence] |
| Safe side effects | Pass/Partial/Fail | [Evidence] |
| Core integrations are real | Pass/Partial/Fail | [Evidence] |
| Persistence survives refresh | Pass/Partial/Fail | [Evidence] |

## Top Blockers
1. [Critical gap + evidence + fix]
2. [Critical gap + evidence + fix]
3. [Critical gap + evidence + fix]

## Trace Matrix
[Paste the matrix from references/trace-matrix-template.md]

## Gap Summary
| Type | Count | Notes |
|------|-------|-------|
| UI Facade | [N] | [Notes] |
| Missing Persistence | [N] | [Notes] |
| Auth Gap | [N] | [Notes] |
| Integration Gap | [N] | [Notes] |
| Error Handling Gap | [N] | [Notes] |

## "Should Not Do" Violations
- [Violation + evidence]

## Recommended Fix Order
1. [Fix + owner]
2. [Fix + owner]
3. [Fix + owner]

## Linear Project
- Project: [link]
- Issues created: [N]

## Evidence Links
- Screenshots: [paths]
- Logs: [paths]
- File references: [file:line]
```
