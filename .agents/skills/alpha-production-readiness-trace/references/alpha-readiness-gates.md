# Alpha Readiness Gates

These gates define what must be true before alpha users can use the product safely.
Alpha readiness is about core value being real, not about polish.

## Gate A: Core Value Flow Is Real
Pass if the core flow completes end-to-end with real persistence and correct retrieval.
Fail if any step succeeds in the UI but does not persist or does not retrieve correctly.

Evidence required:
- Network calls reach real endpoints (not mocks).
- Backend handler performs a real write.
- Data survives refresh or re-login.

## Gate B: Identity and Access Are Real
Pass if signup/login creates a user record and protects user-specific data.
Fail if auth exists only in the UI or data is shared across users.

Evidence required:
- Auth token used in API calls.
- User record written to database or auth provider.
- Access control present in data queries.

## Gate C: Error Transparency
Pass if failures are visible, explainable, and recoverable by the user.
Fail if errors are silent, misleading, or show false success.

Evidence required:
- Errors result in user-facing messages.
- Recovery actions are available (retry, edit, contact).

## Gate D: Safe Side Effects
Pass if destructive or irreversible actions require confirmation or preview.
Fail if actions commit without a gate or can cause accidental data loss.

Evidence required:
- Confirmation dialog or preview before commit.
- Ability to cancel or undo for critical actions.

## Gate E: Core Integrations Are Real
Pass if integrations required for the core value are configured and used.
Fail if the UI pretends an integration works but calls are stubbed or ignored.

Evidence required:
- Real API calls to the integration.
- Config values present (env vars) for the integration.

## Gate F: Persistence Survives Refresh
Pass if the user can refresh and still see core data.
Fail if core data exists only in local state or localStorage.

Evidence required:
- Data retrieved from backend after refresh.
- Storage layer writes verified in code.

## Alpha Verdict
- Ready: All gates pass.
- Ready with Conditions: One gate partially met but does not block core usage.
- Not Ready: Any gate fails for a core flow.

## Alpha Tolerance
These can be incomplete without blocking alpha:
- Analytics and dashboards.
- Advanced settings and customizations.
- Edge-case error messages for non-core flows.
- Performance optimizations beyond basic usability.
