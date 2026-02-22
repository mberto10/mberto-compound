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

**Auto-advance is the default.** Execute all phases sequentially within a single invocation. At confirmation gates (after HYPOTHESIZE and after ANALYZE), ask the user inline and continue upon approval.

> **Anti-pattern:** Do NOT end your turn between phases. Do NOT output "run /optimize again" or similar. Do NOT interpret "wait for confirmation" as "stop and let the user re-invoke."
> **Correct pattern:** At each gate, use AskUserQuestion (or a direct inline prompt) to get approval, then continue to the next phase within the same conversation turn.

### Phase 1: Diagnose
Analyze failures and trends against the baseline.
**Goal:** Understand what is broken before changing anything.
After completing this phase, persist to journal and **proceed immediately to Phase 2**.

### Phase 2: Hypothesize
> Before proposing lever changes, retrieve per-item grader scores with `trace_retriever.py --dataset-run <run> --dataset <dataset>` to identify which dimensions are underperforming and on which items.

Propose changes to levers. All lever proposals MUST fall within the `meta.levers.allowed` boundaries and NOT in `meta.levers.frozen`.
- **single mode**: Propose EXACTLY ONE lever.
- **multi mode**: Propose a set of levers of size 2 to `N` (where N is `loop.max_levers`).

After documenting the hypothesis in the journal, present it to the user and ask for approval or revision. ⛔ **GATE** — **Do not end your turn or ask the user to re-run the command.** Use an inline question (e.g. AskUserQuestion or direct prompt) and continue to Phase 3 upon approval. If the user requests revision, revise the hypothesis and ask again (stay in Phase 2).

### Phase 3: Experiment
Apply the proposed lever change(s) directly to the code/prompts.
Execute the evaluation run.
After completing this phase, persist results to journal and **proceed immediately to Phase 4**.

### Phase 4: Analyze
Use the analysis tools to investigate failures, compare results against the baseline (`0-1` normalized score), and check for regression boundaries constraint violations.

After completing analysis, present the keep/rollback recommendation and ask the user to confirm. ⛔ **GATE** — **Do not end your turn or ask the user to re-run the command.** Use an inline question (e.g. AskUserQuestion or direct prompt) and continue to Phase 5 upon confirmation.

### Phase 5: Compound (Decision & Rollback)
Determine if the iteration is a KEEP or a ROLLBACK.
- Any regression guard failure -> Immediate ROLLBACK.
- Any strict guard violation -> Immediate ROLLBACK.
- Only KEEP if the primary target metric improved without regressing critical dimensions.
*There is NO relaxed policy for `multi` mode.*
After completing this phase, persist to journal. If decision=continue, **proceed immediately to Phase 2** for the next iteration (do not ask the user to re-run). If decision=graduate, output the final iteration summary with metrics journey and end.

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

# Get per-item grader scores for a dataset run (HYPOTHESIZE phase diagnosis)
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/helpers/trace_retriever.py \
  --dataset-run "<baseline_run_name>" --dataset "<dataset_name>"
```

## 5a. Score Retrieval Reference

The `--dataset-run` flag on `trace_retriever.py` outputs raw JSON (ignores `--mode`). Use it to fetch per-item grader scores for any dataset run.

**Output schema:**
```json
{
  "dataset": "<dataset_name>",
  "run_name": "<run_name>",
  "item_count": <N>,
  "items": [
    {
      "dataset_item_id": "<id>",
      "trace_id": "<trace_id>",
      "scores": [
        { "name": "<score_name>", "value": <float> }
      ]
    }
  ]
}
```

**Score → dimension mapping:** Each `scores[].name` corresponds to `meta.target.dimensions[].signal` in the journal. For example, if the journal has `signal: "relevance_score"`, the matching score entry will have `"name": "relevance_score"`.

**Empty scores:** When an item has `"scores": []`, grading has not yet completed for that trace. Re-run the evaluation with `ENABLE_GRADING=true` to populate scores.

## 6. References

- `${CLAUDE_PLUGIN_ROOT}/references/eval-contract.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/references/loop-prompt-template.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-controller/references/journal-schema.md`
