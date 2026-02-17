---
name: agent-eval
description: Run agent evaluation cycle - experiment, analyze failures, document findings in Linear or markdown
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Task
  - Bash
  - Linear
arguments:
  - name: agent
    description: Agent name (must have config from agent-eval-setup)
    required: true
  - name: cycle
    description: Cycle number (auto-increments if not specified)
    required: false
  - name: quick
    description: Skip root cause analysis, just show results and failures
    required: false
  - name: output
    description: Force output destination (linear or local)
    required: false
---

# Agent Evaluation Cycle

Run evaluation, analyze failures, document findings and recommendations.

**Does NOT auto-apply fixes.** Documents everything, you decide what to fix.

---

## Prerequisites

Config from `/agent-eval-setup` at `.claude/agent-eval/{agent}.yaml`

---

## Phase 1: Run Experiment

Load config, invoke `langfuse-experiment-runner`:

1. Run agent on each dataset item
2. Apply judges, record scores
3. Identify failures (below threshold)

**Output:** Score summary, pass rate, failure list

---

## Phase 2: Failure Analysis

### Categorize Patterns

Group failures by:
- Failing dimension
- Input characteristics
- Output symptoms

Name each pattern, list affected items.

### Root Cause Investigation

For each pattern, use `langfuse-trace-analysis`:

1. Retrieve traces for 2-3 failed items
2. Find successful items with similar input
3. Compare traces, find divergence point
4. Identify root cause (prompt/tool/retrieval/logic)

**Output:** Patterns with root causes, affected components

---

## Phase 3: Generate Recommendations

For each root cause:
- Specific fix recommendation
- Location (file path or Langfuse prompt)
- Complexity estimate
- Expected impact

Prioritize by: items affected × expected impact / complexity

---

## Phase 4: Document

### Linear (if available)

Create project: `Agent Eval: {agent} - Cycle {N}`

Structure:
```
├── Findings (one issue per pattern)
├── Root Causes (linked to findings)
└── Recommendations (prioritized, linked to causes)
```

Each issue contains:
- What was found / what caused it / what to do
- Affected items and traces
- Links to related issues

### Local Markdown (fallback)

Write to `.claude/agent-eval/{agent}/reports/cycle-{N}.md`:

```markdown
# Evaluation: {agent} - Cycle {N}

## Summary
- Pass rate: X% (delta from previous)
- Patterns: N
- Recommendations: N

## Findings
[Pattern name, affected items, symptoms]

## Root Causes
[Analysis, divergence point, evidence]

## Recommendations
[Prioritized fixes with locations]

## Appendix
[Failed items, trace links]
```

---

## Output

Present summary:
- Results vs previous cycle
- Key findings
- Top recommendations
- Link to Linear project or report path

User reviews documentation, implements fixes, runs next cycle.

---

## Skills Used

| Skill | Purpose |
|-------|---------|
| `langfuse-experiment-runner` | Run experiment, apply judges |
| `langfuse-trace-analysis` | Investigate failures |
| `langfuse-data-retrieval` | Fetch traces |
| `langfuse-score-analytics` | Compare cycles |
