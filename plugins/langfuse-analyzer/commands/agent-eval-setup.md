---
name: agent-eval-setup
description: Interactively discover, bootstrap, and export Langfuse-first evaluation infrastructure for agent optimization.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Task
  - Bash
arguments:
  - name: action
    description: One of `interactive` (default), `status`, `baseline`, or `export`
    required: false
  - name: agent
    description: Agent name or path to explore (used for contract snapshot lookup)
    required: false
  - name: dataset
    description: Optional dataset name (defaults to <agent>-eval when needed)
    required: false
---

# Agent Evaluation Setup

Set up or manage evaluation infrastructure with **Langfuse as canonical source of truth** and local snapshots for compatibility.

This unified command handles discovery, bootstrapping, baseline testing, and export handoffs.

## Canonical Outputs

- Langfuse dataset metadata (`eval_infra_v1`) is canonical.
- Judge prompts are stored in Langfuse (`judge-*`).
- Local files are generated snapshots/views:
  - `.claude/eval-infra/<agent>.json`
  - `.claude/eval-infra/<agent>.yaml`
  - `.claude/agent-eval/<agent>.yaml` (compatibility projection)

---

## Action: `interactive` (Default)

This action guides the user through End-to-End setup.

### Phase 1: Deep Codebase Discovery & Context

1. Discover the agent entry point and invocation.
2. Scan codebase for tracing implementation, metrics, and metadata keys:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/tracing_context_collector.py \
  scan \
  --agent "<agent>" \
  --root "." \
  --out ".claude/eval-infra/<agent>-tracing-context.json"
```
3. Ask the user (if missing/unclear):
   - What exact output/feature is being optimized?
   - What does success look like (primary objective and target threshold)?
   - What constraints are non-negotiable?
   - What failure modes matter most right now?

### Phase 2: Confirm Setup Inputs

Based on discovery/interview, confirm final parameters:
- Dataset name (default: `<agent>-eval`)
- Dimensions (Name, Threshold `0-1`, Weight, Critical Flag)
- Optional entry-point override for metadata

### Phase 3: Bootstrap Contract & Judges

Create/update the Langfuse metadata and prompts:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  bootstrap \
  --agent "<agent>" \
  --dataset "<dataset>" \
  --entry-point "<entry-point>" \
  --dimensions '<json-dimensions>'
```

Example dimensions JSON:
```json
[
  {"name": "accuracy", "threshold": 0.8, "weight": 1.0, "critical": true},
  {"name": "helpfulness", "threshold": 0.75, "weight": 0.8, "critical": false}
]
```

### Phase 4: Curate Initial Dataset

Help the user find and add traces if the dataset is empty:
```bash
# Find candidate traces
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --mode minimal

# Add one trace
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace --dataset "<dataset-name>" --trace-id <trace-id>
```

### Phase 5: Export Local Snapshot 

Finally, export files to handoff to `/optimize`:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset>"
```

---

## Alternative Actions (CLI Wrappers)

### `status`
Check completeness and contract health without changing anything:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  assess \
  --agent "<agent>" \
  --dataset "<dataset>"
```

### `baseline`
Verify whether baseline metadata and run references are complete (optionally with task script):
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  baseline \
  --agent "<agent>" \
  --dataset "<dataset>" \
  [--task-script ./task.py]
```

### `export`
Regenerate local snapshot and compatibility projections explicitly:
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset>"
```

---

## Output / Summary

When finished, summarize:
- Canonical dataset identifier and dimensions
- Baseline status
- Snapshot paths
- Remind user they can now run `/optimize <agent>`
