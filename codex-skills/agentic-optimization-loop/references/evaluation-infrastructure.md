# Evaluation Infrastructure (Layer 1)

Purpose: define what exists to measure improvements.

Required components:
- Dataset (tasks with inputs + success criteria)
- Graders (how to score outputs)
- Harness (how to run evaluations)
- Baseline (current measurements)

## Minimal Spec

```yaml
evaluation_infrastructure:
  dataset:
    reference: "<path or dataset name>"
    size: <count>
  graders:
    - name: "<grader name>"
      type: code | model | human
      reference: "<path or system>"
      metric: "<metric name>"
  harness:
    reference: "<path or system>"
  baseline:
    reference: "<run id or location>"
    metrics:
      <metric>: <value>
```

## Readiness Checks

- Dataset has 20+ tasks and covers common + edge cases
- Graders are calibrated or at least consistent
- Harness can run tasks, capture outputs, and aggregate scores
- Baseline is recent and matches current agent configuration
