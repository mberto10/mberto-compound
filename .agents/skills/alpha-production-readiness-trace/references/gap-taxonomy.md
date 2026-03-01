# Gap Taxonomy

Use this taxonomy to classify what is missing or broken.

## UI Facade
- Symptom: UI updates but no network call or backend action.
- Owner: Frontend
- Example: "Save" button only updates local state.

## Stubbed Data
- Symptom: Data returned is hardcoded or static.
- Owner: Backend
- Example: API returns fixed list regardless of input.

## Missing Persistence
- Symptom: Actions appear to succeed but data does not survive refresh.
- Owner: Backend/Infra
- Example: Write path missing or not wired to DB.

## Partial Persistence
- Symptom: Write exists but read path missing or inconsistent.
- Owner: Backend
- Example: Record created but not fetched for display.

## Auth Gap
- Symptom: Requests missing auth or user records not created.
- Owner: Backend/Auth
- Example: API returns 401 or data shared across users.

## Integration Gap
- Symptom: External service not configured or ignored.
- Owner: Infra/Backend
- Example: Stripe key missing, webhook handler absent.

## Error Handling Gap
- Symptom: Silent failure or misleading success state.
- Owner: Frontend/Backend
- Example: Error swallowed; UI shows success.

## Flow Mismatch
- Symptom: Step order prevents correct completion.
- Owner: Product/Frontend
- Example: Confirmation missing before commit.

## Unsafe Side Effects
- Symptom: Irreversible actions happen without confirmation.
- Owner: Product/Frontend

## Data Integrity Gap
- Symptom: Wrong user data, missing validation, or inconsistent state.
- Owner: Backend
