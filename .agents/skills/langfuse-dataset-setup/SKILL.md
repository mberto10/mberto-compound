---
name: langfuse-dataset-setup
description: Use when the user wants to set up a new Langfuse dataset with evaluation dimensions, score configs, and judge prompts (LLM-as-judge or human review).
---

# Langfuse Dataset Setup

Guide the user through dataset creation and evaluation configuration.

## Step 1: Gather Requirements

Ask:
- Dataset purpose (regression, A/B, golden set, edge cases)
- Evaluation dimensions (accuracy, helpfulness, relevance, safety, tone, completeness)
- Evaluation method (LLM-as-judge, human review, or both)
- Dataset name, description, and target size

## Step 2: Create Dataset

```bash
python3 ~/.codex/skills/langfuse-dataset-management/scripts/dataset_manager.py \
  create --name "<dataset-name>" --description "<description>" \
  --metadata '{"purpose": "<purpose>", "evaluation_method": "<method>", "dimensions": ["<dims>"]}'
```

## Step 3: Configure Score Types

Have the user create score configs in Langfuse settings.
See `references/score-configs.md` for defaults.

## Step 4: Create Judge Prompts (if LLM-as-judge)

Use `langfuse-prompt-management` and templates from `references/judge-prompts.md`.

## Step 5: Confirm Next Steps

- If the dataset will be populated from traces, use `langfuse-data-retrieval` + `langfuse-dataset-management`.
- If the user has test cases, convert and add them as dataset items.
