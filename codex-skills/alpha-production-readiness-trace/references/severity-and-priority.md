# Severity and Priority (Alpha)

Use these rules to score gaps for alpha readiness.

## Severity Levels

Critical
- Core flow blocked or data loss occurs.
- UI shows success without persistence.
- Unsafe side effects without confirmation.

High
- Core flow completes but returns incorrect or incomplete results.
- Frequent errors or auth failures in core flow.

Medium
- Non-core flow broken.
- Core flow works but has significant friction.

Low
- Minor UX polish or clarity issues.

## Priority Mapping
- P0: Critical gaps in core flow.
- P1: High gaps in core flow.
- P2: Medium gaps or critical gaps in non-core flow.
- P3: Low gaps or polish.

## Alpha Rule of Thumb
- Any Critical in a core flow = Not Ready.
- High gaps in core flow = Ready with Conditions at best.
- Medium/Low gaps in non-core flows are acceptable for alpha.
