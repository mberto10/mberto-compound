---
name: optimization-loop
description: Execute one optimization loop with contract-driven evaluation inputs and configurable lever cardinality (single|multi).
version: 2.0.0
---

# Optimization Loop

Run the same loop protocol with configurable lever cardinality.

## Required Inputs

1. Valid eval contract (`.claude/eval-infra/<agent>.yaml|json` + live checks)
2. Optimization target
3. Lever strategy config:
- `lever_mode: single|multi`
- `max_levers: 1..5`

## Loop Protocol (Unchanged)

1. **Diagnose**
- analyze failures and trends against baseline

2. **Hypothesize**
- `single`: exactly 1 lever
- `multi`: 2..N levers, where `N=max_levers`
- all levers must pass boundary checks

3. **Experiment**
- apply proposed lever change-set
- run evaluation

4. **Analyze**
- compare to baseline/previous iteration
- evaluate guardrails and regressions

5. **Compound / Decide**
- keep or rollback using unchanged strict policy
- document learnings

## Strict Policy (Both Modes)

- same thresholds
- same guard checks
- same rollback criteria
- no relaxed policy for multi mode

## Journal Fields (must be written)

```yaml
loop:
  lever_mode: single|multi
  max_levers: 1..5

iterations:
  - lever_set:
      - "<lever>"
    lever_set_size: <N>
    attribution_confidence: high|medium|low
```

## Cloud Prompt Guidance

Use template:
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/references/loop-prompt-template.md`

Ensure prompt includes:
- canonical score scale `0-1`
- lever cardinality policy
- strict guard policy unchanged across modes

## Langfuse Retrieval Helpers (Local to This Plugin)

Use these read-only scripts for in-loop diagnostics:

```bash
# Contract + live object checks
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py \
  resolve --agent "<agent>" --validate-live

# Compare baseline vs candidate run metrics (normalized 0-1)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/run_metrics_reader.py \
  compare --agent "<agent>" --baseline-run "<baseline>" --candidate-run "<candidate>"

# List failing items by dimension/threshold
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/failure_pack_reader.py \
  failures --agent "<agent>" --run-name "<run>" --dimension "<dimension>" --top 20

# Trace-level retrieval parity surface (single trace, last N, filters, modes)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/trace_retriever.py \
  --last 5 --mode io
```

## References

- `${CLAUDE_PLUGIN_ROOT}/references/eval-contract.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/journal-schema.md`
