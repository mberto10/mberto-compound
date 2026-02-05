# Optimization Journal Schema

Journal path:
```
.claude/optimization-loops/<agent>/journal.yaml
```

Minimal shape:
```yaml
meta:
  agent_name: "<name>"
  started: "<YYYY-MM-DD>"
  target:
    metric: "<metric>"
    current: <value>
    goal: <value>
  baseline:
    dataset: "<dataset name>"
    run_name: "baseline"
    date: "<YYYY-MM-DD>"
    metrics:
      <metric>: <value>

current_phase: "hypothesize"
current_iteration: 0

iterations: []

learnings:
  what_works: []
  what_fails: []
  patterns_discovered: []
```

Notes:
- The journal is owned by the interactive loop (agentic-optimization-craft).
- The loop skill should read it for status, but only update with explicit user approval.
