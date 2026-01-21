---
name: optimization-loop
description: Layer 3 of the optimization framework. Execute the optimization loop using infrastructure from Layer 1 and target from Layer 2. Generates cloud-ready prompts with consistent output format for parallel execution and comparison.
version: 1.0.0
---

# Optimization Loop (Layer 3)

Execute optimization iterations using established infrastructure and defined target. This skill generates self-contained prompts for cloud-based coding agents.

**Requires:**
- Layer 1: Complete evaluation infrastructure
- Layer 2: Defined optimization target

**Produces:**
- Self-contained cloud prompt
- Consistent output format for cross-run comparison

---

## Input Requirements

### From Layer 1 (Evaluation Infrastructure)

```yaml
# What the loop needs from Layer 1:
evaluation_infrastructure:
  dataset:
    reference: "<how to access tasks>"
    size: <count>

  graders:
    - name: "<grader name>"
      reference: "<how to invoke>"
      metric: "<what it measures>"

  baseline:
    reference: "<baseline run ID or data>"
    metrics:
      <metric>: <value>
```

### From Layer 2 (Optimization Target)

```yaml
# What the loop needs from Layer 2:
optimization_target:
  goal:
    metric: "<metric to optimize>"
    current: <baseline value>
    target: <target value>

  constraints:
    hard:
      boundaries: [<what cannot change>]
      regressions: [<metrics that cannot get worse>]

  optimization_surface:
    main_knob:
      type: <config | prompt | grader | code>
      location: "<where>"
      details: <knob-specific info>
    frozen: [<what's off-limits>]
```

---

## The Iteration Protocol

```
FOR each iteration (1 to max_iterations):

  ┌─────────────────────────────────────────────────────────┐
  │ DIAGNOSE                                                │
  │ Analyze current failures against the goal               │
  │ → Input: baseline/previous results                      │
  │ → Output: prioritized failure patterns                  │
  └────────────────────────┬────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │ HYPOTHESIZE                                             │
  │ Propose ONE change to the main knob                     │
  │ → Verify change is within boundaries                    │
  │ → Predict expected impact                               │
  └────────────────────────┬────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │ EXPERIMENT                                              │
  │ Implement change, run evaluation                        │
  │ → Apply change to main knob                             │
  │ → Run all tasks through graders                         │
  │ → Compare to previous                                   │
  └────────────────────────┬────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │ COMPOUND                                                │
  │ Keep or rollback based on results                       │
  │ → Check constraint violations                           │
  │ → Keep if improved, rollback if regressed               │
  │ → Record learnings                                      │
  └────────────────────────┬────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │ DECIDE                                                  │
  │ Continue, graduate, or stop                             │
  │ → Target met? GRADUATE                                  │
  │ → Constraint violated? STOP                             │
  │ → No progress for 3 iterations? STOP                    │
  │ → Otherwise? CONTINUE                                   │
  └─────────────────────────────────────────────────────────┘
```

**Note:** No separate MEASURE phase - we use the existing baseline and measure after each change.

---

## Generating Cloud Prompts

### Step 1: Assemble Inputs

Gather from Layer 1 and Layer 2:
- Dataset access method
- Grader invocation method
- Baseline metrics
- Goal and target
- Constraints (boundaries, regressions)
- Main knob specification
- Frozen areas

### Step 2: Generate Prompt

Use template: `references/loop-prompt-template.md`

Substitute:
- `{{DATASET}}` - How to access evaluation tasks
- `{{GRADERS}}` - How to invoke graders
- `{{BASELINE}}` - Baseline metrics (already measured)
- `{{GOAL_METRIC}}` - What to improve
- `{{GOAL_TARGET}}` - Target value
- `{{CURRENT_VALUE}}` - Baseline value
- `{{HARD_BOUNDARIES}}` - What cannot change
- `{{REGRESSION_GUARDS}}` - Metrics that cannot regress
- `{{MAIN_KNOB}}` - What to adjust
- `{{FROZEN}}` - Off-limits areas
- `{{MAX_ITERATIONS}}` - Iteration limit

### Step 3: Output

Present the generated prompt with usage instructions.

---

## Output Format (Standard Across All Runs)

Every cloud run produces this format for comparability:

