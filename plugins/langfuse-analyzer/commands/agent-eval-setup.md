---
name: agent-eval-setup
description: Set up Langfuse-first evaluation infrastructure for an AI agent through codebase discovery and contract bootstrap
allowed_tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Task
  - Bash
arguments:
  - name: agent
    description: Agent name or path to explore
    required: false
  - name: dataset
    description: Optional dataset name (defaults to <agent>-eval)
    required: false
---

# Agent Evaluation Setup

Set up evaluation infrastructure with **Langfuse as source of truth** and local snapshots for compatibility.

## Canonical Outputs

- Langfuse dataset metadata (`eval_infra_v1`) is canonical.
- Judge prompts are stored in Langfuse (`judge-*`).
- Local files are generated views:
  - `.claude/eval-infra/<agent>.json`
  - `.claude/eval-infra/<agent>.yaml`
  - `.claude/agent-eval/<agent>.yaml` (compatibility projection)

## Phase 1: Deep Codebase Discovery

Keep existing discovery behavior:

1. Discover the agent entry point and invocation.
2. Map flow (LLM calls, tools, routing).
3. Analyze prompts and expected quality behavior.
4. Infer quality dimensions from actual implementation.
5. Locate any existing evaluation assets.

Present findings before setup changes.

## Phase 2: Confirm Setup Inputs

Ask only non-derivable inputs:

- Dataset name (default: `<agent>-eval`)
- Dimension thresholds, weights, critical flags
- Optional known failure categories to prioritize
- Optional entry-point override for metadata

## Phase 3: Bootstrap Contract + Judges

Run:

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

## Phase 4: Optional Baseline Smoke Run

If user provides a task script:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  baseline \
  --agent "<agent>" \
  --dataset "<dataset>" \
  --task-script ./task.py
```

If no task script is available, verify baseline readiness only.

## Phase 5: Export Snapshot + Compatibility File

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset>"
```

## Score Scale Policy

- Canonical thresholds and gating are `0-1`.
- Judges may still reason in `0-10`; runtime normalizes before scoring decisions.

## Output

Return:

- Canonical dataset identifier
- Dimension table (threshold/weight/critical)
- Judge prompt list
- Baseline status
- Snapshot and compatibility file paths

## Compatibility Note

`/agent-eval` users can continue using `.claude/agent-eval/<agent>.yaml`; this file is now generated from canonical Langfuse state.
