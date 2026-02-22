# langfuse-analyzer

Targeted agent engineering plugin focusing on observability, trace/session analysis, and Langfuse-driven evaluation.

## Architecture & Interaction Design

The plugin is structured around three key layers: **Commands**, **Skills**, and **Helpers**.

1. **Commands (The Entry Point)**
   - Markdown files in `commands/` that instruct the LLM on how to guide the user. 
   - These define the explicit logical steps (e.g., Discovery -> Confirmation -> Bootstrap -> Export). They are highly linear schemas used to orchestrate an end-to-end task.

2. **Skills (The Cognitive Framework)**
   - Markdown files in `skills/*/SKILL.md` teach the LLM *how* to perform actions correctly within complex domains (e.g., `langfuse-trace-analysis` or `langfuse-eval-infrastructure`).
   - While a command specifies *what* to do next, a skill gives the LLM the tools, formats, and mental models to execute it successfully.

3. **Helpers (The Deterministic Execution)**
   - Python scripts located inside `skills/*/helpers/` (e.g., `eval_infra_manager.py`, `tracing_context_collector.py`).
   - The LLM cannot natively interface with the Langfuse remote API safely. Instead, commands and skills guide the LLM to run exactly formatted bash invocations of these Python helpers. The helpers securely execute the live environment interactions, read states, and bootstrap Langfuse assets deterministically.

**Data Flow:**
```
User invokes Command: `/agent-eval-setup <agent>`
  -> Command guides LLM to start Phase 1.
  -> LLM uses Skill: `eval-infrastructure` to understand context.
  -> LLM invokes Helper: `tracing_context_collector.py --agent <agent>`
  -> Helper outputs JSON trace context.
  -> LLM reads context, asks user for dataset goals.
  -> LLM invokes Helper: `eval_infra_manager.py bootstrap`
  -> Helper executes secure remote API calls to create Langfuse Metadata.
```

## What this plugin covers

- Langfuse instrumentation and observability
- Trace/session/score analysis
- Prompt and schema management
- Dataset curation and experiment execution
- Evaluation infrastructure setup (`eval_infra_v1`) and compatibility export

## Commands (overview)

| Command | Purpose |
|---|---|
| `agent-eval-setup` | Unified wizard command. Discovers an agent codebase, interacts with the user to curate dimensions, bootstraps the Langfuse dataset (`eval_infra_v1`), validates baselines, and exports the final local handoff snapshots. |
| `agent-eval` | Run evaluation cycles, analyze failures across dimensions and root-causes, and report findings to Linear or Markdown. |

## Skills (overview)

| Skill | Focus |
|---|---|
| `langfuse-agent-advisor` | Strategy and planning for agent quality improvement |
| `langfuse-annotation-manager` | Human annotation and scoring workflows |
| `langfuse-data-retrieval` | Targeted trace retrieval for debugging and analysis (Helper: `trace_retriever.py`) |
| `langfuse-dataset-management` | Dataset creation and trace-to-dataset curation (Helper: `dataset_manager.py`) |
| `langfuse-eval-infrastructure` | Canonical eval contract, judges, baseline, and snapshot export (Helper: `eval_infra_manager.py`) |
| `langfuse-experiment-runner` | Running experiments and analyzing run results |
| `langfuse-instrumentation-setup` | Adding Langfuse traces/spans/generations correctly |
| `langfuse-prompt-management` | Prompt CRUD, versioning, and label promotion |
| `langfuse-schema-validator` | Contract checks between prompt output schema and function schema |
| `langfuse-score-analytics` | Score trends, distributions, and regression detection |
| `langfuse-session-analysis` | Multi-trace session flow and session-level diagnostics |
| `langfuse-trace-analysis` | Root-cause analysis linking traces to code behavior |

## Current Evaluation Architecture (High Level)

- **Source of truth**: Langfuse dataset metadata (`eval_infra_v1`)
- **Judge definitions**: Langfuse prompt registry (`judge-*`)
- **Local handoff snapshots** (created by `agent-eval-setup`, consumed by `agentic-optimization-loop`):
  - `.claude/eval-infra/<agent>.json`
  - `.claude/eval-infra/<agent>.yaml`
  - `.claude/agent-eval/<agent>.yaml` (compatibility projection)

## Key References

- `references/eval-infra-schema.md`
- `references/eval-calibration-protocol.md`
