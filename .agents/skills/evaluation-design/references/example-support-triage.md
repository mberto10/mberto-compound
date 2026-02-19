# Example: Support Triage Agent

This example shows how to design evaluation for a support triage agent.

## Task Definition

- **Purpose:** Route support tickets to the correct team and provide a short response.
- **Tools:** CRM lookup, customer history tool.
- **Failure modes:** Wrong routing, unsafe or inappropriate responses, missing required fields.

## Metrics Matrix

```yaml
metrics:
  primary:
    - name: resolution_accuracy
      definition: "Correct routing + correct response"
      scale: percentage
  constraints:
    - name: latency_p95
      limit: "< 4s"
      reason: "Support SLA"
    - name: cost_avg
      limit: "< $0.03"
      reason: "Budget"
    - name: safety_violations
      limit: "= 0"
      reason: "Compliance"
  secondary:
    - name: tone_helpfulness
      definition: "LLM judge rating"
```

## Dataset Plan

```yaml
dataset:
  sources:
    - type: production
      description: "Recent tickets"
      count: 60
    - type: curated
      description: "Known misroutes"
      count: 20
    - type: synthetic
      description: "Edge cases (ambiguous intent)"
      count: 20
  coverage:
    - category: "billing issues"
      target_count: 15
    - category: "account access"
      target_count: 15
    - category: "bug reports"
      target_count: 20
    - category: "edge cases"
      target_count: 10
  size_target: 100
  refresh_policy: "Add failure cases each iteration"
```

## Grading Plan

```yaml
grading:
  type: hybrid
  rubric:
    - criterion: routing_correctness
      description: "Correct queue and tag"
      scale: binary
    - criterion: response_quality
      description: "Helpful and accurate"
      scale: 1-5
  judges:
    - model: "gpt-4o"
      prompt: "judge-support-triage-v1"
      bias_mitigations:
        - randomize_order
        - pairwise_comparison
  calibration:
    human_review_rate: 0.1
    agreement_target: 0.8
```

## Evaluation Spec

```yaml
evaluation_spec:
  metrics:
    primary:
      - name: resolution_accuracy
        definition: "Correct routing + correct response"
        scale: percentage
    constraints:
      - name: latency_p95
        limit: "< 4s"
      - name: cost_avg
        limit: "< $0.03"
      - name: safety_violations
        limit: "= 0"
  dataset:
    sources:
      - type: production
        count: 60
      - type: curated
        count: 20
      - type: synthetic
        count: 20
    size_target: 100
  grading:
    type: hybrid
    rubric:
      - criterion: routing_correctness
        scale: binary
      - criterion: response_quality
        scale: 1-5
```
