# Metric Framework

Use this framework to pick metrics that are stable, meaningful, and aligned with user value.

## Metric Types

1. **Primary metric**
   - The single headline measure of success.
   - Must map directly to the agent’s core objective.
   - Examples: task completion rate, accuracy, resolution rate.

2. **Constraint metrics**
   - Metrics that must not regress.
   - Examples: latency p95, cost per task, safety violations.

3. **Secondary metrics**
   - Useful indicators that support diagnosis.
   - Examples: helpfulness rating, readability, coverage.

## Selection Rules

- Prefer **objective** signals when possible (pass/fail, structured checks).
- Keep the **primary** metric singular to avoid ambiguity.
- Make constraints **explicit** and non-negotiable.
- Use secondary metrics to explain changes, not to declare success.

## Example Matrix

```yaml
metrics:
  primary:
    - name: resolution_accuracy
      definition: "Correct routing + correct response provided"
      scale: percentage
  constraints:
    - name: latency_p95
      limit: "< 4s"
      reason: "User experience"
    - name: cost_avg
      limit: "< $0.03"
      reason: "Operational budget"
  secondary:
    - name: tone_helpfulness
      definition: "LLM judge rating"
```
