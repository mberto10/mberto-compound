# Optimization Journal Schema

Persistent state for tracking optimization progress across sessions. The journal captures all three layers and iteration history.

---

## Journal Location

```
.claude/optimization-loops/<agent-name>/
├── journal.yaml           # Main state file
├── iterations/            # Detailed iteration records
│   ├── 001-<hypothesis-slug>.md
│   ├── 002-<hypothesis-slug>.md
│   └── ...
└── artifacts/             # Modified files, configs
    └── ...
```

---

## Journal Schema

```yaml
# .claude/optimization-loops/<agent-name>/journal.yaml

meta:
  agent_name: "<agent name>"
  created: "<timestamp>"
  last_updated: "<timestamp>"
  version: "2.0"  # Schema version

# ═══════════════════════════════════════════════════════════════
# LAYER 1: EVALUATION INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════
evaluation_infrastructure:
  status: COMPLETE | INCOMPLETE

  dataset:
    reference: "<path, URL, or Langfuse reference>"
    size: <number of tasks>
    categories:
      - name: "<category>"
        count: <n>
    last_validated: "<timestamp>"

  graders:
    - name: "<grader name>"
      type: code | model | human
      reference: "<path or location>"
      metric: "<what it measures>"
      calibration:
        status: calibrated | needs_calibration
        last_calibrated: "<timestamp>"
        human_correlation: <0-1 if measured>

  harness:
    type: langfuse | custom | script
    reference: "<path or location>"

  baseline:
    run_id: "<identifier>"
    date: "<timestamp>"
    metrics:
      <metric_name>: <value>
      <metric_name>: <value>

# ═══════════════════════════════════════════════════════════════
# LAYER 2: OPTIMIZATION TARGET
# ═══════════════════════════════════════════════════════════════
optimization_target:
  goal:
    metric: "<metric to optimize>"
    baseline: <starting value>
    current: <current value>
    target: <target value>
    direction: maximize | minimize

  constraints:
    hard:
      boundaries:
        - path: "<frozen path>"
          reason: "<why frozen>"
      regressions:
        - metric: "<metric>"
          threshold: <minimum value>
          current: <current value>
      invariants:
        - condition: "<must always be true>"

    soft:
      - preference: "<preference>"
        weight: <0-1>

  optimization_surface:
    main_knob:
      type: config | prompt | grader | code
      location: "<path>"
      description: "<what's being adjusted>"
      current_state: "<current value or hash>"

    frozen:
      - path: "<off-limits path>"
        reason: "<reason>"

# ═══════════════════════════════════════════════════════════════
# LAYER 3: OPTIMIZATION LOOP STATE
# ═══════════════════════════════════════════════════════════════
loop_state:
  status: NOT_STARTED | IN_PROGRESS | GRADUATED | STOPPED
  stop_reason: "<if stopped, why>"

  current_iteration: <N>
  max_iterations: <limit>

  best_iteration:
    id: <iteration number>
    metric_value: <best achieved>
    main_knob_state: "<snapshot of knob at best>"

# ═══════════════════════════════════════════════════════════════
# ITERATION HISTORY
# ═══════════════════════════════════════════════════════════════
iterations:
  - id: 1
    started: "<timestamp>"
    completed: "<timestamp>"

    diagnosis:
      failures_analyzed: <N>
      top_patterns:
        - pattern: "<pattern name>"
          count: <N>
          root_cause: "<cause>"
      priority_pattern: "<selected pattern>"

    hypothesis:
      statement: "<IF... THEN... BECAUSE...>"
      target_pattern: "<pattern being addressed>"
      expected_impact: "<+X to metric>"
      change:
        location: "<specific location>"
        modification: "<exact change>"
      boundary_check: PASS | VIOLATION

    experiment:
      change_applied: "<description>"
      results:
        <metric>: <value>
      delta:
        <metric>: <+/- change>
      verdict: VALIDATED | PARTIAL | INVALIDATED

    compound:
      decision: KEEP | ROLLBACK
      reason: "<explanation>"
      main_knob_state: "<state after decision>"

    decide:
      decision: CONTINUE | GRADUATE | STOP
      reason: "<explanation>"

  - id: 2
    # ... next iteration

# ═══════════════════════════════════════════════════════════════
# ACCUMULATED LEARNINGS
# ═══════════════════════════════════════════════════════════════
learnings:
  what_works:
    - insight: "<what worked>"
      iteration: <when discovered>
      impact: "<quantified if possible>"

  what_fails:
    - insight: "<what didn't work>"
      iteration: <when discovered>
      reason: "<why it failed>"

  patterns_discovered:
    - pattern: "<pattern name>"
      description: "<what we learned>"
      iteration: <when discovered>

  parameter_effects:
    # For config optimization - track what parameters affect what
    - parameter: "<param name>"
      affects: "<metric or behavior>"
      direction: "<increase/decrease leads to...>"

# ═══════════════════════════════════════════════════════════════
# DATASET EVOLUTION
# ═══════════════════════════════════════════════════════════════
dataset_history:
  - iteration: 0
    action: "initial"
    items_count: <N>

  - iteration: <N>
    action: "added_failures"
    items_added: <N>
    patterns_covered:
      - "<pattern>"

# ═══════════════════════════════════════════════════════════════
# GRADER EVOLUTION
# ═══════════════════════════════════════════════════════════════
grader_history:
  - iteration: <N>
    grader: "<grader name>"
    action: "calibrated | refined | created"
    changes: "<what changed>"
```

