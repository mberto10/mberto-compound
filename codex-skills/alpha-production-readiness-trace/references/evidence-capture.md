# Evidence Capture Guide

Capture evidence for each step so the trace is defensible.
Prefer direct evidence over inference.

## UI evidence
- Screenshot or snapshot after each action.
- Note visible success, failure, or loading states.

## Network evidence
- Record endpoint, method, status, and response shape.
- Flag missing calls when the UI claims success.

## Console evidence
- Record errors and warnings tied to the action.

## Storage evidence
- Confirm writes in backend code (insert/update calls).
- Look for migrations or schema defining the storage.

## Code search patterns (rg)
```
rg "fetch\(|axios|api\." frontend
rg "router\.(get|post|put|delete)|app\.(get|post|put|delete)" backend
rg "INSERT|UPDATE|CREATE TABLE|prisma\.|supabase\." -g"*.ts" -g"*.py"
rg "localStorage\.|sessionStorage\." -g"*.ts" -g"*.tsx"
```

## Evidence checklist per action
- [ ] UI state captured
- [ ] Network call captured (or explicitly missing)
- [ ] Backend handler located (or explicitly missing)
- [ ] Persistence verified (or explicitly missing)
- [ ] Error handling observed
