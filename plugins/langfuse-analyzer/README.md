# langfuse-analyzer

Overview of the plugin surface area for Langfuse-based agent engineering workflows.

## What this plugin covers

- Langfuse instrumentation and observability
- Trace/session/score analysis
- Prompt and schema management
- Dataset curation and experiment execution
- Evaluation infrastructure setup (`eval_infra_v1`) and compatibility export

## Commands (overview)

| Command | Purpose |
|---|---|
| `agent-eval-init` | Interview + tracing-context scan to generate an initial eval-infra planning doc |
| `optimize-bootstrap` | Bootstrap optimization prerequisites and export eval handoff snapshot for `/optimize` |
| `agent-eval-infra` | Inspect/bootstrap/export Langfuse-first evaluation infrastructure |
| `agent-eval-setup` | Discover an agent and set up eval infrastructure end-to-end |
| `agent-eval` | Run evaluation cycles, analyze failures, and report findings |
| `setup-dataset` | Interactive dataset + judge bootstrap with `eval_infra_v1` metadata |

## Skills (overview)

| Skill | Focus |
|---|---|
| `langfuse-agent-advisor` | Strategy and planning for agent quality improvement |
| `langfuse-annotation-manager` | Human annotation and scoring workflows |
| `langfuse-data-retrieval` | Targeted trace retrieval for debugging and analysis |
| `langfuse-dataset-management` | Dataset creation and trace-to-dataset curation |
| `langfuse-eval-infrastructure` | Canonical eval contract, judges, baseline, and snapshot export |
| `langfuse-experiment-runner` | Running experiments and analyzing run results |
| `Langfuse Instrumentation Setup` | Adding Langfuse traces/spans/generations correctly |
| `langfuse-prompt-management` | Prompt CRUD, versioning, and label promotion |
| `langfuse-schema-validator` | Contract checks between prompt output schema and function schema |
| `langfuse-score-analytics` | Score trends, distributions, and regression detection |
| `langfuse-session-analysis` | Multi-trace session flow and session-level diagnostics |
| `langfuse-trace-analysis` | Root-cause analysis linking traces to code behavior |

## Key references

- `references/eval-infra-schema.md`
- `references/eval-calibration-protocol.md`

## Current evaluation architecture (high level)

- Source of truth: Langfuse dataset metadata (`eval_infra_v1`)
- Judge definitions: Langfuse prompt registry (`judge-*`)
- Local handoff snapshots:
  - `.claude/eval-infra/<agent>.json`
  - `.claude/eval-infra/<agent>.yaml`
  - `.claude/agent-eval/<agent>.yaml` (compatibility projection)
