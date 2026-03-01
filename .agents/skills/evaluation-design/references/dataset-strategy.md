# Dataset Strategy

A good evaluation dataset is **representative, diverse, and stable**. Use this guide to choose sources and set coverage rules.

## Source Types

- **Production traces**: highest realism, may be noisy.
- **Curated failures**: highest signal for improvement.
- **Synthetic cases**: stress tests and edge coverage.
- **Public benchmarks**: comparability with external baselines.

## Coverage Plan

Define categories and ensure each is represented:

```yaml
coverage:
  - category: "billing issues"
    target_count: 10
  - category: "account access"
    target_count: 10
  - category: "tool errors"
    target_count: 5
  - category: "edge cases"
    target_count: 5
```

## Sizing Guidelines

- Minimum viable: **20–30 items** for a quick loop.
- Stable benchmark: **50–200 items** for reliable measurement.
- Use stratified sampling to avoid skew.

## Refresh Policy

- Add failures after each iteration.
- Retire obsolete cases if product behavior changes.
- Track dataset growth in the optimization journal.
