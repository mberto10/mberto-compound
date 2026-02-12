---
name: optimization-craft
description: Methodology for running /optimize with contract preflight, persistent journaling, and configurable single|multi lever tuning.
version: 2.0.0
---

# Optimization Craft

Use this skill when running `/optimize`.

## Preflight First (Mandatory)

Before any phase execution:
1. Resolve agent and lever strategy args.
2. Validate eval contract snapshot + live identifiers.
3. Fail fast and hand off if eval contract is incomplete.

Command:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/helpers/contract_resolver.py \
  resolve \
  --agent "<agent>" \
  --validate-live
```

## Loop Flow (Same Phases)

1. Initialize
2. Hypothesize
3. Experiment
4. Analyze
5. Compound

Do not introduce new loop modes.

## Lever Strategy Rule

### single mode
- hypothesis must include exactly one lever
- `max_levers` is forced to `1`

### multi mode
- hypothesis may include 2..N levers
- N defaults to `3` and must be `<=5`
- still enforce same strict guard/rollback policy

## Decision Policy

Unchanged across strategies:
- guard violations => rollback
- regression guard failures => rollback
- only keep when improvement passes existing criteria

## Journal Expectations

Persist:
- `meta.target` (goal, dimensions, constraints)
- `meta.levers` (main knob, allowed, frozen)
- `loop.lever_mode`
- `loop.max_levers`
- `iterations[].lever_set`
- `iterations[].lever_set_size`
- `iterations[].attribution_confidence`

State model rule:
- keep all optimization state in `/.claude/optimization-loops/<agent>/journal.yaml`
- do not create separate optimization config files

Backward compatibility:
- if fields are missing, infer `single` + `1`

## Contract-Handoff Behavior

If contract fails:
- stop optimization
- provide exact next commands:

```bash
/agent-eval-infra status --agent <agent> --dataset <dataset>
/agent-eval-setup --agent <agent>
```

## References

- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-craft/references/journal-schema.md`
- `${CLAUDE_PLUGIN_ROOT}/references/eval-contract.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
