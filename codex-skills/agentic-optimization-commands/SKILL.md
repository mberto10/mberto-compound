---
name: agentic-optimization-commands
description: Use when the user asks to run Claude-style optimization commands in Codex, including /optimize-bootstrap, /optimize, /optimize-status, or /cloud-optimize. Wraps plugin helper scripts with Codex-friendly entrypoints.
---

# Agentic Optimization Commands

Codex wrapper surface for Claude command parity.

This skill does not re-implement optimization logic. It routes to the existing helper scripts in this repository and normalizes invocation in Codex.

## Command Parity

- `/optimize-bootstrap` -> `optimize_bridge.py optimize-bootstrap`
- `/optimize` -> `optimize_bridge.py optimize`
- `/optimize-status` -> `optimize_bridge.py optimize-status`
- `/cloud-optimize` -> `optimize_bridge.py cloud-optimize`
- preflight utility -> `optimize_bridge.py optimize-preflight`

See full mapping in `references/command-map.md`.

## Quick Start

```bash
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize-bootstrap --agent my-agent --dataset my-agent-eval
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize --agent my-agent --lever-mode single
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize-status --agent my-agent
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py cloud-optimize --agent my-agent --iterations 5
```

## Required Environment

- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST` (optional)

## Repo Root Resolution

The wrapper resolves the plugin repo root in this order:

1. `--repo-root`
2. `MBERTO_COMPOUND_ROOT`
3. current working directory and parents containing `plugins/langfuse-analyzer` and `plugins/agentic-optimization-loop`

## Notes

- Keep eval/optimization state in `.claude/` for compatibility with existing plugin helpers.
- Use `agentic-optimization-craft` for the iterative hypothesis workflow itself.
