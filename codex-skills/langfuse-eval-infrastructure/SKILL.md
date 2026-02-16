---
name: langfuse-eval-infrastructure
description: Use when the user asks to set up or validate Langfuse evaluation infrastructure, bootstrap dataset and judges, define eval dimensions, run baseline readiness checks, or export eval contract snapshots for optimization loops.
---

# Langfuse Eval Infrastructure

Establish and maintain a Langfuse-first evaluation contract for agent optimization workflows.

## Canonical Contract

Source of truth is dataset metadata schema `eval_infra_v1` in Langfuse.

## Core Commands

```bash
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/eval_infra_manager.py assess --agent "my-agent" --dataset "my-agent-eval"
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/eval_infra_manager.py bootstrap --agent "my-agent" --dataset "my-agent-eval" --dimensions '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]'
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/eval_infra_manager.py ensure-judges --dataset "my-agent-eval" --dimensions '[{"name":"accuracy"}]'
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/eval_infra_manager.py baseline --agent "my-agent" --dataset "my-agent-eval" --task-script ./task.py
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/eval_infra_manager.py export --agent "my-agent" --dataset "my-agent-eval"
```

## Tracing Context Collection

```bash
python3 ~/.codex/skills/langfuse-eval-infrastructure/scripts/tracing_context_collector.py scan --agent "my-agent" --root "."
```

## Score Policy

- Canonical thresholds and gating use `0-1`.
- Judge prompts may reason in `0-10`; runtime normalization to `0-1` is required before threshold checks.

## Snapshot Outputs

`export` writes:
- `.claude/eval-infra/<agent>.json`
- `.claude/eval-infra/<agent>.yaml`
- `.claude/agent-eval/<agent>.yaml` (compat)

## Operational Rules

1. Keep dataset metadata as source of truth.
2. Keep judge prompt names stable (`judge-*`).
3. Treat local snapshot files as generated artifacts.
4. Prefer idempotent reruns (safe bootstrap/ensure/export).

## References

- `references/eval-infra-schema.md`
- `references/eval-calibration-protocol.md`