---

## Iteration Detail Files

For complex iterations, store detailed records:

```markdown
# iterations/001-tool-guidance.md

## Iteration 1: Add Tool Guidance

**Date:** 2024-01-15
**Duration:** 45 minutes

### Diagnosis

Analyzed 15 failing tasks. Top patterns:

| Pattern | Count | Root Cause |
|---------|-------|------------|
| Tool not used | 8 | No explicit instruction to use calculator |
| Wrong tool | 4 | Confused between search and lookup |
| Tool error ignored | 3 | Didn't handle tool failures |

**Priority:** "Tool not used" - 53% of failures

### Hypothesis

**Statement:**
IF we add explicit tool selection guidance in the system prompt
THEN accuracy will improve by ~15%
BECAUSE 53% of failures are from not using available tools

**Change:**
- Location: `prompts/system.md`
- Section: "Tool Usage"
- Addition:
  ```
  When you encounter a calculation, ALWAYS use the calculator tool.
  Do not attempt mental math for numbers > 10.
  ```

### Experiment

**Results:**

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| accuracy | 0.72 | 0.81 | +0.09 |
| latency | 2.1s | 2.3s | +0.2s |

**Verdict:** VALIDATED (+9% vs expected +15%, but significant)

### Compound

**Decision:** KEEP

**Learnings:**
- Explicit tool guidance works
- Slight latency increase acceptable
- Still have "wrong tool" failures to address

### Artifacts

- Modified: `prompts/system.md` (see git diff)
- Added to dataset: 3 new tool-use edge cases
```

---

## Journal Operations

### Initialize Journal

When starting new optimization:

```yaml
# Create with Layer 1 + Layer 2 populated, Layer 3 empty
loop_state:
  status: NOT_STARTED
  current_iteration: 0
iterations: []
learnings:
  what_works: []
  what_fails: []
  patterns_discovered: []
```

### Resume from Journal

When continuing:

1. Read `loop_state.status`
2. If `IN_PROGRESS`:
   - Get `current_iteration`
   - Check last iteration's completion status
   - Resume from incomplete phase
3. Load `learnings` for context
4. Load `best_iteration` for rollback reference

### Update Journal

After each phase:

```python
# Pseudo-code
def update_journal(journal, phase, data):
    iteration = journal.iterations[journal.loop_state.current_iteration]

    if phase == "diagnosis":
        iteration.diagnosis = data
    elif phase == "hypothesis":
        iteration.hypothesis = data
    elif phase == "experiment":
        iteration.experiment = data
    elif phase == "compound":
        iteration.compound = data
        if data.decision == "KEEP" and better_than_best(data):
            journal.loop_state.best_iteration = current_iteration
    elif phase == "decide":
        iteration.decide = data
        if data.decision == "CONTINUE":
            journal.loop_state.current_iteration += 1
            journal.iterations.append(new_iteration())
        elif data.decision == "GRADUATE":
            journal.loop_state.status = "GRADUATED"
        elif data.decision == "STOP":
            journal.loop_state.status = "STOPPED"
            journal.loop_state.stop_reason = data.reason

    journal.meta.last_updated = now()
    write_journal(journal)
```

### Export for Cloud

When generating cloud prompt, serialize relevant state:

```yaml
# Include in cloud prompt:
baseline_metrics:
  <metric>: <value>

previous_learnings:
  - "<insight>"

best_known_state:
  iteration: <N>
  metric: <value>
  knob_state: "<state>"
```

---

## State Recovery

If optimization is interrupted:

| Journal State | Recovery |
|---------------|----------|
| `iterations[-1].diagnosis` empty | Start diagnosis |
| `iterations[-1].hypothesis` empty | Start hypothesis |
| `iterations[-1].experiment` empty | Implement and run |
| `iterations[-1].compound` empty | Make keep/rollback decision |
| `iterations[-1].decide` empty | Make continue/graduate/stop decision |
| All filled, status IN_PROGRESS | Start next iteration |

---

## Querying the Journal

### Progress Summary

```
Optimization: <agent_name>
Status: <status>
Iterations: <current>/<max>
Goal: <metric> <baseline> → <current> (target: <target>)
Best: <best_value> at iteration <best_iteration>

Recent:
  Iter <N>: <hypothesis summary> → <verdict>
  Iter <N-1>: <hypothesis summary> → <verdict>
```

### Learnings Export

```
What works for <agent_name>:
- <insight> (iter <N>)
- <insight> (iter <N>)

What doesn't work:
- <insight> (iter <N>)

Patterns discovered:
- <pattern>
```
