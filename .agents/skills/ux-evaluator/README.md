# UX Evaluator (Codex)

Single-skill Codex port of the ux-evaluator plugin.

## Modes

- `ux-eval` - UX quality assessment with User Lifecycle Framework
- `dogfood` - Production readiness from user perspective with optional code + infra audit
- `mcp-eval` - MCP tool -> widget evaluation

## Quick Install

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo mberto10/mberto-compound \
  --path codex-skills/ux-evaluator
```

## Context File

Copy the example file:

```
cp codex-skills/ux-evaluator/examples/ux-evaluator.local.md.example .codex/ux-evaluator.local.md
```
