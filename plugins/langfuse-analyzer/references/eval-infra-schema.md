# Eval Infrastructure Schema (`eval_infra_v1`)

This schema defines the canonical evaluation-infrastructure contract stored in Langfuse dataset metadata.

## JSON Shape

```json
{
  "schema_version": "eval_infra_v1",
  "agent": {
    "name": "string",
    "entry_point": "string"
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

## Field Semantics

- `schema_version`: Must be `eval_infra_v1`.
- `agent`: Identity and invocation context for downstream loop tools.
- `score_scale`: Canonical normalization scale. Always `0-1` in this version.
- `dimensions[]`: Evaluation dimensions and guardrails.
  - `threshold` is canonicalized to `0-1`.
  - `judge_prompt` points to Langfuse prompt names.
- `judge_prompts[]`: Denormalized prompt list for quick checks.
- `baseline`: Baseline run marker and metrics used by optimization loops.
- `status`: Readiness booleans for orchestration checks.

## Validation Rules

1. `schema_version` must equal `eval_infra_v1`.
2. `score_scale` must equal `0-1`.
3. Each dimension must include `name`, `judge_prompt`, and numeric `threshold` in `[0,1]`.
4. `baseline_ready=true` requires:
- non-empty `baseline.run_name`
- non-empty `baseline.metrics`
- run existence in dataset runs
5. `judges_ready=true` requires all `judge_prompts` to exist in Langfuse.

## Snapshot Contract

Derived snapshot files (`.claude/eval-infra/<agent>.json|yaml`) are generated views and must not be treated as canonical state.
