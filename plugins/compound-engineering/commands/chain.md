---
name: chain
description: Check or stop the post-work chain (work → review → discover)
argument-hint: stop | status
allowed-tools: Read, Write, Glob
---

# Chain Command

Check or stop the automatic post-work chain that runs **work → review → discover** in sequence via the Stop hook.

The chain is activated automatically by `/work` — no manual start needed.

**Action:** $ARGUMENTS

---

## Logic

Parse the action from `$ARGUMENTS` (default to `status` if empty).

### `stop`

If `.claude/work-chain-state.local.md` exists, set `active: false`. If it doesn't exist, inform the user no chain is active.

### `status`

Read `.claude/work-chain-state.local.md` and report:
- **Active:** yes/no
- **Stage:** idle / pending_review / pending_discover / done
- If file doesn't exist: "No chain active. The chain starts automatically when you run `/work`."
