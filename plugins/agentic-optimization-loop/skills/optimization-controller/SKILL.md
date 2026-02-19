---
name: optimization-controller
description: Single point of entry for exactly running the `/optimize` command. Defines the journal schema, the 5-phase execution loop, lever-tuning strategies (single vs multi), and the strict evaluation preflight.
version: 2.0.0
---

# Optimization Controller

The `agentic-optimization-loop` operates in a rigid, strict contract with `langfuse-analyzer`. All dataset, baseline, and judge definitions belong to `langfuse-analyzer`.

This skill provides the authoritative protocol for **Iterating**, **Reporting**, and **Deciding** on agent performance improvements.

## 1. Zero-State Policy

This plugin requires minimal state configuration. Do NOT create a `target.yaml` file. 
All optimization targets, boundaries, and historical iterations exist strictly inside the run journal:
`/.claude/optimization-loops/<agent>/journal.yaml`

If fields are missing in an existing journal, initialize them with backward-compatible defaults (`loop.lever_mode: single`, `loop.max_levers: 1`).

## 2. Preflight Checks (Mandatory)

Before executing ANY optimization phases, you must resolve the eval contract snapshot + live identifiers.

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

If the preflight fails due to missing contracts or datasets:
1. Stop the optimization immediately.
2. Output a deterministic fix-it message telling the user to run `/agent-eval-infra status` or `/agent-eval-setup`.

## 3. Persistent Journal Schema

You must maintain the following target metadata and execution history inside the `journal.yaml`:

```yaml
meta:
  target:
    metric: "<primary metric>"
    current: <0-1>
    goal: <0-1>
    dimensions:
      - name: "<dimension>"
        signal: "<score/metric name>"
        threshold: <0-1>
        weight: <number>
        critical: <true|false>
    constraints:
      hard:
        boundaries:
          - path: "<immutable path>"
        regressions:
          - metric: "<metric>"
            threshold: <0-1 or explicit constraint>
            
  levers:
    main_knob:
      type: config|prompt|grader|code
      location: "<path/ref>"
    allowed:
      - "<path/ref>"
    frozen:
      - "<path/ref>"
      
loop:
  lever_mode: single|multi
  max_levers: 1..5

iterations:
  - lever_set:
      - "<lever>"
    lever_set_size: <N>
    attribution_confidence: high|medium|low
```

## 4. Phase Execution Protocol

Run through these phases sequentially. NEVER skip phases or attempt to combine them into single prompt outputs without explicit permission.

### Phase 1: Diagnose
Analyze failures and trends against the baseline. 
**Goal:** Understand what is broken before changing anything.

### Phase 2: Hypothesize
Propose changes to levers. All lever proposals MUST fall within the `meta.levers.allowed` boundaries and NOT in `meta.levers.frozen`.
- **single mode**: Propose EXACTLY ONE lever.
- **multi mode**: Propose a set of levers of size 2 to `N` (where N is `loop.max_levers`).

### Phase 3: Experiment
Apply the proposed lever change(s) directly to the code/prompts.
Execute the evaluation run.

### Phase 4: Analyze
Use the analysis tools to investigate failures, compare results against the baseline (`0-1` normalized score), and check for regression boundaries constraint violations.

### Phase 5: Compound (Decision & Rollback)
Determine if the iteration is a KEEP or a ROLLBACK.
- Any regression guard failure -> Immediate ROLLBACK.
- Any strict guard violation -> Immediate ROLLBACK.
- Only KEEP if the primary target metric improved without regressing critical dimensions.
*There is NO relaxed policy for `multi` mode.*

## 5. Local Read-Only Diagnostic Helpers

During the `Diagnose` and `Analyze` phases, use these provided local read-only scripts to explore the latest metrics and traces:

```bash
# Compare baseline vs candidate run metrics
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/run_metrics_reader.py \
  compare --agent "<agent>" --baseline-run "<baseline>" --candidate-run "<candidate>"

# Get the failing items by dimension
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/failure_pack_reader.py \
  failures --agent "<agent>" --run-name "<run>" --dimension "<dimension>" --top 20

# Trace-level parity retrieval (useful for the optimization-analyst agent)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/trace_retriever.py \
  --last 5 --mode io
```

## 6. References

- `${CLAUDE_PLUGIN_ROOT}/references/eval-contract.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/references/loop-prompt-template.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/references/journal-schema.md`
