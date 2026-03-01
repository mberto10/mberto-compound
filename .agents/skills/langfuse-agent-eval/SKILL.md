---
name: langfuse-agent-eval
description: Use when the user wants to run an evaluation cycle: execute a Langfuse experiment, analyze failures, compare cycles, and document findings.
---

# Langfuse Agent Eval

Run an evaluation cycle and document findings. Do not auto-apply fixes.

## Inputs

- Agent name (must have `.codex/agent-eval/<agent>.yaml` from setup)
- Optional cycle number and output target

## Phase 1: Run Experiment

Use `langfuse-experiment-runner` to run the dataset with configured judges.

## Phase 2: Analyze Failures

- Group failures by dimension and symptom.
- Use `langfuse-trace-analysis` for root cause on 2-3 representative failures.
- Compare against successful traces with similar inputs.

## Phase 3: Recommendations

For each pattern:
- Specific fix recommendation
- Location (file path or Langfuse prompt)
- Expected impact and complexity

## Phase 4: Document

Preferred output:
- Linear project and issues if MCP Linear is available and the user wants it.

Fallback:
- Write `.codex/agent-eval/<agent>/reports/cycle-<N>.md` with:
  - Summary
  - Findings
  - Root causes
  - Recommendations
  - Appendix (trace links and IDs)

## Skill Dependencies

- `langfuse-experiment-runner`
- `langfuse-trace-analysis`
- `langfuse-data-retrieval`
- `langfuse-score-analytics`
