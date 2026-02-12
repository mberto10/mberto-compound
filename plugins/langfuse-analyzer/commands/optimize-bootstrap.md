---
name: optimize-bootstrap
description: Bootstrap optimization prerequisites by setting up or validating Langfuse evaluation infrastructure and exporting the handoff snapshot.
arguments:
  - name: agent
    description: Agent name used for contract snapshot and eval setup
    required: false
  - name: dataset
    description: Optional dataset name (defaults to <agent>-eval when needed)
    required: false
---

# Optimize Bootstrap

Prepare everything needed for `/optimize` by ensuring Langfuse evaluation infrastructure is complete and exported.

This command is now owned by `langfuse-analyzer`.

## Step 1: Determine Inputs

Gather:
- `agent` name
- `dataset` name (optional; default `<agent>-eval`)

## Step 2: Check Current Infra Status

Run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  assess \
  --agent "<agent>" \
  --dataset "<dataset>"
```

## Step 3: Bootstrap if Needed

If status is incomplete (missing metadata, judges, baseline readiness), run:

```bash
/agent-eval-setup --agent "<agent>" --dataset "<dataset>"
```

For dataset/judge-focused setup:

```bash
/setup-dataset
```

## Step 4: Export Handoff Snapshot

Always export/update local handoff files:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset>"
```

## Step 5: Return Next Command

When bootstrap is complete, return:

```bash
/optimize <agent>
```

## Output Requirements

Summarize:
- dataset + schema readiness
- judges readiness
- baseline readiness
- exported file paths:
  - `.claude/eval-infra/<agent>.json`
  - `.claude/eval-infra/<agent>.yaml`
  - `.claude/agent-eval/<agent>.yaml` (compat)
