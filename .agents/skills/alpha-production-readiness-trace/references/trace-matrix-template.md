# Trace Matrix Template

Use this matrix to connect UI actions to infrastructure reality.
Fill one row per user action.

```
| Step | User action | Expected result | Actual result | Network evidence | Backend handler | Persistence/integration | Gap | Severity |
|------|-------------|-----------------|---------------|------------------|-----------------|-------------------------|-----|----------|
| 1 | Click "Save" | Profile persists and toast appears | Toast appears, refresh loses data | POST /api/profile -> 200 | src/api/profile.ts:42 | No DB write found | Missing persistence | Critical |
```

Guidelines:
- Network evidence: include method, path, status code.
- Backend handler: point to file:line when possible.
- Persistence: name table/collection or external service used.
- Gap: classify with references/gap-taxonomy.md.
- Severity: score with references/severity-and-priority.md.
