---
description: Check or stop the post-work chain (work -> review -> discover)
argument-hint: stop | status
allowed-tools: Read, Write, Glob, Bash
---

# Chain Command

Check or stop the hookless post-work chain that runs **work -> review -> discover**.

The chain is activated automatically by `/work` via the Codex runner state file.

**Action:** $ARGUMENTS

---

## Logic

Parse the action from `$ARGUMENTS` (default to `status` if empty).

### `stop`

Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-stop --json
```

Report the resulting `active` and `stage` values.

### `status`

Run:

```bash
python3 .agents/skills/compound-engineering-commands/scripts/compound_engineering_runner.py chain-status --json
```

Report:
- **Active:** yes/no
- **Stage:** idle / pending_review / pending_discover / done
- **State file:** `compound-state/compound-engineering/work-chain-state.local.json`
- If state file is missing: "No chain active. The chain starts automatically when you run `/work`."
