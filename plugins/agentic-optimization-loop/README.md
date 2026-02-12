# Agentic Optimization Loop

Contract-driven optimization controller for iterative AI-agent improvement.

This plugin no longer owns evaluation setup. It consumes canonical evaluation state prepared by `langfuse-analyzer` and runs a strict optimization loop.

## Architecture

```
Langfuse Analyzer (eval setup owner)
  -> exports .claude/eval-infra/<agent>.yaml|json
  -> stores canonical state in Langfuse metadata/prompts/runs

Agentic Optimization Loop (this plugin)
  -> validates contract snapshot + live identifiers
  -> defines optimization target (dimensions/signals/levers)
  -> runs init -> hypothesize -> experiment -> analyze -> compound
  -> performs diagnosis during analyze and decision in compound
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

## Commands

### `/optimize [agent]`

Primary interactive loop command.

New arguments:
- `--lever-mode single|multi` (default `single`)
- `--max-levers N` (`1..5`; default `1` for single, `3` for multi)

### `/optimize-status [agent]`

Read-only status including lever strategy fields (`lever_mode`, `max_levers`, `current_lever_set_size`).

### `/cloud-optimize [iterations]`

Generate cloud execution prompts with explicit lever cardinality policy and strict guard instructions.

### Eval Bootstrap

Optimization bootstrap/setup now lives in `langfuse-analyzer` via `/optimize-bootstrap`.

## Contract Dependency

Expected local contract snapshot path:

- `.claude/eval-infra/<agent>.yaml`
- `.claude/eval-infra/<agent>.json`

`/optimize` fails fast if contract is missing/incomplete or live identifiers do not validate.

See:
- `references/eval-contract.md`
- `references/lever-strategy.md`

## Minimal State Model

This plugin should operate with only two files:

1. **Eval handoff snapshot (read-only):**
   - `.claude/eval-infra/<agent>.yaml|json`
2. **Optimization state (read/write):**
   - `.claude/optimization-loops/<agent>/journal.yaml`

Target definition and lever scope are stored directly in `journal.yaml` under `meta.target` and `meta.levers`.
No separate `target.yaml` is required.

## Journal State

State remains in:

```
.claude/optimization-loops/<agent>/journal.yaml
```

Additional fields:
- `loop.lever_mode`
- `loop.max_levers`
- `iterations[].lever_set`
- `iterations[].lever_set_size`
- `iterations[].attribution_confidence`
- `meta.target` (goal/dimensions/constraints)
- `meta.levers` (main knob, allowed scope, frozen scope)

## Notes

- Canonical score semantics are `0-1` for gating and decisions.
- Any `0-10` representation is display-only and non-authoritative.
- This plugin is read-only with respect to evaluation infrastructure objects.

## Local Langfuse Helper Surface

Helpers live in:

`/Users/max/mberto-compound/plugins/agentic-optimization-loop/skills/optimization-loop/helpers/`

- `contract_resolver.py`: contract load + live Langfuse object validation
- `run_metrics_reader.py`: baseline/candidate comparison (normalized)
- `failure_pack_reader.py`: low-scoring item extraction for diagnosis
- `trace_retriever.py`: trace-by-id, last-N, metadata/tag/time filters, score filters, and modes (`minimal|io|prompts|flow|full`)
- `langfuse_client.py`: local auth client + connection test
