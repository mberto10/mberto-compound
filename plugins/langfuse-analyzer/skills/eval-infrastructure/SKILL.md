---
name: langfuse-eval-infrastructure
description: This skill should be used when the user asks to "set up evaluation infrastructure", "bootstrap evals", "prepare dataset and judges", "define eval dimensions", "export eval snapshot", "check eval readiness", or needs Langfuse-first evaluation setup for agent optimization loops.
---

# Langfuse Eval Infrastructure

Establish and maintain a Langfuse-first evaluation infrastructure contract for agent improvement workflows.

## Purpose

This skill standardizes three things:
- Canonical evaluation state in Langfuse dataset metadata
- Judge prompts in Langfuse prompt registry
- Local snapshot exports for downstream loop tools

## Canonical Contract

Use `eval_infra_v1` metadata in the dataset:

```json
{
  "schema_version": "eval_infra_v1",
  "agent": {
    "name": "my-agent",
    "entry_point": "python app.py"
  },
  "score_scale": "0-1",
  "dimensions": [
    {
      "name": "accuracy",
      "judge_prompt": "judge-accuracy",
      "threshold": 0.8,
      "weight": 1.0,
      "critical": true
    }
  ],
  "judge_prompts": ["judge-accuracy"],
  "baseline": {
    "run_name": "baseline-20260212-173000",
    "created_at": "2026-02-12T17:30:00Z",
    "metrics": {
      "accuracy": 0.74
    }
  },
  "status": {
    "dataset_ready": true,
    "judges_ready": true,
    "baseline_ready": false
  }
}
```

## Commands

Use helper CLI:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py assess --agent "my-agent" --dataset "my-agent-eval"
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py bootstrap --agent "my-agent" --dataset "my-agent-eval" --dimensions '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]'
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py ensure-judges --dataset "my-agent-eval" --dimensions '[{"name":"accuracy"}]'
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py baseline --agent "my-agent" --dataset "my-agent-eval" --task-script ./task.py
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py export --agent "my-agent" --dataset "my-agent-eval"
```

## Score Scale Policy

- Canonical scale is `0-1`.
- Judge prompts may ask model output in `0-10` for readability.
- Runtime must normalize raw scores to `0-1` before thresholds are applied.

## Snapshot Outputs

`export` writes:
- `.claude/eval-infra/<agent>.json`
- `.claude/eval-infra/<agent>.yaml`
- `.claude/agent-eval/<agent>.yaml` (legacy compatibility projection)

## Operational Guidance

1. Keep dataset metadata as source of truth.
2. Keep judge prompt names stable (`judge-*`) for reuse.
3. Treat local files as generated views, not canonical state.
4. Use idempotent setup flows so reruns do not duplicate resources.

## Related References

- `references/eval-infra-schema.md`
- `references/eval-calibration-protocol.md`
