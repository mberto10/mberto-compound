---
name: optimize
description: Start or continue the optimization loop for an AI agent with contract preflight and configurable lever tuning cardinality.
arguments:
  - name: agent
    description: Agent name (used for journal and eval contract file lookup)
    required: false
  - name: phase
    description: Optional forced phase (init, hypothesize, experiment, analyze, compound)
    required: false
  - name: lever-mode
    description: Lever strategy for hypothesis scope: single or multi
    required: false
  - name: max-levers
    description: Maximum levers allowed when lever-mode=multi (1..5)
    required: false
---

# Optimize Command

Run one optimization loop with persistent journal state and strict contract preflight.

## Step 1: Resolve Inputs

Determine:
- `agent` (ask if missing)
- `lever_mode` (default `single`)
- `max_levers`

Rules:
- `single` => force `max_levers=1`
- `multi` => default `max_levers=3`
- hard validation: `1 <= max_levers <= 5`

If validation fails, stop with a deterministic remediation message.

## Step 2: Contract Preflight (Required)

Before phase routing, resolve and validate external eval contract:

1. Local snapshot first:
- `.claude/eval-infra/<agent>.yaml`
- `.claude/eval-infra/<agent>.json`

2. Live validation (Langfuse identifiers):

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

If preflight fails:
- do not run optimization phases
- output fail-fast summary + exact handoff commands:

```bash
# Example handoff
/agent-eval-infra status --agent <agent> --dataset <dataset>
/agent-eval-setup --agent <agent>
```

## Step 3: Load Journal State

Journal path:

```
.claude/optimization-loops/<agent>/journal.yaml
```

Behavior:
- if journal exists, load and infer defaults for missing new fields
- if journal missing, initialize journal with `loop.lever_mode` and `loop.max_levers`
- target and lever scope must live in this same journal file (no separate target config file)

Backward-compatible defaults for old journals:
- `loop.lever_mode: single`
- `loop.max_levers: 1`

### Target + Lever Scope Persistence

Maintain optimization definition directly in journal metadata:

```yaml
meta:
  target:
    metric: "<primary metric>"
    current: <0-1>
    goal: <0-1>
    dimensions:
      - name: "<dimension>"
        signal: "<signal>"
        threshold: <0-1>
        weight: <number>
        critical: <true|false>
  levers:
    main_knob:
      type: config|prompt|grader|code
      location: "<path/ref>"
    allowed:
      - "<surgical lever path/ref>"
    frozen:
      - "<immutable path/ref>"
```

Rules:
- never create or require a separate `target.yaml`
- if `meta.target` or `meta.levers` is missing, collect once and persist to journal
- all hypothesis lever choices must be subsets of `meta.levers.allowed` and outside `meta.levers.frozen`

## Step 4: Determine Phase

Same phase flow as before:
- init
- hypothesize
- experiment
- analyze
- compound

If `phase` argument is provided, allow override with warning.

## Step 5: Execute Phase (Unchanged Loop Semantics)

Use:

```text
${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/SKILL.md
```

### Lever-specific hypothesis rule

During HYPOTHESIZE only:
- `single`: propose exactly one lever change
- `multi`: propose a lever set with size `2..max_levers`

Always record:
- `iterations[].lever_set`
- `iterations[].lever_set_size`
- `iterations[].attribution_confidence`

Decision policy stays identical in both modes:
- same strict guards
- same rollback rules
- same thresholds

For deeper diagnosis inside analyze/compound, use local read-only retrieval helpers:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/trace_retriever.py --trace-id <trace_id> --mode io
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/trace_retriever.py --last 10 --filter-field candidate_id --filter-value <candidate> --mode flow
```

## Step 6: Persist State

After each phase:
1. update `current_phase`
2. update current iteration block
3. write journal back

Ensure new loop fields are preserved:

```yaml
loop:
  lever_mode: single|multi
  max_levers: 1..5
```

## Step 7: Report

Output:
- current phase and next phase
- lever mode and max levers
- lever scope summary (main knob, allowed, frozen)
- guard status summary
- next action

## Error Handling

- Contract missing/incomplete => fail fast + handoff
- Lever-mode/max-levers invalid => fail fast + correction hint
- Langfuse unavailable => report and stop
- Journal parse failure => advise backup/rebuild path
