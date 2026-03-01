---
description: Sync plugin skills and commands into .agents/ for use by Antigravity, Codex, and other agent platforms
argument-hint: [plugin names to sync, or blank for all]
allowed-tools: Bash, Read, Glob
---

# Sync Agents

Copy skills and commands from `plugins/` into `.agents/` so they are discoverable by external agent platforms (Antigravity, Codex).

## Input

- `$ARGUMENTS`: Optional space-separated plugin names to sync. If empty, syncs all plugins.

## Workflow

### 1. Preview changes

Always start with a dry run:

```bash
./sync-agents.sh --dry-run $ARGUMENTS
```

Show the user what will be copied.

### 2. Confirm and run

If the user approves (or didn't ask for preview), run the sync:

```bash
./sync-agents.sh --clean $ARGUMENTS
```

The `--clean` flag removes stale `.agents/` entries that no longer have a matching source in the specified plugins.

### 3. Report results

Summarize what was synced:
- Number of skills copied
- Number of workflows copied
- Any stale entries removed

## Options

The user may request variations:
- **Specific plugins**: `/tooling:sync-agents compound-engineering work-toolkit`
- **Preview only**: "just show me what would change" → use `--dry-run` only
- **Without cleanup**: "don't remove anything" → omit `--clean`

## How It Works

The script uses the naming convention `<plugin>-<skill>` for flattened copies:
- `plugins/compound-engineering/skills/discovery-craft/` → `.agents/skills/compound-engineering-discovery-craft/`
- `plugins/work-toolkit/commands/linear.md` → `.agents/workflows/work-toolkit-linear.md`

This produces a flat directory that agent platforms can scan without understanding the plugin structure.
