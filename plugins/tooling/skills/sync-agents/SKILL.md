---
name: Sync Agents
description: This skill should be used when the user asks to "sync agents", "update .agents", "copy skills to agents", "publish to antigravity", "publish to codex", or wants to make plugin skills available to external agent platforms. Provides knowledge about the sync-agents.sh script and the .agents/ directory structure.
---

# Sync Agents

## Purpose

Maintain the `.agents/` directory as a flat, portable mirror of all plugin skills and commands. External agent platforms (Antigravity, Codex) discover skills by scanning `.agents/` — they don't understand the Claude Code plugin structure under `plugins/`.

## Architecture

```
plugins/<plugin>/skills/<skill>/    →  .agents/skills/<plugin>-<skill>/
plugins/<plugin>/commands/<cmd>.md  →  .agents/workflows/<plugin>-<cmd>.md
```

The `sync-agents.sh` script at the repo root handles this. It copies (not symlinks) so `.agents/` works standalone.

## Script Usage

```bash
# Sync all plugins
./sync-agents.sh

# Sync specific plugins only
./sync-agents.sh compound-engineering work-toolkit

# Preview without making changes
./sync-agents.sh --dry-run

# Remove stale entries that no longer have a plugin source
./sync-agents.sh --clean

# Combine flags
./sync-agents.sh --dry-run --clean compound-engineering
```

## When to Sync

Run the sync after:
- Adding or removing skills from a plugin
- Adding or removing commands from a plugin
- Creating a new plugin
- Renaming skills or commands

## Naming Convention

The flat `.agents/` directory prefixes each entry with the plugin name to avoid collisions:
- Plugin `compound-engineering`, skill `discovery-craft` → `compound-engineering-discovery-craft`
- Plugin `work-toolkit`, command `linear.md` → `work-toolkit-linear.md`
