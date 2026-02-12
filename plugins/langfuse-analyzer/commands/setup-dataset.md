---
name: setup-dataset
description: Interactive wizard to bootstrap Langfuse dataset + judge infrastructure with eval_infra_v1 metadata
---

# Setup Dataset Wizard

Create or update a dataset and judge prompt set for evaluation workflows.

This command is Langfuse-first:
- Canonical contract is dataset metadata (`eval_infra_v1`)
- Canonical thresholds are `0-1`
- Judge prompts are stored as `judge-*` in Langfuse

## Step 1: Gather Inputs

Use AskUserQuestion to collect:

1. Dataset purpose
- regression
- ab-test
- golden-set
- edge-cases

2. Dimensions
- Names (e.g., accuracy, helpfulness, relevance)
- Threshold per dimension (canonical `0-1`)
- Weight per dimension
- Critical or not

3. Dataset identity
- Dataset name
- Description

4. Agent identity
- Agent name
- Optional entry point/invocation string

## Step 2: Bootstrap Contract

Build dimensions JSON and run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  bootstrap \
  --agent "<agent>" \
  --dataset "<dataset-name>" \
  --entry-point "<entry-point>" \
  --description "<description>" \
  --dimensions '<json-dimensions>'
```

This ensures:
- Dataset exists
- Judge prompts exist (`judge-*`)
- `eval_infra_v1` metadata is present/updated

## Step 3: Add Test Items

Guide user to curate dataset items:

```bash
# Find candidate traces
python3 ${CLAUDE_PLUGIN_ROOT}/skills/data-retrieval/helpers/trace_retriever.py \
  --last 20 --mode minimal

# Add one trace
python3 ${CLAUDE_PLUGIN_ROOT}/skills/dataset-management/helpers/dataset_manager.py \
  add-trace --dataset "<dataset-name>" --trace-id <trace-id>
```

## Step 4: Optional Baseline Run

If task script is available:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  baseline \
  --agent "<agent>" \
  --dataset "<dataset-name>" \
  --task-script ./task.py
```

## Step 5: Export Local Snapshot

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/eval-infrastructure/helpers/eval_infra_manager.py \
  export \
  --agent "<agent>" \
  --dataset "<dataset-name>"
```

## Output

Summarize:
- dataset name/id
- schema version (`eval_infra_v1`)
- score scale (`0-1` canonical)
- dimensions and thresholds
- judge prompt names
- baseline readiness
- snapshot file paths

## Notes

- 0-10 phrasing in judge prompts is acceptable for readability.
- Runtime normalization to `0-1` is required before threshold comparisons.
- Re-running this command should be idempotent.
