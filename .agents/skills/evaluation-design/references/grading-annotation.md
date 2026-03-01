# Grading & Annotation Strategy

Choose a grading strategy that balances **scale, reliability, and cost**.

## Grading Types

1. **Rule-based grading**
   - Best for structured outputs (JSON, routing, tool usage).
   - Deterministic and cheap.

2. **LLM-as-judge**
   - Best for open-ended or qualitative criteria.
   - Requires strong rubric and bias mitigation.

3. **Hybrid grading**
   - Combine rules for correctness + LLM for quality.
   - Often the most robust approach for agent workflows.

## Rubric Design

A rubric should include:
- A small number of criteria (2–5)
- Clear definitions of success/failure
- Explicit scoring scale (binary or 1–5)

Example:

```yaml
rubric:
  - criterion: routing_correctness
    description: "Ticket routed to correct team"
    scale: binary
  - criterion: response_quality
    description: "Clear, accurate, and complete"
    scale: 1-5
```

## Bias Mitigations for LLM Judges

- Randomize candidate order
- Use pairwise comparisons when possible
- Avoid leaking model identity
- Calibrate with periodic human review

## Annotation Plan

- Define a **gold set** (small, high-quality human labels)
- Use it to calibrate LLM judge agreement
- Set a minimum agreement target (e.g., 0.8)

## Decision Template

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
      prompt: "judge-routing-v1"
      bias_mitigations:
        - randomize_order
        - pairwise_comparison
  calibration:
    human_review_rate: 0.1
    agreement_target: 0.8
```
