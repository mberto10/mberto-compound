# Command and Skill Mapping

## Claude Commands to Codex Wrapper

| Claude command | Codex wrapper |
|---|---|
| `/agent-eval-init --agent <a> [--dataset <d>]` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval-init --agent <a> --dataset <d>` |
| `/agent-eval-infra <action> --agent <a> --dataset <d>` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval-infra --action <action> --agent <a> --dataset <d>` |
| `/agent-eval-setup --agent <a> --dataset <d>` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval-setup --agent <a> --dataset <d> --dimensions-json '<json>'` |
| `/setup-dataset` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py setup-dataset --agent <a> --dataset <d> --dimensions-json '<json>'` |
| `/agent-eval --agent <a>` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py agent-eval --agent <a> --dataset <d> --task-script <path>` |
| `/optimize-bootstrap --agent <a>` | `python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py optimize-bootstrap --agent <a> --dataset <d>` |

## Claude Plugin Skills to Codex Skill Names

| Claude plugin skill | Codex skill |
|---|---|
| `agent-advisor` | `langfuse-agent-advisor` |
| `annotation-manager` | `langfuse-annotation-manager` |
| `data-retrieval` | `langfuse-data-retrieval` |
| `dataset-management` | `langfuse-dataset-management` |
| `experiment-runner` | `langfuse-experiment-runner` |
| `instrumentation-setup` | `langfuse-instrumentation-setup` |
| `prompt-management` | `langfuse-prompt-management` |
| `score-analytics` | `langfuse-score-analytics` |
| `session-analysis` | `langfuse-session-analysis` |
| `trace-analysis` | `langfuse-trace-analysis` |
| `eval-infrastructure` | `langfuse-eval-infrastructure` (and wrapper command `agent-eval-infra`) |
| `schema-validator` | no Codex port currently in this repo |

## Skill Parity Utilities

```bash
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py skills-status
python3 ~/.codex/skills/langfuse-analyzer-commands/scripts/langfuse_bridge.py skills-sync --all
```