```
═══════════════════════════════════════════════════════════════
OPTIMIZATION RUN
═══════════════════════════════════════════════════════════════
Run ID: <unique identifier>
Environment: <model/platform>
Started: <timestamp>

Goal: {{GOAL_METRIC}} {{CURRENT_VALUE}} → {{GOAL_TARGET}}
Main knob: {{MAIN_KNOB_TYPE}} @ {{MAIN_KNOB_LOCATION}}
Max iterations: {{MAX_ITERATIONS}}

───────────────────────────────────────────────────────────────
ITERATION 1
───────────────────────────────────────────────────────────────

[DIAGNOSE]
Failures analyzed: <N>
Top patterns:
  1. <pattern> (<count>) - <root cause>
  2. <pattern> (<count>) - <root cause>

[HYPOTHESIZE]
Change: <specific change to main knob>
Boundary check: PASS | VIOLATION
Expected impact: {{GOAL_METRIC}} +<expected delta>
Reasoning: <why this should work>

[EXPERIMENT]
Change applied: <description>
Results:
  {{GOAL_METRIC}}: <previous> → <new> (<delta>)
  Regressions: [NONE | <list of violations>]

Verdict: VALIDATED | PARTIAL | INVALIDATED

[COMPOUND]
Decision: KEEP | ROLLBACK
Learnings: <insight>

[DECIDE]
Status: {{GOAL_METRIC}} = <value> (target: {{GOAL_TARGET}})
Constraints: PASS | VIOLATED
Trend: <improving | flat | declining>

Decision: CONTINUE | GRADUATE | STOP
───────────────────────────────────────────────────────────────

... (repeat for each iteration) ...

═══════════════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════════════
Outcome: GRADUATED | STOPPED (<reason>)
Iterations: <N>

Metrics:
  {{GOAL_METRIC}}: {{CURRENT_VALUE}} → <final> (target: {{GOAL_TARGET}})

Changes kept:
  1. <change> ({{GOAL_METRIC}} +<delta>)
  2. <change> ({{GOAL_METRIC}} +<delta>)

Final main knob state:
  <current state of the knob after all changes>

Key learnings:
  - <what worked>
  - <what didn't>
  - <pattern discovered>

Artifacts:
  - <modified files/configs>
═══════════════════════════════════════════════════════════════
```

---

## Parallel Execution

### Running Multiple Environments

1. Generate ONE prompt using this skill
2. Copy prompt to N cloud environments
3. Each runs independently
4. Compare FINAL REPORT sections
5. Merge best results

### Comparison Protocol

When comparing runs:

| Run | Final Metric | Iterations | Changes Kept |
|-----|--------------|------------|--------------|
| Env A | X | N | [list] |
| Env B | Y | M | [list] |
| ... | ... | ... | ... |

**Selection criteria:**
1. Highest final metric value
2. Fewest iterations (efficiency)
3. Most generalizable changes (not overfitted)

### Merging Results

From multiple runs:
1. Identify changes that worked across runs
2. Identify changes unique to one run
3. Test combined changes
4. Capture learnings from all runs

---

## Stop Conditions

| Condition | Action | Output |
|-----------|--------|--------|
| Target achieved | GRADUATE | Success report |
| Hard boundary violated | STOP immediately | Violation report |
| Regression detected | ROLLBACK + continue (or STOP if persistent) | Warning |
| 3 iterations no improvement | STOP | Plateau report |
| Max iterations reached | STOP | Progress report |

---

## Execution Modes

### Mode: Full Evaluation Each Iteration

Run ALL tasks after each change.

**Use when:**
- Small dataset (<50 tasks)
- High confidence needed
- Changes have broad impact

### Mode: Targeted Evaluation

Run only failed tasks + sample of passing tasks.

**Use when:**
- Large dataset (>100 tasks)
- Changes target specific failure patterns
- Need faster iteration

```yaml
execution_mode:
  type: full | targeted

  # For targeted:
  targeting:
    failed_tasks: all
    passing_sample: 20%  # Regression check
```

---

## Error Handling

### Recoverable Errors

| Error | Recovery |
|-------|----------|
| Single task fails to run | Skip, note in report |
| Grader timeout | Retry once, then skip |
| Change doesn't apply cleanly | Report, ask for guidance |

### Unrecoverable Errors

| Error | Action |
|-------|--------|
| Hard boundary violated | STOP immediately |
| All tasks fail | STOP, report infrastructure issue |
| Main knob inaccessible | STOP, report configuration issue |

---

---

## State Persistence: The Journal

All optimization progress is tracked in a journal at:
```
.claude/optimization-loops/<agent-name>/journal.yaml
```

The journal captures:
- **Layer 1 spec**: Evaluation infrastructure details
- **Layer 2 spec**: Optimization target and constraints
- **Layer 3 state**: Iteration history, learnings, best results

### Journal Benefits

1. **Resume anywhere**: Pick up exactly where you left off
2. **Full history**: Every hypothesis, experiment, result recorded
3. **Accumulated learnings**: What works/fails compounds over time
4. **Rollback reference**: Always know the best state to return to

### Two Execution Modes, Same Journal

| Mode | Command | Journal Usage |
|------|---------|---------------|
| **Local interactive** | `/optimize` | Read/write journal continuously |
| **Cloud execution** | `/cloud-optimize` | Export state to prompt, import results back |

For cloud execution:
1. Generate prompt with current journal state embedded
2. Run in cloud environment
3. Parse FINAL REPORT
4. Update journal with results

See `references/journal-schema.md` for full schema.

---

## References

- `references/loop-prompt-template.md` - The cloud prompt template
- `references/journal-schema.md` - Journal structure and operations
- `${PLUGIN_ROOT}/references/agent-eval-best-practices.md` - Evaluation best practices
