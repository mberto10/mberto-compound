---
name: langfuse-agent-eval-setup
description: Use when the user wants to set up an evaluation pipeline for an agent: discover the agent flow, define quality dimensions, create a dataset, create judge prompts, and generate a local eval config.
---

# Langfuse Agent Eval Setup

Set up evaluation for an agent by exploring the codebase, defining dimensions, and creating Langfuse assets.

## Phase 1: Explore the Agent

1. Find the entry point (search for agent, main, or serve functions).
2. Trace the execution flow (LLM calls, tools, routing logic).
3. Extract prompt instructions and output format requirements.
4. Identify inputs, outputs, and variations.
5. Infer quality dimensions from prompts and logic.
6. Check for existing evals or datasets.

Document findings before asking questions.

## Phase 2: Confirm With the User

Ask only what cannot be inferred:
- Confirm dimensions and weights.
- Set per-dimension thresholds.
- Choose dataset source (production traces, test cases, synthetic, user-provided).
- Collect known failure cases.

## Phase 3: Create Langfuse Assets

- Use `langfuse-data-retrieval` to find traces (if using production data).
- Use `langfuse-dataset-management` to create and populate the dataset.
- Use `langfuse-prompt-management` to create judge prompts.

## Phase 4: Generate Config

Write `.codex/agent-eval/<agent>.yaml`:

```yaml
agent:
  name: "<name>"
  path: "<path>"
  entry_point: "<how to run>"
  components:
    prompts: ["..."]
    tools: ["..."]

evaluation:
  dataset: "<dataset-name>"
  dimensions:
    - name: "accuracy"
      judge: "langfuse://prompts/judge-accuracy"
      threshold: 8.0
      weight: 1
      critical: true

output:
  local_path: ".codex/agent-eval/<agent>/reports/"
```

## Phase 5: Smoke Test

Run a single dataset item with the experiment runner and confirm scores appear.
