---
name: evaluation-infrastructure
description: Read-only evaluation contract readiness checks for optimization. Use this skill to validate that eval state from langfuse-analyzer is complete before running /optimize.
version: 2.0.0
---

# Evaluation Infrastructure (Read-Only Contract Mode)

This plugin no longer builds evaluation infrastructure. It consumes canonical eval state produced by `langfuse-analyzer`.

## Ownership Boundary

`langfuse-analyzer` owns:
- dataset and dataset items
- judge prompt lifecycle
- baseline creation and baseline metadata
- canonical eval metadata contract

`agentic-optimization-loop` owns:
- optimization target
- loop execution and decisioning
- read-only retrieval and diagnostics

## Required Contract Inputs

Expected local snapshot path:
- `.claude/eval-infra/<agent>.yaml`
- `.claude/eval-infra/<agent>.json`

Required fields (normalized):
- dataset name (and id when available)
- score_scale = `0-1`
- dimensions with thresholds and weights
- baseline run reference and metrics

## Preflight Procedure

Run before `/optimize`:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

## Fail-Fast Policy

If contract is missing/incomplete:
1. stop optimization immediately
2. print deterministic remediation
3. hand off to analyzer commands

```bash
/agent-eval-infra status --agent <agent> --dataset <dataset>
/agent-eval-setup --agent <agent>
/setup-dataset
```

## Score Semantics

- Canonical decision scale is always `0-1`.
- Any 0-10 representation is display-only and must never drive gating.

## References

- `${CLAUDE_PLUGIN_ROOT}/references/eval-contract.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py`
