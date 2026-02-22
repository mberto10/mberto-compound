# Agentic Optimization Loop

Contract-driven optimization controller for iterative AI-agent improvement.

This plugin no longer owns evaluation setup. It consumes canonical evaluation state prepared by `langfuse-analyzer` and runs a strict optimization loop.

## Architecture & Interaction Design

The plugin is structured around three key layers: **Commands**, **Skills**, and **Helpers**.

1. **Commands (The Entry Point)**
   - Files like `commands/optimize.md` provide the UX flow for the user. They tell the LLM (like Claude or Codex) how to behave when a user types `/optimize`.
   - The command script orchestrates preflight checks, resolves inputs, handles routing, and invokes the underlying skill for execution.

2. **Skills (The Cognitive Framework)**
   - Files like `skills/optimization-controller/SKILL.md` hold the actual "brains" of the loop.
   - When the `optimize` command runs, it instructs the LLM to follow the constraints, constraints, and multi-phase loop format (Init -> Hypothesize -> Experiment -> Analyze -> Compound) defined in the skill. The skill dictates the *logic* of the optimization.

3. **Helpers (The Deterministic Execution)**
   - Python scripts in `skills/optimization-controller/helpers/` (e.g., `contract_resolver.py`, `trace_retriever.py`, `run_metrics_reader.py`).
   - The LLM relies on these helpers to securely and deterministically fetch data from Langfuse or validate states without hallucinating API calls or missing required fields. The skills explicitly tell the LLM which helper bash commands to run to get factual loop context.

**Data Flow:**
```
Langfuse Analyzer (eval setup owner)
  -> exports .claude/eval-infra/<agent>.yaml|json
  -> stores canonical state in Langfuse metadata/prompts/runs

Agentic Optimization Loop (this plugin)
  Command: `/optimize <agent>`
    -> invokes Helper: `contract_resolver.py` to validate contract snapshot + live identifiers
    -> activates Skill: `optimization-controller`
       -> runs init -> hypothesize -> experiment -> analyze -> compound
       -> invokes Helpers: `trace_retriever.py`, `run_metrics_reader.py` during diagnosis
```

## Core Concepts

| Concept | Meaning |
|---|---|
| Goal | What metric/outcome to improve |
| Dimensions | Quality facets to optimize (e.g. correctness, safety) |
| Signals | Measurable scores/metrics for each dimension (canonical 0-1) |
| Levers | What can change (config/prompt/grader/code) |
| Guards | Hard regression boundaries; violations trigger rollback |
| Slices | Segment-level checks to avoid hidden regressions |

## Lever Strategy

Single loop, configurable lever cardinality:

- `single` mode: exactly 1 lever per iteration
- `multi` mode: 2..N levers per iteration
- default for `multi`: `N=3`
- hard cap: `N=5`

Decision policy is unchanged across both modes (same strict guards and rollback criteria).

## Unified Command

### `/optimize [action] [agent]`

Unified entry point supporting execution, status monitoring, and cloud prompting:

- `action=run` (default): Executes the optimization loop locally. Supports `--lever-mode` (`single|multi`) and `--max-levers`.
- `action=status`: Output a read-only journal progress dump, showing phase, lever strategy, and targets.
- `action=cloud`: Generate cloud execution prompts with explicit lever cardinality policy and strict guard instructions.

*(Eval setup now lives in the `langfuse-analyzer` plugin under `/agent-eval-setup`)*

## Minimal State Model

This plugin operates with only two files:

1. **Eval handoff snapshot (read-only):**
   - `.claude/eval-infra/<agent>.yaml|json`
2. **Optimization state (read/write):**
   - `.claude/optimization-loops/<agent>/journal.yaml`

Target definition and lever scope are stored directly in `journal.yaml` under `meta.target` and `meta.levers`. No separate `target.yaml` is required. Additional fields include lever limits (`loop.lever_mode`, `loop.max_levers`) and iteration history (`lever_set_size`, `attribution_confidence`).

## Local Langfuse Helper Surface

Helpers live in:
`plugins/agentic-optimization-loop/skills/optimization-controller/helpers/`

- `contract_resolver.py`: contract load + live Langfuse object validation
- `run_metrics_reader.py`: baseline/candidate comparison (normalized)
- `failure_pack_reader.py`: low-scoring item extraction for diagnosis
- `trace_retriever.py`: trace-by-id, last-N, metadata/tag/time filters, score filters, and modes
- `langfuse_client.py`: local auth client + connection test
