# Flow Contract Template

Use this to define what a flow should do and what it must not do before tracing.

```
# Flow Contract: [Flow Name]

Goal:
- [Primary user goal]

Success criteria:
- [What the user must be able to do]
- [What the user must see]

Inputs:
- User inputs: [fields the user must provide]
- System inputs: [pre-filled data, inferred context]
- Defaults allowed: [which defaults are safe]

Outputs:
- User-visible output: [what changes on screen]
- System side effects: [records created, notifications sent]

Persistence:
- Must persist: [data that must survive refresh/login]
- Can be ephemeral: [data that can be transient]

Integrations:
- Required services: [auth, payments, storage, etc.]
- Required env vars: [keys, URLs]

Error handling:
- Expected errors: [invalid input, auth expired]
- User-facing message: [what should be shown]
- Recovery path: [retry, edit, support]

Should do:
- [Behavior that must happen]
- [Behavior that must happen]

Should not do:
- [Behavior that must never happen]
- [Behavior that must never happen]

Evidence to verify:
- UI: [screens or elements]
- Network: [endpoint + status]
- Backend: [handler or query]
- Storage: [table/collection]
```
