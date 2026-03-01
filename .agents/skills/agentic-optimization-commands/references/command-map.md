# Command Mapping

## Claude to Codex

| Claude command | Codex wrapper |
|---|---|
| `/optimize-bootstrap --agent <a> --dataset <d>` | `python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize-bootstrap --agent <a> --dataset <d>` |
| `/optimize --agent <a> --lever-mode <m> --max-levers <n>` | `python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize --agent <a> --lever-mode <m> --max-levers <n>` |
| `/optimize-status --agent <a>` | `python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize-status --agent <a>` |
| `/cloud-optimize --agent <a> --iterations <n>` | `python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py cloud-optimize --agent <a> --iterations <n>` |

## Extra Utilities

- Contract only preflight:

```bash
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py optimize-preflight --agent <a> --validate-live
```

- Save cloud prompt to file:

```bash
python3 ~/.codex/skills/agentic-optimization-commands/scripts/optimize_bridge.py cloud-optimize --agent <a> --out .claude/optimization-loops/<a>/cloud-prompt.md
```
