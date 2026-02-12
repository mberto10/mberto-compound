---
name: agent-eval-infra
description: Inspect, bootstrap, and export Langfuse-first evaluation infrastructure for agent optimization workflows
allowed_tools:
  - Read
  - Write
  - Bash
arguments:
  - name: action
    description: One of status, bootstrap, baseline, export
    required: true
  - name: agent
    description: Agent name used in metadata and snapshot files
    required: true
  - name: dataset
    description: Langfuse dataset name holding eval_infra_v1 metadata
    required: true
---

# Agent Eval Infra

Manage evaluation infrastructure in Langfuse while preserving compatibility exports for downstream loop tooling.

## Canonical Source of Truth

Langfuse dataset metadata (`eval_infra_v1`) is canonical.

Generated local files are snapshots:
- `.claude/eval-infra/<agent>.json`
- `.claude/eval-infra/<agent>.yaml`
- `.claude/agent-eval/<agent>.yaml` (compat)

## Usage Patterns

### 1. Status

Check completeness and contract health:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  assess \
  --agent "<agent>" \
  --dataset "<dataset>"
```

### 2. Bootstrap

Create/update dataset contract and ensure judge prompts exist.

Ask user for dimensions (name, threshold, weight, critical), then run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  bootstrap \
  --agent "<agent>" \
  --dataset "<dataset>" \
  --dimensions '[{"name":"accuracy","threshold":0.8,"weight":1.0,"critical":true}]'
```

### 3. Baseline Verification

Verify whether baseline metadata and run references are complete:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  baseline \
  --agent "<agent>" \
  --dataset "<dataset>"
```

Optional execution with task script:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  baseline \
  --agent "<agent>" \
  --dataset "<dataset>" \
  --task-script ./task.py
```

### 4. Export Snapshot

Regenerate local snapshot + compatibility projection:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset>"
```

## Score Policy

- Canonical thresholds are `0-1`.
- Judges may still reason in `0-10` and are normalized at runtime.
- UI summaries can show both scales, but gating uses `0-1`.

## Output

Return:
- Contract readiness (`dataset_ready`, `judges_ready`, `baseline_ready`)
- Missing prompts or metadata fields
- Snapshot export paths when generated
