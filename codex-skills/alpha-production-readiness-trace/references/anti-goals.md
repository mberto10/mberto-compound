# Anti-Goals (What the Flow Must Not Do)

Use these to define "should not do" constraints in the flow contract.

- Do not show success if a write failed or never happened.
- Do not rely on local-only state for core data.
- Do not execute destructive actions without confirmation.
- Do not create side effects on validation errors.
- Do not assume ambiguous inputs without confirmation.
- Do not expose secrets or tokens to the client.
- Do not silently swallow errors.
- Do not claim integration success without real calls.
- Do not hide critical failures behind spinners.
