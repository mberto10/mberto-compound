# Lever Strategy

Single optimization loop with configurable lever cardinality.

## Modes

### `single`

- Exactly one lever per hypothesis.
- `max_levers` is forced to `1`.
- Preferred when attribution clarity is critical.

### `multi`

- Multiple levers per hypothesis.
- Allowed range: `2..N`, where `N=max_levers`.
- Defaults: `max_levers=3`.
- Hard cap: `max_levers<=5`.
- Requires explicit attribution warning in iteration output.

## Shared Decision Policy

Policy is identical across both modes:
- same guardrails
- same thresholds
- same rollback behavior
- no relaxed standards in `multi` mode

## Journal Fields

```yaml
meta:
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
      - "<lever-id or description>"
    lever_set_size: <N>
    attribution_confidence: high|medium|low
```

All lever strategy configuration is journal-embedded; no separate target config file is required.
