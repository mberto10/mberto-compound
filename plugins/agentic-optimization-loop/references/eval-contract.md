# Eval Contract for Optimization Loop

This plugin consumes evaluation state exported by `langfuse-analyzer`.

## Primary Contract Location

- `.claude/eval-infra/<agent>.yaml`
- `.claude/eval-infra/<agent>.json`

## Required Fields (Normalized)

```yaml
agent: "<agent-name>"
dataset:
  name: "<dataset-name>"
  id: "<optional-dataset-id>"
score_scale: "0-1"
dimensions:
  - name: "<dimension>"
    judge_prompt: "judge-<name>"
    threshold: <0-1>
    weight: <number>
    critical: <true|false>
baseline:
  run_name: "<baseline-run-name>"
  created_at: "<ISO-8601>"
  metrics:
    <metric>: <0-1>
```

## Consumption Rules

1. Local snapshot is source priority.
2. Live Langfuse validation is mandatory for referenced identifiers.
3. Fail fast if snapshot is missing, malformed, or incomplete.
4. Canonical score semantics are always `0-1`.

## Error Classes

- `CONTRACT_NOT_FOUND`
- `CONTRACT_PARSE_ERROR`
- `CONTRACT_INVALID`
- `CONTRACT_LIVE_VALIDATION_FAILED`

## Remediation

Use Langfuse Analyzer commands:

```bash
/agent-eval-infra status --agent <agent> --dataset <dataset>
/agent-eval-setup --agent <agent>
/setup-dataset
```
