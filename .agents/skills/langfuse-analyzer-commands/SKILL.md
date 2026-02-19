---
name: langfuse-analyzer-commands
description: Use when the user asks to run Claude-style Langfuse analyzer commands in Codex, including /agent-eval-init, /agent-eval-infra, /agent-eval-setup, /setup-dataset, /agent-eval, or /optimize-bootstrap, and when they want Codex skill parity for Langfuse workflows.
---

# Langfuse Analyzer Commands

Codex wrapper surface for Claude command parity and Langfuse skill parity.

This skill routes to existing helper scripts in this repository. It does not re-implement Langfuse core logic.

## Command Parity

- `/agent-eval-init` -> `langfuse_bridge.py agent-eval-init`
- `/agent-eval-infra` -> `langfuse_bridge.py agent-eval-infra`
- `/agent-eval-setup` -> `langfuse_bridge.py agent-eval-setup`
- `/setup-dataset` -> `langfuse_bridge.py setup-dataset`
- `/agent-eval` -> `langfuse_bridge.py agent-eval`
- `/optimize-bootstrap` -> `langfuse_bridge.py optimize-bootstrap`

## Skill Parity Utilities

- `langfuse_bridge.py skills-status` checks Claude plugin skill parity vs Codex skill install state.
- `langfuse_bridge.py skills-sync` installs/copies missing Langfuse Codex skills into `~/.codex/skills`.

See full mapping in `references/command-map.md`.

## Quick Start

```bash
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval-infra --action status --agent my-agent --dataset my-agent-eval
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval-setup --agent my-agent --dataset my-agent-eval --dimensions-json '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]'
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py skills-status
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py skills-sync --all
```

## Required Environment

- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST` (optional)

## Repo Root Resolution

The wrapper resolves the plugin repo root in this order:

1. `--repo-root`
2. `MBERTO_COMPOUND_ROOT`
3. current working directory and parents containing `plugins/langfuse-analyzer`

## Notes

- Keep eval and compatibility state in `.claude/` for compatibility with existing helper scripts.
- Use existing Codex Langfuse skills (`langfuse-*`) for deeper task workflows once parity setup is complete.
