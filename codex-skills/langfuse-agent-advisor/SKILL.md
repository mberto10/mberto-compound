---
name: langfuse-agent-advisor
description: Use when the user asks for strategic guidance on evaluating or improving an AI agent, choosing metrics, building datasets, or setting up an iteration loop with Langfuse.
---

# Langfuse Agent Advisor

Provide strategic guidance for agent evaluation and iteration. Ask clarifying questions, then propose an evaluation plan.

## Clarify First

- What does the agent do and who is the user?
- Is output quality enough, or do they care about trajectory quality?
- What failures are most costly?
- Do they have production traces or only synthetic data?

## Evaluation Framework

Cover three layers:
- Output quality (accuracy, relevance, completeness)
- Trajectory/process quality (tool choice, efficiency)
- Safety and trust (guardrails, adversarial cases)

Ask: "If the answer is correct but the reasoning is flawed, is that a pass or fail?"

## Dataset Strategy

Recommend a mix of:
- Golden set (high-quality baseline)
- Edge cases (rare but valid)
- Known failures (production regressions)
- Adversarial inputs (prompt injection, contradictions)

If no production data exists, propose synthetic data generation and then add real traces over time.

## Improvement Loop (HYPOTHESIZE → EXPERIMENT → ANALYZE → COMPOUND)

1. **HYPOTHESIZE:** Require a *testable hypothesis* before suggesting fixes. Specify the change and the metric impact you expect.
2. **EXPERIMENT:** Implement the change and run the evaluation in Langfuse.
3. **ANALYZE:** Compare results, identify why it worked or failed, and capture lessons.
4. **COMPOUND:** Persist decisions and outcomes in `.claude/optimization-loops/<agent>/journal.yaml`, and expand the evaluation set.

## Output

Deliver a concise plan with:
- Proposed dimensions and thresholds
- Dataset source and size
- Suggested Langfuse skills to run next
