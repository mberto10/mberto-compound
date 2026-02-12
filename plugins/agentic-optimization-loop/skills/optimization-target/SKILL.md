---
name: optimization-target
description: Define optimization target from dimensions, signals, and levers with strict 0-1 scoring and guardrails.
version: 2.0.0
---

# Optimization Target

Define what to optimize and what must not regress.

Target and lever scope are persisted directly in:

`/.claude/optimization-loops/<agent>/journal.yaml`

Do not create a separate `target.yaml`.

## Inputs

1. Valid eval contract snapshot (from langfuse-analyzer)
2. Goal statement for the feature/output being optimized

## Journal-Embedded Target Model

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
      soft:
        preferences:
          - "<preference>"

  levers:
    main_knob:
      type: config|prompt|grader|code
      location: "<path/ref>"
    allowed:
      - "<path/ref>"
    frozen:
      - "<path/ref>"
```

## Rules

1. Decision semantics must use canonical `0-1`.
2. At least one hard regression guard must be explicit.
3. Every tuned lever must be in-scope and not frozen.
4. For multi-lever runs, all levers must be declared before experiment starts.
5. All target/levers data must be updated in `journal.yaml` only.

## Output Requirements

Return:
- target summary table
- guardrail summary
- allowed lever map
- explicit pass/fail criteria for keep vs rollback

## Related

- `${CLAUDE_PLUGIN_ROOT}/skills/optimization-loop/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/references/lever-strategy.md`
